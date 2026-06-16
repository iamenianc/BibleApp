// scroll.js — seamless forward infinite scroll
//
// Appends the next chapter as you approach the bottom, prefetches one chapter
// ahead so appends are instant, and keeps the top reference in sync with
// whichever chapter is currently in the reading band.

import { els } from "./dom.js";
import { fetchByApiLink, prefetch } from "./api.js";
import { buildChapter } from "./render.js";
import { setReadingRef } from "./chrome.js";

let books = [];
let onRefChange = null;

let loading = false; // guard against concurrent appends
let nextLink = null; // API link of the chapter to append next (null at canon end)
let bandObserver = null; // tracks which chapter section is centered
let refRaf = 0; // pending rAF for the visible-range readout

// Load more when the viewport bottom is within this many px of content end.
const NEAR_BOTTOM = 1200;

// The readable band, as fractions of the viewport height: a narrow strip around
// the reading zone, clear of the faded top and bottom edges (see the #reader
// mask in reader.css). The orientation bar reports only the verses inside it, so
// the range stays tight and never claims faded, barely-legible lines.
const BAND_TOP = 0.24;
const BAND_BOTTOM = 0.5;

/** Coalesce range recomputes to one per frame — steady, never thrashing. */
function scheduleRefUpdate() {
  if (refRaf) return;
  refRaf = requestAnimationFrame(() => {
    refRaf = 0;
    updateVisibleRef();
  });
}

/** Recompute the orientation bar from the verses inside the readable band. */
export function refreshReadingRef() {
  scheduleRefUpdate();
}

function updateVisibleRef() {
  const h = els.reader.clientHeight;
  const top = h * BAND_TOP;
  const bottom = h * BAND_BOTTOM;

  let first = null;
  let last = null;
  for (const sec of els.reader.children) {
    if (!(sec instanceof HTMLElement) || !sec.classList.contains("chapter")) continue;
    const sr = sec.getBoundingClientRect();
    if (sr.bottom < top) continue; // section sits above the band
    if (sr.top > bottom) break;    // this and every later section sit below it
    for (const v of sec.querySelectorAll(".verse")) {
      const r = v.getBoundingClientRect();
      if (r.bottom < top || r.top > bottom) continue;
      if (!first) first = v;
      last = v;
    }
  }
  if (!first) return; // nothing rendered in the band yet

  const firstSec = first.closest(".chapter");
  const lastSec = last.closest(".chapter");
  const start = `${firstSec.dataset.chapter}:${first.dataset.verse}`;
  const end = `${lastSec.dataset.chapter}:${last.dataset.verse}`;
  setReadingRef({
    bookName: firstSec.dataset.bookName,
    range: start === end ? start : `${start} – ${end}`,
  });
}

/** Reset the feed to a single freshly-rendered chapter (e.g. picker jump). */
export function startFeed(data) {
  els.reader.innerHTML = "";
  loading = false;
  if (bandObserver) bandObserver.disconnect();
  bandObserver = makeBandObserver();

  appendSection(data);
  els.reader.scrollTop = 0;
  scheduleRefUpdate(); // seed the orientation bar for the fresh chapter
}

export function initFeed(bookList, refCallback) {
  books = bookList;
  onRefChange = refCallback;
  els.reader.addEventListener("scroll", onScroll, { passive: true });
}

function appendSection(data) {
  const section = buildChapter(data, books);
  els.reader.appendChild(section);

  nextLink = data.nextChapterApiLink || null;
  prefetch(nextLink); // warm the chapter after this one

  bandObserver.observe(section);
  return section;
}

async function loadNext() {
  if (loading || !nextLink) return;
  loading = true;
  const link = nextLink;
  try {
    const data = await fetchByApiLink(link);
    // guard: only append if still the expected next link
    if (nextLink === link) appendSection(data);
  } catch (err) {
    console.error("seamless load failed:", err);
  } finally {
    loading = false;
  }
}

function onScroll() {
  const el = els.reader;
  const remaining = el.scrollHeight - el.scrollTop - el.clientHeight;
  if (remaining < NEAR_BOTTOM) loadNext();
  scheduleRefUpdate(); // keep the orientation bar tracking what's on screen
}

/** Update the top reference when a chapter crosses into the reading band. */
function makeBandObserver() {
  return new IntersectionObserver(
    (entries) => {
      // pick the entry whose top is nearest the band line and is intersecting
      const visible = entries
        .filter((e) => e.isIntersecting)
        .map((e) => e.target);
      if (!visible.length || !onRefChange) return;
      // the last visible section in document order is the one we've scrolled into
      const current = visible[visible.length - 1];
      onRefChange({
        book: current.dataset.book,
        bookName: current.dataset.bookName,
        chapter: current.dataset.chapter,
      });
    },
    {
      root: els.reader,
      // a thin band near the top third of the viewport defines "current"
      rootMargin: "-15% 0px -75% 0px",
      threshold: 0,
    }
  );
}
