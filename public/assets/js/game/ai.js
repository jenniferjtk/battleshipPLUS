export function pickRandomShot(state, target) {
  // target is "player" or "ai"
  const board = state.boards[target];
  const size = board.size;

  // worst case there are 100 cells, so a simple loop is fine
  while (true) {
    const r = Math.floor(Math.random() * size);
    const c = Math.floor(Math.random() * size);
    const key = `${r},${c}`;

    if (!board.shots.has(key)) return { r, c };
  }
}