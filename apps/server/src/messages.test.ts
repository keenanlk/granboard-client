import { describe, it, expect } from "vitest";
import { ClientMessage, ServerMessage } from "./messages.ts";

describe("ClientMessage", () => {
  it("exports expected keys", () => {
    expect(Object.keys(ClientMessage).sort()).toEqual(
      [
        "DART_HIT",
        "NEXT_TURN",
        "UNDO",
        "REMATCH_REQUEST",
        "REMATCH_ACCEPT",
        "REMATCH_DECLINE",
        "REMATCH",
        "WEBRTC_SIGNAL",
        "CAMERA_STATUS",
        "CREATE_TOURNAMENT",
        "START_TOURNAMENT",
        "RECORD_RESULT",
        "REGISTER_PLAYER",
        "UNREGISTER_PLAYER",
        "READY_FOR_MATCH",
        "UNREADY_FOR_MATCH",
        "MATCH_GAME_RESULT",
        "MATCH_GAME_ROOM_READY",
        "NEXT_LEG_REQUEST",
        "NEXT_LEG_ACCEPT",
      ].sort(),
    );
  });
});

describe("ServerMessage", () => {
  it("exports expected keys", () => {
    expect(Object.keys(ServerMessage).sort()).toEqual(
      [
        "STATE_UPDATE",
        "GAME_EVENT",
        "TURN_DELAY",
        "GAME_ENDED",
        "PLAYER_LEFT",
        "REMATCH_REQUEST",
        "REMATCH_ACCEPT",
        "REMATCH_DECLINE",
        "BRACKET_UPDATE",
        "REGISTRATION_UPDATE",
        "TOURNAMENT_CREATED",
        "TOURNAMENT_ERROR",
        "MATCH_READY_STATE",
        "MATCH_COUNTDOWN",
        "MATCH_START",
        "MATCH_YOUR_TURN",
        "MATCH_GAME_ROOM_CREATED",
        "NEXT_LEG_REQUEST",
        "NEXT_LEG_ACCEPT",
      ].sort(),
    );
  });
});

describe("no duplicate values", () => {
  it("ClientMessage values are unique", () => {
    const values = Object.values(ClientMessage);
    expect(new Set(values).size).toBe(values.length);
  });

  it("ServerMessage values are unique", () => {
    const values = Object.values(ServerMessage);
    expect(new Set(values).size).toBe(values.length);
  });
});
