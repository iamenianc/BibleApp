// textsize.js — 5 reading-size levels (default 3), persisted

import { els } from "./dom.js";

const SIZE_KEY = "theword:size";
const LEVELS = ["1.04rem", "1.18rem", "1.32rem", "1.5rem", "1.72rem"];
const DEFAULT_LEVEL = 3; // 1-based
const MIN = 1;
const MAX = LEVELS.length;

let level = DEFAULT_LEVEL;

function apply() {
  document.documentElement.style.setProperty("--read-size", LEVELS[level - 1]);
  els.sizeDown.disabled = level <= MIN;
  els.sizeUp.disabled = level >= MAX;
}

function persist() {
  try {
    localStorage.setItem(SIZE_KEY, String(level));
  } catch (_) {
    /* ignore */
  }
}

function setLevel(n) {
  level = Math.min(MAX, Math.max(MIN, n));
  apply();
  persist();
}

export function initTextSize() {
  let saved = DEFAULT_LEVEL;
  try {
    const v = parseInt(localStorage.getItem(SIZE_KEY), 10);
    if (v >= MIN && v <= MAX) saved = v;
  } catch (_) {
    /* ignore */
  }
  level = saved;
  apply();

  els.sizeDown.addEventListener("click", () => setLevel(level - 1));
  els.sizeUp.addEventListener("click", () => setLevel(level + 1));
}
