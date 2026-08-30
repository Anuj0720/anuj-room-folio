import { useEffect, useState, useRef } from "react";

export default function Loading({ onComplete }) {
  const [progress, setProgress] = useState(0);
  const [phase, setPhase] = useState("loading"); // "loading" | "done"
  const intervalRef = useRef(null);

  useEffect(() => {
    // Simulate loading progress with easing
    intervalRef.current = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          clearInterval(intervalRef.current);
          return 100;
        }
        // Slow down near 100
        const remaining = 100 - prev;
        const increment = Math.max(0.4, remaining * 0.035);
        return Math.min(100, prev + increment);
      });
    }, 40);

    return () => clearInterval(intervalRef.current);
  }, []);

  useEffect(() => {
    if (progress >= 100) {
      setPhase("done");
      const timer = setTimeout(() => onComplete?.(), 400);
      return () => clearTimeout(timer);
    }
  }, [progress, onComplete]);

  // SVG circle math
  const size = 160;
  const strokeWidth = 4;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (progress / 100) * circumference;

  const getStatusText = () => {
    if (progress < 30) return "Initializing scene…";
    if (progress < 55) return "Loading assets…";
    if (progress < 80) return "Building room…";
    if (progress < 100) return "Almost there…";
    return "Ready";
  };

  return (
    <div
      className="fixed inset-0 z-50 flex flex-col items-center justify-center"
      style={{ backgroundColor: "#f47b50" }}
    >
      {/* Loader ring */}
      <div className="relative flex items-center justify-center" style={{ width: size, height: size }}>
        {/* Outer rotating ring */}
        <div
          className="absolute inset-0 rounded-full"
          style={{
            background:
              "conic-gradient(from 0deg, transparent 70%, rgba(255,255,255,0.35) 100%)",
            animation: "spin 3s linear infinite",
          }}
        />

        <svg
          width={size}
          height={size}
          viewBox={`0 0 ${size} ${size}`}
          className="absolute inset-0 -rotate-90"
          style={{ filter: "drop-shadow(0 0 8px rgba(255,255,255,0.4))" }}
        >
          {/* Track */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke="rgba(255,255,255,0.15)"
            strokeWidth={strokeWidth}
          />
          {/* Progress arc */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke="url(#progressGrad)"
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            style={{ transition: "stroke-dashoffset 0.12s ease-out" }}
          />
          <defs>
            <linearGradient id="progressGrad" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#fed7aa" /> {/* Warm light orange */}
              <stop offset="100%" stopColor="#ffffff" /> {/* Pure white */}
            </linearGradient>
          </defs>
        </svg>

        {/* Inner content */}
        <div className="relative flex flex-col items-center justify-center gap-0.5">
          <span
            className="font-mono text-3xl font-light tracking-tighter"
            style={{
              color: phase === "done" ? "#ffffff" : "#ffedd5",
              transition: "color 0.4s ease",
              fontVariantNumeric: "tabular-nums",
            }}
          >
            {Math.floor(progress)}
            <span className="text-lg opacity-70">%</span>
          </span>
        </div>
      </div>

      {/* Status text */}
      <div className="mt-8 flex flex-col items-center gap-2">
        <p
          className="text-xs tracking-[0.25em] uppercase font-medium transition-all duration-300"
          style={{ color: "#ffedd5", opacity: 0.9, letterSpacing: "0.2em" }}
        >
          {getStatusText()}
        </p>

        {/* Tick marks */}
        <div className="flex gap-1 mt-2">
          {[20, 40, 60, 80, 100].map((step) => (
            <div
              key={step}
              className="h-0.5 w-5 rounded-full transition-all duration-500"
              style={{
                background:
                  progress >= step
                    ? "linear-gradient(90deg, #fed7aa, #ffffff)"
                    : "rgba(255,255,255,0.2)",
                transform: progress >= step ? "scaleX(1)" : "scaleX(0.6)",
              }}
            />
          ))}
        </div>
      </div>

      {/* Wordmark / brand */}
      <div className="absolute bottom-10 flex items-center gap-2 opacity-60">
        <div className="w-1 h-1 rounded-full bg-orange-200" />
        <span className="text-[10px] tracking-[0.3em] uppercase text-orange-50 font-light">
          Loading environment
        </span>
        <div className="w-1 h-1 rounded-full bg-white" />
      </div>

      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to   { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}