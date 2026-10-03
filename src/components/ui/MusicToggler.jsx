import { toggleBackgroundMusic, useMusicOn } from "../../helper/audio";

// Music on/off switch — same pill + sliding-knob format as the
// day/night toggler, but with its own music theme:
//   knob  : a vinyl record that slides across and SPINS when music is on
//   track : equalizer bars that dance when on and flatten to dots when off
//   colors: terracotta when on, deep maroon when off (same palette)
// Sits directly below the day/night toggler and shares its show/hide rules.
export function MusicToggler({ isNight, drawerOpen, animReady }) {
  const musicOn = useMusicOn();
  const visible = animReady && !drawerOpen;

  return (
    <>
      <style>{`
        .mt-wrapper {
          position: fixed;
          top: 86px;   /* 20px offset + 54px toggler + 12px gap */
          right: 20px;
          z-index: 9999;
          opacity: 0;
          transform: translateY(-10px);
          pointer-events: none;
          transition: opacity 0.6s ease 0.1s, transform 0.6s ease 0.1s;
        }
        .mt-wrapper--visible {
          opacity: 1;
          transform: translateY(0);
          pointer-events: all;
        }
        .mt-wrapper--drawer {
          opacity: 0 !important;
          transform: translateY(-6px) !important;
          pointer-events: none !important;
          transition: opacity 0.25s ease, transform 0.25s ease !important;
        }

        .mt-pill {
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
          transition: background 0.6s ease, border-color 0.6s ease,
                      box-shadow 0.6s ease, transform 0.25s ease;
        }
        .mt-pill:hover { transform: scale(1.04); }
        .mt-pill:active { transform: scale(0.97); }
        .mt-pill:focus-visible { outline: 2px solid #ffedd5; outline-offset: 3px; }

        .mt-pill--on {
          background: linear-gradient(135deg, #ff9f6b 0%, #f47b50 55%, #e8643a 100%);
          box-shadow: 0 6px 18px rgba(120, 45, 25, 0.38), 0 1px 4px rgba(60, 20, 10, 0.25);
        }
        .mt-pill--off {
          background: linear-gradient(160deg, #5a2a3a 0%, #3a1a2a 55%, #24121f 100%);
          box-shadow: 0 6px 18px rgba(40, 10, 20, 0.6), 0 1px 4px rgba(0, 0, 0, 0.4);
        }
        .mt-pill--night { border-color: #d9a98f; }

        /* ── Equalizer bars ── */
        .mt-bars {
          position: absolute;
          top: 50%;
          left: 11px;
          width: 35px;
          height: 24px;
          margin-top: -12px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          transition: transform 0.55s cubic-bezier(0.34, 1.2, 0.64, 1);
        }
        /* music off -> knob sits left, bars move to the free (right) side */
        .mt-bars--off { transform: translateX(49px); }

        .mt-bar {
          width: 3px;
          height: 24px;
          border-radius: 2px;
          background: #fff1e6;
          transform: scaleY(0.14);       /* flat dot when off */
          transform-origin: center;
          transition: transform 0.4s ease, background 0.5s ease;
        }
        .mt-bars--off .mt-bar { background: rgba(246, 217, 198, 0.55); }

        .mt-bars--on .mt-bar { animation: mtBar 0.9s ease-in-out infinite; }
        .mt-bars--on .mt-bar:nth-child(1) { animation-duration: 0.85s; animation-delay: -0.2s; }
        .mt-bars--on .mt-bar:nth-child(2) { animation-duration: 1.1s;  animation-delay: -0.6s; }
        .mt-bars--on .mt-bar:nth-child(3) { animation-duration: 0.75s; animation-delay: -0.1s; }
        .mt-bars--on .mt-bar:nth-child(4) { animation-duration: 1.0s;  animation-delay: -0.45s; }
        .mt-bars--on .mt-bar:nth-child(5) { animation-duration: 0.9s;  animation-delay: -0.75s; }

        @keyframes mtBar {
          0%, 100% { transform: scaleY(0.25); }
          50%      { transform: scaleY(1); }
        }

        /* ── Sliding vinyl knob ── */
        .mt-knob {
          position: absolute;
          top: 5px;
          left: 5px;
          width: 38px;
          height: 38px;
          z-index: 2;
          transition: transform 0.5s cubic-bezier(0.34, 1.56, 0.64, 1);
        }
        .mt-knob--off { transform: translateX(0); }
        .mt-knob--on  { transform: translateX(58px); }

        .mt-record {
          position: relative;
          width: 100%;
          height: 100%;
          border-radius: 50%;
          box-shadow: 0 0 0 2px rgba(246, 217, 198, 0.9), 0 3px 9px rgba(0, 0, 0, 0.45);
          background:
            conic-gradient(from 0deg,
              transparent 0 18%, rgba(255, 255, 255, 0.2) 24%, transparent 32% 68%,
              rgba(255, 255, 255, 0.16) 74%, transparent 82% 100%),
            repeating-radial-gradient(circle at center,
              #1c0f16 0 2px, #2c1923 2px 3px);
          animation: mtSpin 2.6s linear infinite;
          animation-play-state: paused;
        }
        .mt-knob--on .mt-record { animation-play-state: running; }
        @keyframes mtSpin { to { transform: rotate(360deg); } }

        /* centre label */
        .mt-label {
          position: absolute;
          top: 50%;
          left: 50%;
          width: 14px;
          height: 14px;
          margin: -7px 0 0 -7px;
          border-radius: 50%;
          background: radial-gradient(circle at 35% 30%, #ffe2c9, #f47b50);
        }
        /* spindle hole */
        .mt-label::before {
          content: "";
          position: absolute;
          top: 50%; left: 50%;
          width: 3px; height: 3px;
          margin: -1.5px 0 0 -1.5px;
          border-radius: 50%;
          background: #1c0f16;
        }
        /* little notch so the rotation is easy to see */
        .mt-label::after {
          content: "";
          position: absolute;
          top: 1.5px; left: 50%;
          width: 2px; height: 2px;
          margin-left: -1px;
          border-radius: 50%;
          background: #fff1e6;
        }

        @media (prefers-reduced-motion: reduce) {
          .mt-bars--on .mt-bar, .mt-record { animation: none; }
          .mt-bars--on .mt-bar { transform: scaleY(0.6); }
        }
      `}</style>

      <div
        className={[
          "mt-wrapper",
          visible ? "mt-wrapper--visible" : "",
          drawerOpen ? "mt-wrapper--drawer" : "",
        ]
          .filter(Boolean)
          .join(" ")}
      >
        <button
          type="button"
          className={[
            "mt-pill",
            musicOn ? "mt-pill--on" : "mt-pill--off",
            isNight ? "mt-pill--night" : "",
          ]
            .filter(Boolean)
            .join(" ")}
          onClick={toggleBackgroundMusic}
          aria-pressed={musicOn}
          aria-label={musicOn ? "Mute background music" : "Unmute background music"}
          title={musicOn ? "Mute music" : "Unmute music"}
        >
          <div className={`mt-bars ${musicOn ? "mt-bars--on" : "mt-bars--off"}`}>
            {[0, 1, 2, 3, 4].map((i) => (
              <span key={i} className="mt-bar" />
            ))}
          </div>

          <div className={`mt-knob ${musicOn ? "mt-knob--on" : "mt-knob--off"}`}>
            <div className="mt-record">
              <div className="mt-label" />
            </div>
          </div>
        </button>
      </div>
    </>
  );
}
