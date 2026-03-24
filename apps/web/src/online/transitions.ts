/**
 * Finite state machine transition tables for all online phase machines.
 * Invalid transitions are rejected and logged.
 */

import { logger } from "../lib/logger.ts";

const log = logger.child({ module: "fsm" });

// --- Phase type definitions ---

export const LobbyPhase = {
  offline: "offline",
  connecting: "connecting",
  online: "online",
  error: "error",
} as const;
export type LobbyPhase = (typeof LobbyPhase)[keyof typeof LobbyPhase];

export const InvitePhase = {
  idle: "idle",
  sending: "sending",
  awaiting_reply: "awaiting_reply",
  accepted: "accepted",
  declined: "declined",
  expired: "expired",
  received: "received",
} as const;
export type InvitePhase = (typeof InvitePhase)[keyof typeof InvitePhase];

export const RoomPhase = {
  idle: "idle",
  creating: "creating",
  waiting: "waiting",
  setup: "setup",
  launching: "launching",
  playing: "playing",
  finished: "finished",
  leaving: "leaving",
} as const;
export type RoomPhase = (typeof RoomPhase)[keyof typeof RoomPhase];

export const ColyseusPhase = {
  disconnected: "disconnected",
  connecting: "connecting",
  connected: "connected",
  reconnecting: "reconnecting",
  error: "error",
} as const;
export type ColyseusPhase = (typeof ColyseusPhase)[keyof typeof ColyseusPhase];

export const RematchPhase = {
  idle: "idle",
  sent: "sent",
  received: "received",
  accepted: "accepted",
  declined: "declined",
} as const;
export type RematchPhase = (typeof RematchPhase)[keyof typeof RematchPhase];

export const NextLegPhase = {
  idle: "idle",
  sent: "sent",
  opponent_ready: "opponent_ready",
  accepted: "accepted",
} as const;
export type NextLegPhase = (typeof NextLegPhase)[keyof typeof NextLegPhase];

export const TournamentPhase = {
  disconnected: "disconnected",
  connecting: "connecting",
  lobby: "lobby",
  registered: "registered",
  match_alert: "match_alert",
  ready_check: "ready_check",
  countdown: "countdown",
  playing: "playing",
  between_legs: "between_legs",
  returning: "returning",
} as const;
export type TournamentPhase =
  (typeof TournamentPhase)[keyof typeof TournamentPhase];

// --- Machine names ---

export const MachineName = {
  lobby: "lobby",
  invite: "invite",
  room: "room",
  colyseus: "colyseus",
  rematch: "rematch",
  nextLeg: "nextLeg",
  tournament: "tournament",
} as const;
export type MachineName = (typeof MachineName)[keyof typeof MachineName];

// --- Transition tables ---

type TransitionTable = Record<string, readonly string[]>;

const LOBBY_TRANSITIONS: TransitionTable = {
  offline: ["connecting"],
  connecting: ["online", "error", "offline"],
  online: ["offline"],
  error: ["offline", "connecting"],
};

const INVITE_TRANSITIONS: TransitionTable = {
  idle: ["sending", "received"],
  sending: ["awaiting_reply", "idle"],
  awaiting_reply: ["accepted", "declined", "expired", "idle"],
  accepted: ["idle"],
  declined: ["idle"],
  expired: ["idle"],
  received: ["accepted", "declined", "idle"],
};

const ROOM_TRANSITIONS: TransitionTable = {
  idle: ["creating", "waiting"],
  creating: ["waiting", "idle"],
  waiting: ["setup", "leaving", "idle"],
  setup: ["launching", "leaving"],
  launching: ["playing", "leaving", "idle"],
  playing: ["finished", "leaving"],
  finished: ["leaving", "idle"],
  leaving: ["idle"],
};

const COLYSEUS_TRANSITIONS: TransitionTable = {
  disconnected: ["connecting"],
  connecting: ["connected", "error", "disconnected"],
  connected: ["disconnected", "reconnecting"],
  reconnecting: ["connected", "error", "disconnected"],
  error: ["disconnected", "connecting"],
};

const REMATCH_TRANSITIONS: TransitionTable = {
  idle: ["sent", "received"],
  sent: ["accepted", "declined", "idle"],
  received: ["accepted", "declined", "idle"],
  accepted: ["idle"],
  declined: ["idle"],
};

const NEXT_LEG_TRANSITIONS: TransitionTable = {
  idle: ["sent", "opponent_ready"],
  sent: ["accepted", "idle"],
  opponent_ready: ["accepted", "idle"],
  accepted: ["idle"],
};

const TOURNAMENT_TRANSITIONS: TransitionTable = {
  disconnected: ["connecting"],
  connecting: ["lobby", "error", "disconnected"],
  lobby: ["registered", "disconnected"],
  registered: ["match_alert", "lobby", "disconnected"],
  match_alert: ["ready_check", "registered", "disconnected"],
  ready_check: ["countdown", "registered", "disconnected"],
  countdown: ["playing", "registered", "disconnected"],
  playing: ["between_legs", "returning", "disconnected"],
  between_legs: ["playing", "returning", "disconnected"],
  returning: ["lobby", "registered", "disconnected"],
};

const MACHINES: Record<MachineName, TransitionTable> = {
  lobby: LOBBY_TRANSITIONS,
  invite: INVITE_TRANSITIONS,
  room: ROOM_TRANSITIONS,
  colyseus: COLYSEUS_TRANSITIONS,
  rematch: REMATCH_TRANSITIONS,
  nextLeg: NEXT_LEG_TRANSITIONS,
  tournament: TOURNAMENT_TRANSITIONS,
};

/**
 * Check whether a transition from `from` to `to` is valid for the given machine.
 */
export function canTransition(
  machine: MachineName,
  from: string,
  to: string,
): boolean {
  const table = MACHINES[machine];
  if (!table) return false;
  const allowed = table[from];
  if (!allowed) return false;
  return allowed.includes(to);
}

/**
 * Attempt a state transition. Returns `to` if valid, otherwise returns `from`
 * and logs a warning.
 */
export function transition<T extends string>(
  machine: MachineName,
  from: T,
  to: T,
): T {
  if (canTransition(machine, from, to)) {
    if (import.meta.env.DEV) {
      log.debug({ machine, from, to, ts: Date.now() }, "FSM transition");
    }
    return to;
  }
  log.warn({ machine, from, to }, "Invalid FSM transition rejected");
  return from;
}
