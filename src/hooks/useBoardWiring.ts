import { useEffect } from "react";
import { SegmentID } from "../board/Dartboard.ts";
import { useGranboardStore } from "../store/useGranboardStore.ts";
import { getActiveController } from "../controllers/GameController.ts";
import type { Granboard } from "../board/Granboard.ts";

function attachCallback(board: Granboard): void {
  board.setSegmentHitCallback((segment) => {
    if (segment.ID === SegmentID.RESET_BUTTON) {
      getActiveController()?.onNextTurn();
    } else {
      getActiveController()?.onDartHit(segment);
    }
  });
}

export function useBoardWiring(): void {
  useEffect(() => {
    // Wire board that is already connected
    const { board } = useGranboardStore.getState();
    if (board) attachCallback(board);

    // Wire any board that connects in the future
    return useGranboardStore.subscribe((state, prev) => {
      if (state.board && state.board !== prev.board) {
        attachCallback(state.board);
      }
    });
  }, []);
}
