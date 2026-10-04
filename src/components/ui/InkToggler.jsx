import { useState } from "react";
import { Box, Pencil } from "lucide-react";

// Where the button's centre is on screen (px from the right / top edge).
// The ink wipe in the 3D scene starts from exactly this point.
export const INK_BUTTON_CENTER = { right: 76, top: 179 };

// 3D <-> ink-sketch switch. Same pill + sliding-knob family as the
// day/night and music toggles, with its own drawing theme:
//   knob  : a pencil that slides across, wiggling as if it were drawing
//   track : clay-terracotta with a little cube (3D)  ->  cream paper that
//           fills with hand-drawn hatch strokes (sketch)
// Sits directly below the music toggle.
const HATCH = [0, 1, 2, 3, 4, 5, 6];

export function InkToggler({ on, onToggle, isNight, drawerOpen, animReady }) {
  const [burst, setBurst] = useState(0); // restarts the splash animation
  const visible = animReady && !drawerOpen;

  const handleClick = () => {
    if (!on) setBurst((b) => b + 1); // splash only when drawing starts
    onToggle();
  };

  return (
    <>
      <style>{`
        .ik-wrapper {
          position: fixed;
          top: 152px;   /* 86px music toggle + 54px + 12px gap */
          right: 20px;
          z-index: 9999;
          opacity: 0;
          transform: translateY(-10px);
          pointer-events: none;
          transition: opacity 0.6s ease 0.2s, transform 0.6s ease 0.2s;
        }
        .ik-wrapper--visible { opacity: 1; transform: translateY(0); pointer-events: all; }
        .ik-wrapper--drawer {
          opacity: 0 !important;
          transform: translateY(-6px) !important;
          pointer-events: none !important;
          transition: opacity 0.25s ease, transform 0.25s ease !important;
        }

        .ik-pill {
          position: relative;
          display: block;
          width: 112px;
          height: 54px;
          border-radius: 30px;
          border: 3px solid #f6d9c6;
          padding: 0;
          overflow: hidden;
          cursor: pointer;
          outline: none;
          background: #b24a26;
          transition: border-color 0.6s ease, box-shadow 0.6s ease, transform 0.25s ease;
        }
        .ik-pill:hover { transform: scale(1.04); }
        .ik-pill:active { transform: scale(0.96); }
        .ik-pill:focus-visible { outline: 2px solid #ffedd5; outline-offset: 3px; }
        .ik-pill--off {
          box-shadow: 0 6px 18px rgba(120, 45, 25, 0.38), 0 1px 4px rgba(60, 20, 10, 0.25);
        }
        .ik-pill--on {
          box-shadow: 0 6px 18px rgba(120, 45, 25, 0.38), 0 1px 4px rgba(60, 20, 10, 0.25);
        }
        .ik-pill--night { border-color: #d9a98f; }

        /* ── track layers ── */
        .ik-layer { position: absolute; inset: 0; transition: opacity 0.6s ease; }
        .ik-clay  { background: linear-gradient(135deg, #d9663c 0%, #b24a26 60%, #8f3a1c 100%); }
        .ik-paper {
          background:
            radial-gradient(circle at 30% 20%, rgba(255,255,255,0.7), rgba(255,255,255,0) 60%),
            linear-gradient(135deg, #fff4e8 0%, #f6dcc4 100%);
        }
        .ik-pill--off .ik-paper { opacity: 0; }
        .ik-pill--on  .ik-clay  { opacity: 0; }

        /* little cube = "3D", sits on the free side of the track */
        .ik-cube {
          position: absolute;
          top: 50%;
          right: 13px;
          margin-top: -11px;
          color: #ffe6d2;
          transition: transform 0.5s cubic-bezier(0.34, 1.4, 0.64, 1), opacity 0.35s ease;
        }
        .ik-pill--off .ik-cube { transform: rotate(0deg) scale(1); opacity: 0.95; }
        .ik-pill--on  .ik-cube { transform: rotate(120deg) scale(0.2); opacity: 0; }

        /* hand-drawn hatch strokes that get "drawn" behind the pencil */
        .ik-hatch { position: absolute; inset: 0; width: 100%; height: 100%; }
        .ik-hatch path {
          fill: none;
          stroke: #5a2a1a;
          stroke-width: 2.4;
          stroke-linecap: round;
          stroke-dasharray: 1;
          stroke-dashoffset: 1;
          transition: stroke-dashoffset 0.28s ease;
        }
        .ik-pill--on .ik-hatch path { stroke-dashoffset: 0; }

        /* ── pencil knob ── */
        .ik-knob {
          position: absolute;
          top: 5px;
          left: 5px;
          width: 38px;
          height: 38px;
          z-index: 2;
          transition: transform 0.55s cubic-bezier(0.34, 1.56, 0.64, 1);
        }
        .ik-knob--off { transform: translateX(0); }
        .ik-knob--on  { transform: translateX(58px); }

        .ik-disc {
          position: relative;
          width: 100%;
          height: 100%;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: background 0.5s ease, color 0.5s ease, box-shadow 0.5s ease;
        }
        .ik-knob--off .ik-disc {
          background: radial-gradient(circle at 35% 30%, #fffaf5, #f6d9c6);
          color: #b8451f;
          box-shadow: 0 2px 8px rgba(60, 20, 10, 0.45);
        }
        .ik-knob--on .ik-disc {
          background: radial-gradient(circle at 35% 30%, #ff9f6b, #e8643a);
          color: #fff1e6;
          box-shadow: 0 2px 8px rgba(80, 25, 10, 0.5);
        }
        .ik-pencil { transform-origin: 30% 80%; transition: transform 0.4s ease; }
        .ik-knob--off .ik-pencil { transform: rotate(0deg); }
        /* while sketching the pencil jitters like it's drawing */
        .ik-knob--on .ik-pencil { animation: ikDraw 0.5s ease-in-out infinite; }
        @keyframes ikDraw {
          0%, 100% { transform: rotate(-8deg) translate(0, 0); }
          25%      { transform: rotate(6deg) translate(1px, -1px); }
          50%      { transform: rotate(-3deg) translate(-1px, 1px); }
          75%      { transform: rotate(9deg) translate(1px, 0); }
        }

        /* ink splash when the drawing starts */
        .ik-burst {
          position: absolute;
          top: 50%; left: 50%;
          width: 38px; height: 38px;
          margin: -19px 0 0 -19px;
          border-radius: 50%;
          border: 3px solid #5a2a1a;
          pointer-events: none;
          animation: ikBurst 0.7s ease-out forwards;
        }
        @keyframes ikBurst {
          from { transform: scale(0.6); opacity: 0.9; }
          to   { transform: scale(2.6); opacity: 0; }
        }

        @media (prefers-reduced-motion: reduce) {
          .ik-knob--on .ik-pencil, .ik-burst { animation: none; }
        }
      `}</style>

      <div
        className={[
          "ik-wrapper",
          visible ? "ik-wrapper--visible" : "",
          drawerOpen ? "ik-wrapper--drawer" : "",
        ]
          .filter(Boolean)
          .join(" ")}
      >
        <button
          type="button"
          className={[
            "ik-pill",
            on ? "ik-pill--on" : "ik-pill--off",
            isNight ? "ik-pill--night" : "",
          ]
            .filter(Boolean)
            .join(" ")}
          onClick={handleClick}
          aria-pressed={on}
          aria-label={on ? "Switch back to 3D view" : "Switch to sketch view"}
          title={on ? "Back to 3D" : "Sketch view"}
        >
          <div className="ik-layer ik-clay" />
          <div className="ik-layer ik-paper" />

          <Box className="ik-cube" size={22} strokeWidth={2.2} />

          <svg className="ik-hatch" viewBox="0 0 106 48" aria-hidden="true">
            {HATCH.map((i) => {
              const x = 9 + i * 7.4;
              return (
                <path
                  key={i}
                  d={`M${x} ${37 - (i % 2) * 2} L${x + 10} ${11 + (i % 3)}`}
                  pathLength="1"
                  style={{ transitionDelay: `${on ? i * 0.06 : (HATCH.length - 1 - i) * 0.04}s` }}
                />
              );
            })}
          </svg>

          <div className={`ik-knob ${on ? "ik-knob--on" : "ik-knob--off"}`}>
            <div className="ik-disc">
              <Pencil className="ik-pencil" size={19} strokeWidth={2.3} />
              {burst > 0 && <span key={burst} className="ik-burst" />}
            </div>
          </div>
        </button>
      </div>
    </>
  );
}
