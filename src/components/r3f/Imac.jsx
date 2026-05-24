import { useGLTF, Html } from "@react-three/drei";
import { useCallback, useEffect, useRef, useState } from "react";
import { useThree } from "@react-three/fiber";
import * as THREE from "three";
import gsap from "gsap";

const toRad = THREE.MathUtils.degToRad;

export function Imac({
  onZoomIn,
  onZoomComplete,
  resetCameraRef,
  onResetComplete,
}) {
  const { scene } = useGLTF("/models/room.glb");
  const { camera, controls } = useThree();
  const [mesh, setMesh] = useState(null);
  const [isZoomedIn, setIsZoomedIn] = useState(false);
  const defaultCamPos = useRef(new THREE.Vector3());
  const defaultTarget = useRef(new THREE.Vector3());

  // ── Save default camera on mount ─────────────────────────
  useEffect(() => {
    defaultCamPos.current.copy(camera.position);
    if (controls) defaultTarget.current.copy(controls.target);
  }, [camera, controls]);

  // ── Find imac_screen mesh ─────────────────────────────────
  useEffect(() => {
    if (!scene) return;

    scene.traverse((child) => {
      if (!child.isMesh) return;
      if (child.name === "imac_screen") {
        child.material = new THREE.MeshBasicMaterial({
          transparent: true,
          opacity: 0,
        });
        setMesh(child);
      }
    });
  }, [scene]);

  // ── Zoom to iMac ──────────────────────────────────────────
  const zoomToImac = () => {
    if (isZoomedIn) return;
    setIsZoomedIn(true);
    onZoomIn?.();

    gsap.to(camera.position, {
      x: -11,
      y: -28,
      z: -10,
      duration: 2,
      ease: "power2.inOut",
      onComplete: () => onZoomComplete?.(),
    });

    if (controls) {
      gsap.to(controls.target, {
        x: -26,
        y: -32,
        z: -9,
        duration: 2,
        ease: "power2.inOut",
        onUpdate: () => controls.update(),
      });
    }
  };

  const resetCamera = useCallback(() => {
    setIsZoomedIn(false);

    gsap.to(camera.position, {
      x: 29.61,
      y: -24.7,
      z: -10.17,
      duration: 2,
      ease: "power2.inOut",
      onComplete: () => onResetComplete?.(),
    });

    if (controls) {
      gsap.to(controls.target, {
        x: -2.11,
        y: -30.5,
        z: -10.12,
        duration: 2,
        ease: "power2.inOut",
        onUpdate: () => controls.update(),
      });
    }
  }, [camera, controls, onResetComplete]);

  useEffect(() => {
    if (!resetCameraRef) return;
    resetCameraRef.current = resetCamera;
  }, [resetCameraRef, resetCamera]);

  if (!mesh) return null;

  return (
    <primitive object={mesh}>
      <Html
        transform
        wrapperClass="imac-screen"
        distanceFactor={1.09}
        position={[0.58, -0.02, 0]}
        rotation={[toRad(-90), toRad(0), toRad(90)]}
      >
        <div style={{ position: "relative", width: "100%", height: "100%" }}>
          {!isZoomedIn && (
            <div
              onClick={zoomToImac}
              style={{
                position: "absolute",
                inset: 0,
                zIndex: 10,
                cursor: "pointer",
              }}
            />
          )}
          <iframe
            src="https://macos-portfolio-red.vercel.app/"
            onClick={zoomToImac}
            style={{
              width: "1400px",
              height: "666px",
              border: "none",
              display: "block",
              borderRadius: "20px 20px 0px 0px",
            }}
            title="macOS Portfolio"
            allow="autoplay; fullscreen"
          />
        </div>
      </Html>
    </primitive>
  );
}
