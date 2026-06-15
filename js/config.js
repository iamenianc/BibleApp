// config.js — single source of app constants

export const API_BASE = "https://bible.helloao.org/api";
export const TRANSLATION = "BSB";
export const STORE_KEY = "theword:last";

// Where a first-time reader begins.
export const DEFAULT_START = { book: "JHN", chapter: 1 };

// Auto-hide chrome after this idle period (ms).
export const UI_HIDE_DELAY = 2200;

// Gentle automatic forward scroll.
export const AUTOSCROLL_SPEED = 12;       // px per second at full speed
export const AUTOSCROLL_RESUME_DELAY = 150;  // ms of quiet before resuming after a manual scroll — almost instant
export const AUTOSCROLL_TAP_DELAY = 4000;    // ms to stay paused after a deliberate tap/click, so the reader can dwell on a verse
export const AUTOSCROLL_RAMP = 600;      // ms to ease from a standstill up to full speed

// Books whose verse numbers are always shown (not tap-to-reveal).
export const ALWAYS_NUMBERED_BOOKS = ["PRO"];
