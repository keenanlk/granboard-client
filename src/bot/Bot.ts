import { BotSkill, simulateThrow } from "./throwSimulator.ts";
import { x01PickTarget } from "./x01Strategy.ts";
import { cricketPickTarget } from "./cricketStrategy.ts";
import { highScorePickTarget } from "./highScoreStrategy.ts";
import type { SegmentID } from "../board/Dartboard.ts";
import type { X01Options } from "../store/useGameStore.ts";
import type { CricketPlayer, CricketTarget } from "../store/useCricketStore.ts";

export { BotSkill };
export type { BotSkill as BotSkillType };

/**
 * A Bot player that uses a statistical Gaussian throw model to simulate realistic darts.
 *
 * Each bot has a skill level (σ in mm). The lower the σ, the tighter the grouping:
 *   - Pro (6mm): hits intended segment the vast majority of the time
 *   - Advanced (12mm): regularly hits target, occasional adjacent segment
 *   - Intermediate (25mm): frequently hits the right number but rarely the intended ring
 *   - Beginner (50mm): wide scatter, often misses the target number entirely
 *
 * Usage:
 *   const bot = new Bot("CPU", BotSkill.Intermediate);
 *   const hitSegmentId = bot.throwX01(score, opts, opened);
 *   store.addDart(CreateSegment(hitSegmentId));
 */
export class Bot {
  readonly name: string;
  readonly sigma: number;

  constructor(name: string, skill: BotSkill) {
    this.name = name;
    this.sigma = skill;
  }

  /**
   * Pick a target for X01 and simulate a throw.
   * Returns the SegmentID where the dart actually lands (may miss target).
   */
  throwX01(
    score: number,
    opts: X01Options,
    opened: boolean,
    onThrow?: (target: SegmentID, actual: SegmentID) => void,
  ): SegmentID {
    const target = x01PickTarget(score, opts, opened);
    const actual = simulateThrow(target, this.sigma);
    onThrow?.(target, actual);
    return actual;
  }

  /**
   * Pick a target for Cricket and simulate a throw.
   * Returns the SegmentID where the dart actually lands (may miss target).
   */
  throwCricket(
    myMarks: Record<CricketTarget, number>,
    allPlayers: CricketPlayer[],
    myIndex: number,
    onThrow?: (target: SegmentID, actual: SegmentID) => void,
  ): SegmentID {
    const target = cricketPickTarget(myMarks, allPlayers, myIndex);
    const actual = simulateThrow(target, this.sigma);
    onThrow?.(target, actual);
    return actual;
  }

  /**
   * Pick a target for High Score and simulate a throw.
   * Returns the SegmentID where the dart actually lands (may miss target).
   */
  throwHighScore(
    splitBull: boolean,
    onThrow?: (target: SegmentID, actual: SegmentID) => void,
  ): SegmentID {
    const target = highScorePickTarget(splitBull);
    const actual = simulateThrow(target, this.sigma);
    onThrow?.(target, actual);
    return actual;
  }
}
