// status.js — the breathing loader / error surface

import { els } from "./dom.js";

export function showStatus(text, onRetry) {
  els.statusText.textContent = text;
  els.status.classList.remove("gone");

  const existing = els.status.querySelector(".retry");
  if (existing) existing.remove();

  if (onRetry) {
    const btn = document.createElement("button");
    btn.className = "retry";
    btn.textContent = "Try again";
    btn.addEventListener("click", onRetry);
    els.status.appendChild(btn);
  }
}

export function hideStatus() {
  els.status.classList.add("gone");
}
