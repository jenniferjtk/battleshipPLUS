import { shipCells } from "../game/ships.js";

export function initUI() {
  renderEmptyBoard("board-player");
  renderEmptyBoard("board-ai");
  renderLabels("player");
  renderLabels("ai");
  setStatus("ready");
}

export function setStatus(text) {
  const el = document.querySelector("#status");
  if (el) el.textContent = text;
}

export function logMove(text) {
  const list = document.querySelector("#move-log");
  if (!list) return;
  const li = document.createElement("li");
  li.textContent = text;
  list.prepend(li);
}

export function renderState(state) {
  paintShips("#board-player", state.boards.player.ships);
  clearShips("#board-ai"); // fog of war

  paintShots("#board-player", state.boards.player);
  paintShots("#board-ai", state.boards.ai);
}

function renderEmptyBoard(containerId) {
  const boardEl = document.querySelector(`#${containerId}`);
  if (!boardEl) return;

  boardEl.innerHTML = "";
  for (let r = 0; r < 10; r++) {
    for (let c = 0; c < 10; c++) {
      const cell = document.createElement("div");
      cell.className = "cell";
      cell.dataset.r = String(r);
      cell.dataset.c = String(c);
      boardEl.appendChild(cell);
    }
  }
}
export function renderLeaderboard(board) {
  const p = document.querySelector("#lb-player");
  const a = document.querySelector("#lb-ai");
  const t = document.querySelector("#lb-total");

  if (p) p.textContent = String(board?.player_wins ?? 0);
  if (a) a.textContent = String(board?.ai_wins ?? 0);
  if (t) t.textContent = String(board?.total_games ?? 0);
}

function paintShips(boardSelector, ships) {
  clearShips(boardSelector);

  const boardEl = document.querySelector(boardSelector);
  if (!boardEl) return;

  for (const ship of ships) {
    for (const { r, c } of shipCells(ship)) {
      const cell = boardEl.querySelector(`.cell[data-r="${r}"][data-c="${c}"]`);
      if (cell) cell.classList.add("ship");
    }
  }
}

function clearShips(boardSelector) {
  const boardEl = document.querySelector(boardSelector);
  if (!boardEl) return;
  boardEl.querySelectorAll(".cell.ship").forEach((el) => el.classList.remove("ship"));
}

function paintShots(boardSelector, board) {
  const boardEl = document.querySelector(boardSelector);
  if (!boardEl) return;

  // clear existing marks
  boardEl.querySelectorAll(".cell.hit, .cell.miss").forEach((el) => {
    el.classList.remove("hit", "miss");
  });

  // repaint from board.shots
  for (const key of board.shots) {
    const [rStr, cStr] = key.split(",");
    const r = Number(rStr);
    const c = Number(cStr);

    const cell = boardEl.querySelector(`.cell[data-r="${r}"][data-c="${c}"]`);
    if (!cell) continue;

    // hit if ship occupies cell
    const isHit = board.ships.some((ship) =>
      shipCells(ship).some((p) => p.r === r && p.c === c)
    );

    cell.classList.add(isHit ? "hit" : "miss");
  }
}
function renderLabels(which) {
  const colsEl = document.querySelector(`#cols-${which}`);
  const rowsEl = document.querySelector(`#rows-${which}`);
  if (!colsEl || !rowsEl) return;

  const letters = "abcdefghij".split("");

  colsEl.innerHTML = "";
  for (const ch of letters) {
    const d = document.createElement("div");
    d.textContent = ch.toUpperCase();
    colsEl.appendChild(d);
  }

  rowsEl.innerHTML = "";
  for (let i = 1; i <= 10; i++) {
    const d = document.createElement("div");
    d.textContent = String(i);
    rowsEl.appendChild(d);
  }
}