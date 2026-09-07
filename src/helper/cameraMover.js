import gsap from "gsap";
import { pickByBreakpoint } from "./breakpoints";

// Add a breakpoint by adding a key here — "mobileSmall",
// "landscape_tablet", "mobileBig" fall back to the next larger
// breakpoint that IS defined (see breakpoints.js) until you fill
// them in.
const CAMERA_BY_BREAKPOINT = {
  desktop: {
    position: { x: 28.3, y: -20.6, z: 8.15 },
    target: { x: -4.5, y: -30.1, z: -10.1 },
  },

  landscape_tablet: {
    position: { x: 27.5, y: -21.4, z: 16.45 },
    target: { x: -5.6, y: -29.7, z: -6.8 },
  },

  portrait_tablet: {
    position: { x: 30.4, y: -19.5, z: 23.95 },
    target: { x: -9.2, y: -29.8, z: -8.6 },
  },

  mobileBig: {
    position: { x: 59.5, y: -15.9, z: 35.73 },
    target: { x: -9.2, y: -29.8, z: -8.6 },
  },
  mobileMedium: {
    position: { x: 69.2, y: -14.5, z: 54.63 },
    target: { x: -9.6, y: -29.2, z: -8.2 },
  },
  mobileSmall: {
    position: {x: 92.2, y: -10.2, z: 73.00},
    target: {x: -9.6, y: -29.2, z: -8.2},
  },
  // TODO: mobileBig / mobileSmall / landscape_tablet
};

// A getter-based object, not a plain one — every read of .position or
// .target picks the right value for the CURRENT breakpoint at the
// time it's accessed. Every existing call site that does
// `DEFAULT_CAMERA.position` / `DEFAULT_CAMERA.target` keeps working
// completely unchanged.
export const DEFAULT_CAMERA = {
  get position() {
    return pickByBreakpoint(CAMERA_BY_BREAKPOINT).position;
  },
  get target() {
    return pickByBreakpoint(CAMERA_BY_BREAKPOINT).target;
  },
};

export function moveCamera({
  camera,
  controls,
  position,
  target,
  duration = 2,
  ease = "power2.inOut",
  onComplete,
}) {
  if (!camera) return;

  let completed = !controls;
  let cameraDone = false;
  let targetDone = !controls;

  const finish = () => {
    if (cameraDone && targetDone && !completed) {
      completed = true;
      onComplete?.();
    }
  };

  gsap.to(camera.position, {
    x: position.x,
    y: position.y,
    z: position.z,
    duration,
    ease,
    onComplete: () => {
      cameraDone = true;
      finish();
    },
  });

  if (controls) {
    gsap.to(controls.target, {
      x: target.x,
      y: target.y,
      z: target.z,
      duration,
      ease,
      onUpdate: () => controls.update(),
      onComplete: () => {
        targetDone = true;
        finish();
      },
    });
  }
}
