// api.js — thin wrapper over the helloao Bible API

import { API_BASE, TRANSLATION } from "./config.js";

// In-memory promise cache so a prefetch and the later real load share one
// request (and an already-resolved chapter appends with no wait).
const cache = new Map();

async function getJSON(path) {
  const res = await fetch(API_BASE + path, { cache: "force-cache" });
  if (!res.ok) throw new Error("HTTP " + res.status + " for " + path);
  return res.json();
}

/** Fetch a chapter by its full API link (e.g. "/api/BSB/GEN/2.json"). */
export function fetchByApiLink(link) {
  if (!link) return Promise.reject(new Error("no link"));
  if (cache.has(link)) return cache.get(link);
  // API_BASE already ends in "/api"; the link starts with "/api"
  const path = link.replace(/^\/api/, "");
  const p = getJSON(path).catch((err) => {
    cache.delete(link); // allow retry on failure
    throw err;
  });
  cache.set(link, p);
  return p;
}

/** Warm the cache for a chapter link without awaiting it. */
export function prefetch(link) {
  if (link && !cache.has(link)) fetchByApiLink(link).catch(() => {});
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
  return fetchByApiLink(`/api/${TRANSLATION}/${bookId}/${chapter}.json`);
}
