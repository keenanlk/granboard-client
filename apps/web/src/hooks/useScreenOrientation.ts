import { useEffect } from "react";
import { Capacitor } from "@capacitor/core";
import { ScreenOrientation } from "@capacitor/screen-orientation";

const LANDSCAPE_SCREENS = new Set([
  "game",
  "cricket",
  "highscore",
  "atw",
  "tictactoe",
]);

export function useScreenOrientation(screenName: string) {
  useEffect(() => {
    if (!Capacitor.isNativePlatform()) return;

    if (LANDSCAPE_SCREENS.has(screenName)) {
      ScreenOrientation.lock({ orientation: "landscape" });
    } else {
      ScreenOrientation.unlock();
    }
  }, [screenName]);
}
