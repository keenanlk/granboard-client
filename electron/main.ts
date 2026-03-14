import { app, BrowserWindow, ipcMain } from "electron";
import { fileURLToPath } from "node:url";
import path from "node:path";
import { BleHandler } from "./ble.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const VITE_DEV_SERVER_URL = process.env["VITE_DEV_SERVER_URL"];
const RENDERER_DIST = path.join(__dirname, "../dist");

let win: BrowserWindow | null = null;
const ble = new BleHandler();

function createWindow() {
  win = new BrowserWindow({
    width: 1920,
    height: 1080,
    fullscreen: !VITE_DEV_SERVER_URL,
    backgroundColor: "#09090b",
    // In dev, set the dock/taskbar icon manually. In production the .icns in the app bundle is used.
    icon: VITE_DEV_SERVER_URL
      ? path.join(__dirname, "../public/AppIcons/Assets.xcassets/AppIcon.appiconset/512.png")
      : undefined,
    webPreferences: {
      preload: path.join(__dirname, "preload.mjs"),
      contextIsolation: true,
      nodeIntegration: false,
    },
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
  // Noble scans the same way for both manual and auto connect.
  // autoReconnect uses a shorter timeout since it runs silently on startup.
  await ble.connect(15000);
});

ipcMain.handle("ble:disconnect", () => {
  ble.disconnect();
});

ipcMain.handle("ble:send-command", async (_event, bytes: number[]) => {
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
