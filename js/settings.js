// settings.js — config bar that slides in 2 s after the TOC opens

import { els } from "./dom.js";
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
  const pace = getUserPace();
  els.cfgPaceWrap.querySelectorAll(".cfg-pace").forEach((btn) => {
    btn.classList.toggle("active", Number(btn.dataset.pace) === pace);
  });
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

  els.cfgPaceWrap.addEventListener("click", (e) => {
    const btn = e.target.closest(".cfg-pace");
    if (!btn) return;
    setUserPace(Number(btn.dataset.pace));
    refreshPace();
  });
}
