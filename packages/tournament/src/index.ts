export { TournamentManager } from "./TournamentManager.ts";
export type {
  TournamentOptions,
  Tournament,
  TournamentRegistration,
  TournamentFormat,
  TournamentStatus,
  TournamentVisibility,
  TournamentFilters,
  MatchResult,
  TournamentGameConfig,
  TournamentGameType,
} from "./types.ts";
export { TOURNAMENT_FORMATS } from "./types.ts";

// Re-export key brackets-manager types for storage adapter implementors
export type { CrudInterface, Database, DataTypes, Table } from "brackets-manager";
export type {
  InputStage,
  Stage,
  Group,
  Round,
  Match,
  MatchGame,
  Participant,
  StageType,
} from "brackets-model";
export { Status } from "brackets-model";
