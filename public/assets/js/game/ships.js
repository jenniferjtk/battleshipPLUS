export const SHIP_DEFS = [
  { name: "carrier", length: 5 },
  { name: "battleship", length: 4 },
  { name: "cruiser", length: 3 },
  { name: "submarine", length: 3 },
  { name: "destroyer", length: 2 },
];

export function makeShip(id, def, start, orientation) {
  return {
    id,
    name: def.name,
    length: def.length,
    start,               // { r, c }
    orientation,         // "h" | "v"
    hits: Array(def.length).fill(false),
  };
}

export function shipCells(ship) {
  const cells = [];
  for (let i = 0; i < ship.length; i++) {
    const r = ship.orientation === "v" ? ship.start.r + i : ship.start.r;
    const c = ship.orientation === "h" ? ship.start.c + i : ship.start.c;
    cells.push({ r, c });
  }
  return cells;
}