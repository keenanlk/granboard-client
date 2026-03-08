import { useEffect, useState } from "react";
import { HomeScreen } from "./components/HomeScreen.tsx";
import { GameScreen } from "./components/GameScreen.tsx";
import type { X01Options } from "./store/useGameStore.ts";
import { useGranboardStore } from "./store/useGranboardStore.ts";

type Screen =
  | { name: "home" }
  | { name: "game"; x01Options: X01Options; playerNames: string[] };

function App() {
  const [screen, setScreen] = useState<Screen>({ name: "home" });

  useEffect(() => {
    useGranboardStore.getState().autoReconnect();
  }, []);

  if (screen.name === "game") {
    return (
      <GameScreen
        x01Options={screen.x01Options}
        playerNames={screen.playerNames}
        onExit={() => setScreen({ name: "home" })}
      />
    );
  }

  return (
    <HomeScreen
      onStartGame={(x01Options) =>
        setScreen({ name: "game", x01Options, playerNames: ["Player 1", "Player 2"] })
      }
    />
  );
}

export default App;
