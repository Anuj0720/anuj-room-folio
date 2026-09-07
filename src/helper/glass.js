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

export const posterGlassMaterial = new THREE.MeshBasicMaterial({
  // Plain unlit material, not MeshPhysicalMaterial — a PBR glass with
  // roughness: 0 is a near-perfect mirror, and now that the polygon
  // offset below makes it win the depth test 100% of the time (fixing
  // the z-fighting flicker), its own reflective sheen was permanently
  // covering the photo underneath instead of just tinting it. A flat
  // unlit color has no lighting-dependent reflectivity to fight with,
  // so the photo stays clearly visible through a faint tint regardless
  // of scene lighting/environment.
  color: new THREE.Color('#ffffff'),
  transparent: true,
  opacity: 0.08,
  side: THREE.FrontSide,
  depthWrite: false,      // transparent overlay shouldn't write depth
  // The glass sits directly on top of (coplanar with) the poster photo
  // mesh — without a depth offset the two fight for the same depth
  // value and flicker/moiré ("z-fighting"), worse the closer the
  // camera gets. Nudge the glass fragment depth slightly toward the
  // camera so it unambiguously wins.
  polygonOffset: true,
  polygonOffsetFactor: -1,
  polygonOffsetUnits: -1,
})