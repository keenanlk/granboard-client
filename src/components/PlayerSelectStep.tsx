import { useEffect, useState } from "react";
import { usePlayerProfileStore } from "../store/usePlayerProfileStore.ts";

export interface RosterEntry {
  id: string | null;  // null = guest
  name: string;
}

interface Props {
  roster: RosterEntry[];
  onChange: (roster: RosterEntry[]) => void;
  accentClass: string;
  activeBg: string;
  activeBorder: string;
}

const MAX_PLAYERS = 8;

export function PlayerSelectStep({ roster, onChange, accentClass, activeBg, activeBorder }: Props) {
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
    const guestNum = roster.filter((r) => r.id === null).length + 1;
    onChange([...roster, { id: null, name: `Guest ${guestNum}` }]);
  };

  const removeFromRoster = (index: number) => {
    onChange(roster.filter((_, i) => i !== index));
  };

  const renameGuest = (index: number, name: string) => {
    onChange(roster.map((r, i) => (i === index ? { ...r, name } : r)));
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
    <div className="flex gap-3 flex-1 min-h-0">
      {/* Left: saved player pool */}
      <div className="flex flex-col gap-2 w-48 shrink-0 min-h-0">
        <p className="text-zinc-500 text-xs uppercase tracking-widest font-bold shrink-0">Saved Players</p>
        <div className="flex-1 flex flex-col gap-1.5 overflow-y-auto min-h-0">
          {loaded && players.length === 0 && !creating && (
            <p className="text-zinc-600 text-xs italic">No saved players yet</p>
          )}
          {players.map((p) => {
            const active = inGameIds.has(p.id);
            return (
              <button
                key={p.id}
                onClick={() => toggleSaved(p.id, p.name)}
                disabled={!active && roster.length >= MAX_PLAYERS}
                className={`w-full text-left px-3 py-2 rounded-lg border-2 text-sm font-bold truncate transition-all duration-150 disabled:opacity-40 ${
                  active
                    ? `${activeBorder} ${activeBg} text-white`
                    : "border-zinc-800 bg-zinc-900 text-zinc-400 hover:border-zinc-600 hover:text-white"
                }`}
              >
                {active && <span className="mr-1.5">✓</span>}
                {p.name}
              </button>
            );
          })}
        </div>

        {/* New player form */}
        {creating ? (
          <div className="flex gap-1.5 shrink-0">
            <input
              autoFocus
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") handleCreatePlayer(); if (e.key === "Escape") setCreating(false); }}
              placeholder="Player name"
              className="flex-1 min-w-0 bg-zinc-900 border border-zinc-700 rounded-lg px-2 py-1.5 text-white text-sm focus:outline-none focus:border-zinc-500"
            />
            <button
              onClick={handleCreatePlayer}
              className={`px-2 py-1.5 rounded-lg text-sm font-black ${accentClass} shrink-0`}
            >
              ✓
            </button>
          </div>
        ) : (
          <button
            onClick={() => setCreating(true)}
            className="shrink-0 w-full py-1.5 rounded-lg border border-dashed border-zinc-700 text-zinc-500 hover:text-zinc-300 hover:border-zinc-500 text-xs transition-colors"
          >
            + New Player
          </button>
        )}
      </div>

      {/* Right: current game roster */}
      <div className="flex-1 flex flex-col gap-2 min-h-0">
        <p className="text-zinc-500 text-xs uppercase tracking-widest font-bold shrink-0">
          In This Game ({roster.length}/{MAX_PLAYERS})
        </p>
        <div className="flex-1 grid grid-cols-2 gap-1.5 content-start">
          {roster.map((entry, i) => (
            <div
              key={i}
              className={`flex items-center gap-1.5 border-2 rounded-lg px-2 py-1.5 ${
                entry.id ? `${activeBorder} bg-zinc-900` : "border-zinc-700 bg-zinc-900"
              }`}
            >
              <span className="text-zinc-600 text-xs w-4 shrink-0 font-bold text-right">{i + 1}</span>
              {entry.id ? (
                // Saved player — name is fixed
                <span className={`flex-1 text-sm font-bold truncate ${accentClass}`}>{entry.name}</span>
              ) : (
                // Guest — editable
                <input
                  value={entry.name}
                  onChange={(e) => renameGuest(i, e.target.value)}
                  className="flex-1 min-w-0 bg-transparent text-white text-sm font-medium focus:outline-none"
                />
              )}
              <button
                onClick={() => removeFromRoster(i)}
                className="text-zinc-700 hover:text-red-400 transition-colors text-lg leading-none w-5 shrink-0 flex items-center justify-center"
              >
                ×
              </button>
            </div>
          ))}
          {roster.length < MAX_PLAYERS && (
            <button
              onClick={addGuest}
              className="flex items-center justify-center rounded-lg border border-dashed border-zinc-700 text-zinc-500 hover:text-zinc-300 hover:border-zinc-500 text-xs transition-colors py-1.5"
            >
              + Guest
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
