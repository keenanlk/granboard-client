import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { SegmentID, CreateSegment } from "@nlc-darts/engine";

// ── Mock logger ─────────────────────────────────────────────────────────────
vi.mock("../lib/logger.ts", () => ({
  logger: {
    child: () => ({
      info: vi.fn(),
      debug: vi.fn(),
      warn: vi.fn(),
      error: vi.fn(),
    }),
  },
}));

// ── Mock localStorage ───────────────────────────────────────────────────────
const mockStorage = new Map<string, string>();
vi.stubGlobal("localStorage", {
  getItem: (key: string) => mockStorage.get(key) ?? null,
  setItem: (key: string, value: string) => mockStorage.set(key, value),
  removeItem: (key: string) => mockStorage.delete(key),
});

// ── BLE mock helpers ────────────────────────────────────────────────────────

const mockBleClient = {
  initialize: vi.fn().mockResolvedValue(undefined),
  requestDevice: vi.fn(),
  getDevices: vi.fn(),
  connect: vi.fn().mockResolvedValue(undefined),
  getServices: vi.fn(),
  startNotifications: vi.fn().mockResolvedValue(undefined),
  write: vi.fn().mockResolvedValue(undefined),
};

vi.mock("@capacitor-community/bluetooth-le", () => ({
  BleClient: mockBleClient,
}));

const SERVICE_UUID = "442f1570-8a00-9a28-cbe1-e1d4212d53eb";

function setupCapacitorBleDevice(deviceId = "cap-device-1") {
  mockBleClient.requestDevice.mockResolvedValue({ deviceId });
  mockBleClient.getDevices.mockResolvedValue([{ deviceId }]);
  mockBleClient.getServices.mockResolvedValue([
    {
      uuid: SERVICE_UUID,
      characteristics: [
        {
          uuid: "notify-char",
          properties: {
            notify: true,
            write: false,
            writeWithoutResponse: false,
          },
        },
        {
          uuid: "write-char",
          properties: {
            notify: false,
            write: true,
            writeWithoutResponse: true,
          },
        },
      ],
    },
  ]);
}

function setupWebBluetoothDevice() {
  let notificationHandler: ((event: unknown) => void) | null = null;
  const writeFn = vi.fn().mockResolvedValue(undefined);

  const notifyChar = {
    properties: { notify: true, write: false, writeWithoutResponse: false },
    startNotifications: vi.fn().mockResolvedValue(undefined),
    addEventListener: vi.fn(
      (type: string, handler: (event: unknown) => void) => {
        if (type === "characteristicvaluechanged")
          notificationHandler = handler;
      },
    ),
    uuid: "notify-uuid",
  };
  const writeChar = {
    properties: { notify: false, write: true, writeWithoutResponse: true },
    writeValueWithoutResponse: writeFn,
    uuid: "write-uuid",
  };

  const service = {
    getCharacteristics: vi.fn().mockResolvedValue([notifyChar, writeChar]),
  };
  const server = {
    getPrimaryService: vi.fn().mockResolvedValue(service),
  };
  const device = {
    id: "web-device-1",
    gatt: { connect: vi.fn().mockResolvedValue(server) },
    addEventListener: vi.fn(),
  };

  Object.defineProperty(navigator, "bluetooth", {
    value: {
      requestDevice: vi.fn().mockResolvedValue(device),
      getDevices: vi.fn().mockResolvedValue([]),
    },
    configurable: true,
  });

  return {
    device,
    writeFn,
    getNotificationHandler: () => notificationHandler,
  };
}

// ── Tests: Web Bluetooth path ────────────────────────────────────────────────

let originalBluetooth: unknown;

beforeEach(() => {
  mockStorage.clear();
  originalBluetooth = navigator.bluetooth;
  Object.values(mockBleClient).forEach((fn) => {
    if (typeof fn === "function" && "mockClear" in fn) fn.mockClear();
  });
});

afterEach(() => {
  Object.defineProperty(navigator, "bluetooth", {
    value: originalBluetooth,
    configurable: true,
  });
  vi.restoreAllMocks();
});

describe("Granboard (web path)", () => {
  // Force web path by mocking Capacitor as non-native
  beforeEach(() => {
    vi.doMock("@capacitor/core", () => ({
      Capacitor: { isNativePlatform: () => false },
    }));
  });

  afterEach(() => {
    vi.doUnmock("@capacitor/core");
  });

  describe("constructor & callbacks", () => {
    it("setSegmentHitCallback updates the callback", async () => {
      vi.resetModules();
      const { Granboard } = await import("./Granboard.ts");
      const board = new Granboard();
      const cb = vi.fn();
      board.setSegmentHitCallback(cb);
      expect(board.segmentHitCallback).toBe(cb);
    });

    it("setSegmentHitCallback can clear the callback", async () => {
      vi.resetModules();
      const { Granboard } = await import("./Granboard.ts");
      const board = new Granboard();
      board.setSegmentHitCallback(vi.fn());
      board.setSegmentHitCallback(undefined);
      expect(board.segmentHitCallback).toBeUndefined();
    });
  });

  describe("sendCommand (not connected)", () => {
    it("throws when not connected", async () => {
      vi.resetModules();
      const { Granboard } = await import("./Granboard.ts");
      const board = new Granboard();
      await expect(board.sendCommand([0x14])).rejects.toThrow(
        "Not connected to GranBoard",
      );
    });
  });

  describe("ConnectToBoard", () => {
    it("connects via Web Bluetooth and returns Granboard instance", async () => {
      setupWebBluetoothDevice();
      vi.resetModules();
      const { Granboard } = await import("./Granboard.ts");
      const board = await Granboard.ConnectToBoard();
      expect(board).toBeInstanceOf(Granboard);
      expect(navigator.bluetooth.requestDevice).toHaveBeenCalled();
    });
  });

  describe("TryAutoReconnect", () => {
    it("uses getDevices for reconnection when available", async () => {
      const { device } = setupWebBluetoothDevice();
      mockStorage.set("granboard_device_id", "web-device-1");
      (
        navigator.bluetooth.getDevices as ReturnType<typeof vi.fn>
      ).mockResolvedValue([device]);

      vi.resetModules();
      const { Granboard } = await import("./Granboard.ts");
      const board = await Granboard.TryAutoReconnect();
      expect(board).toBeInstanceOf(Granboard);
    });

    it("falls back to requestDevice when getDevices returns empty", async () => {
      setupWebBluetoothDevice();
      vi.resetModules();
      const { Granboard } = await import("./Granboard.ts");
      const board = await Granboard.TryAutoReconnect();
      expect(board).toBeInstanceOf(Granboard);
      expect(navigator.bluetooth.requestDevice).toHaveBeenCalled();
    });
  });

  describe("sendCommand after connection", () => {
    it("writes bytes to the write characteristic", async () => {
      const { writeFn } = setupWebBluetoothDevice();
      vi.resetModules();
      const { Granboard } = await import("./Granboard.ts");
      const board = await Granboard.ConnectToBoard();
      await board.sendCommand([0x14, 0xff, 0x00]);
      expect(writeFn).toHaveBeenCalled();
    });
  });

  describe("BLE notifications", () => {
    it("dispatches segment hit on characteristicvaluechanged", async () => {
      const { getNotificationHandler } = setupWebBluetoothDevice();
      vi.resetModules();
      const { Granboard } = await import("./Granboard.ts");
      const board = await Granboard.ConnectToBoard();

      const segments: unknown[] = [];
      board.setSegmentHitCallback((seg) => segments.push(seg));

      const handler = getNotificationHandler();
      expect(handler).toBeDefined();

      // "51-46-52-64" = TRP_20
      const bytes = new Uint8Array([51, 46, 52, 64]);
      handler!({ target: { value: new DataView(bytes.buffer) } });

      expect(segments).toHaveLength(1);
      expect(segments[0]).toEqual(CreateSegment(SegmentID.TRP_20));
    });

    it("ignores unknown BLE byte sequences", async () => {
      const { getNotificationHandler } = setupWebBluetoothDevice();
      vi.resetModules();
      const { Granboard } = await import("./Granboard.ts");
      const board = await Granboard.ConnectToBoard();

      const segments: unknown[] = [];
      board.setSegmentHitCallback((seg) => segments.push(seg));

      const handler = getNotificationHandler();
      // Unknown sequence
      const bytes = new Uint8Array([99, 99, 99, 99]);
      handler!({ target: { value: new DataView(bytes.buffer) } });

      expect(segments).toHaveLength(0);
    });
  });

  describe("gattserverdisconnected", () => {
    it("clears write characteristic on disconnect", async () => {
      setupWebBluetoothDevice();
      vi.resetModules();
      const { Granboard } = await import("./Granboard.ts");
      const board = await Granboard.ConnectToBoard();

      // Find the gattserverdisconnected handler via the mock device
      const btDevice = await vi.mocked(navigator.bluetooth.requestDevice)();
      const addEventListenerMock = vi.mocked(btDevice.addEventListener);
      const disconnectHandler = addEventListenerMock.mock.calls.find(
        (c) => c[0] === "gattserverdisconnected",
      );

      if (disconnectHandler) {
        (disconnectHandler[1] as () => void)();
        // After disconnect, sendCommand should throw
        await expect(board.sendCommand([0x01])).rejects.toThrow();
      }
    });
  });
});

describe("Granboard (native/Capacitor path)", () => {
  beforeEach(() => {
    vi.doMock("@capacitor/core", () => ({
      Capacitor: { isNativePlatform: () => true },
    }));
  });

  afterEach(() => {
    vi.doUnmock("@capacitor/core");
  });

  describe("ConnectToBoard", () => {
    it("connects via Capacitor BLE", async () => {
      setupCapacitorBleDevice();
      vi.resetModules();
      const { Granboard } = await import("./Granboard.ts");
      const board = await Granboard.ConnectToBoard();
      expect(board).toBeInstanceOf(Granboard);
      expect(mockBleClient.requestDevice).toHaveBeenCalled();
      expect(mockBleClient.connect).toHaveBeenCalled();
      expect(mockBleClient.startNotifications).toHaveBeenCalled();
    });
  });

  describe("TryAutoReconnect", () => {
    it("throws when no saved device", async () => {
      vi.resetModules();
      const { Granboard } = await import("./Granboard.ts");
      await expect(Granboard.TryAutoReconnect()).rejects.toThrow(
        "No previously paired device",
      );
    });

    it("reconnects using saved device ID", async () => {
      setupCapacitorBleDevice("saved-cap-device");
      mockStorage.set("granboard_device_id", "saved-cap-device");
      vi.resetModules();
      const { Granboard } = await import("./Granboard.ts");
      const board = await Granboard.TryAutoReconnect();
      expect(board).toBeInstanceOf(Granboard);
      expect(mockBleClient.getDevices).toHaveBeenCalledWith([
        "saved-cap-device",
      ]);
    });

    it("throws when saved device not found by getDevices", async () => {
      mockStorage.set("granboard_device_id", "missing-device");
      mockBleClient.getDevices.mockResolvedValue([]);
      vi.resetModules();
      const { Granboard } = await import("./Granboard.ts");
      await expect(Granboard.TryAutoReconnect()).rejects.toThrow(
        "Saved device not found",
      );
    });
  });

  describe("sendCommand (native)", () => {
    it("throws when not connected", async () => {
      vi.resetModules();
      const { Granboard } = await import("./Granboard.ts");
      const board = new Granboard();
      await expect(board.sendCommand([0x01])).rejects.toThrow(
        "Not connected to GranBoard",
      );
    });

    it("writes via BleClient.write after connection", async () => {
      setupCapacitorBleDevice();
      vi.resetModules();
      const { Granboard } = await import("./Granboard.ts");
      const board = await Granboard.ConnectToBoard();
      await board.sendCommand([0x14, 0xff, 0x00]);
      expect(mockBleClient.write).toHaveBeenCalled();
    });
  });

  describe("BLE notifications (native)", () => {
    it("dispatches segment hit when notification fires", async () => {
      setupCapacitorBleDevice();
      vi.resetModules();
      const { Granboard } = await import("./Granboard.ts");
      const board = await Granboard.ConnectToBoard();

      const segments: unknown[] = [];
      board.setSegmentHitCallback((seg) => segments.push(seg));

      // Get the notification callback that was passed to startNotifications
      const notifCall = mockBleClient.startNotifications.mock.calls[0];
      const notifCallback = notifCall[3] as (value: DataView) => void;

      // "51-46-52-64" = TRP_20
      const bytes = new Uint8Array([51, 46, 52, 64]);
      notifCallback(new DataView(bytes.buffer));

      expect(segments).toHaveLength(1);
      expect(segments[0]).toEqual(CreateSegment(SegmentID.TRP_20));
    });
  });

  describe("service discovery errors", () => {
    it("throws when GranBoard service not found", async () => {
      mockBleClient.requestDevice.mockResolvedValue({ deviceId: "dev-1" });
      mockBleClient.getServices.mockResolvedValue([
        { uuid: "some-other-service", characteristics: [] },
      ]);
      vi.resetModules();
      const { Granboard } = await import("./Granboard.ts");
      await expect(Granboard.ConnectToBoard()).rejects.toThrow(
        "GranBoard service not found",
      );
    });

    it("throws when required characteristics not found", async () => {
      mockBleClient.requestDevice.mockResolvedValue({ deviceId: "dev-1" });
      mockBleClient.getServices.mockResolvedValue([
        {
          uuid: SERVICE_UUID,
          characteristics: [
            // No notify or write characteristics
            {
              uuid: "useless",
              properties: {
                notify: false,
                write: false,
                writeWithoutResponse: false,
              },
            },
          ],
        },
      ]);
      vi.resetModules();
      const { Granboard } = await import("./Granboard.ts");
      await expect(Granboard.ConnectToBoard()).rejects.toThrow(
        "Required BLE characteristics not found",
      );
    });
  });

  describe("disconnect callback", () => {
    it("clears capDeviceId on disconnect", async () => {
      setupCapacitorBleDevice();
      vi.resetModules();
      const { Granboard } = await import("./Granboard.ts");
      const board = await Granboard.ConnectToBoard();

      // Get the disconnect callback passed to BleClient.connect
      const connectCall = mockBleClient.connect.mock.calls[0];
      const disconnectCb = connectCall[1] as () => void;

      disconnectCb();

      // After disconnect, sendCommand should throw
      await expect(board.sendCommand([0x01])).rejects.toThrow(
        "Not connected to GranBoard",
      );
    });
  });
});
