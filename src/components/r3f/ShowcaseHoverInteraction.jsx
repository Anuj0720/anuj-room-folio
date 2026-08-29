import { useCallback, useEffect, useRef } from "react";
import { useThree } from "@react-three/fiber";
import { useGLTF } from "@react-three/drei";
import * as THREE from "three";
import { DEFAULT_CAMERA, moveCamera } from "../../helper/cameraMover";
import {
  registerCursorTarget,
  setHover,
  clearHover,
} from "../../helper/cursorManager";
import { SHOWCASE_TARGETS } from "./showcaseTargets";

const NIGHT_OVERLAY_SUFFIX = "_night_overlay";

function getTargetForMeshName(meshName) {
  const name = meshName.toLowerCase();

  return (
    SHOWCASE_TARGETS.find((target) =>
      target.match.some((part) => name.includes(part.toLowerCase())),
    ) ?? null
  );
}

export function ShowcaseHoverInteraction({
  onTargetSelected,
  onZoomStart,
  resetCameraRef,
  onResetComplete,
}) {
  const { scene } = useGLTF("/models/room.glb");
  const { camera, controls, gl } = useThree();

  const targetMeshesRef = useRef([]);
  const isAnimating = useRef(false);
  const isZoomedIn = useRef(false);
  const selectedIdRef = useRef(null);
  const hoveredIdRef = useRef(null);


  // Find every mesh whose name contains one of the configured match strings.
  useEffect(() => {
    if (!scene) return;

    const meshes = [];

    scene.traverse((child) => {
      if (!child.isMesh) return;

      const lowerName = child.name.toLowerCase();
      if (lowerName.endsWith(NIGHT_OVERLAY_SUFFIX)) return;

      if (getTargetForMeshName(child.name)) {
        meshes.push(child);
      }
    });

    targetMeshesRef.current = meshes;
  }, [scene]);

  const resetCamera = useCallback(() => {
    if (!camera || !controls || isAnimating.current) return;

    isAnimating.current = true;
    setHover("showcaseTargets", false);

    moveCamera({
      camera,
      controls,
      position: DEFAULT_CAMERA.position,
      target: DEFAULT_CAMERA.target,
      onComplete: () => {
        isAnimating.current = false;
        isZoomedIn.current = false;
        selectedIdRef.current = null;
        hoveredIdRef.current = null;

        setHover("showcaseTargets", false);
        onTargetSelected?.(null);
        onResetComplete?.();
      },
    });
  }, [camera, controls, onResetComplete, onTargetSelected]);

  useEffect(() => {
    if (!resetCameraRef) return;
    resetCameraRef.current = resetCamera;

    return () => {
      if (resetCameraRef.current === resetCamera) {
        resetCameraRef.current = null;
      }
    };
  }, [resetCameraRef, resetCamera]);

  useEffect(() => {
    if (!gl || !camera || !controls) return;

    registerCursorTarget(gl.domElement);

    const raycaster = new THREE.Raycaster();
    const pointer = new THREE.Vector2();

    const getHoveredTarget = (event) => {
      if (isZoomedIn.current || isAnimating.current) return null;

      const rect = gl.domElement.getBoundingClientRect();

      pointer.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
      pointer.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

      raycaster.setFromCamera(pointer, camera);

      const intersects = raycaster.intersectObjects(
        targetMeshesRef.current,
        false,
      );

      if (!intersects.length) return null;

      return getTargetForMeshName(intersects[0].object.name);
    };

    // Hover ONLY controls the cursor. It never moves the camera.
    const handlePointerMove = (event) => {
      const target = getHoveredTarget(event);

      if (!target) {
        hoveredIdRef.current = null;
        setHover("showcaseTargets", false);
        return;
      }

      hoveredIdRef.current = target.id;
      setHover("showcaseTargets", true);
    };

    const handleClick = (event) => {
      if (isZoomedIn.current || isAnimating.current) return;

      const target = getHoveredTarget(event);
      if (!target) return;

      isAnimating.current = true;
      hoveredIdRef.current = target.id;
      setHover("showcaseTargets", false);

      onZoomStart?.();
      onTargetSelected?.(null);

      moveCamera({
        camera,
        controls,
        position: target.camera.position,
        target: target.camera.target,
        onComplete: () => {
          isAnimating.current = false;
          isZoomedIn.current = true;
          selectedIdRef.current = target.id;
          hoveredIdRef.current = null;
          setHover("showcaseTargets", false);
          onTargetSelected?.(target.id);
        },
      });
    };

    const handlePointerLeave = () => {
      hoveredIdRef.current = null;
      setHover("showcaseTargets", false);
    };

    gl.domElement.addEventListener("pointermove", handlePointerMove);
    gl.domElement.addEventListener("click", handleClick);
    gl.domElement.addEventListener("pointerleave", handlePointerLeave);

    return () => {
      clearHover("showcaseTargets");
      gl.domElement.removeEventListener("pointermove", handlePointerMove);
      gl.domElement.removeEventListener("click", handleClick);
      gl.domElement.removeEventListener("pointerleave", handlePointerLeave);
    };
  }, [gl, camera, controls, onTargetSelected, onZoomStart]);

  return null;
}

useGLTF.preload("/models/room.glb");
