import { useEffect, useRef, useState } from "react";
import { Menu, Undo2, Volume2, LogOut } from "lucide-react";
import { setVolume } from "../sound/sounds";
import { DevBoardMenuButton, DevBoardPanel } from "./DevBoard.tsx";

interface GameMenuProps {
  onUndo: () => void;
  undoDisabled: boolean;
  onExit: () => void;
}

export function GameMenu({ onUndo, undoDisabled, onExit }: GameMenuProps) {
  const [open, setOpen] = useState(false);
  const [boardOpen, setBoardOpen] = useState(false);
  const [volume, setVolumeState] = useState(
    parseFloat(localStorage.getItem("app-volume") ?? "1"),
  );
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function handleOutsideTap(e: Event) {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleOutsideTap);
    document.addEventListener("touchstart", handleOutsideTap);
    return () => {
      document.removeEventListener("mousedown", handleOutsideTap);
      document.removeEventListener("touchstart", handleOutsideTap);
    };
  }, [open]);

  function handleUndo() {
    onUndo();
    setOpen(false);
  }

  function handleVolumeChange(e: React.ChangeEvent<HTMLInputElement> | React.FormEvent<HTMLInputElement>) {
    const v = parseFloat((e.target as HTMLInputElement).value);
    setVolumeState(v);
    setVolume(v);
  }

  return (
    <div className="relative shrink-0" ref={panelRef}>
      <button
        onClick={() => setOpen((o) => !o)}
        className="p-2 text-zinc-400 hover:text-white transition-colors"
        aria-label="Menu"
      >
        <Menu size={22} />
      </button>

      {open && (
        <div className="fixed top-12 right-4 z-50 bg-surface-raised border border-border-default rounded-2xl shadow-2xl overflow-hidden min-w-[220px]">
          {/* Undo */}
          <button
            onClick={handleUndo}
            disabled={undoDisabled}
            className="w-full flex items-center gap-3 px-5 py-4 text-left text-base font-semibold uppercase tracking-wide text-content-secondary hover:text-content-primary hover:bg-surface-overlay transition-colors disabled:text-content-faint disabled:cursor-not-allowed"
          >
            <Undo2 size={18} />
            Undo
          </button>

          <div className="h-px bg-border-default" />

          {/* Volume */}
          <div className="px-5 py-4 flex flex-col gap-2">
            <div className="flex items-center gap-2 text-base font-semibold uppercase tracking-wide text-content-secondary">
              <Volume2 size={18} />
              Volume
            </div>
            <input
              type="range"
              min={0}
              max={1}
              step={0.01}
              value={volume}
              onInput={handleVolumeChange}
              onChange={handleVolumeChange}
              className="w-full h-2 rounded-full accent-[var(--color-game-accent)] cursor-pointer"
            />
          </div>

          <div className="h-px bg-border-default" />

          {/* Mock Board — dev only */}
          {import.meta.env.DEV && (
            <>
              <DevBoardMenuButton onActivate={() => { setBoardOpen(true); setOpen(false); }} />
              <div className="h-px bg-border-default" />
            </>
          )}

          {/* Exit */}
          <button
            onClick={() => { setOpen(false); onExit(); }}
            className="w-full flex items-center gap-3 px-5 py-4 text-left text-base font-semibold uppercase tracking-wide text-red-400 hover:text-red-300 hover:bg-surface-overlay transition-colors"
          >
            <LogOut size={18} />
            Exit Game
          </button>
        </div>
      )}

      {/* Floating board panel — persists outside dropdown (dev only) */}
      {import.meta.env.DEV && boardOpen && <DevBoardPanel onClose={() => setBoardOpen(false)} />}
    </div>
  );
}
