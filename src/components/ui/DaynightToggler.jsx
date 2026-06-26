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
          /* starts hidden below; fades+slides up when visible */
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
        /* drawer-open overrides visible */
        .dn-wrapper--drawer {
          opacity: 0 !important;
          transform: translateY(-6px) !important;
          pointer-events: none !important;
          transition: opacity 0.25s ease, transform 0.25s ease !important;
        }

        .dn-pill {
          position: relative;
          width: 110px;
          height: 52px;
          border-radius: 30px;
          border: none;
          cursor: pointer;
          padding: 0;
          overflow: hidden;
          outline: none;
          transition: box-shadow 0.6s ease;
        }
        .dn-pill--day   { box-shadow: 0 4px 18px rgba(100,180,255,0.55), 0 1px 4px rgba(0,0,0,0.18); }
        .dn-pill--night { box-shadow: 0 4px 18px rgba(10,20,80,0.7),     0 1px 4px rgba(0,0,0,0.4);  }

        .dn-scenery {
          position: absolute;
          inset: 0;
          border-radius: 30px;
          overflow: hidden;
        }

        .dn-sky { position: relative; width: 100%; height: 100%; overflow: hidden; border-radius: 30px; }
        .dn-sky--day   { background: linear-gradient(180deg, #6ab4f5 0%, #a8d8f8 60%, #d6eeff 100%); }
        .dn-sky--night { background: linear-gradient(135deg, #0d1b3e 0%, #1a2a5e 50%, #0a0f2a 100%); }

        .dn-cloud { position: absolute; background: #fff; border-radius: 20px; }
        .dn-cloud--1 { bottom: 12px; left: 24px;  width: 36px; height: 18px; opacity: 0.95; }
        .dn-cloud--2 { bottom:  8px; right: 18px; width: 28px; height: 14px; opacity: 0.80; }

        .dn-puff { position: absolute; background: #fff; border-radius: 50%; }
        .dn-cloud--1 .dn-puff--a { width: 20px; height: 20px; top: -8px; left:  6px; }
        .dn-cloud--1 .dn-puff--b { width: 16px; height: 16px; top: -5px; left: 16px; }
        .dn-cloud--2 .dn-puff--a { width: 14px; height: 14px; top: -6px; left:  4px; }
        .dn-cloud--2 .dn-puff--b { width: 12px; height: 12px; top: -4px; left: 12px; }

        .dn-star { position: absolute; border-radius: 50%; background: #fff; }

        .dn-knob {
          position: absolute;
          top: 6px; left: 6px;
          width: 40px; height: 40px;
          border-radius: 50%;
          z-index: 2;
          transition:
            transform  0.5s cubic-bezier(0.34, 1.56, 0.64, 1),
            background 0.5s ease,
            box-shadow 0.5s ease;
        }
        .dn-knob--day {
          background: #f5c842;
          transform: translateX(0px);
          box-shadow: 0 2px 10px rgba(245,180,30,0.6), 0 0 18px rgba(245,200,50,0.4);
        }
        .dn-knob--night {
          background: #c8cfe8;
          transform: translateX(52px);
          box-shadow: 0 2px 8px rgba(0,0,0,0.45), inset -3px -2px 0 rgba(0,0,0,0.15);
        }

        .dn-crater { position: absolute; border-radius: 50%; background: rgba(0,0,0,0.12); }
        .dn-crater--a { width: 7px; height: 7px; top:  7px; left:  9px; }
        .dn-crater--b { width: 4px; height: 4px; top: 17px; left: 17px; }
        .dn-crater--c { width: 5px; height: 5px; top:  9px; left: 19px; }
      `}</style>

      <div className={[
        "dn-wrapper",
        visible     ? "dn-wrapper--visible" : "",
        drawerOpen  ? "dn-wrapper--drawer"  : "",
      ].filter(Boolean).join(" ")}>
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
    </div>
  );
}

function NightScene() {
  const stars = [
    { top: "18%", left: "18%", size: 2.5 },
    { top: "30%", left: "40%", size: 1.8 },
    { top: "12%", left: "60%", size: 3   },
    { top: "50%", left: "28%", size: 2   },
    { top: "22%", left: "75%", size: 1.5 },
    { top: "55%", left: "55%", size: 2.2 },
    { top: "38%", left: "15%", size: 1.6 },
  ];
  return (
    <div className="dn-sky dn-sky--night">
      {stars.map((s, i) => (
        <div key={i} className="dn-star" style={{
          top: s.top, left: s.left,
          width: s.size, height: s.size,
          boxShadow: `0 0 ${s.size + 2}px ${s.size / 2}px rgba(255,255,255,0.8)`,
        }} />
      ))}
    </div>
  );
}