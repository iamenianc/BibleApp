// sw.js — offline shell + chapter caching for The Word
//
// Two stores:
//   SHELL — the app's own files (cache-first, refreshed on activate)
//   DATA  — helloao API responses (stale-while-revalidate, grows as you read)

const VERSION = "v1";
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
  "./js/config.js",
  "./js/dom.js",
  "./js/api.js",
  "./js/store.js",
  "./js/status.js",
  "./js/render.js",
  "./js/fade.js",
  "./js/chrome.js",
  "./js/picker.js",
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

  // same-origin app shell → cache-first
  if (url.origin === self.location.origin) {
    event.respondWith(cacheFirst(request));
  }
});

async function cacheFirst(request) {
  const cached = await caches.match(request);
  if (cached) return cached;
  try {
    const res = await fetch(request);
    const cache = await caches.open(SHELL_CACHE);
    cache.put(request, res.clone());
    return res;
  } catch (err) {
    // navigation fallback so the app still opens offline
    if (request.mode === "navigate") {
      const shell = await caches.match("./index.html");
      if (shell) return shell;
    }
    throw err;
  }
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
