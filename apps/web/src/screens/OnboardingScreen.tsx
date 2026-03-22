import { useState } from "react";
import { usePlayerProfileStore } from "../store/usePlayerProfileStore.ts";

export function OnboardingScreen() {
  const [name, setName] = useState("");
  const createPlayer = usePlayerProfileStore((s) => s.createPlayer);

  const trimmed = name.trim();

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!trimmed) return;
    await createPlayer(trimmed);
  }

  return (
    <div className="h-screen bg-zinc-950 text-white flex flex-col items-center justify-center px-6">
      <h1
        className="text-5xl tracking-tight font-normal mb-2"
        style={{
          fontFamily: "Beon, sans-serif",
          color: "#fff",
          textShadow:
            "0 0 10px rgba(255,255,255,0.5), 0 0 30px rgba(255,255,255,0.2)",
        }}
      >
        Welcome to{" "}
        <span
          style={{
            color: "#ef4444",
            textShadow: "0 0 15px #ef4444, 0 0 40px rgba(239,68,68,0.5)",
          }}
        >
          NLC Darts
        </span>
      </h1>
      <p className="text-zinc-400 text-xl mb-10">
        Create a player to start tracking your stats
      </p>

      <form
        onSubmit={handleSubmit}
        className="flex flex-col gap-4 w-full max-w-md"
      >
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Enter your name"
          autoFocus
          className="w-full px-6 py-4 rounded-xl bg-zinc-900 border-2 border-zinc-700 text-white text-2xl text-center placeholder:text-zinc-600 focus:border-red-500 focus:outline-none transition-colors"
        />
        <button
          type="submit"
          disabled={!trimmed}
          className="w-full py-4 rounded-xl font-black text-xl uppercase tracking-widest bg-red-600 text-white disabled:opacity-30 disabled:cursor-not-allowed active:bg-red-700 transition-colors"
        >
          Let's Play
        </button>
      </form>
    </div>
  );
}
