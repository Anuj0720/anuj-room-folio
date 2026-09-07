// Centralizes every "zoom in on this object" camera position/target
// used by the click handlers in Tv/Mac/Hologram/Imac/Poster — one
// object per breakpoint instead of scattering {x,y,z} literals
// across six files. Add a breakpoint by adding a key to any of these
// objects; see breakpoints.js for fallback behavior when a key is
// left out.

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

// TODO: add "mobileBig" / "mobileSmall" / "landscape_tablet" keys
// to each of these as you get values for them.

export const TV_ZOOM = responsiveCamera({
  desktop: {
    position: { x: -9.96, y: -32.36, z: -6.75 },
    target: { x: -9.96, y: -32.39, z: -7.96 },
  },
  portrait_tablet: {
    position: { x: -10.8, y: -27.5, z: -5.09 },
    target: { x: -10.9, y: -29.4, z: -11.3 },
  },
});

export const MAC_ZOOM = responsiveCamera({
  desktop: {
    position: { x: -12, y: -30, z: -10.55 },
    target: { x: -30.3, y: -29.9, z: -19.9 },
  },
  portrait_tablet: {
    position: { x: -12, y: -30, z: -10.55 },
    target: { x: -30.3, y: -32.2, z: -19.9 },
  },
});

export const HOLOGRAM_ZOOM = responsiveCamera({
  desktop: {
    position: { x: -12, y: -31, z: -5 },
    target: { x: -25, y: -32, z: -6 },
  },
  portrait_tablet: {
    position: { x: -12.1, y: -31.3, z: -5.28 },
    target: { x: -33.2, y: -33.1, z: -5.3 },
  },
});

export const IMAC_ZOOM = responsiveCamera({
  desktop: {
    position: { x: -11, y: -28, z: -10 },
    target: { x: -26, y: -32, z: -9 },
  },
  portrait_tablet: {
    position: { x: -10.0, y: -27.4, z: -9.05 },
    target: { x: -15.8, y: -29.1, z: -9.5 },
  },
});

export const POSTER_ZOOM = responsiveCamera({
  desktop: {
    position: { x: -11, y: -29, z: -7 },
    target: { x: -11, y: -29, z: -9 },
  },
  portrait_tablet: {
    position: { x: -12.3, y: -27.7, z: -1.46 },
    target: { x: -9.6, y: -27.7, z: -38.2 },
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

// TODO: add "mobileBig" / "mobileSmall" / "landscape_tablet" keys
// to each of these as you get values for them.

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
