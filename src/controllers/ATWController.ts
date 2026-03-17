import type { Segment } from "../board/Dartboard.ts";
import type { GameController } from "./GameController.ts";
import { gameEventBus } from "../events/gameEventBus.ts";
import { useATWStore } from "../store/useATWStore.ts";

function emitOpenNumbers(): void {
  const { players, currentPlayerIndex } = useATWStore.getState();
  const player = players[currentPlayerIndex];
  if (!player || player.finished) {
    gameEventBus.emit("open_numbers", { numbers: [] });
    return;
  }
  // Bull (25) is not addressable via the 20-byte LED command, so only emit 1-20
  const target = player.currentTarget;
  const numbers = target <= 20 ? [target] : [];
  gameEventBus.emit("open_numbers", { numbers });
}

export class ATWController implements GameController {
  onDartHit(segment: Segment): void {
    const before = useATWStore.getState();
    useATWStore.getState().addDart(segment);
    const after = useATWStore.getState();

    if (after.currentRoundDarts.length === before.currentRoundDarts.length)
      return;

    const lastDart =
      after.currentRoundDarts[after.currentRoundDarts.length - 1];
    gameEventBus.emit("dart_hit", {
      segment,
      effectiveMarks: lastDart.hit ? 1 : 0,
    });
    emitOpenNumbers();

    // Check if a player just finished
    const ci = after.currentPlayerIndex;
    if (!before.players[ci].finished && after.players[ci].finished) {
      gameEventBus.emit("game_won", { playerName: after.players[ci].name });
    }
  }

  onNextTurn(): void {
    useATWStore.getState().nextTurn();
    gameEventBus.emit("next_turn", {});
    emitOpenNumbers();
  }
}
