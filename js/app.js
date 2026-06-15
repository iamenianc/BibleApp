// app.js — composition root: wires modules together and boots the reader

import { els } from "./dom.js";
import { fetchBooks, fetchChapter } from "./api.js";
import { saveLast, loadLast } from "./store.js";
import { renderChapter } from "./render.js";
import { setupFade } from "./fade.js";
import { initChrome, revealUI } from "./chrome.js";
import { openBooks, closeOverlay } from "./picker.js";
import { showStatus, hideStatus } from "./status.js";
import { registerSW } from "./pwa.js";
import { initTextSize } from "./textsize.js";
import { initVerseReveal, resetReveal } from "./verses.js";

let books = [];
let chapterData = null; // most recent chapter payload (holds prev/next links)

/** Load, render, and remember a chapter. */
async function loadChapter(bookId, chapter) {
  showStatus("…");
  try {
    const data = await fetchChapter(bookId, chapter);
    chapterData = data;
    resetReveal();

    const bookName = renderChapter(data, books);
    els.ref.textContent = `${bookName} ${data.chapter.number}`;

    els.prev.disabled = !data.previousChapterApiLink;
    els.next.disabled = !data.nextChapterApiLink;

    setupFade();
    window.scrollTo(0, 0);

    saveLast({ book: data.book.id, chapter: data.chapter.number });
    hideStatus();
    revealUI();
  } catch (err) {
    console.error(err);
    showStatus("Couldn't load that chapter", () =>
      loadChapter(bookId, chapter)
    );
  }
}

/** Parse an API link like /api/BSB/GEN/2.json and navigate to it. */
function navByApiLink(link) {
  if (!link) return;
  const m = link.match(/\/([A-Z0-9]+)\/(\d+)\.json/);
  if (m) loadChapter(m[1], parseInt(m[2], 10));
}

function wireEvents() {
  initChrome();
  initTextSize();
  initVerseReveal();

  els.ref.addEventListener("click", () => openBooks(books, loadChapter));
  els.overlayClose.addEventListener("click", closeOverlay);

  els.prev.addEventListener("click", () =>
    navByApiLink(chapterData && chapterData.previousChapterApiLink)
  );
  els.next.addEventListener("click", () =>
    navByApiLink(chapterData && chapterData.nextChapterApiLink)
  );

  window.addEventListener("keydown", (e) => {
    if (els.overlay.classList.contains("open")) {
      if (e.key === "Escape") closeOverlay();
      return;
    }
    if (e.key === "ArrowRight") els.next.click();
    if (e.key === "ArrowLeft") els.prev.click();
  });
}

async function init() {
  showStatus("Opening the Word");
  try {
    books = await fetchBooks();
    const start = loadLast();
    await loadChapter(start.book, start.chapter);
  } catch (err) {
    console.error(err);
    showStatus("Couldn't reach the library", init);
  }
}

registerSW();
wireEvents();
init();
