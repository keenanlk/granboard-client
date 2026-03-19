import { useEffect, useState } from "react";
import type { CricketThrownDart } from "../engine/cricket.types.ts";

interface Props {
  darts: CricketThrownDart[];
  onDismiss: () => void;
}

function MarkSvg({ marks }: { marks: number }) {
  return (
    <svg
      viewBox="0 0 24 24"
      stroke="currentColor"
      fill="none"
      strokeWidth="3"
      className="w-full h-full"
    >
      <line x1="18" y1="6" x2="6" y2="18" />
      {marks >= 2 && <line x1="6" y1="6" x2="18" y2="18" />}
      {marks >= 3 && <circle cx="12" cy="12" r="9" />}
    </svg>
  );
}

const POP_INTERVAL_MS = 500;
const HOLD_AFTER_LAST_MS = 2200;

export function CricketMarksOverlay({ darts, onDismiss }: Props) {
  const [visibleCount, setVisibleCount] = useState(0);

  useEffect(() => {
    const timers: ReturnType<typeof setTimeout>[] = [];

    darts.forEach((_, i) => {
      timers.push(
        setTimeout(() => setVisibleCount(i + 1), i * POP_INTERVAL_MS + 150),
      );
    });

    timers.push(
      setTimeout(
        onDismiss,
        (darts.length - 1) * POP_INTERVAL_MS + 150 + HOLD_AFTER_LAST_MS,
      ),
    );

    return () => timers.forEach(clearTimeout);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div
      className="absolute inset-0 z-15 bg-black/85 flex flex-col items-center justify-center cursor-pointer gap-10"
      onClick={onDismiss}
    >
      <div className="flex gap-8 items-center">
        {darts.map((dart, i) => {
          const visible = i < visibleCount;
          const marks = dart.effectiveMarks;
          const hasMark = dart.target !== null && marks >= 1 && marks <= 3;

          return (
            <div
              key={i}
              className="flex flex-col items-center gap-3"
              style={{
                transform: visible ? "scale(1)" : "scale(0)",
                opacity: visible ? 1 : 0,
                transition:
                  "transform 0.35s cubic-bezier(0.34, 1.56, 0.64, 1), opacity 0.2s ease",
              }}
            >
              <div
                className={`w-28 h-28 flex items-center justify-center ${
                  hasMark
                    ? marks === 3
                      ? "text-green-400 drop-shadow-[0_0_20px_rgba(34,197,94,0.8)]"
                      : "text-white"
                    : "text-zinc-700"
                }`}
              >
                {hasMark ? (
                  <MarkSvg marks={marks} />
                ) : (
                  <span className="text-6xl font-black leading-none select-none">
                    —
                  </span>
                )}
              </div>
              <span className="text-xs font-black uppercase tracking-widest text-zinc-500">
                {hasMark
                  ? marks === 3
                    ? "Triple"
                    : marks === 2
                      ? "Double"
                      : "Single"
                  : "Miss"}
              </span>
            </div>
          );
        })}
      </div>

      <p className="text-zinc-600 text-xs uppercase tracking-wider">
        Tap to continue
      </p>
    </div>
  );
}
