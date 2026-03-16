import type { ReactNode } from "react";
import { TurnDelayOverlay } from "./TurnDelayOverlay.tsx";

export interface GameShellProps {
  gameClass: "game-x01" | "game-cricket" | "game-highscore";
  title?: ReactNode;
  onExit?: () => void;
  onUndo?: () => void;
  undoDisabled?: boolean;
  /** From useGameSession */
  isTransitioning: boolean;
  countdown: number;
  nextPlayerName?: string;
  /** Winner overlay, game-specific banners, award overlays, etc. */
  overlays?: ReactNode;
  /** Floating next-turn button */
  onNextTurn?: () => void;
  showNextTurn?: boolean;
  hasWinner?: boolean;
  children: ReactNode;
}

export function GameShell({
  gameClass,
  isTransitioning,
  countdown,
  nextPlayerName,
  overlays,
  onNextTurn,
  showNextTurn,
  hasWinner,
  children,
}: GameShellProps) {
  return (
    <div
      className={`h-screen bg-surface-sunken text-content-primary flex flex-col overflow-hidden ${gameClass}`}
    >
      {/* Turn delay overlay — shown between every turn across all game modes */}
      {isTransitioning && (
        <TurnDelayOverlay
          countdown={countdown}
          nextPlayerName={nextPlayerName}
        />
      )}

      {/* Game-specific overlays: winner, award, playoff banner, etc. */}
      {overlays}

      {children}

      {/* Floating next-turn button — bottom right, only visible when ready */}
      {showNextTurn && !hasWinner && !isTransitioning && onNextTurn && (
        <button
          onClick={onNextTurn}
          className="fixed z-30 rounded-2xl font-black uppercase tracking-widest text-[var(--color-game-accent-text)] flex items-center justify-center gap-2 transition-all duration-200"
          style={{
            bottom: "calc(var(--sab) + clamp(1rem, 2vh, 1.5rem))",
            right: "clamp(1rem, 2vw, 2rem)",
            padding:
              "clamp(0.75rem, 1.5vh, 1.25rem) clamp(1.5rem, 3vw, 2.5rem)",
            fontSize: "clamp(0.875rem, 1.5vw, 1.25rem)",
            backgroundColor: "var(--color-game-accent)",
            boxShadow: "var(--shadow-glow-lg), 0 4px 20px rgba(0,0,0,0.5)",
          }}
        >
          <span>{nextPlayerName ?? "Next"}</span>
          <span>→</span>
        </button>
      )}
    </div>
  );
}
