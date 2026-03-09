import { useEffect, useState } from "react";
import { HomeScreen } from "./components/HomeScreen.tsx";
import { GameScreen } from "./components/GameScreen.tsx";
import { CricketScreen } from "./components/CricketScreen.tsx";
import type { X01Options } from "./store/useGameStore.ts";
import type { CricketOptions } from "./store/useCricketStore.ts";
import { useGranboardStore } from "./store/useGranboardStore.ts";

type Screen =
  | { name: "home" }
  | { name: "game"; x01Options: X01Options; playerNames: string[] }
  | { name: "cricket"; options: CricketOptions; playerNames: string[] };

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

  if (screen.name === "cricket") {
    return (
      <CricketScreen
        options={screen.options}
        playerNames={screen.playerNames}
        onExit={() => setScreen({ name: "home" })}
      />
    );
  }

  return (
    <HomeScreen
      onStartGame={(x01Options, playerNames) =>
        setScreen({ name: "game", x01Options, playerNames })
      }
      onStartCricket={(options, playerNames) =>
        setScreen({ name: "cricket", options, playerNames })
      }
    />
  );
}

export default App;
