import { useEffect, useState } from "react";
import { usePlayerProfileStore } from "../store/usePlayerProfileStore.ts";
import { dbGetSessionsForPlayer } from "../db/db.ts";
import type { GameSessionRecord, PlayerRecord } from "../db/db.types.ts";
import { computePlayerStats } from "../db/playerStats.ts";
import type { PlayerStats } from "../db/db.types.ts";

interface PlayersScreenProps {
  onBack: () => void;
}

function StatBox({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col items-center justify-center bg-zinc-900 rounded-xl px-4 py-3 gap-0.5">
      <span className="text-2xl font-black text-white tabular-nums">
        {value}
      </span>
      <span className="text-xs text-zinc-500 uppercase tracking-wider font-bold">
        {label}
      </span>
    </div>
  );
}

function pct(wins: number, games: number) {
  if (games === 0) return "—";
  return Math.round((wins / games) * 100) + "%";
}

function fmt(n: number, dec = 1) {
  if (n === 0) return "—";
  return n.toFixed(dec);
}

function PlayerDetail({
  player,
  onBack,
}: {
  player: PlayerRecord;
  onBack: () => void;
}) {
  const [sessions, setSessions] = useState<GameSessionRecord[] | null>(null);
  const { removePlayer } = usePlayerProfileStore();
  const [confirmDelete, setConfirmDelete] = useState(false);

  useEffect(() => {
    dbGetSessionsForPlayer(player.id).then(setSessions);
  }, [player.id]);

  const stats: PlayerStats | null = sessions
    ? computePlayerStats(sessions, player.id)
    : null;

  const handleDelete = async () => {
    await removePlayer(player.id);
    onBack();
  };

  return (
    <div className="flex flex-col flex-1 min-h-0">
      {/* Sub-header */}
      <div className="flex items-center justify-between px-5 py-3 border-b border-zinc-800 shrink-0">
        <button
          onClick={onBack}
          className="text-zinc-500 hover:text-white transition-colors text-sm uppercase tracking-wider"
        >
          ← Back
        </button>
        <span className="font-black text-white text-lg">{player.name}</span>
        {confirmDelete ? (
          <div className="flex items-center gap-2">
            <button
              onClick={() => setConfirmDelete(false)}
              className="text-zinc-500 hover:text-white text-sm px-3 py-1 rounded-lg border border-zinc-700"
            >
              Cancel
            </button>
            <button
              onClick={handleDelete}
              className="text-white text-sm px-3 py-1 rounded-lg bg-red-700 hover:bg-red-600"
            >
              Delete
            </button>
          </div>
        ) : (
          <button
            onClick={() => setConfirmDelete(true)}
            className="text-zinc-600 hover:text-red-400 transition-colors text-sm uppercase tracking-wider"
          >
            Delete
          </button>
        )}
      </div>

      {/* Stats content */}
      <div className="flex-1 min-h-0 overflow-y-auto px-5 py-4 flex flex-col gap-6">
        {!stats ? (
          <p className="text-zinc-600 text-sm text-center mt-8">Loading…</p>
        ) : stats.totalGames === 0 ? (
          <p className="text-zinc-600 text-sm text-center mt-8 italic">
            No games recorded yet. Play a game with this profile to see stats.
          </p>
        ) : (
          <>
            {/* Overall */}
            <section className="flex flex-col gap-2">
              <p className="text-zinc-500 text-xs uppercase tracking-widest font-bold">
                Overall
              </p>
              <div className="grid grid-cols-3 gap-2">
                <StatBox label="Games" value={String(stats.totalGames)} />
                <StatBox label="Wins" value={String(stats.totalWins)} />
                <StatBox
                  label="Win %"
                  value={pct(stats.totalWins, stats.totalGames)}
                />
              </div>
            </section>

            {/* X01 */}
            {stats.x01.gamesPlayed > 0 && (
              <section className="flex flex-col gap-2">
                <p className="text-red-500 text-xs uppercase tracking-widest font-bold">
                  X01
                </p>
                <div className="grid grid-cols-2 gap-2">
                  <StatBox
                    label="Games"
                    value={`${stats.x01.wins}W / ${stats.x01.gamesPlayed}G`}
                  />
                  <StatBox
                    label="Win %"
                    value={pct(stats.x01.wins, stats.x01.gamesPlayed)}
                  />
                  <StatBox label="PPD" value={fmt(stats.x01.ppd)} />
                  <StatBox label="Avg Round" value={fmt(stats.x01.avgRound)} />
                  <StatBox
                    label="Best Round"
                    value={fmt(stats.x01.bestRound, 0)}
                  />
                </div>
              </section>
            )}

            {/* Cricket */}
            {stats.cricket.gamesPlayed > 0 && (
              <section className="flex flex-col gap-2">
                <p className="text-green-400 text-xs uppercase tracking-widest font-bold">
                  Cricket
                </p>
                <div className="grid grid-cols-2 gap-2">
                  <StatBox
                    label="Games"
                    value={`${stats.cricket.wins}W / ${stats.cricket.gamesPlayed}G`}
                  />
                  <StatBox
                    label="Win %"
                    value={pct(stats.cricket.wins, stats.cricket.gamesPlayed)}
                  />
                  <StatBox label="MPR" value={fmt(stats.cricket.mpr)} />
                  <StatBox
                    label="Avg Pts/Round"
                    value={fmt(stats.cricket.avgRoundScore)}
                  />
                </div>
              </section>
            )}

            {/* High Score */}
            {stats.highscore.gamesPlayed > 0 && (
              <section className="flex flex-col gap-2">
                <p className="text-yellow-400 text-xs uppercase tracking-widest font-bold">
                  High Score
                </p>
                <div className="grid grid-cols-2 gap-2">
                  <StatBox
                    label="Games"
                    value={`${stats.highscore.wins}W / ${stats.highscore.gamesPlayed}G`}
                  />
                  <StatBox
                    label="Win %"
                    value={pct(
                      stats.highscore.wins,
                      stats.highscore.gamesPlayed,
                    )}
                  />
                  <StatBox
                    label="Avg Score"
                    value={fmt(stats.highscore.avgScore, 0)}
                  />
                  <StatBox
                    label="Best Score"
                    value={fmt(stats.highscore.bestScore, 0)}
                  />
                  <StatBox
                    label="Avg Round"
                    value={fmt(stats.highscore.avgRound, 0)}
                  />
                  <StatBox
                    label="Best Round"
                    value={fmt(stats.highscore.bestRound, 0)}
                  />
                </div>
              </section>
            )}

            {/* Recent sessions */}
            <section className="flex flex-col gap-2">
              <p className="text-zinc-500 text-xs uppercase tracking-widest font-bold">
                Recent Games
              </p>
              <div className="flex flex-col gap-1.5">
                {[...sessions!]
                  .sort((a, b) => b.playedAt - a.playedAt)
                  .slice(0, 10)
                  .map((s) => {
                    const me = s.participants.find(
                      (p) => p.playerId === player.id,
                    );
                    const date = new Date(s.playedAt);
                    const label =
                      s.gameType === "x01"
                        ? `X01 · ${(s.options as { startingScore?: number })?.startingScore ?? ""}`
                        : s.gameType === "cricket"
                          ? "Cricket"
                          : "High Score";
                    return (
                      <div
                        key={s.id}
                        className="flex items-center justify-between bg-zinc-900 rounded-lg px-3 py-2"
                      >
                        <div className="flex flex-col">
                          <span className="text-sm font-bold text-white">
                            {label}
                          </span>
                          <span className="text-xs text-zinc-500">
                            {date.toLocaleDateString()} ·{" "}
                            {s.participants.length} players
                          </span>
                        </div>
                        <div className="flex items-center gap-3">
                          {me?.isWinner && (
                            <span className="text-xs font-black text-green-400 uppercase tracking-wider">
                              Win
                            </span>
                          )}
                          <span className="text-sm font-bold text-zinc-400 tabular-nums">
                            {me?.finalScore ?? "—"}
                          </span>
                        </div>
                      </div>
                    );
                  })}
              </div>
            </section>
          </>
        )}
      </div>
    </div>
  );
}

export function PlayersScreen({ onBack }: PlayersScreenProps) {
  const { players, loaded, load, createPlayer } = usePlayerProfileStore();
  const [selected, setSelected] = useState<PlayerRecord | null>(null);
  const [newName, setNewName] = useState("");
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    load();
  }, [load]);

  const handleCreate = async () => {
    const trimmed = newName.trim();
    if (!trimmed) return;
    await createPlayer(trimmed);
    setNewName("");
    setCreating(false);
  };

  return (
    <div
      className="h-screen bg-zinc-950 text-white flex flex-col overflow-hidden"
      style={{ paddingLeft: "var(--sal)" }}
    >
      {/* Header */}
      <header
        className="flex items-center justify-between px-6 pb-3 border-b border-zinc-800 shrink-0"
        style={{ paddingTop: "calc(var(--sat) + 0.75rem)" }}
      >
        <button
          onClick={selected ? () => setSelected(null) : onBack}
          className="text-zinc-500 hover:text-white transition-colors text-sm uppercase tracking-wider w-14"
        >
          ← Back
        </button>
        <span className="font-black text-white text-xl tracking-widest">
          Players
        </span>
        <div className="w-14" />
      </header>

      {selected ? (
        <PlayerDetail player={selected} onBack={() => setSelected(null)} />
      ) : (
        <>
          {/* Player list */}
          <div className="flex-1 min-h-0 overflow-y-auto px-5 py-4 flex flex-col gap-2">
            {loaded && players.length === 0 && !creating && (
              <p className="text-zinc-600 text-sm italic text-center mt-8">
                No saved players yet. Create one below.
              </p>
            )}
            {players.map((p) => (
              <button
                key={p.id}
                onClick={() => setSelected(p)}
                className="flex items-center justify-between bg-zinc-900 border border-zinc-800 hover:border-zinc-600 rounded-xl px-4 py-3 transition-colors"
              >
                <span className="text-white font-bold text-lg">{p.name}</span>
                <span className="text-zinc-500 text-sm">Stats →</span>
              </button>
            ))}
          </div>

          {/* New player form */}
          <div
            className="shrink-0 px-5 pt-3 border-t border-zinc-800 bg-black"
            style={{ paddingBottom: "calc(var(--sab) + 0.75rem)" }}
          >
            {creating ? (
              <div className="flex gap-2">
                <input
                  autoFocus
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") handleCreate();
                    if (e.key === "Escape") setCreating(false);
                  }}
                  placeholder="Player name"
                  className="flex-1 min-w-0 bg-zinc-900 border border-zinc-700 rounded-xl px-4 py-3 text-white text-base focus:outline-none focus:border-zinc-500"
                />
                <button
                  onClick={handleCreate}
                  className="px-5 py-3 rounded-xl bg-green-700 hover:bg-green-600 text-white font-black text-lg"
                >
                  ✓
                </button>
                <button
                  onClick={() => setCreating(false)}
                  className="px-4 py-3 rounded-xl border border-zinc-700 text-zinc-400 hover:text-white text-base"
                >
                  ✕
                </button>
              </div>
            ) : (
              <button
                onClick={() => setCreating(true)}
                className="w-full py-4 rounded-2xl border border-dashed border-zinc-700 text-zinc-400 hover:text-white hover:border-zinc-500 font-bold text-base transition-colors"
              >
                + New Player
              </button>
            )}
          </div>
        </>
      )}
    </div>
  );
}
