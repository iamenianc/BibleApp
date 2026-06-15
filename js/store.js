// store.js — last-read persistence (localStorage, fail-soft)

import { STORE_KEY, DEFAULT_START } from "./config.js";

export function saveLast(ref) {
  try {
    localStorage.setItem(STORE_KEY, JSON.stringify(ref));
  } catch (_) {
    /* private mode / quota — ignore */
  }
}

export function loadLast() {
  try {
    const saved = JSON.parse(localStorage.getItem(STORE_KEY));
    if (saved && saved.book && saved.chapter) return saved;
  } catch (_) {
    /* corrupt or unavailable — fall through */
  }
  return { ...DEFAULT_START };
}
