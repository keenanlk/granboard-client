import type { ReactNode } from "react";
import { TurnDelayOverlay } from "./TurnDelayOverlay.tsx";

interface GameShellProps {
  /** e.g. "border-green-900" — header bottom border */
  headerBorderClass: string;
  /** Center of the header (title, subtitle, etc.) */
  title: ReactNode;
  onExit: () => void;
  onUndo: () => void;
  undoDisabled: boolean;
  /** From useGameSession */
  isTransitioning: boolean;
  countdown: number;
  nextPlayerName?: string;
  /** Winner overlay, game-specific banners, award overlays, etc. */
  overlays?: ReactNode;
  children: ReactNode;
}

export function GameShell({
  headerBorderClass,
  title,
  onExit,
  onUndo,
  undoDisabled,
  isTransitioning,
  countdown,
  nextPlayerName,
  overlays,
  children,
}: GameShellProps) {
  return (
    <div
      className="h-screen bg-zinc-950 text-white flex flex-col overflow-hidden"
      style={{ paddingLeft: "var(--sal)", paddingRight: "var(--sar)" }}
    >
      {/* Turn delay overlay — shown between every turn across all game modes */}
      {isTransitioning && (
        <TurnDelayOverlay countdown={countdown} nextPlayerName={nextPlayerName} />
      )}

      {/* Game-specific overlays: winner, award, playoff banner, etc. */}
      {overlays}

      <header
        className={`flex items-center justify-between px-6 pb-3 bg-black border-b-2 ${headerBorderClass} shrink-0`}
        style={{ paddingTop: "calc(var(--sat) + 0.75rem)" }}
      >
        <button
          onClick={onExit}
          className="text-zinc-500 hover:text-white transition-colors text-sm uppercase tracking-wider w-16"
        >
          ← Exit
        </button>
        <div className="flex flex-col items-center">{title}</div>
        <button
          onClick={onUndo}
          disabled={undoDisabled}
          className="text-zinc-500 hover:text-red-400 disabled:text-zinc-800 transition-colors text-sm uppercase tracking-wider w-16 text-right disabled:cursor-not-allowed"
        >
          Undo
        </button>
      </header>

      {children}
    </div>
  );
}
