import { create } from "zustand";
import type { Segment } from "../board/Dartboard.ts";
import type { GameEngine } from "../engine/GameEngine.ts";

const UNDO_CAP = 12;

export interface GameStoreActions<TState, TOptions> {
  startGame: (options: TOptions, playerNames: string[]) => void;
  addDart: (segment: Segment) => void;
  undoLastDart: () => void;
  nextTurn: () => void;
  resetGame: () => void;
  getSerializableState: () => TState & { undoStack: TState[] };
  restoreState: (saved: TState & { undoStack: TState[] }) => void;
}

/**
 * Creates a Zustand game store wired to a GameEngine.
 *
 * Handles undo stack, serialization, and all standard game actions so that
 * individual stores only need to supply their engine + default state.
 */
export function createGameStore<TState extends object, TOptions>(
  engine: GameEngine<TState, TOptions>,
  defaultState: TState,
) {
  type FullState = TState & { undoStack: TState[] } & GameStoreActions<
      TState,
      TOptions
    >;

  const stateKeys = Object.keys(defaultState);

  function extractSnapshot(s: FullState): TState {
    const snapshot: Record<string, unknown> = {};
    for (const key of stateKeys)
      snapshot[key] = (s as Record<string, unknown>)[key];
    return snapshot as TState;
  }

  const DEFAULT_STATE = { ...defaultState, undoStack: [] as TState[] };

  return create<FullState>()(
    (set, get) =>
      ({
        ...DEFAULT_STATE,

        startGame: (options: TOptions, playerNames: string[]) =>
          set({
            ...engine.startGame(options, playerNames),
            undoStack: [],
          } as Partial<FullState>),

        addDart: (segment: Segment) =>
          set((s) => {
            const snapshot = extractSnapshot(s);
            const undoStack = [...s.undoStack, snapshot].slice(-UNDO_CAP);
            const updates = engine.addDart(s as unknown as TState, segment);
            return { ...updates, undoStack } as Partial<FullState>;
          }),

        undoLastDart: () =>
          set((s) => {
            if (s.undoStack.length === 0) return s;
            const prev = s.undoStack[s.undoStack.length - 1];
            return {
              ...prev,
              undoStack: s.undoStack.slice(0, -1),
            } as Partial<FullState>;
          }),

        nextTurn: () =>
          set((s) => {
            const snapshot = extractSnapshot(s);
            const undoStack = [...s.undoStack, snapshot].slice(-UNDO_CAP);
            const updates = engine.nextTurn(s as unknown as TState);
            return { ...updates, undoStack } as Partial<FullState>;
          }),

        resetGame: () => set(DEFAULT_STATE as Partial<FullState>),

        getSerializableState: () => {
          const s = get();
          return { ...extractSnapshot(s), undoStack: s.undoStack };
        },

        restoreState: (saved) => set(saved as Partial<FullState>),
      }) as FullState,
  );
}
