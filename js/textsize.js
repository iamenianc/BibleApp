// textsize.js — 9 reading-size levels (default 5), persisted
// The app is built around large text in a small space, so the smallest level
// is a deliberate 28px floor; the scale ramps up to very large from there.

import { els } from "./dom.js";
import { keepUIAlive } from "./chrome.js";
import { setAutoScrollScale } from "./autoscroll.js";

const SIZE_KEY = "theword:size";
const LEVELS = [
  "20px", // 1  minimum — the floor for this UI
  "25px", // 2
  "30px", // 3
  "35px", // 4
  "40px", // 5  default
  "45px", // 6
  "50px", // 7
  "60px", // 8
  "70px", // 9  very large
];
const DEFAULT_LEVEL = 5; // 1-based, the middle
const MIN = 1;
const MAX = LEVELS.length;
const BASE_PX = parseFloat(LEVELS[0]); // smallest size — the autoscroll baseline

let level = DEFAULT_LEVEL;

function apply() {
  document.documentElement.style.setProperty("--read-size", LEVELS[level - 1]);
  els.sizeDown.disabled = level <= MIN;
  els.sizeUp.disabled = level >= MAX;
  // Speed the drift up with the text size (capped at medium inside autoscroll).
  setAutoScrollScale(parseFloat(LEVELS[level - 1]) / BASE_PX);
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

export function getTextLevel() { return level; }
export function getTextLevelCount() { return MAX; }
export function textLevelDown() { setLevel(level - 1); }
export function textLevelUp() { setLevel(level + 1); }
/** Jump straight to a level (1..MAX); clamped. Used by pinch-to-zoom. */
export function setTextLevel(n) { setLevel(n); }

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
