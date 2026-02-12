import { setStatus, logMove, renderState } from "./render.js";
import {
  newGame,
  rerollPlayerFleet,
  fireShot,
  undoLastTurn,
} from "../game/engine.js";
import { pickRandomShot } from "../game/ai.js";


// IMPORTANT:
// - Use an absolute path so fetch works no matter what folder you serve from.
// - This must match your Apache URL (you've been using /battleship++/battleship++/public/).
const API_BASE = "/battleship++/battleship++/api";

let state = null;
let aiThinking = false;

export function bindEvents() {
  // fresh boot
  state = reviveState(newGame());
  aiThinking = false;

  rebuildMoveLogFromState();
  renderState(state);
  setStatus("setup — reroll ships or fire to begin");
  logMove("setup: fleets placed (reroll available)");

  // ---- buttons ----
  document.querySelector("#btn-new")?.addEventListener("click", () => {
    state = reviveState(newGame());
    aiThinking = false;

    rebuildMoveLogFromState();
    renderState(state);
    setStatus("setup — reroll ships or fire to begin");
    logMove("setup: new game started");
  });

  document.querySelector("#btn-reroll")?.addEventListener("click", () => {
    // allow reroll only before first shot is fired
    if (state?.moves?.length > 0) {
      setStatus("cannot reroll after combat begins");
      return;
    }

    rerollPlayerFleet(state);
    aiThinking = false;

    rebuildMoveLogFromState();
    renderState(state);
    setStatus("setup — fleet rerolled");
    logMove("setup: rerolled ship placement");
  });

  // UNDO button
  document.querySelector("#btn-undo")?.addEventListener("click", () => {
    if (aiThinking) {
      setStatus("cannot undo while computer is thinking");
      return;
    }

    if (!state?.moves?.length) {
      setStatus("nothing to undo");
      return;
    }

    const rebuilt = undoLastTurn(state);
    if (!rebuilt) {
      setStatus("nothing to undo");
      return;
    }

    state = reviveState(rebuilt);
    aiThinking = false;

    rebuildMoveLogFromState();
    renderState(state);

    if (state.phase === "setup") {
      setStatus("undo complete — back to setup");
   } else if (state.turn === "ai") {
  setStatus("undo complete — computer turn…");
  runAiTurn();
  return;
} else {
  setStatus("undo complete — your turn");
}

    logMove("undo: reverted last turn");
  });

  document.querySelector("#btn-save")?.addEventListener("click", async () => {
    try {
      const payload = serializeState(state);

      const res = await fetch(`${API_BASE}/save.php`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(payload),
      });

      const text = await res.text();
      let data;
      try {
        data = JSON.parse(text);
      } catch {
        console.error("save.php non-json response:", text);
        setStatus("save failed (server returned non-json)");
        return;
      }

      if (!res.ok || !data.ok) {
        console.error("save failed:", { http: res.status, data });
        setStatus("save failed");
        return;
      }

      setStatus("saved ✅");
      logMove("saved game");
    } catch (err) {
      console.error(err);
      setStatus("save failed (network)");
    }
  });

  document.querySelector("#btn-load")?.addEventListener("click", async () => {
    try {
      const res = await fetch(`${API_BASE}/load.php`, { cache: "no-store" });
      const text = await res.text();

      let data;
      try {
        data = JSON.parse(text);
      } catch {
        console.error("load.php non-json response:", text);
        setStatus("load failed (server returned non-json)");
        return;
      }

      if (!res.ok || !data.ok || !data.state) {
        setStatus("no save found");
        return;
      }

      state = reviveState(data.state);
      aiThinking = false;

      rebuildMoveLogFromState();
      renderState(state);

      logMove("loaded saved game");

      if (state.over) {
        setStatus(`loaded — game over (${state.winner} won)`);
        return;
      }

      // resume correct turn
      if (state.turn === "ai") {
        setStatus("loaded — computer turn…");
        runAiTurn();
      } else {
        setStatus("loaded — your turn");
      }
    } catch (err) {
      console.error(err);
      setStatus("load failed (network)");
    }
  });

  // ---- gameplay ----
  document.querySelector("#board-ai")?.addEventListener("click", (e) => {
    const cell = e.target.closest(".cell");
    if (!cell) return;

    if (state.over) {
      setStatus(`game over — ${state.winner} won`);
      return;
    }

    if (aiThinking) {
      setStatus("computer is thinking…");
      return;
    }

    if (state.turn !== "player") {
      setStatus("not your turn");
      return;
    }

    const r = Number(cell.dataset.r);
    const c = Number(cell.dataset.c);

    const move = fireShot(state, "player", "ai", { r, c });
    if (!move) {
      setStatus("invalid shot (already fired there?)");
      return;
    }

    renderState(state);
    logMove(formatMove(move));

    if (state.over) {
      setStatus("you win 🎯");
      return;
    }

    runAiTurn();
  });
}

function runAiTurn() {
  aiThinking = true;
  setStatus("computer turn…");

  setTimeout(() => {
    const aiCoord = pickRandomShot(state, "player");
    const aiMove = fireShot(state, "ai", "player", aiCoord);

    if (!aiMove) {
      aiThinking = false;
      setStatus("ai failed to shoot (unexpected)");
      return;
    }

    renderState(state);
    logMove(formatAIMove(aiMove));

    if (state.over) {
      aiThinking = false;
      setStatus("computer wins 😭");
      return;
    }

    aiThinking = false;
    setStatus("your turn — fire on enemy waters");
  }, 450);
}

// -------------------------
// Persistence helpers
// -------------------------

function serializeState(s) {
  const clone = structuredClone ? structuredClone(s) : JSON.parse(JSON.stringify(s, replacer));

  if (clone?.boards?.player) clone.boards.player.shots = normalizeShotsForSave(s.boards.player.shots);
  if (clone?.boards?.ai) clone.boards.ai.shots = normalizeShotsForSave(s.boards.ai.shots);

  return clone;
}

function replacer(_key, value) {
  if (value instanceof Set) return Array.from(value);
  return value;
}

function normalizeShotsForSave(shots) {
  if (shots instanceof Set) return Array.from(shots);
  if (Array.isArray(shots)) return shots;
  if (shots && typeof shots === "object") return Object.keys(shots);
  return [];
}

// revive board.shots back into Set() after JSON load
function reviveState(loaded) {
  if (!loaded.moves) loaded.moves = [];
  if (!("over" in loaded)) loaded.over = false;
  if (!("winner" in loaded)) loaded.winner = null;
  if (!loaded.turn) loaded.turn = "player";

  reviveBoard(loaded.boards?.player);
  reviveBoard(loaded.boards?.ai);

  return loaded;
}

function reviveBoard(board) {
  if (!board) return;
  if (board.shots instanceof Set) return;

  if (Array.isArray(board.shots)) {
    board.shots = new Set(board.shots);
    return;
  }

  if (board.shots && typeof board.shots === "object") {
    board.shots = new Set(Object.keys(board.shots));
    return;
  }

  board.shots = new Set();
}

// -------------------------
// UI helpers
// -------------------------

function clearMoveLog() {
  const list = document.querySelector("#move-log");
  if (list) list.innerHTML = "";
}

function rebuildMoveLogFromState() {
  clearMoveLog();
  if (!state?.moves?.length) return;

  for (const move of state.moves) {
    logMove(move.actor === "ai" ? formatAIMove(move) : formatMove(move));
  }
}

function formatMove(move) {
  const { coord, result, ship } = move;
  const pos = toCoordLabel(coord.r, coord.c);

  if (result === "miss") return `you fired at ${pos}: miss`;
  if (result === "hit") return `you fired at ${pos}: hit ${ship.name} (${ship.segment})`;
  return `you fired at ${pos}: sunk ${ship.name} ✅`;
}

function formatAIMove(move) {
  const { coord, result, ship } = move;
  const pos = toCoordLabel(coord.r, coord.c);

  if (result === "miss") return `computer fired at ${pos}: miss`;
  if (result === "hit") return `computer fired at ${pos}: hit ${ship.name} (${ship.segment})`;
  return `computer fired at ${pos}: sunk ${ship.name} ❌`;
}

function toCoordLabel(r, c) {
  const letters = "ABCDEFGHIJ";
  return `${letters[c]}${r + 1}`;
}
