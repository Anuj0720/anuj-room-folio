import * as THREE from 'three';

// Glass Material
export const glassMaterial = new THREE.MeshPhysicalMaterial({
  transmission: 0,          
  transparent: true,
  opacity: 0.2,            
  roughness: 0,
  metalness: 0,
  ior: 1.5,
  color: new THREE.Color("#ffffff"),
  envMapIntensity: 1,
  side: THREE.DoubleSide,  
  depthWrite: false,        
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