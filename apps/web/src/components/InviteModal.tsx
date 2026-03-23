import { useEffect, useRef, useState } from "react";
import { DEFAULT_X01_OPTIONS, DEFAULT_CRICKET_OPTIONS } from "@nlc-darts/engine";
import type {
  X01Options,
  CricketOptions,
  SetConfig,
  LegConfig,
} from "@nlc-darts/engine";
import type { Invite } from "../store/online.types.ts";

interface InviteModalProps {
  invite: Invite;
  countdown: number | null;
  onAccept: (invite: Invite) => void;
  onDecline: (invite: Invite) => void;
}

const GAME_COLORS: Record<string, string> = {
  x01: "#ef4444",
  cricket: "#4ade80",
  set: "#60a5fa",
};

function gameTypeLabel(type: string): string {
  switch (type) {
    case "x01":
      return "X01";
    case "cricket":
      return "Cricket";
    case "set":
      return "Set Match";
    default:
      return type;
  }
}

function x01Summary(opts: X01Options): string {
  const parts: string[] = [String(opts.startingScore)];
  if (opts.doubleIn) parts.push("Dbl In");
  if (opts.doubleOut) parts.push("Dbl Out");
  if (opts.masterOut) parts.push("Master Out");
  if (opts.splitBull) parts.push("Split Bull");
  if (parts.length === 1) parts.push("Straight Out");
  return parts.join(" · ");
}

function cricketSummary(opts: CricketOptions): string {
  const parts: string[] = [];
  if (opts.cutThroat) parts.push("Cut-Throat");
  if (opts.singleBull) parts.push("Split Bull");
  if (parts.length === 0) parts.push("Standard");
  return parts.join(" · ");
}

function legSummary(leg: LegConfig): string {
  if (leg.gameType === "cricket") {
    return `Cricket — ${cricketSummary(leg.cricketOptions ?? DEFAULT_CRICKET_OPTIONS)}`;
  }
  return `X01 — ${x01Summary(leg.x01Options ?? DEFAULT_X01_OPTIONS)}`;
}

function OptionsSummary({ invite }: { invite: Invite }) {
  const opts = invite.game_options as Record<string, unknown> | null;
  if (!opts) return null;

  if (invite.game_type === "x01") {
    const x01 = opts as unknown as X01Options;
    if (!x01.startingScore) return null;
    return (
      <p className="text-zinc-400 text-sm">{x01Summary(x01)}</p>
    );
  }

  if (invite.game_type === "cricket") {
    const cricket = opts as unknown as CricketOptions;
    return (
      <p className="text-zinc-400 text-sm">{cricketSummary(cricket)}</p>
    );
  }

  if (invite.game_type === "set") {
    const setConfig = opts as unknown as SetConfig;
    if (!setConfig.format || !setConfig.legs) return null;
    return (
      <div className="flex flex-col gap-1">
        <p className="text-zinc-300 text-sm font-bold">
          Best of {setConfig.format === "bo3" ? 3 : 5}
        </p>
        {setConfig.legs.map((leg, i) => (
          <p key={i} className="text-zinc-500 text-xs">
            Leg {i + 1}: {legSummary(leg)}
          </p>
        ))}
      </div>
    );
  }

  return null;
}

/** Accept button whose background drains from green → red as the invite expires. */
function AcceptButton({
  invite,
  onAccept,
}: {
  invite: Invite;
  onAccept: (invite: Invite) => void;
}) {
  const [progress, setProgress] = useState(1); // 1 = full green, 0 = full red
  const rafRef = useRef(0);

  useEffect(() => {
    const createdAt = new Date(invite.created_at).getTime();
    const expiresAt = new Date(invite.expires_at).getTime();
    const totalMs = expiresAt - createdAt;
    if (totalMs <= 0) return;

    function tick() {
      const remaining = Math.max(0, expiresAt - Date.now());
      setProgress(remaining / totalMs);
      if (remaining > 0) {
        rafRef.current = requestAnimationFrame(tick);
      }
    }

    rafRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafRef.current);
  }, [invite.created_at, invite.expires_at]);

  // Green on the right, red creeping in from the left
  const pct = ((1 - progress) * 100).toFixed(1);
  const bg = `linear-gradient(to right, #dc2626 ${pct}%, #16a34a ${pct}%)`;

  return (
    <button
      onClick={() => onAccept(invite)}
      className="py-3 px-8 rounded-xl font-black text-lg uppercase tracking-widest text-white active:brightness-90 transition-[filter]"
      style={{ background: bg }}
    >
      Accept
    </button>
  );
}

export function InviteModal({
  invite,
  countdown,
  onAccept,
  onDecline,
}: InviteModalProps) {
  const color = GAME_COLORS[invite.game_type] ?? "#f59e0b";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <div className="bg-zinc-900 border border-zinc-700 rounded-2xl p-5 max-w-lg w-full max-h-[calc(100vh-2rem)] overflow-y-auto flex flex-row gap-5 items-center relative">
        {/* Countdown badge — top right */}
        {countdown !== null && countdown > 0 && (
          <span
            className={`absolute top-3 right-3 text-xs font-black tabular-nums ${
              countdown <= 5 ? "text-red-500 animate-pulse" : "text-zinc-500"
            }`}
          >
            {countdown}s
          </span>
        )}
        {/* Info */}
        <div className="flex-1 min-w-0 flex flex-col gap-1 text-center">
          <p className="text-zinc-400 text-sm">
            <span className="text-white font-bold">
              {invite.from_name ?? "Someone"}
            </span>{" "}
            wants to play
          </p>
          <p
            className="text-2xl font-black uppercase tracking-widest"
            style={{
              fontFamily: "Beon, sans-serif",
              color,
              textShadow: `0 0 15px ${color}, 0 0 40px ${color}80`,
            }}
          >
            {gameTypeLabel(invite.game_type)}
          </p>
          <OptionsSummary invite={invite} />
        </div>
        {/* Buttons */}
        <div className="flex flex-col gap-2 shrink-0">
          <AcceptButton invite={invite} onAccept={onAccept} />
          <button
            onClick={() => onDecline(invite)}
            className="py-2 px-8 rounded-xl font-bold text-sm uppercase tracking-widest bg-zinc-800 text-zinc-400 border border-zinc-700 active:bg-zinc-700 transition-colors"
          >
            Decline
          </button>
        </div>
      </div>
    </div>
  );
}
