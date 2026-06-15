// app.js — composition root: wires modules together and boots the reader

import { els } from "./dom.js";
import { fetchBooks, fetchChapter } from "./api.js";
import { saveLast, loadLast } from "./store.js";
import { initChrome, revealUI } from "./chrome.js";
import { initFeed, startFeed } from "./scroll.js";
import { openBooks, closeOverlay } from "./picker.js";
import { initSettings } from "./settings.js";
import { showStatus, hideStatus } from "./status.js";
import { registerSW } from "./pwa.js";
import { initTextSize } from "./textsize.js";
import { initVerseReveal } from "./verses.js";
import { initAutoScroll, nudgeAutoScroll } from "./autoscroll.js";
import { initPinchZoom } from "./pinchzoom.js";
import { initAudio, setAudioChapter } from "./audio.js";

let books = [];

/** Jump to a specific chapter (from the picker), starting a fresh feed. */
async function goTo(bookId, chapter) {
  showStatus("…");
  try {
    const data = await fetchChapter(bookId, chapter);
    startFeed(data);
    const name = data.book.commonName || data.book.name || bookId;
    els.ref.textContent = `${name} ${data.chapter.number}`;
    setAudioChapter(data.book.id, data.chapter.number);
    saveLast({ book: data.book.id, chapter: data.chapter.number });
    hideStatus();
    revealUI();
    nudgeAutoScroll(); // begin drifting the fresh chapter after a quiet beat
  } catch (err) {
    console.error(err);
    showStatus("Couldn't load that chapter", () => goTo(bookId, chapter));
  }
}

function wireEvents() {
  initChrome();
  initTextSize();
  initSettings();
  initVerseReveal();
  initAudio();
  // live-update the reference and remembered position as chapters scroll past
  initFeed(books, ({ book, bookName, chapter }) => {
    els.ref.textContent = `${bookName} ${chapter}`;
    setAudioChapter(book, Number(chapter));
    saveLast({ book, chapter: Number(chapter) });
  });

  els.ref.addEventListener("click", () => openBooks(books, goTo));
  els.overlayClose.addEventListener("click", closeOverlay);

  // Gentle auto-scroll, once the feed is live.
  initAutoScroll();
  // Two-finger pinch to step through reading sizes.
  initPinchZoom();

  window.addEventListener("keydown", (e) => {
    if (els.overlay.classList.contains("open") && e.key === "Escape") {
      closeOverlay();
    }
  });
}

async function init() {
  showStatus("Opening the Word");
  try {
    books = await fetchBooks();
    const start = loadLast();
    wireEvents();
    await goTo(start.book, start.chapter);
  } catch (err) {
    console.error(err);
    showStatus("Couldn't reach the library", init);
  }
}

registerSW();
init();
