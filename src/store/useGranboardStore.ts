import { create } from "zustand";
import { Granboard } from "../lib/Granboard.ts";

type ConnectionStatus = "disconnected" | "connecting" | "connected" | "error";

interface GranboardState {
  board: Granboard | null;
  status: ConnectionStatus;
  errorMessage: string | null;
  connect: () => Promise<void>;
  autoReconnect: () => Promise<void>;
  disconnect: () => void;
}

export const useGranboardStore = create<GranboardState>((set, get) => ({
  board: null,
  status: "disconnected",
  errorMessage: null,

  connect: async () => {
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
    set({ status: "connecting", errorMessage: null });
    try {
      const board = await Granboard.TryAutoReconnect();
      set({ board, status: "connected" });
    } catch (error) {
      console.error("Auto-reconnect failed:", error);
      // No previously paired device or out of range — silently go back to disconnected
      set({ status: "disconnected" });
    }
  },

  disconnect: () => {
    get().board;
    set({ board: null, status: "disconnected", errorMessage: null });
  },
}));
