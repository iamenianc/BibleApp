// scroll.js — seamless forward infinite scroll
//
// Appends the next chapter as you approach the bottom, prefetches one chapter
// ahead so appends are instant, and keeps the top reference in sync with
// whichever chapter is currently in the reading band.

import { els } from "./dom.js";
import { fetchByApiLink, prefetch } from "./api.js";
import { buildChapter } from "./render.js";

let books = [];
let onRefChange = null;

let loading = false; // guard against concurrent appends
let nextLink = null; // API link of the chapter to append next (null at canon end)
let bandObserver = null; // tracks which chapter section is centered

// Load more when the viewport bottom is within this many px of content end.
const NEAR_BOTTOM = 1200;

/** Reset the feed to a single freshly-rendered chapter (e.g. picker jump). */
export function startFeed(data) {
  els.reader.innerHTML = "";
  loading = false;
  if (bandObserver) bandObserver.disconnect();
  bandObserver = makeBandObserver();

  appendSection(data);
  els.reader.scrollTop = 0;
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
        verses: current.dataset.verses,
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
