// textsize.js — 9 reading-size levels (default 5), persisted
// Levels span very small → very large; 5 is the comfortable middle.

import { els } from "./dom.js";
import { keepUIAlive } from "./chrome.js";

const SIZE_KEY = "theword:size";
const LEVELS = [
  "0.86rem", // 1  very small
  "0.98rem", // 2
  "1.12rem", // 3
  "1.26rem", // 4
  "1.42rem", // 5  default
  "1.62rem", // 6
  "1.86rem", // 7
  "2.14rem", // 8
  "2.5rem",  // 9  very large
];
const DEFAULT_LEVEL = 5; // 1-based, the middle
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

  // Each tap keeps the bar from fading while the reader is dialing size in.
  els.sizeDown.addEventListener("click", () => { setLevel(level - 1); keepUIAlive(); });
  els.sizeUp.addEventListener("click", () => { setLevel(level + 1); keepUIAlive(); });
}
