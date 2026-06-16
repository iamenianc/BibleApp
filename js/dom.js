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
  speedBtn: $("speed-btn"),
  speedDial: $("speed-dial"),
  speedDialArc: $("speed-dial-arc"),
  speedDialVal: $("speed-dial-val"),
  overlay: $("overlay"),
  overlayTitle: $("overlay-title"),
  overlayClose: $("overlay-close"),
  pickerList: $("picker-list"),
  configBar: $("config-bar"),
  configPanel: $("config-panel"),
  cfgSizeDown: $("cfg-size-down"),
  cfgSizeUp: $("cfg-size-up"),
  cfgSizeVal: $("cfg-size-val"),
  cfgPaceSlider: $("cfg-pace-slider"),
  cfgPaceVal: $("cfg-pace-val"),
  status: $("status"),
  statusText: $("status-text"),
};
