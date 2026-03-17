export interface HistoryRowDart {
  value: number;
  shortName: string;
  state: "scored" | "miss" | "bust";
}

interface HistoryRowProps {
  roundNum: number;
  darts: HistoryRowDart[];
  totalDarts: number;
  readyToSwitch: boolean;
  isCurrent: boolean;
}

export function HistoryRow({
  roundNum,
  darts,
  totalDarts,
  readyToSwitch,
  isCurrent,
}: HistoryRowProps) {
  return (
    <div
      className={`grid items-center shrink-0 rounded px-0.5 py-0.5 transition-colors duration-200 ${
        isCurrent ? "bg-surface-raised" : ""
      }`}
      style={{ gridTemplateColumns: "1.75rem 1fr 1fr 1fr" }}
    >
      <span
        className={`text-[clamp(0.7rem,1.2vw,1.1rem)] font-bold tabular-nums text-center leading-none ${
          isCurrent ? "text-[var(--color-game-accent)]" : "text-content-faint"
        }`}
      >
        R{roundNum}
      </span>
      {[0, 1, 2].map((j) => {
        const d = darts[j];
        const isNextSlot = isCurrent && j === totalDarts && !readyToSwitch;
        const cellState = d ? d.state : isNextSlot ? "next" : "empty";
        return (
          <div key={j} className="history-dart-cell" data-state={cellState}>
            {d ? (
              (() => {
                const label =
                  d.shortName === "BULL"
                    ? "B"
                    : d.shortName === "DBULL"
                      ? "DB"
                      : d.shortName;
                const isSingle =
                  !label.startsWith("T") &&
                  !label.startsWith("D") &&
                  label !== "B";
                return isSingle ? (
                  <span
                    className={`text-[clamp(0.85rem,1.5vw,1.6rem)] font-black leading-none tabular-nums ${
                      d.state === "bust"
                        ? "text-state-bust"
                        : d.state === "scored"
                          ? "text-white"
                          : "text-zinc-600"
                    }`}
                  >
                    {d.value}
                  </span>
                ) : (
                  <span
                    className={`text-[clamp(0.85rem,1.5vw,1.6rem)] font-black leading-none tabular-nums ${
                      d.state === "bust"
                        ? "text-state-bust"
                        : d.state === "scored"
                          ? "text-[var(--color-game-accent)]"
                          : "text-zinc-600"
                    }`}
                  >
                    {label}
                  </span>
                );
              })()
            ) : isNextSlot ? (
              <span className="text-[var(--color-game-accent)] text-[clamp(0.6rem,1vw,1rem)] font-black opacity-50">
                {j + 1}
              </span>
            ) : (
              <span className="text-content-faint text-[clamp(0.6rem,1vw,1rem)]">
                ·
              </span>
            )}
          </div>
        );
      })}
    </div>
  );
}
