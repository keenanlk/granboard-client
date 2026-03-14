import type { Segment } from "../board/Dartboard.ts";

export interface GameController {
  onDartHit(segment: Segment): void;
  onNextTurn(): void;
}

let activeController: GameController | null = null;

export function setActiveController(controller: GameController | null): void {
  activeController = controller;
}

export function getActiveController(): GameController | null {
  return activeController;
}
