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
