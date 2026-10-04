// OrbitControls limits for the idle (un-zoomed) room view.
// All angles are in DEGREES here and converted to radians below.
//
// Reference values of the default cameras (for tuning):
//   desktop          -> distance ≈ 38.7, polar ≈ 75.8°, azimuth ≈ 60.9°
//   landscape_tablet -> distance ≈ 41.3, polar ≈ 78.4°, azimuth ≈ 54.9°
// Keep the defaults INSIDE these ranges, otherwise the camera gets
// clamped (and visibly jumps) the moment controls are re-enabled.
//
// Polar angle   : 0° = straight above the target, 90° = level with it.
// Azimuth angle : 0° = camera on the +Z axis, 90° = camera on the +X axis.

const deg = (d) => (d * Math.PI) / 180;

export const ORBIT_LIMITS = {
  minPolarAngle: deg(50), // can't look down more steeply than this
  maxPolarAngle: deg(88), // can't drop below the room's floor line
  minAzimuthAngle: deg(15), // left rotation limit
  maxAzimuthAngle: deg(95), // right rotation limit
  minDistance: 25, // zoom-in limit
  maxDistance: 55, // zoom-out limit
};

// Used while the camera is zoomed on an object (TV, Mac, poster...).
// Those close-up shots sit well outside the idle limits (e.g. the TV
// shot is ~1 unit from its target), and OrbitControls.update() would
// otherwise clamp the GSAP camera tween and ruin the shot.
export const ORBIT_UNLIMITED = {
  minPolarAngle: 0,
  maxPolarAngle: Math.PI,
  minAzimuthAngle: -Infinity,
  maxAzimuthAngle: Infinity,
  minDistance: 0,
  maxDistance: Infinity,
};
