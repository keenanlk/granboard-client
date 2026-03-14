import noble from "@abandonware/noble";
import type { BrowserWindow } from "electron";

// Strip dashes for noble's UUID format
const SERVICE_UUID = "442f15708a009a28cbe1e1d4212d53eb";

type StatusCallback = (status: "connected" | "disconnected" | "error", message?: string) => void;
type DartHitCallback = (segmentUID: string) => void;

export class BleHandler {
  private writeChar: noble.Characteristic | null = null;
  private dartHitCb?: DartHitCallback;
  private statusCb?: StatusCallback;
  private mainWindow: BrowserWindow | null = null;

  setMainWindow(win: BrowserWindow) {
    this.mainWindow = win;
  }

  onDartHit(cb: DartHitCallback) {
    this.dartHitCb = cb;
  }

  onStatusChange(cb: StatusCallback) {
    this.statusCb = cb;
  }

  async connect(timeoutMs = 30000): Promise<void> {
    if (this.writeChar) return; // already connected

    return new Promise<void>((resolve, reject) => {
      const timeout = setTimeout(() => {
        noble.stopScanningAsync().catch(() => {});
        noble.removeListener("discover", onDiscover);
        reject(new Error("Timed out looking for Granboard."));
      }, timeoutMs);

      const onDiscover = async (peripheral: noble.Peripheral) => {
        clearTimeout(timeout);
        await noble.stopScanningAsync().catch(() => {});
        noble.removeListener("discover", onDiscover);

        try {
          await peripheral.connectAsync();
          const { characteristics } =
            await peripheral.discoverSomeServicesAndCharacteristicsAsync(
              [SERVICE_UUID],
              [],
            );

          const notifyChar = characteristics.find((c) =>
            c.properties.includes("notify"),
          );
          const writeChar =
            characteristics.find(
              (c) =>
                c.properties.includes("write") ||
                c.properties.includes("writeWithoutResponse"),
            ) ?? notifyChar;

          if (!notifyChar || !writeChar) {
            reject(new Error("Could not find required BLE characteristics."));
            return;
          }

          this.writeChar = writeChar;

          await notifyChar.subscribeAsync();
          notifyChar.on("data", (data: Buffer) => {
            const uid = Array.from(new Uint8Array(data)).join("-");
            this.dartHitCb?.(uid);
          });

          peripheral.once("disconnect", () => {
            this.writeChar = null;
            this.statusCb?.("disconnected");
            this.mainWindow?.webContents.send("ble:status", "disconnected");
          });

          resolve();
        } catch (err) {
          reject(err);
        }
      };

      const startScan = () => {
        noble.on("discover", onDiscover);
        noble.startScanningAsync([SERVICE_UUID], false).catch((err: Error) => {
          clearTimeout(timeout);
          reject(err);
        });
      };

      if (noble._state === "poweredOn") {
        startScan();
      } else {
        noble.once("stateChange", (state: string) => {
          if (state === "poweredOn") {
            startScan();
          } else {
            clearTimeout(timeout);
            reject(new Error(`Bluetooth is ${state}.`));
          }
        });
      }
    });
  }

  disconnect() {
    noble.stopScanningAsync().catch(() => {});
    this.writeChar = null;
  }

  async sendCommand(bytes: number[]): Promise<void> {
    if (!this.writeChar) throw new Error("Not connected to Granboard.");
    const buffer = Buffer.from(bytes);
    const withoutResponse = this.writeChar.properties.includes(
      "writeWithoutResponse",
    );
    await this.writeChar.writeAsync(buffer, withoutResponse);
  }
}
