import type { ReactNode } from "react";
import { TurnDelayOverlay } from "./TurnDelayOverlay.tsx";
import { GameMenu } from "./GameMenu.tsx";

interface GameShellProps {
  gameClass: "game-x01" | "game-cricket" | "game-highscore";
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
  gameClass,
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
      className={`h-screen bg-surface-sunken text-content-primary flex flex-col overflow-hidden ${gameClass}`}
    >
      {/* Turn delay overlay — shown between every turn across all game modes */}
      {isTransitioning && (
        <TurnDelayOverlay countdown={countdown} nextPlayerName={nextPlayerName} />
      )}

      {/* Game-specific overlays: winner, award, playoff banner, etc. */}
      {overlays}

      <header
        className="flex items-center justify-between pb-3 bg-surface-sunken border-b-2 border-[var(--color-game-accent)] shrink-0"
        style={{
          paddingTop: "calc(var(--sat) + 0.75rem)",
          paddingLeft: "calc(var(--sal) + 1.5rem)",
          paddingRight: "1.5rem",
        }}
      >
        <button onClick={onExit} className="btn-ghost w-16">
          ← Exit
        </button>
        <div className="flex flex-col items-center">{title}</div>
        <GameMenu onUndo={onUndo} undoDisabled={undoDisabled} />
      </header>

      {children}
    </div>
  );
}
