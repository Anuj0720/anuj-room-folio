import { useGLTF, Html } from "@react-three/drei";
import { useCallback, useEffect, useRef, useState } from "react";
import { useThree } from "@react-three/fiber";
import * as THREE from "three";
import { DEFAULT_CAMERA, moveCamera } from "../../helper/cameraMover";
import { IMAC_ZOOM } from "../../helper/cameraPositions";
import { holdBackgroundMusic, releaseBackgroundMusic } from "../../helper/audio";

const toRad = THREE.MathUtils.degToRad;

export function Imac({
  onZoomIn,
  onZoomComplete,
  resetCameraRef,
  onResetComplete,
  imacScreenAnimCompleteRef,
}) {
  const { scene } = useGLTF("/models/room.glb");
  const { camera, controls } = useThree();
  const [mesh, setMesh] = useState(null);
  const [showOverlay, setShowOverlay] = useState(true);
  const [showIframe, setShowIframe] = useState(false);
  const isAnimating = useRef(false);


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
  const zoomToImac = useCallback(() => {
    if (isAnimating.current) return;
    isAnimating.current = true;
    setShowOverlay(false);
    // Pause the background music while the iMac is open.
    holdBackgroundMusic("imac");
    onZoomIn?.();

    moveCamera({
      camera,
      controls,
      position: IMAC_ZOOM.position,
      target: IMAC_ZOOM.target,
      onComplete: () => {
        isAnimating.current = false;
        setShowIframe(true);
        onZoomComplete?.();
      },
    });
  }, [camera, controls, onZoomIn, onZoomComplete]);

  // ── Reset camera ──────────────────────────────────────────
  const resetCamera = useCallback(() => {
    if (isAnimating.current) return;
    isAnimating.current = true;
    setShowOverlay(false);
    // Leaving the iMac -> background music fades back in.
    releaseBackgroundMusic("imac");

    moveCamera({
      camera,
      controls,
      position: DEFAULT_CAMERA.position,
      target: DEFAULT_CAMERA.target,
      onComplete: () => {
        isAnimating.current = false;
        setShowOverlay(true);
        onResetComplete?.();
      },
    });
  }, [camera, controls, onResetComplete]);

  // ── Register reset ref ────────────────────────────────────
  useEffect(() => {
    if (!resetCameraRef) return;
    resetCameraRef.current = resetCamera;
  }, [resetCameraRef, resetCamera]);

  // ── Listen for imac screen animation complete ─────────────
  useEffect(() => {
    const handleImacScreenAnimComplete = () => {
      setShowIframe(true);
    };

    // Store the callback in the ref so Animation can call it
    if (imacScreenAnimCompleteRef) {
      imacScreenAnimCompleteRef.current = handleImacScreenAnimComplete;
    }

    return () => {
      if (imacScreenAnimCompleteRef) {
        imacScreenAnimCompleteRef.current = null;
      }
    };
  }, [imacScreenAnimCompleteRef]);

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
          {showOverlay && (
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
          {showIframe && (
            <iframe
              src="https://macos-portfolio-red.vercel.app/"
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
          )}
        </div>
      </Html>
    </primitive>
  );
}
