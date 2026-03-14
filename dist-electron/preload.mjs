"use strict";
const electron = require("electron");
electron.contextBridge.exposeInMainWorld("electronAPI", {
  connect: () => electron.ipcRenderer.invoke("ble:connect"),
  autoReconnect: () => electron.ipcRenderer.invoke("ble:auto-reconnect"),
  disconnect: () => electron.ipcRenderer.invoke("ble:disconnect"),
  sendCommand: (bytes) => electron.ipcRenderer.invoke("ble:send-command", bytes),
  onDartHit: (cb) => {
    electron.ipcRenderer.on("ble:dart-hit", (_event, uid) => cb(uid));
  },
  onStatus: (cb) => {
    electron.ipcRenderer.on("ble:status", (_event, status) => cb(status));
  },
  removeListeners: (channel) => {
    electron.ipcRenderer.removeAllListeners(channel);
  }
});
