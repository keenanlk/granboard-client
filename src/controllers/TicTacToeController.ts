import type { Segment } from "../board/Dartboard.ts";
import type { GameController } from "./GameController.ts";
import { gameEventBus } from "../events/gameEventBus.ts";
import { useTicTacToeStore } from "../store/useTicTacToeStore.ts";

function emitOpenNumbers() {
  const { grid, owner } = useTicTacToeStore.getState();
  // Emit unclaimed grid numbers that are 1-20 (bull is not addressable via 20-byte LED)
  const numbers = grid.filter(
    (num, i) => owner[i] === null && num >= 1 && num <= 20,
  );
  gameEventBus.emit("open_numbers", { numbers });
}

export class TicTacToeController implements GameController {
  onDartHit(segment: Segment): void {
    const before = useTicTacToeStore.getState();
    useTicTacToeStore.getState().addDart(segment);
    const after = useTicTacToeStore.getState();

    // Guard: only emit if dart was registered
    if (after.currentRoundDarts.length === before.currentRoundDarts.length)
      return;

    const lastDart =
      after.currentRoundDarts[after.currentRoundDarts.length - 1];
    gameEventBus.emit("dart_hit", {
      segment,
      effectiveMarks: lastDart?.marksAdded ?? 0,
    });
    emitOpenNumbers();

    // Check for win
    if (!before.winner && after.winner) {
      gameEventBus.emit("game_won", { playerName: after.winner });
    }
  }

  onNextTurn(): void {
    useTicTacToeStore.getState().nextTurn();
    gameEventBus.emit("next_turn", {});
    emitOpenNumbers();
  }
}
