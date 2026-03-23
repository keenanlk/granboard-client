import { Room } from "@colyseus/core";
import type { Client } from "@colyseus/core";
import { TournamentManager, Status } from "@nlc-darts/tournament";
import type { TournamentFormat } from "@nlc-darts/tournament";
import { supabaseAdmin } from "../supabaseAdmin.js";
import { createSupabaseStorage } from "../lib/supabaseStorage.js";
import { generateJoinCode } from "../lib/joinCode.js";
import { ClientMessage, ServerMessage } from "../messages.js";
import { logger } from "../lib/logger.js";

const log = logger.child({ room: "tournament" });

const INACTIVITY_TIMEOUT_MS = 30 * 60 * 1000; // 30 minutes for tournaments

function isPowerOfTwo(n: number): boolean {
  return n > 0 && (n & (n - 1)) === 0;
}

export class TournamentRoom extends Room {
  manager: TournamentManager | null = null;
  tournamentId: string | null = null;
  inactivityTimer: ReturnType<typeof setTimeout> | null = null;

  /** Maps brackets-manager participant ID → userId */
  participantToUser: Map<number, string> = new Map();
  /** Maps userId → brackets-manager participant ID */
  userToParticipant: Map<string, number> = new Map();
  /** Tracks leg wins per match: matchId → [opponent1Wins, opponent2Wins] */
  matchLegWins: Map<number, [number, number]> = new Map();
  /** Tracks which userIds have readied up per match */
  matchReadyState: Map<number, Set<string>> = new Map();
  /** Active countdown intervals per match */
  activeCountdowns: Map<number, ReturnType<typeof setInterval>> = new Map();

  onCreate(): void {
    if (!supabaseAdmin) {
      log.error("Supabase not configured — TournamentRoom cannot operate");
      return;
    }

    this.manager = new TournamentManager(
      createSupabaseStorage(supabaseAdmin),
    );

    this.maxClients = 64;

    this.onMessage(
      ClientMessage.CREATE_TOURNAMENT,
      (client, data: CreateTournamentPayload) =>
        this.handleCreateTournament(client, data),
    );

    this.onMessage(
      ClientMessage.START_TOURNAMENT,
      (client, data: { tournamentId: string; userId: string }) =>
        this.handleStartTournament(client, data),
    );

    this.onMessage(
      ClientMessage.RECORD_RESULT,
      (client, data: RecordResultPayload) =>
        this.handleRecordResult(client, data),
    );

    this.onMessage(
      ClientMessage.REGISTER_PLAYER,
      (client, data: { tournamentId: string; userId: string }) =>
        this.handleRegisterPlayer(client, data),
    );

    this.onMessage(
      ClientMessage.UNREGISTER_PLAYER,
      (client, data: { tournamentId: string; userId: string }) =>
        this.handleUnregisterPlayer(client, data),
    );

    this.onMessage(
      ClientMessage.READY_FOR_MATCH,
      (client, data: { matchId: number; userId: string }) =>
        this.handleReadyForMatch(client, data),
    );

    this.onMessage(
      ClientMessage.UNREADY_FOR_MATCH,
      (client, data: { matchId: number; userId: string }) =>
        this.handleUnreadyForMatch(client, data),
    );

    this.onMessage(
      ClientMessage.MATCH_GAME_RESULT,
      (
        client,
        data: {
          matchId: number;
          winnerUserId: string;
          legResults: Array<{ winnerName: string; winnerIndex: number }>;
        },
      ) => this.handleMatchGameResult(client, data),
    );

    this.resetInactivity();
    log.info("TournamentRoom created");
  }

  onJoin(client: Client): void {
    log.info({ sessionId: client.sessionId }, "Client joined tournament room");
    this.resetInactivity();
  }

  onLeave(client: Client): void {
    log.info({ sessionId: client.sessionId }, "Client left tournament room");
  }

  onDispose(): void {
    if (this.inactivityTimer) clearTimeout(this.inactivityTimer);
    for (const interval of this.activeCountdowns.values()) {
      clearInterval(interval);
    }
    this.activeCountdowns.clear();
    log.info("TournamentRoom disposed");
  }

  // ── Handlers ────────────────────────────────────────────────────────────────

  private async handleCreateTournament(
    client: Client,
    data: CreateTournamentPayload,
  ): Promise<void> {
    if (!supabaseAdmin) return;

    try {
      const { name, format, visibility, scheduledAt, registrationDeadline, maxParticipants, createdBy } = data;

      // Validate power of 2 for elimination formats
      if (
        maxParticipants &&
        format !== "round_robin" &&
        !isPowerOfTwo(maxParticipants)
      ) {
        client.send(ServerMessage.TOURNAMENT_ERROR, {
          error: "Max participants must be a power of 2 for elimination formats",
        });
        return;
      }

      const joinCode = await generateJoinCode(supabaseAdmin);

      const { data: tournament, error } = await supabaseAdmin
        .from("tournaments")
        .insert({
          name,
          format,
          visibility: visibility ?? "public",
          status: "registration",
          join_code: joinCode,
          created_by: createdBy,
          scheduled_at: scheduledAt ?? null,
          registration_deadline: registrationDeadline ?? null,
          max_participants: maxParticipants ?? null,
        })
        .select()
        .single();

      if (error) {
        log.error({ error }, "Failed to create tournament");
        client.send(ServerMessage.TOURNAMENT_ERROR, {
          error: "Failed to create tournament",
        });
        return;
      }

      this.tournamentId = tournament.id;

      client.send(ServerMessage.TOURNAMENT_CREATED, {
        tournamentId: tournament.id,
        joinCode,
      });

      log.info(
        { tournamentId: tournament.id, joinCode },
        "Tournament created",
      );
    } catch (err) {
      log.error({ err }, "Error creating tournament");
      client.send(ServerMessage.TOURNAMENT_ERROR, {
        error: "Internal error creating tournament",
      });
    }
  }

  private async handleStartTournament(
    client: Client,
    data: { tournamentId: string; userId: string },
  ): Promise<void> {
    if (!supabaseAdmin || !this.manager) return;

    try {
      const { tournamentId, userId } = data;

      // Fetch tournament
      const { data: tournament, error: tErr } = await supabaseAdmin
        .from("tournaments")
        .select("*")
        .eq("id", tournamentId)
        .single();

      if (tErr || !tournament) {
        client.send(ServerMessage.TOURNAMENT_ERROR, {
          error: "Tournament not found",
        });
        return;
      }

      // Prevent double-start
      if (tournament.status !== "registration") {
        client.send(ServerMessage.TOURNAMENT_ERROR, {
          error: "Tournament has already started",
        });
        return;
      }

      // Verify the client is the organiser
      if (tournament.created_by !== userId) {
        client.send(ServerMessage.TOURNAMENT_ERROR, {
          error: "Only the organiser can start the tournament",
        });
        return;
      }

      // Fetch registrations
      const { data: registrations } = await supabaseAdmin
        .from("tournament_registrations")
        .select("user_id")
        .eq("tournament_id", tournamentId);

      if (!registrations || registrations.length < 2) {
        client.send(ServerMessage.TOURNAMENT_ERROR, {
          error: "Need at least 2 participants to start",
        });
        return;
      }

      // Fetch player names
      const userIds = registrations.map(
        (r: { user_id: string }) => r.user_id,
      );
      const { data: players } = await supabaseAdmin
        .from("online_players")
        .select("id, display_name")
        .in("id", userIds);

      if (!players) {
        client.send(ServerMessage.TOURNAMENT_ERROR, {
          error: "Failed to fetch player details",
        });
        return;
      }

      const participantNames = players.map(
        (p: { display_name: string }) => p.display_name,
      );

      // Use a numeric tournament_id for brackets-manager
      // Insert participants with tournament UUID reference
      const format = tournament.format as TournamentFormat;

      // Create the bracket stage
      await this.manager.createStage(
        tournamentId,
        format,
        participantNames,
      );

      // Update tournament status
      await supabaseAdmin
        .from("tournaments")
        .update({ status: "in_progress" })
        .eq("id", tournamentId);

      // Build participant ↔ userId mappings
      const bracketData = await this.manager.getBracketData(tournamentId);
      for (const participant of bracketData.participant) {
        const player = players.find(
          (p: { id: string; display_name: string }) =>
            p.display_name === participant.name,
        );
        if (player) {
          this.participantToUser.set(participant.id as number, player.id);
          this.userToParticipant.set(player.id, participant.id as number);
        }
      }

      // Broadcast bracket data to all clients
      this.broadcast(ServerMessage.BRACKET_UPDATE, { bracketData });

      // Notify players of any immediately-ready matches (e.g., after BYE auto-advances)
      await this.broadcastReadyMatches();

      log.info(
        { tournamentId, participants: participantNames.length },
        "Tournament started",
      );
    } catch (err) {
      log.error({ err }, "Error starting tournament");
      client.send(ServerMessage.TOURNAMENT_ERROR, {
        error: "Internal error starting tournament",
      });
    }
  }

  private async handleRecordResult(
    client: Client,
    data: RecordResultPayload,
  ): Promise<void> {
    if (!this.manager) return;

    try {
      const { matchId, opponent1Score, opponent2Score } = data;

      await this.manager.recordResult(matchId, {
        opponent1Score,
        opponent2Score,
      });

      // Broadcast updated bracket
      if (this.tournamentId) {
        const bracketData =
          await this.manager.getBracketData(this.tournamentId);
        this.broadcast(ServerMessage.BRACKET_UPDATE, { bracketData });

        // Check if tournament is complete (all matches completed)
        const allComplete = bracketData.match.every(
          (m) => m.status >= 4, // Status.Completed = 4
        );
        if (allComplete && supabaseAdmin) {
          await supabaseAdmin
            .from("tournaments")
            .update({ status: "completed" })
            .eq("id", this.tournamentId);
        }
      }

      this.resetInactivity();
      log.info({ matchId }, "Match result recorded");
    } catch (err) {
      log.error({ err }, "Error recording result");
      client.send(ServerMessage.TOURNAMENT_ERROR, {
        error: "Failed to record result",
      });
    }
  }

  private async handleRegisterPlayer(
    client: Client,
    data: { tournamentId: string; userId: string },
  ): Promise<void> {
    if (!supabaseAdmin) return;

    try {
      const { tournamentId, userId } = data;

      // Check max participants
      const { data: tournament } = await supabaseAdmin
        .from("tournaments")
        .select("max_participants, status")
        .eq("id", tournamentId)
        .single();

      if (!tournament || tournament.status !== "registration") {
        client.send(ServerMessage.TOURNAMENT_ERROR, {
          error: "Registration is not open",
        });
        return;
      }

      if (tournament.max_participants) {
        const { count } = await supabaseAdmin
          .from("tournament_registrations")
          .select("*", { count: "exact", head: true })
          .eq("tournament_id", tournamentId);

        if (count !== null && count >= tournament.max_participants) {
          client.send(ServerMessage.TOURNAMENT_ERROR, {
            error: "Tournament is full",
          });
          return;
        }
      }

      await supabaseAdmin.from("tournament_registrations").insert({
        tournament_id: tournamentId,
        user_id: userId,
      });

      // Broadcast registration update
      await this.broadcastRegistrationUpdate(tournamentId);
      this.resetInactivity();
    } catch (err) {
      log.error({ err }, "Error registering player");
      client.send(ServerMessage.TOURNAMENT_ERROR, {
        error: "Failed to register",
      });
    }
  }

  private async handleUnregisterPlayer(
    client: Client,
    data: { tournamentId: string; userId: string },
  ): Promise<void> {
    if (!supabaseAdmin) return;

    try {
      const { tournamentId, userId } = data;

      await supabaseAdmin
        .from("tournament_registrations")
        .delete()
        .eq("tournament_id", tournamentId)
        .eq("user_id", userId);

      await this.broadcastRegistrationUpdate(tournamentId);
      this.resetInactivity();
    } catch (err) {
      log.error({ err }, "Error unregistering player");
      client.send(ServerMessage.TOURNAMENT_ERROR, {
        error: "Failed to unregister",
      });
    }
  }

  // ── Match-play handlers ────────────────────────────────────────────────────

  private async handleReadyForMatch(
    _client: Client,
    data: { matchId: number; userId: string },
  ): Promise<void> {
    if (!this.manager || !this.tournamentId) return;

    try {
      const { matchId, userId } = data;

      const bracketData = await this.manager.getBracketData(this.tournamentId);
      const match = bracketData.match.find((m) => m.id === matchId);
      if (!match) return;

      // Allow Ready (2) or Waiting (1) if one opponent is a BYE
      const hasBye =
        match.opponent1?.id == null || match.opponent2?.id == null;
      if (match.status !== Status.Ready && !(match.status === Status.Waiting && hasBye)) {
        return;
      }

      const [uid1, uid2] = this.getMatchUserIds(match);
      if (userId !== uid1 && userId !== uid2) return;

      // Add to ready set
      if (!this.matchReadyState.has(matchId)) {
        this.matchReadyState.set(matchId, new Set());
      }
      const readySet = this.matchReadyState.get(matchId)!;
      readySet.add(userId);

      // Look up opponent name for the broadcast
      const opponentUid = userId === uid1 ? uid2 : uid1;
      const opponentParticipant = opponentUid
        ? bracketData.participant.find(
            (p) => p.id === this.userToParticipant.get(opponentUid),
          )
        : null;

      this.broadcast(ServerMessage.MATCH_READY_STATE, {
        matchId,
        readyPlayerIds: [...readySet],
        opponentName: opponentParticipant?.name ?? null,
      });

      // If both players ready, start countdown
      if (readySet.size === 2) {
        let secondsLeft = 3;
        this.broadcast(ServerMessage.MATCH_COUNTDOWN, {
          matchId,
          secondsLeft,
        });

        const interval = setInterval(() => {
          secondsLeft--;
          if (secondsLeft > 0) {
            this.broadcast(ServerMessage.MATCH_COUNTDOWN, {
              matchId,
              secondsLeft,
            });
          } else {
            clearInterval(interval);
            this.activeCountdowns.delete(matchId);
            void this.startMatch(matchId);
          }
        }, 1000);

        this.activeCountdowns.set(matchId, interval);
      }

      this.resetInactivity();
    } catch (err) {
      log.error({ err }, "Error handling ready for match");
    }
  }

  private handleUnreadyForMatch(
    _client: Client,
    data: { matchId: number; userId: string },
  ): void {
    const { matchId, userId } = data;

    const readySet = this.matchReadyState.get(matchId);
    if (readySet) {
      readySet.delete(userId);
    }

    // Cancel any active countdown
    const countdown = this.activeCountdowns.get(matchId);
    if (countdown) {
      clearInterval(countdown);
      this.activeCountdowns.delete(matchId);
    }

    this.broadcast(ServerMessage.MATCH_READY_STATE, {
      matchId,
      readyPlayerIds: readySet ? [...readySet] : [],
      opponentName: null,
    });

    this.resetInactivity();
  }

  private async startMatch(matchId: number): Promise<void> {
    if (!this.manager || !this.tournamentId || !supabaseAdmin) return;

    try {
      const bracketData = await this.manager.getBracketData(this.tournamentId);
      const match = bracketData.match.find((m) => m.id === matchId);
      if (!match) return;

      const [uid1, uid2] = this.getMatchUserIds(match);

      const p1 = match.opponent1?.id != null
        ? bracketData.participant.find((p) => p.id === match.opponent1!.id)
        : null;
      const p2 = match.opponent2?.id != null
        ? bracketData.participant.find((p) => p.id === match.opponent2!.id)
        : null;

      // Fetch game settings from tournament
      const { data: tournament } = await supabaseAdmin
        .from("tournaments")
        .select("game_settings")
        .eq("id", this.tournamentId)
        .single();

      this.broadcast(ServerMessage.MATCH_START, {
        matchId,
        playerNames: [p1?.name ?? null, p2?.name ?? null],
        playerIds: [uid1, uid2],
        gameSettings: tournament?.game_settings ?? null,
        colyseusRoomId: null,
      });

      // Clean up ready state and countdown
      this.matchReadyState.delete(matchId);
      const countdown = this.activeCountdowns.get(matchId);
      if (countdown) {
        clearInterval(countdown);
        this.activeCountdowns.delete(matchId);
      }

      log.info({ matchId }, "Match started");
    } catch (err) {
      log.error({ err }, "Error starting match");
    }
  }

  private async handleMatchGameResult(
    client: Client,
    data: {
      matchId: number;
      winnerUserId: string;
      legResults: Array<{ winnerName: string; winnerIndex: number }>;
    },
  ): Promise<void> {
    if (!this.manager || !this.tournamentId) return;

    try {
      const { matchId, winnerUserId, legResults } = data;

      const bracketData = await this.manager.getBracketData(this.tournamentId);
      const match = bracketData.match.find((m) => m.id === matchId);
      if (!match) return;

      const winnerParticipantId = this.userToParticipant.get(winnerUserId);
      if (winnerParticipantId == null) {
        log.error({ winnerUserId }, "Winner userId not mapped to participant");
        return;
      }

      // Count leg wins per side from legResults
      let opponent1Score = 0;
      let opponent2Score = 0;
      for (const leg of legResults) {
        if (leg.winnerIndex === 0) {
          opponent1Score++;
        } else {
          opponent2Score++;
        }
      }

      await this.manager.recordResult(matchId, {
        opponent1Score,
        opponent2Score,
      });

      // Broadcast updated bracket
      const updatedBracket =
        await this.manager.getBracketData(this.tournamentId);
      this.broadcast(ServerMessage.BRACKET_UPDATE, {
        bracketData: updatedBracket,
      });

      // Check if tournament is complete
      const allComplete = updatedBracket.match.every(
        (m) => m.status >= Status.Completed,
      );
      if (allComplete && supabaseAdmin) {
        await supabaseAdmin
          .from("tournaments")
          .update({ status: "completed" })
          .eq("id", this.tournamentId);
      }

      // Notify players of newly ready matches
      await this.broadcastReadyMatches();

      // Clean up
      this.matchLegWins.delete(matchId);

      this.resetInactivity();
      log.info({ matchId, winnerUserId }, "Match game result recorded");
    } catch (err) {
      log.error({ err }, "Error recording match game result");
      client.send(ServerMessage.TOURNAMENT_ERROR, {
        error: "Failed to record match game result",
      });
    }
  }

  // ── Match-play helpers ────────────────────────────────────────────────────

  private getMatchUserIds(match: {
    opponent1: any;
    opponent2: any;
  }): [string | null, string | null] {
    const uid1 =
      match.opponent1?.id != null
        ? this.participantToUser.get(match.opponent1.id as number) ?? null
        : null;
    const uid2 =
      match.opponent2?.id != null
        ? this.participantToUser.get(match.opponent2.id as number) ?? null
        : null;
    return [uid1, uid2];
  }

  private async broadcastReadyMatches(): Promise<void> {
    if (!this.manager || !this.tournamentId) return;

    const bracketData = await this.manager.getBracketData(this.tournamentId);
    for (const match of bracketData.match) {
      if (match.status !== Status.Ready) continue;

      const [uid1, uid2] = this.getMatchUserIds(match);
      if (!uid1 || !uid2) continue;

      // Get opponent names for each player
      const p1 = bracketData.participant.find(
        (p) => p.id === match.opponent1?.id,
      );
      const p2 = bracketData.participant.find(
        (p) => p.id === match.opponent2?.id,
      );

      this.broadcast(ServerMessage.MATCH_YOUR_TURN, {
        matchId: match.id,
        playerIds: [uid1, uid2],
        playerNames: [p1?.name ?? null, p2?.name ?? null],
        tournamentId: this.tournamentId,
      });
    }
  }

  // ── Helpers ─────────────────────────────────────────────────────────────────

  private async broadcastRegistrationUpdate(
    tournamentId: string,
  ): Promise<void> {
    if (!supabaseAdmin) return;

    const { data: registrations } = await supabaseAdmin
      .from("tournament_registrations")
      .select("user_id, registered_at")
      .eq("tournament_id", tournamentId);

    const userIds = (registrations ?? []).map(
      (r: { user_id: string }) => r.user_id,
    );
    const { data: players } = await supabaseAdmin
      .from("online_players")
      .select("id, display_name")
      .in("id", userIds.length > 0 ? userIds : ["__none__"]);

    this.broadcast(ServerMessage.REGISTRATION_UPDATE, {
      tournamentId,
      participantCount: registrations?.length ?? 0,
      participants:
        players?.map((p: { id: string; display_name: string }) => ({
          id: p.id,
          name: p.display_name,
        })) ?? [],
    });
  }

  private resetInactivity(): void {
    if (this.inactivityTimer) clearTimeout(this.inactivityTimer);
    this.inactivityTimer = setTimeout(() => {
      log.info("Tournament room timed out due to inactivity");
      this.disconnect();
    }, INACTIVITY_TIMEOUT_MS);
  }
}

// ── Payload types ─────────────────────────────────────────────────────────────

interface CreateTournamentPayload {
  name: string;
  format: TournamentFormat;
  visibility?: "public" | "private";
  scheduledAt?: string | null;
  registrationDeadline?: string | null;
  maxParticipants?: number | null;
  createdBy: string;
}

interface RecordResultPayload {
  matchId: number;
  opponent1Score: number;
  opponent2Score: number;
}

