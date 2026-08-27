// Shared hover-cursor coordinator.
//
// Tv, Mac, Poster and Hologram each raycast against their own target mesh
// on "pointermove" and used to write `gl.domElement.style.cursor` directly.
// Because all four listeners fire on the same canvas element for every
// mouse move, whichever one ran last always won — so hovering e.g. the TV
// would flip the cursor to "pointer" for an instant, then Mac/Poster/
// Hologram's own handlers (which see no intersection) would immediately
// flip it back to "default".
//
// Instead, each component reports whether *it* is currently hovering under
// its own id. The actual DOM cursor is only ever set here, and it's
// "pointer" whenever ANY registered source is hovering.

const hoverSources = new Set();
let domElement = null;

function applyCursor() {
  if (!domElement) return;
  domElement.style.cursor = hoverSources.size > 0 ? "pointer" : "default";
}

// Call this once you have `gl.domElement` (safe to call from every
// consumer — it's idempotent and just keeps the reference up to date).
export function registerCursorTarget(el) {
  domElement = el;
  applyCursor();
}

// id: a stable string unique to the calling component (e.g. "tv", "mac").
export function setHover(id, isHovering) {
  if (isHovering) {
    hoverSources.add(id);
  } else {
    hoverSources.delete(id);
  }
  applyCursor();
}

// Convenience for cleanup on unmount.
export function clearHover(id) {
  hoverSources.delete(id);
  applyCursor();
}
