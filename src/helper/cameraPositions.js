// Centralizes every "zoom in on this object" camera position/target
// used by the click handlers in Tv/Mac/Hologram/Imac/Poster.
// Only "desktop" and "landscape_tablet" exist; a missing
// landscape_tablet key falls back to desktop (see breakpoints.js).

import { pickByBreakpoint } from "./breakpoints";

function responsiveCamera(byBreakpoint) {
  return {
    get position() {
      return pickByBreakpoint(byBreakpoint).position;
    },
    get target() {
      return pickByBreakpoint(byBreakpoint).target;
    },
  };
}

export const TV_ZOOM = responsiveCamera({
  desktop: {
    position: { x: -9.96, y: -32.36, z: -6.75 },
    target: { x: -9.96, y: -32.39, z: -7.96 },
  },
});

export const MAC_ZOOM = responsiveCamera({
  desktop: {
    position: { x: -12, y: -30, z: -10.55 },
    target: { x: -30.3, y: -29.9, z: -19.9 },
  },
});

export const HOLOGRAM_ZOOM = responsiveCamera({
  desktop: {
    position: { x: -12, y: -31, z: -5 },
    target: { x: -25, y: -32, z: -6 },
  },
});

export const IMAC_ZOOM = responsiveCamera({
  desktop: {
    position: { x: -11, y: -28, z: -10 },
    target: { x: -26, y: -32, z: -9 },
  },
});

export const POSTER_ZOOM = responsiveCamera({
  desktop: {
    position: { x: -11, y: -29, z: -7 },
    target: { x: -11, y: -29, z: -9 },
  },
});

// ── Back-button position for each of the 5 zoomable objects above,
//    same idea, one object per breakpoint. ──────────────────────────

function responsiveBackButton(byBreakpoint) {
  return {
    get top() {
      return pickByBreakpoint(byBreakpoint).top;
    },
    get left() {
      return pickByBreakpoint(byBreakpoint).left;
    },
  };
}

export const IMAC_BACK_BUTTON = responsiveBackButton({
  desktop: { top: 48, left: "50%" },
});

export const MAC_BACK_BUTTON = responsiveBackButton({
  desktop: { top: 16, left: "50%" },
});

export const POSTER_BACK_BUTTON = responsiveBackButton({
  desktop: { top: 28, left: "50%" },
});

export const TV_BACK_BUTTON = responsiveBackButton({
  desktop: { top: 0, left: "39%" },
});

export const HOLOGRAM_BACK_BUTTON = responsiveBackButton({
  desktop: { top: 58, left: "44%" },
});
