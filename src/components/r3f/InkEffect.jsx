import { useEffect, useMemo, useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import gsap from "gsap";
import { InkPipeline } from "../../helper/inkPipeline";
import { glassMaterial, posterGlassMaterial } from "../../helper/glass";
import { INK_BUTTON_CENTER } from "../ui/InkToggler";

// Hand-inked "sketch" look 
const GLASS_MATERIALS = [glassMaterial, posterGlassMaterial];

function fadeGlass(progress) {
  const k = 1 - Math.min(1, progress * 1.15); // fully gone a little early
  for (const m of GLASS_MATERIALS) {
    if (m.userData.baseOpacity === undefined) m.userData.baseOpacity = m.opacity;
    m.opacity = m.userData.baseOpacity * k;
    m.visible = k > 0.001; // skip drawing it entirely once invisible
  }
}

export function InkEffect({ enabled }) {
  const gl = useThree((s) => s.gl);
  const size = useThree((s) => s.size);

  const pipeline = useMemo(() => new InkPipeline(), []);
  const state = useRef({ progress: 0 });

  useEffect(
    () => () => {
      pipeline.dispose();
      fadeGlass(0); // leave the glass exactly as it was
    },
    [pipeline],
  );

  useEffect(() => {
    const tween = gsap.to(state.current, {
      progress: enabled ? 1 : 0,
      duration: enabled ? 1.8 : 1.3,
      ease: "power2.inOut",
    });
    return () => tween.kill();
  }, [enabled]);

  // Positive priority = we take over rendering from R3F.
  useFrame(({ scene, camera, clock }) => {
    const p = state.current.progress;
    fadeGlass(p);

    if (p <= 0.0005) {
      gl.render(scene, camera); // regular 3D view
      return;
    }

    // wipe starts right where the toggle button sits (uv, origin bottom-left)
    const origin = [
      1 - INK_BUTTON_CENTER.right / size.width,
      1 - INK_BUTTON_CENTER.top / size.height,
    ];

    pipeline.render(gl, scene, camera, {
      progress: p,
      origin,
      seed: Math.floor(clock.elapsedTime * 5), // lines "boil" 5x per second
    });
  }, 1);

  return null;
}
