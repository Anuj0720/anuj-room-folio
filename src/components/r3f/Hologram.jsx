import { useGLTF } from "@react-three/drei";
import { useCallback, useEffect, useRef } from "react";
import { useThree, useFrame } from "@react-three/fiber";
import * as THREE from "three";
import gsap from "gsap";
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

const BUTTON_NAMES = {
  play: "play_button",
  pause: "pause_button",
  volume: "volume_button",
};

const PRESS_RATIO = 0.4; // fraction of the button's own thickness to sink in
const MIN_PRESS_OFFSET = 0.01;
const PRESS_DURATION = 0.15;


function buildButtonEntry(mesh) {
  if (!mesh.geometry.boundingBox) mesh.geometry.computeBoundingBox();
  const box = mesh.geometry.boundingBox;
  const rawHeight = box ? box.max.y - box.min.y : 0;
  const thickness = rawHeight * (mesh.scale?.y || 1);
  const pressOffset = Math.max(thickness * PRESS_RATIO, MIN_PRESS_OFFSET);

  const localDown = new THREE.Vector3(0, -1, 0)
    .applyQuaternion(mesh.quaternion)
    .normalize();

  const basePosition = mesh.position.clone();
  const pressedPosition = basePosition
    .clone()
    .addScaledVector(localDown, pressOffset);

  return { mesh, basePosition, pressedPosition, pressed: false };
}

function pressButtonEntry(entry, pressed) {
  if (!entry) return;
  entry.pressed = pressed;
  const target = pressed ? entry.pressedPosition : entry.basePosition;
  gsap.to(entry.mesh.position, {
    x: target.x,
    y: target.y,
    z: target.z,
    duration: PRESS_DURATION,
    ease: "power2.out",
    overwrite: true,
  });
}

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

  const playButtonRef = useRef(null);
  const pauseButtonRef = useRef(null);
  const volumeButtonRef = useRef(null);
  const hoveredButtonRef = useRef(null);

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

      const lowerName = child.name.toLowerCase();
      if (lowerName.includes(BUTTON_NAMES.play)) {
        playButtonRef.current = buildButtonEntry(child);
        return;
      }
      if (lowerName.includes(BUTTON_NAMES.pause)) {
        pauseButtonRef.current = buildButtonEntry(child);
        return;
      }
      if (lowerName.includes(BUTTON_NAMES.volume)) {
        volumeButtonRef.current = buildButtonEntry(child);
        return;
      }
    });

    // Reflect the video's actual state in the buttons' resting position
    // (e.g. the volume button starts pressed-in since the video starts muted).
    if (videoElement) {
      pressButtonEntry(pauseButtonRef.current, !videoElement.paused);
      pressButtonEntry(playButtonRef.current, videoElement.paused);
      pressButtonEntry(volumeButtonRef.current, videoElement.muted);
    }

    return () => {
      [playButtonRef, pauseButtonRef, volumeButtonRef].forEach((ref) => {
        if (!ref.current) return;
        gsap.killTweensOf(ref.current.mesh.position);
        ref.current.mesh.position.copy(ref.current.basePosition);
      });
    };
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

        // Reset all three buttons back to their normal, unpressed position.
        hoveredButtonRef.current = null;
        pressButtonEntry(playButtonRef.current, false);
        pressButtonEntry(pauseButtonRef.current, false);
        pressButtonEntry(volumeButtonRef.current, false);
        setHover("hologramButtons", false);

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

    const getButtonEntries = () =>
      [playButtonRef.current, pauseButtonRef.current, volumeButtonRef.current].filter(
        Boolean,
      );

    const handlePointerMove = (event) => {
      const rect = gl.domElement.getBoundingClientRect();
      pointer.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
      pointer.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
      raycaster.setFromCamera(pointer, camera);

      // Buttons are only reachable once zoomed into the hologram.
      if (isZoomedIn.current && !isAnimating.current) {
        const buttonEntries = getButtonEntries();
        const buttonMeshes = buttonEntries.map((e) => e.mesh);
        const buttonHits = buttonMeshes.length
          ? raycaster.intersectObjects(buttonMeshes, false)
          : [];
        const hitButtonMesh = buttonHits[0]?.object ?? null;
        const hitButtonEntry = hitButtonMesh
          ? buttonEntries.find((e) => e.mesh === hitButtonMesh)
          : null;

        hoveredButtonRef.current = hitButtonEntry ?? null;
        setHover("hologramButtons", Boolean(hitButtonEntry));

        // Buttons take priority over the glass hover while zoomed in.
        if (hitButtonEntry) {
          setHover("hologram", false);
          hoveredMesh.current = null;
          return;
        }
      } else {
        hoveredButtonRef.current = null;
        setHover("hologramButtons", false);
      }

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

    const handleButtonClick = () => {
      const entry = hoveredButtonRef.current;
      if (!entry) return false;
      if (!isZoomedIn.current || isAnimating.current) return false;

      const video = hologramVideoElement.current;

      if (entry === playButtonRef.current) {
        video?.play().catch(() => {});
        pressButtonEntry(playButtonRef.current, true);
        pressButtonEntry(pauseButtonRef.current, false);
      } else if (entry === pauseButtonRef.current) {
        video?.pause();
        pressButtonEntry(pauseButtonRef.current, true);
        pressButtonEntry(playButtonRef.current, false);
      } else if (entry === volumeButtonRef.current) {
        if (video) video.muted = !video.muted;
        pressButtonEntry(volumeButtonRef.current, Boolean(video?.muted));
      }

      return true;
    };

    const handleClick = () => {
      if (handleButtonClick()) return;

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
      clearHover("hologramButtons");
      gl.domElement.removeEventListener("pointermove", handlePointerMove);
      gl.domElement.removeEventListener("click", handleClick);
    };
  }, [gl, camera, controls, onZoomIn, onZoomComplete]);

  return null;
}

useGLTF.preload("/models/room.glb");
