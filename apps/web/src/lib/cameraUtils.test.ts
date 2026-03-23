import { describe, it, expect, vi, beforeEach } from "vitest";
import { requestCamera, enumerateVideoDevices, stopAllTracks } from "./cameraUtils.ts";

const mockStream = {
  getTracks: vi.fn(() => [{ stop: vi.fn() }, { stop: vi.fn() }]),
} as unknown as MediaStream;

const mockGetUserMedia = vi.fn().mockResolvedValue(mockStream);
const mockEnumerateDevices = vi.fn().mockResolvedValue([
  { kind: "videoinput", deviceId: "cam1", label: "Front Camera" },
  { kind: "audioinput", deviceId: "mic1", label: "Mic" },
  { kind: "videoinput", deviceId: "cam2", label: "Back Camera" },
]);

beforeEach(() => {
  vi.restoreAllMocks();
  Object.defineProperty(navigator, "mediaDevices", {
    value: {
      getUserMedia: mockGetUserMedia,
      enumerateDevices: mockEnumerateDevices,
    },
    writable: true,
    configurable: true,
  });
});

describe("requestCamera", () => {
  it("requests with facingMode by default", async () => {
    await requestCamera();
    expect(mockGetUserMedia).toHaveBeenCalledWith({
      video: {
        width: { ideal: 1280 },
        height: { ideal: 720 },
        facingMode: "user",
      },
      audio: false,
    });
  });

  it("requests with environment facingMode", async () => {
    await requestCamera({ kind: "facingMode", facingMode: "environment" });
    expect(mockGetUserMedia).toHaveBeenCalledWith({
      video: expect.objectContaining({ facingMode: "environment" }),
      audio: false,
    });
  });

  it("requests with exact deviceId", async () => {
    await requestCamera({ kind: "deviceId", deviceId: "cam2" });
    expect(mockGetUserMedia).toHaveBeenCalledWith({
      video: expect.objectContaining({ deviceId: { exact: "cam2" } }),
      audio: false,
    });
  });
});

describe("enumerateVideoDevices", () => {
  it("filters to videoinput only", async () => {
    const devices = await enumerateVideoDevices();
    expect(devices).toHaveLength(2);
    expect(devices.every((d) => d.kind === "videoinput")).toBe(true);
  });
});

describe("stopAllTracks", () => {
  it("stops all tracks on the stream", () => {
    const tracks = [{ stop: vi.fn() }, { stop: vi.fn() }];
    const stream = { getTracks: () => tracks } as unknown as MediaStream;
    stopAllTracks(stream);
    expect(tracks[0].stop).toHaveBeenCalled();
    expect(tracks[1].stop).toHaveBeenCalled();
  });
});
