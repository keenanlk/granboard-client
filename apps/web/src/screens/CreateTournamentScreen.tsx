import { useState } from "react";
import { ArrowLeft } from "lucide-react";
import type {
  TournamentFormat,
  TournamentVisibility,
  TournamentGameConfig,
  TournamentGameType,
} from "@nlc-darts/tournament";
import type { SetFormat } from "@nlc-darts/engine";
import { DEFAULT_CRICKET_OPTIONS } from "@nlc-darts/engine";

const FORMAT_OPTIONS: { value: TournamentFormat; label: string }[] = [
  { value: "single_elimination", label: "Single Elim" },
  { value: "double_elimination", label: "Double Elim" },
  { value: "round_robin", label: "Round Robin" },
];

function isPowerOfTwo(n: number): boolean {
  return n > 0 && (n & (n - 1)) === 0;
}

function nearestPowersOfTwo(n: number): [number, number] {
  let lower = 1;
  while (lower * 2 <= n) lower *= 2;
  return [lower, lower * 2];
}

interface CreateTournamentScreenProps {
  onBack: () => void;
  onCreateOnline: (data: CreateTournamentData) => void;
  onCreateLocal: (data: CreateTournamentData) => void;
}

export interface CreateTournamentData {
  name: string;
  format: TournamentFormat;
  visibility: TournamentVisibility;
  scheduledAt: string | null;
  registrationDeadline: string | null;
  maxParticipants: number | null;
  gameSettings: TournamentGameConfig;
}

export function CreateTournamentScreen({
  onBack,
  onCreateOnline,
  onCreateLocal,
}: CreateTournamentScreenProps) {
  const [name, setName] = useState("");
  const [format, setFormat] = useState<TournamentFormat>("single_elimination");
  const [visibility, setVisibility] = useState<TournamentVisibility>("public");
  const [startImmediately, setStartImmediately] = useState(true);
  const [scheduledAt, setScheduledAt] = useState("");
  const [registrationDeadline, setRegistrationDeadline] = useState("");
  const [maxParticipantsStr, setMaxParticipantsStr] = useState("");
  const [mode, setMode] = useState<"online" | "local">("online");
  const [gameType, setGameType] = useState<TournamentGameType>("x01");
  const [bestOf, setBestOf] = useState<SetFormat>("bo3");
  const [startingScore, setStartingScore] = useState<301 | 501 | 701>(501);
  const [doubleOut, setDoubleOut] = useState(false);

  const maxParticipants = maxParticipantsStr
    ? parseInt(maxParticipantsStr, 10)
    : null;

  const isElimination = format !== "round_robin";
  const maxValid =
    !maxParticipants || !isElimination || isPowerOfTwo(maxParticipants);

  const canSubmit = name.trim().length > 0 && maxValid;

  const handleSubmit = () => {
    if (!canSubmit) return;

    const gameSettings: TournamentGameConfig = {
      gameType,
      bestOf,
      throwOrder: "loser",
      x01Options:
        gameType === "x01"
          ? {
              startingScore,
              splitBull: false,
              doubleOut,
              masterOut: false,
              doubleIn: false,
            }
          : undefined,
      cricketOptions:
        gameType === "cricket" ? DEFAULT_CRICKET_OPTIONS : undefined,
    };

    const data: CreateTournamentData = {
      name: name.trim(),
      format,
      visibility,
      scheduledAt: startImmediately ? null : scheduledAt || null,
      registrationDeadline: startImmediately
        ? null
        : registrationDeadline || null,
      maxParticipants,
      gameSettings,
    };

    if (mode === "online") {
      onCreateOnline(data);
    } else {
      onCreateLocal(data);
    }
  };

  return (
    <div className="h-full flex flex-col bg-black text-white">
      {/* Header */}
      <div className="flex items-center gap-4 px-6 pt-6 pb-4">
        <button
          onClick={onBack}
          className="p-2 rounded-xl bg-zinc-900 border border-zinc-800"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h1 className="text-xl font-bold">Create Tournament</h1>
      </div>

      {/* Form */}
      <div className="flex-1 overflow-y-auto px-6 pb-6 space-y-5">
        {/* Name */}
        <div>
          <label className="text-xs uppercase tracking-widest text-zinc-500 font-bold block mb-1">
            Tournament Name
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Weekend Showdown"
            className="w-full px-4 py-3 rounded-xl bg-zinc-900 border border-zinc-800 text-base focus:outline-none focus:border-amber-500"
          />
        </div>

        {/* Format */}
        <div>
          <label className="text-xs uppercase tracking-widest text-zinc-500 font-bold block mb-2">
            Format
          </label>
          <div className="flex gap-2">
            {FORMAT_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                onClick={() => setFormat(opt.value)}
                className={`flex-1 py-3 rounded-xl text-sm font-bold transition-colors ${
                  format === opt.value
                    ? "bg-amber-600 text-black"
                    : "bg-zinc-900 border border-zinc-800 text-zinc-400"
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        {/* Game Type */}
        <div>
          <label className="text-xs uppercase tracking-widest text-zinc-500 font-bold block mb-2">
            Game Type
          </label>
          <div className="flex gap-2">
            {(["x01", "cricket"] as TournamentGameType[]).map((gt) => (
              <button
                key={gt}
                onClick={() => setGameType(gt)}
                className={`flex-1 py-3 rounded-xl text-sm font-bold transition-colors ${
                  gameType === gt
                    ? "bg-amber-600 text-black"
                    : "bg-zinc-900 border border-zinc-800 text-zinc-400"
                }`}
              >
                {gt === "x01" ? "X01" : "Cricket"}
              </button>
            ))}
          </div>
        </div>

        {/* Best Of */}
        <div>
          <label className="text-xs uppercase tracking-widest text-zinc-500 font-bold block mb-2">
            Best Of
          </label>
          <div className="flex gap-2">
            {(["bo1", "bo3", "bo5", "bo7", "bo9"] as SetFormat[]).map((fmt) => (
              <button
                key={fmt}
                onClick={() => setBestOf(fmt)}
                className={`flex-1 py-3 rounded-xl text-sm font-bold transition-colors ${
                  bestOf === fmt
                    ? "bg-amber-600 text-black"
                    : "bg-zinc-900 border border-zinc-800 text-zinc-400"
                }`}
              >
                {fmt.slice(2)}
              </button>
            ))}
          </div>
        </div>

        {/* Starting Score (x01 only) */}
        {gameType === "x01" && (
          <div>
            <label className="text-xs uppercase tracking-widest text-zinc-500 font-bold block mb-2">
              Starting Score
            </label>
            <div className="flex gap-2">
              {([301, 501, 701] as (301 | 501 | 701)[]).map((score) => (
                <button
                  key={score}
                  onClick={() => setStartingScore(score)}
                  className={`flex-1 py-3 rounded-xl text-sm font-bold transition-colors ${
                    startingScore === score
                      ? "bg-amber-600 text-black"
                      : "bg-zinc-900 border border-zinc-800 text-zinc-400"
                  }`}
                >
                  {score}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Double Out (x01 only) */}
        {gameType === "x01" && (
          <div>
            <label className="text-xs uppercase tracking-widest text-zinc-500 font-bold block mb-2">
              Double Out
            </label>
            <div className="flex items-center gap-3">
              <button
                onClick={() => setDoubleOut(!doubleOut)}
                className={`w-12 h-7 rounded-full transition-colors relative ${
                  doubleOut ? "bg-amber-600" : "bg-zinc-700"
                }`}
              >
                <div
                  className={`w-5 h-5 rounded-full bg-white absolute top-1 transition-all ${
                    doubleOut ? "left-6" : "left-1"
                  }`}
                />
              </button>
              <span className="text-sm text-zinc-300">
                Must finish on a double
              </span>
            </div>
          </div>
        )}

        {/* Mode */}
        <div>
          <label className="text-xs uppercase tracking-widest text-zinc-500 font-bold block mb-2">
            Mode
          </label>
          <div className="flex gap-2">
            <button
              onClick={() => setMode("online")}
              className={`flex-1 py-3 rounded-xl text-sm font-bold transition-colors ${
                mode === "online"
                  ? "bg-blue-600 text-white"
                  : "bg-zinc-900 border border-zinc-800 text-zinc-400"
              }`}
            >
              Online
            </button>
            <button
              onClick={() => setMode("local")}
              className={`flex-1 py-3 rounded-xl text-sm font-bold transition-colors ${
                mode === "local"
                  ? "bg-blue-600 text-white"
                  : "bg-zinc-900 border border-zinc-800 text-zinc-400"
              }`}
            >
              Local
            </button>
          </div>
        </div>

        {/* Visibility (online only) */}
        {mode === "online" && (
          <div>
            <label className="text-xs uppercase tracking-widest text-zinc-500 font-bold block mb-2">
              Visibility
            </label>
            <div className="flex gap-2">
              <button
                onClick={() => setVisibility("public")}
                className={`flex-1 py-3 rounded-xl text-sm font-bold transition-colors ${
                  visibility === "public"
                    ? "bg-green-600 text-white"
                    : "bg-zinc-900 border border-zinc-800 text-zinc-400"
                }`}
              >
                Public
              </button>
              <button
                onClick={() => setVisibility("private")}
                className={`flex-1 py-3 rounded-xl text-sm font-bold transition-colors ${
                  visibility === "private"
                    ? "bg-zinc-600 text-white"
                    : "bg-zinc-900 border border-zinc-800 text-zinc-400"
                }`}
              >
                Private (Code Only)
              </button>
            </div>
          </div>
        )}

        {/* Schedule */}
        {mode === "online" && (
          <div>
            <label className="text-xs uppercase tracking-widest text-zinc-500 font-bold block mb-2">
              Schedule
            </label>
            <div className="flex items-center gap-3 mb-2">
              <button
                onClick={() => setStartImmediately(!startImmediately)}
                className={`w-12 h-7 rounded-full transition-colors relative ${
                  startImmediately ? "bg-amber-600" : "bg-zinc-700"
                }`}
              >
                <div
                  className={`w-5 h-5 rounded-full bg-white absolute top-1 transition-all ${
                    startImmediately ? "left-6" : "left-1"
                  }`}
                />
              </button>
              <span className="text-sm text-zinc-300">
                Start manually (no schedule)
              </span>
            </div>
            {!startImmediately && (
              <div className="space-y-2">
                <input
                  type="datetime-local"
                  value={scheduledAt}
                  onChange={(e) => setScheduledAt(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl bg-zinc-900 border border-zinc-800 text-sm focus:outline-none focus:border-amber-500"
                />
                <input
                  type="datetime-local"
                  value={registrationDeadline}
                  onChange={(e) => setRegistrationDeadline(e.target.value)}
                  placeholder="Registration deadline (optional)"
                  className="w-full px-4 py-3 rounded-xl bg-zinc-900 border border-zinc-800 text-sm focus:outline-none focus:border-amber-500"
                />
                <p className="text-zinc-600 text-xs">
                  Registration deadline (optional)
                </p>
              </div>
            )}
          </div>
        )}

        {/* Max participants */}
        <div>
          <label className="text-xs uppercase tracking-widest text-zinc-500 font-bold block mb-1">
            Max Players (optional)
          </label>
          <input
            type="number"
            value={maxParticipantsStr}
            onChange={(e) => setMaxParticipantsStr(e.target.value)}
            placeholder="e.g. 8, 16, 32"
            min={2}
            className="w-full px-4 py-3 rounded-xl bg-zinc-900 border border-zinc-800 text-base focus:outline-none focus:border-amber-500"
          />
          {maxParticipants &&
            isElimination &&
            !isPowerOfTwo(maxParticipants) && (
              <p className="text-amber-400 text-xs mt-1">
                Must be a power of 2 for elimination formats. Did you mean{" "}
                {nearestPowersOfTwo(maxParticipants).join(" or ")}?
              </p>
            )}
        </div>
      </div>

      {/* Submit */}
      <div className="px-6 pb-6">
        <button
          onClick={handleSubmit}
          disabled={!canSubmit}
          className="w-full py-4 rounded-2xl bg-amber-600 text-black text-lg font-bold disabled:opacity-40 transition-opacity"
        >
          Create Tournament
        </button>
      </div>
    </div>
  );
}
