import { Canvas, useThree } from "@react-three/fiber";
import { OrbitControls, Stage } from "@react-three/drei";
import { Suspense, useCallback, useEffect, useRef, useState } from "react";
import { useControls, button, folder, Leva } from "leva";
import { Room } from "./components/r3f/Room";
import Animation from "./components/r3f/Animation";
import { Imac } from "./components/r3f/Imac";
import { Mac } from "./components/r3f/Mac";
import { Poster } from "./components/r3f/Poster";
import { Tv } from "./components/r3f/Tv";
import BackButton from "./components/ui/BackButton";
import Drawer from "./components/ui/Drawer";
import { Hologram } from "./components/r3f/Hologram";
import { info } from "./helper/data";

import Loading from "./components/ui/Loading";

function CameraController() {
  const { camera, controls } = useThree();

  const [{ camX, camY, camZ, tarX, tarY, tarZ }, set] = useControls(
    "Camera",
    () => ({
      Position: folder({
        camX: { value: 25.1, step: 0.1 },
        camY: { value: -21.5, step: 0.1 },
        camZ: { value: 6.37, step: 0.11 },
      }),
      Target: folder({
        tarX: { value: -4.5, step: 0.1 },
        tarY: { value: -30.1, step: 0.1 },
        tarZ: { value: -10.12, step: 0.1 },
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
  const [loaded, setLoaded] = useState(false);
  const [showBackButton, setShowBackButton] = useState(false);
  const [orbitEnabled, setOrbitEnabled] = useState(true);
  const [backButtonTop, setBackButtonTop] = useState(48);
  const [backButtonLeft, setBackButtonLeft] = useState("50%");
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [selectedPlayerId, setSelectedPlayerId] = useState(null);

  const imacResetRef = useRef(null);
  const macResetRef = useRef(null);
  const posterResetRef = useRef(null);
  const tvResetRef = useRef(null);
  const hologramResetRef = useRef(null);
  const imacScreenAnimCompleteRef = useRef(null);
  const macScreenAnimCompleteRef = useRef(null);
  const tvScreenAnimCompleteRef = useRef(null);

  const handleZoomIn = useCallback((top = 48, left = "50%") => {
    setOrbitEnabled(false);
    setBackButtonTop(top);
    setBackButtonLeft(left);
  }, []);

  const handleZoomComplete = useCallback(() => {
    setShowBackButton(true);
  }, []);

  const handlePosterSelected = useCallback((playerId) => {
    setSelectedPlayerId(playerId);
    setDrawerOpen(true);
  }, []);

  const handleResetClick = useCallback(() => {
    setShowBackButton(false);
    setDrawerOpen(false);
    setSelectedPlayerId(null);
    imacResetRef.current?.();
    macResetRef.current?.();
    posterResetRef.current?.();
    tvResetRef.current?.();
    hologramResetRef.current?.();
  }, []);

  const handleResetComplete = useCallback(() => {
    setOrbitEnabled(true);
  }, []);

  const handleImacScreenAnimComplete = useCallback(() => {
    imacScreenAnimCompleteRef.current?.();
  }, []);

  const handleMacScreenAnimComplete = useCallback(() => {
    macScreenAnimCompleteRef.current?.();
  }, []);

  const handleTvScreenAnimComplete = useCallback(() => {
    tvScreenAnimCompleteRef.current?.();
  }, []);

  return (
    <>
      {!loaded && <Loading onComplete={() => setLoaded(true)} />}
      <div
        style={{
          width: "100vw",
          height: "100vh",
          background: "#1a1a1a",
          visibility: loaded ? "visible" : "hidden",
        }}
      >
        {showBackButton && !drawerOpen && (
          <BackButton
            onClick={handleResetClick}
            top={backButtonTop}
            left={backButtonLeft}
          />
        )}
        <Leva hidden />
        <Canvas camera={{ position: [25.1, -21.5, 6.37], fov: 35 }}>
          <Suspense fallback={null}>
            <Stage environment="apartment" intensity={0.5} adjustCamera={false}>
              <Room />
              <Animation
                loaded={loaded}
                onImacScreenAnimComplete={handleImacScreenAnimComplete}
                onTvScreenAnimComplete={handleTvScreenAnimComplete}
                onMacScreenAnimComplete={handleMacScreenAnimComplete}
              />
              <Imac
                onZoomIn={() => handleZoomIn(48)}
                onZoomComplete={handleZoomComplete}
                resetCameraRef={imacResetRef}
                onResetComplete={handleResetComplete}
                imacScreenAnimCompleteRef={imacScreenAnimCompleteRef}
              />
              <Mac
                onZoomIn={() => handleZoomIn(16)}
                onZoomComplete={handleZoomComplete}
                resetCameraRef={macResetRef}
                onResetComplete={handleResetComplete}
                macScreenAnimCompleteRef={macScreenAnimCompleteRef}
              />
              <Poster
                onZoomIn={() => handleZoomIn(28)}
                onZoomComplete={handleZoomComplete}
                resetCameraRef={posterResetRef}
                onResetComplete={handleResetComplete}
                onPosterSelect={handlePosterSelected}
              />
              <Tv
                onZoomIn={() => handleZoomIn(0, "39%")}
                onZoomComplete={handleZoomComplete}
                resetCameraRef={tvResetRef}
                onResetComplete={handleResetComplete}
                tvScreenAnimCompleteRef={tvScreenAnimCompleteRef}
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
              target={[-4.5, -30.1, -7.7]}
            />
            <CameraController />
          </Suspense>
        </Canvas>
        <Drawer
          open={drawerOpen}
          player={info.players.find((player) => player.id === selectedPlayerId)}
          onClose={() => setDrawerOpen(false)}
        />
      </div>
    </>
  );
}
