import { create } from "zustand";
import { supabase } from "../lib/supabaseClient.ts";
import type { RealtimeChannel } from "@supabase/supabase-js";
import { logger } from "../lib/logger.ts";

const log = logger.child({ module: "online" });
import type {
  Invite,
  InviteStatus,
  OnlineGameType,
  OnlinePlayer,
  PlayerStatus,
  Room,
  RoomStatus,
} from "./online.types.ts";

export interface OnlineConfig {
  roomId: string;
  isHost: boolean;
  /** Colyseus room ID for server-authoritative play */
  colyseusRoomId?: string;
  /** Game type for Colyseus room creation */
  gameType?: "x01" | "cricket";
  /** Player names for Colyseus room creation */
  playerNames?: string[];
  /** Player IDs for Colyseus room creation */
  playerIds?: (string | null)[];
  /** Game options for Colyseus room creation */
  gameOptions?: unknown;
}

type ConnectionStatus = "offline" | "connecting" | "online" | "error";

interface OnlineState {
  // Auth
  authUserId: string | null;
  displayName: string | null;
  connectionStatus: ConnectionStatus;

  // Lobby
  onlinePlayers: OnlinePlayer[];
  lobbyChannel: RealtimeChannel | null;

  // Rooms & invites
  currentRoom: Room | null;
  roomChannel: RealtimeChannel | null;
  isHost: boolean;
  opponentName: string | null;
  pendingInvite: Invite | null;
  sentInvite: Invite | null;

  // Actions
  goOnline: (displayName: string) => Promise<void>;
  goOffline: () => Promise<void>;
  createRoom: (
    gameType: OnlineGameType,
    gameOptions: unknown,
  ) => Promise<Room | null>;
  joinRoom: (roomId: string) => Promise<void>;
  leaveRoom: () => Promise<void>;
  sendInvite: (
    toId: string,
    gameType: OnlineGameType,
    gameOptions: unknown,
  ) => Promise<void>;
  acceptInvite: (invite: Invite) => Promise<void>;
  declineInvite: (invite: Invite) => Promise<void>;
  dismissInvite: () => void;
  dismissSentInvite: () => void;
  setCurrentRoom: (room: Room | null) => void;
  setRoomChannel: (channel: RealtimeChannel | null) => void;
  updateRoomStatus: (status: RoomStatus) => void;
}

export const useOnlineStore = create<OnlineState>((set, get) => ({
  authUserId: null,
  displayName: null,
  connectionStatus: "offline",
  onlinePlayers: [],
  lobbyChannel: null,
  currentRoom: null,
  roomChannel: null,
  isHost: false,
  opponentName: null,
  pendingInvite: null,
  sentInvite: null,

  goOnline: async (displayName: string) => {
    set({ connectionStatus: "connecting" });
    try {
      // Anonymous auth
      const {
        data: { session },
      } = await supabase.auth.getSession();
      let userId = session?.user?.id;
      if (!userId) {
        const { data, error } = await supabase.auth.signInAnonymously();
        if (error) throw error;
        userId = data.user?.id;
      }
      if (!userId) throw new Error("Failed to get user ID");

      // Upsert player record
      await supabase.from("online_players").upsert(
        {
          id: userId,
          display_name: displayName,
          status: "online" as PlayerStatus,
          last_seen: new Date().toISOString(),
        },
        { onConflict: "id" },
      );

      set({
        authUserId: userId,
        displayName,
        connectionStatus: "online",
      });

      // Join lobby presence channel
      const lobbyChannel = supabase.channel("lobby", {
        config: { presence: { key: userId } },
      });

      lobbyChannel
        .on("presence", { event: "sync" }, () => {
          const state = lobbyChannel.presenceState();
          const players: OnlinePlayer[] = [];
          for (const [, presences] of Object.entries(state)) {
            const p = presences[0] as unknown as {
              id: string;
              display_name: string;
              status: PlayerStatus;
            };
            if (p.id !== get().authUserId) {
              players.push({
                id: p.id,
                display_name: p.display_name,
                status: p.status,
                last_seen: new Date().toISOString(),
              });
            }
          }
          set({ onlinePlayers: players });
        })
        .on(
          "broadcast",
          { event: "invite" },
          ({ payload }: { payload: Invite }) => {
            if (payload.to_id === get().authUserId) {
              set({ pendingInvite: payload });
            }
          },
        )
        .on(
          "broadcast",
          { event: "invite_response" },
          ({
            payload,
          }: {
            payload: {
              invite_id: string;
              status: InviteStatus;
              room_id: string;
              guest_id?: string;
              guest_name?: string;
            };
          }) => {
            const sent = get().sentInvite;
            if (sent && sent.id === payload.invite_id) {
              if (payload.status === "accepted") {
                // Host already has the room from createRoom — just update guest info
                const { currentRoom } = get();
                if (currentRoom) {
                  set({
                    sentInvite: null,
                    currentRoom: {
                      ...currentRoom,
                      guest_id: payload.guest_id ?? sent.to_id,
                    },
                    opponentName: payload.guest_name ?? null,
                  });
                } else {
                  set({ sentInvite: null });
                }
              } else {
                // Declined — clean up the room we created
                set({ sentInvite: null });
                void get().leaveRoom();
              }
            }
          },
        )
        .subscribe(async (status) => {
          if (status === "SUBSCRIBED") {
            await lobbyChannel.track({
              id: userId,
              display_name: displayName,
              status: "online",
            });
          }
        });

      set({ lobbyChannel });

      // Heartbeat — update last_seen every 30s
      const heartbeat = setInterval(async () => {
        const { authUserId } = get();
        if (!authUserId) {
          clearInterval(heartbeat);
          return;
        }
        await supabase
          .from("online_players")
          .update({ last_seen: new Date().toISOString() })
          .eq("id", authUserId);
      }, 30000);
    } catch (err) {
      log.error({ err }, "goOnline failed");
      set({ connectionStatus: "error" });
    }
  },

  goOffline: async () => {
    // Clean up any active room first
    if (get().currentRoom) {
      await get().leaveRoom();
    }

    const { lobbyChannel, authUserId } = get();

    if (lobbyChannel) {
      await supabase.removeChannel(lobbyChannel);
    }

    if (authUserId) {
      await supabase
        .from("online_players")
        .update({ status: "online" as PlayerStatus })
        .eq("id", authUserId);
    }

    set({
      connectionStatus: "offline",
      onlinePlayers: [],
      lobbyChannel: null,
      roomChannel: null,
      currentRoom: null,
      isHost: false,
      opponentName: null,
      pendingInvite: null,
      sentInvite: null,
    });
  },

  createRoom: async (gameType, gameOptions) => {
    const { authUserId } = get();
    if (!authUserId) return null;

    const { data, error } = await supabase
      .from("rooms")
      .insert({
        host_id: authUserId,
        status: "waiting" as RoomStatus,
        game_type: gameType,
        game_options: gameOptions,
      })
      .select()
      .single();

    if (error) {
      log.error({ err: error }, "createRoom failed");
      return null;
    }

    const room = data as Room;
    set({ currentRoom: room, isHost: true });

    // Join room channel
    const roomChannel = supabase.channel(`room:${room.id}`);
    roomChannel.subscribe();
    set({ roomChannel });

    // Update player status
    await supabase
      .from("online_players")
      .update({ status: "in_game" as PlayerStatus })
      .eq("id", authUserId);

    // Update lobby presence
    const { lobbyChannel } = get();
    if (lobbyChannel) {
      await lobbyChannel.track({
        id: authUserId,
        display_name: get().displayName,
        status: "in_game",
      });
    }

    return room;
  },

  joinRoom: async (roomId: string) => {
    const { authUserId } = get();
    if (!authUserId) return;

    // Update room with guest
    const { data, error } = await supabase
      .from("rooms")
      .update({ guest_id: authUserId })
      .eq("id", roomId)
      .select()
      .single();

    if (error) {
      log.error({ err: error }, "joinRoom failed");
      return;
    }

    const room = data as Room;
    set({ currentRoom: room, isHost: false });

    // Join room channel
    const roomChannel = supabase.channel(`room:${room.id}`);
    roomChannel.subscribe();
    set({ roomChannel });

    // Update player status
    await supabase
      .from("online_players")
      .update({ status: "in_game" as PlayerStatus })
      .eq("id", authUserId);

    const { lobbyChannel } = get();
    if (lobbyChannel) {
      await lobbyChannel.track({
        id: authUserId,
        display_name: get().displayName,
        status: "in_game",
      });
    }
  },

  leaveRoom: async () => {
    const { roomChannel, currentRoom, authUserId } = get();

    // Clear local state immediately so navigations don't see stale room
    set({
      currentRoom: null,
      roomChannel: null,
      isHost: false,
      opponentName: null,
    });

    // Async cleanup — broadcast, DB updates, channel teardown
    if (roomChannel) {
      roomChannel.send({
        type: "broadcast",
        event: "player_left",
        payload: { playerId: authUserId },
      });
      await supabase.removeChannel(roomChannel);
    }

    if (currentRoom) {
      await supabase
        .from("rooms")
        .update({ status: "abandoned" as RoomStatus })
        .eq("id", currentRoom.id);
    }

    if (authUserId) {
      await supabase
        .from("online_players")
        .update({ status: "online" as PlayerStatus })
        .eq("id", authUserId);

      const { lobbyChannel } = get();
      if (lobbyChannel) {
        await lobbyChannel.track({
          id: authUserId,
          display_name: get().displayName,
          status: "online",
        });
      }
    }
  },

  sendInvite: async (toId, gameType, gameOptions) => {
    const { authUserId, displayName } = get();
    if (!authUserId) return;

    // Create room first
    const room = await get().createRoom(gameType, gameOptions);
    if (!room) return;

    const now = new Date();
    const expiresAt = new Date(now.getTime() + 30000);

    const invite: Invite = {
      id:
        typeof crypto.randomUUID === "function"
          ? crypto.randomUUID()
          : `${Date.now()}-${Math.random().toString(36).slice(2, 11)}`,
      from_id: authUserId,
      to_id: toId,
      room_id: room.id,
      game_type: gameType,
      game_options: gameOptions,
      status: "pending",
      created_at: now.toISOString(),
      expires_at: expiresAt.toISOString(),
      from_name: displayName ?? "Unknown",
    };

    // Store invite in DB
    await supabase.from("invites").insert({
      id: invite.id,
      from_id: invite.from_id,
      to_id: invite.to_id,
      room_id: invite.room_id,
      game_type: invite.game_type,
      game_options: invite.game_options,
      status: invite.status,
      created_at: invite.created_at,
      expires_at: invite.expires_at,
    });

    // Broadcast invite via lobby channel
    const { lobbyChannel } = get();
    if (lobbyChannel) {
      lobbyChannel.send({
        type: "broadcast",
        event: "invite",
        payload: invite,
      });
    }

    set({ sentInvite: invite });
  },

  acceptInvite: async (invite: Invite) => {
    const { authUserId, lobbyChannel } = get();
    if (!authUserId) return;

    // Update invite in DB
    await supabase
      .from("invites")
      .update({ status: "accepted" as InviteStatus })
      .eq("id", invite.id);

    // Notify sender via lobby broadcast (include guest info so host can resolve name)
    if (lobbyChannel) {
      lobbyChannel.send({
        type: "broadcast",
        event: "invite_response",
        payload: {
          invite_id: invite.id,
          status: "accepted",
          room_id: invite.room_id,
          guest_id: authUserId,
          guest_name: get().displayName,
        },
      });
    }

    set({ pendingInvite: null, opponentName: invite.from_name ?? null });

    // Join the room
    await get().joinRoom(invite.room_id);
  },

  declineInvite: async (invite: Invite) => {
    const { lobbyChannel } = get();

    await supabase
      .from("invites")
      .update({ status: "declined" as InviteStatus })
      .eq("id", invite.id);

    if (lobbyChannel) {
      lobbyChannel.send({
        type: "broadcast",
        event: "invite_response",
        payload: {
          invite_id: invite.id,
          status: "declined",
          room_id: invite.room_id,
        },
      });
    }

    set({ pendingInvite: null });
  },

  dismissInvite: () => set({ pendingInvite: null }),
  dismissSentInvite: () => set({ sentInvite: null }),
  setCurrentRoom: (room) => set({ currentRoom: room }),
  setRoomChannel: (channel) => set({ roomChannel: channel }),
  updateRoomStatus: (status) => {
    const { currentRoom } = get();
    if (currentRoom) {
      set({ currentRoom: { ...currentRoom, status } });
      void supabase.from("rooms").update({ status }).eq("id", currentRoom.id);
    }
  },
}));
