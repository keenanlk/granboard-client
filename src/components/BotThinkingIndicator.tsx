import type { BotSkill } from "../bot/Bot.ts";
import { getBotCharacter } from "../bot/botCharacters.ts";

interface BotThinkingIndicatorProps {
  skill: BotSkill;
}

export function BotThinkingIndicator({ skill }: BotThinkingIndicatorProps) {
  const ch = getBotCharacter(skill);
  return (
    <div className="shrink-0 p-2" style={{ height: "clamp(4rem, 8vh, 6rem)" }}>
      <div
        className={`w-full h-full rounded-xl bg-surface-raised border-2 flex flex-col items-center justify-center gap-1 ${ch.animationClass}`}
        style={{ borderColor: ch.color, boxShadow: `0 0 12px ${ch.glow}` }}
      >
        <span className="text-[10px] uppercase tracking-widest font-black" style={{ fontFamily: "Beon, sans-serif", color: ch.color }}>{ch.name}</span>
        <span className="text-base animate-pulse" style={{ color: ch.color }}>···</span>
      </div>
    </div>
  );
}
