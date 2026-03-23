import { useEffect, useState } from "react";
import { HomeScreen } from "./screens/HomeScreen.tsx";
import { GameSetupScreen } from "./screens/GameSetupScreen.tsx";
import { GameScreen } from "./screens/GameScreen.tsx";
import { CricketScreen } from "./screens/CricketScreen.tsx";
import { HighScoreScreen } from "./screens/HighScoreScreen.tsx";
import { ATWScreen } from "./screens/ATWScreen.tsx";
import { TicTacToeScreen } from "./screens/TicTacToeScreen.tsx";
import { PlayersScreen } from "./screens/PlayersScreen.tsx";
import { OnboardingScreen } from "./screens/OnboardingScreen.tsx";
import { PracticeScreen } from "./screens/PracticeScreen.tsx";
import { SetSetupScreen } from "./screens/SetSetupScreen.tsx";
import { useGameStore } from "./store/useGameStore.ts";
import { usePlayerProfileStore } from "./store/usePlayerProfileStore.ts";
import { useCricketStore } from "./store/useCricketStore.ts";
import { getSetWinner, legCount } from "@nlc-darts/engine";
import type {
  X01Options,
  CricketOptions,
  HighScoreOptions,
  ATWOptions,
  TicTacToeOptions,
  BotSkill,
} from "@nlc-darts/engine";
import { useGranboardStore } from "./store/useGranboardStore.ts";
import { useBoardWiring } from "./hooks/useBoardWiring.ts";
import {
  loadSession,
  clearSession,
  type PersistedSession,
} from "./lib/sessionPersistence.ts";
import type {
  SetConfig,
  SetState,
  LegResult,
  SetProgress,
} from "@nlc-darts/engine";
import { OnlineLobbyScreen } from "./screens/OnlineLobbyScreen.tsx";
import { OnlineSetupScreen } from "./screens/OnlineSetupScreen.tsx";
import { AuthScreen } from "./screens/AuthScreen.tsx";
import { OnlineChoiceScreen } from "./screens/OnlineChoiceScreen.tsx";
import { TournamentHubScreen } from "./screens/TournamentHubScreen.tsx";
import { CreateTournamentScreen } from "./screens/CreateTournamentScreen.tsx";
import { BracketScreen } from "./screens/BracketScreen.tsx";
import { MatchReadyModal } from "./components/tournament/MatchReadyModal.tsx";
import { createOnlineTournament } from "./lib/tournamentApi.ts";
import { createLocalTournament } from "./db/tournamentDb.ts";
import { useOnlineStore } from "./store/useOnlineStore.ts";
import { supabase } from "./lib/supabaseClient.ts";
import type { OnlineGameType } from "./store/online.types.ts";
import type { OnlineConfig } from "./store/useOnlineStore.ts";
import { setPendingColyseusRoom } from "./hooks/useColyseusSync.ts";
import { useTournamentRoom } from "./hooks/useTournamentRoom.ts";
import { logger } from "./lib/logger.ts";
import type { TournamentGameConfig } from "@nlc-darts/tournament";
// Side-effect imports — activate sound and LED event subscriptions
import "./sound/soundEffects.ts";
import "./board/ledEffects.ts";
import { ErrorBoundary } from "./components/ErrorFallback.tsx";

const log = logger.child({ module: "colyseus" });

type Screen =
  | { name: "home" }
  | { name: "auth" }
  | { name: "players" }
  | { name: "practice" }
  | {
      name: "setup";
      game: "x01" | "cricket" | "highscore" | "atw" | "tictactoe";
    }
  | { name: "set-setup" }
  | { name: "online-lobby" }
  | {
      name: "online-setup";
      roomId: string;
      isHost: boolean;
      gameType: OnlineGameType;
      gameOptions?: unknown;
      hostName: string;
      guestName: string;
    }
  | {
      name: "game";
      x01Options: X01Options;
      playerNames: string[];
      playerIds: (string | null)[];
      botSkills: (BotSkill | null)[];
      restoredState?: unknown;
      onlineConfig?: OnlineConfig;
    }
  | {
      name: "cricket";
      options: CricketOptions;
      playerNames: string[];
      playerIds: (string | null)[];
      botSkills: (BotSkill | null)[];
      restoredState?: unknown;
      onlineConfig?: OnlineConfig;
    }
  | {
      name: "highscore";
      options: HighScoreOptions;
      playerNames: string[];
      playerIds: (string | null)[];
      botSkills: (BotSkill | null)[];
      restoredState?: unknown;
    }
  | {
      name: "atw";
      options: ATWOptions;
      playerNames: string[];
      playerIds: (string | null)[];
      botSkills: (BotSkill | null)[];
      restoredState?: unknown;
    }
  | {
      name: "tictactoe";
      options: TicTacToeOptions;
      playerNames: string[];
      playerIds: (string | null)[];
      botSkills: (BotSkill | null)[];
      restoredState?: unknown;
    }
  | { name: "online-choice" }
  | { name: "tournament-hub" }
  | { name: "create-tournament" }
  | { name: "bracket"; tournamentId: string; isOnline: boolean };

function formatTimeAgo(savedAt: number): string {
  const ago = Math.round((Date.now() - savedAt) / 60000);
  return ago < 1
    ? "just now"
    : ago < 60
      ? `${ago}m ago`
      : `${Math.round(ago / 60)}h ago`;
}

function ResumePrompt({
  session,
  onResume,
  onNewGame,
}: {
  session: PersistedSession;
  onResume: () => void;
  onNewGame: () => void;
}) {
  const gameLabel =
    session.gameType === "x01"
      ? "X01"
      : session.gameType === "cricket"
        ? "Cricket"
        : session.gameType === "atw"
          ? "Around the World"
          : session.gameType === "tictactoe"
            ? "Tic Tac Toe"
            : "High Score";
  const playerList = session.playerNames.join(", ");
  const [timeLabel] = useState(() => formatTimeAgo(session.savedAt));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm">
      <div className="bg-zinc-900 border border-zinc-700 rounded-2xl p-8 max-w-sm w-full mx-4 flex flex-col gap-6">
        <div className="flex flex-col gap-2 text-center">
          <h2 className="text-2xl font-black text-white uppercase tracking-widest">
            Resume Game?
          </h2>
          <p className="text-zinc-400 text-sm">
            <span className="text-white font-bold">{gameLabel}</span> with{" "}
            {playerList}
          </p>
          {session.setConfig && (
            <p className="text-blue-400 text-xs font-bold uppercase tracking-widest">
              Set Match \u2014 Leg {(session.currentLegIndex ?? 0) + 1}/
              {legCount(session.setConfig.format)}
            </p>
          )}
          <p className="text-zinc-600 text-xs">{timeLabel}</p>
        </div>
        <div className="flex flex-col gap-3">
          <button
            onClick={onResume}
            className="w-full py-4 rounded-xl font-black text-lg uppercase tracking-widest bg-emerald-600 text-white active:bg-emerald-700 transition-colors"
          >
            Resume
          </button>
          <button
            onClick={onNewGame}
            className="w-full py-3 rounded-xl font-bold text-sm uppercase tracking-widest bg-zinc-800 text-zinc-400 border border-zinc-700 active:bg-zinc-700 transition-colors"
          >
            New Game
          </button>
        </div>
      </div>
    </div>
  );
}

function App() {
  const [screen, setScreen] = useState<Screen>({ name: "home" });
  const [rematchKey, setRematchKey] = useState(0);
  const [setMatch, setSetMatch] = useState<SetState | null>(null);
  const [authedUserId, setAuthedUserId] = useState<string | null>(null);

  // Tournament room (lifted to App level for global match alerts)
  const tournamentRoom = useTournamentRoom();

  // Tournament match context — tracks a best-of series during tournament play
  const [tournamentMatch, setTournamentMatch] = useState<{
    tournamentId: string;
    matchId: number;
    bestOf: string;
    gameType: string;
    gameSettings: TournamentGameConfig;
    legResults: LegResult[];
    playerNames: string[];
    playerIds: string[];
  } | null>(null);

  // Connect tournament room when on tournament screens
  useEffect(() => {
    const inTournament = ["online-choice", "tournament-hub", "create-tournament", "bracket"].includes(screen.name);
    if (inTournament && !tournamentRoom.connected) {
      tournamentRoom.connect();
    }
    // Don't disconnect on screen change — keep alive for alerts
  }, [screen.name, tournamentRoom.connected, tournamentRoom.connect]);

  // Handle match_start from tournament room
  useEffect(() => {
    if (!tournamentRoom.matchStart) return;
    const { matchId, playerNames, playerIds, gameSettings } = tournamentRoom.matchStart;
    if (!gameSettings) return;

    // Determine which tournament this is for (use bracket screen's tournamentId if on that screen)
    const tid = screen.name === "bracket" ? (screen as { tournamentId: string }).tournamentId : "";

    setTournamentMatch({
      tournamentId: tid,
      matchId,
      bestOf: gameSettings.bestOf,
      gameType: gameSettings.gameType,
      gameSettings,
      legResults: [],
      playerNames,
      playerIds,
    });

    // Navigate to the game
    if (gameSettings.gameType === "x01" && gameSettings.x01Options) {
      setScreen({
        name: "game",
        x01Options: gameSettings.x01Options,
        playerNames,
        playerIds: playerIds.map((id) => id),
        botSkills: [null, null],
      });
    } else if (gameSettings.gameType === "cricket" && gameSettings.cricketOptions) {
      setScreen({
        name: "cricket",
        options: gameSettings.cricketOptions,
        playerNames,
        playerIds: playerIds.map((id) => id),
        botSkills: [null, null],
      });
    }

    tournamentRoom.clearMatchStart();
  }, [tournamentRoom.matchStart]);

  // Resolve authed user ID when entering online flows
  useEffect(() => {
    if (
      screen.name === "online-choice" ||
      screen.name === "tournament-hub" ||
      screen.name === "create-tournament" ||
      screen.name === "bracket"
    ) {
      const storeId = useOnlineStore.getState().authUserId;
      if (storeId) {
        setAuthedUserId(storeId);
      } else {
        supabase.auth.getSession().then(({ data: { session } }) => {
          setAuthedUserId(session?.user?.id ?? null);
        });
      }
    }
  }, [screen.name]);

  function handleRematch() {
    // Clear restoredState so the game starts fresh, then bump key to force remount
    if (screen.name === "game") {
      setScreen({ ...screen, restoredState: undefined });
    } else if (screen.name === "cricket") {
      setScreen({ ...screen, restoredState: undefined });
    } else if (screen.name === "highscore") {
      setScreen({ ...screen, restoredState: undefined });
    } else if (screen.name === "atw") {
      setScreen({ ...screen, restoredState: undefined });
    } else if (screen.name === "tictactoe") {
      setScreen({ ...screen, restoredState: undefined });
    }
    setRematchKey((k) => k + 1);
  }

  const [pendingResume, setPendingResume] = useState<PersistedSession | null>(
    () => {
      const session = loadSession();
      if (session?.gameState) {
        const state = session.gameState as Record<string, unknown>;
        const hasWinner = state.winner != null || state.winners != null;
        if (!hasWinner) return session;
        clearSession();
      }
      return null;
    },
  );

  useBoardWiring();

  useEffect(() => {
    useGranboardStore.getState().autoReconnect();

    // Re-attempt when app returns to foreground (iOS suspend/resume)
    function onResume() {
      const { status } = useGranboardStore.getState();
      if (status === "disconnected") {
        useGranboardStore.getState().autoReconnect();
      }
    }
    document.addEventListener("resume", onResume);
    document.addEventListener("visibilitychange", () => {
      if (document.visibilityState === "visible") onResume();
    });
    return () => {
      document.removeEventListener("resume", onResume);
      document.removeEventListener("visibilitychange", () => {});
    };
  }, []);

  useEffect(() => {
    usePlayerProfileStore.getState().load();
  }, []);

  const { loaded: playersLoaded, players } = usePlayerProfileStore();

  // --- Set match helpers ---

  function buildSetProgress(state: SetState): SetProgress {
    return {
      legResults: state.legResults,
      totalLegs: legCount(state.config.format),
      currentLeg: state.currentLegIndex + 1,
      playerNames: state.playerNames,
    };
  }

  function navigateToLeg(state: SetState) {
    const leg = state.config.legs[state.currentLegIndex];
    if (leg.gameType === "x01") {
      setScreen({
        name: "game",
        x01Options: leg.x01Options!,
        playerNames: state.playerNames,
        playerIds: state.playerIds,
        botSkills: state.botSkills,
      });
    } else {
      setScreen({
        name: "cricket",
        options: leg.cricketOptions!,
        playerNames: state.playerNames,
        playerIds: state.playerIds,
        botSkills: state.botSkills,
      });
    }
    setRematchKey((k) => k + 1);
  }

  function handleSetStart(
    config: SetConfig,
    playerNames: string[],
    playerIds: (string | null)[],
    botSkills: (BotSkill | null)[],
  ) {
    const state: SetState = {
      config,
      legResults: [],
      currentLegIndex: 0,
      playerNames,
      playerIds,
      botSkills,
    };
    setSetMatch(state);
    navigateToLeg(state);
  }

  function handleNextLeg(winnerName: string) {
    if (!setMatch) return;

    const winnerIndex = setMatch.playerNames.indexOf(winnerName);
    const newResult: LegResult = { winnerName, winnerIndex };
    const newResults = [...setMatch.legResults, newResult];

    // Check if set is decided
    const winner = getSetWinner(newResults, setMatch.config.format);
    if (winner) {
      // Set is complete — update setMatch with final results so the ResultsOverlay shows "Set Winner"
      setSetMatch({ ...setMatch, legResults: newResults });
      // Don't navigate; the current game screen's ResultsOverlay will show "Set Winner"
      return;
    }

    // Advance to next leg
    const nextLegIndex = setMatch.currentLegIndex + 1;

    // Determine throw order for next leg
    let newPlayerNames = [...setMatch.playerNames];
    let newPlayerIds = [...setMatch.playerIds];
    let newBotSkills = [...setMatch.botSkills];

    if (setMatch.config.throwOrder === "loser" && winnerIndex >= 0) {
      // Loser throws first: rotate so the first non-winner is index 0
      const loserIndex = newPlayerNames.findIndex((_, i) => i !== winnerIndex);
      if (loserIndex > 0) {
        newPlayerNames = [
          ...newPlayerNames.slice(loserIndex),
          ...newPlayerNames.slice(0, loserIndex),
        ];
        newPlayerIds = [
          ...newPlayerIds.slice(loserIndex),
          ...newPlayerIds.slice(0, loserIndex),
        ];
        newBotSkills = [
          ...newBotSkills.slice(loserIndex),
          ...newBotSkills.slice(0, loserIndex),
        ];
      }
    } else if (setMatch.config.throwOrder === "alternate") {
      // Alternate: rotate by 1 each leg
      newPlayerNames = [...newPlayerNames.slice(1), newPlayerNames[0]];
      newPlayerIds = [...newPlayerIds.slice(1), newPlayerIds[0]];
      newBotSkills = [...newBotSkills.slice(1), newBotSkills[0]];
    }

    const nextState: SetState = {
      ...setMatch,
      legResults: newResults,
      currentLegIndex: nextLegIndex,
      playerNames: newPlayerNames,
      playerIds: newPlayerIds,
      botSkills: newBotSkills,
    };
    setSetMatch(nextState);
    navigateToLeg(nextState);
  }

  function handleSetExit() {
    setSetMatch(null);
    clearSession();
    setScreen({ name: "home" });
  }

  // --- Resume ---

  function handleResume() {
    if (!pendingResume) return;
    const {
      gameType,
      options,
      playerNames,
      playerIds,
      botSkills,
      gameState,
      setConfig,
      legResults,
      currentLegIndex,
    } = pendingResume;

    // Restore set context if present
    if (setConfig) {
      setSetMatch({
        config: setConfig,
        legResults: legResults ?? [],
        currentLegIndex: currentLegIndex ?? 0,
        playerNames,
        playerIds,
        botSkills,
      });
    }

    if (gameType === "x01") {
      setScreen({
        name: "game",
        x01Options: options as X01Options,
        playerNames,
        playerIds,
        botSkills,
        restoredState: gameState,
      });
    } else if (gameType === "cricket") {
      setScreen({
        name: "cricket",
        options: options as CricketOptions,
        playerNames,
        playerIds,
        botSkills,
        restoredState: gameState,
      });
    } else if (gameType === "highscore") {
      setScreen({
        name: "highscore",
        options: options as HighScoreOptions,
        playerNames,
        playerIds,
        botSkills,
        restoredState: gameState,
      });
    } else if (gameType === "atw") {
      setScreen({
        name: "atw",
        options: options as ATWOptions,
        playerNames,
        playerIds,
        botSkills,
        restoredState: gameState,
      });
    } else if (gameType === "tictactoe") {
      setScreen({
        name: "tictactoe",
        options: options as TicTacToeOptions,
        playerNames,
        playerIds,
        botSkills,
        restoredState: gameState,
      });
    }
    setPendingResume(null);
  }

  function handleDeclineResume() {
    clearSession();
    setPendingResume(null);
  }

  // --- Tournament match helpers ---

  function handleTournamentGameComplete(winnerName: string, storeName: "x01" | "cricket") {
    if (!tournamentMatch) return;

    const winnerIndex = tournamentMatch.playerNames.indexOf(winnerName);
    const newResult: LegResult = { winnerName, winnerIndex };
    const newResults = [...tournamentMatch.legResults, newResult];

    // Check if best-of series is decided
    const seriesWinner = getSetWinner(newResults, tournamentMatch.gameSettings.bestOf);
    if (seriesWinner) {
      // Series complete — report to tournament room
      const winnerUserId = tournamentMatch.playerIds[tournamentMatch.playerNames.indexOf(seriesWinner)] ?? "";
      tournamentRoom.reportMatchGameResult(
        tournamentMatch.matchId,
        winnerUserId,
        newResults,
      );
      const tid = tournamentMatch.tournamentId;
      setTournamentMatch(null);
      clearSession();
      setScreen({ name: "bracket", tournamentId: tid, isOnline: true });
      return;
    }

    // Not decided — advance to next leg
    setTournamentMatch({ ...tournamentMatch, legResults: newResults });

    // Determine next leg game options
    const gs = tournamentMatch.gameSettings;
    if (storeName === "x01" && gs.x01Options) {
      setScreen({
        name: "game",
        x01Options: gs.x01Options,
        playerNames: tournamentMatch.playerNames,
        playerIds: tournamentMatch.playerIds.map((id) => id),
        botSkills: [null, null],
      });
    } else if (storeName === "cricket" && gs.cricketOptions) {
      setScreen({
        name: "cricket",
        options: gs.cricketOptions,
        playerNames: tournamentMatch.playerNames,
        playerIds: tournamentMatch.playerIds.map((id) => id),
        botSkills: [null, null],
      });
    }
    setRematchKey((k) => k + 1);
  }

  function handleTournamentExit() {
    const tid = tournamentMatch?.tournamentId ?? "";
    setTournamentMatch(null);
    clearSession();
    setScreen({ name: "bracket", tournamentId: tid, isOnline: true });
  }

  // Build set progress for current game screens
  const currentSetProgress = setMatch ? buildSetProgress(setMatch) : undefined;

  // Determine the opponent name for the match alert
  const matchAlertOpponent = (() => {
    if (!tournamentRoom.matchAlert) return "";
    const { playerNames, playerIds } = tournamentRoom.matchAlert;
    const myIdx = playerIds.indexOf(authedUserId ?? "");
    if (myIdx === 0) return playerNames[1] ?? "Opponent";
    return playerNames[0] ?? "Opponent";
  })();

  // We need the tournament's game settings for the alert
  // (the alert doesn't carry them, but we can try to get from bracket data or just show generic)
  const matchAlertGameInfo = "Tournament Match";

  const matchReadyModal = tournamentRoom.matchAlert ? (
    <MatchReadyModal
      opponentName={matchAlertOpponent}
      gameInfo={matchAlertGameInfo}
      onGoToMatch={() => {
        const alert = tournamentRoom.matchAlert;
        if (alert) {
          setScreen({ name: "bracket", tournamentId: alert.tournamentId, isOnline: true });
        }
        tournamentRoom.clearMatchAlert();
      }}
      onDismiss={() => tournamentRoom.clearMatchAlert()}
    />
  ) : null;

  if (!playersLoaded) return <div className="h-screen bg-zinc-950" />;

  if (players.length === 0) {
    return <OnboardingScreen />;
  }

  if (screen.name === "game") {
    return (
      <>
      <GameScreen
        key={rematchKey}
        x01Options={screen.x01Options}
        playerNames={screen.playerNames}
        playerIds={screen.playerIds}
        botSkills={screen.botSkills}
        restoredState={screen.restoredState}
        onExit={
          screen.onlineConfig
            ? () => {
                void useOnlineStore.getState().leaveRoom();
                setScreen({ name: "online-lobby" });
              }
            : tournamentMatch
              ? handleTournamentExit
              : setMatch
                ? handleSetExit
                : () => setScreen({ name: "home" })
        }
        onRematch={handleRematch}
        setProgress={currentSetProgress}
        onNextLeg={
          tournamentMatch
            ? () => {
                const winner = useGameStore.getState().winner;
                if (winner) handleTournamentGameComplete(winner, "x01");
              }
            : setMatch
              ? () => {
                  const winner = useGameStore.getState().winner;
                  if (winner) handleNextLeg(winner);
                }
              : undefined
        }
        setConfig={setMatch?.config}
        legResults={setMatch?.legResults}
        currentLegIndex={setMatch?.currentLegIndex}
        onlineConfig={screen.onlineConfig}
      />
      {matchReadyModal}
      </>
    );
  }

  if (screen.name === "cricket") {
    return (
      <>
      <CricketScreen
        key={rematchKey}
        options={screen.options}
        playerNames={screen.playerNames}
        playerIds={screen.playerIds}
        botSkills={screen.botSkills}
        restoredState={screen.restoredState}
        onExit={
          screen.onlineConfig
            ? () => {
                void useOnlineStore.getState().leaveRoom();
                setScreen({ name: "online-lobby" });
              }
            : tournamentMatch
              ? handleTournamentExit
              : setMatch
                ? handleSetExit
                : () => setScreen({ name: "home" })
        }
        onRematch={handleRematch}
        setProgress={currentSetProgress}
        onNextLeg={
          tournamentMatch
            ? () => {
                const winner = useCricketStore.getState().winner;
                if (winner) handleTournamentGameComplete(winner, "cricket");
              }
            : setMatch
              ? () => {
                  const winner = useCricketStore.getState().winner;
                  if (winner) handleNextLeg(winner);
                }
              : undefined
        }
        setConfig={setMatch?.config}
        legResults={setMatch?.legResults}
        currentLegIndex={setMatch?.currentLegIndex}
        onlineConfig={screen.onlineConfig}
      />
      {matchReadyModal}
      </>
    );
  }

  if (screen.name === "highscore") {
    return (
      <HighScoreScreen
        key={rematchKey}
        options={screen.options}
        playerNames={screen.playerNames}
        playerIds={screen.playerIds}
        botSkills={screen.botSkills}
        restoredState={screen.restoredState}
        onExit={() => setScreen({ name: "home" })}
        onRematch={handleRematch}
      />
    );
  }

  if (screen.name === "atw") {
    return (
      <ATWScreen
        key={rematchKey}
        options={screen.options}
        playerNames={screen.playerNames}
        playerIds={screen.playerIds}
        botSkills={screen.botSkills}
        restoredState={screen.restoredState}
        onExit={() => setScreen({ name: "home" })}
        onRematch={handleRematch}
      />
    );
  }

  if (screen.name === "tictactoe") {
    return (
      <TicTacToeScreen
        key={rematchKey}
        options={screen.options}
        playerNames={screen.playerNames}
        playerIds={screen.playerIds}
        botSkills={screen.botSkills}
        restoredState={screen.restoredState}
        onExit={() => setScreen({ name: "home" })}
        onRematch={handleRematch}
      />
    );
  }

  if (screen.name === "setup") {
    return (
      <GameSetupScreen
        game={screen.game}
        onBack={() => setScreen({ name: "home" })}
        onStart={(
          playerNames,
          playerIds,
          botSkills,
          x01Options,
          cricketOptions,
          highScoreOptions,
          atwOptions,
          tictactoeOptions,
        ) => {
          if (screen.game === "x01" && x01Options) {
            setScreen({
              name: "game",
              x01Options,
              playerNames,
              playerIds,
              botSkills,
            });
          } else if (screen.game === "cricket" && cricketOptions) {
            setScreen({
              name: "cricket",
              options: cricketOptions,
              playerNames,
              playerIds,
              botSkills,
            });
          } else if (screen.game === "highscore" && highScoreOptions) {
            setScreen({
              name: "highscore",
              options: highScoreOptions,
              playerNames,
              playerIds,
              botSkills,
            });
          } else if (screen.game === "atw" && atwOptions) {
            setScreen({
              name: "atw",
              options: atwOptions,
              playerNames,
              playerIds,
              botSkills,
            });
          } else if (screen.game === "tictactoe" && tictactoeOptions) {
            setScreen({
              name: "tictactoe",
              options: tictactoeOptions,
              playerNames,
              playerIds,
              botSkills,
            });
          }
        }}
      />
    );
  }

  if (screen.name === "set-setup") {
    return (
      <SetSetupScreen
        onBack={() => setScreen({ name: "home" })}
        onStart={handleSetStart}
      />
    );
  }

  if (screen.name === "auth") {
    return (
      <AuthScreen
        onBack={() => setScreen({ name: "home" })}
        onAuthenticated={() => setScreen({ name: "online-choice" })}
      />
    );
  }

  if (screen.name === "online-lobby") {
    return (
      <OnlineLobbyScreen
        onBack={() => setScreen({ name: "online-choice" })}
        onGameReady={(roomId, isHost) => {
          const { currentRoom, displayName, opponentName } =
            useOnlineStore.getState();
          if (!currentRoom) return;
          const myName = displayName ?? "Player";
          const otherName = opponentName ?? "Opponent";
          const hostName = isHost ? myName : otherName;
          const guestName = isHost ? otherName : myName;
          setScreen({
            name: "online-setup",
            roomId,
            isHost,
            gameType: currentRoom.game_type,
            gameOptions: currentRoom.game_options,
            hostName,
            guestName,
          });
        }}
      />
    );
  }

  if (screen.name === "online-setup") {
    return (
      <OnlineSetupScreen
        gameType={screen.gameType}
        gameOptions={screen.gameOptions}
        hostName={screen.hostName}
        guestName={screen.guestName}
        isHost={screen.isHost}
        onBack={() => {
          void useOnlineStore.getState().leaveRoom();
          setScreen({ name: "online-lobby" });
        }}
        onStart={async (gameType, options, guestColyseusRoomId) => {
          const playerNames = [screen.hostName, screen.guestName];
          const { currentRoom } = useOnlineStore.getState();
          const playerIds: (string | null)[] = [
            currentRoom?.host_id ?? null,
            currentRoom?.guest_id ?? null,
          ];

          // Host: create Colyseus room first so we can share the ID
          let colyseusRoomId: string | undefined;
          if (screen.isHost) {
            try {
              const { Client } = await import("colyseus.js");
              const rawColUrl =
                (import.meta.env.VITE_COLYSEUS_URL as string) ??
                `${location.protocol === "https:" ? "https" : "http"}://192.168.40.151:2567`;
              const colyseusUrl = rawColUrl.startsWith("/")
                ? `${location.origin}${rawColUrl}`
                : rawColUrl;
              const client = new Client(colyseusUrl);
              const colyseusRoom = await client.create(gameType as string, {
                gameOptions: options,
                playerNames,
                playerIds,
                roomId: screen.roomId,
              });
              colyseusRoomId = colyseusRoom.roomId;
              // Store the room so useColyseusSync can reuse it
              setPendingColyseusRoom(colyseusRoom);
            } catch (err) {
              log.error({ err }, "Failed to create room");
            }
          }

          const onlineConfig: OnlineConfig = {
            roomId: screen.roomId,
            isHost: screen.isHost,
            gameType: gameType as "x01" | "cricket",
            playerNames,
            playerIds,
            gameOptions: options,
            colyseusRoomId: colyseusRoomId ?? guestColyseusRoomId,
          };
          if (gameType === "x01") {
            setScreen({
              name: "game",
              x01Options: options as X01Options,
              playerNames,
              playerIds,
              botSkills: [null, null],
              onlineConfig,
            });
          } else if (gameType === "cricket") {
            setScreen({
              name: "cricket",
              options: options as CricketOptions,
              playerNames,
              playerIds,
              botSkills: [null, null],
              onlineConfig,
            });
          }
          // Host broadcasts game_started with Colyseus room ID
          if (screen.isHost) {
            const { roomChannel } = useOnlineStore.getState();
            if (roomChannel) {
              roomChannel.send({
                type: "broadcast",
                event: "game_started",
                payload: {
                  gameType,
                  options,
                  playerNames: [screen.hostName, screen.guestName],
                  colyseusRoomId,
                },
              });
            }
          }
        }}
      />
    );
  }

  if (screen.name === "online-choice") {
    return (
      <OnlineChoiceScreen
        onBack={() => setScreen({ name: "home" })}
        onLobby={() => setScreen({ name: "online-lobby" })}
        onTournaments={() => setScreen({ name: "tournament-hub" })}
      />
    );
  }

  if (screen.name === "tournament-hub") {
    return (
      <>
      <TournamentHubScreen
        onBack={() => setScreen({ name: "online-choice" })}
        onCreate={() => setScreen({ name: "create-tournament" })}
        onViewBracket={(tournamentId) =>
          setScreen({ name: "bracket", tournamentId, isOnline: true })
        }
        userId={authedUserId ?? ""}
      />
      {matchReadyModal}
      </>
    );
  }

  if (screen.name === "create-tournament") {
    return (
      <CreateTournamentScreen
        onBack={() => setScreen({ name: "tournament-hub" })}
        onCreateOnline={async (data) => {
          if (!authedUserId) return;
          const result = await createOnlineTournament(data, authedUserId);
          if (result) {
            setScreen({
              name: "bracket",
              tournamentId: result.id,
              isOnline: true,
            });
          }
        }}
        onCreateLocal={async (data) => {
          const tournament = await createLocalTournament(
            data.name,
            data.format,
          );
          setScreen({
            name: "bracket",
            tournamentId: tournament.id,
            isOnline: false,
          });
        }}
      />
    );
  }

  if (screen.name === "bracket") {
    return (
      <>
      <BracketScreen
        tournamentId={screen.tournamentId}
        isOnline={screen.isOnline}
        userId={authedUserId ?? ""}
        onBack={() => setScreen({ name: "tournament-hub" })}
        tournamentRoom={tournamentRoom}
      />
      {matchReadyModal}
      </>
    );
  }

  if (screen.name === "practice") {
    return (
      <PracticeScreen
        onBack={() => setScreen({ name: "home" })}
        onSelectGame={(game) => setScreen({ name: "setup", game })}
      />
    );
  }

  if (screen.name === "players") {
    return <PlayersScreen onBack={() => setScreen({ name: "home" })} />;
  }

  return (
    <>
      <HomeScreen
        onSelectGame={(game) => setScreen({ name: "setup", game })}
        onSetMatch={() => setScreen({ name: "set-setup" })}
        onPractice={() => setScreen({ name: "practice" })}
        onPlayers={() => setScreen({ name: "players" })}
        onOnline={() => {
          // Check for existing auth session
          void supabase.auth.getSession().then(({ data: { session } }) => {
            if (session?.user) {
              setScreen({ name: "online-choice" });
            } else {
              setScreen({ name: "auth" });
            }
          });
        }}
      />
      {pendingResume && (
        <ResumePrompt
          session={pendingResume}
          onResume={handleResume}
          onNewGame={handleDeclineResume}
        />
      )}
      {matchReadyModal}
    </>
  );
}

function AppWithErrorBoundary() {
  return (
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  );
}

export default AppWithErrorBoundary;
