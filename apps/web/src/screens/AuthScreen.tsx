import { useState } from "react";
import { supabase } from "../lib/supabaseClient.ts";

interface AuthScreenProps {
  onAuthenticated: () => void;
  onBack: () => void;
}

type AuthStep = "email" | "checking" | "sent" | "error";

export function AuthScreen({ onAuthenticated, onBack }: AuthScreenProps) {
  const [email, setEmail] = useState("");
  const [displayName, setDisplayName] = useState(
    () => localStorage.getItem("nlc-online-name") ?? "",
  );
  const [step, setStep] = useState<AuthStep>("email");
  const [errorMsg, setErrorMsg] = useState("");
  const [otp, setOtp] = useState("");
  const [verifying, setVerifying] = useState(false);

  async function handleSignIn() {
    if (!email.trim() || !displayName.trim()) return;
    setStep("checking");

    const { error } = await supabase.auth.signInWithOtp({
      email: email.trim(),
    });

    if (error) {
      setErrorMsg(error.message);
      setStep("error");
      return;
    }

    localStorage.setItem("nlc-online-name", displayName.trim());
    setStep("sent");
  }

  async function handleVerifyOtp() {
    if (!otp.trim()) return;
    setVerifying(true);

    const { error } = await supabase.auth.verifyOtp({
      email: email.trim(),
      token: otp.trim(),
      type: "email",
    });

    if (error) {
      setErrorMsg(error.message);
      setStep("error");
      return;
    }

    onAuthenticated();
  }

  if (step === "sent") {
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
          Enter Code
        </h1>
        <p className="text-zinc-400 text-center max-w-xs">
          We sent a code to{" "}
          <span className="text-white font-bold">{email}</span>. Enter it below
          to sign in.
        </p>
        <input
          type="text"
          inputMode="numeric"
          autoComplete="one-time-code"
          value={otp}
          onChange={(e) => setOtp(e.target.value)}
          placeholder="000000"
          maxLength={6}
          className="w-full max-w-xs px-4 py-4 rounded-xl bg-zinc-900 border border-zinc-700 text-white text-center text-3xl font-bold tracking-[0.5em] placeholder:text-zinc-600 focus:outline-none focus:border-green-500 transition-colors"
          onKeyDown={(e) => {
            if (e.key === "Enter" && otp.trim()) {
              void handleVerifyOtp();
            }
          }}
        />
        <button
          onClick={() => void handleVerifyOtp()}
          disabled={!otp.trim() || verifying}
          className="w-full max-w-xs py-4 rounded-xl font-black text-lg uppercase tracking-widest bg-green-600 text-white active:bg-green-700 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
        >
          {verifying ? "Verifying..." : "Verify"}
        </button>
        <button
          onClick={() => {
            setOtp("");
            setStep("email");
          }}
          className="text-zinc-500 hover:text-white transition-colors text-sm uppercase tracking-wider font-bold"
        >
          Try Again
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
        Sign in with your email to play online. We&apos;ll send you a
        code.
      </p>

      {step === "error" && (
        <p className="text-red-400 text-sm text-center max-w-xs">{errorMsg}</p>
      )}

      <div className="flex flex-col gap-4 w-full max-w-xs">
        <input
          type="text"
          value={displayName}
          onChange={(e) => setDisplayName(e.target.value)}
          placeholder="Display name"
          maxLength={20}
          className="w-full px-4 py-4 rounded-xl bg-zinc-900 border border-zinc-700 text-white text-center text-xl font-bold uppercase tracking-widest placeholder:text-zinc-600 focus:outline-none focus:border-amber-500 transition-colors"
        />
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Email address"
          className="w-full px-4 py-4 rounded-xl bg-zinc-900 border border-zinc-700 text-white text-center text-lg placeholder:text-zinc-600 focus:outline-none focus:border-amber-500 transition-colors"
          onKeyDown={(e) => {
            if (e.key === "Enter" && email.trim() && displayName.trim()) {
              void handleSignIn();
            }
          }}
        />
        <button
          onClick={() => void handleSignIn()}
          disabled={
            !email.trim() || !displayName.trim() || step === "checking"
          }
          className="w-full py-4 rounded-xl font-black text-lg uppercase tracking-widest bg-amber-600 text-white active:bg-amber-700 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
        >
          {step === "checking" ? "Sending..." : "Send Code"}
        </button>
      </div>
    </div>
  );
}
