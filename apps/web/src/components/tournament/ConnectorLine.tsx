import { Line } from "react-konva";
import type { ConnectorLayout } from "../../hooks/useBracketLayout.ts";

interface ConnectorLineProps {
  connector: ConnectorLayout;
}

/**
 * H-tree style connector: horizontal arm from source match midpoint,
 * vertical segment, then horizontal arm into target match.
 */
export function ConnectorLine({ connector }: ConnectorLineProps) {
  const { fromX, fromY, toX, toY } = connector;
  const midX = fromX + (toX - fromX) / 2;

  return (
    <Line
      points={[fromX, fromY, midX, fromY, midX, toY, toX, toY]}
      stroke="#4a4a5a"
      strokeWidth={1.5}
      lineCap="round"
      lineJoin="round"
    />
  );
}
