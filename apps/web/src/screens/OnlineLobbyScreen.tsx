import { useEffect, useRef, useState } from "react";
import {
  DEFAULT_X01_OPTIONS,
  DEFAULT_CRICKET_OPTIONS,
  legCount,
  MIN_GAMES_FOR_GRADE,
} from "@nlc-darts/engine";
import type {
  X01Options,
  CricketOptions,
  SetFormat,
  LegConfig,
  SetConfig,
} from "@nlc-darts/engine";
import { useLobby } from "../hooks/useLobby.ts";
import { InviteModal } from "../components/InviteModal.tsx";
import { useOnlineStore } from "../store/useOnlineStore.ts";
import { supabase } from "../lib/supabaseClient.ts";
import type { OnlineGameType } from "../store/online.types.ts";

const GRADE_COLORS: Record<string, string> = {
  "A+": "#22c55e",
  A: "#4ade80",
  "B+": "#60a5fa",
  B: "#3b82f6",
  "C+": "#f59e0b",
  C: "#d97706",
  D: "#ef4444",
};

function GradeBadge({
  grade,
  label,
  value,
  games,
}: {
  grade: string | null;
  label: string;
  value: number;
  games: number;
}) {
  if (games < MIN_GAMES_FOR_GRADE || !grade) {
    return (
      <span className="text-zinc-600 text-[10px] uppercase tracking-widest font-bold">
        {label}: --
      </span>
    );
  }
  const color = GRADE_COLORS[grade] ?? "#9ca3af";
  return (
    <span className="flex items-center gap-1">
      <span
        className="text-[10px] font-black uppercase tracking-widest px-1.5 py-0.5 rounded"
        style={{ backgroundColor: `${color}20`, color }}
      >
        {grade}
      </span>
      <span className="text-zinc-500 text-[10px] font-bold">
        {label}: {value}
      </span>
    </span>
  );
}

interface OnlineLobbyScreenProps {
  onBack: () => void;
  onGameReady: (roomId: string, isHost: boolean) => void;
}

const GAME_TYPES: { id: OnlineGameType; label: string; color: string }[] = [
  { id: "x01", label: "X01", color: "#ef4444" },
  { id: "cricket", label: "Cricket", color: "#4ade80" },
  { id: "set", label: "Set Match", color: "#60a5fa" },
];

export function OnlineLobbyScreen({
  onBack,
  onGameReady,
}: OnlineLobbyScreenProps) {
  const {
    connectionStatus,
    onlinePlayers,
    pendingInvite,
    sentInvite,
    sentCountdown,
    receivedCountdown,
    currentRoom,
    goOnline,
    goOffline,
    sendInvite,
    acceptInvite,
    declineInvite,
  } = useLobby();

  const [inviteTarget, setInviteTarget] = useState<string | null>(null);
  const [selectedGame, setSelectedGame] = useState<OnlineGameType | null>(null);
  const [x01Options, setX01Options] = useState<X01Options>(DEFAULT_X01_OPTIONS);
  const [cricketOptions, setCricketOptions] = useState<CricketOptions>(
    DEFAULT_CRICKET_OPTIONS,
  );
  const [setFormat, setSetFormat] = useState<SetFormat>("bo3");
  const [setLegs, setSetLegs] = useState<LegConfig[]>(() =>
    Array.from({ length: 3 }, () => ({
      gameType: "x01" as const,
      x01Options: { ...DEFAULT_X01_OPTIONS },
    })),
  );
  const [editingLegIndex, setEditingLegIndex] = useState<number | null>(null);

  const setX01Option = <K extends keyof X01Options>(
    key: K,
    value: X01Options[K],
  ) =>
    setX01Options((prev) => {
      const next = { ...prev, [key]: value };
      if (key === "doubleOut" && value) next.masterOut = false;
      if (key === "masterOut" && value) next.doubleOut = false;
      return next;
    });

  function handleSetFormatChange(f: SetFormat) {
    setSetFormat(f);
    const count = legCount(f);
    setSetLegs((prev) => {
      if (prev.length === count) return prev;
      if (prev.length < count) {
        return [
          ...prev,
          ...Array.from({ length: count - prev.length }, () => ({
            gameType: "x01" as const,
            x01Options: { ...DEFAULT_X01_OPTIONS },
          })),
        ];
      }
      return prev.slice(0, count);
    });
  }

  // Navigate to game when room is ready (both players in room)
  const navigatedRef = useRef(false);
  useEffect(() => {
    if (
      currentRoom &&
      currentRoom.guest_id &&
      currentRoom.host_id &&
      !navigatedRef.current
    ) {
      navigatedRef.current = true;
      const { isHost } = useOnlineStore.getState();
      onGameReady(currentRoom.id, isHost);
    }
  }, [currentRoom, onGameReady]);

  // Not online yet — connect automatically
  if (connectionStatus === "offline" || connectionStatus === "connecting") {
    return (
      <div
        className="h-screen bg-zinc-950 text-white flex flex-col items-center justify-center gap-6 px-6 overflow-y-auto"
        style={{
          paddingTop: "calc(var(--sat) + 1rem)",
          paddingBottom: "calc(var(--sab) + 1rem)",
        }}
      >
        <button
          onClick={onBack}
          className="absolute top-6 left-6 text-zinc-500 hover:text-white transition-colors text-sm uppercase tracking-wider font-bold"
          style={{ top: "calc(var(--sat) + 1.5rem)" }}
        >
          Back
        </button>

        <h1
          className="text-4xl tracking-tight font-normal"
          style={{
            fontFamily: "Beon, sans-serif",
            color: "#f59e0b",
            textShadow:
              "0 0 20px #f59e0b, 0 0 60px #f59e0b, 0 0 100px rgba(245,158,11,0.5)",
          }}
        >
          Online
        </h1>
        <p className="text-zinc-400 text-center max-w-xs">
          Connecting to lobby...
        </p>

        <button
          onClick={() => void goOnline()}
          disabled={connectionStatus === "connecting"}
          className="w-full max-w-xs py-4 rounded-xl font-black text-lg uppercase tracking-widest bg-amber-600 text-white active:bg-amber-700 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
        >
          {connectionStatus === "connecting" ? "Connecting..." : "Go Online"}
        </button>
      </div>
    );
  }

  // Game type picker (after tapping a player)
  if (inviteTarget && !selectedGame) {
    const targetPlayer = onlinePlayers.find((p) => p.id === inviteTarget);
    return (
      <div
        className="h-screen bg-zinc-950 text-white flex items-center justify-center px-6"
        style={{ paddingTop: "var(--sat)", paddingBottom: "var(--sab)" }}
      >
        <div className="flex flex-col items-center gap-5 w-full max-w-xs">
          <div className="text-center">
            <h2 className="text-xl font-black uppercase tracking-widest text-zinc-300">
              Challenge{" "}
              <span className="text-white">
                {targetPlayer?.display_name ?? "Player"}
              </span>
            </h2>
            <p className="text-zinc-500 text-xs mt-1">Pick a game mode</p>
          </div>

          <div className="flex flex-col gap-2 w-full">
            {GAME_TYPES.map((g) => (
              <button
                key={g.id}
                onClick={() => setSelectedGame(g.id)}
                className="w-full py-3 rounded-xl font-black text-lg uppercase tracking-widest bg-zinc-900 border border-zinc-800 transition-all hover:scale-[1.02]"
                style={{
                  fontFamily: "Beon, sans-serif",
                  color: g.color,
                  textShadow: `0 0 15px ${g.color}, 0 0 40px ${g.color}80`,
                  borderColor: `${g.color}40`,
                }}
              >
                {g.label}
              </button>
            ))}
          </div>

          <button
            onClick={() => {
              setInviteTarget(null);
              setSelectedGame(null);
            }}
            className="text-zinc-500 hover:text-white transition-colors text-sm uppercase tracking-wider font-bold"
          >
            Cancel
          </button>
        </div>
      </div>
    );
  }

  // Game options (after picking game type, before sending invite)
  if (inviteTarget && selectedGame) {
    const targetPlayer = onlinePlayers.find((p) => p.id === inviteTarget);
    const gameInfo = GAME_TYPES.find((g) => g.id === selectedGame)!;

    function handleSendChallenge() {
      let options: unknown;
      if (selectedGame === "set") {
        options = {
          format: setFormat,
          legs: setLegs,
          throwOrder: "loser",
        } satisfies SetConfig;
      } else if (selectedGame === "cricket") {
        options = cricketOptions;
      } else {
        options = x01Options;
      }
      sendInvite(inviteTarget!, selectedGame!, options);
      setInviteTarget(null);
      setSelectedGame(null);
      setEditingLegIndex(null);
    }

    function handleSetLegChange(index: number, leg: LegConfig) {
      setSetLegs((prev) => prev.map((l, i) => (i === index ? leg : l)));
    }

    // Editing a specific leg in a set match
    if (selectedGame === "set" && editingLegIndex !== null) {
      const leg = setLegs[editingLegIndex];
      const legOpts = leg.x01Options ?? DEFAULT_X01_OPTIONS;
      const legCricketOpts = leg.cricketOptions ?? DEFAULT_CRICKET_OPTIONS;

      return (
        <div
          className="h-screen bg-zinc-950 text-white flex flex-col items-center justify-center gap-2 px-6"
          style={{
            paddingTop: "var(--sat)",
            paddingBottom: "var(--sab)",
            paddingLeft: "calc(var(--sal) + 1.5rem)",
            paddingRight: "calc(var(--sar) + 1.5rem)",
          }}
        >
          <p className="text-zinc-500 text-[10px] uppercase tracking-widest font-bold">
            Leg {editingLegIndex + 1}
          </p>

          {/* Game type + score in one row */}
          <div className="flex gap-2 w-full max-w-md">
            <button
              onClick={() =>
                handleSetLegChange(editingLegIndex, {
                  gameType: "x01",
                  x01Options: { ...DEFAULT_X01_OPTIONS },
                })
              }
              className={`flex-1 py-2 rounded-xl font-black text-base uppercase tracking-widest transition-colors ${
                leg.gameType === "x01"
                  ? "bg-red-600 text-white"
                  : "bg-zinc-900 text-zinc-400 border border-zinc-700"
              }`}
            >
              X01
            </button>
            <button
              onClick={() =>
                handleSetLegChange(editingLegIndex, {
                  gameType: "cricket",
                  cricketOptions: { ...DEFAULT_CRICKET_OPTIONS },
                })
              }
              className={`flex-1 py-2 rounded-xl font-black text-base uppercase tracking-widest transition-colors ${
                leg.gameType === "cricket"
                  ? "bg-green-600 text-white"
                  : "bg-zinc-900 text-zinc-400 border border-zinc-700"
              }`}
            >
              Cricket
            </button>
          </div>

          {/* X01 leg options */}
          {leg.gameType === "x01" && (
            <div className="flex flex-col gap-2 w-full max-w-md">
              <div className="flex gap-2">
                {([301, 501, 701] as const).map((score) => (
                  <button
                    key={score}
                    onClick={() =>
                      handleSetLegChange(editingLegIndex, {
                        ...leg,
                        x01Options: { ...legOpts, startingScore: score },
                      })
                    }
                    className={`flex-1 py-2 rounded-xl font-black text-base transition-colors ${
                      legOpts.startingScore === score
                        ? "bg-red-600 text-white"
                        : "bg-zinc-900 text-zinc-400 border border-zinc-700"
                    }`}
                  >
                    {score}
                  </button>
                ))}
              </div>
              <div className="grid grid-cols-2 gap-2">
                {(
                  [
                    ["doubleIn", "Dbl In"],
                    ["doubleOut", "Dbl Out"],
                    ["masterOut", "Master Out"],
                    ["splitBull", "Split Bull"],
                  ] as const
                ).map(([key, label]) => (
                  <button
                    key={key}
                    onClick={() => {
                      const next = { ...legOpts, [key]: !legOpts[key] };
                      if (key === "doubleOut" && !legOpts[key])
                        next.masterOut = false;
                      if (key === "masterOut" && !legOpts[key])
                        next.doubleOut = false;
                      handleSetLegChange(editingLegIndex, {
                        ...leg,
                        x01Options: next,
                      });
                    }}
                    className={`py-2 px-3 rounded-xl font-bold text-xs uppercase tracking-widest transition-colors flex items-center justify-between ${
                      legOpts[key]
                        ? "bg-red-950/40 border border-red-800 text-red-400"
                        : "bg-zinc-900 border border-zinc-700 text-zinc-500"
                    }`}
                  >
                    {label}
                    <span
                      className={`size-4 rounded-full border-2 transition-colors ${
                        legOpts[key]
                          ? "bg-red-500 border-red-500"
                          : "border-zinc-600"
                      }`}
                    />
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Cricket leg options */}
          {leg.gameType === "cricket" && (
            <div className="grid grid-cols-2 gap-2 w-full max-w-md">
              <button
                onClick={() =>
                  handleSetLegChange(editingLegIndex, {
                    ...leg,
                    cricketOptions: {
                      ...legCricketOpts,
                      cutThroat: !legCricketOpts.cutThroat,
                    },
                  })
                }
                className={`py-2 px-3 rounded-xl font-bold text-xs uppercase tracking-widest transition-colors flex items-center justify-between ${
                  legCricketOpts.cutThroat
                    ? "bg-green-950/40 border border-green-800 text-green-400"
                    : "bg-zinc-900 border border-zinc-700 text-zinc-500"
                }`}
              >
                Cut-Throat
                <span
                  className={`size-4 rounded-full border-2 transition-colors ${
                    legCricketOpts.cutThroat
                      ? "bg-green-500 border-green-500"
                      : "border-zinc-600"
                  }`}
                />
              </button>
              <button
                onClick={() =>
                  handleSetLegChange(editingLegIndex, {
                    ...leg,
                    cricketOptions: {
                      ...legCricketOpts,
                      singleBull: !legCricketOpts.singleBull,
                    },
                  })
                }
                className={`py-2 px-3 rounded-xl font-bold text-xs uppercase tracking-widest transition-colors flex items-center justify-between ${
                  legCricketOpts.singleBull
                    ? "bg-green-950/40 border border-green-800 text-green-400"
                    : "bg-zinc-900 border border-zinc-700 text-zinc-500"
                }`}
              >
                Split Bull
                <span
                  className={`size-4 rounded-full border-2 transition-colors ${
                    legCricketOpts.singleBull
                      ? "bg-green-500 border-green-500"
                      : "border-zinc-600"
                  }`}
                />
              </button>
            </div>
          )}

          <button
            onClick={() => setEditingLegIndex(null)}
            className="w-full max-w-md py-2 rounded-xl bg-blue-600 text-white font-black text-base uppercase tracking-widest transition-colors"
          >
            Done
          </button>
        </div>
      );
    }

    return (
      <div
        className="h-screen bg-zinc-950 text-white flex flex-col items-center justify-center gap-2 px-6"
        style={{
          paddingTop: "var(--sat)",
          paddingBottom: "var(--sab)",
          paddingLeft: "calc(var(--sal) + 1.5rem)",
          paddingRight: "calc(var(--sar) + 1.5rem)",
        }}
      >
        <p className="text-zinc-400 text-sm">
          Challenge{" "}
          <span className="text-white font-bold">
            {targetPlayer?.display_name ?? "Player"}
          </span>
          {" · "}
          <span
            className="font-black uppercase"
            style={{ color: gameInfo.color }}
          >
            {gameInfo.label}
          </span>
        </p>

        {/* X01 options */}
        {selectedGame === "x01" && (
          <div className="flex flex-col gap-2 w-full max-w-md">
            <div className="flex gap-2">
              {([301, 501, 701] as const).map((score) => (
                <button
                  key={score}
                  onClick={() => setX01Option("startingScore", score)}
                  className={`flex-1 py-2 rounded-xl font-black text-base transition-colors ${
                    x01Options.startingScore === score
                      ? "bg-red-600 text-white"
                      : "bg-zinc-900 text-zinc-400 border border-zinc-700"
                  }`}
                >
                  {score}
                </button>
              ))}
            </div>
            <div className="grid grid-cols-2 gap-2">
              {(
                [
                  ["doubleIn", "Dbl In"],
                  ["doubleOut", "Dbl Out"],
                  ["masterOut", "Master Out"],
                  ["splitBull", "Split Bull"],
                ] as const
              ).map(([key, label]) => (
                <button
                  key={key}
                  onClick={() => setX01Option(key, !x01Options[key])}
                  className={`py-2 px-3 rounded-xl font-bold text-xs uppercase tracking-widest transition-colors flex items-center justify-between ${
                    x01Options[key]
                      ? "bg-red-950/40 border border-red-800 text-red-400"
                      : "bg-zinc-900 border border-zinc-700 text-zinc-500"
                  }`}
                >
                  {label}
                  <span
                    className={`size-4 rounded-full border-2 transition-colors ${
                      x01Options[key]
                        ? "bg-red-500 border-red-500"
                        : "border-zinc-600"
                    }`}
                  />
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Cricket options */}
        {selectedGame === "cricket" && (
          <div className="grid grid-cols-2 gap-2 w-full max-w-md">
            <button
              onClick={() =>
                setCricketOptions((o) => ({ ...o, cutThroat: !o.cutThroat }))
              }
              className={`py-2 px-3 rounded-xl font-bold text-xs uppercase tracking-widest transition-colors flex items-center justify-between ${
                cricketOptions.cutThroat
                  ? "bg-green-950/40 border border-green-800 text-green-400"
                  : "bg-zinc-900 border border-zinc-700 text-zinc-500"
              }`}
            >
              Cut-Throat
              <span
                className={`size-4 rounded-full border-2 transition-colors ${
                  cricketOptions.cutThroat
                    ? "bg-green-500 border-green-500"
                    : "border-zinc-600"
                }`}
              />
            </button>
            <button
              onClick={() =>
                setCricketOptions((o) => ({
                  ...o,
                  singleBull: !o.singleBull,
                }))
              }
              className={`py-2 px-3 rounded-xl font-bold text-xs uppercase tracking-widest transition-colors flex items-center justify-between ${
                cricketOptions.singleBull
                  ? "bg-green-950/40 border border-green-800 text-green-400"
                  : "bg-zinc-900 border border-zinc-700 text-zinc-500"
              }`}
            >
              Split Bull
              <span
                className={`size-4 rounded-full border-2 transition-colors ${
                  cricketOptions.singleBull
                    ? "bg-green-500 border-green-500"
                    : "border-zinc-600"
                }`}
              />
            </button>
          </div>
        )}

        {/* Set Match options */}
        {selectedGame === "set" && (
          <div className="flex flex-col gap-2 w-full max-w-md">
            <div className="flex gap-2">
              {(["bo3", "bo5"] as const).map((f) => (
                <button
                  key={f}
                  onClick={() => handleSetFormatChange(f)}
                  className={`flex-1 py-2 rounded-xl font-black text-base uppercase tracking-widest transition-colors ${
                    setFormat === f
                      ? "bg-blue-600 text-white"
                      : "bg-zinc-900 text-zinc-400 border border-zinc-700"
                  }`}
                >
                  Best of {f === "bo3" ? 3 : 5}
                </button>
              ))}
            </div>

            <p className="text-zinc-500 text-[10px] uppercase tracking-widest font-bold">
              Tap a leg to configure
            </p>
            <div className="flex gap-2">
              {setLegs.map((leg, i) => (
                <button
                  key={i}
                  onClick={() => setEditingLegIndex(i)}
                  className="flex-1 py-2 rounded-xl bg-zinc-900 border-2 border-zinc-800 hover:border-blue-600 flex flex-col items-center gap-0.5 transition-colors"
                >
                  <span className="text-blue-400 font-black text-[10px]">
                    Leg {i + 1}
                  </span>
                  <span
                    className={`font-black text-base ${leg.gameType === "x01" ? "text-red-500" : "text-green-400"}`}
                  >
                    {leg.gameType === "x01"
                      ? (leg.x01Options ?? DEFAULT_X01_OPTIONS).startingScore
                      : "Cricket"}
                  </span>
                </button>
              ))}
            </div>
          </div>
        )}

        <div className="flex gap-2 w-full max-w-md">
          <button
            onClick={() => {
              setSelectedGame(null);
              setEditingLegIndex(null);
            }}
            className="flex-1 py-2 rounded-xl bg-zinc-800 text-zinc-300 font-bold uppercase tracking-widest text-base transition-colors hover:bg-zinc-700"
          >
            Back
          </button>
          <button
            onClick={handleSendChallenge}
            className="flex-1 py-2 rounded-xl font-black text-base uppercase tracking-widest transition-colors"
            style={{
              backgroundColor: gameInfo.color,
              color: "#fff",
            }}
          >
            Send Challenge
          </button>
        </div>
      </div>
    );
  }

  // Main lobby view
  return (
    <div
      className="h-screen bg-zinc-950 text-white flex flex-col overflow-hidden"
      style={{ paddingLeft: "var(--sal)" }}
    >
      {/* Header */}
      <header
        className="flex items-center justify-between px-6 pb-3 shrink-0 bg-zinc-950"
        style={{ paddingTop: "calc(var(--sat) + 0.75rem)" }}
      >
        <div className="flex items-center gap-4">
          <button
            onClick={() => {
              void goOffline();
              onBack();
            }}
            className="text-zinc-500 hover:text-white transition-colors text-sm uppercase tracking-wider font-bold"
          >
            Back
          </button>
          <h1
            className="text-2xl tracking-tight font-normal"
            style={{
              fontFamily: "Beon, sans-serif",
              color: "#f59e0b",
              textShadow:
                "0 0 10px rgba(245,158,11,0.5), 0 0 30px rgba(245,158,11,0.2)",
            }}
          >
            Online Lobby
          </h1>
        </div>

        <div className="flex items-center gap-3">
          <span className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-amber-950/40 border border-amber-800">
            <span className="size-2 rounded-full bg-amber-400 shadow-[0_0_6px_rgba(245,158,11,0.7)]" />
            <span className="text-sm font-bold text-amber-400">
              {connectionStatus === "online" ? "Online" : "Error"}
            </span>
          </span>
          <button
            onClick={() => {
              void supabase.auth.signOut().then(() => {
                void goOffline();
                onBack();
              });
            }}
            className="text-zinc-500 hover:text-white transition-colors text-xs uppercase tracking-wider font-bold"
          >
            Sign Out
          </button>
        </div>
      </header>

      {/* Waiting for response overlay */}
      {sentInvite && (
        <div className="px-6 pb-3 shrink-0">
          <div className="bg-amber-950/30 border border-amber-800/50 rounded-xl px-4 py-3 flex items-center justify-between">
            <span className="text-amber-400 text-sm font-bold uppercase tracking-widest">
              Waiting for response…{" "}
              {sentCountdown !== null && (
                <span className="tabular-nums text-amber-600">
                  {sentCountdown}s
                </span>
              )}
            </span>
            <button
              onClick={() => {
                void import("../store/useOnlineStore.ts").then((m) =>
                  m.useOnlineStore.getState().leaveRoom(),
                );
              }}
              className="text-zinc-500 hover:text-white text-xs font-bold uppercase"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Player list */}
      <main
        className="flex-1 flex flex-col px-6 gap-3 min-h-0 overflow-y-auto"
        style={{ paddingBottom: "calc(var(--sab) + 1rem)" }}
      >
        {onlinePlayers.length === 0 ? (
          <div className="flex-1 flex items-center justify-center">
            <p className="text-zinc-600 text-lg uppercase tracking-widest font-bold">
              No other players online
            </p>
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            <p className="text-zinc-600 text-xs uppercase tracking-widest font-bold pt-2">
              {onlinePlayers.length} player
              {onlinePlayers.length !== 1 ? "s" : ""} online
            </p>
            {onlinePlayers.map((player) => (
              <button
                key={player.id}
                onClick={() => {
                  if (player.status === "online" && !sentInvite) {
                    setInviteTarget(player.id);
                  }
                }}
                disabled={player.status !== "online" || !!sentInvite}
                className="w-full flex items-center gap-4 px-5 py-4 rounded-xl bg-zinc-900 border border-zinc-800 transition-all hover:border-amber-600/50 disabled:opacity-40 disabled:cursor-not-allowed text-left"
              >
                <span
                  className={`size-3 rounded-full shrink-0 ${
                    player.status === "online"
                      ? "bg-emerald-500 shadow-[0_0_6px_rgba(16,185,129,0.7)]"
                      : "bg-blue-500 shadow-[0_0_6px_rgba(59,130,246,0.7)]"
                  }`}
                />
                <div className="flex-1 min-w-0">
                  <p className="text-white font-black text-lg uppercase tracking-widest truncate">
                    {player.display_name}
                  </p>
                  <div className="flex items-center gap-3">
                    <GradeBadge
                      grade={player.x01_grade}
                      label="PPD"
                      value={player.x01_ppd}
                      games={player.x01_games}
                    />
                    <GradeBadge
                      grade={player.cricket_grade}
                      label="MPR"
                      value={player.cricket_mpr}
                      games={player.cricket_games}
                    />
                  </div>
                </div>
                {player.status === "online" && !sentInvite && (
                  <span className="text-amber-500 text-xs font-bold uppercase tracking-widest shrink-0">
                    Challenge
                  </span>
                )}
              </button>
            ))}
          </div>
        )}
      </main>

      {/* Incoming invite modal */}
      {pendingInvite && (
        <InviteModal
          invite={pendingInvite}
          countdown={receivedCountdown}
          onAccept={acceptInvite}
          onDecline={declineInvite}
        />
      )}
    </div>
  );
}
