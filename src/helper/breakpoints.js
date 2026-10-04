// Breakpoint system — this portfolio only supports TWO layouts:
//   landscape_tablet : 769px – 1100px wide
//   desktop          : 1101px and up
//
// Anything narrower than landscape_tablet (phones, portrait tablets)
// is NOT supported: App.jsx shows a "desktop & tablet only" message
// instead of the portfolio (see isSupportedScreen below).
//
// Ordered smallest -> largest. The last entry should stay Infinity so
// there's always a match.
export const BREAKPOINT_ORDER = ["landscape_tablet", "desktop"];

const BREAKPOINT_MAX_WIDTH = {
  landscape_tablet: 1100,
  desktop: Infinity,
};

// Smallest window width (px) at which the portfolio is shown.
// Everything at or below 768px (portrait tablets / phones) gets the
// "only designed for desktop and tablet" screen instead.
export const MIN_SUPPORTED_WIDTH = 769;

export function isSupportedScreen() {
  if (typeof window === "undefined") return true;
  return window.innerWidth >= MIN_SUPPORTED_WIDTH;
}

export function getCurrentBreakpoint() {
  if (typeof window === "undefined") return "desktop";
  const width = window.innerWidth;
  for (const name of BREAKPOINT_ORDER) {
    if (width <= BREAKPOINT_MAX_WIDTH[name]) return name;
  }
  return "desktop";
}

// values: an object keyed by breakpoint name — doesn't need every
// breakpoint filled in. Resolves the CURRENT breakpoint and returns
// its value; if that exact breakpoint isn't defined, falls through to
// the next larger one (landscape_tablet -> desktop).
export function pickByBreakpoint(values) {
  const current = getCurrentBreakpoint();
  const startIndex = BREAKPOINT_ORDER.indexOf(current);

  for (let i = startIndex; i < BREAKPOINT_ORDER.length; i++) {
    const name = BREAKPOINT_ORDER[i];
    if (values[name] !== undefined) return values[name];
  }

  for (const name of BREAKPOINT_ORDER) {
    if (values[name] !== undefined) return values[name];
  }

  return undefined;
}
