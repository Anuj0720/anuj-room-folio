import { useEffect, useRef } from "react";
import { useThree } from "@react-three/fiber";
import { useGLTF } from "@react-three/drei";
import gsap from "gsap";
import { moveCamera, DEFAULT_CAMERA } from "../../helper/cameraMover";
import { buildTourSteps } from "../../helper/introTour";

// Runs the "Show intro" camera tour while `active` is true.
//  onStep(label)  – name of the stop currently being shown
//  onFinish()     – tour ended (finished OR skipped, after flying home)
//  skipRef        – App calls skipRef.current() to skip: the tour stops
//                   and the camera flies straight back to the start.
export function IntroTour({ active, onStep, onFinish, skipRef }) {
  const { scene } = useGLTF("/models/room.glb");
  const { camera, controls } = useThree();

  // Keep the latest callbacks without restarting the tour when they change.
  const onStepRef = useRef(onStep);
  const onFinishRef = useRef(onFinish);
  onStepRef.current = onStep;
  onFinishRef.current = onFinish;

  const skipFnRef = useRef(null);

  useEffect(() => {
    if (!active || !camera || !controls) return;

    let stopped = false; // sequence halted (skip / cleanup)
    let finished = false; // onFinish already fired
    let timer = null;
    let cancelCustom = null; // cancels a stop's own effect (poster spotlight)

    const killTweens = () => {
      timer?.kill();
      timer = null;
      cancelCustom?.();
      cancelCustom = null;
      gsap.killTweensOf(camera.position);
      gsap.killTweensOf(controls.target);
    };

    const finish = () => {
      if (finished) return;
      finished = true;
      onStepRef.current?.("");
      onFinishRef.current?.();
    };

    const steps = buildTourSteps(scene, camera);

    const run = (i) => {
      if (stopped) return;

      const s = steps[i];
      onStepRef.current?.(s.label);

      moveCamera({
        camera,
        controls,
        position: s.position,
        target: s.target,
        duration: s.move,
        ease: "power2.inOut",
        onComplete: () => {
          if (stopped) return;
          if (i === steps.length - 1) return finish();
          if (s.custom) {
            // stop with its own effect: it calls back when finished
            cancelCustom = s.custom(() => {
              cancelCustom = null;
              run(i + 1);
            });
          } else {
            timer = gsap.delayedCall(s.hold, () => run(i + 1));
          }
        },
      });
    };

    // tiny pause so the orbit limits are lifted before the first move
    timer = gsap.delayedCall(0.15, () => run(0));

    // Skip: stop the sequence, glide home, then finish.
    skipFnRef.current = () => {
      if (stopped || finished) return;
      stopped = true;
      killTweens();
      onStepRef.current?.("");
      moveCamera({
        camera,
        controls,
        position: DEFAULT_CAMERA.position,
        target: DEFAULT_CAMERA.target,
        duration: 1.2,
        ease: "power2.inOut",
        onComplete: finish,
      });
    };

    return () => {
      // unmount / active -> false: nothing may keep moving the camera
      stopped = true;
      killTweens();
      skipFnRef.current = null;
    };
  }, [active, camera, controls, scene]);

  useEffect(() => {
    if (!skipRef) return;
    skipRef.current = () => skipFnRef.current?.();
    return () => {
      skipRef.current = null;
    };
  }, [skipRef]);

  return null;
}
