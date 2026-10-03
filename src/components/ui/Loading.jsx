import { useEffect, useState, useRef } from "react";
import { Volume2, VolumeX, X } from "lucide-react";

// Intro screen. Runs the loading ring to 100%, then waits for the
// visitor to choose "Enter with audio" / "Enter without audio" —
// nothing proceeds (and the reveal never starts) until one is clicked.
// onEnter(withAudio: boolean) is called exactly once.
export default function Loading({ onEnter }) {
  const [progress, setProgress] = useState(0);
  const [creditsOpen, setCreditsOpen] = useState(false);
  const [entering, setEntering] = useState(false);
  const intervalRef = useRef(null);

  const ready = progress >= 100;
  const phase = ready ? "done" : "loading";

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

  // Close the credits card with Escape.
  useEffect(() => {
    if (!creditsOpen) return;
    const onKey = (e) => e.key === "Escape" && setCreditsOpen(false);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [creditsOpen]);

  const handleEnter = (withAudio) => {
    if (entering) return;
    setEntering(true);
    onEnter?.(withAudio);
  };

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
      <div className="flex flex-col items-center" style={{ marginTop: 32 }}>
        <p
          className="text-xs tracking-[0.25em] uppercase font-medium transition-all duration-300"
          style={{ color: "#ffedd5", opacity: 0.9, letterSpacing: "0.2em" }}
        >
          {getStatusText()}
        </p>

        {/* Tick marks */}
        <div className="flex gap-1" style={{ marginTop: 14 }}>
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

        {/* Entry choice — appears only once loading hits 100% */}
        <div
          className="intro-choice flex flex-col items-center"
          style={{
            marginTop: 56,
            opacity: ready ? 1 : 0,
            transform: ready ? "translateY(0)" : "translateY(10px)",
            pointerEvents: ready ? "auto" : "none",
            visibility: ready ? "visible" : "hidden",
            transition: "opacity 0.6s ease, transform 0.6s ease",
          }}
        >
          <div className="flex items-center" style={{ gap: 20 }}>
            <button
              type="button"
              className="intro-btn intro-btn--primary"
              onClick={() => handleEnter(true)}
              disabled={entering}
            >
              <Volume2 size={19} strokeWidth={2.2} />
              Enter with audio
            </button>
            <button
              type="button"
              className="intro-btn intro-btn--ghost"
              onClick={() => handleEnter(false)}
              disabled={entering}
            >
              <VolumeX size={19} strokeWidth={2.2} />
              Enter without audio
            </button>
          </div>

          <button
            type="button"
            className="intro-link"
            style={{ marginTop: 32 }}
            onClick={() => setCreditsOpen(true)}
          >
            Credits
          </button>
        </div>
      </div>

      {/* Wordmark / brand */}
      <div className="absolute bottom-10 flex items-center gap-2 opacity-60">
        <div className="w-1 h-1 rounded-full bg-orange-200" />
        <span className="text-[10px] tracking-[0.3em] uppercase text-orange-50 font-light">
          {ready ? "Environment ready" : "Loading environment"}
        </span>
        <div className="w-1 h-1 rounded-full bg-white" />
      </div>

      {creditsOpen && (
        <div
          className="intro-backdrop"
          onClick={() => setCreditsOpen(false)}
          role="presentation"
        >
          <div
            className="intro-credits"
            role="dialog"
            aria-modal="true"
            aria-label="Credits"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              className="intro-credits__close"
              onClick={() => setCreditsOpen(false)}
              aria-label="Close credits"
              autoFocus
            >
              <X size={16} />
            </button>

            <h2 className="intro-credits__title">Credits</h2>

            <div className="intro-credits__row">
              <span className="intro-credits__label">Website</span>
              <p>Designed &amp; developed by <strong>Anuj Jadhav</strong>.</p>
            </div>

            <div className="intro-credits__row">
              <span className="intro-credits__label">3D assets</span>
              <p>
                Every 3D model and asset in this room was created by{" "}
                <strong>Anuj Jadhav</strong> in Blender.
              </p>
            </div>

            <div className="intro-credits__row">
              <span className="intro-credits__label">Background music</span>
              <p>
                &ldquo;Deep Woods&rdquo; from Stardew Valley OST. Composed by
                Eric Barone (ConcernedApe). All rights belong to the creator.
                This is a non-commercial portfolio project. Visit the{" "}
                <a
                  href="https://www.stardewvalley.net/"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Official Stardew Valley Site
                </a>
                .
              </p>
            </div>
            <div className="intro-credits__row">
              <span className="intro-credits__label">House icon</span>
              <p>

                <a
                  href="https://www.flaticon.com/free-icons/house"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                   House icon created by Magnific
                </a>
                .
              </p>
            </div>
          </div>
        </div>
      )}

      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to   { transform: rotate(360deg); }
        }
        @keyframes introFade {
          from { opacity: 0; }
          to   { opacity: 1; }
        }
        @keyframes introPop {
          from { opacity: 0; transform: translateY(12px) scale(0.97); }
          to   { opacity: 1; transform: translateY(0) scale(1); }
        }

        /* ── Entry buttons: chunky "key" buttons with a solid bottom
              lip, like the rounded, tactile props in the room ── */
        .intro-btn {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 10px;
          height: 54px;
          min-width: 232px;
          padding: 0 26px;
          border: none;
          border-radius: 18px;
          font-size: 15px;
          font-weight: 600;
          letter-spacing: 0.01em;
          cursor: pointer;
          outline: none;
          transition: transform 0.15s ease, box-shadow 0.15s ease, background 0.2s ease;
        }
        .intro-btn:focus-visible { outline: 2px solid #ffedd5; outline-offset: 4px; }
        .intro-btn:disabled { cursor: default; opacity: 0.75; }

        .intro-btn--primary {
          background: #fff1e6;
          color: #9a3a17;
          box-shadow: 0 5px 0 #d9a98f, 0 14px 24px rgba(120, 45, 25, 0.28);
        }
        .intro-btn--primary:hover:not(:disabled) {
          background: #ffffff;
          transform: translateY(-2px);
          box-shadow: 0 7px 0 #d9a98f, 0 18px 28px rgba(120, 45, 25, 0.3);
        }
        .intro-btn--primary:active:not(:disabled) {
          transform: translateY(4px);
          box-shadow: 0 1px 0 #d9a98f, 0 4px 10px rgba(120, 45, 25, 0.25);
        }

        .intro-btn--ghost {
          background: #e0643a;
          color: #fff1e6;
          box-shadow: 0 5px 0 #a8431f, 0 14px 24px rgba(120, 45, 25, 0.2);
        }
        .intro-btn--ghost:hover:not(:disabled) {
          background: #e86e44;
          transform: translateY(-2px);
          box-shadow: 0 7px 0 #a8431f, 0 18px 28px rgba(120, 45, 25, 0.24);
        }
        .intro-btn--ghost:active:not(:disabled) {
          transform: translateY(4px);
          box-shadow: 0 1px 0 #a8431f, 0 4px 10px rgba(120, 45, 25, 0.2);
        }

        /* ── Credits link ── */
        .intro-link {
          background: none;
          border: none;
          padding: 4px 2px;
          cursor: pointer;
          font-size: 13px;
          font-weight: 500;
          letter-spacing: 0.04em;
          color: #fff1e6;
          opacity: 0.85;
          text-decoration: underline;
          text-underline-offset: 5px;
          text-decoration-color: rgba(255, 241, 230, 0.45);
          transition: opacity 0.2s ease, text-decoration-color 0.2s ease;
        }
        .intro-link:hover { opacity: 1; text-decoration-color: #ffffff; }
        .intro-link:focus-visible { outline: 2px solid #ffedd5; outline-offset: 3px; border-radius: 4px; }

        /* ── Credits card ── */
        .intro-backdrop {
          position: fixed;
          inset: 0;
          z-index: 60;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 24px;
          background: rgba(70, 25, 15, 0.55);
          backdrop-filter: blur(4px);
          animation: introFade 0.25s ease both;
        }
        .intro-credits {
          position: relative;
          width: min(520px, 100%);
          max-height: 88vh;
          overflow-y: auto;
          padding: 30px 32px 28px;
          border-radius: 24px;
          border: 3px solid #f6d9c6;
          background: #fff1e6;
          color: #5a2a1a;
          box-shadow: 0 24px 60px rgba(60, 20, 10, 0.5);
          animation: introPop 0.35s cubic-bezier(0.34, 1.3, 0.64, 1) both;
        }
        .intro-credits__title {
          font-size: 13px;
          font-weight: 700;
          letter-spacing: 0.3em;
          text-transform: uppercase;
          color: #b8451f;
          margin-bottom: 18px;
        }
        .intro-credits__row { margin-bottom: 16px; }
        .intro-credits__row:last-child { margin-bottom: 0; }
        .intro-credits__label {
          display: block;
          margin-bottom: 4px;
          font-size: 10px;
          font-weight: 600;
          letter-spacing: 0.22em;
          text-transform: uppercase;
          color: #c46a45;
        }
        .intro-credits__row p { font-size: 14px; line-height: 1.65; }
        .intro-credits__row strong { font-weight: 600; color: #3a1a10; }
        .intro-credits__row a {
          color: #b8451f;
          font-weight: 600;
          text-decoration: underline;
          text-underline-offset: 3px;
        }
        .intro-credits__row a:hover { color: #8f3213; }
        .intro-credits__close {
          position: absolute;
          top: 14px;
          right: 14px;
          width: 32px;
          height: 32px;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 50%;
          border: none;
          cursor: pointer;
          background: #f47b50;
          color: #fff1e6;
          transition: background 0.2s ease, transform 0.2s ease;
        }
        .intro-credits__close:hover { background: #d9623a; transform: scale(1.06); }
        .intro-credits__close:focus-visible { outline: 2px solid #b8451f; outline-offset: 2px; }
      `}</style>
    </div>
  );
}