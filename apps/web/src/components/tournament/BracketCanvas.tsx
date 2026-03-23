import { Stage, Layer } from "react-konva";
import { TransformWrapper, TransformComponent } from "react-zoom-pan-pinch";
import type { Match, Participant, Round, Group } from "@nlc-darts/tournament";
import { useBracketLayout } from "../../hooks/useBracketLayout.ts";
import { MatchCard } from "./MatchCard.tsx";
import { ConnectorLine } from "./ConnectorLine.tsx";

interface BracketCanvasProps {
  matches: Match[];
  participants: Participant[];
  rounds: Round[];
  groups: Group[];
  currentUserName?: string | null;
  onMatchTap?: (matchId: number) => void;
}

export function BracketCanvas({
  matches,
  participants,
  rounds,
  groups,
  currentUserName,
  onMatchTap,
}: BracketCanvasProps) {
  const layout = useBracketLayout(matches, rounds, groups);

  if (layout.matches.length === 0) {
    return (
      <div className="flex items-center justify-center h-full text-neutral-400 text-lg">
        No bracket data yet
      </div>
    );
  }

  // Add padding around the bracket
  const padding = 40;
  const stageWidth = layout.totalWidth + padding * 2;
  const stageHeight = layout.totalHeight + padding * 2;

  return (
    <TransformWrapper
      initialScale={0.8}
      minScale={0.2}
      maxScale={4}
      wheel={{ step: 0.1 }}
      pinch={{ step: 5 }}
      centerOnInit
    >
      <TransformComponent
        wrapperStyle={{ width: "100%", height: "100%" }}
        contentStyle={{ width: stageWidth, height: stageHeight }}
      >
        <Stage width={stageWidth} height={stageHeight}>
          <Layer x={padding} y={padding}>
            {layout.connectors.map((c) => (
              <ConnectorLine key={c.id} connector={c} />
            ))}
            {layout.matches.map((ml) => {
              const match = matches.find(
                (m) => (m.id as number) === ml.matchId,
              );
              if (!match) return null;
              return (
                <MatchCard
                  key={ml.matchId}
                  layout={ml}
                  match={match}
                  participants={participants}
                  currentUserName={currentUserName}
                  onTap={onMatchTap}
                />
              );
            })}
          </Layer>
        </Stage>
      </TransformComponent>
    </TransformWrapper>
  );
}
