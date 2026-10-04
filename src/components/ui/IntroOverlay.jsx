// Shown while the "Show intro" tour is pending/running:
//  * a transparent layer that blocks clicks/drags on the 3D scene so the
//    tour can't be interrupted by accident,
//  * a caption with the name of the stop being shown,
//  * a "Skip intro" button.
// Same cream / terracotta look as the rest of the UI.
export default function IntroOverlay({ label, canSkip, onSkip }) {
  return (
    <div
      style={{ position: "fixed", inset: 0, zIndex: 30, cursor: "default" }}
      onContextMenu={(e) => e.preventDefault()}
    >
      <style>{`
        @keyframes introCaption {
          from { opacity: 0; transform: translateY(8px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .tour-skip {
          display: inline-flex;
          align-items: center;
          height: 46px;
          padding: 0 24px;
          border: none;
          border-radius: 16px;
          background: #fff1e6;
          color: #9a3a17;
          font-size: 14px;
          font-weight: 600;
          letter-spacing: 0.01em;
          cursor: pointer;
          outline: none;
          box-shadow: 0 4px 0 #d9a98f, 0 12px 22px rgba(60, 20, 10, 0.3);
          transition: transform 0.15s ease, box-shadow 0.15s ease, background 0.2s ease;
        }
        .tour-skip:hover { background: #fff; transform: translateY(-2px); box-shadow: 0 6px 0 #d9a98f, 0 16px 26px rgba(60, 20, 10, 0.34); }
        .tour-skip:active { transform: translateY(3px); box-shadow: 0 1px 0 #d9a98f, 0 4px 10px rgba(60, 20, 10, 0.3); }
        .tour-skip:focus-visible { outline: 2px solid #ffedd5; outline-offset: 4px; }
      `}</style>

      <div
        style={{
          position: "absolute",
          left: 0,
          right: 0,
          bottom: 36,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 16,
          pointerEvents: "none",
        }}
      >
        <div style={{ height: 24 }}>
          {label && (
            <p
              key={label}
              style={{
                fontSize: 13,
                fontWeight: 600,
                letterSpacing: "0.28em",
                textTransform: "uppercase",
                color: "#fff1e6",
                textShadow: "0 2px 12px rgba(60, 20, 10, 0.6)",
                animation: "introCaption 0.4s ease both",
              }}
            >
              {label}
            </p>
          )}
        </div>

        {canSkip && (
          <button
            type="button"
            className="tour-skip"
            onClick={onSkip}
            style={{ pointerEvents: "auto" }}
          >
            Skip intro
          </button>
        )}
      </div>
    </div>
  );
}
