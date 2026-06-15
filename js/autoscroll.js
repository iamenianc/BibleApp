// autoscroll.js — gentle, continuous forward scroll
//
// The reader drifts forward on its own at a very slow rate. It pauses the
// moment the screen is touched (to reveal a verse or the menu) or the reader
// scrolls by hand, then resumes automatically and gracefully after a short
// quiet period, easing back up to speed rather than jerking into motion.

import { els } from "./dom.js";
import {
  AUTOSCROLL_SPEED,
  AUTOSCROLL_RESUME_DELAY,
  AUTOSCROLL_RAMP,
} from "./config.js";

let running = false;     // the rAF loop is active and allowed to move
let rafId = null;
let lastT = 0;           // timestamp of the previous frame
let rampStart = 0;       // when the current motion began, for ease-in
let resumeTimer = null;
let pos = 0;             // fractional scroll position we drive, for sub-pixel smoothness
let lastTop = 0;         // last scrollTop we wrote, to detect manual scrolling
let enabled = false;     // master switch (off until started)

function frame(t) {
  if (!running) return;
  if (!lastT) lastT = t;
  const dt = (t - lastT) / 1000; // seconds since last frame
  lastT = t;

  // Ease in from a standstill so resuming is graceful, not abrupt.
  const elapsed = t - rampStart;
  const ramp = Math.min(1, elapsed / AUTOSCROLL_RAMP);
  const eased = ramp * ramp * (3 - 2 * ramp); // smoothstep

  pos += AUTOSCROLL_SPEED * eased * dt;
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

function onManualScroll() {
  // Ignore the scroll events our own loop generates; react only to the reader
  // moving the page by hand (wheel, drag, momentum).
  if (Math.abs(els.reader.scrollTop - lastTop) <= 2) return;
  nudgeAutoScroll();
}

export function initAutoScroll() {
  enabled = true;
  lastTop = els.reader.scrollTop;

  // A finger/mouse down freezes the drift at once, so no programmatic scroll
  // writes happen mid-gesture (those would corrupt tap detection and the
  // menu-reveal tap). We don't schedule a resume here — that's owned by the
  // gesture's outcome: a drag resumes fast via the scroll handler below, a
  // deliberate tap resumes after a longer dwell via verses.js.
  els.reader.addEventListener("pointerdown", pauseAutoScroll, { passive: true });

  // A hand on the page (drag / wheel) pauses, then resumes almost instantly.
  els.reader.addEventListener("scroll", onManualScroll, { passive: true });
  els.reader.addEventListener("wheel", () => nudgeAutoScroll(), { passive: true });

  // Don't drift while the tab is hidden.
  document.addEventListener("visibilitychange", () => {
    if (document.hidden) pauseAutoScroll();
    else nudgeAutoScroll();
  });

  resumeAutoScroll();
}
