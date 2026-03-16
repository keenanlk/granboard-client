import { useRef, useState } from "react";
import { useGranboardStore } from "../store/useGranboardStore.ts";
import { MockGranboard } from "../board/MockGranboard.ts";
import { SegmentID } from "../board/Dartboard.ts";
import { gameLogger } from "../lib/GameLogger.ts";
import { getActiveController } from "../controllers/GameController.ts";

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

/** Button to show in menu dropdown — connects mock and/or toggles panel */
export function DevBoardMenuButton({ onActivate }: { onActivate: () => void }) {
  const { board, connectMock } = useGranboardStore();
  const mock = board instanceof MockGranboard ? board : null;

  return (
    <button
      onClick={() => {
        if (!mock) connectMock();
        onActivate();
      }}
      className="w-full flex items-center gap-3 px-5 py-4 text-left text-base font-semibold uppercase tracking-wide text-content-secondary hover:text-content-primary hover:bg-surface-overlay transition-colors"
    >
      🎯 {mock ? "Show Board" : "Mock Board"}
    </button>
  );
}

/** Floating draggable board panel — rendered at top level, controlled by parent */
export function DevBoardPanel({ onClose }: { onClose: () => void }) {
  const { board, disconnect } = useGranboardStore();
  const [pos, setPos] = useState({ x: 20, y: 60 });
  const dragRef = useRef<{ startX: number; startY: number; origX: number; origY: number } | null>(null);

  const mock = board instanceof MockGranboard ? board : null;
  if (!mock) return null;

  function hit(segId: number) {
    mock?.simulateHit(segId as SegmentID);
  }

  const handleMouseDown = (e: React.MouseEvent) => {
    dragRef.current = { startX: e.clientX, startY: e.clientY, origX: pos.x, origY: pos.y };
    const onMove = (ev: MouseEvent) => {
      if (!dragRef.current) return;
      setPos({
        x: dragRef.current.origX + (ev.clientX - dragRef.current.startX),
        y: dragRef.current.origY + (ev.clientY - dragRef.current.startY),
      });
    };
    const onUp = () => {
      dragRef.current = null;
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
    };
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    const t = e.touches[0];
    dragRef.current = { startX: t.clientX, startY: t.clientY, origX: pos.x, origY: pos.y };
  };
  const handleTouchMove = (e: React.TouchEvent) => {
    if (!dragRef.current) return;
    const t = e.touches[0];
    setPos({
      x: dragRef.current.origX + (t.clientX - dragRef.current.startX),
      y: dragRef.current.origY + (t.clientY - dragRef.current.startY),
    });
  };
  const handleTouchEnd = () => { dragRef.current = null; };

  return (
    <div
      className="fixed z-[200] bg-zinc-900/95 backdrop-blur-sm border border-zinc-700 rounded-xl shadow-2xl w-[320px] select-none"
      style={{ left: pos.x, top: pos.y }}
    >
      {/* Drag handle header */}
      <div
        className="flex items-center justify-between px-3 py-2 cursor-grab active:cursor-grabbing border-b border-zinc-800"
        onMouseDown={handleMouseDown}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        <span className="text-zinc-400 uppercase tracking-wider text-[10px] font-mono">
          ⠿ Mock Board
        </span>
        <div className="flex items-center gap-2">
          <button
            onClick={() => { disconnect(); onClose(); }}
            className="text-zinc-600 hover:text-red-400 text-[10px] uppercase tracking-wider font-mono"
          >
            Disconnect
          </button>
          <button
            onClick={onClose}
            className="text-zinc-600 hover:text-white text-base leading-none"
          >
            ×
          </button>
        </div>
      </div>

      <div className="p-3 font-mono text-xs">
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
          <button onClick={() => hit(SegmentID.BULL)} className="flex-1 py-1 rounded bg-red-900 hover:bg-red-700 text-red-300 font-black">BULL</button>
          <button onClick={() => hit(SegmentID.DBL_BULL)} className="flex-1 py-1 rounded bg-red-800 hover:bg-red-600 text-red-200 font-black">DBULL</button>
          <button onClick={() => hit(SegmentID.MISS)} className="flex-1 py-1 rounded bg-zinc-800 hover:bg-zinc-700 text-zinc-500 font-black">MISS</button>
        </div>

        {/* Next Turn + Log */}
        <div className="border-t border-zinc-800 pt-2 mt-1 flex gap-1">
          <button
            onClick={() => getActiveController()?.onNextTurn()}
            className="flex-1 py-1.5 rounded bg-[var(--color-game-accent)] text-[var(--color-game-accent-text)] font-black uppercase tracking-wider hover:brightness-110"
          >
            Next Turn
          </button>
          <button
            onClick={() => gameLogger.download()}
            className="flex-1 py-1 rounded bg-zinc-800 hover:bg-zinc-700 text-zinc-400 font-black text-[10px] uppercase tracking-wider"
          >
            Download Log
          </button>
        </div>
      </div>
    </div>
  );
}

/** Legacy default export — kept for HomeScreen usage */
export function DevBoard() {
  const { board, connectMock } = useGranboardStore();
  const [open, setOpen] = useState(false);
  const mock = board instanceof MockGranboard ? board : null;

  return (
    <>
      <button
        onClick={() => {
          if (!mock) { connectMock(); setOpen(true); }
          else setOpen((o) => !o);
        }}
        className="px-3 py-1.5 rounded-lg bg-zinc-800 border border-zinc-600 text-zinc-300 hover:bg-zinc-700 transition-colors font-mono text-xs select-none"
      >
        🎯 {mock ? (open ? "Hide Board" : "Show Board") : "Mock Board"}
      </button>
      {mock && !open && <span className="ml-2 text-[10px] text-emerald-500 font-mono">● mock</span>}
      {mock && open && <DevBoardPanel onClose={() => setOpen(false)} />}
    </>
  );
}
