# battleship++

CPSC 3750 — Battleship V2+  
Author: Jennifer Johnson

---

## Overview

**battleship++** is a browser-based implementation of the classic Battleship game built using JavaScript, PHP, and Apache (XAMPP).  
This version extends the baseline assignment with multiple architectural and behavioral iterations focused on **state management**, **turn-based logic**, and **persistent storage**.

The project was developed using intentional “vibe coding,” where AI-assisted generation was used selectively while core architectural decisions were made explicitly by the developer.

---

## Major Iterations

### Iteration 1 — Turn-Based Gameplay with Computer Response

**What changed**
- The game is fully turn-based.
- After the player fires a shot, the computer automatically fires back.
- Turns alternate strictly between `player` and `ai`.

**Why this matters**
- Introduces real game flow instead of single-sided interaction.
- Requires tracking turn ownership and enforcing turn order.
- Prevents invalid actions (e.g., firing twice in a row).

**Technical highlights**
- `turn` and `phase` fields stored in game state
- AI move selection separated into its own module
- UI disabled during AI turn to prevent race conditions

---

### Iteration 2 — Persistent Game State (JSON Storage)

**What changed**
- The entire game state (boards, ships, hits, shots, moves, turn, phase) is saved to disk as JSON.
- A saved game can be reloaded and resumed exactly where it left off.
- Game state survives browser refreshes and Apache server restarts.

**Why this matters**
- Introduces true persistence beyond in-memory state.
- Demonstrates explicit serialization and revival of complex state.
- Requires careful handling of non-JSON-native structures (e.g., `Set`).

**Technical highlights**
- Client serializes game state before saving
- PHP API endpoints:
  - `api/save.php` — writes JSON to disk
  - `api/load.php` — loads JSON from disk
- Shot history stored as arrays and revived into `Set` objects on load
- Verified via direct inspection of `/api/load.php` output

---

## Known Limitations

- Ship placement is randomized (no manual placement UI).
- The server does not enforce game rules (client-controlled logic).
- AI behavior is random (no hunt/target strategy).
- Single save slot (overwrites previous save).

---

## AI Usage Reflection

AI was used as a **tool**, not a decision-maker.

- Used for:
  - Debugging serialization issues
  - Identifying architectural boundaries
  - Suggesting modular structure
- Rejected when:
  - Suggestions violated assignment constraints
  - Logic reduced clarity or control
- Final architectural decisions were made manually.

A short AI prompt log is included with the submission.

---

## How to Run Locally

1. Install **XAMPP**
2. Place project folder in: htdocs/battleship++/
3. Start Apache
4. Navigate to: http://localhost/battleship++/battleship++/

---

## Demonstration

A 1–2 minute Loom video accompanies this submission showing:
- Gameplay
- Turn-based logic
- Save and load persistence
- Architecture explanation

---

## Summary

This project demonstrates:
- Explicit state management
- Clear client/server separation
- Persistent storage using JSON
- Intentional AI-assisted development

The focus was not on visual polish, but on **architecture, correctness, and control**.
