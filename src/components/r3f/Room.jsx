import { useGLTF, useTexture } from "@react-three/drei";
import { useEffect } from "react";
import * as THREE from "three";

useGLTF.setDecoderPath(
  "https://www.gstatic.com/draco/versioned/decoders/1.5.6/",
);

// Glass Material 
const glassMaterial = new THREE.MeshPhysicalMaterial({
  transmission: 1,
  thickness: 0.5,
  roughness: 0,
  metalness: 0,
  ior: 1.5,
  transparent: true,
  opacity: 1,
  envMapIntensity: 1,
  attenuationDistance: 0.5,
  attenuationColor: new THREE.Color('#ffffff'),
})

export function Room() {
  const { scene } = useGLTF("/models/room.glb");

  const [firstTex, secondTex, thirdTex] = useTexture([
    "/textures/room/day/first_day_texture.webp",
    "/textures/room/day/second_day_texture.webp",
    "/textures/room/day/third_day_texture.webp",
  ]);

  useEffect(() => {
    // Configure each texture once
    [firstTex, secondTex, thirdTex].forEach((tex) => {
      tex.flipY = false;
      tex.colorSpace = THREE.SRGBColorSpace;
      tex.needsUpdate = true;
    });

    scene.traverse((child) => {
      if (!child.isMesh) return;

      const name = child.name;

      // Showcase glass material. 
      if(name.includes("_Glass")){
        child.material = glassMaterial;
        return;
      }

      // polygon offset on ALL meshes to push them apart in depth
      child.material = child.material.clone();
      child.material.polygonOffset = true;
      child.material.polygonOffsetFactor = -4;
      child.material.polygonOffsetUnits = -4;
      child.material.needsUpdate = true;

      // then apply textures as before
      let tex = null;
      if (name.includes("First") || name.includes("first")) {
        tex = firstTex;
      } else if (
        name.includes("Second") ||
        name.includes("_second") ||
        name.includes("second")
      ) {
        tex = secondTex;
      } else if (name.includes("background")) {
        tex = thirdTex;
      }

      if (tex) {
        child.material.map = tex;
        child.material.needsUpdate = true;
      }
    });
  }, [scene, firstTex, secondTex, thirdTex]);

  return <primitive object={scene} />;
}

useGLTF.preload("/models/room.glb");
