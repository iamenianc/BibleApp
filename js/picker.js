// picker.js — full-screen book → chapter selector

import { els } from "./dom.js";
import { revealUI } from "./chrome.js";
import { pauseAutoScroll, nudgeAutoScroll } from "./autoscroll.js";
import { showConfigBar, hideConfigBar, refreshConfigBar } from "./settings.js";

// Books with order <= 39 are the Old Testament in the 66-book canon.
const OT_MAX_ORDER = 39;

// Long books get an extra "pick a range" layer so the chapter grid never
// becomes an overwhelming wall of circles.
const GROUP_THRESHOLD = 24; // only books with MORE chapters than this are grouped
const GROUP_SIZE = 12; // chapters per range
const MIN_TAIL = 6; // a trailing remainder smaller than this is folded into the last range

function clearList() {
  els.pickerList.innerHTML = "";
}

/**
 * Split a book's chapters into [start, end] ranges of GROUP_SIZE. A final
 * remainder of fewer than MIN_TAIL chapters is appended to the previous range
 * rather than left as a lonely stub (e.g. Genesis 50 → …37–50, not 49–50).
 */
function chapterGroups(total) {
  const groups = [];
  let start = 1;
  while (start <= total) {
    let end = Math.min(start + GROUP_SIZE - 1, total);
    const tail = total - end;
    if (tail > 0 && tail < MIN_TAIL) end = total; // absorb the short tail
    groups.push([start, end]);
    start = end + 1;
  }
  return groups;
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

/** Render a grid of chapter circles for [start, end]; onPick starts reading. */
function renderChapterGrid(book, start, end, onPick, onBack) {
  clearList();

  if (onBack) {
    const back = document.createElement("button");
    back.className = "pick-back";
    back.textContent = "‹ Ranges";
    back.addEventListener("click", onBack);
    els.pickerList.appendChild(back);
  }

  const grid = document.createElement("div");
  grid.className = "chapter-grid";
  for (let c = start; c <= end; c++) {
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
  refreshConfigBar(); // new view height: re-evaluate the bottom-margin reveal
}

/** Render the range picker for a long book; choosing a range opens its chapters. */
function openGroups(book, onPick) {
  clearList();

  const grid = document.createElement("div");
  grid.className = "group-grid";
  for (const [start, end] of chapterGroups(book.numberOfChapters)) {
    const cell = document.createElement("button");
    cell.className = "group-cell";
    cell.textContent = `${start}–${end}`;
    cell.addEventListener("click", () => {
      renderChapterGrid(book, start, end, onPick, () => openGroups(book, onPick));
    });
    grid.appendChild(cell);
  }
  els.pickerList.appendChild(grid);
  refreshConfigBar(); // new view height: re-evaluate the bottom-margin reveal
}

/** Open the chapter selector for one book; onPick(bookId, chapter) starts reading. */
function openChapters(book, onPick) {
  els.overlayTitle.textContent = book.commonName;

  // Long books gain an intermediate range layer; short books go straight to
  // the full chapter grid.
  if (book.numberOfChapters > GROUP_THRESHOLD) {
    openGroups(book, onPick);
  } else {
    renderChapterGrid(book, 1, book.numberOfChapters, onPick);
  }
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
