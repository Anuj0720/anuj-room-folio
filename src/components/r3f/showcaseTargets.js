// Showcase mesh + camera + per-target UI configuration.


export const SHOWCASE_TARGETS = [
  {
    id: "pikachu",
    label: "Pikachu",
    match: ["pikachu"],
    camera: {
      position: { x: -11.4, y: -28.3, z: -1.77 },
      target: { x: -29.1, y: -32.8, z: -2.1 },
    },
    buttons: {
      play: { top: 120, left: "30%" },
      stop: { top: 120, left: "60%" },
      back: { top: 48, left: "45%" },
    },
  },
  {
    id: "vr",
    label: "VR",
    // Supports both possible names mentioned in the project.
    match: ["vr", "pokemon"],
    camera: {
      position: { x: -11.4, y: -31.0, z: -1.77 },
      target: { x: -29.1, y: -32.8, z: -2.1 },
    },
    buttons: {
      play: { top: 160, left: "20%" },
      stop: { top: 160, left: "70%" },
      back: { top: 48, left: "45%" },
    },
  },
  {
    id: "snorlax",
    label: "Snorlax",
    match: ["snorlax"],
    camera: {
      position: { x: -11.8, y: -32.6, z: -1.77 },
      target: { x: -101.1, y: -49.2, z: -2.1 },
    },
    buttons: {
      play: { top: 120, left: "20%" },
      stop: { top: 120, left: "70%" },
      back: { top: 48, left: "45%" },
    },
  },
  {
    id: "pokeball",
    label: "Pokeball",
    match: ["pokeball"],
    camera: {
      position: { x: -11.8, y: -34.8, z: -1.77 },
      target: { x: -101.1, y: -49.2, z: -2.1 },
    },
    buttons: {
      play: { top: 120, left: "30%" },
      stop: { top: 120, left: "70%" },
      back: { top: 48, left: "50%" },
    },
  },
];

export const SHOWCASE_TARGET_BY_ID = Object.fromEntries(
  SHOWCASE_TARGETS.map((target) => [target.id, target]),
);
