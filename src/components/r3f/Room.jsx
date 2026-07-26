import { useGLTF, useTexture } from "@react-three/drei";
import { useEffect, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { glassMaterial } from "../../helper/glass";

useGLTF.setDecoderPath(
  "https://www.gstatic.com/draco/versioned/decoders/1.5.6/",
);

const LERP_SPEED = 0.03;

export function Room({ isNight = false }) {
  const { scene } = useGLTF("/models/room.glb");

  const [firstDayTex, secondDayTex, thirdDayTex] = useTexture([
    "/textures/room/day/first_day_texture.webp",
    "/textures/room/day/second_day_texture.webp",
    "/textures/room/day/third_day_texture.webp",
  ]);

  const [firstNightTex, secondNightTex, thirdNightTex] = useTexture([
    "/textures/room/night/first_night_texture.webp",
    "/textures/room/night/second_night_texture.webp",
    "/textures/room/night/third_night_texture.webp",
  ]);

  const nightMeshesRef = useRef([]);
  const targetOpacityRef = useRef(0);
  const currentOpacityRef = useRef(0);

  useEffect(() => {
    [
      firstDayTex, secondDayTex, thirdDayTex,
      firstNightTex, secondNightTex, thirdNightTex,
    ].forEach((tex) => {
      tex.flipY = false;
      tex.colorSpace = THREE.SRGBColorSpace;
      tex.needsUpdate = true;
    });

    const nightMeshes = [];

    scene.traverse((child) => {
      if (!child.isMesh) return;

      const name = child.name;

      if (name.includes("Showcase_glass")) {
        child.material = glassMaterial;
        return;
      }

      // Determine texture set for this mesh
      let dayTex = null;
      let nightTex = null;

      if (name.includes("First") || name.includes("first")) {
        dayTex = firstDayTex;
        nightTex = firstNightTex;
      } else if (
        name.includes("Second") ||
        name.includes("_second") ||
        name.includes("second")
      ) {
        dayTex = secondDayTex;
        nightTex = secondNightTex;
      } else if (name.includes("background")) {
        dayTex = thirdDayTex;
        nightTex = thirdNightTex;
      }

      // Day layer (base mesh) — use MeshBasicMaterial so baked lighting
      const dayMat = new THREE.MeshBasicMaterial({
        map: dayTex || child.material.map,
        polygonOffset: true,
        polygonOffsetFactor: -4,
        polygonOffsetUnits: -4,
      });
      child.material = dayMat;

      // Night layer 
      if (dayTex && nightTex) {
        const nightMesh = child.clone();
        nightMesh.name = child.name + "_night_overlay";

        const nightMat = new THREE.MeshBasicMaterial({
          map: nightTex,
          transparent: true,
          opacity: 0,
          depthWrite: false,
          polygonOffset: true,
          polygonOffsetFactor: -5,
          polygonOffsetUnits: -5,
        });

        nightMesh.material = nightMat;
        child.parent.add(nightMesh);
        nightMeshes.push(nightMesh);
      }
    });


    nightMeshesRef.current = nightMeshes;
  }, [scene, firstDayTex, secondDayTex, thirdDayTex,
      firstNightTex, secondNightTex, thirdNightTex]);

  // Update target whenever prop changes
  useEffect(() => {
    targetOpacityRef.current = isNight ? 1 : 0;
  }, [isNight]);

  // Lerp opacity every frame for smooth crossfade
  useFrame(() => {
    const target = targetOpacityRef.current;
    const current = currentOpacityRef.current;

    if (Math.abs(target - current) < 0.001) {
      currentOpacityRef.current = target;
    } else {
      currentOpacityRef.current = THREE.MathUtils.lerp(current, target, LERP_SPEED);
    }

    const opacity = currentOpacityRef.current;
    nightMeshesRef.current.forEach((mesh) => {
      if (mesh.material) {
        mesh.material.opacity = opacity;
      }
    });
  });

  return <primitive object={scene} />;
}

useGLTF.preload("/models/room.glb");
