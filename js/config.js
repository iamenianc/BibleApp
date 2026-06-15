// config.js — single source of app constants

export const API_BASE = "https://bible.helloao.org/api";
export const TRANSLATION = "BSB";
export const STORE_KEY = "theword:last";

// Where a first-time reader begins.
export const DEFAULT_START = { book: "JHN", chapter: 1 };

// Auto-hide chrome after this idle period (ms).
export const UI_HIDE_DELAY = 2200;

// Books whose verse numbers are always shown (not tap-to-reveal).
export const ALWAYS_NUMBERED_BOOKS = ["PRO"];
