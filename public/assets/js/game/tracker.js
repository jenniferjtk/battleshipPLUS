import { shipCells } from "./ships.js";

export function resolveShot(board, coord) {
  // returns { result, ship|null, hitIndex|null }
  const { r, c } = coord;

  for (const ship of board.ships) {
    const cells = shipCells(ship);
    for (let i = 0; i < cells.length; i++) {
      if (cells[i].r === r && cells[i].c === c) {
        return { result: "hit", ship, hitIndex: i };
      }
    }
  }

  return { result: "miss", ship: null, hitIndex: null };
}

export function segmentLabel(length, hitIndex) {
  if (hitIndex == null) return null;
  if (length === 2) return hitIndex === 0 ? "front" : "back";
  if (hitIndex === 0) return "front";
  if (hitIndex === length - 1) return "back";
  return "middle";
}