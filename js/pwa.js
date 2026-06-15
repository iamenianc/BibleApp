// pwa.js — service worker control
//
// SW_ENABLED is OFF during development so edits show up on every reload with no
// caching surprises. When disabled, we also actively tear down any previously
// registered worker and its caches, so a stale SW from an earlier session can't
// keep serving old files. Flip SW_ENABLED to true to ship offline/installable.

const SW_ENABLED = false;

export function registerSW() {
  if (!("serviceWorker" in navigator)) return;

  if (!SW_ENABLED) {
    teardownSW();
    return;
  }

  window.addEventListener("load", () => {
    navigator.serviceWorker
      .register("./sw.js")
      .catch((err) => console.warn("SW registration failed:", err));
  });
}

/** Unregister any existing service worker and delete its caches. */
async function teardownSW() {
  try {
    const regs = await navigator.serviceWorker.getRegistrations();
    await Promise.all(regs.map((r) => r.unregister()));
    if (window.caches && caches.keys) {
      const keys = await caches.keys();
      await Promise.all(
        keys.filter((k) => k.startsWith("theword-")).map((k) => caches.delete(k))
      );
    }
  } catch (err) {
    console.warn("SW teardown failed:", err);
  }
}
