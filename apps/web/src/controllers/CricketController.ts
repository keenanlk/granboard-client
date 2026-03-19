import { CRICKET_TARGETS } from "@nlc-darts/engine";
import type { Segment } from "@nlc-darts/engine";
import type { GameController } from "./GameController.ts";
import { gameEventBus } from "../events/gameEventBus.ts";
import { useCricketStore } from "../store/useCricketStore.ts";
import { logger } from "../lib/logger.ts";

const log = logger.child({ module: "cricket" });

function emitOpenNumbers(): void {
  const { players } = useCricketStore.getState();
  const openNumbers = CRICKET_TARGETS.filter(
    (t) => !players.every((p) => p.marks[t] >= 3),
  );
  gameEventBus.emit("open_numbers", { numbers: openNumbers });
}

export class CricketController implements GameController {
  onDartHit(segment: Segment): void {
    const before = useCricketStore.getState();
    useCricketStore.getState().addDart(segment);
    const after = useCricketStore.getState();

    // Only emit if the dart was actually registered (not ignored due to 3 already thrown)
    if (after.currentRoundDarts.length === before.currentRoundDarts.length)
      return;
    const lastDart =
      after.currentRoundDarts[after.currentRoundDarts.length - 1];
    log.debug({ segment: segment.ShortName, value: segment.Value }, "Dart hit");
    gameEventBus.emit("dart_hit", {
      segment,
      effectiveMarks: lastDart?.effectiveMarks,
    });
    emitOpenNumbers();

    if (!before.winner && after.winner) {
      log.info({ winner: after.winner }, "Game won");
      gameEventBus.emit("game_won", { playerName: after.winner });
    }
  }

  onNextTurn(): void {
    useCricketStore.getState().nextTurn();
    gameEventBus.emit("next_turn", {});
    emitOpenNumbers();
  }
}
