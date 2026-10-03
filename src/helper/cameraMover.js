import gsap from "gsap";
import { pickByBreakpoint } from "./breakpoints";

// Only "desktop" and "landscape_tablet" are supported (see breakpoints.js).
const CAMERA_BY_BREAKPOINT = {
  desktop: {
    position: { x: 28.3, y: -20.6, z: 8.15 },
    target: { x: -4.5, y: -30.1, z: -10.1 },
  },

  landscape_tablet: {
    position: { x: 27.5, y: -21.4, z: 16.45 },
    target: { x: -5.6, y: -29.7, z: -6.8 },
  },
};

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
