# CLAUDE.md

## Project purpose
This app powers a GranBoard-based darts scoring system.

## Source of truth
When working on game logic, use the docs in `/docs/game-rules/` as the source of truth.
Do not invent rules from memory when a rule file exists.

## Expectations
- Keep scoring logic pure and testable.
- Add or update tests for every rule change.
- If a game rule is ambiguous, flag it in code comments or docs instead of guessing.
- Prefer shared rule utilities over per-game duplicated logic.

## Important paths
- Rules docs: `/docs/game-rules`

## Design
- The gameplay should somewhat resemble the design the Granboard App uses. This ![image](/public/granboard.png) is a good starting point.