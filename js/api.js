// api.js — thin wrapper over the helloao Bible API

import { API_BASE, TRANSLATION } from "./config.js";

async function getJSON(path) {
  const res = await fetch(API_BASE + path, { cache: "force-cache" });
  if (!res.ok) throw new Error("HTTP " + res.status + " for " + path);
  return res.json();
}

/** List books for the active translation, normalized and ordered. */
export async function fetchBooks() {
  const data = await getJSON(`/${TRANSLATION}/books.json`);
  return data.books
    .map((b) => ({
      id: b.id,
      commonName: b.commonName || b.name,
      numberOfChapters: b.numberOfChapters,
      order: b.order,
    }))
    .sort((a, b) => a.order - b.order);
}

/** Full chapter payload (content + footnotes + prev/next links). */
export function fetchChapter(bookId, chapter) {
  return getJSON(`/${TRANSLATION}/${bookId}/${chapter}.json`);
}
