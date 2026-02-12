// Core game engine: creates/reset game state, controls phase/turn transitions,
// and records shot outcomes (miss/hit/sink) until a winner is determined.
import { makeEmptyBoard, randomizeFleet } from "./board.js";
import { resolveShot, segmentLabel } from "./tracker.js";

// Undo design:
// - moves[] is the source-of-truth for what shots occurred.
// - ships placement (start/orientation/length/id) is stable within a game.
// - derived state (shots Sets, hits arrays, moveNumber, over/winner, turn/phase)
//   is rebuilt from ship placement + remaining move history.
// This avoids fragile "reverse mutation" logic.

export function newGame() {
  const state = {
    turn: "player",
    phase: "setup", // "setup" | "player_turn" | "ai_turn" | "game_over"
    boards: {
      player: makeEmptyBoard(10),
      ai: makeEmptyBoard(10),
    },
    moves: [],
    moveNumber: 0,
    over: false,
    winner: null, // "player" | "ai" | null
  };

  randomizeFleet(state.boards.player);
  randomizeFleet(state.boards.ai);

  return state;
}

export function rerollPlayerFleet(state) {
  if (state.phase !== "setup") return null;
  randomizeFleet(state.boards.player);
  return state;
}

export function fireShot(state, actor, target, coord) {
    if (state.phase === "game_over") return null;

    if (actor === "player" && state.phase !== "setup" && state.phase !== "player_turn") return null;
    if (actor === "ai" && state.phase !== "ai_turn") return null;

  const board = state.boards[target];
  const key = `${coord.r},${coord.c}`;

  // no duplicate shots
  if (board.shots.has(key)) return null;

  board.shots.add(key);
// first shot transitions setup -> combat
if (actor === "player" && state.phase === "setup") {
  state.phase = "player_turn";
}

  const outcome = resolveShot(board, coord);

  let result = outcome.result; // "miss" | "hit"
  let shipInfo = null;

  if (outcome.result === "hit") {
    const ship = outcome.ship;
    ship.hits[outcome.hitIndex] = true;

   const sunk = ship.hits.every(Boolean);
if (sunk) result = "sink";
if (sunk) {
  console.log("SUNK:", ship.name, "id:", ship.id, "hits:", ship.hits);
}

    shipInfo = {
      id: ship.id,
      name: ship.name,
      length: ship.length,
      orientation: ship.orientation,
      start: { ...ship.start },
      hitIndex: outcome.hitIndex,
      segment: segmentLabel(ship.length, outcome.hitIndex),
      sunk,
    };
  }

  state.moveNumber += 1;

  const move = {
    turn: state.moveNumber,
    actor,
    target,
    coord: { ...coord },
    result, // "miss" | "hit" | "sink"
    ship: shipInfo,
    timestamp: Date.now(),
  };

  state.moves.push(move);

  // win check: all ships on target board sunk
 if (allShipsSunk(board)) {
  state.over = true;
  state.winner = actor;
  state.phase = "game_over";
} else {
  if (actor === "player") {
    state.turn = "ai";
    state.phase = "ai_turn";
  } else {
    state.turn = "player";
    state.phase = "player_turn";
  }
}

  return move;
}

// ---------------------------------
// Undo last turn (player + ai)
// ---------------------------------

// Removes the most recent full turn from history and rebuilds derived state.
// Returns a NEW state object, or null if there is nothing to undo.
export function undoLastTurn(state) {
  if (!state || !Array.isArray(state.moves) || state.moves.length === 0) return null;

  // If the most recent move was by the AI, undo a full round (ai + player).
  // If the most recent move was by the player (edge case: undo before AI fires), undo only one.
  const lastMove = state.moves[state.moves.length - 1];
  const popCount = lastMove.actor === "ai" ? 2 : 1;

  const remaining = state.moves.slice(0, Math.max(0, state.moves.length - popCount));

  // Seed from the current game's ship placement, then replay remaining history.
  const rebuilt = seedFromPlacement(state);
  replayMoves(rebuilt, remaining);

  // Recompute meta fields from rebuilt boards + history.
  rebuilt.moves = remaining;
  rebuilt.moveNumber = remaining.length;

  if (rebuilt.moveNumber === 0) {
    // Back to pre-combat setup state (ships placed, no shots fired)
    rebuilt.turn = "player";
    rebuilt.phase = "setup";
    rebuilt.over = false;
    rebuilt.winner = null;
    return rebuilt;
  }

  // Determine winner/over
  if (allShipsSunk(rebuilt.boards.ai)) {
    rebuilt.over = true;
    rebuilt.winner = "player";
    rebuilt.phase = "game_over";
    return rebuilt;
  }

  if (allShipsSunk(rebuilt.boards.player)) {
    rebuilt.over = true;
    rebuilt.winner = "ai";
    rebuilt.phase = "game_over";
    return rebuilt;
  }

  // Not over: infer turn/phase from last remaining move
  rebuilt.over = false;
  rebuilt.winner = null;

  const lastKept = remaining[remaining.length - 1];
  if (lastKept.actor === "ai") {
    rebuilt.turn = "player";
    rebuilt.phase = "player_turn";
  } else {
    rebuilt.turn = "ai";
    rebuilt.phase = "ai_turn";
  }

  return rebuilt;
}

// Create a fresh state using the existing ship placement from the current game.
// This resets derived combat state (shots, hits, moves, meta) but keeps placement.
function seedFromPlacement(state) {
  const seeded = {
    turn: "player",
    phase: "setup",
    boards: {
      player: makeEmptyBoard(10),
      ai: makeEmptyBoard(10),
    },
    moves: [],
    moveNumber: 0,
    over: false,
    winner: null,
  };

  // Copy ship placement; reset hits arrays to all-false.
  seeded.boards.player.ships = cloneShipsResetHits(state.boards.player.ships);
  seeded.boards.ai.ships = cloneShipsResetHits(state.boards.ai.ships);

  // shots Sets start empty (makeEmptyBoard should provide Set(); enforce anyway)
  seeded.boards.player.shots = new Set();
  seeded.boards.ai.shots = new Set();

  return seeded;
}

function cloneShipsResetHits(ships) {
  return (ships || []).map((s) => ({
    id: s.id,
    name: s.name,
    length: s.length,
    start: { ...s.start },
    orientation: s.orientation,
    hits: Array(s.length).fill(false),
  }));
}

// Replays a list of moves into the seeded state, rebuilding shots + hits.
// IMPORTANT: this does NOT push into state.moves; it only applies effects.
function replayMoves(state, moves) {
  for (const m of moves) {
    applyMove(state, m);
  }
}

function applyMove(state, move) {
  const targetBoard = state.boards[move.target];
  if (!targetBoard) return;

  const key = `${move.coord.r},${move.coord.c}`;
  targetBoard.shots.add(key);

  // Apply hit/sink to ship.hits using recorded ship id + hitIndex.
  if ((move.result === "hit" || move.result === "sink") && move.ship) {
    const ship = targetBoard.ships.find((s) => s.id === move.ship.id);
    if (ship && typeof move.ship.hitIndex === "number") {
      ship.hits[move.ship.hitIndex] = true;
    }
  }
}

function allShipsSunk(board) {
  return board.ships.every((s) => s.hits.every(Boolean));
}
