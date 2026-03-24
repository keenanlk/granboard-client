[**Documentation**](../../README.md)

***

[Documentation](../../README.md) / @nlc-darts/web

# @nlc-darts/web

NLC Darts Web App — public API surface for documentation.

This barrel file re-exports the non-React API: controllers, stores,
hooks, events, BLE, and database modules.

## Classes

- [ATWController](classes/ATWController.md)
- [ColyseusRemoteController](classes/ColyseusRemoteController.md)
- [CricketController](classes/CricketController.md)
- [EventBus](classes/EventBus.md)
- [GameRecorder](classes/GameRecorder.md)
- [Granboard](classes/Granboard.md)
- [HighScoreController](classes/HighScoreController.md)
- [OnlineRemoteController](classes/OnlineRemoteController.md)
- [TicTacToeController](classes/TicTacToeController.md)
- [X01Controller](classes/X01Controller.md)

## Interfaces

- [GameController](interfaces/GameController.md)
- [GameStoreActions](interfaces/GameStoreActions.md)
- [Invite](interfaces/Invite.md)
- [OnlineConfig](interfaces/OnlineConfig.md)
- [OnlinePlayer](interfaces/OnlinePlayer.md)
- [RGB](interfaces/RGB.md)
- [Room](interfaces/Room.md)
- [RoundExtract](interfaces/RoundExtract.md)
- [UseOnlineSyncOptions](interfaces/UseOnlineSyncOptions.md)

## Type Aliases

- [ConnectionStatus](type-aliases/ConnectionStatus.md)
- [FullState](type-aliases/FullState.md)
- [GameEventMap](type-aliases/GameEventMap.md)
- [Handler](type-aliases/Handler.md)
- [InviteStatus](type-aliases/InviteStatus.md)
- [OnlineGameType](type-aliases/OnlineGameType.md)
- [PlayerStatus](type-aliases/PlayerStatus.md)
- [RoomStatus](type-aliases/RoomStatus.md)

## Variables

- [Colors](variables/Colors.md)
- [gameEventBus](variables/gameEventBus.md)
- [LED\_POSITIONS](variables/LED_POSITIONS.md)

## Functions

- [buildBlinkCommand](functions/buildBlinkCommand.md)
- [buildButtonPressCommand](functions/buildButtonPressCommand.md)
- [buildClearCommand](functions/buildClearCommand.md)
- [buildHitCommand](functions/buildHitCommand.md)
- [buildLightRingCommand](functions/buildLightRingCommand.md)
- [buildPersistentNumbersCommand](functions/buildPersistentNumbersCommand.md)
- [computePlayerStats](functions/computePlayerStats.md)
- [createGameStore](functions/createGameStore.md)
- [dbAddPlayer](functions/dbAddPlayer.md)
- [dbDeletePlayer](functions/dbDeletePlayer.md)
- [dbGetAllPlayers](functions/dbGetAllPlayers.md)
- [dbGetSessionsForPlayer](functions/dbGetSessionsForPlayer.md)
- [dbRenamePlayer](functions/dbRenamePlayer.md)
- [dbSaveSession](functions/dbSaveSession.md)
- [getActiveController](functions/getActiveController.md)
- [guardForOnlineTurn](functions/guardForOnlineTurn.md)
- [setActiveController](functions/setActiveController.md)
- [useAwardDetection](functions/useAwardDetection.md)
- [useBoardWiring](functions/useBoardWiring.md)
- [useBotTurn](functions/useBotTurn.md)
- [useGameRoom](functions/useGameRoom.md)
- [useGameSession](functions/useGameSession.md)
- [useLobby](functions/useLobby.md)
- [useOnlineSync](functions/useOnlineSync.md)
- [useTournament](functions/useTournament.md)
- [useTurnDelay](functions/useTurnDelay.md)
