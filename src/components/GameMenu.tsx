import { useEffect, useRef, useState } from "react";
import { Menu, Undo2, Volume2 } from "lucide-react";
import { setVolume } from "../sound/sounds";

interface GameMenuProps {
  onUndo: () => void;
  undoDisabled: boolean;
}

export function GameMenu({ onUndo, undoDisabled }: GameMenuProps) {
  const [open, setOpen] = useState(false);
  const [volume, setVolumeState] = useState(
    parseFloat(localStorage.getItem("app-volume") ?? "1"),
  );
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function handleMouseDown(e: MouseEvent) {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleMouseDown);
    return () => document.removeEventListener("mousedown", handleMouseDown);
  }, [open]);

  function handleUndo() {
    onUndo();
    setOpen(false);
  }

  function handleVolumeChange(e: React.ChangeEvent<HTMLInputElement>) {
    const v = parseFloat(e.target.value);
    setVolumeState(v);
    setVolume(v);
  }

  return (
    <div className="relative w-16 flex justify-end" ref={panelRef}>
      <button
        onClick={() => setOpen((o) => !o)}
        className="btn-ghost w-16 flex items-center justify-end"
        aria-label="Menu"
      >
        <Menu size={22} />
      </button>

      {open && (
        <div className="absolute top-full right-0 mt-3 z-50 bg-surface-raised border border-border-default rounded-2xl shadow-2xl overflow-hidden min-w-[200px]">
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
              onChange={handleVolumeChange}
              className="w-full h-2 rounded-full accent-[var(--color-game-accent)] cursor-pointer"
            />
          </div>
        </div>
      )}
    </div>
  );
}
