import { useEffect, useState } from "react";
import { usePlayerProfileStore } from "../store/usePlayerProfileStore.ts";
import { BotSkill } from "../bot/Bot.ts";

export { BotSkill };

export interface RosterEntry {
  id: string | null;  // null = guest or bot
  name: string;
  isBot?: boolean;
  botSkill?: BotSkill;
}

const ALL_SKILLS: Array<{ skill: BotSkill; label: string; ppd: string }> = [
  { skill: BotSkill.Beginner,     label: "BEG",    ppd: "~12" },
  { skill: BotSkill.Intermediate, label: "INT",    ppd: "~17" },
  { skill: BotSkill.Club,         label: "CLUB",   ppd: "~22" },
  { skill: BotSkill.County,       label: "COUNTY", ppd: "~26" },
  { skill: BotSkill.Advanced,     label: "ADV",    ppd: "~32" },
  { skill: BotSkill.SemiPro,      label: "SEMI",   ppd: "~39" },
  { skill: BotSkill.Pro,          label: "PRO",    ppd: "~47" },
];

interface Props {
  roster: RosterEntry[];
  onChange: (roster: RosterEntry[]) => void;
}

const MAX_PLAYERS = 8;

export function PlayerSelectStep({ roster, onChange }: Props) {
  const { players, loaded, load, createPlayer } = usePlayerProfileStore();
  const [newName, setNewName] = useState("");
  const [creating, setCreating] = useState(false);

  useEffect(() => { load(); }, [load]);

  const inGameIds = new Set(roster.map((r) => r.id).filter(Boolean) as string[]);

  const toggleSaved = (id: string, name: string) => {
    if (inGameIds.has(id)) {
      onChange(roster.filter((r) => r.id !== id));
    } else {
      if (roster.length >= MAX_PLAYERS) return;
      onChange([...roster, { id, name }]);
    }
  };

  const addGuest = () => {
    if (roster.length >= MAX_PLAYERS) return;
    const guestNum = roster.filter((r) => r.id === null && !r.isBot).length + 1;
    onChange([...roster, { id: null, name: `Guest ${guestNum}` }]);
  };

  const addBot = () => {
    if (roster.length >= MAX_PLAYERS) return;
    const botNum = roster.filter((r) => r.isBot).length + 1;
    onChange([...roster, { id: null, name: `CPU ${botNum}`, isBot: true, botSkill: BotSkill.Intermediate }]);
  };

  const removeFromRoster = (index: number) => {
    onChange(roster.filter((_, i) => i !== index));
  };

  const renameEntry = (index: number, name: string) => {
    onChange(roster.map((r, i) => (i === index ? { ...r, name } : r)));
  };

  const setSkill = (index: number, skill: BotSkill) => {
    onChange(roster.map((r, i) => (i === index ? { ...r, botSkill: skill } : r)));
  };

  const handleCreatePlayer = async () => {
    const trimmed = newName.trim();
    if (!trimmed) return;
    const player = await createPlayer(trimmed);
    setNewName("");
    setCreating(false);
    if (roster.length < MAX_PLAYERS) {
      onChange([...roster, { id: player.id, name: player.name }]);
    }
  };

  return (
    <div className="flex gap-4 flex-1 min-h-0">

      {/* Left: saved player pool */}
      <div className="flex flex-col gap-3 w-52 shrink-0 min-h-0">
        <p className="text-content-muted text-xs uppercase tracking-widest font-bold shrink-0">
          Saved Players
        </p>

        <div className="flex-1 flex flex-col gap-2 overflow-y-auto min-h-0">
          {loaded && players.length === 0 && !creating && (
            <p className="text-content-faint text-sm italic">No saved players yet</p>
          )}
          {players.map((p) => {
            const active = inGameIds.has(p.id);
            return (
              <button
                key={p.id}
                onClick={() => toggleSaved(p.id, p.name)}
                disabled={!active && roster.length >= MAX_PLAYERS}
                className={`w-full text-left px-4 py-3 rounded-xl border-2 font-bold truncate transition-all duration-150 disabled:opacity-40 ${
                  active
                    ? "text-white"
                    : "border-border-default bg-surface-raised text-zinc-400 hover:border-border-subtle hover:text-white"
                }`}
                style={active ? {
                  borderColor: "var(--color-game-accent)",
                  backgroundColor: "color-mix(in oklch, var(--color-game-accent-dim) 60%, transparent)",
                } : undefined}
              >
                {active && <span className="mr-2 text-sm">✓</span>}
                {p.name}
              </button>
            );
          })}
        </div>

        {creating ? (
          <div className="flex gap-2 shrink-0">
            <input
              autoFocus
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleCreatePlayer();
                if (e.key === "Escape") setCreating(false);
              }}
              placeholder="Player name"
              className="flex-1 min-w-0 bg-surface-raised border border-border-subtle rounded-xl px-3 py-2 text-white text-sm focus:outline-none focus:border-border-default"
            />
            <button
              onClick={handleCreatePlayer}
              className="px-3 py-2 rounded-xl text-sm font-black text-[var(--color-game-accent)] shrink-0"
            >
              ✓
            </button>
          </div>
        ) : (
          <button
            onClick={() => setCreating(true)}
            className="shrink-0 w-full py-2.5 rounded-xl border border-dashed border-border-subtle text-content-muted hover:text-content-secondary hover:border-border-default text-sm transition-colors"
          >
            + New Player
          </button>
        )}
      </div>

      {/* Right: current game roster */}
      <div className="flex-1 flex flex-col gap-3 min-h-0">
        <p className="text-content-muted text-xs uppercase tracking-widest font-bold shrink-0">
          In This Game ({roster.length}/{MAX_PLAYERS})
        </p>

        <div className="flex-1 flex flex-col gap-2 overflow-y-auto min-h-0">
          {roster.map((entry, i) => (
            <div
              key={i}
              className={`rounded-xl border-2 px-4 py-3 transition-colors ${!entry.isBot && !entry.id ? "border-border-subtle bg-surface-raised" : ""}`}
              style={
                entry.isBot
                  ? { borderColor: "rgba(126, 34, 206, 0.6)", backgroundColor: "rgba(59, 7, 100, 0.2)" }
                  : entry.id
                    ? {
                        borderColor: "var(--color-game-accent)",
                        backgroundColor: "color-mix(in oklch, var(--color-game-accent-dim) 60%, transparent)",
                      }
                    : undefined
              }
            >
              {/* Top row: position, type tag, name, remove */}
              <div className="flex items-center gap-3">
                <span className="text-content-muted text-sm font-black w-5 shrink-0 text-right tabular-nums">
                  {i + 1}
                </span>

                {entry.isBot ? (
                  <span className="text-[10px] font-black tracking-widest text-purple-400 bg-purple-900/50 rounded px-1.5 py-0.5 shrink-0 uppercase">
                    BOT
                  </span>
                ) : entry.id ? (
                  <span className="text-[10px] font-black tracking-widest text-[var(--color-game-accent)] bg-surface-overlay rounded px-1.5 py-0.5 shrink-0 uppercase">
                    SAVED
                  </span>
                ) : (
                  <span className="text-[10px] font-black tracking-widest text-content-muted bg-surface-overlay rounded px-1.5 py-0.5 shrink-0 uppercase">
                    GUEST
                  </span>
                )}

                {entry.id && !entry.isBot ? (
                  <span className="flex-1 font-bold text-base truncate text-[var(--color-game-accent)]">
                    {entry.name}
                  </span>
                ) : (
                  <input
                    value={entry.name}
                    onChange={(e) => renameEntry(i, e.target.value)}
                    className="flex-1 min-w-0 bg-transparent text-white text-base font-bold focus:outline-none"
                  />
                )}

                <button
                  onClick={() => removeFromRoster(i)}
                  className="text-content-faint hover:text-red-400 transition-colors text-xl leading-none w-6 shrink-0 flex items-center justify-center"
                >
                  ×
                </button>
              </div>

              {/* Bot skill selector */}
              {entry.isBot && (
                <div className="flex gap-1 mt-2.5 ml-8">
                  {ALL_SKILLS.map(({ skill, label, ppd }) => {
                    const active = (entry.botSkill ?? BotSkill.Intermediate) === skill;
                    return (
                      <button
                        key={skill}
                        onClick={() => setSkill(i, skill)}
                        className={`flex-1 flex flex-col items-center py-1.5 rounded-lg transition-colors ${
                          active
                            ? "bg-purple-600 text-white"
                            : "bg-surface-overlay text-content-muted hover:bg-zinc-700 hover:text-content-secondary"
                        }`}
                      >
                        <span className="text-[11px] font-black leading-tight">{label}</span>
                        <span className={`text-[9px] leading-tight ${active ? "text-purple-200" : "text-content-faint"}`}>
                          {ppd}
                        </span>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          ))}

          {/* Add player buttons */}
          {roster.length < MAX_PLAYERS && (
            <div className="flex gap-2 mt-1">
              <button
                onClick={addGuest}
                className="flex-1 py-3 rounded-xl border border-dashed border-border-subtle text-content-muted hover:text-content-secondary hover:border-border-default text-sm font-bold transition-colors"
              >
                + Guest
              </button>
              <button
                onClick={addBot}
                className="flex-1 py-3 rounded-xl border border-dashed border-purple-800 text-purple-500 hover:text-purple-300 hover:border-purple-500 text-sm font-bold transition-colors"
              >
                + Bot
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
