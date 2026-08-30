import { useEffect, useRef } from "react";
import { useControls } from "leva";
import { createLoadingReveal } from "../shaders/loadingShader";

export default function LoadingReveal({ onComplete }) {
  const containerRef = useRef(null);
  const revealRef = useRef(null);

  const { duration, color } = useControls("Loading Reveal", {
    duration: { value: 3600, min: 500, max: 8000, step: 100, label: "duration (ms)" },
    color: { value: "#0e0e0e" },
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
    // Only built once on mount — duration/color changes are pushed into
    // the already-running instance below instead of rebuilding it.
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
