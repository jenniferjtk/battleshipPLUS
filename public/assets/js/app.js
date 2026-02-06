import { initUI } from "./ui/render.js";
import { bindEvents } from "./ui/events.js";

document.addEventListener("DOMContentLoaded", () => {
  initUI();
  bindEvents();
});