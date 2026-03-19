import { SegmentID } from "../board/Dartboard.ts";
import type { CricketPlayer, CricketTarget } from "../engine/cricket.types.ts";

// Cricket targets in closing order — 20 first (most scoring value), bull last.
// Bull is last because scoring on it earns only 25/mark (less than T20=60) and
// it's the hardest target to hit consistently; real players save it for endgame.
const TARGETS: CricketTarget[] = [20, 19, 18, 17, 16, 15, 25];

// Strategic priority value used for weighting closure/denial/scoring decisions.
// Bull uses 14 (below 15) so it is always last priority, matching standard strategy.
function strategyValue(t: CricketTarget): number {
  return t === 25 ? 14 : t;
}

function tripleFor(n: number): SegmentID {
  return ((n - 1) * 4 + 1) as SegmentID;
}

// ── Game-state helpers ────────────────────────────────────────────────────────

function myScore(players: CricketPlayer[], myIndex: number): number {
  return players[myIndex].score;
}

function bestOpponentScore(players: CricketPlayer[], myIndex: number): number {
  return Math.max(
    ...players.filter((_, i) => i !== myIndex).map((p) => p.score),
  );
}

/** True if I have this target closed (≥3 marks) */
function iClosed(
  myMarks: Record<CricketTarget, number>,
  t: CricketTarget,
): boolean {
  return myMarks[t] >= 3;
}

/** True if every opponent has this target closed */
function allOpponentsClosed(
  players: CricketPlayer[],
  myIndex: number,
  t: CricketTarget,
): boolean {
  return players.every((p, i) => i === myIndex || p.marks[t] >= 3);
}

/** True if at least one opponent is still open on this target */
function opponentOpen(
  players: CricketPlayer[],
  myIndex: number,
  t: CricketTarget,
): boolean {
  return players.some((p, i) => i !== myIndex && p.marks[t] < 3);
}

/**
 * Scoring potential per dart for a target I own against at least one open opponent.
 * Returns 0 if I can't score on it.
 */
function scoringValue(
  myMarks: Record<CricketTarget, number>,
  players: CricketPlayer[],
  myIndex: number,
  t: CricketTarget,
): number {
  if (!iClosed(myMarks, t)) return 0; // I haven't closed it yet
  if (!opponentOpen(players, myIndex, t)) return 0; // no one to score on
  return strategyValue(t); // face value (aim triple = 3× in practice)
}

/**
 * How urgently do I need to close this target?
 * High when at least one opponent HAS it closed and I haven't — they are actively scoring on me.
 */
function denialUrgency(
  myMarks: Record<CricketTarget, number>,
  players: CricketPlayer[],
  myIndex: number,
  t: CricketTarget,
): number {
  if (iClosed(myMarks, t)) return 0; // already closed, no longer at risk
  if (!allOpponentsClosed(players, myIndex, t)) return 0; // no opponent has closed it yet — can't score on me
  // Scale by progress: 0 marks = 1/3 urgency, 1 mark = 2/3, 2 marks = full.
  // Mirrors the closure value formula — rewards finishing what you started.
  return (strategyValue(t) * (1 + myMarks[t])) / 3;
}

// ── Mode weights ──────────────────────────────────────────────────────────────

interface Weights {
  scoring: number; // value of scoring points on a number I own
  closure: number; // value of progressing toward closing a number
  denial: number; // value of closing a number the opponent can score on
}

const RACE_WEIGHTS: Weights = { scoring: 1.0, closure: 1.5, denial: 1.8 };
const CATCHUP_WEIGHTS: Weights = { scoring: 2.0, closure: 2.0, denial: 0.5 }; // scoring lanes >> denial when far behind
const LOCKDOWN_WEIGHTS: Weights = { scoring: 0.5, closure: 2.0, denial: 2.0 }; // stop farming; close/deny to end the game

const CATCHUP_THRESHOLD = 20; // points behind to enter catch-up mode
const LOCKDOWN_THRESHOLD = 25; // points ahead to enter lockdown mode

// ── Strategy ──────────────────────────────────────────────────────────────────

/**
 * Cricket targeting strategy with three game-state modes.
 *
 * Catch-up mode (behind ≥40):  prioritise scoring on numbers I already own
 * Race mode (score close):     balanced — close high numbers, deny threats
 * Lockdown mode (ahead ≥25):   deny opponent comeback lanes aggressively
 *
 * For each candidate target a weighted score is computed combining:
 *   - scoringValue:  points I can earn per dart right now
 *   - closureValue:  marks still needed to close (progress + eventual scoring)
 *   - denialValue:   urgency of shutting down opponent's scoring lane
 *
 * The highest-scoring candidate wins.
 */
export function cricketPickTarget(
  myMarks: Record<CricketTarget, number>,
  allPlayers: CricketPlayer[],
  myIndex: number,
  cutThroat?: boolean,
): SegmentID {
  const rawDiff =
    myScore(allPlayers, myIndex) - bestOpponentScore(allPlayers, myIndex);
  // In cut-throat, lower score is better — invert the diff so mode selection works correctly
  const scoreDiff = cutThroat ? -rawDiff : rawDiff;

  const weights =
    scoreDiff <= -CATCHUP_THRESHOLD
      ? CATCHUP_WEIGHTS
      : scoreDiff >= LOCKDOWN_THRESHOLD
        ? LOCKDOWN_WEIGHTS
        : RACE_WEIGHTS;

  let bestTarget: CricketTarget = TARGETS[0];
  let bestScore = -Infinity;

  for (const t of TARGETS) {
    // Skip targets that are fully settled (I'm closed and so is every opponent)
    if (iClosed(myMarks, t) && allOpponentsClosed(allPlayers, myIndex, t))
      continue;

    const sv = scoringValue(myMarks, allPlayers, myIndex, t);
    const dv = denialUrgency(myMarks, allPlayers, myIndex, t);

    // Closure value: represents progress toward closing as a future SCORING LANE.
    // Zero when already closed, or when all opponents are already closed on this target —
    // in that case the only incentive is denial, which dv already captures. Giving cv
    // on top would double-count denial targets and make them crowd out real scoring lanes.
    const cv =
      iClosed(myMarks, t) || allOpponentsClosed(allPlayers, myIndex, t)
        ? 0
        : (strategyValue(t) * (1 + myMarks[t])) / 3;

    const score =
      sv * weights.scoring + cv * weights.closure + dv * weights.denial;

    if (score > bestScore) {
      bestScore = score;
      bestTarget = t;
    }
  }

  return bestTarget === 25 ? SegmentID.DBL_BULL : tripleFor(bestTarget);
}
