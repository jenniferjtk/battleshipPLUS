import { makeEmptyBoard, randomizeFleet } from "./board.js";
import { resolveShot, segmentLabel } from "./tracker.js";

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

function allShipsSunk(board) {
  return board.ships.every((s) => s.hits.every(Boolean));
}