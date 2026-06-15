// pwa.js — register the service worker (no-op if unsupported)

export function registerSW() {
  if (!("serviceWorker" in navigator)) return;
  window.addEventListener("load", () => {
    navigator.serviceWorker
      .register("./sw.js")
      .catch((err) => console.warn("SW registration failed:", err));
  });
}
