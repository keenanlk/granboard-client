import { useEffect, useRef, useState } from "react";
import { useLobby } from "../hooks/useLobby.ts";
import { InviteModal } from "../components/InviteModal.tsx";
import { useOnlineStore } from "../store/useOnlineStore.ts";
import type { OnlineGameType } from "../store/online.types.ts";

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

  const [nameInput, setNameInput] = useState(
    () => localStorage.getItem("nlc-online-name") ?? "",
  );
  const [inviteTarget, setInviteTarget] = useState<string | null>(null);
  const [selectedGame, setSelectedGame] = useState<OnlineGameType | null>(null);

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

  // Not online yet — show name entry
  if (connectionStatus === "offline" || connectionStatus === "connecting") {
    return (
      <div className="h-screen bg-zinc-950 text-white flex flex-col items-center justify-center gap-8 px-6">
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
          Enter your display name to go online and play against others
        </p>

        <div className="flex flex-col gap-4 w-full max-w-xs">
          <input
            type="text"
            value={nameInput}
            onChange={(e) => setNameInput(e.target.value)}
            placeholder="Display name"
            maxLength={20}
            className="w-full px-4 py-4 rounded-xl bg-zinc-900 border border-zinc-700 text-white text-center text-xl font-bold uppercase tracking-widest placeholder:text-zinc-600 focus:outline-none focus:border-amber-500 transition-colors"
            onKeyDown={(e) => {
              if (e.key === "Enter" && nameInput.trim()) {
                localStorage.setItem("nlc-online-name", nameInput.trim());
                void goOnline(nameInput.trim());
              }
            }}
          />
          <button
            onClick={() => {
              if (nameInput.trim()) {
                localStorage.setItem("nlc-online-name", nameInput.trim());
                void goOnline(nameInput.trim());
              }
            }}
            disabled={!nameInput.trim() || connectionStatus === "connecting"}
            className="w-full py-4 rounded-xl font-black text-lg uppercase tracking-widest bg-amber-600 text-white active:bg-amber-700 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {connectionStatus === "connecting" ? "Connecting…" : "Go Online"}
          </button>
        </div>
      </div>
    );
  }

  // Game type picker (after tapping a player)
  if (inviteTarget && !selectedGame) {
    const targetPlayer = onlinePlayers.find((p) => p.id === inviteTarget);
    return (
      <div className="h-screen bg-zinc-950 text-white flex flex-col items-center justify-center gap-8 px-6">
        <h2 className="text-2xl font-black uppercase tracking-widest text-zinc-300">
          Challenge{" "}
          <span className="text-white">
            {targetPlayer?.display_name ?? "Player"}
          </span>
        </h2>
        <p className="text-zinc-500 text-sm">Pick a game mode</p>

        <div className="flex flex-col gap-3 w-full max-w-xs">
          {GAME_TYPES.map((g) => (
            <button
              key={g.id}
              onClick={() => {
                setSelectedGame(g.id);
                sendInvite(inviteTarget, g.id, {});
                setInviteTarget(null);
                setSelectedGame(null);
              }}
              className="w-full py-5 rounded-xl font-black text-xl uppercase tracking-widest bg-zinc-900 border-2 border-zinc-800 transition-all hover:scale-[1.02]"
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
                  <p className="text-zinc-500 text-xs uppercase tracking-wider">
                    {player.status === "online" ? "Available" : "In Game"}
                  </p>
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
