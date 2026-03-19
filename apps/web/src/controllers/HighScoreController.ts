import type { Segment } from "@nlc-darts/engine";
import type { GameController } from "./GameController.ts";
import { gameEventBus } from "../events/gameEventBus.ts";
import { useHighScoreStore } from "../store/useHighScoreStore.ts";
import { logger } from "../lib/logger.ts";

const log = logger.child({ module: "highscore" });

export class HighScoreController implements GameController {
  onDartHit(segment: Segment): void {
    log.debug({ segment: segment.ShortName, value: segment.Value }, "Dart hit");
    useHighScoreStore.getState().addDart(segment);
    gameEventBus.emit("dart_hit", { segment });
  }

  onNextTurn(): void {
    useHighScoreStore.getState().nextTurn();
    gameEventBus.emit("next_turn", {});
  }
}
