import { create } from "zustand";
import {
  dbGetAllPlayers,
  dbAddPlayer,
  dbDeletePlayer,
  dbRenamePlayer,
} from "../db/db.ts";
import type { PlayerRecord } from "@nlc-darts/engine";

interface PlayerProfileState {
  players: PlayerRecord[];
  loaded: boolean;
  load: () => Promise<void>;
  createPlayer: (name: string) => Promise<PlayerRecord>;
  removePlayer: (id: string) => Promise<void>;
  updateName: (id: string, name: string) => Promise<void>;
}

export const usePlayerProfileStore = create<PlayerProfileState>((set, get) => ({
  players: [],
  loaded: false,

  load: async () => {
    if (get().loaded) return;
    const players = await dbGetAllPlayers();
    set({
      players: players.sort((a, b) => a.name.localeCompare(b.name)),
      loaded: true,
    });
  },

  createPlayer: async (name: string) => {
    const player = await dbAddPlayer(name.trim());
    set((s) => ({
      players: [...s.players, player].sort((a, b) =>
        a.name.localeCompare(b.name),
      ),
    }));
    return player;
  },

  removePlayer: async (id: string) => {
    await dbDeletePlayer(id);
    set((s) => ({ players: s.players.filter((p) => p.id !== id) }));
  },

  updateName: async (id: string, name: string) => {
    await dbRenamePlayer(id, name.trim());
    set((s) => ({
      players: s.players
        .map((p) => (p.id === id ? { ...p, name: name.trim() } : p))
        .sort((a, b) => a.name.localeCompare(b.name)),
    }));
  },
}));
