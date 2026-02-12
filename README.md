### Iteration 3 — Undo Last Turn (History-Based Rebuild)

**What changed**
- Added an **Undo** feature that reverses the most recent full turn (player + computer).
- Undo works during active games to recover from misclicks or bad guesses.
- Undo is blocked while the computer is “thinking” to avoid race conditions.

**Why this matters**
- Introduces real state reasoning beyond simple UI changes.
- Requires safely reversing game progression without corrupting state.
- Demonstrates a clean separation between **source-of-truth** state and **derived** state.

**Technical highlights**
- Implemented `undoLastTurn(state)` in the core engine.
- Undo is **history-driven**:
  - `moves[]` is treated as the **source of truth**
  - derived fields (shots Sets, ship hits, moveNumber, turn/phase, over/winner) are rebuilt by replaying move history
- Avoids fragile “reverse mutation” logic by reconstructing a fresh state from ship placement + remaining moves
- UI integration:
  - Added an **Undo** button (`#btn-undo`)
  - After undo, the move log is rebuilt from `state.moves` to stay consistent with the restored game state
