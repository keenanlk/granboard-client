import { describe, it, expect, vi } from "vitest";
import { canTransition, transition } from "./transitions.ts";

// Mock the logger
vi.mock("../lib/logger.ts", () => ({
  logger: {
    child: () => ({
      debug: vi.fn(),
      warn: vi.fn(),
      error: vi.fn(),
      info: vi.fn(),
    }),
  },
}));

describe("canTransition", () => {
  describe("lobby", () => {
    it("allows offline -> connecting", () => {
      expect(canTransition("lobby", "offline", "connecting")).toBe(true);
    });
    it("allows connecting -> online", () => {
      expect(canTransition("lobby", "connecting", "online")).toBe(true);
    });
    it("allows connecting -> error", () => {
      expect(canTransition("lobby", "connecting", "error")).toBe(true);
    });
    it("allows online -> offline", () => {
      expect(canTransition("lobby", "online", "offline")).toBe(true);
    });
    it("allows error -> offline", () => {
      expect(canTransition("lobby", "error", "offline")).toBe(true);
    });
    it("rejects offline -> online (must go through connecting)", () => {
      expect(canTransition("lobby", "offline", "online")).toBe(false);
    });
    it("rejects online -> error", () => {
      expect(canTransition("lobby", "online", "error")).toBe(false);
    });
  });

  describe("invite", () => {
    it("allows idle -> sending", () => {
      expect(canTransition("invite", "idle", "sending")).toBe(true);
    });
    it("allows idle -> received", () => {
      expect(canTransition("invite", "idle", "received")).toBe(true);
    });
    it("allows sending -> awaiting_reply", () => {
      expect(canTransition("invite", "sending", "awaiting_reply")).toBe(true);
    });
    it("allows awaiting_reply -> accepted", () => {
      expect(canTransition("invite", "awaiting_reply", "accepted")).toBe(true);
    });
    it("allows awaiting_reply -> expired", () => {
      expect(canTransition("invite", "awaiting_reply", "expired")).toBe(true);
    });
    it("allows received -> accepted", () => {
      expect(canTransition("invite", "received", "accepted")).toBe(true);
    });
    it("allows received -> declined", () => {
      expect(canTransition("invite", "received", "declined")).toBe(true);
    });
    it("rejects idle -> accepted", () => {
      expect(canTransition("invite", "idle", "accepted")).toBe(false);
    });
  });

  describe("room", () => {
    it("allows idle -> creating", () => {
      expect(canTransition("room", "idle", "creating")).toBe(true);
    });
    it("allows creating -> waiting", () => {
      expect(canTransition("room", "creating", "waiting")).toBe(true);
    });
    it("allows setup -> launching", () => {
      expect(canTransition("room", "setup", "launching")).toBe(true);
    });
    it("allows any state -> leaving when applicable", () => {
      expect(canTransition("room", "waiting", "leaving")).toBe(true);
      expect(canTransition("room", "setup", "leaving")).toBe(true);
      expect(canTransition("room", "playing", "leaving")).toBe(true);
    });
    it("allows leaving -> idle", () => {
      expect(canTransition("room", "leaving", "idle")).toBe(true);
    });
    it("rejects idle -> playing", () => {
      expect(canTransition("room", "idle", "playing")).toBe(false);
    });
  });

  describe("colyseus", () => {
    it("allows disconnected -> connecting", () => {
      expect(canTransition("colyseus", "disconnected", "connecting")).toBe(
        true,
      );
    });
    it("allows connecting -> connected", () => {
      expect(canTransition("colyseus", "connecting", "connected")).toBe(true);
    });
    it("allows connected -> reconnecting", () => {
      expect(canTransition("colyseus", "connected", "reconnecting")).toBe(true);
    });
    it("allows reconnecting -> connected", () => {
      expect(canTransition("colyseus", "reconnecting", "connected")).toBe(true);
    });
    it("allows reconnecting -> error", () => {
      expect(canTransition("colyseus", "reconnecting", "error")).toBe(true);
    });
    it("rejects disconnected -> connected (must go through connecting)", () => {
      expect(canTransition("colyseus", "disconnected", "connected")).toBe(
        false,
      );
    });
  });

  describe("rematch", () => {
    it("allows idle -> sent", () => {
      expect(canTransition("rematch", "idle", "sent")).toBe(true);
    });
    it("allows idle -> received", () => {
      expect(canTransition("rematch", "idle", "received")).toBe(true);
    });
    it("allows sent -> accepted", () => {
      expect(canTransition("rematch", "sent", "accepted")).toBe(true);
    });
    it("allows received -> declined", () => {
      expect(canTransition("rematch", "received", "declined")).toBe(true);
    });
    it("allows accepted -> idle", () => {
      expect(canTransition("rematch", "accepted", "idle")).toBe(true);
    });
    it("rejects idle -> accepted", () => {
      expect(canTransition("rematch", "idle", "accepted")).toBe(false);
    });
  });

  describe("nextLeg", () => {
    it("allows idle -> sent", () => {
      expect(canTransition("nextLeg", "idle", "sent")).toBe(true);
    });
    it("allows idle -> opponent_ready", () => {
      expect(canTransition("nextLeg", "idle", "opponent_ready")).toBe(true);
    });
    it("allows sent -> accepted", () => {
      expect(canTransition("nextLeg", "sent", "accepted")).toBe(true);
    });
    it("allows opponent_ready -> accepted", () => {
      expect(canTransition("nextLeg", "opponent_ready", "accepted")).toBe(true);
    });
    it("rejects idle -> accepted", () => {
      expect(canTransition("nextLeg", "idle", "accepted")).toBe(false);
    });
  });

  describe("tournament", () => {
    it("allows disconnected -> connecting", () => {
      expect(canTransition("tournament", "disconnected", "connecting")).toBe(
        true,
      );
    });
    it("allows connecting -> lobby", () => {
      expect(canTransition("tournament", "connecting", "lobby")).toBe(true);
    });
    it("allows lobby -> registered", () => {
      expect(canTransition("tournament", "lobby", "registered")).toBe(true);
    });
    it("allows registered -> match_alert", () => {
      expect(canTransition("tournament", "registered", "match_alert")).toBe(
        true,
      );
    });
    it("allows countdown -> playing", () => {
      expect(canTransition("tournament", "countdown", "playing")).toBe(true);
    });
    it("allows playing -> between_legs", () => {
      expect(canTransition("tournament", "playing", "between_legs")).toBe(true);
    });
    it("allows returning -> lobby", () => {
      expect(canTransition("tournament", "returning", "lobby")).toBe(true);
    });
    it("rejects disconnected -> playing", () => {
      expect(canTransition("tournament", "disconnected", "playing")).toBe(
        false,
      );
    });
  });
});

describe("transition", () => {
  it("returns the new state on valid transition", () => {
    expect(transition("lobby", "offline", "connecting")).toBe("connecting");
  });

  it("returns the current state on invalid transition", () => {
    expect(transition("lobby", "offline", "online")).toBe("offline");
  });

  it("handles unknown machine gracefully", () => {
    expect(transition("nonexistent" as "lobby", "offline", "connecting")).toBe(
      "offline",
    );
  });
});
