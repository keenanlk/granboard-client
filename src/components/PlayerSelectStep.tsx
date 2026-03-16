import { useEffect, useRef, useState } from "react";
import { usePlayerProfileStore } from "../store/usePlayerProfileStore.ts";
import { BotSkill } from "../bot/Bot.ts";
import { getBotCharacter, getAllCharacters } from "../bot/botCharacters.ts";
import { BotSelectOverlay } from "./BotSelectOverlay.tsx";

export { BotSkill };

export interface RosterEntry {
  id: string | null;  // null = guest or bot
  name: string;
  isBot?: boolean;
  botSkill?: BotSkill;
}

interface Props {
  roster: RosterEntry[];
  onChange: (roster: RosterEntry[]) => void;
}

const MAX_PLAYERS = 8;

export function PlayerSelectStep({ roster, onChange }: Props) {
  const { players, loaded, load, createPlayer } = usePlayerProfileStore();
  const [newName, setNewName] = useState("");
  const [creating, setCreating] = useState(false);
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);
  const [editingName, setEditingName] = useState<number | null>(null);
  // Bot select overlay: "add" = adding new bot, number = editing existing bot at that index
  const [botSelectMode, setBotSelectMode] = useState<"add" | number | null>(null);
  // Touch drag state
  const touchStartRef = useRef<{ x: number; y: number; index: number; timer: ReturnType<typeof setTimeout> | null } | null>(null);
  const [touchDragging, setTouchDragging] = useState(false);
  const [touchPos, setTouchPos] = useState<{ x: number; y: number } | null>(null);
  const gridRef = useRef<HTMLDivElement>(null);

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
    setBotSelectMode("add");
  };

  const handleBotSelect = (skill: BotSkill) => {
    const character = getBotCharacter(skill);
    if (botSelectMode === "add") {
      const sameName = roster.filter((r) => r.isBot && r.name.startsWith(character.name)).length;
      const name = sameName > 0 ? `${character.name} ${sameName + 1}` : character.name;
      onChange([...roster, { id: null, name, isBot: true, botSkill: skill }]);
    } else if (typeof botSelectMode === "number") {
      setSkill(botSelectMode, skill);
    }
    setBotSelectMode(null);
  };

  const removeFromRoster = (index: number) => {
    onChange(roster.filter((_, i) => i !== index));
  };

  const renameEntry = (index: number, name: string) => {
    onChange(roster.map((r, i) => (i === index ? { ...r, name } : r)));
  };

  const setSkill = (index: number, skill: BotSkill) => {
    const character = getBotCharacter(skill);
    const oldEntry = roster[index];
    // Auto-rename if the name is still a default character name (not manually edited)
    const allNames = getAllCharacters().map((c) => c.character.name);
    const isDefaultName = allNames.some((n) => oldEntry.name === n || oldEntry.name.match(new RegExp(`^${n} \\d+$`)));
    const sameName = roster.filter((r, i) => i !== index && r.isBot && r.name.startsWith(character.name)).length;
    const newName = isDefaultName
      ? (sameName > 0 ? `${character.name} ${sameName + 1}` : character.name)
      : oldEntry.name;
    onChange(roster.map((r, i) => (i === index ? { ...r, botSkill: skill, name: newName } : r)));
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

  // Reorder helper
  const reorder = (from: number, to: number) => {
    if (from === to) return;
    const newRoster = [...roster];
    const [moved] = newRoster.splice(from, 1);
    newRoster.splice(to, 0, moved);
    onChange(newRoster);
  };

  // Desktop drag
  const handleDragStart = (index: number, e: React.DragEvent) => {
    setDragIndex(index);
    e.dataTransfer.effectAllowed = "move";
    // Use a transparent image so native drag preview is hidden
    const img = new Image();
    img.src = "data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7";
    e.dataTransfer.setDragImage(img, 0, 0);
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    setDragOverIndex(index);
  };

  const handleDrop = (index: number) => {
    if (dragIndex !== null) reorder(dragIndex, index);
    setDragIndex(null);
    setDragOverIndex(null);
  };

  const handleDragEnd = () => {
    setDragIndex(null);
    setDragOverIndex(null);
  };

  // Touch drag for iOS
  const handleTouchStart = (index: number, e: React.TouchEvent) => {
    const touch = e.touches[0];
    const timer = setTimeout(() => {
      setTouchDragging(true);
      setDragIndex(index);
      setTouchPos({ x: touch.clientX, y: touch.clientY });
    }, 200);
    touchStartRef.current = { x: touch.clientX, y: touch.clientY, index, timer };
  };

  // Attach touchmove with { passive: false } so preventDefault works
  useEffect(() => {
    const el = gridRef.current;
    if (!el) return;
    const onTouchMove = (e: TouchEvent) => {
      const touch = e.touches[0];
      if (touchStartRef.current?.timer) {
        const dx = Math.abs(touch.clientX - touchStartRef.current.x);
        const dy = Math.abs(touch.clientY - touchStartRef.current.y);
        if (dx > 5 || dy > 5) {
          clearTimeout(touchStartRef.current.timer);
          touchStartRef.current.timer = null;
        }
      }
      if (!touchDragging) return;
      e.preventDefault();
      setTouchPos({ x: touch.clientX, y: touch.clientY });
      const target = document.elementFromPoint(touch.clientX, touch.clientY);
      const card = target?.closest("[data-roster-index]");
      if (card) {
        setDragOverIndex(Number(card.getAttribute("data-roster-index")));
      }
    };
    el.addEventListener("touchmove", onTouchMove, { passive: false });
    return () => el.removeEventListener("touchmove", onTouchMove);
  }, [touchDragging]);

  const handleTouchEnd = () => {
    if (touchStartRef.current?.timer) clearTimeout(touchStartRef.current.timer);
    if (touchDragging && dragIndex !== null && dragOverIndex !== null) {
      reorder(dragIndex, dragOverIndex);
    }
    touchStartRef.current = null;
    setTouchDragging(false);
    setTouchPos(null);
    setDragIndex(null);
    setDragOverIndex(null);
  };

  const dragEntry = dragIndex !== null ? roster[dragIndex] : null;

  return (
    <div className="flex flex-1 min-h-0" style={{ gap: "clamp(0.75rem,1.5vw,1.5rem)" }}>

      {/* Touch drag floating preview */}
      {touchDragging && dragEntry && touchPos && (() => {
        const dragBotChar = dragEntry.isBot ? getBotCharacter(dragEntry.botSkill ?? BotSkill.Intermediate) : null;
        return (
          <div
            className="fixed z-[100] pointer-events-none rounded-xl border-2 px-4 py-3 bg-surface-raised/90 backdrop-blur-sm shadow-2xl flex flex-col items-center gap-1"
            style={{
              left: touchPos.x - 60,
              top: touchPos.y - 30,
              minWidth: 120,
              borderColor: dragBotChar ? dragBotChar.color : "var(--color-game-accent)",
              boxShadow: dragBotChar ? `0 0 16px ${dragBotChar.glow}` : "0 0 16px var(--color-game-accent-glow)",
            }}
          >
            <span
              className={`font-bold text-sm ${dragBotChar ? dragBotChar.animationClass : ""}`}
              style={dragBotChar ? { color: dragBotChar.color } : { color: "white" }}
            >
              {dragEntry.name}
            </span>
            {dragBotChar && (
              <span className="text-[9px] font-black" style={{ color: dragBotChar.color, opacity: 0.6 }}>{dragBotChar.label}</span>
            )}
          </div>
        );
      })()}

      {/* Left: saved player pool */}
      <div className="flex flex-col gap-[clamp(0.5rem,1vh,1rem)] shrink-0 min-h-0" style={{ width: "clamp(10rem,15vw,18rem)" }}>
        <p className="text-content-muted uppercase tracking-widest font-bold shrink-0" style={{ fontSize: "clamp(0.65rem,1vw,1rem)" }}>
          Saved Players
        </p>

        <div className="flex-1 flex flex-col gap-[clamp(0.25rem,0.5vh,0.5rem)] overflow-y-auto min-h-0">
          {loaded && players.length === 0 && !creating && (
            <p className="text-content-faint italic" style={{ fontSize: "clamp(0.75rem,1.2vw,1.25rem)" }}>No saved players yet</p>
          )}
          {players.map((p) => {
            const active = inGameIds.has(p.id);
            return (
              <button
                key={p.id}
                onClick={() => toggleSaved(p.id, p.name)}
                disabled={!active && roster.length >= MAX_PLAYERS}
                className={`w-full text-left rounded-xl border-2 font-bold truncate transition-all duration-150 disabled:opacity-40 flex items-center gap-2 ${
                  active
                    ? "text-white"
                    : "border-border-default bg-surface-raised text-zinc-400 hover:border-border-subtle hover:text-white"
                }`}
                style={{
                  fontSize: "clamp(0.8rem,1.3vw,1.5rem)",
                  padding: "clamp(0.375rem,0.8vh,0.75rem) clamp(0.5rem,1vw,1rem)",
                  ...(active ? {
                    borderColor: "var(--color-game-accent)",
                    backgroundColor: "color-mix(in oklch, var(--color-game-accent-dim) 60%, transparent)",
                  } : {}),
                }}
              >
                <span className="flex-1 truncate">{p.name}</span>
                {active && <span className="shrink-0" style={{ fontSize: "clamp(0.7rem,1vw,1.25rem)" }}>✓</span>}
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
              className="flex-1 min-w-0 bg-surface-raised border border-border-subtle rounded-xl text-white focus:outline-none focus:border-border-default"
              style={{ fontSize: "clamp(0.8rem,1.3vw,1.5rem)", padding: "clamp(0.375rem,0.8vh,0.75rem) clamp(0.5rem,1vw,1rem)" }}
            />
            <button
              onClick={handleCreatePlayer}
              className="rounded-xl font-black text-[var(--color-game-accent)] shrink-0"
              style={{ fontSize: "clamp(0.8rem,1.3vw,1.5rem)", padding: "clamp(0.375rem,0.8vh,0.75rem) clamp(0.5rem,1vw,1rem)" }}
            >
              ✓
            </button>
          </div>
        ) : (
          <button
            onClick={() => setCreating(true)}
            className="shrink-0 w-full rounded-xl border border-dashed border-border-subtle text-content-muted hover:text-content-secondary hover:border-border-default font-bold transition-colors"
            style={{ fontSize: "clamp(0.75rem,1.2vw,1.25rem)", padding: "clamp(0.375rem,0.8vh,0.75rem) 0" }}
          >
            + New Player
          </button>
        )}
      </div>

      {/* Right: current game roster as 2-row grid */}
      <div className="flex-1 flex flex-col min-h-0" style={{ gap: "clamp(0.375rem,0.8vh,0.75rem)" }}>

        <div
          ref={gridRef}
          className="flex-1 min-h-0 grid overflow-hidden"
          style={{ gridTemplateColumns: `repeat(${Math.ceil(Math.max(roster.length, 2) / 2)}, minmax(0, 1fr))`, gridTemplateRows: "minmax(0, 1fr) minmax(0, 1fr)", gap: "clamp(0.375rem,0.5vw,0.75rem)" }}
        >
          {roster.map((entry, i) => {
            const isDragging = dragIndex === i;
            const isOver = dragOverIndex === i && dragIndex !== i;
            const botChar = entry.isBot ? getBotCharacter(entry.botSkill ?? BotSkill.Intermediate) : null;
            const handleCardClick = () => {
              if (touchDragging) return;
              if (editingName === i) return;
              if (entry.isBot) {
                setBotSelectMode(i);
              } else {
                setEditingName(i);
              }
            };
            return (
              <div
                key={i}
                data-roster-index={i}
                draggable={editingName !== i}
                onDragStart={(e) => handleDragStart(i, e)}
                onDragOver={(e) => handleDragOver(e, i)}
                onDrop={() => handleDrop(i)}
                onDragEnd={handleDragEnd}
                onTouchStart={(e) => { if (editingName !== i) handleTouchStart(i, e); }}

                onTouchEnd={handleTouchEnd}
                onClick={handleCardClick}
                className={`relative rounded-xl border-2 flex flex-col items-center justify-center gap-1 p-2 transition-all duration-150 select-none ${
                  editingName === i ? "cursor-text" : "cursor-grab active:cursor-grabbing"
                } ${
                  !entry.isBot && !entry.id ? "border-border-subtle bg-surface-raised" : ""
                } ${isDragging ? "opacity-30 scale-95" : ""} ${isOver ? "scale-105 shadow-lg" : ""}`}
                style={{
                  ...(botChar
                    ? { borderColor: botChar.color, backgroundColor: botChar.dim, boxShadow: `0 0 8px ${botChar.glow}` }
                    : entry.id
                      ? {
                          borderColor: "var(--color-game-accent)",
                          backgroundColor: "color-mix(in oklch, var(--color-game-accent-dim) 60%, transparent)",
                        }
                      : undefined),
                  ...(isOver ? { borderColor: "#fff", boxShadow: "0 0 16px var(--color-game-accent-glow)" } : {}),
                }}
              >
                {/* Remove button — top right corner */}
                <button
                  onClick={(e) => { e.stopPropagation(); removeFromRoster(i); }}
                  onTouchStart={(e) => e.stopPropagation()}
                  onPointerDown={(e) => e.stopPropagation()}
                  className="absolute top-1 right-1.5 text-zinc-600 hover:text-red-400 transition-colors leading-none z-10"
                  style={{ fontSize: "clamp(1rem,1.5vw,1.75rem)" }}
                >
                  ×
                </button>

                {/* Player number — top left */}
                <span className="absolute top-1 left-2 font-black tabular-nums leading-none text-white/15" style={{ fontSize: "clamp(0.8rem,1.5vw,1.75rem)" }}>
                  {i + 1}
                </span>

                {/* Name */}
                {editingName === i ? (
                  <input
                    autoFocus
                    value={entry.name}
                    onChange={(e) => renameEntry(i, e.target.value)}
                    onBlur={() => setEditingName(null)}
                    onKeyDown={(e) => { if (e.key === "Enter" || e.key === "Escape") setEditingName(null); }}
                    onClick={(e) => e.stopPropagation()}
                    onPointerDown={(e) => e.stopPropagation()}
                    onTouchStart={(e) => e.stopPropagation()}
                    className="w-full min-w-0 bg-transparent text-white font-bold text-center focus:outline-none"
                    style={{ fontSize: "clamp(0.875rem,1.8vw,2rem)" }}
                  />
                ) : (
                  <span
                    className={`font-bold text-center truncate max-w-full leading-tight ${botChar ? botChar.animationClass : ""} ${entry.id && !entry.isBot ? "text-[var(--color-game-accent)]" : "text-white"}`}
                    style={{
                      fontSize: "clamp(0.875rem,1.8vw,2rem)",
                      ...(botChar ? { fontFamily: "Beon, sans-serif", color: botChar.color, textShadow: `0 0 8px ${botChar.glow}` } : {}),
                    }}
                  >
                    {entry.name}
                  </span>
                )}

              </div>
            );
          })}
        </div>

        {/* Add buttons — pinned below the grid */}
        {roster.length < MAX_PLAYERS && (
          <div className="flex gap-[clamp(0.375rem,0.5vw,0.75rem)] shrink-0">
            <button
              onClick={addGuest}
              className="flex-1 rounded-xl border border-dashed border-border-subtle text-content-muted hover:text-content-secondary hover:border-border-default font-bold transition-colors"
              style={{ fontSize: "clamp(0.75rem,1.2vw,1.25rem)", padding: "clamp(0.375rem,0.8vh,0.75rem) 0" }}
            >
              + Guest
            </button>
            <button
              onClick={addBot}
              className="flex-1 rounded-xl border border-dashed font-bold transition-all neon-glow"
              style={{
                fontSize: "clamp(0.75rem,1.2vw,1.25rem)",
                padding: "clamp(0.375rem,0.8vh,0.75rem) 0",
                borderColor: getBotCharacter(BotSkill.Intermediate).color,
                color: getBotCharacter(BotSkill.Intermediate).color,
                boxShadow: `0 0 8px ${getBotCharacter(BotSkill.Intermediate).glow}`,
              }}
            >
              + Bot
            </button>
          </div>
        )}
      </div>

      {/* Bot select overlay */}
      {botSelectMode !== null && (
        <BotSelectOverlay
          currentSkill={typeof botSelectMode === "number" ? (roster[botSelectMode]?.botSkill ?? null) : null}
          onSelect={handleBotSelect}
          onCancel={() => setBotSelectMode(null)}
        />
      )}
    </div>
  );
}
