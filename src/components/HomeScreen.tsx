import { useState } from "react";
import { useGranboardStore } from "../store/useGranboardStore.ts";
import {
  DEFAULT_X01_OPTIONS,
  type X01Options,
} from "../store/useGameStore.ts";
import {
  Colors,
  buildLightRingCommand,
  buildBlinkCommand,
  buildClearCommand,
  buildButtonPressCommand,
  buildHitCommand,
} from "../lib/GranboardLED.ts";

interface HomeScreenProps {
  onStartGame: (x01Options: X01Options) => void;
}

interface LEDPreset {
  label: string;
  bytes: () => number[];
}

const LED_PRESETS: LEDPreset[] = [
  { label: "Ring: White",  bytes: () => buildLightRingCommand(Colors.WHITE)  },
  { label: "Ring: Red",    bytes: () => buildLightRingCommand(Colors.RED)    },
  { label: "Ring: Green",  bytes: () => buildLightRingCommand(Colors.GREEN)  },
  { label: "Ring: Blue",   bytes: () => buildLightRingCommand(Colors.BLUE)   },
  { label: "Blink: Red",   bytes: () => buildBlinkCommand(Colors.RED)        },
  { label: "Blink: White", bytes: () => buildBlinkCommand(Colors.WHITE)      },
  { label: "Button Anim",  bytes: () => buildButtonPressCommand(Colors.WHITE, Colors.RED) },
  { label: "Hit S20",      bytes: () => buildHitCommand(20, 1, Colors.RED)   },
  { label: "Hit T20",      bytes: () => buildHitCommand(20, 3, Colors.GREEN) },
  { label: "Hit Bull",     bytes: () => buildBlinkCommand(Colors.LIGHT_BLUE, 0x0a) },
  { label: "Clear",        bytes: () => buildClearCommand()                  },
];

function Toggle({ checked, onChange }: { checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className={`relative w-11 h-6 rounded-full transition-colors duration-200 ${
        checked ? "bg-red-600" : "bg-zinc-700"
      }`}
    >
      <span
        className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform duration-200 ${
          checked ? "translate-x-5" : "translate-x-0"
        }`}
      />
    </button>
  );
}

export function HomeScreen({ onStartGame }: HomeScreenProps) {
  const { status, errorMessage, connect, disconnect, board } = useGranboardStore();
  const [x01Options, setX01Options] = useState<X01Options>(DEFAULT_X01_OPTIONS);
  const [ledError, setLedError] = useState<string | null>(null);
  const [lastSent, setLastSent] = useState<string | null>(null);

  const isConnected = status === "connected";
  const isConnecting = status === "connecting";

  const setOption = <K extends keyof X01Options>(key: K, value: X01Options[K]) =>
    setX01Options((prev) => ({ ...prev, [key]: value }));

  const sendLED = async (preset: LEDPreset) => {
    if (!board) return;
    setLedError(null);
    try {
      await board.sendCommand(preset.bytes());
      setLastSent(preset.label);
    } catch (err) {
      setLedError(err instanceof Error ? err.message : "Command failed");
    }
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-white flex flex-col items-center justify-center gap-8 p-6">
      {/* Header */}
      <div className="text-center">
        <h1 className="text-6xl font-black tracking-tight text-white">
          NLC <span className="text-red-500">Darts</span>
        </h1>
        <p className="mt-2 text-zinc-500 text-sm tracking-widest uppercase">
          Granboard Controller
        </p>
      </div>

      {/* Connection status */}
      <div className="flex items-center gap-2">
        <span
          className={`size-2.5 rounded-full ${
            isConnected
              ? "bg-green-500 shadow-[0_0_8px_2px_rgba(34,197,94,0.5)]"
              : isConnecting
                ? "bg-yellow-400 animate-pulse"
                : status === "error"
                  ? "bg-red-500"
                  : "bg-zinc-600"
          }`}
        />
        <span className="text-sm text-zinc-400 capitalize">
          {isConnecting ? "Connecting…" : status}
        </span>
      </div>

      {status === "error" && errorMessage && (
        <p className="text-red-400 text-sm text-center max-w-xs">{errorMessage}</p>
      )}

      {isConnected ? (
        <div className="flex flex-col items-center gap-5 w-full max-w-sm">

          {/* Game selection */}
          <div className="flex flex-col gap-3 w-full">
            <p className="text-zinc-500 text-xs uppercase tracking-widest">x01</p>
            <div className="flex gap-3 w-full">
              <button
                onClick={() => onStartGame({ ...x01Options, startingScore: 301 })}
                className="flex-1 py-4 rounded-xl bg-red-600 hover:bg-red-500 active:bg-red-700 text-white font-bold text-lg transition-colors"
              >
                301
              </button>
              <button
                onClick={() => onStartGame({ ...x01Options, startingScore: 501 })}
                className="flex-1 py-4 rounded-xl bg-red-600 hover:bg-red-500 active:bg-red-700 text-white font-bold text-lg transition-colors"
              >
                501
              </button>
            </div>

            {/* x01 options */}
            <div className="flex flex-col gap-1 rounded-xl border border-zinc-800 overflow-hidden">
              <label className="flex items-center justify-between px-4 py-3 bg-zinc-900">
                <div>
                  <p className="text-sm font-medium text-white">Bulls Not Split</p>
                  <p className="text-xs text-zinc-500 mt-0.5">
                    Entire bull zone scores 50
                  </p>
                </div>
                <Toggle
                  checked={x01Options.bullsNotSplit}
                  onChange={(v) => setOption("bullsNotSplit", v)}
                />
              </label>
            </div>
          </div>

          {/* LED test panel */}
          <div className="w-full border border-zinc-800 rounded-2xl p-4 flex flex-col gap-3">
            <p className="text-zinc-500 text-xs uppercase tracking-widest">LED Test</p>
            <div className="grid grid-cols-2 gap-2">
              {LED_PRESETS.map((preset) => (
                <button
                  key={preset.label}
                  onClick={() => sendLED(preset)}
                  className="py-2.5 px-3 rounded-lg bg-zinc-800 hover:bg-zinc-700 active:bg-zinc-600 text-sm text-white font-medium transition-colors text-left"
                >
                  {preset.label}
                </button>
              ))}
            </div>
            {lastSent && !ledError && (
              <p className="text-green-500 text-xs text-center">✓ {lastSent}</p>
            )}
            {ledError && (
              <p className="text-red-400 text-xs text-center">{ledError}</p>
            )}
          </div>

          <button
            onClick={disconnect}
            className="text-zinc-600 hover:text-zinc-400 text-xs underline transition-colors"
          >
            Disconnect
          </button>
        </div>
      ) : (
        <button
          onClick={connect}
          disabled={isConnecting}
          className="px-10 py-4 rounded-2xl bg-red-600 hover:bg-red-500 active:bg-red-700 disabled:bg-zinc-700 disabled:text-zinc-500 text-white font-bold text-lg transition-colors cursor-pointer disabled:cursor-not-allowed"
        >
          {isConnecting ? "Connecting…" : "Connect to Granboard"}
        </button>
      )}
    </div>
  );
}
