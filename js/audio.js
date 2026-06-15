// audio.js — read-aloud of the chapter currently in view (souer narration)
//
// Play starts the current chapter from its beginning. The play button toggles
// play/pause. Stop pauses and resets, so the next Play re-reads whichever
// chapter is now in the reading band (the "nearest" chapter).

import { els } from "./dom.js";
import { keepUIAlive } from "./chrome.js";
import { TRANSLATION } from "./config.js";

const NARRATOR = "souer";
const AUDIO_BASE = "https://audio.bible.helloao.org/api";

let audio = null;        // the single <audio> element we drive
let curBook = null;      // book id of the chapter currently in the reading band
let curChapter = null;   // its chapter number
let loadedKey = null;    // "BOOK/CH" of the source currently loaded, to avoid reloads

function chapterUrl(book, chapter) {
  return `${AUDIO_BASE}/${TRANSLATION}/${book}/${chapter}/audio/${NARRATOR}.mp3`;
}

function ensureAudio() {
  if (audio) return audio;
  audio = new Audio();
  audio.preload = "none";
  // Reflect natural end / external pause back into the button state.
  audio.addEventListener("ended", reset);
  audio.addEventListener("play", syncButton);
  audio.addEventListener("pause", syncButton);
  return audio;
}

/** Toggle the play button's icon between play and pause. */
function syncButton() {
  const playing = audio && !audio.paused && !audio.ended;
  els.audioPlay.classList.toggle("playing", !!playing);
  els.audioPlay.setAttribute(
    "aria-label",
    playing ? "Pause chapter audio" : "Play chapter audio"
  );
}

/** Point the player at a chapter, loading its source only if it changed. */
function loadChapter(book, chapter) {
  const key = `${book}/${chapter}`;
  if (key === loadedKey) return;
  ensureAudio().src = chapterUrl(book, chapter);
  loadedKey = key;
}

function play() {
  if (!curBook || curChapter == null) return;
  // Always (re)play from the start of the chapter currently in view.
  loadChapter(curBook, curChapter);
  audio.currentTime = 0;
  audio.play().catch((err) => console.error("audio play failed:", err));
}

function pause() {
  if (audio) audio.pause();
}

/** Pause and forget the loaded source so the next Play picks the current chapter. */
function reset() {
  if (audio) {
    audio.pause();
    audio.currentTime = 0;
  }
  loadedKey = null;
  syncButton();
}

function onPlayClick() {
  keepUIAlive();
  if (audio && !audio.paused) pause();
  else play();
}

function onStopClick() {
  keepUIAlive();
  reset();
}

/** Tell the player which chapter is currently in the reading band. */
export function setAudioChapter(book, chapter) {
  curBook = book;
  curChapter = chapter;
}

export function initAudio() {
  els.audioPlay.addEventListener("click", onPlayClick);
  els.audioStop.addEventListener("click", onStopClick);
  syncButton();
}
