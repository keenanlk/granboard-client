import { Component } from "react";
import type { ErrorInfo, ReactNode } from "react";
import { logger } from "../lib/logger.ts";

const log = logger.child({ module: "error-boundary" });

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
}

export class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    log.error(
      { err: error, componentStack: info.componentStack },
      "Uncaught render error",
    );
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="h-screen bg-zinc-950 flex flex-col items-center justify-center gap-8 p-8">
          <h1 className="text-4xl font-black text-white uppercase tracking-widest text-center">
            Something went wrong
          </h1>
          <p className="text-xl text-zinc-400 text-center">
            An unexpected error occurred
          </p>
          <button
            onClick={() => window.location.reload()}
            className="px-12 py-5 rounded-2xl bg-emerald-600 text-white text-2xl font-black uppercase tracking-widest active:bg-emerald-700 transition-colors"
          >
            Tap to Reload
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}
