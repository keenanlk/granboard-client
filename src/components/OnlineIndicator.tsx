interface OnlineIndicatorProps {
  isHost: boolean;
  connected: boolean;
}

export function OnlineIndicator({ isHost, connected }: OnlineIndicatorProps) {
  return (
    <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-zinc-900 border border-zinc-700">
      <span
        className={`size-2 rounded-full ${
          connected
            ? "bg-amber-400 shadow-[0_0_6px_rgba(245,158,11,0.7)]"
            : "bg-red-500 animate-pulse"
        }`}
      />
      <span className="text-xs font-bold uppercase tracking-widest text-zinc-400">
        {connected ? (isHost ? "Host" : "Online") : "Reconnecting…"}
      </span>
    </div>
  );
}
