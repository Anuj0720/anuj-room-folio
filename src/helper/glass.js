import * as THREE from 'three';

// Glass Material
export const glassMaterial = new THREE.MeshPhysicalMaterial({
  transmission: 1,
  thickness: 0.5,
  roughness: 0,
  metalness: 0,
  ior: 1.5,
  transparent: true,
  opacity: 1,
  envMapIntensity: 1,
  attenuationDistance: 0.5,
  attenuationColor: new THREE.Color("#ffffff"),
});

export const posterGlassMaterial = new THREE.MeshPhysicalMaterial({
  transmission: 0,        // ← turn off transmission
  transparent: true,
  opacity: 0.15,          // ← simple alpha transparency instead
  roughness: 0,
  metalness: 0.1,
  ior: 1.5,
  color: new THREE.Color('#ffffff'),
  envMapIntensity: 1,
  side: THREE.FrontSide,  // ← FrontSide only, no back face distortion
})