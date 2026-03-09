import { CreateSegment, type Segment, SegmentID } from "./Dartboard.ts";

const GRANBOARD_UUID = "442F1570-8A00-9A28-CBE1-E1D4212D53EB".toLowerCase();

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

export class Granboard {
  private notifyCharacteristic: BluetoothRemoteGATTCharacteristic;
  private writeCharacteristic: BluetoothRemoteGATTCharacteristic;
  public segmentHitCallback?: (segment: Segment) => void;

  public setSegmentHitCallback(
    cb: ((segment: Segment) => void) | undefined,
  ): void {
    this.segmentHitCallback = cb;
  }

  private static async connectToDevice(
    device: BluetoothDevice,
  ): Promise<Granboard> {
    if (!device.gatt) throw new Error("Could not find dartboard GATT service.");
    if (!device.gatt.connected) await device.gatt.connect();

    const service = await device.gatt.getPrimaryService(GRANBOARD_UUID);
    const characteristics = await service.getCharacteristics();

    const notifyChar = characteristics.find((c) => c.properties.notify);
    if (!notifyChar) throw new Error("Could not find notify characteristic.");

    const writeChar =
      characteristics.find(
        (c) => c.properties.write || c.properties.writeWithoutResponse,
      ) ?? notifyChar;

    const board = new Granboard(notifyChar, writeChar);
    await notifyChar.startNotifications();
    return board;
  }

  /** Show the browser device picker and connect. */
  public static async ConnectToBoard(): Promise<Granboard> {
    if (!navigator.bluetooth) {
      throw new Error("This browser does not support Web Bluetooth.");
    }
    const device = await navigator.bluetooth.requestDevice({
      filters: [{ services: [GRANBOARD_UUID] }],
    });
    return Granboard.connectToDevice(device);
  }

  /**
   * Try to reconnect to a previously paired Granboard without showing the picker.
   * Uses getDevices() + watchAdvertisements() so the connection fires as soon as
   * the board starts advertising — no blind retries needed.
   * Requires chrome://flags/#enable-experimental-web-platform-features on Chrome 85+.
   */
  public static async TryAutoReconnect(timeoutMs = 30000): Promise<Granboard> {
    if (!navigator.bluetooth?.getDevices) {
      throw new Error("getDevices not supported.");
    }
    const devices = await navigator.bluetooth.getDevices();
    if (devices.length === 0) throw new Error("No previously paired devices.");

    return new Promise<Granboard>((resolve, reject) => {
      const cleanup = () => {
        for (const device of devices) {
          device.unwatchAdvertisements?.().catch(() => {});
        }
      };

      const timer = setTimeout(() => {
        cleanup();
        reject(new Error("Timed out waiting for Granboard to advertise."));
      }, timeoutMs);

      for (const device of devices) {
        device.watchAdvertisements?.().catch(() => {});
        device.addEventListener(
          "advertisementreceived",
          () => {
            clearTimeout(timer);
            cleanup();
            Granboard.connectToDevice(device).then(resolve).catch(reject);
          },
          { once: true },
        );
      }
    });
  }

  constructor(
    notifyChar: BluetoothRemoteGATTCharacteristic,
    writeChar: BluetoothRemoteGATTCharacteristic,
  ) {
    this.notifyCharacteristic = notifyChar;
    this.writeCharacteristic = writeChar;
    this.notifyCharacteristic.addEventListener(
      "characteristicvaluechanged",
      this.onSegmentHit.bind(this),
    );
  }

  /** Send a raw LED command — bytes are the hex values from the Granboard LED spec. */
  async sendCommand(bytes: number[]): Promise<void> {
    const data = new Uint8Array(bytes);
    if (this.writeCharacteristic.properties.writeWithoutResponse) {
      await this.writeCharacteristic.writeValueWithoutResponse(data);
    } else {
      await this.writeCharacteristic.writeValue(data);
    }
  }

  private onSegmentHit() {
    if (!this.notifyCharacteristic.value) return;
    const segmentUID = Array.from(
      new Uint8Array(this.notifyCharacteristic.value.buffer),
    ).join("-");
    const segmentID = SEGMENT_MAPPING[segmentUID];
    if (segmentID !== undefined) {
      this.segmentHitCallback?.(CreateSegment(segmentID));
    }
  }
}
