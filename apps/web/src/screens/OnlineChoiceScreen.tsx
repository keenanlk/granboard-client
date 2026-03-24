import { ArrowLeft, Users, Trophy } from "lucide-react";

interface OnlineChoiceScreenProps {
  onBack: () => void;
  onLobby: () => void;
  onTournaments: () => void;
}

export function OnlineChoiceScreen({
  onBack,
  onLobby,
  onTournaments,
}: OnlineChoiceScreenProps) {
  return (
    <div className="h-full flex flex-col bg-black text-white">
      {/* Header */}
      <div
        className="flex items-center gap-4 px-6 pb-4"
        style={{ paddingTop: "calc(var(--sat) + 1.5rem)" }}
      >
        <button
          onClick={onBack}
          className="p-2 rounded-xl bg-zinc-900 border border-zinc-800"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h1
          className="text-3xl tracking-tight"
          style={{
            fontFamily: "Beon, sans-serif",
            color: "#f59e0b",
            textShadow:
              "0 0 20px #f59e0b, 0 0 60px #f59e0b, 0 0 100px rgba(245,158,11,0.5)",
          }}
        >
          Online
        </h1>
      </div>

      {/* Two large tiles */}
      <div
        className="flex-1 flex flex-col gap-4 px-6"
        style={{ paddingBottom: "calc(var(--sab) + 1.5rem)" }}
      >
        <button
          onClick={onLobby}
          className="flex-1 rounded-2xl px-8 text-left transition-all duration-150 flex items-center gap-6 bg-zinc-900 border-2 border-zinc-800 hover:border-blue-500"
          style={{ minHeight: 120 }}
        >
          <Users className="w-12 h-12 text-blue-400 shrink-0" />
          <div>
            <p
              className="text-3xl tracking-tight"
              style={{
                fontFamily: "Beon, sans-serif",
                color: "#60a5fa",
                textShadow: "0 0 20px #60a5fa, 0 0 60px rgba(96,165,250,0.5)",
              }}
            >
              Open Lobby
            </p>
            <p className="text-zinc-500 text-sm mt-1 font-medium">
              Find players and start a match
            </p>
          </div>
        </button>

        <button
          onClick={onTournaments}
          className="flex-1 rounded-2xl px-8 text-left transition-all duration-150 flex items-center gap-6 bg-zinc-900 border-2 border-zinc-800 hover:border-amber-500"
          style={{ minHeight: 120 }}
        >
          <Trophy className="w-12 h-12 text-amber-400 shrink-0" />
          <div>
            <p
              className="text-3xl tracking-tight"
              style={{
                fontFamily: "Beon, sans-serif",
                color: "#f59e0b",
                textShadow: "0 0 20px #f59e0b, 0 0 60px rgba(245,158,11,0.5)",
              }}
            >
              Tournaments
            </p>
            <p className="text-zinc-500 text-sm mt-1 font-medium">
              Create or join a bracket tournament
            </p>
          </div>
        </button>
      </div>
    </div>
  );
}
