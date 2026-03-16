import { useEffect, useState } from "react";
import type { AwardType } from "../lib/awards.ts";

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
  useEffect(() => {
    if (!trigger) return;
    const award = detect();
    if (award) setPendingAward(award);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [trigger]);
  return [pendingAward, () => setPendingAward(null)];
}
