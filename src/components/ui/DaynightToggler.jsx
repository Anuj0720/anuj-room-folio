// Day / night toggle — styled to match the room scene:
// terracotta + peach walls, cream trim, warm wood and a deep maroon floor.
//   day   : sunset-orange sky, cream clouds, glowing warm sun
//   night : deep maroon-plum sky, cream stars, soft cream moon
export function DayNightToggler({ isNight, onToggle, drawerOpen, animReady }) {
  // Only show when anim is done AND drawer is closed
  const visible = animReady && !drawerOpen;

  return (
    <>
      <style>{`
        .dn-wrapper {
          position: fixed;
          top: 20px;
          right: 20px;
          z-index: 9999;
          opacity: 0;
          transform: translateY(-10px);
          pointer-events: none;
          transition: opacity 0.6s ease, transform 0.6s ease;
        }
        .dn-wrapper--visible {
          opacity: 1;
          transform: translateY(0px);
          pointer-events: all;
        }
        .dn-wrapper--drawer {
          opacity: 0 !important;
          transform: translateY(-6px) !important;
          pointer-events: none !important;
          transition: opacity 0.25s ease, transform 0.25s ease !important;
        }

        /* Cream outer rim — same cream as the room's wall edge */
        .dn-pill {
          position: relative;
          display: block;
          width: 112px;
          height: 54px;
          border-radius: 30px;
          border: 3px solid #f6d9c6;
          cursor: pointer;
          padding: 0;
          overflow: hidden;
          outline: none;
          background: #f6d9c6;
          transition: box-shadow 0.6s ease, border-color 0.6s ease, transform 0.25s ease;
        }
        .dn-pill:hover { transform: scale(1.04); }
        .dn-pill:active { transform: scale(0.97); }
        .dn-pill:focus-visible { outline: 2px solid #ffedd5; outline-offset: 3px; }

        .dn-pill--day {
          box-shadow: 0 6px 18px rgba(120, 45, 25, 0.38), 0 1px 4px rgba(60, 20, 10, 0.25);
        }
        .dn-pill--night {
          border-color: #d9a98f;
          box-shadow: 0 6px 18px rgba(40, 10, 20, 0.6), 0 1px 4px rgba(0, 0, 0, 0.4);
        }

        .dn-scenery { position: absolute; inset: 0; border-radius: 30px; overflow: hidden; }
        .dn-sky { position: relative; width: 100%; height: 100%; overflow: hidden; border-radius: 30px; }

        .dn-sky--day {
          background: linear-gradient(180deg, #ffc99a 0%, #ff9a63 55%, #f47b50 100%);
        }
        .dn-sky--night {
          background: linear-gradient(160deg, #5a2a3a 0%, #3a1a2a 55%, #24121f 100%);
        }

        /* Warm wood-toned horizon strip, echoes the room floor */
        .dn-ground { position: absolute; left: 0; right: 0; bottom: 0; height: 9px; }
        .dn-sky--day   .dn-ground { background: linear-gradient(180deg, #d9a35a, #b9823f); }
        .dn-sky--night .dn-ground { background: linear-gradient(180deg, #6b3a3a, #4a2429); }

        .dn-cloud { position: absolute; background: #fff1e6; border-radius: 20px; }
        .dn-cloud--1 { bottom: 14px; left: 24px; width: 34px; height: 14px; opacity: 0.95; }
        .dn-cloud--2 { bottom: 12px; right: 14px; width: 26px; height: 11px; opacity: 0.8; }
        .dn-puff { position: absolute; background: #fff1e6; border-radius: 50%; }
        .dn-cloud--1 .dn-puff--a { width: 18px; height: 18px; top: -8px; left: 5px; }
        .dn-cloud--1 .dn-puff--b { width: 14px; height: 14px; top: -5px; left: 16px; }
        .dn-cloud--2 .dn-puff--a { width: 13px; height: 13px; top: -6px; left: 3px; }
        .dn-cloud--2 .dn-puff--b { width: 10px; height: 10px; top: -4px; left: 11px; }

        .dn-star { position: absolute; border-radius: 50%; background: #ffe7c7; }

        /* Knob: inner box is 104x46, knob 36px with 5px inset */
        .dn-knob {
          position: absolute;
          top: 5px; left: 5px;
          width: 36px; height: 36px;
          border-radius: 50%;
          z-index: 2;
          transition:
            transform  0.5s cubic-bezier(0.34, 1.56, 0.64, 1),
            background 0.5s ease,
            box-shadow 0.5s ease;
        }
        .dn-knob--day {
          background: radial-gradient(circle at 35% 30%, #fff3c4, #ffd36b 60%, #f5b43c);
          transform: translateX(0px);
          box-shadow: 0 2px 8px rgba(160, 60, 20, 0.45), 0 0 16px rgba(255, 214, 120, 0.7);
        }
        .dn-knob--night {
          background: radial-gradient(circle at 35% 30%, #fff1e2, #f1d3b8 65%, #d9ae92);
          transform: translateX(58px);
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.5), 0 0 12px rgba(255, 220, 190, 0.35);
        }

        .dn-crater { position: absolute; border-radius: 50%; background: rgba(160, 90, 60, 0.28); }
        .dn-crater--a { width: 7px; height: 7px; top: 6px; left: 8px; }
        .dn-crater--b { width: 4px; height: 4px; top: 20px; left: 16px; }
        .dn-crater--c { width: 5px; height: 5px; top: 9px; left: 21px; }
      `}</style>

      <div
        className={[
          "dn-wrapper",
          visible ? "dn-wrapper--visible" : "",
          drawerOpen ? "dn-wrapper--drawer" : "",
        ]
          .filter(Boolean)
          .join(" ")}
      >
        <button
          className={`dn-pill ${isNight ? "dn-pill--night" : "dn-pill--day"}`}
          onClick={() => onToggle(!isNight)}
          aria-label={isNight ? "Switch to Day" : "Switch to Night"}
        >
          <div className="dn-scenery">
            {isNight ? <NightScene /> : <DayScene />}
          </div>
          <div className={`dn-knob ${isNight ? "dn-knob--night" : "dn-knob--day"}`}>
            {isNight && (
              <>
                <div className="dn-crater dn-crater--a" />
                <div className="dn-crater dn-crater--b" />
                <div className="dn-crater dn-crater--c" />
              </>
            )}
          </div>
        </button>
      </div>
    </>
  );
}

function DayScene() {
  return (
    <div className="dn-sky dn-sky--day">
      <div className="dn-cloud dn-cloud--1">
        <div className="dn-puff dn-puff--a" />
        <div className="dn-puff dn-puff--b" />
      </div>
      <div className="dn-cloud dn-cloud--2">
        <div className="dn-puff dn-puff--a" />
        <div className="dn-puff dn-puff--b" />
      </div>
      <div className="dn-ground" />
    </div>
  );
}

function NightScene() {
  const stars = [
    { top: "18%", left: "14%", size: 2.5 },
    { top: "32%", left: "34%", size: 1.8 },
    { top: "14%", left: "48%", size: 3 },
    { top: "46%", left: "24%", size: 2 },
    { top: "24%", left: "66%", size: 1.5 },
    { top: "44%", left: "52%", size: 2.2 },
    { top: "58%", left: "38%", size: 1.6 },
  ];
  return (
    <div className="dn-sky dn-sky--night">
      {stars.map((s, i) => (
        <div
          key={i}
          className="dn-star"
          style={{
            top: s.top,
            left: s.left,
            width: s.size,
            height: s.size,
            boxShadow: `0 0 ${s.size + 2}px ${s.size / 2}px rgba(255,231,199,0.7)`,
          }}
        />
      ))}
      <div className="dn-ground" />
    </div>
  );
}
