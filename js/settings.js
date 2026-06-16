// settings.js — config bar that slides in 2 s after the TOC opens

import { els } from "./dom.js";
import { keepUIAlive } from "./chrome.js";
import { getTextLevel, textLevelDown, textLevelUp } from "./textsize.js";
import { getUserPace, setUserPace, PACE_MIN, PACE_MAX } from "./autoscroll.js";

const LEVELS_TOTAL = 9;
let barTimer = null;

// Speed dial geometry + feel. The arc spans the full pace range; vertical drag
// drives it at DIAL_SENS percent per pixel (so ~PACE_MAX/DIAL_SENS px of travel
// sweeps the whole range).
const DIAL_R = 52;
const DIAL_C = 2 * Math.PI * DIAL_R;
const DIAL_SENS = 1.0; // percent per px of upward drag

function refreshSize() {
  const lvl = getTextLevel();
  els.cfgSizeVal.textContent = `${lvl} / ${LEVELS_TOTAL}`;
  els.cfgSizeDown.disabled = lvl <= 1;
  els.cfgSizeUp.disabled = lvl >= LEVELS_TOTAL;
}

function refreshPace() {
  const pct = getUserPace();
  els.cfgPaceSlider.value = String(pct);
  els.cfgPaceVal.textContent = pct === 0 ? "Off" : `${pct}%`;
}

// Step the auto-scroll speed by `delta` percent and reflect it on the slider.
// Exposed so external controls (e.g. keyboard) can drive it too.
export function nudgePace(delta) {
  setUserPace(getUserPace() + delta);
  refreshPace();
}

// ── Hold-to-set speed dial (top-bar speed button) ───────────────
// Press and hold the speed button to raise a dial, drag up/down to set the
// pace live, release to dismiss. The button captures the pointer so the drag
// keeps tracking even as the finger moves onto the dial.
let dialActive = false;
let dialStartY = 0;
let dialStartPct = 0;

function updateDial() {
  const pct = getUserPace();
  const f = (pct - PACE_MIN) / (PACE_MAX - PACE_MIN);
  els.speedDialArc.style.strokeDasharray = String(DIAL_C);
  els.speedDialArc.style.strokeDashoffset = String(DIAL_C * (1 - f));
  els.speedDialVal.textContent = pct === 0 ? "Off" : `${pct}%`;
}

function onDialDown(e) {
  e.preventDefault();
  dialActive = true;
  dialStartY = e.clientY;
  dialStartPct = getUserPace();
  try { els.speedBtn.setPointerCapture(e.pointerId); } catch (_) { /* ignore */ }
  els.speedDial.classList.add("visible");
  els.speedDial.setAttribute("aria-hidden", "false");
  updateDial();
  keepUIAlive(600000); // hold the top bar open for as long as the dial is up
}

function onDialMove(e) {
  if (!dialActive) return;
  const dy = dialStartY - e.clientY; // drag up = faster
  setUserPace(dialStartPct + dy * DIAL_SENS);
  updateDial();
  refreshPace(); // keep the settings slider in sync
}

function onDialUp(e) {
  if (!dialActive) return;
  dialActive = false;
  try { els.speedBtn.releasePointerCapture(e.pointerId); } catch (_) { /* ignore */ }
  els.speedDial.classList.remove("visible");
  els.speedDial.setAttribute("aria-hidden", "true");
  keepUIAlive(); // back to the normal fade-out
}

function openPanel() {
  refreshSize();
  refreshPace();
  els.configPanel.classList.add("open");
  els.configPanel.setAttribute("aria-hidden", "false");
  els.configBar.setAttribute("aria-expanded", "true");
}

function closePanel() {
  els.configPanel.classList.remove("open");
  els.configPanel.setAttribute("aria-hidden", "true");
  els.configBar.setAttribute("aria-expanded", "false");
}

function togglePanel() {
  if (els.configPanel.classList.contains("open")) closePanel();
  else openPanel();
}

export function showConfigBar() {
  clearTimeout(barTimer);
  barTimer = setTimeout(() => els.configBar.classList.add("visible"), 2000);
}

export function hideConfigBar() {
  clearTimeout(barTimer);
  els.configBar.classList.remove("visible");
  closePanel();
}

export function initSettings() {
  els.configBar.addEventListener("click", togglePanel);
  els.configBar.addEventListener("keydown", (e) => {
    if (e.key === "Enter" || e.key === " ") { e.preventDefault(); togglePanel(); }
  });

  els.cfgSizeDown.addEventListener("click", () => { textLevelDown(); refreshSize(); });
  els.cfgSizeUp.addEventListener("click", () => { textLevelUp(); refreshSize(); });

  els.cfgPaceSlider.addEventListener("input", () => {
    setUserPace(Number(els.cfgPaceSlider.value));
    refreshPace();
  });

  // Hold-and-drag speed dial on the top-bar speed button.
  els.speedBtn.addEventListener("pointerdown", onDialDown);
  els.speedBtn.addEventListener("pointermove", onDialMove);
  els.speedBtn.addEventListener("pointerup", onDialUp);
  els.speedBtn.addEventListener("pointercancel", onDialUp);
}
