import { SegmentID } from "../board/Dartboard.ts";
import type { BotSkill } from "../bot/Bot.ts";

// Reverse lookup: SegmentID number → name string (e.g. 77 → "TRP_20")
const SEGMENT_NAMES: Record<number, string> = Object.fromEntries(
  Object.entries(SegmentID).map(([name, id]) => [id, name]),
);

function segName(id: number): string {
  return SEGMENT_NAMES[id] ?? String(id);
}

interface GameStartEntry {
  ts: string;
  event: "game_start";
  game: string;
  players: string[];
  bots: Record<number, { sigma: number }>;
  options: unknown;
}

interface DartEntry {
  ts: string;
  event: "dart";
  game: string;
  player: string;
  botTarget?: string;
  actual: string;
  context: Record<string, unknown>;
}

interface TurnEndEntry {
  ts: string;
  event: "turn_end";
  game: string;
  player: string;
  dartsThrown: number;
  roundScore: number;
  busted?: boolean;
}

interface GameEndEntry {
  ts: string;
  event: "game_end";
  game: string;
  winners: string[];
  finalScores: Record<string, number>;
}

type LogEntry = GameStartEntry | DartEntry | TurnEndEntry | GameEndEntry;

class GameLogger {
  private lines: string[] = [];
  private game: string = "";

  start(
    gameType: string,
    playerNames: string[],
    botSkills: (BotSkill | null)[],
    options: unknown,
  ) {
    this.lines = [];
    this.game = gameType;

    const bots: Record<number, { sigma: number }> = {};
    botSkills.forEach((skill, i) => {
      if (skill !== null) bots[i] = { sigma: skill };
    });

    this.append({
      ts: new Date().toISOString(),
      event: "game_start",
      game: gameType,
      players: playerNames,
      bots,
      options,
    });
  }

  logDart(
    playerName: string,
    targetId: number | undefined,
    actualId: number,
    context: Record<string, unknown>,
  ) {
    const entry: DartEntry = {
      ts: new Date().toISOString(),
      event: "dart",
      game: this.game,
      player: playerName,
      actual: segName(actualId),
      context,
    };
    if (targetId !== undefined) {
      entry.botTarget = segName(targetId);
    }
    this.append(entry);
  }

  logTurnEnd(
    playerName: string,
    dartsThrown: number,
    roundScore: number,
    busted?: boolean,
  ) {
    const entry: TurnEndEntry = {
      ts: new Date().toISOString(),
      event: "turn_end",
      game: this.game,
      player: playerName,
      dartsThrown,
      roundScore,
    };
    if (busted) entry.busted = true;
    this.append(entry);
  }

  logGameEnd(winners: string[], finalScores: Record<string, number>) {
    this.append({
      ts: new Date().toISOString(),
      event: "game_end",
      game: this.game,
      winners,
      finalScores,
    });
  }

  async download() {
    if (this.lines.length === 0) return;
    const content = this.lines.join("\n") + "\n";
    const date = new Date().toISOString().slice(0, 10);
    const filename = `game-log-${date}.jsonl`;

    // Use File System Access API when available — lets you navigate to a folder
    // (e.g. .claude/logs/) and save directly there without a browser download.
    if ("showSaveFilePicker" in window) {
      try {
        const handle = await (
          window as Window & {
            showSaveFilePicker: (
              opts: unknown,
            ) => Promise<FileSystemFileHandle>;
          }
        ).showSaveFilePicker({
          suggestedName: filename,
          types: [
            {
              description: "JSON Lines",
              accept: { "application/jsonl": [".jsonl"] },
            },
          ],
        });
        const writable = await handle.createWritable();
        await writable.write(content);
        await writable.close();
        return;
      } catch {
        // User cancelled or permission denied — fall through to blob download
      }
    }

    // Fallback: standard browser download
    const blob = new Blob([content], { type: "application/jsonl" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  }

  private append(entry: LogEntry) {
    const line = JSON.stringify(entry);
    this.lines.push(line);
    try {
      localStorage.setItem("nlc-darts-gamelog", this.lines.join("\n"));
    } catch {
      // quota exceeded — ignore
    }
  }
}

export const gameLogger = new GameLogger();
