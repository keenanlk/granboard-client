import { useState } from "react";
import { supabase } from "../lib/supabaseClient.ts";
import {
  signInWithGoogle,
  signInWithApple,
  isNativePlatform,
} from "../lib/socialAuth.ts";

interface AuthScreenProps {
  onAuthenticated: () => void;
  onBack: () => void;
}

type AuthStep = "buttons" | "signing-in" | "name-confirm" | "error";

export function AuthScreen({ onAuthenticated, onBack }: AuthScreenProps) {
  const [step, setStep] = useState<AuthStep>("buttons");
  const [errorMsg, setErrorMsg] = useState("");
  const [displayName, setDisplayName] = useState("");

  async function handleGoogle() {
    setStep("signing-in");
    const { error } = await signInWithGoogle();
    if (error) {
      setErrorMsg(error);
      setStep("error");
      return;
    }
    await checkFirstTime();
  }

  async function handleApple() {
    setStep("signing-in");
    const { error } = await signInWithApple();
    if (error) {
      setErrorMsg(error);
      setStep("error");
      return;
    }
    await checkFirstTime();
  }

  async function checkFirstTime() {
    const localName = localStorage.getItem("nlc-online-name");
    if (localName) {
      onAuthenticated();
      return;
    }

    const {
      data: { session },
    } = await supabase.auth.getSession();
    const userId = session?.user?.id;

    // Check DB for existing display name (e.g. localStorage was cleared)
    if (userId) {
      const { data } = await supabase
        .from("online_players")
        .select("display_name")
        .eq("id", userId)
        .single();
      if (data?.display_name) {
        localStorage.setItem("nlc-online-name", data.display_name);
        onAuthenticated();
        return;
      }
    }

    // First-time user — pre-fill from provider metadata
    const providerName =
      (session?.user?.user_metadata?.full_name as string) ?? "";
    setDisplayName(providerName);
    setStep("name-confirm");
  }

  function handleConfirmName() {
    const name = displayName.trim();
    if (!name) return;
    localStorage.setItem("nlc-online-name", name);
    onAuthenticated();
  }

  // Name confirmation step (first-time sign-in)
  if (step === "name-confirm") {
    return (
      <div
        className="h-screen bg-zinc-950 text-white flex flex-col items-center justify-center gap-6 px-6"
        style={{
          paddingTop: "calc(var(--sat) + 1rem)",
          paddingBottom: "calc(var(--sab) + 1rem)",
        }}
      >
        <h1
          className="text-3xl tracking-tight font-normal"
          style={{
            fontFamily: "Beon, sans-serif",
            color: "#4ade80",
            textShadow:
              "0 0 20px #4ade80, 0 0 60px #4ade80, 0 0 100px rgba(74,222,128,0.5)",
          }}
        >
          Your Name
        </h1>
        <p className="text-zinc-400 text-center max-w-xs">
          This is how other players will see you. You can change it later.
        </p>
        <input
          type="text"
          value={displayName}
          onChange={(e) => setDisplayName(e.target.value)}
          placeholder="Display name"
          maxLength={20}
          className="w-full max-w-xs px-4 py-4 rounded-xl bg-zinc-900 border border-zinc-700 text-white text-center text-xl font-bold uppercase tracking-widest placeholder:text-zinc-600 focus:outline-none focus:border-green-500 transition-colors"
          onKeyDown={(e) => {
            if (e.key === "Enter" && displayName.trim()) {
              handleConfirmName();
            }
          }}
        />
        <button
          onClick={handleConfirmName}
          disabled={!displayName.trim()}
          className="w-full max-w-xs py-4 rounded-xl font-black text-lg uppercase tracking-widest bg-green-600 text-white active:bg-green-700 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
        >
          Continue
        </button>
      </div>
    );
  }

  return (
    <div
      className="h-screen bg-zinc-950 text-white flex flex-col items-center justify-center gap-6 px-6"
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
        Sign In
      </h1>
      <p className="text-zinc-400 text-center max-w-xs">
        Sign in to play online.
      </p>

      {step === "error" && (
        <p className="text-red-400 text-sm text-center max-w-xs">{errorMsg}</p>
      )}

      <div className="flex flex-col gap-3 w-full max-w-xs">
        <button
          onClick={() => void handleGoogle()}
          disabled={step === "signing-in"}
          className="w-full py-4 rounded-xl font-black text-lg uppercase tracking-widest bg-white text-zinc-900 active:bg-zinc-200 transition-colors disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-3"
        >
          <svg viewBox="0 0 24 24" className="size-5 shrink-0">
            <path
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"
              fill="#4285F4"
            />
            <path
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              fill="#34A853"
            />
            <path
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
              fill="#FBBC05"
            />
            <path
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
              fill="#EA4335"
            />
          </svg>
          {step === "signing-in" ? "Signing in..." : "Sign in with Google"}
        </button>

        {isNativePlatform() && (
          <button
            onClick={() => void handleApple()}
            disabled={step === "signing-in"}
            className="w-full py-4 rounded-xl font-black text-lg uppercase tracking-widest bg-zinc-900 border border-zinc-700 text-white active:bg-zinc-800 transition-colors disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-3"
          >
            <svg viewBox="0 0 24 24" className="size-5 shrink-0 fill-current">
              <path d="M17.05 20.28c-.98.95-2.05.88-3.08.4-1.09-.5-2.08-.48-3.24 0-1.44.62-2.2.44-3.06-.4C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z" />
            </svg>
            {step === "signing-in" ? "Signing in..." : "Sign in with Apple"}
          </button>
        )}
      </div>
    </div>
  );
}
