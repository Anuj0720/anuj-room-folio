import { useEffect, useRef } from "react";
import { useControls } from "leva";
import { createLoadingReveal } from "../shaders/loadingShader";
import { pickByBreakpoint } from "../../helper/breakpoints";

// TODO: add "mobileBig" / "mobileSmall" / "landscape_tablet" keys
// here if the reveal should run at a different speed at those sizes.
const DURATION_BY_BREAKPOINT = {
  desktop: 3600,
  portrait_tablet: 3600,
};

export default function LoadingReveal({ onComplete }) {
  const containerRef = useRef(null);
  const revealRef = useRef(null);

  const { duration, color } = useControls("Loading Reveal", {
    duration: {
      value: pickByBreakpoint(DURATION_BY_BREAKPOINT),
      min: 500,
      max: 8000,
      step: 100,
      label: "duration (ms)",
    },
    color: { value: "#f47b50" },
  });

  useEffect(() => {
    if (!containerRef.current) return;

    const reveal = createLoadingReveal({ duration, color, onComplete });
    revealRef.current = reveal;
    containerRef.current.appendChild(reveal.domElement);

    return () => {
      reveal.dispose();
      reveal.domElement.remove();
      revealRef.current = null;
    };

  }, []);

  useEffect(() => {
    revealRef.current?.setDuration(duration);
  }, [duration]);

  useEffect(() => {
    revealRef.current?.setColor(color);
  }, [color]);

  return (
    <div
      ref={containerRef}
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 10000,
        pointerEvents: "none",
      }}
    />
  );
}
