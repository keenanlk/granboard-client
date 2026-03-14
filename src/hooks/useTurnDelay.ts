import { useState, useCallback, useRef } from "react";
import { startRemoveDartsCountdown } from "../board/ledEffects.ts";
import { setTurnTransitioning } from "../sound/soundEffects.ts";

const DELAY_MS = 5000;

/**
 * Manages the between-turn delay (remove darts countdown).
 * Call triggerDelay(afterDelay) to start the overlay + LED countdown.
 * afterDelay is called once the countdown finishes.
 */
export function useTurnDelay() {
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [countdown, setCountdown] = useState(5);
  const isTransitioningRef = useRef(false);

  const triggerDelay = useCallback((afterDelay: () => void) => {
    if (isTransitioningRef.current) return;
    isTransitioningRef.current = true;
    setIsTransitioning(true);
    setTurnTransitioning(true);
    setCountdown(5);
    startRemoveDartsCountdown(DELAY_MS);

    let n = 4;
    const tick = setInterval(() => {
      setCountdown(n);
      n--;
      if (n < 0) {
        clearInterval(tick);
        isTransitioningRef.current = false;
        setIsTransitioning(false);
        setTurnTransitioning(false);
        afterDelay();
      }
    }, 1000);
  }, []);

  return { isTransitioning, countdown, triggerDelay };
}
