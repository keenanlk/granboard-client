# Tic Tac Toe

## Objective

Claim three squares in a row on a 3×3 grid by marking dart numbers. The center square is always the bullseye; the other eight squares are randomly selected from 1–20 (no repeats).

---

## Grid Layout

```
 [A] [B] [C]
 [D] [Bull] [E]
 [F] [G] [H]
```

- Center square = Bullseye (25)
- Eight surrounding squares = random unique numbers from 1–20
- Grid positions are fixed for the entire game
- Player 1 is "X", Player 2 is "O"

---

## Claiming a Square

A player claims a square by accumulating **4 marks** on that square's number.

| Hit        | Marks |
| ---------- | ----- |
| Single     | 1     |
| Double     | 2     |
| Triple     | 3     |
| Outer Bull | 1     |
| Inner Bull | 2     |

- Once a player reaches 4 marks on a number, they **claim** that square.
- Extra marks beyond 4 are **ignored** (no overflow or bonus).
- Once a square is claimed by one player, it is **locked** — the other player cannot claim it.
- Darts thrown at a locked square or a non-grid number have no effect.

---

## Turn Structure

- Each player throws **3 darts per turn**
- Marks are applied after each dart
- Players alternate turns starting with Player 1 (X)

---

## Win Condition

A player wins by claiming **three squares in a row** — horizontal, vertical, or diagonal:

```
Win lines:
  Row 1: [0][1][2]
  Row 2: [3][4][5]
  Row 3: [6][7][8]
  Col 1: [0][3][6]
  Col 2: [1][4][7]
  Col 3: [2][5][8]
  Diag:  [0][4][8]
  Anti:  [2][4][6]
```

Win is checked after every dart. The game ends immediately when a player completes a line.

---

## Cat's Game (Draw)

A "Cat's game" occurs when it is **impossible** for either player to get three in a row. This is detected mid-game — the game ends as soon as no winning line remains open for either player.

A line is "blocked" for a player if the opponent has claimed at least one square in that line. If every line is blocked for both players, the game ends with no winner.

---

## Round Limit

Configurable round limit options: **15, 20, 25, or unlimited (0)**.

If the round limit is reached and no player has three in a row:

- The game ends with no winner (Cat's game).

---

## Example Game

Grid (randomly assigned):

```
 [17] [ 5] [12]
 [ 3] [Bull] [19]
 [ 8] [14] [ 1]
```

**Round 1 — Player X:**

- T17 → 3 marks on 17
- S17 → 4 marks on 17 → **X claims square 0**
- S5 → 1 mark on 5

**Round 1 — Player O:**

- T5 → 3 marks on 5
- S5 → Player X already has 1 mark; O gets 3 marks on 5 (wait — this is TTT, separate marks per player)

Note: Each player has their **own** mark count per square. A square is claimed by the first player to reach 4 marks on it.

**Round 1 — Player O:**

- DBULL → 2 marks on Bull
- DBULL → 4 marks on Bull → **O claims center (square 4)**
- S17 → 17 is locked by X, no effect

**Round 2 — Player X:**

- T12 → 3 marks on 12
- S12 → 4 marks on 12 → **X claims square 2**
- S8 → 1 mark on 8

X now has squares 0 and 2 (top-left, top-right). Needs square 1 (number 5) for top row.

---

## Simplified Data Model

Per player:

```
marks = {
  [number]: 0–4  // for each of the 9 grid numbers
}
claimed = Set<gridIndex>  // which grid positions this player owns
```

Grid:

```
grid = [number, number, number, number, 25, number, number, number, number]
owner = [null | 0 | 1, ...]  // 9 entries, null = unclaimed
```

Game state:

```
currentPlayerIndex: 0 | 1
currentRound: number
currentRoundDarts: ThrownDart[]
winner: string | null   // null = ongoing or cat's game
isCatsGame: boolean
```

---

## Per-Dart Logic

1. Identify the dart's target number (section) and marks earned (single=1, double=2, triple=3; bull=1, double bull=2).
2. Find the grid square for that number (if any). If no grid square matches, the dart is a miss.
3. Check if the square is already claimed (locked). If locked, the dart has no effect.
4. Add marks to the current player's count for that square, capping at 4.
5. If marks reached 4, claim the square for the current player.
6. Check win condition (three in a row).
7. If no win, check for Cat's game (all lines blocked for both players).
