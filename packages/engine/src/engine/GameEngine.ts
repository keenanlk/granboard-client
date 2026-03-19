import type { Segment } from "../board/Dartboard.ts";

/**
 * Contract every game engine must implement.
 *
 * All methods are pure — they take state + inputs and return the fields that
 * changed, with zero side effects. This makes engines:
 *   - Fully testable without React or Zustand
 *   - Safe to run server-side for multiplayer
 *   - Replayable: any game can be reconstructed by replaying dart events
 *
 * @template TState   The game-specific state shape (data only, no actions).
 * @template TOptions The game-specific options/config shape.
 */
export interface GameEngine<TState, TOptions> {
  /** Create fresh initial state for a new game. */
  startGame(options: TOptions, playerNames: string[]): TState;

  /** Apply a dart throw. Returns only the fields that changed. */
  addDart(state: TState, segment: Segment): Partial<TState>;

  /** Reverse the last dart thrown in the current turn. Returns only the fields that changed. */
  undoLastDart(state: TState): Partial<TState>;

  /** Commit the current player's turn and advance to the next player. Returns only the fields that changed. */
  nextTurn(state: TState): Partial<TState>;
}
