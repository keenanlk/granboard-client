import { useEffect } from "react";
import { getActiveController } from "../controllers/GameController.ts";
import type { Bot, Segment } from "@nlc-darts/engine";

/**
 * Drives bot turns automatically.
 *
 * When the current player is a bot:
 * - If darts remain (< 3 and not bust): fires one dart after BOT_DART_DELAY ms.
 *   Re-runs each time `dartsThrown` increments, creating a dart-by-dart cadence.
 * - If the turn is over (3 darts or bust): calls `onNextTurn` after BOT_NEXT_DELAY ms.
 *
 * `onNextTurn` and `getThrow` must be stable references (wrapped with useCallback in
 * the caller) so they can be included as effect deps without causing infinite loops.
 */

const BOT_DART_DELAY = 2000; // ms between each bot dart
const BOT_NEXT_DELAY = 2500; // ms after last dart before auto-advancing turn

export function useBotTurn({
  bots,
  currentPlayerIndex,
  dartsThrown,
  isBust,
  hasWinner,
  isTransitioning,
  onNextTurn,
  getThrow,
}: {
  /** Map of player index → Bot instance. Human players are absent from the map. */
  bots: Map<number, Bot>;
  currentPlayerIndex: number;
  dartsThrown: number;
  isBust: boolean;
  hasWinner: boolean;
  isTransitioning: boolean;
  /** Stable callback (useCallback). Reads live store state to pick and simulate the throw. */
  onNextTurn: () => void;
  /** Stable callback (useCallback). Called with the current bot; returns the segment thrown. */
  getThrow: (bot: Bot) => Segment;
}) {
  useEffect(() => {
    const bot = bots.get(currentPlayerIndex);
    if (!bot || hasWinner || isTransitioning) return;

    if (dartsThrown >= 3 || isBust) {
      // Turn is over — auto-advance after a short pause so the user can see the last dart.
      const t = setTimeout(() => {
        onNextTurn();
      }, BOT_NEXT_DELAY);
      return () => clearTimeout(t);
    }

    // Still has darts — fire the next one after a brief "thinking" delay.
    const t = setTimeout(() => {
      getActiveController()?.onDartHit(getThrow(bot));
    }, BOT_DART_DELAY);
    return () => clearTimeout(t);
  }, [
    bots,
    currentPlayerIndex,
    dartsThrown,
    isBust,
    hasWinner,
    isTransitioning,
    onNextTurn,
    getThrow,
  ]);
}
