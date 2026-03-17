/**
 * Bot Simulator — same-skill matchups to measure PPD (Points Per Dart) per level.
 *
 * Each skill level plays 1000 games against another bot of the same skill.
 * After every game, the PPD for each bot is recorded.
 * The final report shows the average PPD across all 2000 samples (1000 games × 2 bots).
 *
 * Usage:
 *   npx tsx scripts/botSim.ts
 *   npx tsx scripts/botSim.ts --games 2000
 *   npx tsx scripts/botSim.ts --mode cricket
 *   npx tsx scripts/botSim.ts --mode highscore --hs-rounds 8
 *   npx tsx scripts/botSim.ts --x01 501,doubleOut
 *
 * --games N            Games per group (default: 1000)
 * --mode x01|cricket|highscore  Game mode (default: x01)
 * --x01 SCORE[,FLAGS]  X01 options: score=301|501|701, flags: doubleIn,doubleOut,masterOut,splitBull
 * --hs-rounds N        HighScore rounds per game (default: 8)
 */

import { Bot, BotSkill } from "../src/bot/Bot";
import {
  X01Engine,
  type X01Options,
  type X01State,
} from "../src/engine/x01Engine";
import {
  CricketEngine,
  DEFAULT_CRICKET_OPTIONS,
  type CricketState,
} from "../src/engine/cricketEngine";
import {
  HighScoreEngine,
  type HighScoreOptions,
  type HighScoreState,
} from "../src/engine/highScoreEngine";
import { CreateSegment } from "../src/board/Dartboard";

// ── Argument parsing ──────────────────────────────────────────────────────────

const argv = process.argv.slice(2);

function arg(flag: string, fallback: string): string {
  const i = argv.indexOf(flag);
  return i !== -1 && argv[i + 1] ? argv[i + 1] : fallback;
}

const GAMES = parseInt(arg("--games", "1000"), 10);
const MODE = arg("--mode", "x01") as "x01" | "cricket" | "highscore";
const HS_ROUNDS = parseInt(arg("--hs-rounds", "8"), 10);

// ── X01 options ───────────────────────────────────────────────────────────────

const x01Spec = arg("--x01", "501").split(",");
const x01StartingScore = parseInt(x01Spec[0], 10) as 301 | 501 | 701;
if (![301, 501, 701].includes(x01StartingScore)) {
  console.error("X01 score must be 301, 501, or 701");
  process.exit(1);
}
const x01Options: X01Options = {
  startingScore: x01StartingScore,
  splitBull: x01Spec.includes("splitBull"),
  doubleIn: x01Spec.includes("doubleIn"),
  doubleOut: x01Spec.includes("doubleOut"),
  masterOut: x01Spec.includes("masterOut"),
};

const hsOptions: HighScoreOptions = {
  rounds: HS_ROUNDS,
  tieRule: "stand",
  splitBull: false,
};

// ── Per-game stats accumulated per bot ───────────────────────────────────────

interface BotStats {
  wins: number;
  ppdSum: number; // sum of per-game PPD values
  ppdCount: number; // number of games recorded (= GAMES when done)
}

function emptyStats(): BotStats {
  return { wins: 0, ppdSum: 0, ppdCount: 0 };
}

function avgPPD(s: BotStats): string {
  return s.ppdCount === 0 ? "–" : (s.ppdSum / s.ppdCount).toFixed(2);
}

// Combined PPD across both bots in a group (2 × GAMES samples total)
function combinedPPD(a: BotStats, b: BotStats): string {
  const total = a.ppdSum + b.ppdSum;
  const count = a.ppdCount + b.ppdCount;
  return count === 0 ? "–" : (total / count).toFixed(2);
}

// ── Engines ───────────────────────────────────────────────────────────────────

const x01Engine = new X01Engine();
const cricketEngine = new CricketEngine();
const highScoreEngine = new HighScoreEngine();

// ── Game runners ──────────────────────────────────────────────────────────────

function runX01(bots: [Bot, Bot], stats: [BotStats, BotStats]): void {
  let state: X01State = x01Engine.startGame(x01Options, [
    bots[0].name,
    bots[1].name,
  ]);

  while (!state.winner) {
    const ci = state.currentPlayerIndex;
    if (state.currentRoundDarts.length >= 3 || state.isBust) {
      state = { ...state, ...x01Engine.nextTurn(state) };
    } else {
      const player = state.players[ci];
      const segId = bots[ci].throwX01(player.score, x01Options, player.opened);
      state = { ...state, ...x01Engine.addDart(state, CreateSegment(segId)) };
    }
  }

  // Record PPD for each bot: (startingScore - remainingScore) / dartsThrown
  for (let i = 0; i < 2; i++) {
    const player = state.players[i];
    if (player.totalDartsThrown > 0) {
      const pointsScored = x01Options.startingScore - player.score;
      stats[i].ppdSum += pointsScored / player.totalDartsThrown;
      stats[i].ppdCount++;
    }
    if (bots[i].name === state.winner) stats[i].wins++;
  }
}

const CRICKET_ROUND_LIMIT = parseInt(arg("--cricket-rounds", "20"), 10);

function runCricket(bots: [Bot, Bot], stats: [BotStats, BotStats]): void {
  const cricketOpts = {
    ...DEFAULT_CRICKET_OPTIONS,
    roundLimit: CRICKET_ROUND_LIMIT,
  };
  let state: CricketState = cricketEngine.startGame(cricketOpts, [
    bots[0].name,
    bots[1].name,
  ]);

  while (!state.winner) {
    const ci = state.currentPlayerIndex;
    if (state.currentRoundDarts.length >= 3) {
      state = { ...state, ...cricketEngine.nextTurn(state) };
    } else {
      const player = state.players[ci];
      const segId = bots[ci].throwCricket(player.marks, state.players, ci);
      state = {
        ...state,
        ...cricketEngine.addDart(state, CreateSegment(segId)),
      };
    }
  }

  // Cricket MPR: marks per round = (marks earned / darts thrown) × 3
  for (let i = 0; i < 2; i++) {
    const player = state.players[i];
    if (player.totalDartsThrown > 0) {
      stats[i].ppdSum +=
        (player.totalMarksEarned / player.totalDartsThrown) * 3;
      stats[i].ppdCount++;
    }
    if (bots[i].name === state.winner) stats[i].wins++;
  }
}

function runHighScore(bots: [Bot, Bot], stats: [BotStats, BotStats]): void {
  let state: HighScoreState = highScoreEngine.startGame(hsOptions, [
    bots[0].name,
    bots[1].name,
  ]);

  while (!state.winners) {
    const ci = state.currentPlayerIndex;
    if (state.currentRoundDarts.length >= 3) {
      state = { ...state, ...highScoreEngine.nextTurn(state) };
    } else {
      const segId = bots[ci].throwHighScore(hsOptions.splitBull);
      state = {
        ...state,
        ...highScoreEngine.addDart(state, CreateSegment(segId)),
      };
    }
  }

  // HighScore PPD: total score / darts thrown
  const dartsPerGame = HS_ROUNDS * 3;
  for (let i = 0; i < 2; i++) {
    const player = state.players[i];
    stats[i].ppdSum += player.score / dartsPerGame;
    stats[i].ppdCount++;
    if (state.winners.includes(bots[i].name)) stats[i].wins++;
  }
}

// ── Skill groups ──────────────────────────────────────────────────────────────

const GROUPS: Array<{ label: string; skill: BotSkill }> = [
  { label: "BEGINNER", skill: BotSkill.Beginner },
  { label: "INTERMEDIATE", skill: BotSkill.Intermediate },
  { label: "CLUB", skill: BotSkill.Club },
  { label: "COUNTY", skill: BotSkill.County },
  { label: "ADVANCED", skill: BotSkill.Advanced },
  { label: "SEMIPRO", skill: BotSkill.SemiPro },
  { label: "PRO", skill: BotSkill.Pro },
];

// ── Run ───────────────────────────────────────────────────────────────────────

type RunMode = "x01" | "cricket" | "highscore";

function runSection(mode: RunMode): void {
  const x01Flags = [
    x01Options.doubleIn && "DoubleIn",
    x01Options.doubleOut && "DoubleOut",
    x01Options.masterOut && "MasterOut",
    x01Options.splitBull && "SplitBull",
  ]
    .filter(Boolean)
    .join(", ");

  const sectionLabel =
    mode === "x01"
      ? `X01 (${x01StartingScore}${x01Flags ? `, ${x01Flags}` : ""})`
      : mode === "highscore"
        ? `High Score (${HS_ROUNDS} rounds)`
        : "Cricket";

  const metric = mode === "cricket" ? "MPR" : "PPD";
  const metricDesc = mode === "cricket" ? "marks per round" : "points per dart";

  console.log(`\n${"═".repeat(72)}`);
  console.log(
    `  ${sectionLabel} — ${GAMES.toLocaleString()} games per skill group`,
  );
  console.log(`  Metric: ${metric} (${metricDesc})`);
  console.log(`${"═".repeat(72)}\n`);

  const colW = [16, 12, 12, 16, 10, 10];
  const line = "─".repeat(colW.reduce((a, b) => a + b) + colW.length * 2);

  console.log(
    [
      "SKILL".padEnd(colW[0]),
      `BOT A ${metric}`.padStart(colW[1]),
      `BOT B ${metric}`.padStart(colW[2]),
      `COMBINED ${metric}`.padStart(colW[3]),
      "BOT A W%".padStart(colW[4]),
      "BOT B W%".padStart(colW[5]),
    ].join("  "),
  );
  console.log(line);

  for (const { label, skill } of GROUPS) {
    const bots: [Bot, Bot] = [
      new Bot(`${label}_A`, skill),
      new Bot(`${label}_B`, skill),
    ];
    const stats: [BotStats, BotStats] = [emptyStats(), emptyStats()];

    for (let i = 0; i < GAMES; i++) {
      if (mode === "cricket") runCricket(bots, stats);
      else if (mode === "highscore") runHighScore(bots, stats);
      else runX01(bots, stats);
    }

    const winPct = (wins: number) => `${((wins / GAMES) * 100).toFixed(1)}%`;

    console.log(
      [
        label.padEnd(colW[0]),
        avgPPD(stats[0]).padStart(colW[1]),
        avgPPD(stats[1]).padStart(colW[2]),
        combinedPPD(stats[0], stats[1]).padStart(colW[3]),
        winPct(stats[0].wins).padStart(colW[4]),
        winPct(stats[1].wins).padStart(colW[5]),
      ].join("  "),
    );
  }

  console.log(
    `\n  (${(GAMES * 2).toLocaleString()} ${metric} samples per skill level)`,
  );
}

// Default: run X01 and Cricket. Pass --mode highscore to run that instead.
if (MODE === "highscore") {
  runSection("highscore");
} else {
  runSection("x01");
  runSection("cricket");
}
console.log();
