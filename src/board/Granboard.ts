import { Capacitor } from "@capacitor/core";
import { CreateSegment, type Segment, SegmentID } from "./Dartboard.ts";

// Raw BLE byte sequences → SegmentID (same as original Granboard protocol)
const SEGMENT_MAPPING: Record<string, SegmentID> = {
  "50-46-51-64": SegmentID.INNER_1,
  "50-46-52-64": SegmentID.TRP_1,
  "50-46-53-64": SegmentID.OUTER_1,
  "50-46-54-64": SegmentID.DBL_1,
  "57-46-49-64": SegmentID.INNER_2,
  "57-46-48-64": SegmentID.TRP_2,
  "57-46-50-64": SegmentID.OUTER_2,
  "56-46-50-64": SegmentID.DBL_2,
  "55-46-49-64": SegmentID.INNER_3,
  "55-46-48-64": SegmentID.TRP_3,
  "55-46-50-64": SegmentID.OUTER_3,
  "56-46-52-64": SegmentID.DBL_3,
  "48-46-49-64": SegmentID.INNER_4,
  "48-46-51-64": SegmentID.TRP_4,
  "48-46-53-64": SegmentID.OUTER_4,
  "48-46-54-64": SegmentID.DBL_4,
  "53-46-49-64": SegmentID.INNER_5,
  "53-46-50-64": SegmentID.TRP_5,
  "53-46-52-64": SegmentID.OUTER_5,
  "52-46-54-64": SegmentID.DBL_5,
  "49-46-48-64": SegmentID.INNER_6,
  "49-46-49-64": SegmentID.TRP_6,
  "49-46-51-64": SegmentID.OUTER_6,
  "52-46-52-64": SegmentID.DBL_6,
  "49-49-46-49-64": SegmentID.INNER_7,
  "49-49-46-50-64": SegmentID.TRP_7,
  "49-49-46-52-64": SegmentID.OUTER_7,
  "56-46-54-64": SegmentID.DBL_7,
  "54-46-50-64": SegmentID.INNER_8,
  "54-46-52-64": SegmentID.TRP_8,
  "54-46-53-64": SegmentID.OUTER_8,
  "54-46-54-64": SegmentID.DBL_8,
  "57-46-51-64": SegmentID.INNER_9,
  "57-46-52-64": SegmentID.TRP_9,
  "57-46-53-64": SegmentID.OUTER_9,
  "57-46-54-64": SegmentID.DBL_9,
  "50-46-48-64": SegmentID.INNER_10,
  "50-46-49-64": SegmentID.TRP_10,
  "50-46-50-64": SegmentID.OUTER_10,
  "52-46-51-64": SegmentID.DBL_10,
  "55-46-51-64": SegmentID.INNER_11,
  "55-46-52-64": SegmentID.TRP_11,
  "55-46-53-64": SegmentID.OUTER_11,
  "55-46-54-64": SegmentID.DBL_11,
  "53-46-48-64": SegmentID.INNER_12,
  "53-46-51-64": SegmentID.TRP_12,
  "53-46-53-64": SegmentID.OUTER_12,
  "53-46-54-64": SegmentID.DBL_12,
  "48-46-48-64": SegmentID.INNER_13,
  "48-46-50-64": SegmentID.TRP_13,
  "48-46-52-64": SegmentID.OUTER_13,
  "52-46-53-64": SegmentID.DBL_13,
  "49-48-46-51-64": SegmentID.INNER_14,
  "49-48-46-52-64": SegmentID.TRP_14,
  "49-48-46-53-64": SegmentID.OUTER_14,
  "49-48-46-54-64": SegmentID.DBL_14,
  "51-46-48-64": SegmentID.INNER_15,
  "51-46-49-64": SegmentID.TRP_15,
  "51-46-50-64": SegmentID.OUTER_15,
  "52-46-50-64": SegmentID.DBL_15,
  "49-49-46-48-64": SegmentID.INNER_16,
  "49-49-46-51-64": SegmentID.TRP_16,
  "49-49-46-53-64": SegmentID.OUTER_16,
  "49-49-46-54-64": SegmentID.DBL_16,
  "49-48-46-49-64": SegmentID.INNER_17,
  "49-48-46-48-64": SegmentID.TRP_17,
  "49-48-46-50-64": SegmentID.OUTER_17,
  "56-46-51-64": SegmentID.DBL_17,
  "49-46-50-64": SegmentID.INNER_18,
  "49-46-52-64": SegmentID.TRP_18,
  "49-46-53-64": SegmentID.OUTER_18,
  "49-46-54-64": SegmentID.DBL_18,
  "54-46-49-64": SegmentID.INNER_19,
  "54-46-48-64": SegmentID.TRP_19,
  "54-46-51-64": SegmentID.OUTER_19,
  "56-46-53-64": SegmentID.DBL_19,
  "51-46-51-64": SegmentID.INNER_20,
  "51-46-52-64": SegmentID.TRP_20,
  "51-46-53-64": SegmentID.OUTER_20,
  "51-46-54-64": SegmentID.DBL_20,
  "56-46-48-64": SegmentID.BULL,
  "52-46-48-64": SegmentID.DBL_BULL,
  "66-84-78-64": SegmentID.RESET_BUTTON,
  "79-85-84-64": SegmentID.MISS,
};

function dispatchUID(uid: string, cb?: (segment: Segment) => void): void {
  const segmentID = SEGMENT_MAPPING[uid];
  if (segmentID !== undefined) cb?.(CreateSegment(segmentID));
}

const SERVICE_UUID = "442f1570-8a00-9a28-cbe1-e1d4212d53eb";
const DEVICE_ID_KEY = "granboard_device_id";

// ── Capacitor BLE ─────────────────────────────────────────────────────────────

let capDeviceId: string | null = null;
let capWriteCharUUID: string | null = null;
let capHitCallback: ((uid: string) => void) | null = null;
let bleInitialized = false;

async function getBleClient() {
  const { BleClient } = await import("@capacitor-community/bluetooth-le");
  return BleClient;
}

async function connectCapacitor(deviceId?: string): Promise<void> {
  console.log(
    "[BLE] connectCapacitor start",
    deviceId ? `(saved: ${deviceId})` : "(scan)",
  );
  const BleClient = await getBleClient();
  if (!bleInitialized) {
    console.log("[BLE] Initializing BleClient...");
    await BleClient.initialize();
    bleInitialized = true;
    console.log("[BLE] BleClient initialized");
  }

  let device: { deviceId: string };
  if (deviceId) {
    // Plugin requires getDevices() before connect() for known device IDs
    console.log("[BLE] Retrieving known device...");
    const known = await BleClient.getDevices([deviceId]);
    if (known.length === 0)
      throw new Error("Saved device not found via getDevices.");
    device = known[0];
    console.log("[BLE] Known device retrieved:", device.deviceId);
  } else {
    console.log("[BLE] Requesting device...");
    device = await BleClient.requestDevice({ services: [SERVICE_UUID] });
    localStorage.setItem(DEVICE_ID_KEY, device.deviceId);
    console.log("[BLE] Device selected:", device.deviceId);
  }

  console.log("[BLE] Connecting to", device.deviceId, "...");
  await BleClient.connect(device.deviceId, () => {
    console.log("[BLE] Disconnected (onDisconnect callback)");
    capDeviceId = null;
    capWriteCharUUID = null;
  });
  capDeviceId = device.deviceId;
  console.log("[BLE] Connected");

  console.log("[BLE] Discovering services...");
  const services = await BleClient.getServices(device.deviceId);
  const service = services.find(
    (s) => s.uuid.toLowerCase() === SERVICE_UUID.toLowerCase(),
  );
  if (!service) throw new Error("GranBoard service not found.");
  console.log(
    "[BLE] Service found, characteristics:",
    service.characteristics.length,
  );

  const notifyChar = service.characteristics.find((c) => c.properties.notify);
  const writeChar =
    service.characteristics.find(
      (c) => c.properties.write || c.properties.writeWithoutResponse,
    ) ?? notifyChar;

  if (!notifyChar || !writeChar)
    throw new Error("Required BLE characteristics not found.");

  capWriteCharUUID = writeChar.uuid;
  console.log(
    "[BLE] Write char:",
    capWriteCharUUID,
    "Notify char:",
    notifyChar.uuid,
  );

  await BleClient.startNotifications(
    device.deviceId,
    SERVICE_UUID,
    notifyChar.uuid,
    (value: DataView) => {
      const uid = Array.from(new Uint8Array(value.buffer)).join("-");
      capHitCallback?.(uid);
    },
  );
  console.log("[BLE] Notifications started — ready");
}

// ── Web Bluetooth API ─────────────────────────────────────────────────────────

let webWriteChar: BluetoothRemoteGATTCharacteristic | null = null;
let webHitCallback: ((uid: string) => void) | null = null;

async function connectWeb(deviceId?: string): Promise<void> {
  let device: BluetoothDevice | undefined;

  // Try to reconnect to a previously permitted device without showing the picker
  if (deviceId && "getDevices" in navigator.bluetooth) {
    const permitted = await navigator.bluetooth.getDevices();
    device = permitted.find((d) => d.id === deviceId);
  }

  if (!device) {
    device = await navigator.bluetooth.requestDevice({
      filters: [{ services: [SERVICE_UUID] }],
    });
    localStorage.setItem(DEVICE_ID_KEY, device.id);
  }

  const server = await device.gatt!.connect();
  const service = await server.getPrimaryService(SERVICE_UUID);
  const characteristics = await service.getCharacteristics();

  const notifyChar = characteristics.find((c) => c.properties.notify);
  const writeChar =
    characteristics.find(
      (c) => c.properties.write || c.properties.writeWithoutResponse,
    ) ?? notifyChar;

  if (!notifyChar || !writeChar)
    throw new Error("Required BLE characteristics not found.");

  webWriteChar = writeChar;

  await notifyChar.startNotifications();
  notifyChar.addEventListener("characteristicvaluechanged", (event) => {
    const value = (event.target as BluetoothRemoteGATTCharacteristic).value!;
    const uid = Array.from(new Uint8Array(value.buffer)).join("-");
    webHitCallback?.(uid);
  });

  device.addEventListener("gattserverdisconnected", () => {
    webWriteChar = null;
  });
}

// ── Granboard class ───────────────────────────────────────────────────────────

const isNative = Capacitor.isNativePlatform();

export class Granboard {
  public segmentHitCallback?: (segment: Segment) => void;

  constructor() {
    if (isNative) {
      capHitCallback = (uid) => dispatchUID(uid, this.segmentHitCallback);
    } else {
      webHitCallback = (uid) => dispatchUID(uid, this.segmentHitCallback);
    }
  }

  public setSegmentHitCallback(
    cb: ((segment: Segment) => void) | undefined,
  ): void {
    this.segmentHitCallback = cb;
  }

  async sendCommand(bytes: number[]): Promise<void> {
    if (isNative) {
      if (!capDeviceId || !capWriteCharUUID)
        throw new Error("Not connected to GranBoard.");
      const BleClient = await getBleClient();
      const buf = new DataView(new ArrayBuffer(bytes.length));
      bytes.forEach((b, i) => buf.setUint8(i, b));
      await BleClient.write(capDeviceId, SERVICE_UUID, capWriteCharUUID, buf);
    } else {
      if (!webWriteChar) throw new Error("Not connected to GranBoard.");
      await webWriteChar.writeValueWithoutResponse(new Uint8Array(bytes));
    }
  }

  public static async ConnectToBoard(): Promise<Granboard> {
    if (isNative) {
      await connectCapacitor();
    } else {
      await connectWeb();
    }
    return new Granboard();
  }

  public static async TryAutoReconnect(): Promise<Granboard> {
    const savedId = localStorage.getItem(DEVICE_ID_KEY) ?? undefined;
    console.log(
      "[BLE] TryAutoReconnect — platform:",
      isNative ? "native" : "web",
      "savedId:",
      savedId ?? "none",
    );
    if (isNative) {
      if (!savedId) throw new Error("No previously paired device.");
      await connectCapacitor(savedId);
    } else {
      // On web, getDevices() silently finds the device if the browser supports it
      // and the user has previously granted permission. Falls back to picker otherwise.
      await connectWeb(savedId);
    }
    return new Granboard();
  }
}
