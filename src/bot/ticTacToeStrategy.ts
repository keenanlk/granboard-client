import { SegmentID } from "../board/Dartboard.ts";

/**
 * Tic Tac Toe bot targeting strategy using minimax.
 *
 * Evaluates every unclaimed cell by running minimax on the board position
 * that would result from claiming it. Ties are broken by preferring the
 * cell where the opponent has the most marks (harder for them to lose
 * that progress).
 *
 * Returns a SegmentID — always the triple of the target number (for max
 * marks), or DBL_BULL for the bull center square.
 */

const WIN_LINES: readonly [number, number, number][] = [
  [0, 1, 2],
  [3, 4, 5],
  [6, 7, 8],
  [0, 3, 6],
  [1, 4, 7],
  [2, 5, 8],
  [0, 4, 8],
  [2, 4, 6],
];

function numberToTripleSegmentId(num: number): SegmentID {
  if (num === 25) return SegmentID.DBL_BULL;
  return ((num - 1) * 4 + 1) as SegmentID;
}

function checkWinner(board: (0 | 1 | null)[]): 0 | 1 | null {
  for (const [a, b, c] of WIN_LINES) {
    if (board[a] !== null && board[a] === board[b] && board[b] === board[c]) {
      return board[a];
    }
  }
  return null;
}

function isCatsGame(board: (0 | 1 | null)[]): boolean {
  for (const [a, b, c] of WIN_LINES) {
    const cells = [board[a], board[b], board[c]];
    if (!cells.includes(1)) return false;
    if (!cells.includes(0)) return false;
  }
  return true;
}

/**
 * Minimax with alpha-beta pruning.
 * Returns a score from the perspective of `maximizingPlayer`:
 *   +10 = maximizingPlayer wins
 *   -10 = opponent wins
 *     0 = draw / cats game
 * Depth is subtracted so the bot prefers faster wins.
 */
function minimax(
  board: (0 | 1 | null)[],
  depth: number,
  isMaximizing: boolean,
  maximizingPlayer: 0 | 1,
  alpha: number,
  beta: number,
): number {
  const winner = checkWinner(board);
  if (winner === maximizingPlayer) return 10 - depth;
  if (winner !== null) return depth - 10;
  if (isCatsGame(board) || board.every((c) => c !== null)) return 0;

  const currentPlayer: 0 | 1 = isMaximizing
    ? maximizingPlayer
    : maximizingPlayer === 0
      ? 1
      : 0;

  if (isMaximizing) {
    let best = -Infinity;
    for (let i = 0; i < 9; i++) {
      if (board[i] !== null) continue;
      board[i] = currentPlayer;
      const score = minimax(
        board,
        depth + 1,
        false,
        maximizingPlayer,
        alpha,
        beta,
      );
      board[i] = null;
      best = Math.max(best, score);
      alpha = Math.max(alpha, score);
      if (beta <= alpha) break;
    }
    return best;
  } else {
    let best = Infinity;
    for (let i = 0; i < 9; i++) {
      if (board[i] !== null) continue;
      board[i] = currentPlayer;
      const score = minimax(
        board,
        depth + 1,
        true,
        maximizingPlayer,
        alpha,
        beta,
      );
      board[i] = null;
      best = Math.min(best, score);
      beta = Math.min(beta, score);
      if (beta <= alpha) break;
    }
    return best;
  }
}

export function ticTacToePickTarget(
  grid: number[],
  owner: (0 | 1 | null)[],
  myIndex: number,
  _myMarks: number[],
  opponentMarks?: number[],
): SegmentID {
  const me = myIndex as 0 | 1;
  const board = [...owner]; // mutable copy for minimax

  // Position values: center > corners > edges (standard TTT strategy)
  const positionValue = [3, 1, 3, 1, 5, 1, 3, 1, 3];

  let bestScore = -Infinity;
  let bestTiebreaker = -Infinity;
  let bestCell = -1;

  for (let i = 0; i < 9; i++) {
    if (board[i] !== null) continue;

    // Simulate claiming this cell
    board[i] = me;
    const score = minimax(board, 0, false, me, -Infinity, Infinity);
    board[i] = null;

    // Count open winning lines this cell participates in
    let openLines = 0;
    for (const line of WIN_LINES) {
      if (!line.includes(i)) continue;
      const blocked = line.some((c) => board[c] !== null && board[c] !== me);
      if (!blocked) openLines++;
    }

    const oppM = opponentMarks?.[i] ?? 0;
    const tiebreaker = oppM * 100 + positionValue[i] * 10 + openLines;

    if (
      score > bestScore ||
      (score === bestScore && tiebreaker > bestTiebreaker)
    ) {
      bestScore = score;
      bestTiebreaker = tiebreaker;
      bestCell = i;
    }
  }

  // Fallback (shouldn't happen — there's always an unclaimed cell if game isn't over)
  if (bestCell === -1) {
    bestCell = owner.findIndex((c) => c === null);
    if (bestCell === -1) bestCell = 0;
  }

  return numberToTripleSegmentId(grid[bestCell]);
}
