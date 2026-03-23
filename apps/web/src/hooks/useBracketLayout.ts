import { useMemo } from "react";
import type { Match, Round, Group } from "@nlc-darts/tournament";

export const MATCH_WIDTH = 200;
export const MATCH_HEIGHT = 88;
export const H_GAP = 80;
export const V_GAP = 24;

export interface MatchLayout {
  matchId: number;
  x: number;
  y: number;
  width: number;
  height: number;
  roundIndex: number;
}

export interface ConnectorLayout {
  id: string;
  fromX: number;
  fromY: number;
  toX: number;
  toY: number;
}

export interface BracketLayout {
  matches: MatchLayout[];
  connectors: ConnectorLayout[];
  totalWidth: number;
  totalHeight: number;
}

function calcSingleBracketLayout(
  bracketMatches: Match[],
  bracketRounds: Round[],
  yOffset: number,
): { matches: MatchLayout[]; connectors: ConnectorLayout[] } {
  const sortedRounds = [...bracketRounds].sort((a, b) => a.number - b.number);
  const totalRounds = sortedRounds.length;

  const matchLayouts: MatchLayout[] = [];
  const connectors: ConnectorLayout[] = [];

  // Build round → matches map
  const roundMatchMap = new Map<number | string, Match[]>();
  for (const m of bracketMatches) {
    const key = m.round_id;
    if (!roundMatchMap.has(key)) roundMatchMap.set(key, []);
    roundMatchMap.get(key)!.push(m);
  }

  for (let roundIdx = 0; roundIdx < totalRounds; roundIdx++) {
    const round = sortedRounds[roundIdx];
    const roundMatches = roundMatchMap.get(round.id) ?? [];
    roundMatches.sort((a, b) => a.number - b.number);

    const x = roundIdx * (MATCH_WIDTH + H_GAP);
    const slotHeight = (MATCH_HEIGHT + V_GAP) * Math.pow(2, roundIdx);

    for (let pos = 0; pos < roundMatches.length; pos++) {
      const y = yOffset + pos * slotHeight + (slotHeight - MATCH_HEIGHT) / 2;

      matchLayouts.push({
        matchId: roundMatches[pos].id as number,
        x,
        y,
        width: MATCH_WIDTH,
        height: MATCH_HEIGHT,
        roundIndex: roundIdx,
      });
    }
  }

  // Build connectors between rounds
  for (let roundIdx = 0; roundIdx < totalRounds - 1; roundIdx++) {
    const round = sortedRounds[roundIdx];
    const nextRound = sortedRounds[roundIdx + 1];
    const currentMatches = roundMatchMap.get(round.id) ?? [];
    const nextMatches = roundMatchMap.get(nextRound.id) ?? [];

    currentMatches.sort((a, b) => a.number - b.number);
    nextMatches.sort((a, b) => a.number - b.number);

    for (let i = 0; i < currentMatches.length; i += 2) {
      const nextMatchIdx = Math.floor(i / 2);
      if (nextMatchIdx >= nextMatches.length) break;

      const fromLayout1 = matchLayouts.find(
        (ml) => ml.matchId === (currentMatches[i].id as number),
      );
      const fromLayout2 =
        i + 1 < currentMatches.length
          ? matchLayouts.find(
              (ml) => ml.matchId === (currentMatches[i + 1].id as number),
            )
          : null;
      const toLayout = matchLayouts.find(
        (ml) => ml.matchId === (nextMatches[nextMatchIdx].id as number),
      );

      if (fromLayout1 && toLayout) {
        connectors.push({
          id: `c-${fromLayout1.matchId}-${toLayout.matchId}`,
          fromX: fromLayout1.x + MATCH_WIDTH,
          fromY: fromLayout1.y + MATCH_HEIGHT / 2,
          toX: toLayout.x,
          toY: toLayout.y + MATCH_HEIGHT / 2,
        });
      }
      if (fromLayout2 && toLayout) {
        connectors.push({
          id: `c-${fromLayout2.matchId}-${toLayout.matchId}`,
          fromX: fromLayout2.x + MATCH_WIDTH,
          fromY: fromLayout2.y + MATCH_HEIGHT / 2,
          toX: toLayout.x,
          toY: toLayout.y + MATCH_HEIGHT / 2,
        });
      }
    }
  }

  return { matches: matchLayouts, connectors };
}

export function useBracketLayout(
  matches: Match[],
  rounds: Round[],
  groups: Group[],
): BracketLayout {
  return useMemo(() => {
    if (matches.length === 0 || rounds.length === 0) {
      return { matches: [], connectors: [], totalWidth: 0, totalHeight: 0 };
    }

    const allMatchLayouts: MatchLayout[] = [];
    const allConnectors: ConnectorLayout[] = [];
    let yOffset = 0;

    // Sort groups by number — winner bracket first, then loser bracket, then finals
    const sortedGroups = [...groups].sort((a, b) => a.number - b.number);

    for (const group of sortedGroups) {
      const groupRounds = rounds.filter((r) => r.group_id === group.id);
      const groupMatches = matches.filter((m) => m.group_id === group.id);

      if (groupMatches.length === 0) continue;

      const { matches: ml, connectors: cl } = calcSingleBracketLayout(
        groupMatches,
        groupRounds,
        yOffset,
      );

      allMatchLayouts.push(...ml);
      allConnectors.push(...cl);

      // Calculate max Y for this group to offset the next one
      const maxY = Math.max(...ml.map((m) => m.y + m.height), yOffset);
      yOffset = maxY + V_GAP * 3; // extra gap between brackets
    }

    const totalWidth =
      allMatchLayouts.length > 0
        ? Math.max(...allMatchLayouts.map((m) => m.x + m.width)) + H_GAP
        : 0;
    const totalHeight =
      allMatchLayouts.length > 0
        ? Math.max(...allMatchLayouts.map((m) => m.y + m.height)) + V_GAP
        : 0;

    return {
      matches: allMatchLayouts,
      connectors: allConnectors,
      totalWidth,
      totalHeight,
    };
  }, [matches, rounds, groups]);
}
