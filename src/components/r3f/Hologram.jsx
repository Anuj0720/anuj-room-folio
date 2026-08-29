import { useGLTF } from "@react-three/drei";
import { useCallback, useEffect, useRef } from "react";
import { useThree, useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { useControls } from "leva";
import { DEFAULT_CAMERA, moveCamera } from "../../helper/cameraMover";
import { glassMaterial } from "../../helper/glass";
import {
  getPokemonVideoTexture,
  getPokemonVideoElement,
} from "../../helper/video";
import {
  registerCursorTarget,
  setHover,
  clearHover,
} from "../../helper/cursorManager";
import { getSketchyVideoMaterial } from "../shaders/videoShader";

export function Hologram({
  onZoomIn,
  onZoomComplete,
  resetCameraRef,
  onResetComplete,
}) {
  const { scene } = useGLTF("/models/room.glb");
  const { camera, controls, gl } = useThree();
  const isAnimating = useRef(false);
  const isZoomedIn = useRef(false);
  const hologramGlassRef = useRef(null);
  const hologramVideoElement = useRef(null);
  const hoveredMesh = useRef(null);
  const hologramScreenMatRef = useRef(null);

  // --- LEVA CONTROLS SETUP ---
  const shaderControls = useControls("Sketchy Shader", {
    timeMultiplier: { value: 8.0, min: 1.0, max: 24.0, step: 1.0 },
    jitterMagnitude: { value: 0.015, min: 0.0, max: 0.05, step: 0.001 },
    freq: { value: 300, min: 10.0, max: 300.0, step: 1.0 },
    inkColor: "#05050d", // approximates the original vec3(0.02, 0.02, 0.05)
    lumThreshold1: { value: 0.75, min: 0.0, max: 1.0, step: 0.01 },
    lumThreshold2: { value: 0.5, min: 0.0, max: 1.0, step: 0.01 },
    lumThreshold3: { value: 0.25, min: 0.0, max: 1.0, step: 0.01 },
  });

  // --- SYNC LEVA CONTROLS TO UNIFORMS ---
  useEffect(() => {
    if (hologramScreenMatRef.current) {
      const uniforms = hologramScreenMatRef.current.uniforms;
      uniforms.uTimeMultiplier.value = shaderControls.timeMultiplier;
      uniforms.uJitterMagnitude.value = shaderControls.jitterMagnitude;
      uniforms.uFreq.value = shaderControls.freq;
      uniforms.uInkColor.value.set(shaderControls.inkColor);
      uniforms.uLumThresholds.value.set(
        shaderControls.lumThreshold1,
        shaderControls.lumThreshold2,
        shaderControls.lumThreshold3,
      );
    }
  }, [shaderControls]);


  useEffect(() => {
    if (!scene) return;

    const videoTexture = getPokemonVideoTexture();
    const videoElement = getPokemonVideoElement();
    hologramVideoElement.current = videoElement;
    if (!videoTexture) return;

    videoTexture.flipY = false;
    videoTexture.needsUpdate = true;

    scene.traverse((child) => {
      if (!child.isMesh) return;

      if (child.name === "Hologram_Cube_Glass") {
        child.material = glassMaterial;
        child.material.needsUpdate = true;

        child.renderOrder = 20;
        hologramGlassRef.current = child;
        return;
      }

      if (child.name === "Hologram_Screen") {
        const material = getSketchyVideoMaterial(videoTexture);
        child.material = material;
        child.material.needsUpdate = true;
        hologramScreenMatRef.current = material;

        // Initialize uniforms with the current Leva state so it matches on mount
        material.uniforms.uTimeMultiplier.value = shaderControls.timeMultiplier;
        material.uniforms.uJitterMagnitude.value =
          shaderControls.jitterMagnitude;
        material.uniforms.uFreq.value = shaderControls.freq;
        material.uniforms.uInkColor.value.set(shaderControls.inkColor);
        material.uniforms.uLumThresholds.value.set(
          shaderControls.lumThreshold1,
          shaderControls.lumThreshold2,
          shaderControls.lumThreshold3,
        );
        return;
      }
    });
  }, [scene, controls]);

  useFrame((state) => {
    if (hologramScreenMatRef.current) {
      hologramScreenMatRef.current.uniforms.uTime.value =
        state.clock.elapsedTime;
    }
  });

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
        if (hologramVideoElement.current) {
          hologramVideoElement.current.muted = true;
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
    registerCursorTarget(gl.domElement);
    const raycaster = new THREE.Raycaster();
    const pointer = new THREE.Vector2();

    const handlePointerMove = (event) => {
      const rect = gl.domElement.getBoundingClientRect();
      pointer.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
      pointer.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
      raycaster.setFromCamera(pointer, camera);

      const intersects = hologramGlassRef.current
        ? raycaster.intersectObject(hologramGlassRef.current, false)
        : [];

      if (intersects.length > 0) {
        setHover("hologram", true);
        hoveredMesh.current = intersects[0].object;
      } else {
        setHover("hologram", false);
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
      if (hologramVideoElement.current) {
        hologramVideoElement.current.play().catch(() => {});
      }

      moveCamera({
        camera,
        controls,
        position: { x: -12, y: -31, z: -5 },
        target: { x: -25, y: -32, z: -6 },
        onComplete: () => {
          isAnimating.current = false;
          onZoomComplete?.();
          if (hologramVideoElement.current) {
            hologramVideoElement.current.muted = false;
            hologramVideoElement.current.play().catch(() => {});
          }
        },
      });
    };

    gl.domElement.addEventListener("pointermove", handlePointerMove);
    gl.domElement.addEventListener("click", handleClick);

    return () => {
      clearHover("hologram");
      gl.domElement.removeEventListener("pointermove", handlePointerMove);
      gl.domElement.removeEventListener("click", handleClick);
    };
  }, [gl, camera, controls, onZoomIn, onZoomComplete]);

  return null;
}

useGLTF.preload("/models/room.glb");
