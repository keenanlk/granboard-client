/**
 * NLC Darts Web App — public API surface for documentation.
 *
 * This barrel file re-exports the non-React API: controllers, stores,
 * hooks, events, BLE, and database modules.
 *
 * @packageDocumentation
 */

// Controllers
export { type GameController, setActiveController, getActiveController } from "./controllers/GameController.js";
export { X01Controller } from "./controllers/X01Controller.js";
export { CricketController } from "./controllers/CricketController.js";
export { ATWController } from "./controllers/ATWController.js";
export { HighScoreController } from "./controllers/HighScoreController.js";
export { TicTacToeController } from "./controllers/TicTacToeController.js";
export { OnlineRemoteController } from "./controllers/OnlineRemoteController.js";
export { ColyseusRemoteController } from "./controllers/ColyseusRemoteController.js";
export { guardForOnlineTurn } from "./controllers/OnlineTurnGuard.js";

// Stores
export { createGameStore } from "./store/createGameStore.js";
export { type PlayerStatus, type RoomStatus, type InviteStatus, type OnlineGameType, type OnlinePlayer, type Room, type Invite } from "./store/online.types.js";

// Hooks
export { useTurnDelay } from "./hooks/useTurnDelay.js";
export { useOnlineRematch, type RematchState } from "./hooks/useOnlineRematch.js";
export { useLobby } from "./hooks/useLobby.js";
export { useAwardDetection } from "./hooks/useAwardDetection.js";
export { useBoardWiring } from "./hooks/useBoardWiring.js";
export { useBotTurn } from "./hooks/useBotTurn.js";
export { useOnlineSync } from "./hooks/useOnlineSync.js";
export { useColyseusSync } from "./hooks/useColyseusSync.js";
export { useGameSession } from "./hooks/useGameSession.js";

// Events
export { gameEventBus } from "./events/gameEventBus.js";
export { type GameEventMap } from "./events/GameEvents.js";

// Board / BLE
export { Granboard } from "./board/Granboard.js";
export {
  type RGB,
  Colors,
  LED_POSITIONS,
  buildHitCommand,
  buildLightRingCommand,
  buildBlinkCommand,
  buildButtonPressCommand,
  buildPersistentNumbersCommand,
  buildClearCommand,
} from "./board/GranboardLED.js";

// Database
export { dbGetAllPlayers, dbAddPlayer, dbDeletePlayer, dbRenamePlayer, dbSaveSession, dbGetSessionsForPlayer } from "./db/db.js";
export { computePlayerStats } from "./db/playerStats.js";
export { GameRecorder } from "./db/gameRecorder.js";
