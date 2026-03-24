import type { RealtimeChannel } from "@supabase/supabase-js";
import type { Json } from "@nlc-darts/supabase";
import { supabase } from "../lib/supabaseClient.ts";
import { ConnectionManager } from "./ConnectionManager.ts";
import { logger } from "../lib/logger.ts";
import type {
  OnlinePlayer,
  Invite,
  InviteStatus,
  PlayerStatus,
  Room,
  RoomStatus,
  OnlineGameType,
  OnlineStoreState,
} from "../store/online.types.ts";

const log = logger.child({ module: "supabase-conn" });

type StoreWriter = (partial: Partial<OnlineStoreState>) => void;
type StoreReader = () => OnlineStoreState;

export interface PresencePayload {
  id: string;
  display_name: string;
  avatar_url: string | null;
  status: PlayerStatus;
  x01_grade: string | null;
  x01_ppd: number;
  x01_games: number;
  cricket_grade: string | null;
  cricket_mpr: number;
  cricket_games: number;
}

export class SupabaseConnectionManager extends ConnectionManager {
  private lobbyChannel: RealtimeChannel | null = null;
  private roomChannel: RealtimeChannel | null = null;
  private heartbeatInterval: ReturnType<typeof setInterval> | null = null;
  private getState: StoreReader;
  private setState: StoreWriter;

  constructor(getState: StoreReader, setState: StoreWriter) {
    super();
    this.getState = getState;
    this.setState = setState;
  }

  /** Bind store access (called when store is ready). */
  bindStore(getState: StoreReader, setState: StoreWriter): void {
    this.getState = getState;
    this.setState = setState;
  }

  buildPresencePayload(
    state: OnlineStoreState,
    statusOverride?: PlayerStatus,
  ): PresencePayload {
    return {
      id: state.authUserId!,
      display_name: state.displayName ?? "Player",
      avatar_url: null,
      status: statusOverride ?? "online",
      x01_grade: state.stats.x01.grade,
      x01_ppd: state.stats.x01.ppd,
      x01_games: state.stats.x01.games,
      cricket_grade: state.stats.cricket.grade,
      cricket_mpr: state.stats.cricket.mpr,
      cricket_games: state.stats.cricket.games,
    };
  }

  async joinLobby(userId: string): Promise<void> {
    if (this.lobbyChannel) return;

    const channel = supabase.channel("lobby", {
      config: { presence: { key: userId } },
    });

    channel
      .on("presence", { event: "sync" }, () => {
        const state = channel.presenceState();
        const players: OnlinePlayer[] = [];
        const myId = this.getState().authUserId;
        for (const [, presences] of Object.entries(state)) {
          const p = presences[0] as unknown as PresencePayload;
          if (p.id !== myId) {
            players.push({
              id: p.id,
              display_name: p.display_name,
              avatar_url: p.avatar_url ?? null,
              status: p.status,
              last_seen: new Date().toISOString(),
              x01_grade: p.x01_grade ?? null,
              x01_ppd: p.x01_ppd ?? 0,
              x01_games: p.x01_games ?? 0,
              cricket_grade: p.cricket_grade ?? null,
              cricket_mpr: p.cricket_mpr ?? 0,
              cricket_games: p.cricket_games ?? 0,
            });
          }
        }
        this.setState({ onlinePlayers: players });
      })
      .on(
        "broadcast",
        { event: "invite" },
        ({ payload }: { payload: Invite }) => {
          if (payload.to_id === this.getState().authUserId) {
            this.setState({ pendingInvite: payload, invitePhase: "received" });
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
          const sent = this.getState().sentInvite;
          if (sent && sent.id === payload.invite_id) {
            if (payload.status === "accepted") {
              const { currentRoom } = this.getState();
              if (currentRoom) {
                this.setState({
                  sentInvite: null,
                  invitePhase: "idle",
                  currentRoom: {
                    ...currentRoom,
                    guest_id: payload.guest_id ?? sent.to_id,
                  },
                  opponentName: payload.guest_name ?? null,
                });
              } else {
                this.setState({ sentInvite: null, invitePhase: "idle" });
              }
            } else {
              this.setState({ sentInvite: null, invitePhase: "idle" });
            }
          }
        },
      )
      .subscribe(async (status) => {
        if (status === "SUBSCRIBED") {
          await channel.track(
            this.buildPresencePayload(this.getState()) as unknown as Record<
              string,
              unknown
            >,
          );
        }
      });

    this.lobbyChannel = channel;
    this.trackResource(() => {
      if (this.lobbyChannel) {
        void supabase.removeChannel(this.lobbyChannel);
        this.lobbyChannel = null;
      }
    });

    // Heartbeat — update last_seen every 30s
    this.heartbeatInterval = setInterval(async () => {
      const { authUserId } = this.getState();
      if (!authUserId) {
        this.stopHeartbeat();
        return;
      }
      await supabase
        .from("online_players")
        .update({ last_seen: new Date().toISOString() })
        .eq("id", authUserId);
    }, 30000);
    this.trackResource(() => this.stopHeartbeat());
  }

  leaveLobby(): void {
    if (this.lobbyChannel) {
      void supabase.removeChannel(this.lobbyChannel);
      this.lobbyChannel = null;
    }
    this.stopHeartbeat();
  }

  async updatePresenceStatus(status: PlayerStatus): Promise<void> {
    if (!this.lobbyChannel) return;
    await this.lobbyChannel.track(
      this.buildPresencePayload(this.getState(), status) as unknown as Record<
        string,
        unknown
      >,
    );
  }

  joinRoomChannel(roomId: string): void {
    if (this.roomChannel) return;
    const channel = supabase.channel(`room:${roomId}`);

    // Listen for rematch broadcasts
    channel.on("broadcast", { event: "rematch_request" }, () => {
      const s = this.getState();
      this.setState({
        rematchPhase: s.rematchPhase === "sent" ? "accepted" : "received",
      });
    });
    channel.on("broadcast", { event: "rematch_accept" }, () => {
      this.setState({ rematchPhase: "accepted" });
    });
    channel.on("broadcast", { event: "rematch_decline" }, () => {
      this.setState({ rematchPhase: "declined" });
    });

    channel.subscribe();
    this.roomChannel = channel;
    this.trackResource(() => {
      if (this.roomChannel) {
        void supabase.removeChannel(this.roomChannel);
        this.roomChannel = null;
      }
    });
  }

  /** Register a custom broadcast handler on the room channel. */
  onRoomBroadcast(event: string, handler: (payload: unknown) => void): void {
    if (!this.roomChannel) {
      log.warn({ event }, "No room channel for onRoomBroadcast");
      return;
    }
    this.roomChannel.on(
      "broadcast",
      { event },
      ({ payload }: { payload: unknown }) => handler(payload),
    );
  }

  leaveRoomChannel(): void {
    if (this.roomChannel) {
      void supabase.removeChannel(this.roomChannel);
      this.roomChannel = null;
    }
  }

  sendBroadcast(event: string, payload: Record<string, unknown>): void {
    if (!this.roomChannel) {
      log.warn({ event }, "No room channel for broadcast");
      return;
    }
    this.roomChannel.send({
      type: "broadcast",
      event,
      payload,
    });
  }

  sendLobbyBroadcast(event: string, payload: Record<string, unknown>): void {
    if (!this.lobbyChannel) {
      log.warn({ event }, "No lobby channel for broadcast");
      return;
    }
    this.lobbyChannel.send({
      type: "broadcast",
      event,
      payload,
    });
  }

  async sendInvite(
    toId: string,
    gameType: OnlineGameType,
    gameOptions: unknown,
    roomId: string,
  ): Promise<Invite | null> {
    const { authUserId, displayName } = this.getState();
    if (!authUserId) return null;

    const now = new Date();
    const expiresAt = new Date(now.getTime() + 30000);

    const invite: Invite = {
      id:
        typeof crypto.randomUUID === "function"
          ? crypto.randomUUID()
          : `${Date.now()}-${Math.random().toString(36).slice(2, 11)}`,
      from_id: authUserId,
      to_id: toId,
      room_id: roomId,
      game_type: gameType,
      game_options: gameOptions,
      status: "pending",
      created_at: now.toISOString(),
      expires_at: expiresAt.toISOString(),
      from_name: displayName ?? "Unknown",
    };

    await supabase.from("invites").insert({
      id: invite.id,
      from_id: invite.from_id,
      to_id: invite.to_id,
      room_id: invite.room_id,
      game_type: invite.game_type,
      game_options: invite.game_options as Json,
      status: invite.status,
      created_at: invite.created_at,
      expires_at: invite.expires_at,
    });

    this.sendLobbyBroadcast(
      "invite",
      invite as unknown as Record<string, unknown>,
    );
    return invite;
  }

  async respondToInvite(
    invite: Invite,
    status: "accepted" | "declined",
  ): Promise<void> {
    const { authUserId, displayName } = this.getState();

    await supabase
      .from("invites")
      .update({ status: status as InviteStatus })
      .eq("id", invite.id);

    const payload: Record<string, unknown> = {
      invite_id: invite.id,
      status,
      room_id: invite.room_id,
    };

    if (status === "accepted") {
      payload.guest_id = authUserId;
      payload.guest_name = displayName;
    }

    this.sendLobbyBroadcast("invite_response", payload);
  }

  /** Fetch the existing player record (returns null if not found). */
  async fetchPlayer(
    userId: string,
  ): Promise<{ display_name: string; avatar_url: string | null } | null> {
    const { data } = await supabase
      .from("online_players")
      .select("display_name, avatar_url")
      .eq("id", userId)
      .single();
    return data;
  }

  /** Upsert the online_players DB record. */
  async upsertPlayer(
    userId: string,
    displayName: string,
    status: PlayerStatus,
    avatarUrl?: string | null,
  ): Promise<void> {
    await supabase.from("online_players").upsert(
      {
        id: userId,
        display_name: displayName,
        avatar_url: avatarUrl ?? null,
        status,
        last_seen: new Date().toISOString(),
      },
      { onConflict: "id" },
    );
  }

  /** Update player status in DB. */
  async updatePlayerStatus(
    userId: string,
    status: PlayerStatus,
  ): Promise<void> {
    await supabase.from("online_players").update({ status }).eq("id", userId);
  }

  /** Create a room record in Supabase. */
  async createRoomRecord(
    hostId: string,
    gameType: OnlineGameType,
    gameOptions: unknown,
  ): Promise<Room | null> {
    const { data, error } = await supabase
      .from("rooms")
      .insert({
        host_id: hostId,
        status: "waiting" as RoomStatus,
        game_type: gameType,
        game_options: gameOptions as Json,
      })
      .select()
      .single();

    if (error) {
      log.error({ err: error }, "createRoomRecord failed");
      return null;
    }

    return data as Room;
  }

  /** Join an existing room record. */
  async joinRoomRecord(roomId: string, guestId: string): Promise<Room | null> {
    const { data, error } = await supabase
      .from("rooms")
      .update({ guest_id: guestId })
      .eq("id", roomId)
      .select()
      .single();

    if (error) {
      log.error({ err: error }, "joinRoomRecord failed");
      return null;
    }

    return data as Room;
  }

  /** Mark a room as abandoned. */
  async abandonRoom(roomId: string): Promise<void> {
    await supabase
      .from("rooms")
      .update({ status: "abandoned" as RoomStatus })
      .eq("id", roomId);
  }

  /** Update room status. */
  async updateRoomRecordStatus(
    roomId: string,
    status: RoomStatus,
  ): Promise<void> {
    await supabase.from("rooms").update({ status }).eq("id", roomId);
  }

  private stopHeartbeat(): void {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
      this.heartbeatInterval = null;
    }
  }

  override cleanup(): void {
    this.leaveLobby();
    this.leaveRoomChannel();
    super.cleanup();
  }
}
