import { useEffect, useState } from "react";
import { HomeScreen } from "./screens/HomeScreen.tsx";
import { DevBoard } from "./components/DevBoard.tsx";
import { GameSetupScreen } from "./screens/GameSetupScreen.tsx";
import { GameScreen } from "./screens/GameScreen.tsx";
import { CricketScreen } from "./screens/CricketScreen.tsx";
import { HighScoreScreen } from "./screens/HighScoreScreen.tsx";
import { PlayersScreen } from "./screens/PlayersScreen.tsx";
import type { X01Options } from "./store/useGameStore.ts";
import type { CricketOptions } from "./store/useCricketStore.ts";
import type { HighScoreOptions } from "./store/useHighScoreStore.ts";
import type { BotSkill } from "./bot/Bot.ts";
import { useGranboardStore } from "./store/useGranboardStore.ts";
import { useBoardWiring } from "./hooks/useBoardWiring.ts";
// Side-effect imports — activate sound and LED event subscriptions
import "./sound/soundEffects.ts";
import "./board/ledEffects.ts";

type Screen =
  | { name: "home" }
  | { name: "players" }
  | { name: "setup"; game: "x01" | "cricket" | "highscore" }
  | { name: "game"; x01Options: X01Options; playerNames: string[]; playerIds: (string | null)[]; botSkills: (BotSkill | null)[] }
  | { name: "cricket"; options: CricketOptions; playerNames: string[]; playerIds: (string | null)[]; botSkills: (BotSkill | null)[] }
  | { name: "highscore"; options: HighScoreOptions; playerNames: string[]; playerIds: (string | null)[]; botSkills: (BotSkill | null)[] };

function App() {
  const [screen, setScreen] = useState<Screen>({ name: "home" });

  useBoardWiring();

  useEffect(() => {
    useGranboardStore.getState().autoReconnect();
  }, []);

  if (screen.name === "game") {
    return (
      <GameScreen
        x01Options={screen.x01Options}
        playerNames={screen.playerNames}
        playerIds={screen.playerIds}
        botSkills={screen.botSkills}
        onExit={() => setScreen({ name: "home" })}
      />
    );
  }

  if (screen.name === "cricket") {
    return (
      <CricketScreen
        options={screen.options}
        playerNames={screen.playerNames}
        playerIds={screen.playerIds}
        botSkills={screen.botSkills}
        onExit={() => setScreen({ name: "home" })}
      />
    );
  }

  if (screen.name === "highscore") {
    return (
      <HighScoreScreen
        options={screen.options}
        playerNames={screen.playerNames}
        playerIds={screen.playerIds}
        botSkills={screen.botSkills}
        onExit={() => setScreen({ name: "home" })}
      />
    );
  }

  if (screen.name === "setup") {
    return (
      <GameSetupScreen
        game={screen.game}
        onBack={() => setScreen({ name: "home" })}
        onStart={(playerNames, playerIds, botSkills, x01Options, cricketOptions, highScoreOptions) => {
          if (screen.game === "x01" && x01Options) {
            setScreen({ name: "game", x01Options, playerNames, playerIds, botSkills });
          } else if (screen.game === "cricket" && cricketOptions) {
            setScreen({ name: "cricket", options: cricketOptions, playerNames, playerIds, botSkills });
          } else if (screen.game === "highscore" && highScoreOptions) {
            setScreen({ name: "highscore", options: highScoreOptions, playerNames, playerIds, botSkills });
          }
        }}
      />
    );
  }

  if (screen.name === "players") {
    return <PlayersScreen onBack={() => setScreen({ name: "home" })} />;
  }

  return (
    <HomeScreen
      onSelectGame={(game) => setScreen({ name: "setup", game })}
      onPlayers={() => setScreen({ name: "players" })}
    />
  );
}

function AppWithDevTools() {
  return (
    <>
      <App />
      {import.meta.env.DEV && <DevBoard />}
    </>
  );
}

export default AppWithDevTools;
