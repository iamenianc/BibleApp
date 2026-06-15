// textsize.js — 9 reading-size levels (default 5), persisted
// The app is built around large text in a small space, so the smallest level
// is a deliberate 28px floor; the scale ramps up to very large from there.

import { els } from "./dom.js";
import { keepUIAlive } from "./chrome.js";
import { setAutoScrollScale, noteProgrammaticScroll } from "./autoscroll.js";

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

// Find the element to keep visually pinned across a size change. Prefer what's
// under the focal point (the midpoint of a pinch); otherwise pin the content in
// the reading band near the top, where the eye rests for button-driven changes.
function anchorElementAt(focalX, focalY) {
  const reader = els.reader;
  const rect = reader.getBoundingClientRect();
  const x = focalX == null ? rect.left + rect.width / 2 : focalX;
  // The opaque reading band sits ~30–40vh down; aim for its middle by default.
  const y = focalY == null ? rect.top + reader.clientHeight * 0.35 : focalY;

  const hit = document.elementFromPoint(x, y);
  if (hit && hit !== reader && reader.contains(hit)) return hit;

  // Focal landed on padding/a gap: pick the last block that starts above y.
  const blocks = reader.querySelectorAll(".verse, .chapter-label, .hebrew-subtitle");
  let best = null;
  for (const b of blocks) {
    if (b.getBoundingClientRect().top <= y) best = b;
    else break;
  }
  return best;
}

/**
 * Change the reading size while keeping the text under (focalX, focalY) pinned
 * in place. Without this, scrollTop stays put as the content above it reflows,
 * so the line being read slides away and the reader loses their place. The
 * font-size change is instant (the transition is off), so the anchor's new
 * on-screen position is final right after setLevel — we scroll by the delta to
 * restore it, then tell autoscroll the jump was ours so it isn't read as a
 * manual scroll.
 */
function setLevelAnchored(n, focalX, focalY) {
  if (n === level) return; // no reflow, nothing to anchor
  const reader = els.reader;
  const anchor = anchorElementAt(focalX, focalY);
  const before = anchor ? anchor.getBoundingClientRect().top : 0;
  setLevel(n);
  if (!anchor) return;
  const after = anchor.getBoundingClientRect().top;
  reader.scrollTop += after - before;
  noteProgrammaticScroll();
}

export function getTextLevel() { return level; }
export function getTextLevelCount() { return MAX; }
export function textLevelDown() { setLevelAnchored(level - 1); }
export function textLevelUp() { setLevelAnchored(level + 1); }
/** Jump straight to a level (1..MAX); clamped. Used by pinch-to-zoom, which
 *  passes the pinch focal point so the text under the fingers stays put. */
export function setTextLevel(n, focalX, focalY) { setLevelAnchored(n, focalX, focalY); }

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
  els.sizeDown.addEventListener("click", () => { setLevelAnchored(level - 1); keepUIAlive(); });
  els.sizeUp.addEventListener("click", () => { setLevelAnchored(level + 1); keepUIAlive(); });
}
