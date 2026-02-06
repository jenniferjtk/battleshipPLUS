import { SHIP_DEFS, makeShip, shipCells } from "./ships.js";

export function makeEmptyBoard(size = 10) {
  return {
    size,
    ships: [],
    shots: new Set(), // store "r,c"
  };
}

export function randomizeFleet(board, rng = Math.random) {
  board.ships = [];

  for (let i = 0; i < SHIP_DEFS.length; i++) {
    const def = SHIP_DEFS[i];

    // defensive guard
    if (def.length > board.size) {
      throw new Error(`ship ${def.name} too long (${def.length}) for board size ${board.size}`);
    }

    const ship = placeOneShip(board, def, i, rng);
    board.ships.push(ship);
  }

  return board;
}

function placeOneShip(board, def, index, rng) {
  const size = board.size;
  const maxAttempts = 500;

  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    const orientation = rng() < 0.5 ? "h" : "v";

    const maxR = orientation === "v" ? size - def.length : size - 1;
    const maxC = orientation === "h" ? size - def.length : size - 1;

    const start = {
      r: randInt(0, maxR, rng),
      c: randInt(0, maxC, rng),
    };

    const candidate = makeShip(`ship_${index}`, def, start, orientation);

    // sanity check (safe)
    const cells = shipCells(candidate);
    if (cells.length !== def.length) {
      throw new Error("shipCells length mismatch");
    }

    if (!collides(board, candidate)) {
      return candidate;
    }
  }

  throw new Error(`failed to place ship: ${def.name}`);
}

function collides(board, candidate) {
  const candCells = shipCells(candidate);

  for (const existing of board.ships) {
    const exCells = shipCells(existing);

    for (const a of candCells) {
      for (const b of exCells) {
        const dr = Math.abs(a.r - b.r);
        const dc = Math.abs(a.c - b.c);

        // overlap OR touching
        if (dr <= 1 && dc <= 1) return true;
      }
    }
  }
  return false;
}

function randInt(min, max, rng) {
  return Math.floor(rng() * (max - min + 1)) + min;
}