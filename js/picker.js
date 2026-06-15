// picker.js — full-screen book → chapter selector

import { els } from "./dom.js";
import { revealUI } from "./chrome.js";
import { pauseAutoScroll, nudgeAutoScroll } from "./autoscroll.js";

// Books with order <= 39 are the Old Testament in the 66-book canon.
const OT_MAX_ORDER = 39;

function clearList() {
  els.pickerList.innerHTML = "";
}

export function closeOverlay() {
  els.overlay.classList.remove("open");
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

    for (const book of books.filter(sec.filter)) {
      const btn = document.createElement("button");
      btn.className = "pick-item";
      btn.textContent = book.commonName;
      btn.addEventListener("click", () => openChapters(book, onPick));
      col.appendChild(btn);
    }

    columns.appendChild(col);
  }

  els.pickerList.appendChild(columns);

  els.overlay.classList.add("open");
  pauseAutoScroll(); // hold still while the reader browses the picker
  revealUI();
}
