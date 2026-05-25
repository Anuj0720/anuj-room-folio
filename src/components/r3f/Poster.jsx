import { useGLTF, useTexture } from "@react-three/drei";
import { useCallback, useEffect, useRef } from "react";
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
  const isAnimating = useRef(false);
  const isZoomedIn = useRef(false);
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

  // ── Save default camera on mount ─────────────────────────
  useEffect(() => {
    const id = setTimeout(() => {
      defaultCamPos.current.copy(camera.position);
      if (controls) defaultTarget.current.copy(controls.target);
    }, 100);
    return () => clearTimeout(id);
  }, [camera, controls]);

  // ── Apply textures ────────────────────────────────────────
  useEffect(() => {
    if (!scene) return;

    ;[ronaldo, maldini, kroos, kaka].forEach((tex) => {
      if (!tex) return;
      tex.flipY = false;
      tex.colorSpace = THREE.SRGBColorSpace;
      tex.needsUpdate = true;
    });

    const posterMap = {
      Poster1_photo: ronaldo,
      Poster2_photo: maldini,
      Poster3_photo: kroos,
      Poster4_photo: kaka,
    }

    const posterMeshes = [];

    scene.traverse((child) => {
      if (!child.isMesh) return;

      const name = child.name;

      if (name.toLowerCase().includes("screen_glass")) {
        child.material = posterGlassMaterial;
        return;
      }

      const tex = posterMap[name];
      if (!tex) return;

      child.material = new THREE.MeshBasicMaterial({
        map: tex,
        toneMapped: false,
        side: THREE.FrontSide,
        needsUpdate: true,
      });

      posterMeshes.push(child);
      console.log("✅ Poster applied to:", name);
    });

    posterMeshesRef.current = posterMeshes;
  }, [scene, ronaldo, maldini, kroos, kaka]);

  // ── Reset camera ──────────────────────────────────────────
  const resetCamera = useCallback(() => {
    if (isAnimating.current) return;
    isAnimating.current = true;

    moveCamera({
      camera,
      controls,
      position: {
        x: defaultCamPos.current.x,
        y: defaultCamPos.current.y,
        z: defaultCamPos.current.z,
      },
      target: {
        x: defaultTarget.current.x,
        y: defaultTarget.current.y,
        z: defaultTarget.current.z,
      },
      onComplete: () => {
        isAnimating.current = false;
        isZoomedIn.current = false;
        onResetComplete?.();
      },
    });
  }, [camera, controls, onResetComplete]);

  // ── Register reset ref ────────────────────────────────────
  useEffect(() => {
    if (!resetCameraRef) return;
    resetCameraRef.current = resetCamera;
  }, [resetCameraRef, resetCamera]);

  // ── Pointer move + click ──────────────────────────────────
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
      if (!hoveredPoster.current) return;
      if (isZoomedIn.current) return;
      if (isAnimating.current) return;

      isZoomedIn.current = true;
      isAnimating.current = true;
      onZoomIn?.();

      moveCamera({
        camera,
        controls,
        position: { x: -11, y: -29, z: -7 },
        target: { x: -11, y: -29, z: -9 },
        onComplete: () => {
          isAnimating.current = false;
          onZoomComplete?.();
        },
      });
    };

    gl.domElement.addEventListener("pointermove", handlePointerMove);
    gl.domElement.addEventListener("click", handleClick);

    return () => {
      gl.domElement.style.cursor = "default";
      gl.domElement.removeEventListener("pointermove", handlePointerMove);
      gl.domElement.removeEventListener("click", handleClick);
    };
  }, [gl, camera, controls, onZoomIn, onZoomComplete]);

  return null;
}
