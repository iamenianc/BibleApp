// autoscroll.js — gentle, continuous forward scroll
//
// The reader drifts forward on its own at a very slow rate. It pauses the
// moment the screen is touched (to reveal a verse or the menu) or the reader
// scrolls by hand, then resumes automatically and gracefully after a short
// quiet period, easing back up to speed rather than jerking into motion.

import { els } from "./dom.js";
import {
  AUTOSCROLL_SPEED,
  AUTOSCROLL_SPEED_EXP,
  AUTOSCROLL_MAX_MULT,
  AUTOSCROLL_RESUME_DELAY,
  AUTOSCROLL_RAMP,
  WHEEL_SENSITIVITY,
  TOUCH_SENSITIVITY,
} from "./config.js";

// User-chosen scroll pace: 0=off, 1=slow, 2=medium (default), 3=fast.
const PACE_KEY = "theword:pace";
const PACE_MULTS = [0, 0.4, 1, 2.5];
let userPaceIdx = 2;
let userPaceMult = 1;

// Load saved pace immediately so initAutoScroll can respect it.
try {
  const v = parseInt(localStorage.getItem(PACE_KEY), 10);
  if (v >= 0 && v <= 3) { userPaceIdx = v; userPaceMult = PACE_MULTS[v]; }
} catch (_) { /* ignore */ }

export function getUserPace() { return userPaceIdx; }

export function setUserPace(idx) {
  userPaceIdx = idx;
  try { localStorage.setItem(PACE_KEY, String(idx)); } catch (_) { /* ignore */ }
  if (idx === 0) {
    enabled = false;
    pauseAutoScroll();
  } else {
    userPaceMult = PACE_MULTS[idx];
    applySpeed();
    if (!enabled) { enabled = true; nudgeAutoScroll(); }
  }
}

// Effective drift speed (px/s). Starts at the base (smallest-size) pace and is
// raised by setAutoScrollScale as the reading size grows, capped at medium.
let speed = AUTOSCROLL_SPEED;
let currentSizeRatio = 1;

function applySpeed() {
  const boosted = Math.pow(Math.max(1, currentSizeRatio), AUTOSCROLL_SPEED_EXP);
  const sizeMult = Math.min(AUTOSCROLL_MAX_MULT, boosted);
  speed = AUTOSCROLL_SPEED * sizeMult * userPaceMult;
}

let running = false;     // the rAF loop is active and allowed to move
let rafId = null;
let lastT = 0;           // timestamp of the previous frame
let rampStart = 0;       // when the current motion began, for ease-in
let resumeTimer = null;
let pos = 0;             // fractional scroll position we drive, for sub-pixel smoothness
let lastTop = 0;         // last scrollTop we wrote, to detect manual scrolling
let enabled = false;     // master switch (off until started)

// Finger-scroll state. We drive the scroll ourselves (native touch scrolling is
// disabled in reader.css) so the same slow sensitivity applies, then glide to a
// stop with our own momentum after the finger lifts.
let touchLastY = 0;      // last touch Y, to measure per-move delta
let touchVel = 0;        // current finger velocity in px/ms (already scaled)
let touchLastMoveT = 0;  // timestamp of the last touchmove, for velocity
let momentumId = null;   // rAF id for the post-release glide

function frame(t) {
  if (!running) return;
  if (!lastT) lastT = t;
  const dt = (t - lastT) / 1000; // seconds since last frame
  lastT = t;

  // Ease in from a standstill so resuming is graceful, not abrupt.
  const elapsed = t - rampStart;
  const ramp = Math.min(1, elapsed / AUTOSCROLL_RAMP);
  const eased = ramp * ramp * (3 - 2 * ramp); // smoothstep

  pos += speed * eased * dt;
  const el = els.reader;
  const max = el.scrollHeight - el.clientHeight;
  const next = Math.min(max, pos);
  // Write a fractional scrollTop: browsers render sub-pixel offsets, so the
  // drift is continuous instead of stepping a whole pixel every few frames.
  el.scrollTop = next;
  lastTop = el.scrollTop; // read back what stuck, to recognize our own write

  rafId = requestAnimationFrame(frame);
}

function startLoop() {
  if (rafId != null) return;
  lastT = 0;
  rampStart = performance.now();
  pos = els.reader.scrollTop; // start from where the page actually is
  rafId = requestAnimationFrame(frame);
}

function stopLoop() {
  if (rafId != null) {
    cancelAnimationFrame(rafId);
    rafId = null;
  }
}

/**
 * Scale the drift speed for the current reading size. `ratio` is the current
 * font size relative to the smallest (1 at the floor). Speed grows steeper than
 * the ratio (raised to AUTOSCROLL_SPEED_EXP) so the largest sizes accelerate
 * noticeably while small sizes stay gentle, capped at AUTOSCROLL_MAX_MULT.
 */
export function setAutoScrollScale(ratio) {
  currentSizeRatio = ratio;
  applySpeed();
}

/** Begin (or resume) the gentle drift now, easing up to speed. */
export function resumeAutoScroll() {
  if (!enabled) return;
  clearTimeout(resumeTimer);
  resumeTimer = null;
  running = true;
  startLoop();
}

/** Stop drifting immediately and cancel any pending resume. */
export function pauseAutoScroll() {
  running = false;
  stopLoop();
  clearTimeout(resumeTimer);
  resumeTimer = null;
}

/**
 * Pause now and schedule a graceful resume once things have been quiet for
 * `delay` ms. Manual scroll/wheel resume almost instantly (the default);
 * a deliberate tap passes a longer delay so the reader can dwell on a verse.
 */
export function nudgeAutoScroll(delay = AUTOSCROLL_RESUME_DELAY) {
  if (!enabled) return;
  running = false;
  stopLoop();
  clearTimeout(resumeTimer);
  resumeTimer = setTimeout(resumeAutoScroll, delay);
}

// A backward (upward) move is a deliberate stop: pause and stay paused until
// the reader scrolls forward again or taps/clicks. A forward move just nudges
// (resumes after the usual quiet period). `dy < 0` means moving up.
function reactToManualMove(dy) {
  if (dy < 0) pauseAutoScroll();
  else nudgeAutoScroll();
}

function onManualScroll() {
  // Ignore the scroll events our own loop generates; react only to the reader
  // moving the page by hand (wheel, drag, momentum).
  const dy = els.reader.scrollTop - lastTop;
  if (Math.abs(dy) <= 2) return;
  reactToManualMove(dy);
}

// Scroll the reader by `dy` pixels, clamped, and record the write so the
// scroll handler recognizes it as ours. Returns the actual delta applied.
function scrollByPixels(dy) {
  const el = els.reader;
  const max = el.scrollHeight - el.clientHeight;
  const before = el.scrollTop;
  el.scrollTop = Math.min(max, Math.max(0, before + dy));
  lastTop = el.scrollTop;
  return el.scrollTop - before;
}

// Intercept the mouse wheel and apply our own slowed-down delta, so spinning
// the wheel inches the text along instead of jumping. Must be non-passive to
// call preventDefault.
function onWheel(e) {
  e.preventDefault();
  // Normalize line/page deltas to pixels (deltaMode 1 = lines, 2 = pages).
  const unit = e.deltaMode === 1 ? 16 : e.deltaMode === 2 ? els.reader.clientHeight : 1;
  const moved = scrollByPixels(e.deltaY * unit * WHEEL_SENSITIVITY);
  reactToManualMove(moved);
}

function stopMomentum() {
  if (momentumId != null) {
    cancelAnimationFrame(momentumId);
    momentumId = null;
  }
}

function onTouchStart(e) {
  stopMomentum();
  touchLastY = e.touches[0].clientY;
  touchLastMoveT = performance.now();
  touchVel = 0;
}

function onTouchMove(e) {
  // The finger moving down by dy should scroll the text down by the same dy,
  // but slowed by the sensitivity multiplier. (Dragging up moves text up.)
  const y = e.touches[0].clientY;
  const now = performance.now();
  const dy = (touchLastY - y) * TOUCH_SENSITIVITY;
  touchLastY = y;

  const dt = now - touchLastMoveT;
  touchLastMoveT = now;
  if (dt > 0) touchVel = dy / dt; // px per ms, for the release glide

  scrollByPixels(dy);
  e.preventDefault(); // we own the scroll; stop the browser doing its own
}

function onTouchEnd() {
  // A near-stationary release is a tap, not a scroll — leave it to verses.js,
  // which owns the tap's resume. Reacting here on the finger's noise velocity
  // would randomly read as a tiny upward flick and pause indefinitely, killing
  // the tap-resume that's about to be scheduled (the "resumes only sometimes").
  if (Math.abs(touchVel) < 0.02) return;
  // A backward (upward) flick is a deliberate stop — pause and stay paused.
  // A forward flick nudges and resumes after the usual quiet period.
  reactToManualMove(touchVel);
  let v = touchVel;
  let last = performance.now();
  const decay = 0.0025; // higher = stops sooner
  const tick = (t) => {
    const dt = t - last;
    last = t;
    const moved = scrollByPixels(v * dt);
    v *= Math.exp(-decay * dt); // exponential slowdown
    // Keep gliding until the velocity fades or we hit an edge.
    if (Math.abs(v) > 0.01 && moved !== 0) {
      momentumId = requestAnimationFrame(tick);
    } else {
      momentumId = null;
    }
  };
  momentumId = requestAnimationFrame(tick);
}

export function initAutoScroll() {
  enabled = userPaceIdx !== 0;
  lastTop = els.reader.scrollTop;

  // A finger/mouse down freezes the drift at once, so no programmatic scroll
  // writes happen mid-gesture (those would corrupt tap detection and the
  // menu-reveal tap). We don't schedule a resume here — that's owned by the
  // gesture's outcome: a drag resumes fast via the scroll handler below, a
  // deliberate tap resumes after a longer dwell via verses.js.
  els.reader.addEventListener("pointerdown", pauseAutoScroll, { passive: true });

  // A hand on the page (drag / wheel) pauses, then resumes almost instantly.
  els.reader.addEventListener("scroll", onManualScroll, { passive: true });
  // Non-passive so we can slow the wheel down ourselves (see onWheel).
  els.reader.addEventListener("wheel", onWheel, { passive: false });

  // Finger scrolling: we drive it ourselves at the same reduced sensitivity,
  // with a momentum glide on release. Non-passive so touchmove can preventDefault.
  els.reader.addEventListener("touchstart", onTouchStart, { passive: true });
  els.reader.addEventListener("touchmove", onTouchMove, { passive: false });
  els.reader.addEventListener("touchend", onTouchEnd, { passive: true });

  // Don't drift while the tab is hidden.
  document.addEventListener("visibilitychange", () => {
    if (document.hidden) pauseAutoScroll();
    else nudgeAutoScroll();
  });

  resumeAutoScroll();
}
