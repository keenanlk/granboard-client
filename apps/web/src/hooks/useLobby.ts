import { useEffect, useRef, useState } from "react";
import { useOnlineStore } from "../store/useOnlineStore.ts";
import type { Invite, OnlineGameType } from "../store/online.types.ts";

/**
 * Thin selector hook for lobby state.
 * Invite countdowns computed from `expires_at` timestamps.
 */
export function useLobby() {
  const lobbyPhase = useOnlineStore((s) => s.lobbyPhase);
  const onlinePlayers = useOnlineStore((s) => s.onlinePlayers);
  const pendingInvite = useOnlineStore((s) => s.pendingInvite);
  const sentInvite = useOnlineStore((s) => s.sentInvite);
  const currentRoom = useOnlineStore((s) => s.currentRoom);
  const goOnline = useOnlineStore((s) => s.goOnline);
  const goOffline = useOnlineStore((s) => s.goOffline);
  const sendInvite = useOnlineStore((s) => s.sendInvite);
  const acceptInvite = useOnlineStore((s) => s.acceptInvite);
  const declineInvite = useOnlineStore((s) => s.declineInvite);
  const dismissInvite = useOnlineStore((s) => s.dismissInvite);
  const dismissSentInvite = useOnlineStore((s) => s.dismissSentInvite);

  // Countdown for sent invite (seconds remaining)
  const [sentCountdown, setSentCountdown] = useState<number | null>(null);
  const sentTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Countdown for received invite
  const [receivedCountdown, setReceivedCountdown] = useState<number | null>(
    null,
  );
  const receivedTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Track sent invite countdown
  useEffect(() => {
    if (sentTimerRef.current) {
      clearInterval(sentTimerRef.current);
      sentTimerRef.current = null;
    }

    if (!sentInvite) {
      queueMicrotask(() => setSentCountdown(null));
      return;
    }

    const expiresAt = new Date(sentInvite.expires_at).getTime();

    function tick() {
      const remaining = Math.max(0, Math.ceil((expiresAt - Date.now()) / 1000));
      setSentCountdown(remaining);
      if (remaining <= 0) {
        if (sentTimerRef.current) clearInterval(sentTimerRef.current);
        dismissSentInvite();
      }
    }

    tick();
    sentTimerRef.current = setInterval(tick, 1000);
    return () => {
      if (sentTimerRef.current) clearInterval(sentTimerRef.current);
    };
  }, [sentInvite, dismissSentInvite]);

  // Track received invite countdown
  useEffect(() => {
    if (receivedTimerRef.current) {
      clearInterval(receivedTimerRef.current);
      receivedTimerRef.current = null;
    }

    if (!pendingInvite) {
      queueMicrotask(() => setReceivedCountdown(null));
      return;
    }

    const expiresAt = new Date(pendingInvite.expires_at).getTime();

    function tick() {
      const remaining = Math.max(0, Math.ceil((expiresAt - Date.now()) / 1000));
      setReceivedCountdown(remaining);
      if (remaining <= 0) {
        if (receivedTimerRef.current) clearInterval(receivedTimerRef.current);
        dismissInvite();
      }
    }

    tick();
    receivedTimerRef.current = setInterval(tick, 1000);
    return () => {
      if (receivedTimerRef.current) clearInterval(receivedTimerRef.current);
    };
  }, [pendingInvite, dismissInvite]);

  function handleSendInvite(
    toId: string,
    gameType: OnlineGameType,
    gameOptions: unknown,
  ) {
    void sendInvite(toId, gameType, gameOptions);
  }

  function handleAcceptInvite(invite: Invite) {
    void acceptInvite(invite);
  }

  function handleDeclineInvite(invite: Invite) {
    void declineInvite(invite);
  }

  return {
    connectionStatus: lobbyPhase,
    lobbyPhase,
    onlinePlayers,
    pendingInvite,
    sentInvite,
    sentCountdown,
    receivedCountdown,
    currentRoom,
    goOnline,
    goOffline,
    sendInvite: handleSendInvite,
    acceptInvite: handleAcceptInvite,
    declineInvite: handleDeclineInvite,
    dismissSentInvite,
  };
}
