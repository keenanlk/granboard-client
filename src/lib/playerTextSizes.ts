/**
 * Compute responsive text sizes for player strip cells based on player count.
 * Returns CSS font-size values using clamp() that scale with viewport width.
 */
export function playerTextSizes(n: number): {
  name: string;
  score: string;
  stat: string;
} {
  const div = n <= 2 ? 1 : n <= 4 ? 1.4 : n <= 6 ? 2 : 2.8;
  return {
    name: `clamp(${(0.7 / div).toFixed(2)}rem, ${(1.8 / div).toFixed(2)}vw, ${(1.5 / div).toFixed(2)}rem)`,
    score: `clamp(${(1.5 / div).toFixed(2)}rem, ${(4.0 / div).toFixed(2)}vw, ${(4.0 / div).toFixed(2)}rem)`,
    stat: `clamp(${(0.65 / div).toFixed(2)}rem, ${(1.4 / div).toFixed(2)}vw, ${(1.25 / div).toFixed(2)}rem)`,
  };
}
