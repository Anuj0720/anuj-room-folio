// Guided "Show intro" camera tour.
// Order: Posters -> iMac -> Mac -> Hologram -> Showcase items -> Socials -> home.
// Each stop flies the camera there (move), then waits (hold) before
// moving on. All times are in seconds — tweak freely.

import * as THREE from "three";
import gsap from "gsap";
import { DEFAULT_CAMERA } from "./cameraMover";
import {
  POSTER_ZOOM,
  TV_ZOOM,
  IMAC_ZOOM,
  MAC_ZOOM,
  HOLOGRAM_ZOOM,
} from "./cameraPositions";
import { SHOWCASE_TARGETS } from "../components/r3f/showcaseTargets";
import { personalInfo } from "./data";

// ── TOUR SPEED — the one number to change ───────────────────────
// 1   = relaxed default
// 0.7 = slower      1.5 = faster      (everything scales together:
//                                       camera flights, holds, glows)
// You can also try values live without editing code by adding
// ?tourSpeed=0.7 to the site URL (e.g. localhost:5173/?tourSpeed=0.7).
const DEFAULT_TOUR_SPEED = 1;

function readTourSpeed() {
  try {
    const q = parseFloat(new URLSearchParams(window.location.search).get("tourSpeed"));
    if (Number.isFinite(q) && q > 0) return Math.min(3, Math.max(0.25, q));
  } catch { /* no window (tests) */ }
  return DEFAULT_TOUR_SPEED;
}

const TOUR_SPEED = readTourSpeed();
const sec = (seconds) => seconds / TOUR_SPEED; // base seconds -> scaled

// Base timings in seconds (at TOUR_SPEED = 1)
const MOVE = sec(2.2); // camera flight between stops
const HOLD = sec(1.8); // plain pause when a stop has no effect
const GLOW_TIME = sec(2.4); // highlight length for TV / iMac / Mac / Hologram
const SHOWCASE_MOVE = sec(1.8);
const SHOWCASE_GLOW = sec(1.7);
const SOCIAL_GLOW = sec(1.0); // each social icon, one after another
const HOME_MOVE = sec(2.6);

const NIGHT_OVERLAY_SUFFIX = "_night_overlay";

// The social icons have no zoom shot of their own, so frame them from
// where they actually are in the scene: find their meshes, take the
// bounding box, and back the camera off along the same viewing
// direction the iMac shot uses (square-on to the desk wall).
export function computeSocialsShot(scene, camera) {
  if (!scene) return null;
  scene.updateMatrixWorld(true);

  const box = new THREE.Box3();
  let found = false;

  scene.traverse((child) => {
    if (!child.isMesh || child.name.endsWith(NIGHT_OVERLAY_SUFFIX)) return;
    const name = child.name.toLowerCase();
    if (personalInfo.socials.some((s) => name.includes(s.name))) {
      box.expandByObject(child);
      found = true;
    }
  });
  if (!found || box.isEmpty()) return null;

  const center = box.getCenter(new THREE.Vector3());

  // viewing direction (from target towards camera), same as the iMac shot
  const dir = new THREE.Vector3(
    IMAC_ZOOM.position.x - IMAC_ZOOM.target.x,
    IMAC_ZOOM.position.y - IMAC_ZOOM.target.y,
    IMAC_ZOOM.position.z - IMAC_ZOOM.target.z,
  ).normalize();

  // distance needed to fit the box (with padding) in the current view
  const forward = dir.clone().negate();
  const right = new THREE.Vector3().crossVectors(forward, new THREE.Vector3(0, 1, 0)).normalize();
  const up = new THREE.Vector3().crossVectors(right, forward).normalize();

  let halfW = 0;
  let halfH = 0;
  for (const x of [box.min.x, box.max.x])
    for (const y of [box.min.y, box.max.y])
      for (const z of [box.min.z, box.max.z]) {
        const d = new THREE.Vector3(x, y, z).sub(center);
        halfW = Math.max(halfW, Math.abs(d.dot(right)));
        halfH = Math.max(halfH, Math.abs(d.dot(up)));
      }

  const tanHalfFov = Math.tan(THREE.MathUtils.degToRad((camera?.fov ?? 35) / 2));
  const aspect = camera?.aspect ?? 16 / 9;
  const dist = Math.max(
    halfH / tanHalfFov,
    halfW / (tanHalfFov * aspect),
    4,
  ) * 1.9;

  const position = center.clone().addScaledVector(dir, dist);
  return {
    position: { x: position.x, y: position.y, z: position.z },
    target: { x: center.x, y: center.y, z: center.z },
  };
}

// ── Poster spotlight ─────────────────────────────────────────────
// While the camera sits on the posters, light them one at a time:
// everything dims, then each poster brightens in turn, then all restore.
// Returns a cancel() that kills the effect and restores the colours.
const DIM = 0.38;

function highlightPosters(scene, done) {
  const posters = [];
  scene.traverse((child) => {
    if (!child.isMesh) return;
    const m = /poster(\d)_photo/i.exec(child.name);
    if (m && child.material?.color) posters.push({ n: Number(m[1]), mat: child.material });
  });
  posters.sort((a, b) => a.n - b.n);

  if (!posters.length) {
    const t = gsap.delayedCall(HOLD, done);
    return () => t.kill();
  }

  const colors = posters.map((p) => p.mat.color);
  const setAll = (v, duration) =>
    gsap.to(colors, { r: v, g: v, b: v, duration, ease: "power1.inOut" });

  const tl = gsap.timeline({ onComplete: done });
  tl.add(setAll(DIM, sec(0.4)));
  posters.forEach((p, i) => {
    tl.to(p.mat.color, { r: 1, g: 1, b: 1, duration: sec(0.3), ease: "power1.out" });
    tl.to({}, { duration: sec(0.8) }); // hold the spotlight
    if (i < posters.length - 1) {
      tl.to(p.mat.color, { r: DIM, g: DIM, b: DIM, duration: sec(0.25), ease: "power1.in" });
    }
  });
  tl.add(setAll(1, sec(0.45)));
  tl.to({}, { duration: sec(0.3) });

  return () => {
    tl.kill();
    gsap.killTweensOf(colors);
    colors.forEach((c) => c.setRGB(1, 1, 1));
  };
}

// ── Glow highlight (iMac, Mac, Hologram, TV, showcase items) ─────
// An additive "inverted hull" outline: a slightly inflated copy of each
// mesh drawn behind it. It never touches the originals' materials (which
// are shared between props), so nothing else can light up by accident.
const GLOW_COLOR = new THREE.Color("#ffc58a"); // warm amber, fits the room

function makeHull(mesh) {
  const geo = mesh.geometry;
  if (!geo) return null;
  if (!geo.boundingSphere) geo.computeBoundingSphere();
  const radius = geo.boundingSphere?.radius || 1;

  const center = geo.boundingSphere?.center ?? new THREE.Vector3();

  // Push vertices outward from the mesh centre (not along face normals):
  // hard-edged models have split normals, which tears the outline open
  // at every corner. A position-based direction can't tear.
  const mat = new THREE.ShaderMaterial({
    uniforms: {
      uThickness: { value: radius * 0.05 },
      uCenter: { value: center },
      uColor: { value: GLOW_COLOR },
      uOpacity: { value: 0 },
    },
    vertexShader: `
      uniform float uThickness;
      uniform vec3 uCenter;
      void main() {
        vec3 dir = position - uCenter;
        float len = length(dir);
        vec3 p = position + (len > 1e-5 ? dir / len : vec3(0.0)) * uThickness;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(p, 1.0);
      }`,
    fragmentShader: `
      uniform vec3 uColor;
      uniform float uOpacity;
      void main() { gl_FragColor = vec4(uColor, uOpacity); }`,
    side: THREE.BackSide,
    transparent: true,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
  });

  const hull = new THREE.Mesh(geo, mat);
  hull.renderOrder = 10;
  hull.raycast = () => {}; // never intercepts clicks
  mesh.add(hull);
  return { hull, mat };
}

function glowMeshes(meshes, duration, done) {
  const hulls = meshes.map(makeHull).filter(Boolean);

  if (!hulls.length) {
    const t = gsap.delayedCall(duration, done);
    return () => t.kill();
  }

  const mats = hulls.map((h) => h.mat.uniforms.uOpacity);
  const tl = gsap.timeline({ onComplete: () => { cleanup(); done(); } });
  const fade = Math.min(0.3, duration * 0.25);
  tl.to(mats, { value: 0.95, duration: fade, ease: "power2.out" });
  tl.to(mats, { value: 0.45, duration: (duration - fade * 2) / 2, ease: "sine.inOut" });
  tl.to(mats, { value: 0.95, duration: (duration - fade * 2) / 2, ease: "sine.inOut" });
  tl.to(mats, { value: 0, duration: fade, ease: "power2.in" });

  function cleanup() {
    hulls.forEach(({ hull, mat }) => {
      hull.parent?.remove(hull);
      mat.dispose();
    });
  }

  return () => {
    tl.kill();
    cleanup();
  };
}

function meshesWhere(scene, test) {
  const out = [];
  scene.traverse((child) => {
    if (!child.isMesh) return;
    const name = child.name.toLowerCase();
    if (name.endsWith(NIGHT_OVERLAY_SUFFIX)) return;
    if (test(name)) out.push(child);
  });
  return out;
}

// ── Socials: glow each icon in turn ──────────────────────────────
// Day mesh + its night-overlay twin are lit together, one social after
// another (same idea as the poster spotlight).
function glowSocials(scene, done) {
  const groups = personalInfo.socials
    .map((social) => {
      const meshes = [];
      scene.traverse((child) => {
        if (child.isMesh && child.name.toLowerCase().includes(social.name)) meshes.push(child);
      });
      return meshes;
    })
    .filter((g) => g.length);

  if (!groups.length) {
    const tm = gsap.delayedCall(HOLD, done);
    return () => tm.kill();
  }

  let cancelCurrent = null;
  let stopped = false;

  const next = (i) => {
    if (stopped) return;
    if (i >= groups.length) return done();
    cancelCurrent = glowMeshes(groups[i], SOCIAL_GLOW, () => {
      cancelCurrent = null;
      next(i + 1);
    });
  };
  next(0);

  return () => {
    stopped = true;
    cancelCurrent?.();
    cancelCurrent = null;
  };
}

// Built when the tour starts, so breakpoint-dependent positions are
// read fresh and the socials shot reflects the real mesh positions.
export function buildTourSteps(scene, camera) {
  const glow = (label, zoom, test, extra = {}) => ({
    label,
    ...pick(zoom),
    ...extra,
    custom: (done) => glowMeshes(meshesWhere(scene, test), extra.glow ?? GLOW_TIME, done),
  });

  const steps = [
    {
      label: "Posters",
      ...pick(POSTER_ZOOM),
      // spotlight each poster instead of a plain hold
      custom: (done) => highlightPosters(scene, done),
    },
    glow("TV", TV_ZOOM, (n) => /(^|[^a-z])tv/.test(n)),
    glow("iMac", IMAC_ZOOM, (n) => n.includes("imac")),
    glow("Mac", MAC_ZOOM, (n) => /(^|[^a-z])mac/.test(n)),
    glow("Hologram", HOLOGRAM_ZOOM, (n) => n.includes("hologram")),
    ...SHOWCASE_TARGETS.map((target) =>
      glow(
        "Showcase",
        target.camera,
        (n) => target.match.some((part) => n.includes(part.toLowerCase())),
        { move: SHOWCASE_MOVE, glow: SHOWCASE_GLOW },
      ),
    ),
  ];

  const socials = computeSocialsShot(scene, camera);
  if (socials) {
    steps.push({
      label: "Socials",
      ...socials,
      move: MOVE,
      hold: 0,
      custom: (done) => glowSocials(scene, done),
    });
  }

  // back to where we started — no hold, the tour ends on arrival
  steps.push({ label: "", ...pick(DEFAULT_CAMERA), hold: 0, move: HOME_MOVE });
  return steps;
}

// Snapshot a getter-based camera config into plain numbers.
function pick(cfg) {
  const p = cfg.position;
  const t = cfg.target;
  return {
    position: { x: p.x, y: p.y, z: p.z },
    target: { x: t.x, y: t.y, z: t.z },
    move: MOVE,
    hold: HOLD,
  };
}
