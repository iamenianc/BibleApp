// verses.js — a deliberate tap on a verse shows its number in a soft tooltip
// that appears where the reader tapped, then fades on its own.
//
// A tap is distinguished from a scroll/swipe by movement + time thresholds,
// so scrolling never shows a number.

import { els } from "./dom.js";
import { nudgeAutoScroll } from "./autoscroll.js";
import { AUTOSCROLL_TAP_DELAY } from "./config.js";

const MOVE_TOLERANCE = 10; // px — beyond this, it's a scroll, not a tap
const TIME_TOLERANCE = 500; // ms — beyond this, treat as a long press/drag
const TOOLTIP_LINGER = 1600; // ms the number stays visible before fading
const TOOLTIP_FLIP_GAP = 56; // px: if a tap is within this of the menu's bottom
                             // edge, flip the tip below the finger instead of up

let startX = 0;
let startY = 0;
let startT = 0;
let moved = false;

let tooltip = null;     // the floating number element (created lazily)
let hideTimer = null;   // pending auto-fade

function ensureTooltip() {
  if (tooltip) return tooltip;
  tooltip = document.createElement("div");
  tooltip.className = "verse-tip";
  document.body.appendChild(tooltip);
  return tooltip;
}

/** Hide the tooltip now (fade out via the .visible class). */
function hideTip() {
  clearTimeout(hideTimer);
  hideTimer = null;
  if (tooltip) tooltip.classList.remove("visible");
}

/** Build the abbreviated reference (e.g. "Rom 1:16") for a tapped verse. */
function refLabel(verseEl) {
  const chapterEl = verseEl.closest(".chapter");
  const abbrev = chapterEl ? chapterEl.dataset.bookAbbrev : "";
  const chapter = chapterEl ? chapterEl.dataset.chapter : "";
  return `${abbrev} ${chapter}:${verseEl.dataset.verse}`;
}

/** Bottom edge (viewport px) of the top menu, so the tooltip can stay clear. */
function chromeBottom() {
  return els.topbar ? els.topbar.getBoundingClientRect().bottom : 0;
}

/**
 * Show the verse reference in a soft tooltip at the tap point, then schedule it
 * to fade on its own. The tip normally sits above the finger; near the top it
 * flips below so it never overlaps the menu. Re-tapping moves it.
 */
function showTip(label, x, y) {
  const tip = ensureTooltip();
  clearTimeout(hideTimer);
  tip.textContent = label;
  tip.style.left = `${x}px`;
  tip.style.top = `${y}px`;
  // If the upward tip would rise into the top menu, flip it below the finger.
  tip.classList.toggle("below", y - chromeBottom() < TOOLTIP_FLIP_GAP);
  // Reflow so a re-tap restarts the fade-in transition cleanly.
  tip.classList.remove("visible");
  void tip.offsetWidth;
  tip.classList.add("visible");
  hideTimer = setTimeout(hideTip, TOOLTIP_LINGER);
}

function onPointerDown(e) {
  // Any new interaction dismisses a showing tooltip at once. (This down belongs
  // to the *next* gesture; the tip is only ever shown later, on pointerup.)
  hideTip();
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

  // footnote tap → show its text, don't show a verse number
  if (target.classList.contains("fn")) {
    if (target.dataset.footnote) alert(target.dataset.footnote);
    return;
  }

  // A tap up in the menu zone is for the chrome, not a verse — don't show a tip.
  if (e.clientY <= chromeBottom()) {
    hideTip();
    return;
  }

  const verseEl = target.closest(".verse");
  if (verseEl) {
    showTip(refLabel(verseEl), e.clientX, e.clientY);
  } else {
    hideTip(); // tapping empty space dismisses
  }
}

export function initVerseReveal() {
  const r = els.reader;
  // pointer events cover mouse + touch; fall back gracefully
  r.addEventListener("pointerdown", onPointerDown, { passive: true });
  r.addEventListener("pointermove", onPointerMove, { passive: true });
  r.addEventListener("pointerup", onPointerUp);
  // Scrolling or wheeling also dismisses the tooltip right away.
  r.addEventListener("scroll", hideTip, { passive: true });
  r.addEventListener("wheel", hideTip, { passive: true });
}

/** Hide the number tooltip — called on chapter change. */
export function resetReveal() {
  hideTip();
}
