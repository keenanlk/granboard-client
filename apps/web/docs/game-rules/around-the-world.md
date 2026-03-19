# Around the World

## Objective

Be the first player to hit every number from **1 through 20**, then finish on **Bull**.

---

## Sequence

Players must hit targets in this fixed order:

    1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, Bull

That is **21 targets** total. A player's "current target" starts at 1.

---

## Basic rules

- Each player throws **3 darts per turn**
- Only hits on the player's **current target** count
- Hitting any other number is a miss (no advancement)

---

## Advancement

When a dart lands on the current target:

- **Single** = advance **1** position
- **Double** = advance **2** positions
- **Triple** = advance **3** positions

Advancement is **capped at Bull** (index 20). A player can never skip past Bull.

Examples (current target is 18):

    S18 → advance 1 → now on 19
    D18 → advance 2 → now on 20
    T18 → advance 3 → now on Bull (capped, not past)

---

## Bull target

- Bull is the **final target** (index 20 in the sequence)
- Both outer bull and inner bull count as hitting Bull
- Outer bull = advance 1 (single)
- Inner bull = advance 2 (double) — but since Bull is the last target, this still just finishes
- A player must actually **hit Bull** to finish — landing on index 20 from advancement is not enough, the player must then hit Bull on a subsequent dart

Wait — clarification: if a player advances TO Bull (index 20), their current target becomes Bull (25). They have finished advancing through 1-20 but still need to hit Bull. If the dart that advanced them was the dart that also set their target to Bull's index, they are now ON Bull but haven't hit it yet (unless the advancement came from hitting 20 and the triple pushed them to Bull — in that case they land on Bull as their target and must hit it next).

Actually, simpler rule: When a player's target index reaches 20 (the Bull position in the sequence), their current target is 25 (Bull). They must hit Bull (outer or inner) to finish. Hitting Bull finishes the player immediately.

---

## Finishing

A player **finishes** when they hit Bull while Bull is their current target.

- The dart that hits Bull can be any of the 3 darts in a turn
- Once finished, the player throws no more darts

---

## Equal turns

All players must complete the **same number of rounds**. When the first player finishes:

- The remaining players in that round still get to throw
- After the round completes, any player who has also finished is a co-winner

---

## Win condition

After the round in which the first player finishes:

- If exactly **one player** finished → that player wins
- If **multiple players** finished in the same round → tie (shared win)

---

## Round limit

An optional round limit can be set. If no player has finished when the limit is reached:

- The player **furthest along** in the sequence wins
- If tied on position, it's a shared win

---

## Turn structure

On each turn:

1. Throw up to 3 darts
2. For each dart: if it hits the current target, advance by the multiplier (1/2/3)
3. If the player hits Bull while on Bull, they are finished
4. After 3 darts (or finishing), the turn ends

---

## Misses

- A dart that hits any number **other than** the current target scores nothing
- A dart that misses the board entirely scores nothing

---

## Example game

2-player game, no round limit.

### Player A

Round 1:

    Current: 1
    S1 → advance to 2
    S5 → miss (need 2)
    D2 → advance 2 → now on 4
    End of turn: on 4

Round 2:

    Current: 4
    S4 → advance to 5
    T5 → advance 3 → now on 8
    S8 → advance to 9
    End of turn: on 9

### Player B

Round 1:

    Current: 1
    T1 → advance 3 → now on 4
    S4 → advance to 5
    S5 → advance to 6
    End of turn: on 6

(Game continues until someone hits Bull...)

---

## Simplified data model

Per player track:

    targetIndex = 0..20 (index in sequence), 21 = finished
    currentTarget = sequence[targetIndex] (1-20 or 25)
    finished = boolean
    finishedInRound = number | null

Game track:

    currentRound = number
    currentPlayer = number
    dartsThrownThisTurn = 0..3
    winners = string[] | null
    firstFinishRound = number | null

---

## Per-dart logic

1. Check if the dart's section matches the player's current target.
2. If yes: advance targetIndex by the multiplier (1 for single, 2 for double, 3 for triple), capped at 20.
3. If the new target is Bull (index 20) AND the dart that caused advancement was a hit on Bull → player is finished.
4. If targetIndex reaches 20, currentTarget becomes 25 (Bull).
5. If targetIndex is 20 and the player hits Bull → finished = true.
6. Increment darts thrown.
7. After 3 darts or player finishes, end the turn.

---

## Notes

This game does **not** use:

- Point scoring
- Closing numbers
- Bust logic
- Double-out

It is purely based on **sequential target progression**.
