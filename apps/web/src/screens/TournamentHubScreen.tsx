import { useState } from "react";
import { ArrowLeft, Plus, Search, Hash } from "lucide-react";
import {
  useDiscoverTournaments,
  findTournamentByCode,
  registerForTournament,
} from "../hooks/useDiscoverTournaments.ts";
import { useMyTournaments } from "../hooks/useMyTournaments.ts";
import type { Tournament, TournamentFormat } from "@nlc-darts/tournament";
import { TOURNAMENT_FORMATS } from "@nlc-darts/tournament";

const FORMAT_LABELS: Record<TournamentFormat, string> = {
  single_elimination: "Single Elim",
  double_elimination: "Double Elim",
  round_robin: "Round Robin",
};

const FORMAT_COLORS: Record<TournamentFormat, string> = {
  single_elimination: "#ef4444",
  double_elimination: "#f59e0b",
  round_robin: "#4ade80",
};

const STATUS_COLORS: Record<string, string> = {
  registration: "#60a5fa",
  in_progress: "#f59e0b",
  completed: "#4ade80",
  cancelled: "#6b7280",
};

interface TournamentHubScreenProps {
  onBack: () => void;
  onCreate: () => void;
  onViewBracket: (tournamentId: string) => void;
  userId: string;
}

export function TournamentHubScreen({
  onBack,
  onCreate,
  onViewBracket,
  userId,
}: TournamentHubScreenProps) {
  const [tab, setTab] = useState<"discover" | "mine">("discover");
  const [joinCodeModal, setJoinCodeModal] = useState(false);
  const [joinCode, setJoinCode] = useState("");
  const [joinError, setJoinError] = useState<string | null>(null);
  const [joining, setJoining] = useState(false);

  const discover = useDiscoverTournaments();
  const mine = useMyTournaments(userId);

  const handleJoinByCode = async () => {
    if (joinCode.length !== 6) return;
    setJoining(true);
    setJoinError(null);

    const tournament = await findTournamentByCode(joinCode);
    if (!tournament) {
      setJoinError("Tournament not found");
      setJoining(false);
      return;
    }

    const ok = await registerForTournament(tournament.id, userId);
    if (!ok) {
      setJoinError("Failed to register");
      setJoining(false);
      return;
    }

    setJoinCodeModal(false);
    setJoinCode("");
    setJoining(false);
    onViewBracket(tournament.id);
  };

  return (
    <div className="h-full flex flex-col bg-black text-white">
      {/* Header */}
      <div className="flex items-center justify-between px-6 pt-6 pb-4">
        <div className="flex items-center gap-4">
          <button
            onClick={onBack}
            className="p-2 rounded-xl bg-zinc-900 border border-zinc-800"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1
            className="text-2xl tracking-tight"
            style={{
              fontFamily: "Beon, sans-serif",
              color: "#f59e0b",
              textShadow: "0 0 20px #f59e0b",
            }}
          >
            Tournaments
          </h1>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setJoinCodeModal(true)}
            className="px-4 py-2 rounded-xl bg-zinc-900 border border-zinc-800 text-sm font-medium flex items-center gap-2 hover:border-zinc-600"
          >
            <Hash className="w-4 h-4" /> Join by Code
          </button>
          <button
            onClick={onCreate}
            className="px-4 py-2 rounded-xl bg-amber-600 text-black text-sm font-bold flex items-center gap-2 hover:bg-amber-500"
          >
            <Plus className="w-4 h-4" /> Create
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 px-6 mb-4">
        {(["discover", "mine"] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-4 py-2 rounded-lg text-sm font-bold transition-colors ${
              tab === t
                ? "bg-zinc-800 text-white"
                : "text-zinc-500 hover:text-zinc-300"
            }`}
          >
            {t === "discover" ? "Discover" : "My Tournaments"}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto px-6 pb-6">
        {tab === "discover" && (
          <DiscoverTab {...discover} onViewBracket={onViewBracket} />
        )}
        {tab === "mine" && (
          <MyTournamentsTab {...mine} onViewBracket={onViewBracket} />
        )}
      </div>

      {/* Join by Code Modal */}
      {joinCodeModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80">
          <div className="bg-zinc-900 rounded-2xl p-6 w-80 border border-zinc-700">
            <h2 className="text-lg font-bold mb-4">Join by Code</h2>
            <input
              type="text"
              value={joinCode}
              onChange={(e) =>
                setJoinCode(e.target.value.toUpperCase().slice(0, 6))
              }
              placeholder="ABCDEF"
              className="w-full px-4 py-3 rounded-xl bg-zinc-800 border border-zinc-700 text-center text-2xl tracking-[0.5em] font-mono placeholder:tracking-[0.3em] placeholder:text-zinc-600 focus:outline-none focus:border-amber-500"
              maxLength={6}
              autoFocus
            />
            {joinError && (
              <p className="text-red-400 text-sm mt-2">{joinError}</p>
            )}
            <div className="flex gap-2 mt-4">
              <button
                onClick={() => {
                  setJoinCodeModal(false);
                  setJoinCode("");
                  setJoinError(null);
                }}
                className="flex-1 px-4 py-2 rounded-xl bg-zinc-800 text-sm font-medium"
              >
                Cancel
              </button>
              <button
                onClick={handleJoinByCode}
                disabled={joinCode.length !== 6 || joining}
                className="flex-1 px-4 py-2 rounded-xl bg-amber-600 text-black text-sm font-bold disabled:opacity-50"
              >
                {joining ? "Joining..." : "Join"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Discover Tab ────────────────────────────────────────────────────────────

function DiscoverTab({
  tournaments,
  loading,
  hasMore,
  filters,
  setFilters,
  loadMore,
  onViewBracket,
}: ReturnType<typeof useDiscoverTournaments> & {
  onViewBracket: (id: string) => void;
}) {
  return (
    <div>
      {/* Search + filters */}
      <div className="flex gap-2 mb-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
          <input
            type="text"
            value={filters.search ?? ""}
            onChange={(e) =>
              setFilters({ ...filters, search: e.target.value || undefined })
            }
            placeholder="Search tournaments..."
            className="w-full pl-10 pr-4 py-2 rounded-xl bg-zinc-900 border border-zinc-800 text-sm focus:outline-none focus:border-zinc-600"
          />
        </div>
        <select
          value={filters.format ?? ""}
          onChange={(e) =>
            setFilters({
              ...filters,
              format: (e.target.value as TournamentFormat) || undefined,
            })
          }
          className="px-3 py-2 rounded-xl bg-zinc-900 border border-zinc-800 text-sm"
        >
          <option value="">All formats</option>
          {TOURNAMENT_FORMATS.map((f) => (
            <option key={f} value={f}>
              {FORMAT_LABELS[f]}
            </option>
          ))}
        </select>
      </div>

      {/* Tournament list */}
      <div className="space-y-2">
        {tournaments.map((t) => (
          <TournamentCard
            key={t.id}
            tournament={t}
            onTap={() => onViewBracket(t.id)}
          />
        ))}
      </div>

      {loading && <p className="text-zinc-500 text-center py-4">Loading...</p>}

      {!loading && tournaments.length === 0 && (
        <p className="text-zinc-600 text-center py-8">No tournaments found</p>
      )}

      {hasMore && !loading && tournaments.length > 0 && (
        <button
          onClick={loadMore}
          className="w-full py-3 mt-2 rounded-xl bg-zinc-900 border border-zinc-800 text-sm font-medium text-zinc-400 hover:text-white"
        >
          Load more
        </button>
      )}
    </div>
  );
}

// ── My Tournaments Tab ──────────────────────────────────────────────────────

function MyTournamentsTab({
  upcoming,
  past,
  loading,
  onViewBracket,
}: ReturnType<typeof useMyTournaments> & {
  onViewBracket: (id: string) => void;
}) {
  if (loading) {
    return <p className="text-zinc-500 text-center py-4">Loading...</p>;
  }

  return (
    <div>
      {upcoming.length > 0 && (
        <>
          <h3 className="text-xs uppercase tracking-widest text-zinc-500 font-bold mb-2">
            Active & Upcoming
          </h3>
          <div className="space-y-2 mb-6">
            {upcoming.map((entry) => (
              <TournamentCard
                key={entry.tournament.id}
                tournament={entry.tournament}
                role={entry.role}
                onTap={() => onViewBracket(entry.tournament.id)}
              />
            ))}
          </div>
        </>
      )}

      {past.length > 0 && (
        <>
          <h3 className="text-xs uppercase tracking-widest text-zinc-500 font-bold mb-2">
            Past
          </h3>
          <div className="space-y-2">
            {past.map((entry) => (
              <TournamentCard
                key={entry.tournament.id}
                tournament={entry.tournament}
                role={entry.role}
                onTap={() => onViewBracket(entry.tournament.id)}
              />
            ))}
          </div>
        </>
      )}

      {upcoming.length === 0 && past.length === 0 && (
        <p className="text-zinc-600 text-center py-8">
          You haven't joined any tournaments yet
        </p>
      )}
    </div>
  );
}

// ── Tournament Card ─────────────────────────────────────────────────────────

function TournamentCard({
  tournament,
  role,
  onTap,
}: {
  tournament: Tournament;
  role?: "organiser" | "player";
  onTap: () => void;
}) {
  const formatColor = FORMAT_COLORS[tournament.format];
  const statusColor = STATUS_COLORS[tournament.status] ?? "#6b7280";

  return (
    <button
      onClick={onTap}
      className="w-full p-4 rounded-xl bg-zinc-900 border border-zinc-800 text-left hover:border-zinc-600 transition-colors"
    >
      <div className="flex items-center justify-between mb-1">
        <h3 className="text-base font-bold truncate">{tournament.name}</h3>
        <span
          className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-full shrink-0 ml-2"
          style={{
            backgroundColor: `${statusColor}20`,
            color: statusColor,
          }}
        >
          {tournament.status.replace("_", " ")}
        </span>
      </div>
      <div className="flex items-center gap-3 text-xs text-zinc-500">
        <span
          className="font-bold px-1.5 py-0.5 rounded"
          style={{
            backgroundColor: `${formatColor}20`,
            color: formatColor,
          }}
        >
          {FORMAT_LABELS[tournament.format]}
        </span>
        {tournament.scheduledAt && (
          <span>
            {new Date(tournament.scheduledAt).toLocaleDateString(undefined, {
              month: "short",
              day: "numeric",
              hour: "numeric",
              minute: "2-digit",
            })}
          </span>
        )}
        {tournament.maxParticipants && (
          <span>Max {tournament.maxParticipants}</span>
        )}
        {role && <span className="text-zinc-600 capitalize">{role}</span>}
      </div>
    </button>
  );
}
