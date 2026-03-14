import { useState } from "react";
import { useGranboardStore } from "../store/useGranboardStore.ts";
import { MockGranboard } from "../board/MockGranboard.ts";
import { SegmentID } from "../board/Dartboard.ts";

// Numbers in dartboard clockwise order (same as physical board layout)
const BOARD_ORDER = [
  20, 1, 18, 4, 13, 6, 10, 15, 2, 17, 3, 19, 7, 16, 8, 11, 14, 9, 12, 5,
];

function segmentIdFor(n: number, zone: "S" | "D" | "T"): number {
  const base = (n - 1) * 4;
  if (zone === "T") return base + 1; // TRP_n
  if (zone === "D") return base + 3; // DBL_n
  return base; // INNER_n (single)
}

export function DevBoard() {
  const { board, connectMock, disconnect } = useGranboardStore();
  const [open, setOpen] = useState(false);

  const mock = board instanceof MockGranboard ? board : null;

  function hit(segId: number) {
    mock?.simulateHit(segId as SegmentID);
  }

  return (
    <div className="fixed bottom-4 left-4 z-50 font-mono text-xs select-none">
      {/* Toggle / connect button */}
      <button
        onClick={() => {
          if (!mock) {
            connectMock();
            setOpen(true);
          } else {
            setOpen((o) => !o);
          }
        }}
        className="px-3 py-1.5 rounded-lg bg-zinc-800 border border-zinc-600 text-zinc-300 hover:bg-zinc-700 transition-colors"
      >
        🎯 {mock ? (open ? "Hide Board" : "Show Board") : "Mock Board"}
      </button>

      {mock && open && (
        <div className="absolute bottom-10 left-0 bg-zinc-900 border border-zinc-700 rounded-xl p-3 shadow-2xl w-[340px]">
          <div className="flex items-center justify-between mb-2">
            <span className="text-zinc-400 uppercase tracking-wider text-[10px]">
              Dev Board — click to throw
            </span>
            <button
              onClick={() => {
                disconnect();
                setOpen(false);
              }}
              className="text-zinc-600 hover:text-red-400 text-[10px] uppercase tracking-wider"
            >
              Disconnect
            </button>
          </div>

          {/* Number grid */}
          <div className="grid grid-cols-4 gap-1 mb-2">
            {BOARD_ORDER.map((n) => (
              <div key={n} className="flex gap-0.5">
                <span className="w-5 text-center text-zinc-400 font-black leading-none self-center">
                  {n}
                </span>
                {(["S", "D", "T"] as const).map((zone) => (
                  <button
                    key={zone}
                    onClick={() => hit(segmentIdFor(n, zone))}
                    className={`flex-1 py-1 rounded text-[10px] font-black transition-colors ${
                      zone === "T"
                        ? "bg-yellow-900 hover:bg-yellow-700 text-yellow-300"
                        : zone === "D"
                          ? "bg-green-900 hover:bg-green-700 text-green-300"
                          : "bg-zinc-800 hover:bg-zinc-600 text-zinc-300"
                    }`}
                  >
                    {zone}
                  </button>
                ))}
              </div>
            ))}
          </div>

          {/* Special segments */}
          <div className="flex gap-1 border-t border-zinc-800 pt-2">
            <button
              onClick={() => hit(SegmentID.BULL)}
              className="flex-1 py-1 rounded bg-red-900 hover:bg-red-700 text-red-300 font-black"
            >
              BULL
            </button>
            <button
              onClick={() => hit(SegmentID.DBL_BULL)}
              className="flex-1 py-1 rounded bg-red-800 hover:bg-red-600 text-red-200 font-black"
            >
              DBULL
            </button>
            <button
              onClick={() => hit(SegmentID.MISS)}
              className="flex-1 py-1 rounded bg-zinc-800 hover:bg-zinc-700 text-zinc-500 font-black"
            >
              MISS
            </button>
            <button
              onClick={() => hit(SegmentID.RESET_BUTTON)}
              className="flex-1 py-1 rounded bg-blue-900 hover:bg-blue-700 text-blue-300 font-black"
            >
              RESET
            </button>
          </div>
        </div>
      )}

      {/* Status badge when connected but panel closed */}
      {mock && !open && (
        <span className="ml-2 text-[10px] text-emerald-500">● mock</span>
      )}
    </div>
  );
}
