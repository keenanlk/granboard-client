import { Client } from "colyseus.js";
import type { Room } from "colyseus.js";
import { ConnectionManager } from "./ConnectionManager.ts";
import { logger } from "../lib/logger.ts";
import type {
  OnlineStoreState,
  MatchReadyState,
  MatchCountdown,
  MatchStart,
  MatchAlert,
  RegistrationUpdate,
  TournamentCreatedEvent,
} from "../store/online.types.ts";
import type { Database } from "@nlc-darts/tournament";

const log = logger.child({ module: "tournament-conn" });

const rawColyseusUrl =
  (import.meta.env.VITE_COLYSEUS_URL as string) ?? "ws://localhost:2567";
const COLYSEUS_URL = rawColyseusUrl.startsWith("/")
  ? `${location.origin}${rawColyseusUrl}`
  : rawColyseusUrl;

type StoreWriter = (partial: Partial<OnlineStoreState>) => void;

export class TournamentConnectionManager extends ConnectionManager {
  private client: Client;
  private room: Room | null = null;
  private currentTournamentId: string | undefined;
  private setState: StoreWriter;

  constructor(setState: StoreWriter) {
    super(3);
    this.client = new Client(COLYSEUS_URL);
    this.setState = setState;
  }

  /** Bind store writer (called when store is ready). */
  bindStore(setState: StoreWriter): void {
    this.setState = setState;
  }

  /** Get the current room. */
  getRoom(): Room | null {
    return this.room;
  }

  /** Connect to a tournament room. Handles reconnection if tournamentId changed. */
  async connect(tournamentId?: string): Promise<void> {
    // If already connected to a different tournament, disconnect first
    if (
      this.room &&
      tournamentId &&
      this.currentTournamentId !== tournamentId
    ) {
      this.room.leave();
      this.room = null;
    }

    if (this.room) return;

    this.currentTournamentId = tournamentId;

    try {
      this.setState({ tournamentPhase: "connecting" });
      const room = await this.client.joinOrCreate(
        "tournament",
        tournamentId ? { tournamentId } : {},
      );
      this.room = room;
      this.resetReconnect();
      this.installHandlers(room);
      this.setState({ tournamentPhase: "lobby", tournamentError: null });
      log.info({ roomId: room.roomId, tournamentId }, "Tournament connected");
    } catch (err) {
      log.error({ err }, "Tournament connection failed");
      this.setState({
        tournamentPhase: "disconnected",
        tournamentError:
          err instanceof Error ? err.message : "Connection failed",
      });
    }
  }

  /** Disconnect from the tournament room. */
  disconnect(): void {
    if (this.room) {
      this.room.leave();
      this.room = null;
    }
    this.currentTournamentId = undefined;
    this.setState({
      tournamentPhase: "disconnected",
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
    });
  }

  /** Send a message to the tournament room. */
  send(type: string, data: unknown = {}): void {
    if (!this.room) {
      log.warn({ type }, "No tournament room for send");
      return;
    }
    this.room.send(type, data);
  }

  private installHandlers(room: Room): void {
    room.onMessage(
      "bracket_update",
      (data: {
        bracketData: Database;
        participantUserMap?: Record<number, string>;
      }) => {
        this.setState({
          bracketData: data.bracketData,
          ...(data.participantUserMap
            ? { participantUserMap: data.participantUserMap }
            : {}),
        });
      },
    );

    room.onMessage("registration_update", (data: RegistrationUpdate) => {
      this.setState({ registrationUpdate: data });
    });

    room.onMessage("tournament_created", (data: TournamentCreatedEvent) => {
      this.setState({ tournamentCreated: data });
    });

    room.onMessage("tournament_error", (data: { error: string }) => {
      this.setState({ tournamentError: data.error });
    });

    room.onMessage("match_ready_state", (data: MatchReadyState) => {
      this.setState({ matchReadyState: data });
    });

    room.onMessage("match_countdown", (data: MatchCountdown) => {
      this.setState({ matchCountdown: data });
    });

    room.onMessage("match_start", (data: MatchStart) => {
      this.setState({ matchStart: data });
    });

    room.onMessage("match_your_turn", (data: MatchAlert) => {
      this.setState({ matchAlert: data });
    });

    room.onMessage(
      "match_game_room_created",
      (data: { matchId: number; colyseusRoomId: string }) => {
        this.setState({ matchGameRoom: data });
      },
    );

    room.onLeave((code: number) => {
      log.info({ code }, "Tournament room onLeave");
      this.room = null;
      this.setState({ tournamentPhase: "disconnected" });

      if (code !== 1000 && code !== 4000) {
        // Abnormal close — try to reconnect
        this.attemptReconnect();
      }
    });
  }

  private attemptReconnect(): void {
    const scheduled = this.scheduleReconnect(() => {
      void this.connect(this.currentTournamentId);
    });

    if (!scheduled) {
      this.setState({
        tournamentPhase: "disconnected",
        tournamentError: "Connection lost — max retries exceeded",
      });
    }
  }

  override cleanup(): void {
    if (this.room) {
      try {
        this.room.leave();
      } catch {
        // Already disconnected
      }
      this.room = null;
    }
    this.currentTournamentId = undefined;
    super.cleanup();
  }
}
