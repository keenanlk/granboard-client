import type { StageType } from "brackets-model";
import type { X01Options, CricketOptions, SetFormat } from "@nlc-darts/engine";

export type TournamentFormat = StageType;

export const TOURNAMENT_FORMATS = [
  "single_elimination",
  "double_elimination",
  "round_robin",
] as const satisfies readonly TournamentFormat[];

export type TournamentStatus =
  | "registration"
  | "in_progress"
  | "completed"
  | "cancelled";

export type TournamentVisibility = "public" | "private";

export interface TournamentOptions {
  name: string;
  format: TournamentFormat;
  visibility: TournamentVisibility;
  scheduledAt: Date | null;
  registrationDeadline: Date | null;
  maxParticipants: number | null;
  createdBy: string;
}

export interface Tournament {
  id: string;
  name: string;
  format: TournamentFormat;
  visibility: TournamentVisibility;
  status: TournamentStatus;
  joinCode: string;
  createdBy: string;
  scheduledAt: string | null;
  registrationDeadline: string | null;
  maxParticipants: number | null;
  createdAt: string;
  gameSettings: TournamentGameConfig | null;
}

export interface TournamentRegistration {
  id: string;
  tournamentId: string;
  userId: string;
  registeredAt: string;
}

export interface TournamentFilters {
  format?: TournamentFormat;
  status?: TournamentStatus;
  search?: string;
}

export interface MatchResult {
  opponent1Score: number;
  opponent2Score: number;
}

export type TournamentGameType = "x01" | "cricket";

export interface TournamentGameConfig {
  gameType: TournamentGameType;
  bestOf: SetFormat;
  throwOrder: "loser" | "alternate";
  x01Options?: X01Options;
  cricketOptions?: CricketOptions;
}
