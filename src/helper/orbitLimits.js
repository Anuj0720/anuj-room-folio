const deg = (d) => (d * Math.PI) / 180;

export const ORBIT_LIMITS = {
  minPolarAngle: deg(50), // can't look down more steeply than this
  maxPolarAngle: deg(88), // can't drop below the room's floor line
  minAzimuthAngle: deg(15), // left rotation limit
  maxAzimuthAngle: deg(95), // right rotation limit
  minDistance: 25, // zoom-in limit
  maxDistance: 55, // zoom-out limit
};

export const ORBIT_UNLIMITED = {
  minPolarAngle: 0,
  maxPolarAngle: Math.PI,
  minAzimuthAngle: -Infinity,
  maxAzimuthAngle: Infinity,
  minDistance: 0,
  maxDistance: Infinity,
};
