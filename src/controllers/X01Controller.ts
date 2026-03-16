import type { Segment } from "../board/Dartboard.ts";
import type { GameController } from "./GameController.ts";
import { gameEventBus } from "../events/gameEventBus.ts";
import { useGameStore } from "../store/useGameStore.ts";

export class X01Controller implements GameController {
  onDartHit(segment: Segment): void {
    const before = useGameStore.getState();
    useGameStore.getState().addDart(segment);
    const after = useGameStore.getState();

    // Only emit if the dart was actually registered (not ignored due to 3 already thrown)
    if (after.currentRoundDarts.length === before.currentRoundDarts.length)
      return;
    gameEventBus.emit("dart_hit", { segment });

    if (!before.isBust && after.isBust) {
      gameEventBus.emit("bust", {});
    }
    if (!before.winner && after.winner) {
      gameEventBus.emit("game_won", { playerName: after.winner });
    }
  }

  onNextTurn(): void {
    useGameStore.getState().nextTurn();
    gameEventBus.emit("next_turn", {});
  }
}
