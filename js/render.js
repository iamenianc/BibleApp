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

function footnoteText(chapter, id) {
  const notes = chapter && chapter.footnotes;
  if (!notes) return "";
  const n = notes.find((f) => f.noteId === id);
  return n ? n.text : "";
}

/** Append a verse's mixed content (strings / formatted text / footnotes) to a node. */
function renderInline(content, container, chapter) {
  for (const part of content) {
    if (typeof part === "string") {
      container.appendChild(document.createTextNode(part));
      continue;
    }
    if (!part || typeof part !== "object") continue;

    if ("noteId" in part) {
      const fn = document.createElement("sup");
      fn.className = "fn";
      fn.textContent = "*";
      const text = footnoteText(chapter, part.noteId);
      fn.title = text;
      fn.dataset.footnote = text;
      container.appendChild(fn);
    } else if ("text" in part) {
      // formatted text — keep poetry shape, ignore words-of-Jesus tint
      if (part.poem) {
        const line = document.createElement("span");
        line.className = "poem-line";
        line.textContent = part.text;
        container.appendChild(line);
      } else {
        container.appendChild(document.createTextNode(part.text));
      }
    } else if ("lineBreak" in part) {
      container.appendChild(document.createElement("br"));
    }
  }
}

/** Build a verse span (no inline number; number stored for tap-reveal). */
function buildVerse(item, chapter) {
  const span = document.createElement("span");
  span.className = "verse";
  span.dataset.verse = item.number;

  const num = document.createElement("span");
  num.className = "vnum";
  num.textContent = item.number;
  span.appendChild(num);

  renderInline(item.content || [], span, chapter);
  // trailing space so consecutive verses don't run together in prose
  span.appendChild(document.createTextNode(" "));
  return span;
}

/**
 * Render a chapter payload into #reader as continuous prose.
 * Returns the resolved book display name.
 */
export function renderChapter(data, books) {
  els.reader.innerHTML = "";

  const book = books.find((b) => b.id === data.book.id);
  const bookName =
    (data.book && (data.book.commonName || data.book.name)) ||
    (book && book.commonName) ||
    data.book.id;

  const label = document.createElement("div");
  label.className = "chapter-label";
  label.textContent = `${bookName} · ${data.chapter.number}`;
  els.reader.appendChild(label);

  // Current open prose block; null until the next verse opens one.
  let flow = null;
  const openFlow = () => {
    flow = document.createElement("p");
    flow.className = "flow";
    els.reader.appendChild(flow);
    return flow;
  };

  for (const item of data.chapter.content) {
    switch (item.type) {
      case "heading":
        // editorial section title — suppressed
        break;

      case "hebrew_subtitle": {
        flow = null; // forces a fresh block after the subtitle
        const sub = document.createElement("p");
        sub.className = "hebrew-subtitle";
        renderInline(item.content || [], sub, data);
        els.reader.appendChild(sub);
        break;
      }

      case "line_break":
        // source-defined break: end the current prose block
        flow = null;
        break;

      case "verse": {
        if (!flow) openFlow();
        // mark a block as poetry if any of its verses carry poem formatting
        const hasPoem = (item.content || []).some(
          (p) => p && typeof p === "object" && p.poem
        );
        if (hasPoem) flow.classList.add("poetry");
        flow.appendChild(buildVerse(item, data));
        break;
      }

      default:
        break;
    }
  }

  return bookName;
}
