import type { Segment } from "@nlc-darts/engine";

/** Common interface implemented by all game-mode controllers. */
export interface GameController {
  /** Handle a dart landing on a board segment. */
  onDartHit(segment: Segment): void;
  /** Advance to the next player's turn. */
  onNextTurn(): void;
}

let activeController: GameController | null = null;

/** Set the controller that receives board input, or `null` to disable input. */
export function setActiveController(controller: GameController | null): void {
  activeController = controller;
}

/** Get the currently active game controller, if any. */
export function getActiveController(): GameController | null {
  return activeController;
}
