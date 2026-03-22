import { describe, it, expect, vi, beforeEach } from "vitest";
import { gameEventBus } from "../events/gameEventBus.ts";
import { CreateSegment, SegmentID } from "@nlc-darts/engine";

vi.mock("./sounds.ts", () => ({
  Sounds: {
    hit: vi.fn(),
    bull: vi.fn(),
    dbull: vi.fn(),
    triple: vi.fn(),
    double: vi.fn(),
    single: vi.fn(),
    buzzer: vi.fn(),
  },
}));

// Import after mock setup — triggers the side-effect listener registration
import { setTurnTransitioning } from "./soundEffects.ts";
import { Sounds } from "./sounds.ts";

const mockSounds = Sounds as unknown as Record<
  string,
  ReturnType<typeof vi.fn>
>;

function emitDartHit(
  segment: ReturnType<typeof CreateSegment>,
  effectiveMarks?: number,
) {
  gameEventBus.emit("dart_hit", { segment, effectiveMarks });
}

function allMocks() {
  return [
    mockSounds.hit,
    mockSounds.bull,
    mockSounds.dbull,
    mockSounds.triple,
    mockSounds.double,
    mockSounds.single,
    mockSounds.buzzer,
  ];
}

function expectOnlyCalled(fn: ReturnType<typeof vi.fn>) {
  expect(fn).toHaveBeenCalledOnce();
  for (const mock of allMocks()) {
    if (mock !== fn) expect(mock).not.toHaveBeenCalled();
  }
}

describe("soundEffects", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    setTurnTransitioning(false);
  });

  // ── X01 mode (effectiveMarks is undefined) ──

  it("X01: triple segment plays Sounds.triple()", () => {
    emitDartHit(CreateSegment(SegmentID.TRP_20));
    expectOnlyCalled(mockSounds.triple);
  });

  it("X01: single/inner segment plays Sounds.hit()", () => {
    emitDartHit(CreateSegment(SegmentID.INNER_5));
    expectOnlyCalled(mockSounds.hit);
  });

  it("X01: outer bull plays Sounds.bull()", () => {
    emitDartHit(CreateSegment(SegmentID.BULL));
    expectOnlyCalled(mockSounds.bull);
  });

  it("X01: double bull plays Sounds.dbull()", () => {
    emitDartHit(CreateSegment(SegmentID.DBL_BULL));
    expectOnlyCalled(mockSounds.dbull);
  });

  it("X01: miss (Other type) plays Sounds.buzzer()", () => {
    emitDartHit(CreateSegment(SegmentID.MISS));
    expectOnlyCalled(mockSounds.buzzer);
  });

  // ── Cricket mode (effectiveMarks is a number) ──

  it("Cricket: effectiveMarks=0 plays Sounds.hit()", () => {
    emitDartHit(CreateSegment(SegmentID.INNER_20), 0);
    expectOnlyCalled(mockSounds.hit);
  });

  it("Cricket: effectiveMarks=1 (non-bull) plays Sounds.single()", () => {
    emitDartHit(CreateSegment(SegmentID.INNER_15), 1);
    expectOnlyCalled(mockSounds.single);
  });

  it("Cricket: effectiveMarks=2 plays Sounds.double()", () => {
    emitDartHit(CreateSegment(SegmentID.DBL_17), 2);
    expectOnlyCalled(mockSounds.double);
  });

  it("Cricket: effectiveMarks=3 plays Sounds.triple()", () => {
    emitDartHit(CreateSegment(SegmentID.TRP_19), 3);
    expectOnlyCalled(mockSounds.triple);
  });

  it("Cricket: bull segment plays Sounds.bull() regardless of effectiveMarks", () => {
    emitDartHit(CreateSegment(SegmentID.BULL), 1);
    expectOnlyCalled(mockSounds.bull);
  });

  it("Cricket: double bull segment plays Sounds.dbull() regardless of effectiveMarks", () => {
    emitDartHit(CreateSegment(SegmentID.DBL_BULL), 2);
    expectOnlyCalled(mockSounds.dbull);
  });

  // ── Turn transitioning guard ──

  it("no sound is played when turnTransitioning is true", () => {
    setTurnTransitioning(true);
    emitDartHit(CreateSegment(SegmentID.TRP_20));
    emitDartHit(CreateSegment(SegmentID.BULL), 1);
    for (const mock of allMocks()) {
      expect(mock).not.toHaveBeenCalled();
    }
  });
});
