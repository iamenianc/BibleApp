// fade.js — gentle fade-in / fade-out of verses as they enter the reading band

import { els } from "./dom.js";

let observer = null;

/** (Re)attach the observer to the verses currently in #reader. */
export function setupFade() {
  if (observer) observer.disconnect();

  observer = new IntersectionObserver(
    (entries) => {
      for (const e of entries) {
        e.target.classList.toggle("in", e.isIntersecting);
      }
    },
    {
      // reveal only within the central reading band of the viewport
      rootMargin: "-22% 0px -28% 0px",
      threshold: 0.01,
    }
  );

  els.reader
    .querySelectorAll(".flow, .hebrew-subtitle")
    .forEach((v) => observer.observe(v));
}
