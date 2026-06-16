// settings.js — config bar that slides in 2 s after the TOC opens

import { els } from "./dom.js";
import { keepUIAlive } from "./chrome.js";
import { getTextLevel, textLevelDown, textLevelUp } from "./textsize.js";
import { getUserPace, setUserPace } from "./autoscroll.js";

const LEVELS_TOTAL = 9;
let barTimer = null;

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

// ── Top-bar speed mode ──────────────────────────────────────────
// Tapping the speed button transforms the top bar into a big auto-scroll speed
// slider; "Done" returns it to the normal bar.
function syncTopbarSpeed() {
  const pct = getUserPace();
  els.topbarSpeedSlider.value = String(pct);
  els.topbarSpeedVal.textContent = pct === 0 ? "Off" : `${pct}%`;
}

function openSpeedMode() {
  syncTopbarSpeed();
  els.topbar.classList.add("speed-mode");
  els.topbarSpeed.setAttribute("aria-hidden", "false");
  keepUIAlive(600000); // hold the bar open while the slider is up
}

export function closeSpeedMode() {
  if (!els.topbar.classList.contains("speed-mode")) return;
  els.topbar.classList.remove("speed-mode");
  els.topbarSpeed.setAttribute("aria-hidden", "true");
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

  // Tap the speed button → bar becomes a big speed slider; Done closes it.
  els.speedBtn.addEventListener("click", openSpeedMode);
  els.topbarSpeedDone.addEventListener("click", closeSpeedMode);
  els.topbarSpeedSlider.addEventListener("input", () => {
    setUserPace(Number(els.topbarSpeedSlider.value));
    syncTopbarSpeed();
    refreshPace(); // keep the settings-panel slider in sync
  });
}
