import { useEffect, useRef } from "react";
import { useControls } from "leva";
import { createLoadingReveal } from "../shaders/loadingShader";

export default function LoadingReveal({ onComplete }) {
  const containerRef = useRef(null);
  const revealRef = useRef(null);

  const { duration, color } = useControls("Loading Reveal", {
    duration: { value: 3600, min: 500, max: 8000, step: 100, label: "duration (ms)" },
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
