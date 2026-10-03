import { useSyncExternalStore } from "react";

const MUSIC_SRC = "/music/background.mp3";
const MAX_VOLUME = 0.35;
const FADE_MS = 600;

let audio = null;
let started = false; // intro "Enter" button has been pressed
let musicOn = false; // the user's own on/off choice
let fadeRaf = null;

const externalEls = new Set();
const holds = new Set(); // named "keep the music paused" requests (e.g. "imac")
const listeners = new Set();

function getAudio() {
  if (!audio && typeof Audio !== "undefined") {
    audio = new Audio(MUSIC_SRC);
    audio.loop = true;
    audio.preload = "auto";
    audio.volume = 0;
  }
  return audio;
}

function emit() {
  listeners.forEach((l) => l());
}

function isExternalAudible() {
  for (const el of externalEls) {
    if (!el.paused && !el.ended && !el.muted && el.volume > 0) return true;
  }
  return false;
}

function cancelFade() {
  if (fadeRaf !== null) {
    cancelAnimationFrame(fadeRaf);
    fadeRaf = null;
  }
}

function fadeTo(target, onDone) {
  const a = getAudio();
  if (!a) return;
  cancelFade();

  const from = a.volume;
  const start = performance.now();

  const step = (now) => {
    const t = Math.min(1, (now - start) / FADE_MS);
    a.volume = from + (target - from) * t;
    if (t < 1) {
      fadeRaf = requestAnimationFrame(step);
    } else {
      fadeRaf = null;
      onDone?.();
    }
  };
  fadeRaf = requestAnimationFrame(step);
}

// Single place that decides "should the background track be audible
// right now?" and moves the audio element to that state.
function sync() {
  const a = getAudio();
  if (!a) return;

  const hidden = typeof document !== "undefined" && document.hidden;
  const shouldPlay =
    started && musicOn && holds.size === 0 && !isExternalAudible() && !hidden;

  if (shouldPlay) {
    if (a.paused) a.play().catch(() => {});
    fadeTo(MAX_VOLUME);
  } else if (!a.paused) {
    fadeTo(0, () => a.pause());
  }
}

if (typeof document !== "undefined") {
  document.addEventListener("visibilitychange", sync);
}

// ── Public API ───────────────────────────────────────────────────

// Call from the intro screen's click handler.
export function startBackgroundMusic(withAudio) {
  started = true;
  musicOn = Boolean(withAudio);
  emit();
  sync();
}

// The in-scene mute / unmute button.
export function toggleBackgroundMusic() {
  if (!started) return;
  musicOn = !musicOn;
  emit();
  sync();
}

// Hard stop (e.g. the portfolio unmounts because the window shrank
// below the supported size).
export function stopBackgroundMusic() {
  started = false;
  musicOn = false;
  holds.clear();
  cancelFade();
  if (audio) {
    audio.pause();
    audio.currentTime = 0;
    audio.volume = 0;
  }
  emit();
}

// Keep the background music paused while `id` is "holding" it
// (idempotent — safe to call repeatedly with the same id).
export function holdBackgroundMusic(id) {
  holds.add(id);
  sync();
}

// Let the music resume once nothing else is holding it.
export function releaseBackgroundMusic(id) {
  holds.delete(id);
  sync();
}

// Register a <video>/<audio> element whose sound should take priority
// over the background music. Safe to call more than once per element.
export function registerExternalAudio(el) {
  if (!el || externalEls.has(el)) return;
  externalEls.add(el);
  ["play", "playing", "pause", "ended", "emptied", "volumechange"].forEach(
    (evt) => el.addEventListener(evt, sync),
  );
  sync();
}

// ── React hook ───────────────────────────────────────────────────
function subscribe(listener) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

// true = the user has the music switched on
export function useMusicOn() {
  return useSyncExternalStore(
    subscribe,
    () => musicOn,
    () => false,
  );
}
