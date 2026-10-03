// Shown instead of the whole portfolio on screens narrower than
// landscape_tablet. Same orange backdrop as the intro Loading overlay,
// but nothing is loaded — just the message.
export default function UnsupportedScreen() {
  return (
    <div
      className="fixed inset-0 z-50 flex flex-col items-center justify-center px-8 text-center"
      style={{ backgroundColor: "#f47b50" }}
    >
      {/* Desktop + tablet icon */}
      <svg
        width="96"
        height="72"
        viewBox="0 0 96 72"
        fill="none"
        stroke="#ffffff"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        style={{ filter: "drop-shadow(0 0 8px rgba(255,255,255,0.4))" }}
        aria-hidden="true"
      >
        <rect x="4" y="6" width="56" height="38" rx="4" />
        <path d="M24 56h16M32 44v12" />
        <rect x="62" y="22" width="30" height="42" rx="4" stroke="#fed7aa" />
        <path d="M74 58h6" stroke="#fed7aa" />
      </svg>

      <p
        className="mt-8 max-w-md text-lg font-medium leading-relaxed"
        style={{ color: "#ffffff" }}
      >
        This portfolio is only designed for desktop and tablet.
      </p>

      <p
        className="mt-3 text-xs uppercase font-medium"
        style={{ color: "#ffedd5", opacity: 0.9, letterSpacing: "0.2em" }}
      >
        Please open it on a larger screen
      </p>
    </div>
  );
}
