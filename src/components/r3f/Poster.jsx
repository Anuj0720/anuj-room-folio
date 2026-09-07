import { useGLTF, useTexture } from "@react-three/drei";
import { useCallback, useEffect, useRef } from "react";
import { useThree } from "@react-three/fiber";
import * as THREE from "three";
import { DEFAULT_CAMERA, moveCamera } from "../../helper/cameraMover";
import { POSTER_ZOOM } from "../../helper/cameraPositions";
import { posterGlassMaterial } from "../../helper/glass";
import { registerCursorTarget, setHover, clearHover } from "../../helper/cursorManager";

export function Poster({
  onZoomIn,
  onZoomComplete,
  resetCameraRef,
  onResetComplete,
  onPosterSelect,
}) {
  const { scene } = useGLTF("/models/room.glb");
  const { camera, controls, gl } = useThree();
  const isAnimating = useRef(false);
  const isZoomedIn = useRef(false);
  const posterMeshesRef = useRef([]);
  const hoveredPoster = useRef(null);

  const [ronaldo, maldini, kroos, kaka] = useTexture([
    "/textures/wall_poster/ronaldo.webp",
    "/textures/wall_poster/paulo_maldini.webp",
    "/textures/wall_poster/toni_kroos.webp",
    "/textures/wall_poster/kaka.webp",
  ]);


  // ── Apply textures ────────────────────────────────────────
  useEffect(() => {
    if (!scene) return;

    [ronaldo, maldini, kroos, kaka].forEach((tex) => {
      if (!tex) return;
      tex.flipY = false;
      tex.colorSpace = THREE.SRGBColorSpace;
      tex.needsUpdate = true;
    });

    const posterMap = {
      poster1_photo: ronaldo,
      poster2_photo: maldini,
      poster3_photo: kroos,
      poster4_photo: kaka,
    };

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
        // The poster plane sits almost coincident with the wall mesh
        // behind it. Room.jsx pushes the wall material forward with a
        // negative polygonOffset (for its own day/night overlay
        // z-fighting fix), so without an offset here too, the wall
        // wins the depth test once camera distance grows and depth
        // precision drops — that's why the photo disappears while the
        // (separately-modeled, non-coincident) frame stays visible.
        // Push the poster further toward the camera than the wall so
        // it always wins, at any distance.
        polygonOffset: true,
        polygonOffsetFactor: -8,
        polygonOffsetUnits: -8,
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
      position: DEFAULT_CAMERA.position,
      target: DEFAULT_CAMERA.target,
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
    registerCursorTarget(gl.domElement);

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
        setHover("poster", true);
        hoveredPoster.current = intersects[0].object;
      } else {
        setHover("poster", false);
        hoveredPoster.current = null;
      }
    };

    const handleClick = () => {
      if (!hoveredPoster.current) return;
      if (isAnimating.current) return;

      const selectedName = hoveredPoster.current.name.toLowerCase();
      const playerId = selectedName.includes("poster1")
        ? 1
        : selectedName.includes("poster2")
          ? 2
          : selectedName.includes("poster3")
            ? 3
            : selectedName.includes("poster4")
              ? 4
              : null;

      if (!playerId) return;

      if (!isZoomedIn.current) {
        isZoomedIn.current = true;
        isAnimating.current = true;
        onZoomIn?.();

        moveCamera({
          camera,
          controls,
          position: POSTER_ZOOM.position,
          target: POSTER_ZOOM.target,
          onComplete: () => {
            isAnimating.current = false;
            onZoomComplete?.();
            onPosterSelect?.(playerId);
          },
        });
        return;
      }

      onPosterSelect?.(playerId);
    };

    gl.domElement.addEventListener("pointermove", handlePointerMove);
    gl.domElement.addEventListener("click", handleClick);

    return () => {
      clearHover("poster");
      gl.domElement.removeEventListener("pointermove", handlePointerMove);
      gl.domElement.removeEventListener("click", handleClick);
    };
  }, [gl, camera, controls, onZoomIn, onZoomComplete]);

  return null;
}
 