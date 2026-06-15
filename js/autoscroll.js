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
let carry = 0;           // sub-pixel remainder, so slow speeds still accrue
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

  carry += AUTOSCROLL_SPEED * eased * dt;
  const step = Math.floor(carry);
  if (step >= 1) {
    carry -= step;
    const el = els.reader;
    const max = el.scrollHeight - el.clientHeight;
    const next = Math.min(max, el.scrollTop + step);
    el.scrollTop = next;
    lastTop = next; // mark this as our own write, not a manual scroll
  }

  rafId = requestAnimationFrame(frame);
}

function startLoop() {
  if (rafId != null) return;
  lastT = 0;
  rampStart = performance.now();
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
 * AUTOSCROLL_RESUME_DELAY. Called on every interaction (tap, drag, menu).
 */
export function nudgeAutoScroll() {
  if (!enabled) return;
  running = false;
  stopLoop();
  clearTimeout(resumeTimer);
  resumeTimer = setTimeout(resumeAutoScroll, AUTOSCROLL_RESUME_DELAY);
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

  // A hand on the page (drag / wheel) pauses and schedules a graceful resume.
  els.reader.addEventListener("scroll", onManualScroll, { passive: true });
  els.reader.addEventListener("wheel", nudgeAutoScroll, { passive: true });
  els.reader.addEventListener("pointerdown", nudgeAutoScroll, { passive: true });

  // Don't drift while the tab is hidden.
  document.addEventListener("visibilitychange", () => {
    if (document.hidden) pauseAutoScroll();
    else nudgeAutoScroll();
  });

  resumeAutoScroll();
}
