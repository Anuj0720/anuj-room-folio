import gsap from "gsap";

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

  gsap.to(camera.position, {
    x: position.x,
    y: position.y,
    z: position.z,
    duration,
    ease,
    onComplete,
  });

  if (controls) {
    gsap.to(controls.target, {
      x: target.x,
      y: target.y,
      z: target.z,
      duration,
      ease,
      onUpdate: () => controls.update(),
    });
  }
}
