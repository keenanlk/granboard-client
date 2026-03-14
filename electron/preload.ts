import { contextBridge, ipcRenderer } from "electron";

contextBridge.exposeInMainWorld("electronAPI", {
  connect: () => ipcRenderer.invoke("ble:connect"),
  autoReconnect: () => ipcRenderer.invoke("ble:auto-reconnect"),
  disconnect: () => ipcRenderer.invoke("ble:disconnect"),
  sendCommand: (bytes: number[]) =>
    ipcRenderer.invoke("ble:send-command", bytes),

  onDartHit: (cb: (segmentUID: string) => void) => {
    ipcRenderer.on("ble:dart-hit", (_event, uid: string) => cb(uid));
  },

  onStatus: (cb: (status: string) => void) => {
    ipcRenderer.on("ble:status", (_event, status: string) => cb(status));
  },

  removeListeners: (channel: string) => {
    ipcRenderer.removeAllListeners(channel);
  },
});
