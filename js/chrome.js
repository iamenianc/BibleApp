// chrome.js — top bar that reveals on a tap near the top edge, then fades out
//
// Scrolling never reveals the bar (it only hides it). The bar surfaces only
// when the reader deliberately taps the top strip of the screen. Tapping text
// elsewhere is reserved for verse reveal (see verses.js).

import { els } from "./dom.js";
import { UI_HIDE_DELAY } from "./config.js";

// Tap is allowed only within this band below the top edge.
const TOP_TAP_ZONE = 120; // px
// Mirror verses.js so a swipe near the top isn't mistaken for a tap.
const MOVE_TOLERANCE = 10; // px
const TIME_TOLERANCE = 500; // ms

let hideTimer = null;
let interactUntil = 0; // timestamp; while in the future, the bar stays put

let tapStartX = 0;
let tapStartY = 0;
let tapStartT = 0;
let tapMoved = false;

export function revealUI() {
  els.topbar.classList.remove("hidden");
  clearTimeout(hideTimer);
  hideTimer = setTimeout(hideUI, UI_HIDE_DELAY);
}

export function hideUI() {
  if (els.overlay.classList.contains("open")) return; // keep chrome while picking
  if (Date.now() < interactUntil) return; // keep chrome while using the controls
  els.topbar.classList.add("hidden");
}

// Called while the reader is actively using a chrome control (e.g. text size).
// Holds the bar open for `ms`, then schedules the normal fade-out.
export function keepUIAlive(ms = UI_HIDE_DELAY) {
  interactUntil = Date.now() + ms;
  els.topbar.classList.remove("hidden");
  clearTimeout(hideTimer);
  hideTimer = setTimeout(hideUI, ms);
}

function onScroll() {
  // scrolling only hides the bar; it never brings it back
  hideUI();
}

function onTapStart(e) {
  const p = e.touches ? e.touches[0] : e;
  tapStartX = p.clientX;
  tapStartY = p.clientY;
  tapStartT = Date.now();
  tapMoved = false;
}

function onTapMove(e) {
  const p = e.touches ? e.touches[0] : e;
  if (
    Math.abs(p.clientX - tapStartX) > MOVE_TOLERANCE ||
    Math.abs(p.clientY - tapStartY) > MOVE_TOLERANCE
  ) {
    tapMoved = true;
  }
}

function onTapEnd() {
  if (tapMoved || Date.now() - tapStartT > TIME_TOLERANCE) return; // scroll/drag
  if (tapStartY > TOP_TAP_ZONE) return; // only taps near the top edge reveal
  revealUI();
}

export function initChrome() {
  // #reader is the scroll container (see reader.css), not the window
  els.reader.addEventListener("scroll", onScroll, { passive: true });

  // Reveal only on a deliberate tap within the top strip of the screen.
  els.reader.addEventListener("pointerdown", onTapStart, { passive: true });
  els.reader.addEventListener("pointermove", onTapMove, { passive: true });
  els.reader.addEventListener("pointerup", onTapEnd, { passive: true });
}
