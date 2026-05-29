import { useCallback, useEffect, useRef } from "react";
import { useGLTF } from "@react-three/drei";
import { useThree } from "@react-three/fiber";
import * as THREE from "three";
import { moveCamera } from "../../helper/cameraMover";
import {
  getSpidermanVideoTexture,
  getSpidermanVideoElement,
} from "../../helper/video";

export function Tv({
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
  const tvScreenRef = useRef(null);
  const tvVideoElement = useRef(null);
  const hoveredMesh = useRef(null);

  useEffect(() => {
    const id = setTimeout(() => {
      defaultCamPos.current.copy(camera.position);
      if (controls) defaultTarget.current.copy(controls.target);
    }, 100);
    return () => clearTimeout(id);
  }, [camera, controls]);

  useEffect(() => {
    if (!scene) return;

    const videoTexture = getSpidermanVideoTexture();
    const videoElement = getSpidermanVideoElement();
    tvVideoElement.current = videoElement;
    if (!videoTexture) return;

    videoTexture.flipY = false;
    videoTexture.needsUpdate = true;

    scene.traverse((child) => {
      if (!child.isMesh) return;
      if (child.name?.startsWith("tv_screen_")) {
        child.material = new THREE.MeshBasicMaterial({
          map: videoTexture,
          toneMapped: false,
        });
        child.material.needsUpdate = true;
        tvScreenRef.current = child;
      }
    });
  }, [scene]);

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
        if (tvVideoElement.current) {
          tvVideoElement.current.muted = true;
        }
        onResetComplete?.();
      },
    });
  }, [camera, controls, onResetComplete]);

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

      const intersects = tvScreenRef.current
        ? raycaster.intersectObject(tvScreenRef.current, false)
        : [];

      if (intersects.length > 0) {
        gl.domElement.style.cursor = "pointer";
        hoveredMesh.current = intersects[0].object;
      } else {
        gl.domElement.style.cursor = "default";
        hoveredMesh.current = null;
      }
    };

    const handleClick = () => {
      if (!hoveredMesh.current) return;
      if (isZoomedIn.current) return;
      if (isAnimating.current) return;

      isZoomedIn.current = true;
      isAnimating.current = true;
      onZoomIn?.();
      if (tvVideoElement.current) {
        tvVideoElement.current.play().catch(() => {});
      }

      moveCamera({
        camera,
        controls,
        position: { x: -9.96, y: -32.36, z: -6.75 },
        target: { x: -9.96, y: -32.39, z: -7.96 },
        onComplete: () => {
          isAnimating.current = false;
          onZoomComplete?.();
          if (tvVideoElement.current) {
            tvVideoElement.current.muted = false;
            tvVideoElement.current.play().catch(() => {});
          }
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

useGLTF.preload("/models/room.glb");
