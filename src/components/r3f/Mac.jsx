import { useCallback, useEffect, useRef } from "react";
import { useGLTF } from "@react-three/drei";
import { useThree } from "@react-three/fiber";
import * as THREE from "three";
import { moveCamera } from "../../helper/cameraMover";
import {
  getOnepieceVideoTexture,
  getOnepieceVideoElement,
} from "../../helper/video";

export function Mac({
  onZoomIn,
  onZoomComplete,
  resetCameraRef,
  onResetComplete,
  macScreenAnimCompleteRef,
}) {
  useGLTF("/models/room.glb");
  const { camera, controls, gl, scene } = useThree();
  const isAnimating = useRef(false);
  const isZoomedIn = useRef(false);
  const defaultCamPos = useRef(new THREE.Vector3());
  const defaultTarget = useRef(new THREE.Vector3());
  const macScreenRef = useRef(null);
  const macVideoMaterialRef = useRef(null);
  const macVideoTextureRef = useRef(null);
  const macVideoElement = useRef(null);
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

    let mounted = true;

    const applyTexture = () => {
      // Find mac_screen mesh — exact name match to avoid touching imac_screen
      let found = null;
      scene.traverse((child) => {
        if (!child.isMesh) return;
        const name = (child.name || "").toLowerCase();
        if (name.includes("mac_screen") && !name.includes("imac_screen")) {
          found = child;
        }
      });

      if (!found) return false;

      const videoTexture = getOnepieceVideoTexture();
      const videoElement = getOnepieceVideoElement();
      if (!mounted) return true;

      macVideoElement.current = videoElement;
      if (!videoTexture) return true;

      videoTexture.flipY = false;
      videoTexture.needsUpdate = true;

      const material = new THREE.MeshBasicMaterial({
        map: videoTexture,
        transparent: true,
        opacity: 0,
        toneMapped: false,
      });

      found.material = material;
      found.material.needsUpdate = true;
      macScreenRef.current = found;
      macVideoMaterialRef.current = material;
      macVideoTextureRef.current = videoTexture;

      return true;
    };

    // Try immediately, else poll (model may not be in scene yet)
    if (!applyTexture()) {
      const interval = setInterval(() => {
        if (!mounted) return;
        if (applyTexture()) clearInterval(interval);
      }, 100);
      return () => {
        mounted = false;
        clearInterval(interval);
      };
    }

    return () => { mounted = false; };
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
        if (macVideoElement.current) {
          macVideoElement.current.muted = true;
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
    const handleMacScreenAnimComplete = () => {
      const material = macVideoMaterialRef.current;
      const videoTexture = macVideoTextureRef.current;
      if (!material || !videoTexture) return;
      material.map = videoTexture;
      material.opacity = 1;
      material.needsUpdate = true;
    };

    if (macScreenAnimCompleteRef) {
      macScreenAnimCompleteRef.current = handleMacScreenAnimComplete;
    }

    return () => {
      if (macScreenAnimCompleteRef) {
        macScreenAnimCompleteRef.current = null;
      }
    };
  }, [macScreenAnimCompleteRef]);

  useEffect(() => {
    if (!gl || !camera || !controls) return;
    const raycaster = new THREE.Raycaster();
    const pointer = new THREE.Vector2();

    const handlePointerMove = (event) => {
      const rect = gl.domElement.getBoundingClientRect();
      pointer.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
      pointer.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
      raycaster.setFromCamera(pointer, camera);

      const intersects = macScreenRef.current
        ? raycaster.intersectObject(macScreenRef.current, false)
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
      if (macVideoElement.current) {
        macVideoElement.current.play().catch(() => {});
      }

      moveCamera({
        camera,
        controls,
        position: { x: -12, y: -30, z: -10.55 },
        target: { x: -30.3, y: -34.2, z: -19.9 },
        onComplete: () => {
          isAnimating.current = false;
          onZoomComplete?.();
          if (macVideoElement.current) {
            macVideoElement.current.muted = false;
            macVideoElement.current.play().catch(() => {});
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