import { useEffect, useRef, useState } from "react";
import type { AwardType } from "@nlc-darts/engine";

/**
 * Manages award detection state. When `trigger` flips to true, runs
 * the `detect` callback and stores the result as pendingAward.
 *
 * Returns [pendingAward, dismissAward].
 */
export function useAwardDetection(
  trigger: boolean,
  detect: () => AwardType | null,
): [AwardType | null, () => void] {
  const [pendingAward, setPendingAward] = useState<AwardType | null>(null);
  // Keep a stable ref so the effect only re-runs when `trigger` changes,
  // not every time the caller re-creates the `detect` arrow function.
  const detectRef = useRef(detect);
  useEffect(() => {
    detectRef.current = detect;
  });
  useEffect(() => {
    if (!trigger) return;
    const award = detectRef.current();
    if (award) setPendingAward(award);
  }, [trigger]);
  return [pendingAward, () => setPendingAward(null)];
}
