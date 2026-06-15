// textsize.js — 9 reading-size levels (default 5), persisted
// The app is built around large text in a small space, so the smallest level
// is a deliberate 28px floor; the scale ramps up to very large from there.

import { els } from "./dom.js";
import { keepUIAlive } from "./chrome.js";

const SIZE_KEY = "theword:size";
const LEVELS = [
  "28px", // 1  minimum — the floor for this UI
  "31px", // 2
  "34px", // 3
  "38px", // 4
  "42px", // 5  default
  "47px", // 6
  "53px", // 7
  "60px", // 8
  "68px", // 9  very large
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
