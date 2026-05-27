import { Canvas, useThree } from "@react-three/fiber";
import { OrbitControls, Stage } from "@react-three/drei";
import { Suspense, useEffect, useRef, useState } from "react";
import { useControls, button, folder, Leva } from "leva";
import { Room } from "./components/r3f/Room";
import { Imac } from "./components/r3f/Imac";
import { Poster } from "./components/r3f/Poster";
import { Tv } from "./components/r3f/Tv";
import BackButton from "./components/ui/BackButton";
import { Hologram } from "./components/r3f/Hologram";

function CameraController() {
  const { camera, controls } = useThree();

  const [{ camX, camY, camZ, tarX, tarY, tarZ }, set] = useControls(
    "Camera",
    () => ({
      Position: folder({
        camX: { value: 29.61, step: 0.001 },
        camY: { value: -24.7, step: 0.001 },
        camZ: { value: -10.17, step: 0.001 },
      }),
      Target: folder({
        tarX: { value: -2.11, step: 0.001 },
        tarY: { value: -30.5, step: 0.001 },
        tarZ: { value: -10.12, step: 0.001 },
      }),
      "Copy Values": button(() => {
        const pos = camera.position;
        const tar = controls?.target;
        console.log("📷 Camera position:", {
          x: parseFloat(pos.x.toFixed(3)),
          y: parseFloat(pos.y.toFixed(3)),
          z: parseFloat(pos.z.toFixed(3)),
        });
        console.log("🎯 Controls target:", {
          x: parseFloat(tar.x.toFixed(3)),
          y: parseFloat(tar.y.toFixed(3)),
          z: parseFloat(tar.z.toFixed(3)),
        });
      }),
    }),
  );

  useEffect(() => {
    if (!controls) return;

    const equalsCurrent =
      camera.position.x === camX &&
      camera.position.y === camY &&
      camera.position.z === camZ &&
      controls.target.x === tarX &&
      controls.target.y === tarY &&
      controls.target.z === tarZ;

    if (equalsCurrent) return;

    camera.position.set(camX, camY, camZ);
    controls.target.set(tarX, tarY, tarZ);
    controls.update();
  }, [camX, camY, camZ, tarX, tarY, tarZ, camera, controls]);

  useEffect(() => {
    if (!controls) return;

    const lastValues = {
      camX: camera.position.x,
      camY: camera.position.y,
      camZ: camera.position.z,
      tarX: controls.target.x,
      tarY: controls.target.y,
      tarZ: controls.target.z,
    };

    const onUpdate = () => {
      const nextValues = {
        camX: parseFloat(camera.position.x.toFixed(3)),
        camY: parseFloat(camera.position.y.toFixed(3)),
        camZ: parseFloat(camera.position.z.toFixed(3)),
        tarX: parseFloat(controls.target.x.toFixed(3)),
        tarY: parseFloat(controls.target.y.toFixed(3)),
        tarZ: parseFloat(controls.target.z.toFixed(3)),
      };

      const changed =
        nextValues.camX !== lastValues.camX ||
        nextValues.camY !== lastValues.camY ||
        nextValues.camZ !== lastValues.camZ ||
        nextValues.tarX !== lastValues.tarX ||
        nextValues.tarY !== lastValues.tarY ||
        nextValues.tarZ !== lastValues.tarZ;

      if (!changed) return;

      Object.assign(lastValues, nextValues);
      set(nextValues);
    };

    controls.addEventListener("change", onUpdate);
    return () => controls.removeEventListener("change", onUpdate);
  }, [controls, camera, set]);

  return null;
}

export default function App() {
  const [showBackButton, setShowBackButton] = useState(false);
  const [orbitEnabled, setOrbitEnabled] = useState(true);
  const [backButtonTop, setBackButtonTop] = useState(48);
  const [backButtonLeft, setBackButtonLeft] = useState("50%");

  // ── Separate reset refs for each component ────────────────
  const imacResetRef = useRef(null);
  const posterResetRef = useRef(null);
  const tvResetRef = useRef(null);
  const hologramResetRef = useRef(null);

  const handleZoomIn = (top = 48, left = "50%") => {
    setOrbitEnabled(false);
    setBackButtonTop(top);
    setBackButtonLeft(left);
  };

  const handleZoomComplete = () => {
    setShowBackButton(true);
  };

  const handleResetClick = () => {
    setShowBackButton(false);
    imacResetRef.current?.();
    posterResetRef.current?.();
    tvResetRef.current?.();
    hologramResetRef.current?.();
  };

  const handleResetComplete = () => {
    setOrbitEnabled(true);
  };

  return (
    <div style={{ width: "100vw", height: "100vh", background: "#1a1a1a" }}>
      {showBackButton && (
        <BackButton
          onClick={handleResetClick}
          top={backButtonTop}
          left={backButtonLeft}
        />
      )}
      <Leva hidden />
      <Canvas camera={{ position: [29.61, -24.7, -10.17], fov: 35 }}>
        <Suspense fallback={null}>
          <Stage environment="apartment" intensity={0.5} adjustCamera={false}>
            <Room />
            <Imac
              onZoomIn={() => handleZoomIn(48)}
              onZoomComplete={handleZoomComplete}
              resetCameraRef={imacResetRef}
              onResetComplete={handleResetComplete}
            />
            <Poster
              onZoomIn={() => handleZoomIn(28)}
              onZoomComplete={handleZoomComplete}
              resetCameraRef={posterResetRef}
              onResetComplete={handleResetComplete}
            />
            <Tv
              onZoomIn={() => handleZoomIn(0, "39%")}
              onZoomComplete={handleZoomComplete}
              resetCameraRef={tvResetRef}
              onResetComplete={handleResetComplete}
            />
            <Hologram
              onZoomIn={() => handleZoomIn(58, "44%")}
              onZoomComplete={handleZoomComplete}
              resetCameraRef={hologramResetRef}
              onResetComplete={handleResetComplete}
            />
          </Stage>
          <OrbitControls
            makeDefault
            enabled={orbitEnabled}
            target={[-2.11, -30.5, -10.12]}
          />
          <CameraController />
        </Suspense>
      </Canvas>
    </div>
  );
}
