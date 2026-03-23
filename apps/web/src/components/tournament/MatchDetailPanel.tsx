import { X } from "lucide-react";
import type { TournamentGameConfig } from "@nlc-darts/tournament";

interface MatchDetailPanelProps {
  matchId: number;
  player1Name: string | null;
  player2Name: string | null;
  userId: string;
  player1Id: string | null;
  player2Id: string | null;
  gameSettings: TournamentGameConfig | null;
  readyState: { readyPlayerIds: string[] } | null;
  countdown: { secondsLeft: number } | null;
  onReady: () => void;
  onUnready: () => void;
  onClose: () => void;
}

function formatGameInfo(settings: TournamentGameConfig | null): string {
  if (!settings) return "Game";
  const gameLabel =
    settings.gameType === "x01"
      ? `X01 ${settings.x01Options?.startingScore ?? 501}`
      : "Cricket";
  const bestOfMap: Record<string, string> = {
    bo1: "Single Leg",
    bo3: "Best of 3",
    bo5: "Best of 5",
    bo7: "Best of 7",
    bo9: "Best of 9",
  };
  const bestOfLabel = bestOfMap[settings.bestOf] ?? settings.bestOf;
  return `${gameLabel} \u00B7 ${bestOfLabel}`;
}

export function MatchDetailPanel({
  player1Name,
  player2Name,
  userId,
  player1Id,
  player2Id,
  gameSettings,
  readyState,
  countdown,
  onReady,
  onUnready,
  onClose,
}: MatchDetailPanelProps) {
  const isParticipant = userId === player1Id || userId === player2Id;
  const isReady = readyState?.readyPlayerIds.includes(userId) ?? false;
  const opponentName = userId === player1Id ? player2Name : player1Name;
  const opponentId = userId === player1Id ? player2Id : player1Id;
  const opponentReady = opponentId
    ? (readyState?.readyPlayerIds.includes(opponentId) ?? false)
    : false;

  return (
    <div className="fixed inset-x-0 bottom-0 z-50">
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black/60" onClick={onClose} />

      {/* Panel */}
      <div className="relative bg-zinc-900 rounded-t-2xl border-t border-zinc-800 px-6 pb-8 pt-5">
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-xl bg-zinc-800 border border-zinc-700"
        >
          <X className="w-5 h-5 text-zinc-400" />
        </button>

        {/* Header */}
        <h2 className="text-2xl font-black text-white text-center mb-2">
          {player1Name ?? "TBD"} vs {player2Name ?? "TBD"}
        </h2>

        {/* Game info badge */}
        <div className="flex justify-center mb-6">
          <span className="px-4 py-1.5 rounded-full bg-zinc-800 border border-zinc-700 text-sm font-bold text-zinc-300">
            {formatGameInfo(gameSettings)}
          </span>
        </div>

        {/* Countdown overlay */}
        {countdown && (
          <div className="flex flex-col items-center gap-3 mb-4">
            <p className="text-7xl font-black text-amber-400 tabular-nums">
              {countdown.secondsLeft}
            </p>
            <p className="text-zinc-400 text-lg font-medium">
              Starting soon...
            </p>
            <button
              onClick={onUnready}
              className="mt-2 px-6 py-3 rounded-xl bg-red-900/40 border border-red-800 text-red-400 text-lg font-bold"
            >
              Cancel
            </button>
          </div>
        )}

        {/* Ready-up flow (no countdown) */}
        {!countdown && isParticipant && (
          <div className="flex flex-col items-center gap-4">
            {!isReady && (
              <button
                onClick={onReady}
                className="w-full max-w-md py-5 rounded-2xl bg-green-600 text-white text-2xl font-black uppercase tracking-widest active:bg-green-500 transition-colors"
              >
                READY
              </button>
            )}

            {isReady && !opponentReady && (
              <div className="flex flex-col items-center gap-2">
                <p className="text-green-400 text-xl font-bold">
                  <span className="mr-2">&#10003;</span>You are ready
                </p>
                <p className="text-zinc-400 text-lg">
                  Waiting for {opponentName ?? "opponent"}
                  <span className="inline-block animate-pulse ml-1">...</span>
                </p>
                <button
                  onClick={onUnready}
                  className="mt-3 px-5 py-2 rounded-xl bg-zinc-800 border border-zinc-700 text-zinc-400 text-sm font-medium"
                >
                  Cancel
                </button>
              </div>
            )}
          </div>
        )}

        {/* Spectator view */}
        {!countdown && !isParticipant && (
          <div className="flex justify-center">
            <span className="px-5 py-2 rounded-full bg-zinc-800 border border-zinc-700 text-zinc-500 text-lg font-medium">
              Spectating
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
