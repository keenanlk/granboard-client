import { SegmentID } from "../board/Dartboard.ts";

// Shorthand helpers — keep the table readable
const T = (n: number): SegmentID => ((n - 1) * 4 + 1) as SegmentID; // triple
const S = (n: number): SegmentID => ((n - 1) * 4 + 2) as SegmentID; // outer single
const B = SegmentID.DBL_BULL; // bull (aim centre; both zones = 50 when split bull off)

/**
 * First-dart target for every reachable checkout in soft-tip X01 single-out (any out)
 * with split bull OFF (both bull zones score 50).
 *
 * B  = Bull  — aim DBL_BULL (centre); either zone scores 50 when split bull is off
 * T# = Triple of that number
 * S# = Outer single of that number
 *
 * Scores not present (179, 178, 176, …) have no valid checkout path within 3 darts.
 * The strategy falls back to aiming bull for those gaps.
 *
 * The bot re-evaluates this table on every dart, so only the first-dart target is
 * stored here — intermediate scores after a hit also have entries in this table.
 *
 * Source: '01 Out Chart — Soft-Tip Single Out (split bull off)
 */
export const SINGLE_OUT_CHART: Partial<Record<number, SegmentID>> = {
  // ── 3-dart checkouts (180–111) ───────────────────────────────────────────
  180: T(20), // T20 T20 T20
  177: T(20), // T20 T20 T19
  174: T(20), // T20 T19 T19
  171: T(19), // T19 T19 T19  (also T20 T20 T17)
  170: T(20), // T20 T20 B
  168: T(19), // T19 T19 T18
  167: T(20), // T20 T19 B
  165: T(19), // T19 T18 T18
  164: T(20), // T20 T18 B
  162: T(18), // T18 T18 T18  (also T20 T17 T17)
  161: T(20), // T20 T17 B
  160: B, // B   B   T20
  159: T(19), // T19 T20 T14
  158: B, // B   T20 T16
  157: B, // B   B   T19
  156: T(20), // T20 T20 D18
  155: B, // B   T20 T15
  154: B, // B   B   T18
  153: T(19), // T19 T20 D18
  152: B, // B   T20 T14
  151: B, // B   B   T17
  150: B, // B   B   B
  149: T(20), // T20 T19 D16
  148: B, // B   B   T16
  147: B, // B   T19 D20
  146: B, // B   T20 D18
  145: T(15), // T15 B   B
  144: B, // B   T18 D20
  143: B, // B   T19 D18
  142: B, // B   B   T14
  141: B, // B   T17 D20
  140: B, // B   B   D20
  139: B, // B   B   T13
  138: B, // B   B   D19
  137: B, // B   T17 D18
  136: B, // B   B   D18
  135: B, // B   T15 D20
  134: B, // B   B   D17
  133: B, // B   B   T11
  132: B, // B   B   D16
  131: B, // B   T15 D18
  130: B, // B   B   D15
  129: B, // B   T19 D11
  128: B, // B   B   D14
  127: B, // B   T19 20
  126: B, // B   B   D13
  125: B, // B   T15 D15
  124: B, // B   B   D12
  123: B, // B   T19 D8
  122: B, // B   B   D11
  121: B, // B   T17 D10
  120: B, // B   20  B
  119: B, // B   19  B
  118: B, // B   18  B
  117: B, // B   17  B
  116: B, // B   16  B
  115: B, // B   15  B
  114: B, // B   14  B
  113: B, // B   13  B
  112: B, // B   12  B
  111: B, // B   11  B

  // ── 2-dart checkouts (110–72) ─────────────────────────────────────────────
  110: T(20), // T20 B
  109: B, // B   9   B  (3 darts)
  108: B, // B   8   B
  107: T(19), // T19 B
  106: B, // B   6   B
  105: T(20), // T20 T15
  104: T(18), // T18 B
  103: B, // B   3   B
  102: B, // B   2   B
  101: B, // B   T17
  100: B, // B   B
  99: B, // B   17  D16
  98: B, // B   T16
  97: T(19), // T19 D20
  96: T(20), // T20 D18
  95: B, // B   T15
  94: T(20), // T20 D17
  93: T(19), // T19 D18
  92: B, // B   T14
  91: T(17), // T17 D20
  90: B, // B   D20
  89: B, // B   T13
  88: B, // B   D19
  87: T(17), // T17 D18
  86: B, // B   D18
  85: T(15), // T15 D20
  84: B, // B   D17
  83: B, // B   T11
  82: B, // B   D16
  81: T(15), // T15 D18
  80: B, // B   D15
  79: T(13), // T13 D20
  78: B, // B   D14
  77: T(19), // T19 D10
  76: B, // B   D13
  75: T(15), // T15 D15
  74: B, // B   D12
  73: T(19), // T19 D8
  72: B, // B   D11

  // ── Single + bull checkouts (71–61) ───────────────────────────────────────
  71: S(20), // 20  T17
  70: S(20), // 20  B
  69: S(19), // 19  B
  68: S(18), // 18  B
  67: S(17), // 17  B
  66: S(16), // 16  B
  65: S(15), // 15  B
  64: S(14), // 14  B
  63: S(13), // 13  B
  62: S(12), // 12  B
  61: S(11), // 11  B

  // ── 1-dart and 2-dart checkouts (60–41) ───────────────────────────────────
  60: T(20), // T20  (1 dart)
  59: S(9), // 9   B
  58: S(8), // 8   B
  57: T(19), // T19  (1 dart)
  56: S(16), // 16  D20
  55: S(5), // 5   B
  54: T(18), // T18  (1 dart)
  53: S(3), // 3   B
  52: S(2), // 2   B
  51: T(17), // T17  (1 dart)
  50: B, // B    (1 dart)
  49: S(17), // 17  D16
  48: T(16), // T16  (1 dart)
  47: S(15), // 15  D16
  46: S(14), // 14  D16
  45: T(15), // T15  (1 dart)
  44: S(12), // 12  D16
  43: S(11), // 11  D16
  42: T(14), // T14  (1 dart)
  41: S(9), // 9   D16
};
