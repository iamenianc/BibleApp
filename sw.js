// sw.js — offline shell + chapter caching for The Word
//
// Two stores:
//   SHELL — the app's own files (cache-first, refreshed on activate)
//   DATA  — helloao API responses (stale-while-revalidate, grows as you read)

const VERSION = "v13";
const SHELL_CACHE = `theword-shell-${VERSION}`;
const DATA_CACHE = `theword-data-${VERSION}`;
const API_HOST = "bible.helloao.org";

const SHELL_ASSETS = [
  "./",
  "./index.html",
  "./manifest.webmanifest",
  "./css/base.css",
  "./css/reader.css",
  "./css/chrome.css",
  "./css/picker.css",
  "./fonts/AtkinsonHyperlegibleNext.ttf",
  "./fonts/AtkinsonHyperlegibleNext-Italic.ttf",
  "./js/config.js",
  "./js/dom.js",
  "./js/api.js",
  "./js/store.js",
  "./js/status.js",
  "./js/render.js",
  "./js/scroll.js",
  "./js/chrome.js",
  "./js/picker.js",
  "./js/textsize.js",
  "./js/verses.js",
  "./js/pwa.js",
  "./js/app.js",
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(SHELL_CACHE)
      .then((cache) => cache.addAll(SHELL_ASSETS))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys
            .filter((k) => k !== SHELL_CACHE && k !== DATA_CACHE)
            .map((k) => caches.delete(k))
        )
      )
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET") return;

  const url = new URL(request.url);

  // helloao API → stale-while-revalidate
  if (url.hostname === API_HOST) {
    event.respondWith(staleWhileRevalidate(request));
    return;
  }

  // same-origin app shell → stale-while-revalidate.
  // Serves instantly from cache (and works offline) while always refreshing in
  // the background, so HTML/CSS/JS edits land on the next view without needing
  // a version bump.
  if (url.origin === self.location.origin) {
    event.respondWith(shellStaleWhileRevalidate(request));
  }
});

async function shellStaleWhileRevalidate(request) {
  const cache = await caches.open(SHELL_CACHE);
  const cached = await cache.match(request);

  const network = fetch(request)
    .then((res) => {
      if (res && res.ok) cache.put(request, res.clone());
      return res;
    })
    .catch(() => null);

  if (cached) return cached; // instant; fresh copy lands in cache for next time
  const res = await network;
  if (res) return res;

  // offline and uncached → fall back to the app shell for navigations
  if (request.mode === "navigate") {
    const shell = await cache.match("./index.html");
    if (shell) return shell;
  }
  return new Response("Offline", { status: 503 });
}

async function staleWhileRevalidate(request) {
  const cache = await caches.open(DATA_CACHE);
  const cached = await cache.match(request);

  const network = fetch(request)
    .then((res) => {
      if (res && res.ok) cache.put(request, res.clone());
      return res;
    })
    .catch(() => null);

  // serve cached immediately if present; otherwise wait for network
  return cached || (await network) || new Response("Offline", { status: 503 });
}
