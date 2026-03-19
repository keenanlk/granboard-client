import type { Segment } from "@nlc-darts/engine";
import type { GameController } from "./GameController.ts";

/**
 * Wraps a GameController so that onDartHit is only forwarded when it's
 * the local player's turn. In online mode each player has their own
 * physical board — dart hits should be ignored when it's the opponent's
 * turn.
 *
 * onNextTurn is always forwarded because either player can trigger it
 * (e.g. pressing the board reset button or the UI button), and the
 * host also receives remote next-turn requests via the channel.
 *
 * @param inner        The real controller to delegate to
 * @param localIndex   The local player's index (host = 0, remote = 1)
 * @param getCurrent   Returns the current player index from the store
 */
export function guardForOnlineTurn(
  inner: GameController,
  localIndex: number,
  getCurrent: () => number,
): GameController {
  return {
    onDartHit(segment: Segment) {
      if (getCurrent() !== localIndex) return;
      inner.onDartHit(segment);
    },
    onNextTurn() {
      inner.onNextTurn();
    },
  };
}
