declare module "*.mp4" {
  const src: string;
  export default src;
}

interface ElectronAPI {
  connect: () => Promise<void>;
  autoReconnect: () => Promise<void>;
  disconnect: () => Promise<void>;
  sendCommand: (bytes: number[]) => Promise<void>;
  onDartHit: (cb: (segmentUID: string) => void) => void;
  onStatus: (cb: (status: string) => void) => void;
  removeListeners: (channel: string) => void;
}

interface Window {
  electronAPI?: ElectronAPI;
}
