import { useState, useCallback, useRef } from "react";
import { startRemoveDartsCountdown } from "../board/ledEffects.ts";
import { setTurnTransitioning } from "../sound/soundEffects.ts";

const LOCAL_DELAY_MS = 5000;
const ONLINE_DELAY_MS = 2500;

/**
 * Manages the between-turn delay (remove darts countdown).
 * Call triggerDelay(afterDelay) to start the overlay + LED countdown.
 * afterDelay is called once the countdown finishes.
 *
 * @param online  When true, uses a shorter delay (2.5s) and hides the
 *                numeric countdown — only shows who's up next.
 */
export function useTurnDelay(online = false) {
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [countdown, setCountdown] = useState(5);
  const isTransitioningRef = useRef(false);

  const delayMs = online ? ONLINE_DELAY_MS : LOCAL_DELAY_MS;

  const triggerDelay = useCallback(
    (afterDelay: () => void) => {
      if (isTransitioningRef.current) return;
      isTransitioningRef.current = true;
      setIsTransitioning(true);
      setTurnTransitioning(true);
      setCountdown(online ? 0 : 5);
      startRemoveDartsCountdown(delayMs);

      if (online) {
        // Single timer — no per-second ticks, countdown stays hidden
        setTimeout(() => {
          isTransitioningRef.current = false;
          setIsTransitioning(false);
          setTurnTransitioning(false);
          afterDelay();
        }, delayMs);
      } else {
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
      }
    },
    [online, delayMs],
  );

  return { isTransitioning, countdown, triggerDelay };
}
