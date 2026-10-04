// Background-music manager (single shared <audio> element).
//
// Rules it enforces:
//  * Nothing plays until startBackgroundMusic() is called from the intro
//    screen's "Enter" buttons (that click is also the user gesture the
//    browser needs to allow audio).
//  * "Enter without audio" starts the scene with the music OFF; the
//    music button in the scene can turn it on later.
//  * Any registered "external" media element (the TV / Mac / Hologram
//    videos) that is actually audible (playing AND unmuted) pauses the
//    background track. When it goes silent again (muted, paused, or the
//    camera leaves the object) the background track fades back in —
//    but only if the user hasn't muted it themselves.
//  * Objects that embed their own sound we can't observe (the iMac's
//    iframe) use holdBackgroundMusic(id) / releaseBackgroundMusic(id) to
//    keep the track paused for as long as the camera is on them.
//  * The track also pauses while the browser tab is hidden.

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
  if (intro && !introDone) endIntro(false);
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

// ── Intro music (public/music/intro.mp3) ─────────────────────────
// Played ONCE, only when the visitor presses "Show intro" on the loading
// screen. While it plays the background track is held back; when the
// intro ends (or is skipped) it fades out, is thrown away, and can never
// start again — then the background track takes over.

const INTRO_SRC = "/music/intro.mp3";
const INTRO_VOLUME = 0.6;
const INTRO_FADE_MS = 900;

let intro = null;
let introDone = false; // true once it has played (or been stopped) — never replays
let introFadeRaf = null;

function fadeIntro(target, ms, onDone) {
  if (!intro) return;
  if (introFadeRaf !== null) cancelAnimationFrame(introFadeRaf);
  const el = intro;
  const from = el.volume;
  const start = performance.now();
  const step = (now) => {
    const k = Math.min(1, (now - start) / ms);
    el.volume = Math.max(0, Math.min(1, from + (target - from) * k));
    if (k < 1) introFadeRaf = requestAnimationFrame(step);
    else {
      introFadeRaf = null;
      onDone?.();
    }
  };
  introFadeRaf = requestAnimationFrame(step);
}

function endIntro(fade = true) {
  if (introDone) return;
  introDone = true;

  const el = intro;
  const cleanup = () => {
    if (el) {
      el.pause();
      el.removeAttribute("src");
      el.load();
    }
    if (intro === el) intro = null;
    // Hand over to the background track (if the user has it on).
    releaseBackgroundMusic("intro");
  };

  if (el && fade && !el.paused && !el.ended) fadeIntro(0, INTRO_FADE_MS, cleanup);
  else {
    if (introFadeRaf !== null) cancelAnimationFrame(introFadeRaf);
    introFadeRaf = null;
    cleanup();
  }
}

// "Show intro" button: music mode ON, background held back, intro plays.
export function beginIntroAudio() {
  if (introDone || intro) return;

  holdBackgroundMusic("intro"); // before start so the bg track never blips
  startBackgroundMusic(true);

  if (typeof Audio === "undefined") return endIntro(false);
  intro = new Audio(INTRO_SRC);
  intro.loop = false;
  intro.volume = 0;
  intro.addEventListener("ended", () => endIntro(false));
  intro.addEventListener("error", () => endIntro(false)); // missing file etc.
  intro.play().then(
    () => fadeIntro(INTRO_VOLUME, INTRO_FADE_MS),
    () => endIntro(false),
  );
}

// Call when the camera tour ends or is skipped.
export function stopIntroAudio() {
  endIntro(true);
}

// ── React hook ───────────────────────────────────────────────────
function subscribe(listener) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

// true = the user has the music switched on
export function useMusicOn() {
  return useSyncExternalStore(subscribe, () => musicOn, () => false);
}
