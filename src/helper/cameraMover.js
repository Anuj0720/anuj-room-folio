import gsap from "gsap";

export const DEFAULT_CAMERA = {
  position: { x: 25.1, y: -21.5, z: 6.37 },
  target: { x: -4.5, y: -30.1, z: -10.12 },
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
