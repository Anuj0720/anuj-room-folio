// Named breakpoint system. Add a new breakpoint by adding one line to
// BREAKPOINT_ORDER and one line to BREAKPOINT_MAX_WIDTH — every camera
// position, zoom target, back-button position, showcase target, etc.
// that reads through pickByBreakpoint() picks it up automatically;
// nothing else needs to change.
//
// Ordered smallest -> largest. The last entry should stay Infinity so
// there's always a match.
export const BREAKPOINT_ORDER = [
  "mobileSmall",
  "mobileMedium",
  "mobileBig",
  "portrait_tablet",
  "landscape_tablet",
  "desktop",
];

const BREAKPOINT_MAX_WIDTH = {
  mobileSmall: 380,
  mobileMedium: 455,
  mobileBig: 690,
  portrait_tablet: 768,
  landscape_tablet: 1100,
  desktop: Infinity,
};

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
// its value; if that exact breakpoint isn't defined, walks upward
// toward "desktop" until it finds one that is, so a config with only
// e.g. { desktop, mobileSmall } still works sensibly on a
// mobileBig/tablet device (falls through to the next larger one you
// HAVE defined, ultimately landing on desktop as the universal
// fallback).
export function pickByBreakpoint(values) {
  const current = getCurrentBreakpoint();
  const startIndex = BREAKPOINT_ORDER.indexOf(current);

  for (let i = startIndex; i < BREAKPOINT_ORDER.length; i++) {
    const name = BREAKPOINT_ORDER[i];
    if (values[name] !== undefined) return values[name];
  }

  // Nothing at or above the current breakpoint was defined at all
  // (shouldn't normally happen since "desktop" should always be
  // present) — fall back to whatever WAS defined, smallest first.
  for (const name of BREAKPOINT_ORDER) {
    if (values[name] !== undefined) return values[name];
  }

  return undefined;
}
