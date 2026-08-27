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
import { Socials } from "./components/r3f/Socials";
import { info } from "./helper/data";
import Loading from "./components/ui/Loading";
import { DayNightToggler } from "./components/ui/DayNightToggler";

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
    const eq =
      camera.position.x === camX && camera.position.y === camY && camera.position.z === camZ &&
      controls.target.x === tarX  && controls.target.y === tarY  && controls.target.z === tarZ;
    if (eq) return;
    camera.position.set(camX, camY, camZ);
    controls.target.set(tarX, tarY, tarZ);
    controls.update();
  }, [camX, camY, camZ, tarX, tarY, tarZ, camera, controls]);

  useEffect(() => {
    if (!controls) return;
    const last = {
      camX: camera.position.x, camY: camera.position.y, camZ: camera.position.z,
      tarX: controls.target.x, tarY: controls.target.y, tarZ: controls.target.z,
    };
    const onUpdate = () => {
      const next = {
        camX: parseFloat(camera.position.x.toFixed(3)),
        camY: parseFloat(camera.position.y.toFixed(3)),
        camZ: parseFloat(camera.position.z.toFixed(3)),
        tarX: parseFloat(controls.target.x.toFixed(3)),
        tarY: parseFloat(controls.target.y.toFixed(3)),
        tarZ: parseFloat(controls.target.z.toFixed(3)),
      };
      const changed = Object.keys(next).some((k) => next[k] !== last[k]);
      if (!changed) return;
      Object.assign(last, next);
      set(next);
    };
    controls.addEventListener("change", onUpdate);
    return () => controls.removeEventListener("change", onUpdate);
  }, [controls, camera, set]);

  return null;
}

export default function App() {
  const [loaded, setLoaded]                 = useState(false);
  const [showBackButton, setShowBackButton] = useState(false);
  const [orbitEnabled, setOrbitEnabled]     = useState(true);
  const [backButtonTop, setBackButtonTop]   = useState(48);
  const [backButtonLeft, setBackButtonLeft] = useState("50%");
  const [drawerOpen, setDrawerOpen]         = useState(false);
  const [selectedPlayerId, setSelectedPlayerId] = useState(null);
  const [isNight, setIsNight]               = useState(false);
  const [animReady, setAnimReady]           = useState(false);

  // Track which screen anims have fired
  const animDoneRef = useRef({ imac: false, mac: false, tv: false });
  // Guard so we only call setAnimReady(true) once
  const animReadySetRef = useRef(false);

  const markAnimReady = useCallback(() => {
    if (animReadySetRef.current) return;
    animReadySetRef.current = true;
    setAnimReady(true);
  }, []);

  const checkAllAnimDone = useCallback(() => {
    const { imac, mac, tv } = animDoneRef.current;
    if (imac && mac && tv) markAnimReady();
  }, [markAnimReady]);


  useEffect(() => {
    if (!loaded) return;
    const id = setTimeout(() => markAnimReady(), 4000);
    return () => clearTimeout(id);
  }, [loaded, markAnimReady]);

  const imacResetRef              = useRef(null);
  const macResetRef               = useRef(null);
  const posterResetRef            = useRef(null);
  const tvResetRef                = useRef(null);
  const hologramResetRef          = useRef(null);
  const imacScreenAnimCompleteRef = useRef(null);
  const macScreenAnimCompleteRef  = useRef(null);
  const tvScreenAnimCompleteRef   = useRef(null);

  const handleZoomIn = useCallback((top = 48, left = "50%") => {
    setOrbitEnabled(false);
    setBackButtonTop(top);
    setBackButtonLeft(left);
  }, []);

  const handleZoomComplete   = useCallback(() => { setShowBackButton(true); }, []);

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

  const handleResetComplete = useCallback(() => { setOrbitEnabled(true); }, []);

  const handleImacScreenAnimComplete = useCallback(() => {
    imacScreenAnimCompleteRef.current?.();
    animDoneRef.current.imac = true;
    checkAllAnimDone();
  }, [checkAllAnimDone]);

  const handleMacScreenAnimComplete = useCallback(() => {
    macScreenAnimCompleteRef.current?.();
    animDoneRef.current.mac = true;
    checkAllAnimDone();
  }, [checkAllAnimDone]);

  const handleTvScreenAnimComplete = useCallback(() => {
    tvScreenAnimCompleteRef.current?.();
    animDoneRef.current.tv = true;
    checkAllAnimDone();
  }, [checkAllAnimDone]);

  return (
    <>
      {!loaded && <Loading onComplete={() => setLoaded(true)} />}
      <div
        style={{
          width:      "100vw",
          height:     "100vh",
          background: "#1a1a1a",
          visibility: loaded ? "visible" : "hidden",
        }}
      >
        {/* Toggler — hidden until animReady, hides again when drawer opens */}
        <DayNightToggler
          isNight={isNight}
          onToggle={setIsNight}
          drawerOpen={drawerOpen}
          animReady={animReady}
        />

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
              <Room isNight={isNight} />
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
              <Socials />
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
          player={info.players.find((p) => p.id === selectedPlayerId)}
          onClose={() => setDrawerOpen(false)}
          isNight={isNight}
        />
      </div>
    </>
  );
}