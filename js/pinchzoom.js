// pinchzoom.js — two-finger pinch steps through the 9 reading-size levels
//
// The reader has touch-action: none (autoscroll.js drives scrolling itself), so
// the browser never zooms the page — we own the pinch entirely. Spreading the
// fingers apart grows the text a level at a time; pinching them together shrinks
// it. Single-finger scrolling and taps are untouched: this only acts on two.

import { els } from "./dom.js";
import { getTextLevel, getTextLevelCount, setTextLevel } from "./textsize.js";
import { nudgeAutoScroll } from "./autoscroll.js";

// Each ~18% change in finger spacing steps one level. Log-based so spreading and
// pinching feel symmetric (a given ratio moves the same number of steps either
// way) regardless of how far apart the fingers started.
const STEP_RATIO = 1.18;

let pinching = false;
let startDist = 0;    // finger spacing when the pinch began
let baseLevel = 0;    // text level when the pinch began
let lastApplied = 0;  // last level we set, to skip redundant work mid-pinch

function distance(touches) {
  const dx = touches[0].clientX - touches[1].clientX;
  const dy = touches[0].clientY - touches[1].clientY;
  return Math.hypot(dx, dy);
}

function onTouchStart(e) {
  if (e.touches.length !== 2) return;
  pinching = true;
  startDist = distance(e.touches);
  baseLevel = getTextLevel();
  lastApplied = baseLevel;
}

function onTouchMove(e) {
  if (!pinching || e.touches.length !== 2) return;
  e.preventDefault();
  const dist = distance(e.touches);
  if (dist <= 0 || startDist <= 0) return;
  // Spread (dist > startDist) → positive steps → larger text; pinch in shrinks.
  const steps = Math.round(Math.log(dist / startDist) / Math.log(STEP_RATIO));
  const target = Math.min(getTextLevelCount(), Math.max(1, baseLevel + steps));
  if (target === lastApplied) return; // skip the per-frame re-apply + persist
  lastApplied = target;
  setTextLevel(target); // setTextLevel also clamps internally
}

function onTouchEnd(e) {
  if (!pinching) return;
  // Stay in pinch mode until both fingers are gone, so lifting one then the
  // other doesn't flip into a single-finger scroll mid-gesture.
  if (e.touches.length > 0) return;
  pinching = false;
  nudgeAutoScroll(); // the drift was paused on touch; bring it back gently
}

export function initPinchZoom() {
  const r = els.reader;
  // Non-passive on move so we can preventDefault while the fingers pinch.
  r.addEventListener("touchstart", onTouchStart, { passive: true });
  r.addEventListener("touchmove", onTouchMove, { passive: false });
  r.addEventListener("touchend", onTouchEnd, { passive: true });
  r.addEventListener("touchcancel", onTouchEnd, { passive: true });
}
