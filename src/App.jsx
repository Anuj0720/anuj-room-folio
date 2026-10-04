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
import { InteractiveHoverMeshes } from "./components/r3f/InteractiveHoverMeshes";
import { info } from "./helper/data";
import Loading from "./components/ui/Loading";
import LoadingReveal from "./components/ui/LoadingReveal";
import { DayNightToggler } from "./components/ui/DaynightToggler";
import { Showcase } from "./components/r3f/Showcase";
import ShowcaseControls from "./components/ui/ShowcaseControls";
import { ShowcaseHoverInteraction } from "./components/r3f/ShowcaseHoverInteraction";
import { DEFAULT_CAMERA } from "./helper/cameraMover";
import { getCurrentBreakpoint, isSupportedScreen } from "./helper/breakpoints";
import { ORBIT_LIMITS, ORBIT_UNLIMITED } from "./helper/orbitLimits";
import UnsupportedScreen from "./components/ui/UnsupportedScreen";
import { MusicToggler } from "./components/ui/MusicToggler";
import { startBackgroundMusic, stopBackgroundMusic, beginIntroAudio, stopIntroAudio } from "./helper/audio";
import { IntroTour } from "./components/r3f/IntroTour";
import IntroOverlay from "./components/ui/IntroOverlay";
import { loadRonaldoLiveStats } from "./helper/liveStats";
import {
  IMAC_BACK_BUTTON,
  MAC_BACK_BUTTON,
  POSTER_BACK_BUTTON,
  TV_BACK_BUTTON,
  HOLOGRAM_BACK_BUTTON,
} from "./helper/cameraPositions";

function CameraController({ isZoomed }) {
  const { camera, controls } = useThree();

  const [{ camX, camY, camZ, tarX, tarY, tarZ }, set] = useControls(
    "Camera",
    () => ({
      Position: folder({
        camX: { value: DEFAULT_CAMERA.position.x, step: 0.1 },
        camY: { value: DEFAULT_CAMERA.position.y, step: 0.1 },
        camZ: { value: DEFAULT_CAMERA.position.z, step: 0.11 },
      }),
      Target: folder({
        tarX: { value: DEFAULT_CAMERA.target.x, step: 0.1 },
        tarY: { value: DEFAULT_CAMERA.target.y, step: 0.1 },
        tarZ: { value: DEFAULT_CAMERA.target.z, step: 0.1 },
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

    const EPS = 0.0005;
    const eq =
      Math.abs(camera.position.x - camX) < EPS &&
      Math.abs(camera.position.y - camY) < EPS &&
      Math.abs(camera.position.z - camZ) < EPS &&
      Math.abs(controls.target.x - tarX) < EPS &&
      Math.abs(controls.target.y - tarY) < EPS &&
      Math.abs(controls.target.z - tarZ) < EPS;

    if (eq) return;

    camera.position.set(camX, camY, camZ);
    controls.target.set(tarX, tarY, tarZ);
    controls.update();
  }, [camX, camY, camZ, tarX, tarY, tarZ, camera, controls]);

  useEffect(() => {
    if (!controls) return;

    const last = {
      camX: camera.position.x,
      camY: camera.position.y,
      camZ: camera.position.z,
      tarX: controls.target.x,
      tarY: controls.target.y,
      tarZ: controls.target.z,
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

      const changed = Object.keys(next).some((key) => next[key] !== last[key]);
      if (!changed) return;

      Object.assign(last, next);
      set(next);
    };

    controls.addEventListener("change", onUpdate);
    return () => controls.removeEventListener("change", onUpdate);
  }, [controls, camera, set]);

  // ── Snap to the new breakpoint's default camera on resize ──
  // getCurrentBreakpoint()/DEFAULT_CAMERA only ever get re-read when
  // something explicitly calls them again (a zoom-in click, a reset).
  // Nothing was listening for the window crossing a breakpoint
  // boundary, so resizing across desktop <-> landscape_tablet left
  // the camera sitting at whatever position it was created with.
  const breakpointRef = useRef(getCurrentBreakpoint());

  useEffect(() => {
    if (!controls) return;

    const handleResize = () => {
      const next = getCurrentBreakpoint();
      if (next === breakpointRef.current) return;
      breakpointRef.current = next;

      // A zoomed-in shot (mac/poster/tv/etc.) reads its own
      // per-breakpoint position fresh the next time it's entered or
      // reset, so forcing the idle default here while zoomed in
      // would just fight whatever view is currently active.
      if (isZoomed) return;

      const pos = DEFAULT_CAMERA.position;
      const tar = DEFAULT_CAMERA.target;

      camera.position.set(pos.x, pos.y, pos.z);
      controls.target.set(tar.x, tar.y, tar.z);
      controls.update();

      // Keep the Leva panel's sliders in sync with the snap.
      set({
        camX: pos.x,
        camY: pos.y,
        camZ: pos.z,
        tarX: tar.x,
        tarY: tar.y,
        tarZ: tar.z,
      });
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [camera, controls, isZoomed, set]);

  return null;
}

function Portfolio() {
  const [loaded, setLoaded] = useState(false);
  // Flips true only once the post-load spiral reveal has fully
  // resolved — this, not `loaded`, is what's allowed to start Animation.
  const [revealed, setRevealed] = useState(false);
  const [showBackButton, setShowBackButton] = useState(false);
  const [orbitEnabled, setOrbitEnabled] = useState(true);
  const [backButtonTop, setBackButtonTop] = useState(48);
  const [backButtonLeft, setBackButtonLeft] = useState("50%");
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [selectedPlayerId, setSelectedPlayerId] = useState(null);
  const [isNight, setIsNight] = useState(false);
  const [animReady, setAnimReady] = useState(false);

  const [selectedShowcaseId, setSelectedShowcaseId] = useState(null);

  // "Show intro" tour: idle -> pending (waiting for the scene to finish
  // its own animations) -> running (camera tour) -> done.
  const [introMode, setIntroMode] = useState("idle");
  const [introLabel, setIntroLabel] = useState("");
  const introSkipRef = useRef(null);
  const introStartedRef = useRef(false);
  // true once the scene's entire grow-in animation timeline has ended
  const [timelineDone, setTimelineDone] = useState(false);

  // Stop the background track if the portfolio unmounts (window
  // shrunk below the supported size).
  useEffect(() => () => stopBackgroundMusic(), []);

  // Fetch Ronaldo's live stats in the background so they're ready
  // by the time the poster drawer is opened.
  useEffect(() => {
    loadRonaldoLiveStats();
  }, []);

  // Exactly one dissolve effect can run at a time.
  const [activeDissolveId, setActiveDissolveId] = useState(null);

  const animDoneRef = useRef({ imac: false, mac: false, tv: false });
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
    if (!revealed) return;

    const id = setTimeout(() => markAnimReady(), 4000);
    return () => clearTimeout(id);
  }, [revealed, markAnimReady]);

  // Start the camera tour only after the reveal AND the scene's ENTIRE
  // animation timeline (every prop grown in, screens on) has finished.
  // `animReady` is NOT used here — it also flips from a 4s fallback timer,
  // which fires while the timeline is still running.
  useEffect(() => {
    if (introMode !== "pending" || introStartedRef.current) return;
    if (!timelineDone) return;
    introStartedRef.current = true;
    const id = setTimeout(() => {
      setShowBackButton(false);
      setOrbitEnabled(false);
      setIntroMode("running");
    }, 250);
    return () => clearTimeout(id);
  }, [introMode, timelineDone]);

  // Safety net: if the timeline never reports completion (e.g. a model
  // without animated meshes), don't leave the visitor waiting forever.
  useEffect(() => {
    if (introMode !== "pending" || !revealed) return;
    const id = setTimeout(() => setTimelineDone(true), 60000);
    return () => clearTimeout(id);
  }, [introMode, revealed]);

  const handleIntroFinish = useCallback(() => {
    setIntroMode("done");
    setOrbitEnabled(true);
    stopIntroAudio(); // fades out, never plays again; background takes over
  }, []);

  const handleIntroSkip = useCallback(() => {
    if (introMode === "running") {
      introSkipRef.current?.(); // camera glides home, then handleIntroFinish
    } else {
      introStartedRef.current = true; // cancel the pending tour
      handleIntroFinish();
    }
  }, [introMode, handleIntroFinish]);

  const introActive = introMode === "pending" || introMode === "running";

  const imacResetRef = useRef(null);
  const macResetRef = useRef(null);
  const posterResetRef = useRef(null);
  const tvResetRef = useRef(null);
  const hologramResetRef = useRef(null);
  const showcaseResetRef = useRef(null);

  const imacScreenAnimCompleteRef = useRef(null);
  const macScreenAnimCompleteRef = useRef(null);
  const tvScreenAnimCompleteRef = useRef(null);

  // Takes one of the *_BACK_BUTTON configs from cameraPositions.js —
  // each is a getter that already resolves to the right value for the
  // current breakpoint, so this just needs to read .top/.left.
  const handleZoomIn = useCallback((backButton) => {
    setOrbitEnabled(false);
    setBackButtonTop(backButton.top);
    setBackButtonLeft(backButton.left);
  }, []);

  const handleZoomComplete = useCallback(() => {
    setShowBackButton(true);
  }, []);

  const handlePosterSelected = useCallback((playerId) => {
    setSelectedPlayerId(playerId);
    setDrawerOpen(true);
  }, []);

  const handleResetClick = useCallback(() => {

    setActiveDissolveId(null);
    setSelectedShowcaseId(null);
    setShowBackButton(false);
    setDrawerOpen(false);
    setSelectedPlayerId(null);

    imacResetRef.current?.();
    macResetRef.current?.();
    posterResetRef.current?.();
    tvResetRef.current?.();
    hologramResetRef.current?.();
    showcaseResetRef.current?.();
  }, []);

  const handleResetComplete = useCallback(() => {
    setOrbitEnabled(true);
  }, []);

  const handleShowcaseZoomStart = useCallback(() => {
    setOrbitEnabled(false);
    setShowBackButton(false);
  }, []);

  const handleShowcaseTargetSelected = useCallback((id) => {
    setSelectedShowcaseId(id);
    setActiveDissolveId(null);

    if (id) {
      setShowBackButton(true);
    }
  }, []);

  const handleShowcaseResetComplete = useCallback(() => {
    setSelectedShowcaseId(null);
    setActiveDissolveId(null);
    setShowBackButton(false);
    setOrbitEnabled(true);
  }, []);

  const handleStartDissolve = useCallback(() => {
    if (!selectedShowcaseId) return;
    setActiveDissolveId(selectedShowcaseId);
  }, [selectedShowcaseId]);

  const handleStopDissolve = useCallback(() => {
    setActiveDissolveId(null);
  }, []);

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
      {/* The intro reveal only starts after the visitor picks "with" or
          "without" audio on the loading screen. */}
      {!loaded && (
        <Loading
          onEnter={(mode) => {
            if (mode === "intro") {
              beginIntroAudio(); // intro.mp3 plays; background waits
              setIntroMode("pending");
            } else {
              startBackgroundMusic(mode === "audio");
            }
            setLoaded(true);
          }}
        />
      )}
      {loaded && !revealed && (
        <LoadingReveal onComplete={() => setRevealed(true)} />
      )}

      <div
        style={{
          width: "100vw",
          height: "100vh",
          background: "#1a1a1a",
          visibility: loaded ? "visible" : "hidden",
        }}
      >
        <DayNightToggler
          isNight={isNight}
          onToggle={setIsNight}
          drawerOpen={drawerOpen || introActive}
          animReady={animReady}
        />
        <MusicToggler
          isNight={isNight}
          drawerOpen={drawerOpen || introActive}
          animReady={animReady}
        />
        {showBackButton && !drawerOpen && !selectedShowcaseId && (
          <BackButton
            onClick={handleResetClick}
            top={backButtonTop}
            left={backButtonLeft}
          />
        )}

        <ShowcaseControls
          selectedId={selectedShowcaseId}
          isDissolving={activeDissolveId === selectedShowcaseId}
          onStart={handleStartDissolve}
          onStop={handleStopDissolve}
          onBack={handleResetClick}
        />

        {introActive && (
          <IntroOverlay
            label={introLabel}
            canSkip={revealed}
            onSkip={handleIntroSkip}
          />
        )}

        <Leva hidden  />

        <Canvas
          camera={{
            position: [DEFAULT_CAMERA.position.x, DEFAULT_CAMERA.position.y, DEFAULT_CAMERA.position.z],
            fov: 35,
            // Scene is ~40 units across, but the default near/far
            // (0.1 / 2000) spreads the depth buffer's precision over
            // a range 50x too large. That's what let the wall (offset
            // toward camera in Room.jsx) start winning the depth test
            // against coincident meshes like the posters once you
            // zoomed out. Tightening this restores enough precision
            // at real-world orbit distances.
            near: 1,
            far: 1000,
          }}
        >
          <Suspense fallback={null}>
            <Stage
              environment="apartment"
              intensity={0.5}
              adjustCamera={false}
            >
              <Room isNight={isNight} />

              <Animation
                loaded={revealed}
                onImacScreenAnimComplete={handleImacScreenAnimComplete}
                onTvScreenAnimComplete={handleTvScreenAnimComplete}
                onMacScreenAnimComplete={handleMacScreenAnimComplete}
                onAllComplete={() => setTimelineDone(true)}
              />

              <Imac
                onZoomIn={() => handleZoomIn(IMAC_BACK_BUTTON)}
                onZoomComplete={handleZoomComplete}
                resetCameraRef={imacResetRef}
                onResetComplete={handleResetComplete}
                imacScreenAnimCompleteRef={imacScreenAnimCompleteRef}
              />

              <Mac
                onZoomIn={() => handleZoomIn(MAC_BACK_BUTTON)}
                onZoomComplete={handleZoomComplete}
                resetCameraRef={macResetRef}
                onResetComplete={handleResetComplete}
                macScreenAnimCompleteRef={macScreenAnimCompleteRef}
              />

              <Poster
                onZoomIn={() => handleZoomIn(POSTER_BACK_BUTTON)}
                onZoomComplete={handleZoomComplete}
                resetCameraRef={posterResetRef}
                onResetComplete={handleResetComplete}
                onPosterSelect={handlePosterSelected}
              />

              <Tv
                onZoomIn={() => handleZoomIn(TV_BACK_BUTTON)}
                onZoomComplete={handleZoomComplete}
                resetCameraRef={tvResetRef}
                onResetComplete={handleResetComplete}
                tvScreenAnimCompleteRef={tvScreenAnimCompleteRef}
              />

              <Hologram
                onZoomIn={() => handleZoomIn(HOLOGRAM_BACK_BUTTON)}
                onZoomComplete={handleZoomComplete}
                resetCameraRef={hologramResetRef}
                onResetComplete={handleResetComplete}
              />

              <Socials />

              <InteractiveHoverMeshes />

              <Showcase activeId={activeDissolveId} />

              <IntroTour
                active={introMode === "running"}
                onStep={setIntroLabel}
                onFinish={handleIntroFinish}
                skipRef={introSkipRef}
              />

              <ShowcaseHoverInteraction
                onZoomStart={handleShowcaseZoomStart}
                onTargetSelected={handleShowcaseTargetSelected}
                resetCameraRef={showcaseResetRef}
                onResetComplete={handleShowcaseResetComplete}
              />
            </Stage>

            <OrbitControls
              makeDefault
              enabled={orbitEnabled}
              // Limits only apply to the idle room view; close-up zoom
              // shots are outside them, so they're lifted while zoomed.
              {...(orbitEnabled ? ORBIT_LIMITS : ORBIT_UNLIMITED)}
              target={[DEFAULT_CAMERA.target.x, DEFAULT_CAMERA.target.y, DEFAULT_CAMERA.target.z]}
            />

            <CameraController isZoomed={!orbitEnabled} />
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

// Below landscape_tablet nothing is mounted at all — no loader, no
// Canvas, no assets — just the "desktop and tablet only" message.
// Resizing back up mounts the portfolio fresh (intro included).
export default function App() {
  const [supported, setSupported] = useState(isSupportedScreen);

  useEffect(() => {
    const onResize = () => setSupported(isSupportedScreen());
    window.addEventListener("resize", onResize);
    window.addEventListener("orientationchange", onResize);
    return () => {
      window.removeEventListener("resize", onResize);
      window.removeEventListener("orientationchange", onResize);
    };
  }, []);

  return supported ? <Portfolio /> : <UnsupportedScreen />;
}
