// picker.js — full-screen book → chapter selector

import { els } from "./dom.js";
import { revealUI } from "./chrome.js";
import { pauseAutoScroll, nudgeAutoScroll } from "./autoscroll.js";
import { showConfigBar, hideConfigBar } from "./settings.js";

// Books with order <= 39 are the Old Testament in the 66-book canon.
const OT_MAX_ORDER = 39;

// The chapter currently in the reading band, echoed on the picker's bottom bar:
// book name on the left, verse range (chapter:1 – chapter:last) on the right.
let readingRef = { bookName: "", chapter: "", verses: 0 };

function paintRefBar() {
  const { bookName, chapter, verses } = readingRef;
  els.cfgRefBook.textContent = bookName || "";
  const last = Number(verses) || 0;
  els.cfgRefRange.textContent =
    chapter && last ? `${chapter}:1 – ${chapter}:${last}` : "";
}

/** Track the chapter being read so the picker bar can show its reference. */
export function setReadingRef(ref) {
  readingRef = { ...readingRef, ...ref };
  paintRefBar();
}

function clearList() {
  els.pickerList.innerHTML = "";
}

export function closeOverlay() {
  els.overlay.classList.remove("open");
  hideConfigBar();
  // Re-arm the top bar's fade-out: while the overlay was open hideUI() was a
  // no-op (it keeps chrome up during picking), so the bar would otherwise stay
  // visible forever after returning to the chapter. revealUI schedules the hide.
  revealUI();
  nudgeAutoScroll(); // resume drifting gracefully after the picker closes
}

/** Render the chapter grid for one book; onPick(bookId, chapter) starts reading. */
function openChapters(book, onPick) {
  els.overlayTitle.textContent = book.commonName;
  clearList();

  const grid = document.createElement("div");
  grid.className = "chapter-grid";
  for (let c = 1; c <= book.numberOfChapters; c++) {
    const cell = document.createElement("button");
    cell.className = "chap-cell";
    cell.textContent = c;
    cell.addEventListener("click", () => {
      closeOverlay();
      onPick(book.id, c);
    });
    grid.appendChild(cell);
  }
  els.pickerList.appendChild(grid);
}

/** Open the testament-grouped book list. */
export function openBooks(books, onPick) {
  els.overlayTitle.textContent = "Books";
  clearList();

  // Two columns side by side: OT on the left (right-aligned text),
  // NT on the right (left-aligned text).
  const sections = [
    { title: "Old Testament", align: "ot", filter: (b) => b.order <= OT_MAX_ORDER },
    { title: "New Testament", align: "nt", filter: (b) => b.order > OT_MAX_ORDER },
  ];

  const columns = document.createElement("div");
  columns.className = "pick-columns";

  for (const sec of sections) {
    const col = document.createElement("div");
    col.className = `pick-col pick-col-${sec.align}`;

    const h = document.createElement("div");
    h.className = "pick-section";
    h.textContent = sec.title;
    col.appendChild(h);

    // Testament membership is by canonical order, but the list within each
    // column is shown alphabetically by name, ignoring any leading number so
    // "1 Corinthians"/"2 Corinthians" sort under C, "1/2/3 John" under J, etc.
    const sortKey = (b) => b.commonName.replace(/^\d+\s*/, "");
    const inSection = books
      .filter(sec.filter)
      .sort(
        (a, b) =>
          sortKey(a).localeCompare(sortKey(b)) || a.order - b.order
      );
    for (const book of inSection) {
      const btn = document.createElement("button");
      btn.className = "pick-item";
      btn.textContent = book.commonName;
      btn.addEventListener("click", () => {
        // Single-chapter books (Obadiah, Philemon, 2/3 John, Jude) have no
        // chapter to choose — open straight to the text.
        if (book.numberOfChapters === 1) {
          closeOverlay();
          onPick(book.id, 1);
        } else {
          openChapters(book, onPick);
        }
      });
      col.appendChild(btn);
    }

    columns.appendChild(col);
  }

  els.pickerList.appendChild(columns);

  const credit = document.createElement("p");
  credit.className = "pick-credit";
  credit.textContent =
    "The Holy Bible, Berean Standard Bible, BSB is produced in cooperation " +
    "with Bible Hub, Discovery Bible, OpenBible.com, and the Berean Bible " +
    "Translation Committee. This text of God's Word has been dedicated to the " +
    "public domain.";
  els.pickerList.appendChild(credit);

  els.overlay.classList.add("open");
  showConfigBar();
  pauseAutoScroll(); // hold still while the reader browses the picker
  revealUI();
}
