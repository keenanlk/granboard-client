import { Group, Rect, Text, Line } from "react-konva";
import type { Match, Participant } from "@nlc-darts/tournament";
import { Status } from "@nlc-darts/tournament";
import type { MatchLayout } from "../../hooks/useBracketLayout.ts";

interface MatchCardProps {
  layout: MatchLayout;
  match: Match;
  participants: Participant[];
  currentUserName?: string | null;
  onTap?: (matchId: number) => void;
}

const COLORS = {
  bg: "#1e1e2e",
  bgLive: "#2a2520",
  bgComplete: "#1e2e1e",
  border: "#3a3a4a",
  borderLive: "#f59e0b",
  text: "#e2e2e2",
  textMuted: "#888",
  textWinner: "#4ade80",
  textCurrentUser: "#f59e0b",
  divider: "#3a3a4a",
  scoreBg: "#252535",
};

function getParticipantName(
  slot: Match["opponent1"],
  participants: Participant[],
): string {
  if (!slot) return "BYE";
  if (slot.id === null) return "TBD";
  const participant = participants.find((p) => p.id === slot.id);
  return participant?.name ?? "TBD";
}

export function MatchCard({
  layout,
  match,
  participants,
  currentUserName,
  onTap,
}: MatchCardProps) {
  const { x, y, width, height } = layout;
  const halfH = height / 2;
  const scoreColW = 44;
  const nameColW = width - scoreColW;

  const isBye = !match.opponent1 || !match.opponent2;
  const isByeWin =
    isBye &&
    (match.opponent1?.result === "win" || match.opponent2?.result === "win");
  const isLive = match.status === Status.Running;
  const isComplete =
    match.status === Status.Completed ||
    match.status === Status.Archived ||
    isByeWin;

  const p1Name = getParticipantName(match.opponent1, participants);
  const p2Name = getParticipantName(match.opponent2, participants);
  const p1Score = match.opponent1?.score;
  const p2Score = match.opponent2?.score;
  const p1Won = match.opponent1?.result === "win";
  const p2Won = match.opponent2?.result === "win";

  const p1IsMe = currentUserName != null && p1Name === currentUserName;
  const p2IsMe = currentUserName != null && p2Name === currentUserName;
  const hasMe = p1IsMe || p2IsMe;

  const bgColor = isLive
    ? COLORS.bgLive
    : isComplete
      ? COLORS.bgComplete
      : COLORS.bg;
  const borderColor = isLive
    ? COLORS.borderLive
    : hasMe && !isComplete
      ? "#f59e0b44"
      : COLORS.border;

  return (
    <Group
      x={x}
      y={y}
      onClick={() => onTap?.(match.id as number)}
      onTap={() => onTap?.(match.id as number)}
    >
      {/* Card background */}
      <Rect
        width={width}
        height={height}
        fill={bgColor}
        stroke={borderColor}
        strokeWidth={isLive ? 2 : 1}
        cornerRadius={6}
      />

      {/* Player 1 name */}
      <Text
        x={8}
        y={8}
        width={nameColW - 16}
        height={halfH - 8}
        text={p1Name}
        fontSize={14}
        fontFamily="system-ui, sans-serif"
        fill={
          p1Won
            ? COLORS.textWinner
            : p1IsMe
              ? COLORS.textCurrentUser
              : isComplete && !p1Won
                ? COLORS.textMuted
                : COLORS.text
        }
        fontStyle={p1Won || p1IsMe ? "bold" : "normal"}
        verticalAlign="middle"
        ellipsis
        wrap="none"
      />

      {/* Player 2 name */}
      <Text
        x={8}
        y={halfH + 4}
        width={nameColW - 16}
        height={halfH - 8}
        text={p2Name}
        fontSize={14}
        fontFamily="system-ui, sans-serif"
        fill={
          p2Won
            ? COLORS.textWinner
            : p2IsMe
              ? COLORS.textCurrentUser
              : isComplete && !p2Won
                ? COLORS.textMuted
                : COLORS.text
        }
        fontStyle={p2Won || p2IsMe ? "bold" : "normal"}
        verticalAlign="middle"
        ellipsis
        wrap="none"
      />

      {/* Score column background */}
      <Rect
        x={nameColW}
        y={0}
        width={scoreColW}
        height={height}
        fill={COLORS.scoreBg}
        cornerRadius={[0, 6, 6, 0]}
      />

      {/* Player 1 score */}
      <Text
        x={nameColW}
        y={8}
        width={scoreColW}
        height={halfH - 8}
        text={p1Score !== undefined ? String(p1Score) : "-"}
        fontSize={16}
        fontFamily="system-ui, sans-serif"
        fontStyle="bold"
        fill={p1Won ? COLORS.textWinner : COLORS.text}
        align="center"
        verticalAlign="middle"
      />

      {/* Player 2 score */}
      <Text
        x={nameColW}
        y={halfH + 4}
        width={scoreColW}
        height={halfH - 8}
        text={p2Score !== undefined ? String(p2Score) : "-"}
        fontSize={16}
        fontFamily="system-ui, sans-serif"
        fontStyle="bold"
        fill={p2Won ? COLORS.textWinner : COLORS.text}
        align="center"
        verticalAlign="middle"
      />

      {/* Horizontal divider */}
      <Line
        points={[0, halfH, width, halfH]}
        stroke={COLORS.divider}
        strokeWidth={1}
      />

      {/* Vertical score divider */}
      <Line
        points={[nameColW, 0, nameColW, height]}
        stroke={COLORS.divider}
        strokeWidth={1}
      />

      {/* LIVE badge */}
      {isLive && (
        <>
          <Rect
            x={width - 42}
            y={-10}
            width={36}
            height={18}
            fill="#f59e0b"
            cornerRadius={4}
          />
          <Text
            x={width - 42}
            y={-10}
            width={36}
            height={18}
            text="LIVE"
            fontSize={10}
            fontFamily="system-ui, sans-serif"
            fontStyle="bold"
            fill="#000"
            align="center"
            verticalAlign="middle"
          />
        </>
      )}
    </Group>
  );
}
