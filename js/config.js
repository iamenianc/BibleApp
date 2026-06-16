// config.js — single source of app constants

export const API_BASE = "https://bible.helloao.org/api";
export const TRANSLATION = "BSB";
export const STORE_KEY = "theword:last";

// Where a first-time reader begins.
export const DEFAULT_START = { book: "JHN", chapter: 1 };

// Auto-hide chrome after this idle period (ms).
export const UI_HIDE_DELAY = 2200;

// Gentle automatic forward scroll.
// The base speed is tuned for the SMALLEST text size. As the reading size
// grows, the drift speeds up faster than the font size (the ratio is raised to
// AUTOSCROLL_SPEED_EXP), so small sizes stay gentle while the largest levels
// accelerate noticeably. The multiplier is still capped at AUTOSCROLL_MAX_MULT.
export const AUTOSCROLL_SPEED = 20;      // px per second at the smallest size
export const AUTOSCROLL_SPEED_MIN = 16;  // floor: never drift slower than this (px/s) while moving
export const AUTOSCROLL_SPEED_EXP = 2;  // >1 makes large sizes scroll steeper than the raw font ratio
export const AUTOSCROLL_MAX_MULT = 9;    // safety ceiling on the size multiplier
export const AUTOSCROLL_RESUME_DELAY = 500;  // ms of quiet before resuming after a manual scroll — almost instant
export const AUTOSCROLL_TAP_DELAY = 4000;    // ms to stay paused after a deliberate tap/click, so the reader can dwell on a verse
export const AUTOSCROLL_RAMP = 500;      // ms to ease from a standstill up to full speed

// Manual mouse-wheel scrolling. The reader intercepts the wheel and applies
// this multiplier to each notch, so spinning the wheel inches the text along
// very slowly rather than jumping a screenful at a time. 1 = browser default.
export const WHEEL_SENSITIVITY = 0.25;

// Manual finger (touch) scrolling. Native touch scrolling is disabled so the
// reader can drive the drift itself; this multiplier applies to each touchmove
// delta. Near 1 keeps dragging close to 1:1 so the page follows the finger
// naturally, while the wheel above stays slowed.
export const TOUCH_SENSITIVITY = 0.9;

// After the finger lifts, the page keeps gliding and slows exponentially.
// DECAY is the per-millisecond falloff: lower = more inertia, a longer and
// gentler glide (closer to native momentum); higher stops sooner. STOP is the
// velocity (px/ms) at which the glide is considered finished — a small value
// lets the tail ease all the way out instead of cutting off abruptly.
export const TOUCH_MOMENTUM_DECAY = 0.0014;
export const TOUCH_MOMENTUM_STOP = 0.004;

// Speed limit on the launch velocity of the release glide, in screen-heights
// per second. Even a violent flick is clamped to this, so momentum can never go
// "hyperspeed" and rocket through multiple chapters at once. Expressed relative
// to the viewport so it feels the same on any device size. With the decay above,
// a cap of N screens/s lets a flick coast at most ~N/(1000*DECAY) screens.
export const TOUCH_MOMENTUM_MAX_SCREENS_PER_S = 2.5;

// Floor on the launch velocity (same screen-heights-per-second units). Once a
// gesture counts as a flick at all, momentum starts at least this fast so even
// the tiniest flick produces a slight, satisfying glide instead of just bumping
// the page a fraction and stopping. A still tap stays below the flick threshold
// and is unaffected.
export const TOUCH_MOMENTUM_MIN_SCREENS_PER_S = 0.4;

// The launch speed isn't a straight clamp of the finger velocity — after
// sensitivity scaling and smoothing, almost every flick lands above the cap, so
// a plain clamp made gentle and violent flicks feel identical. Instead the
// finger velocity is mapped through a saturating curve between the floor and cap
// (speed = min + (max-min)·(1 - e^(-|v|/scale))). This SCALE (screen-heights per
// second) sets how quickly the curve climbs: a flick at SCALE reaches ~63% of
// the way to the cap. Larger = more of the range spent climbing, so the spread
// between a soft and a hard flick is wider. The cap is now only approached
// asymptotically, so even a violent flick can't exceed it.
export const TOUCH_MOMENTUM_VEL_SCALE_SCREENS_PER_S = 3.0;

// Books whose verse numbers are always shown (not tap-to-reveal).
export const ALWAYS_NUMBERED_BOOKS = ["PRO"];

// Conventional short reference abbreviations, keyed by the API's 3-letter book
// id. Used for the verse tooltip (e.g. "Rom 1:16"). Falls back to the id if a
// book isn't listed.
export const BOOK_ABBREV = {
  GEN: "Gen", EXO: "Exod", LEV: "Lev", NUM: "Num", DEU: "Deut",
  JOS: "Josh", JDG: "Judg", RUT: "Ruth", "1SA": "1 Sam", "2SA": "2 Sam",
  "1KI": "1 Kgs", "2KI": "2 Kgs", "1CH": "1 Chr", "2CH": "2 Chr",
  EZR: "Ezra", NEH: "Neh", EST: "Esth", JOB: "Job", PSA: "Ps",
  PRO: "Prov", ECC: "Eccl", SNG: "Song", ISA: "Isa", JER: "Jer",
  LAM: "Lam", EZK: "Ezek", DAN: "Dan", HOS: "Hos", JOL: "Joel",
  AMO: "Amos", OBA: "Obad", JON: "Jonah", MIC: "Mic", NAM: "Nah",
  HAB: "Hab", ZEP: "Zeph", HAG: "Hag", ZEC: "Zech", MAL: "Mal",
  MAT: "Matt", MRK: "Mark", LUK: "Luke", JHN: "John", ACT: "Acts",
  ROM: "Rom", "1CO": "1 Cor", "2CO": "2 Cor", GAL: "Gal", EPH: "Eph",
  PHP: "Phil", COL: "Col", "1TH": "1 Thess", "2TH": "2 Thess",
  "1TI": "1 Tim", "2TI": "2 Tim", TIT: "Titus", PHM: "Phlm", HEB: "Heb",
  JAS: "Jas", "1PE": "1 Pet", "2PE": "2 Pet", "1JN": "1 John",
  "2JN": "2 John", "3JN": "3 John", JUD: "Jude", REV: "Rev",
};

// Full book names keyed by the API's 3-letter id, in canonical order, for easy
// reference. (The live list still comes from the API; this mirrors it.)
export const BOOK_NAMES = {
  GEN: "Genesis", EXO: "Exodus", LEV: "Leviticus", NUM: "Numbers",
  DEU: "Deuteronomy", JOS: "Joshua", JDG: "Judges", RUT: "Ruth",
  "1SA": "1 Samuel", "2SA": "2 Samuel", "1KI": "1 Kings", "2KI": "2 Kings",
  "1CH": "1 Chronicles", "2CH": "2 Chronicles", EZR: "Ezra", NEH: "Nehemiah",
  EST: "Esther", JOB: "Job", PSA: "Psalms", PRO: "Proverbs",
  ECC: "Ecclesiastes", SNG: "Song of Songs", ISA: "Isaiah", JER: "Jeremiah",
  LAM: "Lamentations", EZK: "Ezekiel", DAN: "Daniel", HOS: "Hosea",
  JOL: "Joel", AMO: "Amos", OBA: "Obadiah", JON: "Jonah", MIC: "Micah",
  NAM: "Nahum", HAB: "Habakkuk", ZEP: "Zephaniah", HAG: "Haggai",
  ZEC: "Zechariah", MAL: "Malachi", MAT: "Matthew", MRK: "Mark",
  LUK: "Luke", JHN: "John", ACT: "Acts", ROM: "Romans",
  "1CO": "1 Corinthians", "2CO": "2 Corinthians", GAL: "Galatians",
  EPH: "Ephesians", PHP: "Philippians", COL: "Colossians",
  "1TH": "1 Thessalonians", "2TH": "2 Thessalonians", "1TI": "1 Timothy",
  "2TI": "2 Timothy", TIT: "Titus", PHM: "Philemon", HEB: "Hebrews",
  JAS: "James", "1PE": "1 Peter", "2PE": "2 Peter", "1JN": "1 John",
  "2JN": "2 John", "3JN": "3 John", JUD: "Jude", REV: "Revelation",
};
