// dom.js — single place that resolves and exports element references

const $ = (id) => document.getElementById(id);

export const els = {
  reader: $("reader"),
  topbar: $("topbar"),
  bottombar: $("bottombar"),
  bbBook: $("bb-book"),
  bbRange: $("bb-range"),
  ref: $("ref-display"),
  sizeDown: $("size-down"),
  sizeUp: $("size-up"),
  audioPlay: $("audio-play"),
  audioStop: $("audio-stop"),
  speedBtn: $("speed-btn"),
  topbarSpeed: $("topbar-speed"),
  topbarSpeedSlider: $("topbar-speed-slider"),
  topbarSpeedVal: $("topbar-speed-val"),
  topbarSpeedDone: $("topbar-speed-done"),
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
