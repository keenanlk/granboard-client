import { Capacitor } from "@capacitor/core";

/** Default video constraints for camera requests. */
const DEFAULT_VIDEO: MediaTrackConstraints = {
  width: { ideal: 1280 },
  height: { ideal: 720 },
};

/** Discriminated union for camera selection — facingMode on native, deviceId on web. */
export type CameraSelection =
  | { kind: "facingMode"; facingMode: "user" | "environment" }
  | { kind: "deviceId"; deviceId: string };

/**
 * Request a camera stream with the given selection.
 * Merges default resolution constraints with either `facingMode` or `deviceId`.
 *
 * Throws if `navigator.mediaDevices` is unavailable (e.g. insecure HTTP context).
 */
export async function requestCamera(
  selection: CameraSelection = { kind: "facingMode", facingMode: "user" },
): Promise<MediaStream> {
  if (!navigator.mediaDevices?.getUserMedia) {
    throw new Error(
      "Camera unavailable — getUserMedia requires HTTPS or capacitor:// scheme",
    );
  }

  const videoConstraints: MediaTrackConstraints =
    selection.kind === "facingMode"
      ? { ...DEFAULT_VIDEO, facingMode: selection.facingMode }
      : { ...DEFAULT_VIDEO, deviceId: { exact: selection.deviceId } };

  return navigator.mediaDevices.getUserMedia({
    video: videoConstraints,
    audio: false,
  });
}

/** Return all video input devices. Call after a getUserMedia grant for full labels. */
export async function enumerateVideoDevices(): Promise<MediaDeviceInfo[]> {
  const devices = await navigator.mediaDevices.enumerateDevices();
  return devices.filter((d) => d.kind === "videoinput");
}

/** Stop all tracks on a MediaStream. */
export function stopAllTracks(stream: MediaStream): void {
  for (const track of stream.getTracks()) {
    track.stop();
  }
}

/** Whether the app is running inside a Capacitor native shell (iOS). */
export function isNativePlatform(): boolean {
  return Capacitor.isNativePlatform();
}
