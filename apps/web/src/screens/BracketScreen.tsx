import { useEffect, useState, useCallback } from "react";
import { ArrowLeft, Copy, Check, Play, UserPlus, UserMinus } from "lucide-react";
import { supabase } from "../lib/supabaseClient.ts";
import { BracketCanvas } from "../components/tournament/BracketCanvas.tsx";
import { MatchDetailPanel } from "../components/tournament/MatchDetailPanel.tsx";
import type { Tournament, Database, TournamentGameConfig } from "@nlc-darts/tournament";
import { Status } from "@nlc-darts/tournament";

interface RegisteredPlayer {
  id: string;
  name: string;
}

interface BracketScreenProps {
  tournamentId: string;
  isOnline: boolean;
  userId: string;
  onBack: () => void;
  tournamentRoom: {
    connected: boolean;
    bracketData: Database | null;
    registrationUpdate: { tournamentId: string; participantCount: number; participants: Array<{ id: string; name: string }> } | null;
    matchReadyState: { matchId: number; readyPlayerIds: string[]; opponentName: string | null } | null;
    matchCountdown: { matchId: number; secondsLeft: number } | null;
    error: string | null;
    connect: () => Promise<void>;
    disconnect: () => void;
    startTournament: (tournamentId: string, userId: string) => void;
    registerPlayer: (tournamentId: string, userId: string) => void;
    unregisterPlayer: (tournamentId: string, userId: string) => void;
    readyForMatch: (matchId: number, userId: string) => void;
    unreadyForMatch: (matchId: number, userId: string) => void;
    recordResult: (matchId: number, opponent1Score: number, opponent2Score: number) => void;
  };
  onMatchStart?: (data: {
    matchId: number;
    playerNames: string[];
    playerIds: string[];
    gameSettings: TournamentGameConfig;
  }) => void;
}

export function BracketScreen({
  tournamentId,
  isOnline: _isOnline,
  userId,
  onBack,
  tournamentRoom,
}: BracketScreenProps) {
  void _isOnline; // kept in props for future use
  const [tournament, setTournament] = useState<Tournament | null>(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const [participants, setParticipants] = useState<RegisteredPlayer[]>([]);
  const [isRegistered, setIsRegistered] = useState(false);
  const [localBracketData, setLocalBracketData] = useState<Database | null>(null);
  const [selectedMatchId, setSelectedMatchId] = useState<number | null>(null);

  // Manual score entry modal (organiser override)
  const [manualResultModal, setManualResultModal] = useState<{ matchId: number } | null>(null);
  const [score1, setScore1] = useState("");
  const [score2, setScore2] = useState("");

  const room = tournamentRoom;

  const fetchParticipants = useCallback(async () => {
    const { data: registrations } = await supabase
      .from("tournament_registrations")
      .select("user_id")
      .eq("tournament_id", tournamentId);

    if (!registrations || registrations.length === 0) {
      setParticipants([]);
      setIsRegistered(false);
      return;
    }

    const userIds = registrations.map(
      (r: { user_id: string }) => r.user_id,
    );
    setIsRegistered(userIds.includes(userId));

    const { data: players } = await supabase
      .from("online_players")
      .select("id, display_name")
      .in("id", userIds);

    setParticipants(
      (players ?? []).map((p: { id: string; display_name: string }) => ({
        id: p.id,
        name: p.display_name,
      })),
    );
  }, [tournamentId, userId]);

  // Fetch tournament details + participants
  useEffect(() => {
    (async () => {
      const { data } = await supabase
        .from("tournaments")
        .select("*")
        .eq("id", tournamentId)
        .single();

      if (data) {
        setTournament({
          id: data.id,
          name: data.name,
          format: data.format,
          visibility: data.visibility,
          status: data.status,
          joinCode: data.join_code,
          createdBy: data.created_by,
          scheduledAt: data.scheduled_at,
          registrationDeadline: data.registration_deadline,
          maxParticipants: data.max_participants,
          createdAt: data.created_at,
          gameSettings: data.game_settings ?? null,
        });

        // Fetch bracket data from Supabase for in-progress/completed tournaments
        if (data.status === "in_progress" || data.status === "completed") {
          const [stages, groups, rounds, matches, matchGames, participantsData] =
            await Promise.all([
              supabase.from("tournament_stages").select("*").eq("tournament_id", data.id),
              supabase.from("tournament_groups").select("*"),
              supabase.from("tournament_rounds").select("*"),
              supabase.from("tournament_matches").select("*"),
              supabase.from("tournament_match_games").select("*"),
              supabase.from("tournament_participants").select("*").eq("tournament_id", data.id),
            ]);

          // Filter groups/rounds/matches to only those belonging to this tournament's stages
          const stageIds = new Set(
            (stages.data ?? []).map((s: { id: number }) => s.id),
          );
          const filteredGroups = (groups.data ?? []).filter(
            (g: { stage_id: number }) => stageIds.has(g.stage_id),
          );
          const groupIds = new Set(
            filteredGroups.map((g: { id: number }) => g.id),
          );
          const filteredRounds = (rounds.data ?? []).filter(
            (r: { group_id: number }) => groupIds.has(r.group_id),
          );
          const filteredMatches = (matches.data ?? []).filter(
            (m: { group_id: number }) => groupIds.has(m.group_id),
          );
          const matchIds = new Set(
            filteredMatches.map((m: { id: number }) => m.id),
          );
          const filteredMatchGames = (matchGames.data ?? []).filter(
            (mg: { parent_id: number }) => matchIds.has(mg.parent_id),
          );

          setLocalBracketData({
            participant: participantsData.data ?? [],
            stage: stages.data ?? [],
            group: filteredGroups,
            round: filteredRounds,
            match: filteredMatches,
            match_game: filteredMatchGames,
          } as Database);
        }
      }
      await fetchParticipants();
      setLoading(false);
    })();
  }, [tournamentId, fetchParticipants]);

  // Update participants when Colyseus sends registration updates
  useEffect(() => {
    if (room.registrationUpdate) {
      setParticipants(room.registrationUpdate.participants);
      setIsRegistered(
        room.registrationUpdate.participants.some((p) => p.id === userId),
      );
    }
  }, [room.registrationUpdate, userId]);

  // When bracket data arrives, the tournament has started — update local status
  useEffect(() => {
    if (room.bracketData && tournament?.status === "registration") {
      setTournament((t) => (t ? { ...t, status: "in_progress" } : t));
    }
  }, [room.bracketData, tournament?.status]);

  const isOrganiser = tournament?.createdBy === userId;
  const isRegistration = tournament?.status === "registration";
  const isInProgress = tournament?.status === "in_progress";
  const isComplete = tournament?.status === "completed";

  const handleCopyCode = () => {
    if (tournament?.joinCode) {
      navigator.clipboard.writeText(tournament.joinCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleStartTournament = () => {
    if (tournament && userId) {
      room.startTournament(tournament.id, userId);
    }
  };

  const bd = room.bracketData ?? localBracketData;

  const handleMatchTap = (matchId: number) => {
    if (!isInProgress) return;
    const match = bd?.match.find(
      (m) => (m.id as number) === matchId,
    );
    if (!match || match.status >= Status.Completed) return;
    setSelectedMatchId(matchId);
  };

  const handleManualSubmitResult = () => {
    if (!manualResultModal || !score1 || !score2) return;
    room.recordResult(
      manualResultModal.matchId,
      parseInt(score1, 10),
      parseInt(score2, 10),
    );
    setManualResultModal(null);
  };

  // Get match details for selected match
  const selectedMatch = selectedMatchId != null
    ? bd?.match.find((m) => (m.id as number) === selectedMatchId)
    : null;

  // Resolve participant names and user IDs for the selected match
  let p1Name: string | null = null;
  let p2Name: string | null = null;
  let p1UserId: string | null = null;
  let p2UserId: string | null = null;

  if (selectedMatch && bd) {
    const p1 = selectedMatch.opponent1?.id != null
      ? bd.participant.find((p) => p.id === selectedMatch.opponent1!.id)
      : null;
    const p2 = selectedMatch.opponent2?.id != null
      ? bd.participant.find((p) => p.id === selectedMatch.opponent2!.id)
      : null;
    p1Name = p1?.name ?? null;
    p2Name = p2?.name ?? null;

    // Map participant names back to user IDs via the participants list (from registration)
    if (p1Name) {
      const found = participants.find((reg) => reg.name === p1Name);
      p1UserId = found?.id ?? null;
    }
    if (p2Name) {
      const found = participants.find((reg) => reg.name === p2Name);
      p2UserId = found?.id ?? null;
    }
  }

  // Ready state for selected match
  const matchReadyForSelected =
    room.matchReadyState && selectedMatchId != null && room.matchReadyState.matchId === selectedMatchId
      ? room.matchReadyState
      : null;

  const matchCountdownForSelected =
    room.matchCountdown && selectedMatchId != null && room.matchCountdown.matchId === selectedMatchId
      ? room.matchCountdown
      : null;

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center bg-black text-zinc-500">
        Loading...
      </div>
    );
  }

  if (!tournament) {
    return (
      <div className="h-full flex flex-col items-center justify-center bg-black text-white gap-4">
        <p className="text-zinc-500">Tournament not found</p>
        <button onClick={onBack} className="text-amber-500 underline">
          Go back
        </button>
      </div>
    );
  }

  const STATUS_LABELS: Record<string, string> = {
    registration: "Registration Open",
    in_progress: "In Progress",
    completed: "Completed",
    cancelled: "Cancelled",
  };

  const STATUS_COLORS: Record<string, string> = {
    registration: "#60a5fa",
    in_progress: "#f59e0b",
    completed: "#4ade80",
    cancelled: "#6b7280",
  };

  return (
    <div className="h-full flex flex-col bg-black text-white">
      {/* Header */}
      <div className="flex items-center justify-between px-6 pt-6 pb-3 shrink-0">
        <div className="flex items-center gap-4">
          <button
            onClick={onBack}
            className="p-2 rounded-xl bg-zinc-900 border border-zinc-800"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-lg font-bold">{tournament.name}</h1>
            <span
              className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-full"
              style={{
                backgroundColor: `${STATUS_COLORS[tournament.status]}20`,
                color: STATUS_COLORS[tournament.status],
              }}
            >
              {STATUS_LABELS[tournament.status]}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Join code */}
          <button
            onClick={handleCopyCode}
            className="flex items-center gap-2 px-3 py-2 rounded-xl bg-zinc-900 border border-zinc-800 text-sm font-mono"
          >
            {tournament.joinCode}
            {copied ? (
              <Check className="w-4 h-4 text-green-400" />
            ) : (
              <Copy className="w-4 h-4 text-zinc-500" />
            )}
          </button>

          {/* Start button (organiser only) */}
          {isOrganiser && isRegistration && (
            <button
              onClick={handleStartTournament}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-green-600 text-white text-sm font-bold hover:bg-green-500"
            >
              <Play className="w-4 h-4" /> Start
            </button>
          )}
        </div>
      </div>

      {/* Registration info */}
      {isRegistration && (
        <div className="px-6 pb-3 shrink-0">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm text-zinc-400">
              {participants.length} player
              {participants.length !== 1 ? "s" : ""} registered
              {tournament.maxParticipants
                ? ` / ${tournament.maxParticipants} max`
                : ""}
            </p>
            {!isOrganiser && (
              <button
                onClick={async () => {
                  if (isRegistered) {
                    await supabase
                      .from("tournament_registrations")
                      .delete()
                      .eq("tournament_id", tournamentId)
                      .eq("user_id", userId);
                  } else {
                    await supabase
                      .from("tournament_registrations")
                      .upsert(
                        { tournament_id: tournamentId, user_id: userId },
                        { onConflict: "tournament_id,user_id" },
                      );
                  }
                  await fetchParticipants();
                }}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${
                  isRegistered
                    ? "bg-red-900/40 text-red-400 border border-red-800"
                    : "bg-green-900/40 text-green-400 border border-green-800"
                }`}
              >
                {isRegistered ? (
                  <>
                    <UserMinus className="w-3.5 h-3.5" /> Unregister
                  </>
                ) : (
                  <>
                    <UserPlus className="w-3.5 h-3.5" /> Register
                  </>
                )}
              </button>
            )}
          </div>
          <div className="flex flex-wrap gap-2">
            {participants.map((p) => (
              <span
                key={p.id}
                className={`px-3 py-1 rounded-full border text-xs font-medium ${
                  p.id === userId
                    ? "bg-amber-900/30 border-amber-700 text-amber-300"
                    : "bg-zinc-900 border-zinc-800 text-zinc-300"
                }`}
              >
                {p.name}
                {p.id === tournament.createdBy && (
                  <span className="ml-1 text-zinc-500">(host)</span>
                )}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Bracket canvas */}
      <div className="flex-1 min-h-0">
        {(isInProgress || isComplete) && (room.bracketData || localBracketData) ? (
          <BracketCanvas
            matches={(room.bracketData ?? localBracketData)!.match}
            participants={(room.bracketData ?? localBracketData)!.participant}
            rounds={(room.bracketData ?? localBracketData)!.round}
            groups={(room.bracketData ?? localBracketData)!.group}
            onMatchTap={handleMatchTap}
          />
        ) : isRegistration ? (
          <div className="h-full flex items-center justify-center text-zinc-600 text-lg">
            Bracket will appear when the tournament starts
          </div>
        ) : (
          <div className="h-full flex items-center justify-center text-zinc-600">
            No bracket data available
          </div>
        )}
      </div>

      {/* Error display */}
      {room.error && (
        <div className="px-6 py-2 bg-red-900/30 border-t border-red-800 text-red-400 text-sm shrink-0">
          {room.error}
        </div>
      )}

      {/* Match detail panel */}
      {selectedMatchId != null && selectedMatch && (
        <MatchDetailPanel
          matchId={selectedMatchId}
          player1Name={p1Name}
          player2Name={p2Name}
          userId={userId}
          player1Id={p1UserId}
          player2Id={p2UserId}
          gameSettings={tournament.gameSettings}
          readyState={matchReadyForSelected}
          countdown={matchCountdownForSelected}
          onReady={() => room.readyForMatch(selectedMatchId, userId)}
          onUnready={() => room.unreadyForMatch(selectedMatchId, userId)}
          onClose={() => setSelectedMatchId(null)}
        />
      )}

      {/* Organiser manual score override */}
      {isOrganiser && selectedMatchId != null && selectedMatch && (
        <div className="fixed bottom-4 right-4 z-[60]">
          <button
            onClick={() => {
              setManualResultModal({ matchId: selectedMatchId });
              setScore1("");
              setScore2("");
            }}
            className="text-xs text-zinc-600 underline"
          >
            Manual Score
          </button>
        </div>
      )}

      {/* Manual result entry modal (organiser) */}
      {manualResultModal && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/80">
          <div className="bg-zinc-900 rounded-2xl p-6 w-80 border border-zinc-700">
            <h2 className="text-lg font-bold mb-4">Enter Result</h2>
            <div className="space-y-3">
              <div>
                <label className="text-xs text-zinc-500 block mb-1">
                  Player 1 Score
                </label>
                <input
                  type="number"
                  value={score1}
                  onChange={(e) => setScore1(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl bg-zinc-800 border border-zinc-700 text-lg text-center focus:outline-none focus:border-amber-500"
                  min={0}
                  autoFocus
                />
              </div>
              <div>
                <label className="text-xs text-zinc-500 block mb-1">
                  Player 2 Score
                </label>
                <input
                  type="number"
                  value={score2}
                  onChange={(e) => setScore2(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl bg-zinc-800 border border-zinc-700 text-lg text-center focus:outline-none focus:border-amber-500"
                  min={0}
                />
              </div>
            </div>
            <div className="flex gap-2 mt-4">
              <button
                onClick={() => setManualResultModal(null)}
                className="flex-1 px-4 py-2 rounded-xl bg-zinc-800 text-sm font-medium"
              >
                Cancel
              </button>
              <button
                onClick={handleManualSubmitResult}
                disabled={!score1 || !score2 || score1 === score2}
                className="flex-1 px-4 py-2 rounded-xl bg-amber-600 text-black text-sm font-bold disabled:opacity-50"
              >
                Submit
              </button>
            </div>
            {score1 && score2 && score1 === score2 && (
              <p className="text-amber-400 text-xs mt-2 text-center">
                Scores cannot be equal
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
