# High Score

## Objective

Score the **highest total points** by the end of the game.

---

## Basic rules

- Each player throws **3 darts per turn**
- Every dart scores based on the segment hit
- At the end of the game, the player with the **highest total score** wins

---

## Scoring

- Single = face value
- Double = face value × 2
- Triple = face value × 3
- Bull = 50

Examples:

    S20 = 20
    D20 = 40
    T20 = 60
    Bull = 50

---

## Game length

Choose a fixed number of rounds before the game starts.

Common options:

- 8 rounds
- 10 rounds
- 15 rounds

Each player gets one turn per round.

---

## Turn structure

On each turn:

- A player throws up to 3 darts
- The value of each dart is added to that player's total score
- After 3 darts, the turn ends

---

## Misses

- A missed dart scores **0**
- A dart that lands outside a scoring segment scores **0**

---

## Win condition

After all rounds are completed:

- The player with the **highest total score** wins

---

## Tie rule

If 2 or more players are tied for the highest score, choose one of these rules:

### Option 1: tie stands

- The game ends in a tie

### Option 2: one-dart playoff

- Tied players each throw 1 dart
- Highest scoring dart wins
- Repeat if still tied

Your app should make this configurable.

---

## Example game

Assume a 3-round game.

### Player A

Round 1:

    T20, T20, T20
    = 60 + 60 + 60
    = 180

Round 2:

    S20, D20, Bull
    = 20 + 40 + 50
    = 110

Round 3:

    S1, S5, T19
    = 1 + 5 + 57
    = 63

Final score:

    180 + 110 + 63 = 353

---

## Simplified data model

Per player track:

    score = number

Game track:

    currentRound = number
    totalRounds = number
    currentPlayer = number
    dartsThrownThisTurn = 0..3
    winnerId = string | null

---

## Per-dart logic

1. Determine the value of the hit.
2. Add that value to the player's score.
3. Increment darts thrown for the turn.
4. After 3 darts, move to the next player.
5. After all players finish the final round, determine the winner.

---

## Suggested prototype settings

For a simple first version:

- Bull always = 50
- No bust rule
- No penalties
- Fixed round count
- Highest total score wins
- Optional tie = shared win

---

## Notes

This game does **not** use:

- closing numbers
- bust logic
- double-out
- checkout rules

It is purely based on **total points scored**.
