import { ipcMain, app, BrowserWindow } from "electron";
import { fileURLToPath } from "node:url";
import path from "node:path";
import noble from "@abandonware/noble";
const SERVICE_UUID = "442f15708a009a28cbe1e1d4212d53eb";
class BleHandler {
  writeChar = null;
  dartHitCb;
  statusCb;
  mainWindow = null;
  setMainWindow(win2) {
    this.mainWindow = win2;
  }
  onDartHit(cb) {
    this.dartHitCb = cb;
  }
  onStatusChange(cb) {
    this.statusCb = cb;
  }
  async connect(timeoutMs = 3e4) {
    if (this.writeChar) return;
    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        noble.stopScanningAsync().catch(() => {
        });
        noble.removeListener("discover", onDiscover);
        reject(new Error("Timed out looking for Granboard."));
      }, timeoutMs);
      const onDiscover = async (peripheral) => {
        clearTimeout(timeout);
        await noble.stopScanningAsync().catch(() => {
        });
        noble.removeListener("discover", onDiscover);
        try {
          await peripheral.connectAsync();
          const { characteristics } = await peripheral.discoverSomeServicesAndCharacteristicsAsync(
            [SERVICE_UUID],
            []
          );
          const notifyChar = characteristics.find(
            (c) => c.properties.includes("notify")
          );
          const writeChar = characteristics.find(
            (c) => c.properties.includes("write") || c.properties.includes("writeWithoutResponse")
          ) ?? notifyChar;
          if (!notifyChar || !writeChar) {
            reject(new Error("Could not find required BLE characteristics."));
            return;
          }
          this.writeChar = writeChar;
          await notifyChar.subscribeAsync();
          notifyChar.on("data", (data) => {
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
        noble.startScanningAsync([SERVICE_UUID], false).catch((err) => {
          clearTimeout(timeout);
          reject(err);
        });
      };
      if (noble._state === "poweredOn") {
        startScan();
      } else {
        noble.once("stateChange", (state) => {
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
    noble.stopScanningAsync().catch(() => {
    });
    this.writeChar = null;
  }
  async sendCommand(bytes) {
    if (!this.writeChar) throw new Error("Not connected to Granboard.");
    const buffer = Buffer.from(bytes);
    const withoutResponse = this.writeChar.properties.includes(
      "writeWithoutResponse"
    );
    await this.writeChar.writeAsync(buffer, withoutResponse);
  }
}
const __dirname$1 = path.dirname(fileURLToPath(import.meta.url));
const VITE_DEV_SERVER_URL = process.env["VITE_DEV_SERVER_URL"];
const RENDERER_DIST = path.join(__dirname$1, "../dist");
let win = null;
const ble = new BleHandler();
function createWindow() {
  win = new BrowserWindow({
    width: 1920,
    height: 1080,
    fullscreen: !VITE_DEV_SERVER_URL,
    backgroundColor: "#09090b",
    // In dev, set the dock/taskbar icon manually. In production the .icns in the app bundle is used.
    icon: VITE_DEV_SERVER_URL ? path.join(__dirname$1, "../public/AppIcons/Assets.xcassets/AppIcon.appiconset/512.png") : void 0,
    webPreferences: {
      preload: path.join(__dirname$1, "preload.mjs"),
      contextIsolation: true,
      nodeIntegration: false
    }
  });
  ble.setMainWindow(win);
  ble.onDartHit((segmentUID) => {
    win?.webContents.send("ble:dart-hit", segmentUID);
  });
  if (VITE_DEV_SERVER_URL) {
    win.loadURL(VITE_DEV_SERVER_URL);
    win.webContents.openDevTools();
  } else {
    win.loadFile(path.join(RENDERER_DIST, "index.html"));
  }
  win.on("closed", () => {
    win = null;
  });
}
ipcMain.handle("ble:connect", async () => {
  await ble.connect();
});
ipcMain.handle("ble:auto-reconnect", async () => {
  await ble.connect(15e3);
});
ipcMain.handle("ble:disconnect", () => {
  ble.disconnect();
});
ipcMain.handle("ble:send-command", async (_event, bytes) => {
  await ble.sendCommand(bytes);
});
app.whenReady().then(createWindow);
app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
    win = null;
  }
});
app.on("activate", () => {
  if (BrowserWindow.getAllWindows().length === 0) createWindow();
});
