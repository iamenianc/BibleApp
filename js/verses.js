// verses.js — deliberate tap reveals a verse's number; stays until tapped again
//
// A tap is distinguished from a scroll/swipe by movement + time thresholds,
// so scrolling never reveals a number.

import { els } from "./dom.js";
import { nudgeAutoScroll } from "./autoscroll.js";
import { AUTOSCROLL_TAP_DELAY } from "./config.js";

const MOVE_TOLERANCE = 10; // px — beyond this, it's a scroll, not a tap
const TIME_TOLERANCE = 500; // ms — beyond this, treat as a long press/drag

let startX = 0;
let startY = 0;
let startT = 0;
let moved = false;
let revealed = null; // currently revealed .verse element

function clearRevealed() {
  if (revealed) {
    revealed.classList.remove("revealed");
    revealed = null;
  }
}

function toggleVerse(verseEl) {
  if (revealed === verseEl) {
    clearRevealed();
    return;
  }
  clearRevealed();
  verseEl.classList.add("revealed");
  revealed = verseEl;
}

function onPointerDown(e) {
  const p = e.touches ? e.touches[0] : e;
  startX = p.clientX;
  startY = p.clientY;
  startT = Date.now();
  moved = false;
}

function onPointerMove(e) {
  const p = e.touches ? e.touches[0] : e;
  if (
    Math.abs(p.clientX - startX) > MOVE_TOLERANCE ||
    Math.abs(p.clientY - startY) > MOVE_TOLERANCE
  ) {
    moved = true;
  }
}

function onPointerUp(e) {
  // The drift was frozen on pointerdown; decide how soon it resumes.
  // A scroll/drag (or long press) resumes almost instantly; a deliberate
  // tap holds the pause longer so the reader can dwell on a verse.
  if (moved || Date.now() - startT > TIME_TOLERANCE) {
    nudgeAutoScroll(); // fast resume — default delay
    return;
  }
  nudgeAutoScroll(AUTOSCROLL_TAP_DELAY);

  const target = e.target;

  // footnote tap → show its text, don't toggle verse
  if (target.classList.contains("fn")) {
    if (target.dataset.footnote) alert(target.dataset.footnote);
    return;
  }

  const verseEl = target.closest(".verse");
  if (verseEl) toggleVerse(verseEl);
  else clearRevealed(); // tapping empty space dismisses
}

export function initVerseReveal() {
  const r = els.reader;
  // pointer events cover mouse + touch; fall back gracefully
  r.addEventListener("pointerdown", onPointerDown, { passive: true });
  r.addEventListener("pointermove", onPointerMove, { passive: true });
  r.addEventListener("pointerup", onPointerUp);
}

/** Clear any reveal — called on chapter change. */
export function resetReveal() {
  clearRevealed();
}
