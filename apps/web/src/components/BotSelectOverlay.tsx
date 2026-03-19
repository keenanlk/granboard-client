import { getAllCharacters } from "@nlc-darts/engine";
import type { BotSkill } from "@nlc-darts/engine";

const ALL_CHARACTERS = getAllCharacters();

interface BotSelectOverlayProps {
  /** Currently selected skill — highlights that card (null when adding new) */
  currentSkill?: BotSkill | null;
  onSelect: (skill: BotSkill) => void;
  onCancel: () => void;
}

export function BotSelectOverlay({
  currentSkill,
  onSelect,
  onCancel,
}: BotSelectOverlayProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm">
      <div className="flex flex-col items-center gap-6 w-full max-w-3xl px-6">
        <h2 className="text-xl font-black uppercase tracking-widest text-content-secondary">
          Choose Your Bot
        </h2>

        <div className="grid grid-cols-4 gap-3 w-full">
          {ALL_CHARACTERS.map(({ skill, character }) => {
            const isActive = currentSkill === skill;
            return (
              <button
                key={skill}
                onClick={() => onSelect(skill)}
                className={`relative flex flex-col items-center justify-center gap-2 rounded-2xl border-2 py-5 px-3 transition-all duration-200 ${character.animationClass} ${
                  isActive ? "scale-105" : "hover:scale-[1.03]"
                }`}
                style={{
                  borderColor: isActive
                    ? character.color
                    : `color-mix(in oklch, ${character.color} 40%, transparent)`,
                  backgroundColor: character.dim,
                  boxShadow: isActive
                    ? `0 0 24px ${character.glow}, inset 0 0 20px ${character.dim}`
                    : `0 0 8px ${character.glow}`,
                }}
              >
                {/* Character name — big neon text */}
                <span
                  className="text-lg font-black uppercase tracking-widest"
                  style={{
                    fontFamily: "Beon, sans-serif",
                    color: character.color,
                    textShadow: `0 0 12px ${character.glow}`,
                  }}
                >
                  {character.name}
                </span>

                {/* PPD estimate */}
                <span className="text-xs font-bold text-content-muted tabular-nums">
                  {character.ppd} ppd
                </span>

                {/* Active indicator */}
                {isActive && (
                  <span
                    className="absolute top-2 right-2 w-2.5 h-2.5 rounded-full"
                    style={{
                      backgroundColor: character.color,
                      boxShadow: `0 0 8px ${character.glow}`,
                    }}
                  />
                )}
              </button>
            );
          })}
        </div>

        <button
          onClick={onCancel}
          className="btn-ghost text-sm font-bold py-2 px-6"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}
