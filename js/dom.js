// dom.js — single place that resolves and exports element references

const $ = (id) => document.getElementById(id);

export const els = {
  reader: $("reader"),
  topbar: $("topbar"),
  ref: $("ref-display"),
  sizeDown: $("size-down"),
  sizeUp: $("size-up"),
  audioPlay: $("audio-play"),
  audioStop: $("audio-stop"),
  overlay: $("overlay"),
  overlayTitle: $("overlay-title"),
  overlayClose: $("overlay-close"),
  pickerList: $("picker-list"),
  status: $("status"),
  statusText: $("status-text"),
};
