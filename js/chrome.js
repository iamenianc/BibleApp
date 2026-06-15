// chrome.js — top/bottom bars that auto-show when scrolling pauses, then fade out
//
// Tapping text is reserved for verse reveal (see verses.js); it never toggles
// the bars. The bars surface briefly whenever scrolling stops.

import { els } from "./dom.js";
import { UI_HIDE_DELAY } from "./config.js";

let hideTimer = null;
let scrollIdleTimer = null;

export function revealUI() {
  els.topbar.classList.remove("hidden");
  els.footnav.classList.remove("hidden");
  clearTimeout(hideTimer);
  hideTimer = setTimeout(hideUI, UI_HIDE_DELAY);
}

export function hideUI() {
  if (els.overlay.classList.contains("open")) return; // keep chrome while picking
  els.topbar.classList.add("hidden");
  els.footnav.classList.add("hidden");
}

function onScroll() {
  // hide promptly while actively scrolling...
  hideUI();
  // ...and surface the bars briefly once motion stops
  clearTimeout(scrollIdleTimer);
  scrollIdleTimer = setTimeout(revealUI, 220);
}

export function initChrome() {
  // #reader is the scroll container (see reader.css), not the window
  els.reader.addEventListener("scroll", onScroll, { passive: true });
}
