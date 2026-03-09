# Cricket

## Objective
Score the most points while closing the numbers **20, 19, 18, 17, 16, 15, and bull**.

To win a player must:
1. Close all numbers
2. Have equal or more points than every opponent

---

## Valid targets

Only these targets count:

- 20
- 19
- 18
- 17
- 16
- 15
- Bull

Hits on other numbers score **0 marks and 0 points**.

---

## Marks

Each target requires **3 marks** to close.

Marks are earned by hitting:

| Hit | Marks |
|----|----|
| Single | 1 |
| Double | 2 |
| Triple | 3 |
| Bull | 1 or 2 depending on settings |

Examples:

    S20 → 1 mark on 20
    D19 → 2 marks on 19
    T18 → 3 marks on 18

---

## Closing a number

When a player reaches **3 marks** on a number, that number is **closed for that player**.

Example:

    Player hits T20
    → 3 marks
    → 20 is closed

Extra marks beyond 3 may score points.

---

## Scoring points

After a player closes a number:

- Additional marks on that number score **points equal to the number value**
- Points are only scored if **at least one opponent has not closed that number**

Example:

    Player A has closed 20
    Player B has 2 marks on 20

    Player A hits T20
    → 3 extra marks
    → 60 points scored

---

## No scoring condition

If **all opponents have closed a number**, additional hits on that number score **0 points**.

---

## Bull rules (soft-tip)

Typical configuration:

| Hit | Marks |
|----|----|
| Outer Bull | 1 |
| Inner Bull | 2 |

Some leagues use **single bull**, where both bulls count as **1 mark**.

---

## Turn structure

- Each player throws **3 darts per turn**
- Marks and points are applied after each dart

---

## Win condition

A player wins when:

1. All numbers (20–15 and bull) are closed
2. The player has **equal or more points than every opponent**

---

## Important edge cases

### Closing early but trailing in points

If a player closes all numbers but **has fewer points than an opponent**, the game continues until they catch up.

### Number closed by all players

If all players close a number:

- That number can no longer score points.

---

## Example turn

Start:

    Player A: no marks
    Player B: no marks

Player A throws:

    T20
    → closes 20

Player B throws:

    S20
    → 1 mark

Player A throws:

    T20 again

Result:

    20 already closed for A
    B not closed

    Player A scores 60 points

---

## Simplified data model

Per player track:

    marks = {
      20: 0-3,
      19: 0-3,
      18: 0-3,
      17: 0-3,
      16: 0-3,
      15: 0-3,
      bull: 0-3
    }

    score = number

---

## Per-dart logic

1. Determine the number hit and marks earned.
2. Add marks up to a maximum of 3.
3. Any marks beyond 3 become points if opponents have not closed the number.
4. Update player score if points were earned.
5. Check win condition after the turn.