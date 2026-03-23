import { render } from "vitest-browser-react";
import { page } from "vitest/browser";
import { describe, it, expect, vi, beforeEach } from "vitest";
import "../index.css";
import { CameraPreview } from "./CameraPreview.tsx";

// ── Mocks ────────────────────────────────────────────────────────────────

const mockStream = () => {
  const track = {
    stop: vi.fn(),
    kind: "video",
    getSettings: () => ({ deviceId: "cam1" }),
  };
  return {
    getTracks: () => [track],
    getVideoTracks: () => [track],
    _track: track,
  } as unknown as MediaStream;
};

vi.mock("../lib/cameraUtils.ts", () => ({
  requestCamera: vi
    .fn()
    .mockImplementation(() => Promise.resolve(mockStream())),
  enumerateVideoDevices: vi.fn().mockResolvedValue([
    { kind: "videoinput", deviceId: "cam1", label: "Front Camera" },
    { kind: "videoinput", deviceId: "cam2", label: "Back Camera" },
  ]),
  stopAllTracks: vi.fn(),
  isNativePlatform: vi.fn().mockReturnValue(false),
}));

import {
  requestCamera,
  stopAllTracks,
  isNativePlatform,
} from "../lib/cameraUtils.ts";

beforeEach(() => {
  vi.clearAllMocks();
});

// ── Tests ────────────────────────────────────────────────────────────────

describe("CameraPreview", () => {
  it("renders ask step initially", async () => {
    render(<CameraPreview onConfirm={vi.fn()} onSkip={vi.fn()} />);
    await expect.element(page.getByText("Enable Camera?")).toBeVisible();
    await expect
      .element(page.getByRole("button", { name: "Enable" }))
      .toBeVisible();
    await expect
      .element(page.getByRole("button", { name: "Skip" }))
      .toBeVisible();
  });

  it("calls onSkip when Skip is clicked", async () => {
    const onSkip = vi.fn();
    render(<CameraPreview onConfirm={vi.fn()} onSkip={onSkip} />);
    await page.getByText("Skip").click();
    expect(onSkip).toHaveBeenCalled();
  });

  it("transitions to preview step on Enable", async () => {
    render(<CameraPreview onConfirm={vi.fn()} onSkip={vi.fn()} />);
    await page.getByRole("button", { name: "Enable" }).click();
    await expect.element(page.getByText("Camera Preview")).toBeVisible();
    expect(requestCamera).toHaveBeenCalledWith({
      kind: "facingMode",
      facingMode: "user",
    });
  });

  it("shows error when camera permission denied", async () => {
    vi.mocked(requestCamera).mockRejectedValueOnce(
      new Error("NotAllowedError"),
    );
    render(<CameraPreview onConfirm={vi.fn()} onSkip={vi.fn()} />);
    await page.getByRole("button", { name: "Enable" }).click();
    await expect
      .element(
        page.getByText("Camera access denied. Check your browser permissions."),
      )
      .toBeVisible();
  });

  it("calls onConfirm with stream when Confirm is clicked", async () => {
    const onConfirm = vi.fn();
    render(<CameraPreview onConfirm={onConfirm} onSkip={vi.fn()} />);
    await page.getByRole("button", { name: "Enable" }).click();
    await expect.element(page.getByText("Confirm")).toBeVisible();
    await page.getByText("Confirm").click();
    expect(onConfirm).toHaveBeenCalledWith(expect.any(Object));
    expect(stopAllTracks).not.toHaveBeenCalled();
  });

  it("stops tracks and returns to ask step on Back", async () => {
    render(<CameraPreview onConfirm={vi.fn()} onSkip={vi.fn()} />);
    await page.getByRole("button", { name: "Enable" }).click();
    await expect
      .element(page.getByRole("button", { name: "Back" }))
      .toBeVisible();
    await page.getByRole("button", { name: "Back" }).click();
    expect(stopAllTracks).toHaveBeenCalled();
    await expect.element(page.getByText("Enable Camera?")).toBeVisible();
  });

  it("shows dropdown for web with multiple cameras", async () => {
    vi.mocked(isNativePlatform).mockReturnValue(false);
    render(<CameraPreview onConfirm={vi.fn()} onSkip={vi.fn()} />);
    await page.getByRole("button", { name: "Enable" }).click();
    await expect.element(page.getByRole("combobox")).toBeVisible();
  });

  it("shows flip button on native platform", async () => {
    vi.mocked(isNativePlatform).mockReturnValue(true);
    render(<CameraPreview onConfirm={vi.fn()} onSkip={vi.fn()} />);
    await page.getByRole("button", { name: "Enable" }).click();
    await expect.element(page.getByText("Flip")).toBeVisible();
  });

  it("flips camera on native when Flip is clicked", async () => {
    vi.mocked(isNativePlatform).mockReturnValue(true);
    render(<CameraPreview onConfirm={vi.fn()} onSkip={vi.fn()} />);
    await page.getByRole("button", { name: "Enable" }).click();
    await expect.element(page.getByText("Flip")).toBeVisible();
    await page.getByText("Flip").click();

    expect(stopAllTracks).toHaveBeenCalled();
    expect(requestCamera).toHaveBeenCalledWith({
      kind: "facingMode",
      facingMode: "environment",
    });
  });
});
