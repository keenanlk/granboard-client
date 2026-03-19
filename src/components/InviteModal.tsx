import type { Invite } from "../store/online.types.ts";

interface InviteModalProps {
  invite: Invite;
  countdown: number | null;
  onAccept: (invite: Invite) => void;
  onDecline: (invite: Invite) => void;
}

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

export function InviteModal({
  invite,
  countdown,
  onAccept,
  onDecline,
}: InviteModalProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm">
      <div className="bg-zinc-900 border border-zinc-700 rounded-2xl p-8 max-w-sm w-full mx-4 flex flex-col gap-6">
        <div className="flex flex-col gap-2 text-center">
          <h2 className="text-2xl font-black text-white uppercase tracking-widest">
            Game Invite
          </h2>
          <p className="text-zinc-300 text-lg">
            <span className="text-white font-bold">
              {invite.from_name ?? "Someone"}
            </span>{" "}
            wants to play
          </p>
          <p
            className="text-2xl font-black uppercase tracking-widest"
            style={{
              fontFamily: "Beon, sans-serif",
              color: "#f59e0b",
              textShadow: "0 0 15px #f59e0b, 0 0 40px rgba(245,158,11,0.5)",
            }}
          >
            {gameTypeLabel(invite.game_type)}
          </p>
          {countdown !== null && countdown > 0 && (
            <p className="text-zinc-500 text-sm tabular-nums">
              Expires in {countdown}s
            </p>
          )}
        </div>
        <div className="flex flex-col gap-3">
          <button
            onClick={() => onAccept(invite)}
            className="w-full py-4 rounded-xl font-black text-lg uppercase tracking-widest bg-emerald-600 text-white active:bg-emerald-700 transition-colors"
          >
            Accept
          </button>
          <button
            onClick={() => onDecline(invite)}
            className="w-full py-3 rounded-xl font-bold text-sm uppercase tracking-widest bg-zinc-800 text-zinc-400 border border-zinc-700 active:bg-zinc-700 transition-colors"
          >
            Decline
          </button>
        </div>
      </div>
    </div>
  );
}
