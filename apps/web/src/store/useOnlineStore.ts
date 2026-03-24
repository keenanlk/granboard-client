import { create } from "zustand";
import { logger } from "../lib/logger.ts";
import { fetchPlayerStats, EMPTY_STATS } from "../lib/onlineStats.ts";
import { transition } from "../online/transitions.ts";
import {
  bindManagersToStore,
  getSupabaseManager,
  getColyseusManager,
  getTournamentManager,
  cleanupAllManagers,
} from "../online/managers.ts";
import type {
  OnlineStore,
  OnlineStoreState,
  Invite,
  OnlineGameType,
  OnlineConfig,
  RoomStatus,
  Room,
} from "./online.types.ts";
import { supabase } from "../lib/supabaseClient.ts";

const log = logger.child({ module: "online" });

const INITIAL_STATE: OnlineStoreState = {
  // Auth
  authUserId: null,
  displayName: null,
  stats: EMPTY_STATS,

  // Phase machines
  lobbyPhase: "offline",
  invitePhase: "idle",
  roomPhase: "idle",
  colyseusPhase: "disconnected",
  rematchPhase: "idle",
  nextLegPhase: "idle",
  tournamentPhase: "disconnected",

  // Lobby
  onlinePlayers: [],

  // Rooms & invites
  currentRoom: null,
  isHost: false,
  opponentName: null,
  pendingInvite: null,
  sentInvite: null,
  onlineConfig: null,

  // Tournament
  bracketData: null,
  participantUserMap: null,
  registrationUpdate: null,
  tournamentCreated: null,
  tournamentError: null,
  matchReadyState: null,
  matchCountdown: null,
  matchStart: null,
  matchAlert: null,
  matchGameRoom: null,
};

export const useOnlineStore = create<OnlineStore>((set, get) => {
  // Bind managers to store immediately
  const storeSet = (partial: Partial<OnlineStoreState>) => set(partial);
  const storeGet = () => get() as OnlineStoreState;

  // Deferred binding — managers may be created lazily
  queueMicrotask(() => bindManagersToStore(storeGet, storeSet));

  return {
    ...INITIAL_STATE,

    set: storeSet,

    // --- Lobby ---

    goOnline: async () => {
      const s = get();
      const next = transition("lobby", s.lobbyPhase, "connecting");
      if (next === s.lobbyPhase) return;
      set({ lobbyPhase: next });

      try {
        const {
          data: { session },
        } = await supabase.auth.getSession();
        const userId = session?.user?.id;
        if (!userId) throw new Error("Not authenticated");

        const displayName = localStorage.getItem("nlc-online-name") ?? "Player";
        const stats = await fetchPlayerStats(userId);

        const mgr = getSupabaseManager();
        await mgr.upsertPlayer(userId, displayName, "online");

        set({
          authUserId: userId,
          displayName,
          stats,
          lobbyPhase: transition("lobby", "connecting", "online"),
        });

        await mgr.joinLobby(userId);
      } catch (err) {
        log.error({ err }, "goOnline failed");
        set({ lobbyPhase: transition("lobby", "connecting", "error") });
      }
    },

    goOffline: async () => {
      const s = get();

      // Clean up room if active
      if (s.currentRoom) {
        await get().leaveRoom();
      }

      const { authUserId } = get();
      if (authUserId) {
        const mgr = getSupabaseManager();
        await mgr.updatePlayerStatus(authUserId, "online");
      }

      cleanupAllManagers();

      set({
        ...INITIAL_STATE,
        lobbyPhase: "offline",
      });
    },

    // --- Invites ---

    sendInvite: async (
      toId: string,
      gameType: OnlineGameType,
      gameOptions: unknown,
    ) => {
      const s = get();
      const next = transition("invite", s.invitePhase, "sending");
      if (next === s.invitePhase) return;
      set({ invitePhase: next });

      // Create room first
      const room = await get().createRoom(gameType, gameOptions);
      if (!room) {
        set({ invitePhase: transition("invite", "sending", "idle") });
        return;
      }

      const mgr = getSupabaseManager();
      const invite = await mgr.sendInvite(toId, gameType, gameOptions, room.id);

      if (invite) {
        set({
          sentInvite: invite,
          invitePhase: transition("invite", "sending", "awaiting_reply"),
        });
      } else {
        set({ invitePhase: transition("invite", "sending", "idle") });
      }
    },

    acceptInvite: async (invite: Invite) => {
      const s = get();
      const next = transition("invite", s.invitePhase, "accepted");
      if (next === s.invitePhase) return;

      const mgr = getSupabaseManager();
      await mgr.respondToInvite(invite, "accepted");

      set({
        invitePhase: "idle",
        pendingInvite: null,
        opponentName: invite.from_name ?? null,
      });

      await get().joinRoom(invite.room_id);
    },

    declineInvite: async (invite: Invite) => {
      const s = get();
      const next = transition("invite", s.invitePhase, "declined");
      if (next === s.invitePhase) return;

      const mgr = getSupabaseManager();
      await mgr.respondToInvite(invite, "declined");

      set({ invitePhase: "idle", pendingInvite: null });
    },

    dismissInvite: () => set({ pendingInvite: null, invitePhase: "idle" }),
    dismissSentInvite: () => set({ sentInvite: null, invitePhase: "idle" }),

    // --- Room ---

    createRoom: async (
      gameType: OnlineGameType,
      gameOptions: unknown,
    ): Promise<Room | null> => {
      const { authUserId } = get();
      if (!authUserId) return null;

      set({ roomPhase: transition("room", get().roomPhase, "creating") });

      const mgr = getSupabaseManager();
      const room = await mgr.createRoomRecord(
        authUserId,
        gameType,
        gameOptions,
      );

      if (!room) {
        set({ roomPhase: transition("room", "creating", "idle") });
        return null;
      }

      set({
        currentRoom: room,
        isHost: true,
        roomPhase: transition("room", "creating", "waiting"),
      });

      mgr.joinRoomChannel(room.id);
      await mgr.updatePlayerStatus(authUserId, "in_game");
      await mgr.updatePresenceStatus("in_game");

      return room;
    },

    joinRoom: async (roomId: string) => {
      const { authUserId } = get();
      if (!authUserId) return;

      set({ roomPhase: transition("room", get().roomPhase, "waiting") });

      const mgr = getSupabaseManager();
      const room = await mgr.joinRoomRecord(roomId, authUserId);

      if (!room) {
        set({ roomPhase: transition("room", "waiting", "idle") });
        return;
      }

      set({ currentRoom: room, isHost: false });

      mgr.joinRoomChannel(room.id);
      await mgr.updatePlayerStatus(authUserId, "in_game");
      await mgr.updatePresenceStatus("in_game");
    },

    leaveRoom: async () => {
      const { currentRoom, authUserId, roomPhase } = get();

      set({
        roomPhase: transition("room", roomPhase, "leaving"),
        currentRoom: null,
        isHost: false,
        opponentName: null,
        onlineConfig: null,
        rematchPhase: "idle",
        nextLegPhase: "idle",
      });

      const mgr = getSupabaseManager();

      if (currentRoom) {
        mgr.sendBroadcast("player_left", { playerId: authUserId });
        mgr.leaveRoomChannel();
        await mgr.abandonRoom(currentRoom.id);
      }

      // Leave Colyseus room if connected
      const colyMgr = getColyseusManager();
      await colyMgr.leave();

      if (authUserId) {
        await mgr.updatePlayerStatus(authUserId, "online");
        await mgr.updatePresenceStatus("online");
      }

      set({
        roomPhase: transition("room", "leaving", "idle"),
        colyseusPhase: "disconnected",
      });
    },

    updateRoomStatus: (status: RoomStatus) => {
      const { currentRoom } = get();
      if (currentRoom) {
        set({ currentRoom: { ...currentRoom, status } });
        const mgr = getSupabaseManager();
        void mgr.updateRoomRecordStatus(currentRoom.id, status);
      }
    },

    // --- Game (Colyseus) ---

    launchGame: async (config: OnlineConfig) => {
      set({
        onlineConfig: config,
        roomPhase: transition("room", get().roomPhase, "launching"),
        colyseusPhase: transition(
          "colyseus",
          get().colyseusPhase,
          "connecting",
        ),
        rematchPhase: "idle",
        nextLegPhase: "idle",
      });

      const mgr = getColyseusManager();

      try {
        if (config.isHost) {
          if (config.colyseusRoomId) {
            // Room already created externally (e.g., by App.tsx for tournament)
            // The pending room pattern is replaced: the manager now owns the room
            await mgr.joinRoom(config.colyseusRoomId);
          } else {
            // Create a new room
            const room = await mgr.createRoom(config.gameType!, {
              gameOptions: config.gameOptions,
              playerNames: config.playerNames!,
              playerIds: config.playerIds!,
              roomId: config.roomId,
            });

            // Update config with real room ID
            set({
              onlineConfig: { ...config, colyseusRoomId: room.roomId },
            });
          }
        } else if (config.colyseusRoomId) {
          await mgr.joinRoom(config.colyseusRoomId);
        }

        mgr.requestState();

        set({
          roomPhase: transition("room", "launching", "playing"),
          colyseusPhase: "connected",
        });
      } catch (err) {
        log.error({ err }, "launchGame failed");
        set({
          roomPhase: transition("room", "launching", "idle"),
          colyseusPhase: transition("colyseus", "connecting", "error"),
        });
      }
    },

    sendDart: (segmentId: number) => {
      if (get().colyseusPhase !== "connected") return;
      getColyseusManager().send("dart_hit", { segmentId });
    },

    sendNextTurn: () => {
      if (get().colyseusPhase !== "connected") return;
      getColyseusManager().send("next_turn", {});
    },

    sendUndo: () => {
      if (get().colyseusPhase !== "connected") return;
      getColyseusManager().send("undo", {});
    },

    // --- Rematch ---

    requestRematch: () => {
      const s = get();
      if (s.rematchPhase === "received") {
        // Both agree
        getColyseusManager().send("rematch_accept", {});
        const mgr = getSupabaseManager();
        mgr.sendBroadcast("rematch_accept", {});
        set({ rematchPhase: "accepted" });
      } else {
        getColyseusManager().send("rematch_request", {});
        const mgr = getSupabaseManager();
        mgr.sendBroadcast("rematch_request", {});
        set({
          rematchPhase: transition("rematch", s.rematchPhase, "sent"),
        });
      }
    },

    acceptRematch: () => {
      getColyseusManager().send("rematch_accept", {});
      const mgr = getSupabaseManager();
      mgr.sendBroadcast("rematch_accept", {});
      set({ rematchPhase: "accepted" });
    },

    declineRematch: () => {
      getColyseusManager().send("rematch_decline", {});
      const mgr = getSupabaseManager();
      mgr.sendBroadcast("rematch_decline", {});
      set({ rematchPhase: "declined" });
    },

    resetRematch: () => set({ rematchPhase: "idle" }),

    // --- Next Leg ---

    requestNextLeg: () => {
      const s = get();
      if (s.nextLegPhase === "opponent_ready") {
        getColyseusManager().send("next_leg_accept", {});
        set({ nextLegPhase: "accepted" });
      } else {
        getColyseusManager().send("next_leg_request", {});
        set({
          nextLegPhase: transition("nextLeg", s.nextLegPhase, "sent"),
        });
      }
    },

    resetNextLeg: () => set({ nextLegPhase: "idle" }),

    // --- Tournament ---

    connectTournament: async (tournamentId?: string) => {
      const mgr = getTournamentManager();
      await mgr.connect(tournamentId);
    },

    disconnectTournament: () => {
      getTournamentManager().disconnect();
    },

    createTournament: (data) => {
      getTournamentManager().send("create_tournament", data);
    },

    startTournament: (tournamentId: string, userId: string) => {
      getTournamentManager().send("start_tournament", {
        tournamentId,
        userId,
      });
    },

    registerPlayer: (tournamentId: string, userId: string) => {
      getTournamentManager().send("register_player", {
        tournamentId,
        userId,
      });
    },

    unregisterPlayer: (tournamentId: string, userId: string) => {
      getTournamentManager().send("unregister_player", {
        tournamentId,
        userId,
      });
    },

    readyForMatch: (matchId: number, userId: string, tournamentId: string) => {
      getTournamentManager().send("ready_for_match", {
        matchId,
        userId,
        tournamentId,
      });
    },

    unreadyForMatch: (matchId: number, userId: string) => {
      getTournamentManager().send("unready_for_match", { matchId, userId });
    },

    reportMatchGameResult: (
      matchId: number,
      winnerUserId: string,
      legResults: Array<{ winnerName: string; winnerIndex: number }>,
    ) => {
      getTournamentManager().send("match_game_result", {
        matchId,
        winnerUserId,
        legResults,
      });
    },

    sendGameRoomReady: (matchId: number, colyseusRoomId: string) => {
      getTournamentManager().send("match_game_room_ready", {
        matchId,
        colyseusRoomId,
      });
    },

    recordResult: (
      matchId: number,
      opponent1Score: number,
      opponent2Score: number,
    ) => {
      getTournamentManager().send("record_result", {
        matchId,
        opponent1Score,
        opponent2Score,
      });
    },

    clearMatchAlert: () => set({ matchAlert: null }),
    clearMatchStart: () => set({ matchStart: null }),
    clearMatchCountdown: () => set({ matchCountdown: null }),
    clearMatchGameRoom: () => set({ matchGameRoom: null }),
  };
});

// Dev-mode stale state detection
if (import.meta.env.DEV) {
  const STALE_THRESHOLDS: Record<string, number> = {
    connecting: 15_000, // lobbyPhase stuck connecting
    launching: 15_000, // roomPhase stuck launching
    reconnecting: 30_000, // colyseusPhase stuck reconnecting
  };

  const staleTimers: Record<string, ReturnType<typeof setTimeout>> = {};

  useOnlineStore.subscribe((state, prev) => {
    const phases = ["lobbyPhase", "roomPhase", "colyseusPhase"] as const;

    for (const key of phases) {
      if (state[key] !== prev[key]) {
        // Clear existing timer for this phase
        if (staleTimers[key]) {
          clearTimeout(staleTimers[key]);
          delete staleTimers[key];
        }

        const threshold = STALE_THRESHOLDS[state[key]];
        if (threshold) {
          staleTimers[key] = setTimeout(() => {
            const current = useOnlineStore.getState()[key];
            if (current === state[key]) {
              log.warn(
                { phase: key, value: current, staleMs: threshold },
                "Phase appears stuck — consider auto-recovering",
              );
            }
          }, threshold);
        }
      }
    }
  });
}

// Backward-compatible exports
export type { OnlineConfig } from "./online.types.ts";
export type ConnectionStatus = "offline" | "connecting" | "online" | "error";
