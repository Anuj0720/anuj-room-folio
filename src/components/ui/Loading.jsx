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
      // A brief hold on "Ready", then hand off immediately — no fade-out
      // of our own here. The spiral reveal (already opaque and covering
      // the screen from its very first frame) takes over the transition
      // visual, so there's no gap where nothing opaque is on screen.
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
      className={`
        fixed inset-0 z-50 flex flex-col items-center justify-center
        bg-[#0e0e0e]
      `}
    >
      {/* Ambient glow */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full blur-[120px] opacity-20 transition-all duration-1000"
          style={{
            width: "420px",
            height: "420px",
            background: `conic-gradient(from 0deg, #6366f1, #a78bfa, #38bdf8, #6366f1)`,
            opacity: 0.12 + (progress / 100) * 0.18,
          }}
        />
      </div>

      {/* Loader ring */}
      <div className="relative flex items-center justify-center" style={{ width: size, height: size }}>
        {/* Outer rotating ring */}
        <div
          className="absolute inset-0 rounded-full"
          style={{
            background:
              "conic-gradient(from 0deg, transparent 70%, rgba(99,102,241,0.15) 100%)",
            animation: "spin 3s linear infinite",
          }}
        />

        <svg
          width={size}
          height={size}
          viewBox={`0 0 ${size} ${size}`}
          className="absolute inset-0 -rotate-90"
          style={{ filter: "drop-shadow(0 0 8px rgba(99,102,241,0.5))" }}
        >
          {/* Track */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke="rgba(255,255,255,0.05)"
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
              <stop offset="0%" stopColor="#818cf8" />
              <stop offset="100%" stopColor="#38bdf8" />
            </linearGradient>
          </defs>
        </svg>

        {/* Inner content */}
        <div className="relative flex flex-col items-center justify-center gap-0.5">
          <span
            className="font-mono text-3xl font-light tracking-tighter"
            style={{
              color: phase === "done" ? "#a5f3fc" : "#e2e8f0",
              transition: "color 0.4s ease",
              fontVariantNumeric: "tabular-nums",
            }}
          >
            {Math.floor(progress)}
            <span className="text-lg text-slate-500">%</span>
          </span>
        </div>
      </div>

      {/* Status text */}
      <div className="mt-8 flex flex-col items-center gap-2">
        <p
          className="text-xs tracking-[0.25em] uppercase font-medium transition-all duration-300"
          style={{ color: "#64748b", letterSpacing: "0.2em" }}
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
                    ? "linear-gradient(90deg,#6366f1,#38bdf8)"
                    : "rgba(255,255,255,0.08)",
                transform: progress >= step ? "scaleX(1)" : "scaleX(0.6)",
              }}
            />
          ))}
        </div>
      </div>

      {/* Wordmark / brand */}
      <div className="absolute bottom-10 flex items-center gap-2 opacity-30">
        <div className="w-1 h-1 rounded-full bg-indigo-400" />
        <span className="text-[10px] tracking-[0.3em] uppercase text-slate-500 font-light">
          Loading environment
        </span>
        <div className="w-1 h-1 rounded-full bg-sky-400" />
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