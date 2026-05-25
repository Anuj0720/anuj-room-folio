import { useGLTF, useTexture } from "@react-three/drei";
import { useCallback, useEffect, useRef, useState } from "react";
import { useThree } from "@react-three/fiber";
import * as THREE from "three";
import { moveCamera } from "../../helper/cameraMover";
import { posterGlassMaterial } from "../../helper/glass";

export function Poster({
  onZoomIn,
  onZoomComplete,
  resetCameraRef,
  onResetComplete,
}) {
  const { scene } = useGLTF("/models/room.glb");
  const { camera, controls, gl } = useThree();
  const [isZoomedIn, setIsZoomedIn] = useState(false);
  const defaultCamPos = useRef(new THREE.Vector3());
  const defaultTarget = useRef(new THREE.Vector3());
  const posterMeshesRef = useRef([]);
  const hoveredPoster = useRef(null);

  const [ronaldo, maldini, kroos, kaka] = useTexture([
    "/textures/wall_poster/ronaldo.webp",
    "/textures/wall_poster/paulo_maldini.webp",
    "/textures/wall_poster/toni_kroos.webp",
    "/textures/wall_poster/kaka.webp",
  ]);

  useEffect(() => {
    if (!scene) return;

    [ronaldo, maldini, kroos, kaka].forEach((tex) => {
      if (!tex) return;
      tex.flipY = false;
      tex.colorSpace = THREE.SRGBColorSpace;
      tex.needsUpdate = true;
    });

    const basePosterMaterial = new THREE.MeshBasicMaterial({
      toneMapped: false,
      side: THREE.FrontSide,
    });

    const posterMap = {
      Poster1_photo: basePosterMaterial.clone(),
      Poster2_photo: basePosterMaterial.clone(),
      Poster3_photo: basePosterMaterial.clone(),
      Poster4_photo: basePosterMaterial.clone(),
    };

    posterMap.Poster1_photo.map = ronaldo;
    posterMap.Poster2_photo.map = maldini;
    posterMap.Poster3_photo.map = kroos;
    posterMap.Poster4_photo.map = kaka;

    Object.values(posterMap).forEach((material) => {
      material.needsUpdate = true;
    });

    const posterMeshes = [];
    scene.traverse((child) => {
      if (!child.isMesh) return;

      const name = child.name;
      if (name.toLowerCase().includes("screen_glass")) {
        child.material = posterGlassMaterial;
        return;
      }

      const material = posterMap[name];
      if (!material) return;

      child.material = material;
      posterMeshes.push(child);
    });

    posterMeshesRef.current = posterMeshes;
  }, [scene, ronaldo, maldini, kroos, kaka]);

  const resetCamera = useCallback(() => {
    setIsZoomedIn(false);

    moveCamera({
      camera,
      controls,
      position: defaultCamPos.current,
      target: defaultTarget.current,
      onComplete: () => onResetComplete?.(),
    });
  }, [camera, controls, onResetComplete]);

  useEffect(() => {
    defaultCamPos.current.copy(camera.position);
    if (controls) defaultTarget.current.copy(controls.target);
  }, [camera, controls]);

  useEffect(() => {
    if (!resetCameraRef) return;
    resetCameraRef.current = resetCamera;
  }, [resetCameraRef, resetCamera]);

  useEffect(() => {
    if (!gl || !camera || !controls) return;

    const raycaster = new THREE.Raycaster();
    const pointer = new THREE.Vector2();

    const handlePointerMove = (event) => {
      const rect = gl.domElement.getBoundingClientRect();
      pointer.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
      pointer.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
      raycaster.setFromCamera(pointer, camera);

      const intersects = raycaster.intersectObjects(
        posterMeshesRef.current,
        false,
      );
      if (intersects.length > 0) {
        gl.domElement.style.cursor = "pointer";
        hoveredPoster.current = intersects[0].object;
      } else {
        gl.domElement.style.cursor = "default";
        hoveredPoster.current = null;
      }
    };

    const handleClick = () => {
      if (!hoveredPoster.current || isZoomedIn) return;

      setIsZoomedIn(true);
      onZoomIn?.();

      moveCamera({
        camera,
        controls,
        position: { x: -11, y: -29, z: -7 },
        target: { x: -11, y: -29, z: -9 },
        onComplete: () => onZoomComplete?.(),
      });
    };

    gl.domElement.addEventListener("pointermove", handlePointerMove);
    gl.domElement.addEventListener("click", handleClick);

    return () => {
      gl.domElement.style.cursor = "default";
      gl.domElement.removeEventListener("pointermove", handlePointerMove);
      gl.domElement.removeEventListener("click", handleClick);
    };
  }, [gl, camera, controls, isZoomedIn, onZoomIn, onZoomComplete]);

  return null;
}
