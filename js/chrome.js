// chrome.js — auto-hiding top/bottom bars driven by scroll & taps

import { els } from "./dom.js";
import { UI_HIDE_DELAY } from "./config.js";

let hideTimer = null;
let lastScroll = 0;

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
  const y = window.scrollY;
  if (Math.abs(y - lastScroll) > 4) {
    // upward intent reveals; any downward reading motion hides
    if (y < lastScroll - 8) revealUI();
    else hideUI();
  }
  lastScroll = y;
}

/** Tap in the reading area toggles chrome (ignores footnote taps). */
function onReaderClick(e) {
  if (e.target.classList.contains("fn")) return;
  if (els.topbar.classList.contains("hidden")) revealUI();
  else hideUI();
}

export function initChrome() {
  window.addEventListener("scroll", onScroll, { passive: true });
  els.reader.addEventListener("click", onReaderClick);
}
