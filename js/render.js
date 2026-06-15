// render.js — chapter payload → continuous prose DOM
//
// Rules:
//   - Verses flow as one continuous block; a new .flow block begins ONLY at
//     chapter start, a source line_break, or a hebrew_subtitle.
//   - Editorial "heading" items are suppressed entirely.
//   - "hebrew_subtitle" items (Psalm superscriptions) are kept.
//   - Poetry line breaks are honored; indentation is dropped.
//   - Verse numbers are not shown inline; they live as data and reveal on tap.
//   - No red-letter styling.

import { els } from "./dom.js";
import { ALWAYS_NUMBERED_BOOKS } from "./config.js";

function footnoteText(chapter, id) {
  const notes = chapter && chapter.footnotes;
  if (!notes) return "";
  const n = notes.find((f) => f.noteId === id);
  return n ? n.text : "";
}

/** Append a verse's mixed content (strings / formatted text / footnotes) to a node. */
/** The literal text a content part contributes, for boundary checks. */
function partText(part) {
  if (typeof part === "string") return part;
  if (part && typeof part === "object" && "text" in part) return part.text;
  return "";
}

/**
 * When a footnote marker is dropped, the text segments on either side can
 * collapse into one word (e.g. "overcome" + "it." → "overcomeit."). Insert a
 * space only at a genuine word boundary — letter/digit on both sides — so we
 * don't add spaces before punctuation or mid-word.
 */
function needsSpaceAcrossNote(content, idx) {
  const before = partText(content[idx - 1]);
  const after = partText(content[idx + 1]);
  if (!before || !after) return false;
  const prevCh = before[before.length - 1];
  const nextCh = after[0];
  return /[\p{L}\p{N}]/u.test(prevCh) && /[\p{L}\p{N}]/u.test(nextCh);
}

function renderInline(content, container, chapter, isPoetry) {
  for (let i = 0; i < content.length; i++) {
    const part = content[i];
    if (typeof part === "string") {
      container.appendChild(document.createTextNode(part));
      continue;
    }
    if (!part || typeof part !== "object") continue;

    if ("noteId" in part) {
      const text = footnoteText(chapter, part.noteId);
      if (!text) {
        // dropped marker — preserve a word boundary if one was implied
        if (needsSpaceAcrossNote(content, i)) {
          container.appendChild(document.createTextNode(" "));
        }
        continue;
      }
      const fn = document.createElement("sup");
      fn.className = "fn";
      fn.textContent = "*";
      fn.title = text;
      fn.dataset.footnote = text;
      container.appendChild(fn);
      // keep the word boundary the marker stood between
      if (needsSpaceAcrossNote(content, i)) {
        container.appendChild(document.createTextNode(" "));
      }
    } else if ("text" in part) {
      // formatted text — keep poetry shape, ignore words-of-Jesus tint
      if (part.poem) {
        const line = document.createElement("span");
        line.className = "poem-line";
        // mark the first poem line of the verse so the verse number can sit
        // inline beside it (can't rely on :first-of-type — .vnum is also a span)
        if (!container.querySelector(".poem-line")) {
          line.classList.add("poem-line-first");
        }
        line.textContent = part.text;
        container.appendChild(line);
      } else {
        container.appendChild(document.createTextNode(part.text));
      }
    } else if ("lineBreak" in part) {
      // In poetry each poem line is already a block, so the inline break is
      // redundant and only adds an empty line. Honor it only in prose.
      if (!isPoetry) container.appendChild(document.createElement("br"));
    }
  }
}

/** Build a verse span (no inline number; number stored for tap-reveal). */
function buildVerse(item, chapter, isPoetry) {
  const span = document.createElement("span");
  span.className = "verse";
  span.dataset.verse = item.number;

  const num = document.createElement("span");
  num.className = "vnum";
  num.textContent = item.number;
  span.appendChild(num);

  renderInline(item.content || [], span, chapter, isPoetry);
  // trailing space keeps consecutive PROSE verses apart; poetry verses are
  // block-level, so no trailing space node is needed there.
  if (!isPoetry) span.appendChild(document.createTextNode(" "));
  return span;
}

/** Resolve a chapter's display book name. */
export function bookNameOf(data, books) {
  const book = books.find((b) => b.id === data.book.id);
  return (
    (data.book && (data.book.commonName || data.book.name)) ||
    (book && book.commonName) ||
    data.book.id
  );
}

/**
 * Build a self-contained <section class="chapter"> for a chapter payload.
 * Sections are appended to #reader for seamless infinite scroll. The section
 * carries the book/chapter on its dataset and the next-chapter link so the
 * scroller knows what to load next.
 */
export function buildChapter(data, books) {
  const bookName = bookNameOf(data, books);

  const section = document.createElement("section");
  section.className = "chapter";
  section.dataset.book = data.book.id;
  section.dataset.chapter = data.chapter.number;
  section.dataset.bookName = bookName;
  if (data.nextChapterApiLink) section.dataset.next = data.nextChapterApiLink;

  // Per-chapter, since appended chapters may belong to different books
  // (e.g. scrolling from Psalms into Proverbs).
  if (ALWAYS_NUMBERED_BOOKS.includes(data.book.id)) {
    section.classList.add("always-verses");
  }

  const label = document.createElement("div");
  label.className = "chapter-label";
  label.textContent = `${bookName} · ${data.chapter.number}`;
  section.appendChild(label);

  let flow = null;
  const openFlow = () => {
    flow = document.createElement("p");
    flow.className = "flow";
    section.appendChild(flow);
    return flow;
  };

  for (const item of data.chapter.content) {
    switch (item.type) {
      case "heading":
        break; // editorial section title — suppressed

      case "hebrew_subtitle": {
        flow = null;
        const sub = document.createElement("p");
        sub.className = "hebrew-subtitle";
        renderInline(item.content || [], sub, data);
        section.appendChild(sub);
        break;
      }

      case "line_break":
        flow = null;
        break;

      case "verse": {
        if (!flow) openFlow();
        const hasPoem = (item.content || []).some(
          (p) => p && typeof p === "object" && p.poem
        );
        if (hasPoem) flow.classList.add("poetry");
        flow.appendChild(buildVerse(item, data, hasPoem));
        break;
      }

      default:
        break;
    }
  }

  return section;
}
