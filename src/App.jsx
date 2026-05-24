import { Canvas, useThree } from "@react-three/fiber";
import { OrbitControls, Stage } from "@react-three/drei";
import { Suspense, useEffect, useRef, useState } from "react";
import { useControls, button, folder } from "leva";
import { Room } from "./components/r3f/Room";
import { Imac } from "./components/r3f/Imac";
import BackButton from "./components/ui/BackButton";

function CameraController() {
  const { camera, controls } = useThree();

  const [{ camX, camY, camZ, tarX, tarY, tarZ }, set] = useControls(
    "Camera",
    () => ({
      Position: folder({
        camX: { value: 29.61, step: 1 },
        camY: { value: -24.7, step: 1 },
        camZ: { value: -10.17, step: 1 },
      }),
      Target: folder({
        tarX: { value: -2.11, step: 1 },
        tarY: { value: -30.5, step: 1 },
        tarZ: { value: -10.12, step: 1 },
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
    camera.position.set(camX, camY, camZ);
    controls.target.set(tarX, tarY, tarZ);
    controls.update();
  }, [camX, camY, camZ, tarX, tarY, tarZ, camera, controls]);

  useEffect(() => {
    if (!controls) return;

    const onUpdate = () => {
      set({
        camX: parseFloat(camera.position.x.toFixed(3)),
        camY: parseFloat(camera.position.y.toFixed(3)),
        camZ: parseFloat(camera.position.z.toFixed(3)),
        tarX: parseFloat(controls.target.x.toFixed(3)),
        tarY: parseFloat(controls.target.y.toFixed(3)),
        tarZ: parseFloat(controls.target.z.toFixed(3)),
      });
    };

    controls.addEventListener("change", onUpdate);
    return () => controls.removeEventListener("change", onUpdate);
  }, [controls, camera, set]);

  return null;
}

export default function App() {
  const [showBackButton, setShowBackButton] = useState(false);
  const [orbitEnabled, setOrbitEnabled] = useState(true);
  const resetCameraRef = useRef(null);

  const handleZoomIn = () => {
    setOrbitEnabled(false);
  };

  const handleZoomComplete = () => {
    setShowBackButton(true);
  };

  const handleResetClick = () => {
    setShowBackButton(false);
    resetCameraRef.current?.();
  };

  const handleResetComplete = () => {
    setOrbitEnabled(true);
  };

  return (
    <div style={{ width: "100vw", height: "100vh", background: "#1a1a1a" }}>
      {showBackButton && <BackButton onClick={handleResetClick} />}
      <Canvas camera={{ position: [29.61, -24.7, -10.17], fov: 35 }}>
        <Suspense fallback={null}>
          <Stage environment="apartment" intensity={0.5} adjustCamera={false}>
            <Room />
            <Imac
              onZoomIn={handleZoomIn}
              onZoomComplete={handleZoomComplete}
              resetCameraRef={resetCameraRef}
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
