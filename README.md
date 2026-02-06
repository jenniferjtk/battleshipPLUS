# battleship++

CPSC 3750 — Battleship V2+ (Vibe Coding Iterations)

A turn-based Battleship game that runs locally on XAMPP (Apache). The player fires on the enemy grid, the computer fires back, and the game supports saving/loading state via a simple PHP + JSON API.

---

## How to Run (Local)

### Requirements
- XAMPP (Apache)
- A browser

### Setup
1. Place this project folder in:
   `/Applications/XAMPP/xamppfiles/htdocs/`

2. Start **Apache Web Server** in XAMPP.

3. Open in your browser (match your folder path):
- `http://localhost/battleship++/battleship++/public/`

---

## Major Iterations (Beyond Baseline)

### Iteration 1 — Turn-Based Computer Opponent (Computer Fires Back)
**What changed:**  
After the player fires a shot, the computer automatically takes a turn (with a short delay so it feels turn-based).

**Why it counts:**  
This changes game behavior and introduces turn enforcement + alternating moves (not just UI).

**Where to see it in code:**
- `public/assets/js/ui/events.js`
  - player click → `fireShot(...)`
  - then `runAiTurn()` triggers the computer shot

**Behavior:**
- Prevents firing out of turn
- Logs both player and AI moves in the move log

---

### Iteration 2 — Persistent Storage (Server-Side JSON Save/Load)
**What changed:**  
The game state can be saved and loaded through a server API (`save.php` / `load.php`). The game state persists even if Apache is restarted.

**Why it counts:**  
This changes architecture and state management by introducing a server boundary and persistence. It is not cosmetic.

**Server files:**
- `api/save.php` — writes game state JSON to disk
- `api/load.php` — loads saved JSON state
- (data file written to `data/current_game.json`)

**Client files:**
- `public/assets/js/ui/events.js`
  - `fetch(`${API_BASE}/save.php`, ...)`
  - `fetch(`${API_BASE}/load.php`, ...)`
  - includes Set → Array serialization for `board.shots` so shots persist correctly

---

## Proof of Persistence (What to Demo / Screenshot)
To demonstrate that state survives a server restart:

1. Play a few turns so you have shots + a move log.
2. Click **Save** → confirm “saved ✅”.
3. Stop **Apache** in XAMPP.
4. Start **Apache** again.
5. Refresh the page.
6. Click **Load** → confirm the same game state returns (shots + moves).

Optional strong proof:
- Visit `http://localhost/battleship++/battleship++/api/load.php` and show JSON includes `boards.player.shots` / `boards.ai.shots`.

---

## Architecture Snapshot

### Responsibilities
**Client (JavaScript)**
- Renders UI boards + coordinate labels
- Handles user input (clicks, buttons)
- Runs game logic (turn-based loop + shot resolution)
- Calls server API for save/load

**Server (PHP)**
- Persistence only (save/load JSON)
- No gameplay logic enforced on server (by design for this version)

### Where game state lives
- Primary in-memory state: client JS (state object)
- Persisted state: server JSON file (`data/current_game.json`)

### State transitions (client-side)
- `SETUP` → player can reroll ships or fire first shot  
- `PLAYER_TURN` → player fires  
- `COMPUTER_TURN` → AI fires  
- `GAME_OVER` → winner set, further moves blocked

---

## Known Limitations / Notes
- Ships are randomized (no manual placement UI).
- AI is random-shot selection (not hunt/target).
- Server does not validate turns or moves (server is persistence only).
- “Fog of war”: enemy ships are hidden; only hits/misses show.

---

## Repo / Submission Notes
- Runs locally under XAMPP.
- Includes at least two major iterations:
  1) Turn-based AI opponent  
  2) Server-side persistent storage (JSON save/load)
