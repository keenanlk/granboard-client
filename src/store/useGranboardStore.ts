import { create } from "zustand";
import { Granboard } from "../board/Granboard.ts";
import { MockGranboard } from "../board/MockGranboard.ts";

type ConnectionStatus = "disconnected" | "connecting" | "connected" | "error";

interface GranboardState {
  board: Granboard | null;
  status: ConnectionStatus;
  errorMessage: string | null;
  connect: () => Promise<void>;
  autoReconnect: () => Promise<void>;
  disconnect: () => void;
  connectMock: () => void;
}

export const useGranboardStore = create<GranboardState>((set, get) => ({
  board: null,
  status: "disconnected",
  errorMessage: null,

  connect: async () => {
    const { status } = get();
    if (status === "connecting" || status === "connected") return;
    set({ status: "connecting", errorMessage: null });
    try {
      const board = await Granboard.ConnectToBoard();
      set({ board, status: "connected" });
    } catch (err) {
      set({
        status: "error",
        errorMessage: err instanceof Error ? err.message : "Connection failed",
      });
    }
  },

  autoReconnect: async () => {
    const { status } = get();
    if (status === "connecting" || status === "connected") return;
    set({ status: "connecting", errorMessage: null });
    try {
      const board = await Granboard.TryAutoReconnect();
      set({ board, status: "connected" });
    } catch (err) {
      const msg = err instanceof Error ? err.message : JSON.stringify(err);
      console.warn("[BLE] Auto-reconnect failed:", msg, err);
      if (get().status !== "connected") {
        set({ status: "disconnected" });
      }
    }
  },

  disconnect: () => {
    set({ board: null, status: "disconnected", errorMessage: null });
  },

  connectMock: () => {
    set({
      board: new MockGranboard(),
      status: "connected",
      errorMessage: null,
    });
  },
}));
