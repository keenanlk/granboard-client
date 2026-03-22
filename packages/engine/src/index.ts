// board
export {
  SegmentID,
  SegmentSection,
  SegmentType,
  SegmentTypeToString,
  CreateSegment,
} from "./board/Dartboard.ts";
export type { Segment } from "./board/Dartboard.ts";
export {
  CLOCKWISE_NUMBERS,
  RING_RADII,
  segmentCenter,
  coordToSegmentId,
} from "./board/BoardGeometry.ts";

// engine – interfaces & types
export type { GameEngine } from "./engine/GameEngine.ts";

export { x01Engine, X01Engine } from "./engine/x01Engine.ts";
export { DEFAULT_X01_OPTIONS } from "./engine/x01.types.ts";
export type {
  X01Options,
  ThrownDart,
  Player,
  X01State,
} from "./engine/x01.types.ts";

export { cricketEngine, CricketEngine } from "./engine/cricketEngine.ts";
export {
  CRICKET_TARGETS,
  DEFAULT_CRICKET_OPTIONS,
  emptyMarks,
} from "./engine/cricket.types.ts";
export type {
  CricketTarget,
  CricketOptions,
  CricketThrownDart,
  CricketRound,
  CricketPlayer,
  CricketState,
} from "./engine/cricket.types.ts";

export { highScoreEngine, HighScoreEngine } from "./engine/highScoreEngine.ts";
export { DEFAULT_HIGHSCORE_OPTIONS } from "./engine/highScore.types.ts";
export type {
  HighScoreOptions,
  HighScoreThrownDart,
  HighScorePlayer,
  HighScoreState,
} from "./engine/highScore.types.ts";

export { atwEngine, ATWEngine } from "./engine/atwEngine.ts";
export {
  ATW_SEQUENCE,
  BULL_INDEX,
  FINISHED_INDEX,
  DEFAULT_ATW_OPTIONS,
} from "./engine/atw.types.ts";
export type {
  ATWOptions,
  ATWThrownDart,
  ATWRound,
  ATWPlayer,
  ATWState,
} from "./engine/atw.types.ts";

export {
  generateGrid,
  ticTacToeEngine,
  TicTacToeEngine,
} from "./engine/ticTacToeEngine.ts";
export { DEFAULT_TICTACTOE_OPTIONS } from "./engine/ticTacToe.types.ts";
export type {
  TicTacToeOptions,
  TicTacToeThrownDart,
  TicTacToePlayer,
  TicTacToeState,
} from "./engine/ticTacToe.types.ts";

// bot
export { Bot } from "./bot/Bot.ts";
export { BotSkill } from "./bot/bot.types.ts";
export type { BotSkill as BotSkillType } from "./bot/bot.types.ts";
export { getBotCharacter, getAllCharacters } from "./bot/botCharacters.ts";
export type { BotCharacter } from "./bot/botCharacters.ts";
export { simulateThrow } from "./bot/throwSimulator.ts";
export { x01PickTarget } from "./bot/x01Strategy.ts";
export { cricketPickTarget } from "./bot/cricketStrategy.ts";
export { highScorePickTarget } from "./bot/highScoreStrategy.ts";
export { atwPickTarget } from "./bot/atwStrategy.ts";
export { ticTacToePickTarget } from "./bot/ticTacToeStrategy.ts";
export { SINGLE_OUT_CHART } from "./bot/x01OutChart.ts";

// lib
export { getSetWinner, legCount } from "./lib/setTypes.ts";
export type {
  SetFormat,
  LegConfig,
  ThrowOrder,
  SetConfig,
  LegResult,
  SetState,
  SetProgress,
} from "./lib/setTypes.ts";

export {
  detectX01Award,
  detectCricketAward,
  detectAward,
} from "./lib/awards.ts";
export type {
  X01AwardType,
  CricketAwardType,
  AwardType,
} from "./lib/awards.ts";

// db types
export type {
  PlayerRecord,
  RecordedDart,
  RoundRecord,
  GameSessionRecord,
  X01Stats,
  CricketStats,
  HighScoreStats,
  PlayerStats,
} from "./db/db.types.ts";
