import type { Segment } from "../board/Dartboard.ts";
import type { GameController } from "./GameController.ts";
import { gameEventBus } from "../events/gameEventBus.ts";
import { useHighScoreStore } from "../store/useHighScoreStore.ts";

export class HighScoreController implements GameController {
  onDartHit(segment: Segment): void {
    useHighScoreStore.getState().addDart(segment);
    gameEventBus.emit("dart_hit", { segment });
  }

  onNextTurn(): void {
    useHighScoreStore.getState().nextTurn();
    gameEventBus.emit("next_turn", {});
  }
}
