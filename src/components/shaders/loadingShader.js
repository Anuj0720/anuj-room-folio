import * as THREE from "three";

// ─────────────────────────────────────────────────────────────────
// Loading Reveal — spiral wipe

const vertexShader = /* glsl */ `
  varying vec2 vUv;

  void main() {
    vUv = uv;
    gl_Position = vec4(position.xy, 0.0, 1.0);
  }
`;

const fragmentShader = /* glsl */ `
  uniform vec3 uColor;
  uniform float uProgression; // 0 = fully covered, 1 = fully revealed
  uniform vec2 uResolution;
  uniform float uArms;        // spiral arm density
  uniform float uTightness;   // how tightly the spiral winds toward the edge

  varying vec2 vUv;

  const float PI = 3.141592654;

  void main() {
    vec2 uvs = vUv - 0.5;
    uvs.x *= uResolution.x / uResolution.y; // keep the spiral circular, not stretched

    float r = length(uvs * 0.92);
    float theta = atan(uvs.y, uvs.x);

    float spiral = fract(uArms * theta / PI + uTightness * pow(r, 0.4) - 4.5 * uProgression);

    // Stage 1 — the spiral bands fade in starting at 25% 
    float spiralThreshold = smoothstep(0.25, 1.0, uProgression);
    float alphaSpiral = step(spiralThreshold, spiral);

    // Stage 2 — a plain growing circle (25% -> 80%)
    float circleThreshold = smoothstep(0.25, 0.8, uProgression);
    float alphaCircle = step(circleThreshold, r);
    float alpha = max(alphaSpiral, alphaCircle);

    // Stage 3 — a second, later circle (50% -> 100%) 
    float closeThreshold = smoothstep(0.5, 1.0, uProgression);
    float alphaClose = step(closeThreshold, r);
    alpha = min(alpha, alphaClose);

    if (alpha < 0.02) discard; 
    gl_FragColor = vec4(uColor, alpha);
    
    // Convert Linear color to sRGB so WebGL matches standard CSS hex colors
    #include <colorspace_fragment>
  }
`;

export function createSpiralRevealMaterial(options = {}) {
  const {
    color = "#ffc9c9",
    arms = 2.5,
    tightness = 7.0,
  } = options;

  // Accept either a plain hex string 
  const colorValue = color instanceof THREE.Color ? color : new THREE.Color(color);

  return new THREE.ShaderMaterial({
    uniforms: {
      uColor: { value: colorValue },
      uProgression: { value: 0 },
      uResolution: { value: new THREE.Vector2(1, 1) },
      uArms: { value: arms },
      uTightness: { value: tightness },
    },
    vertexShader,
    fragmentShader,
    transparent: true,
    depthTest: false,
    depthWrite: false,
  });
}

function easeInOutCubic(t) {
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
}

// Sets up its own tiny transparent-background renderer + full-screen

export function createLoadingReveal({ duration = 3600, onComplete, ...materialOptions } = {}) {
  const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setClearColor(0x000000, 0);

  const scene = new THREE.Scene();
  const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0.1, 10);
  camera.position.z = 1;

  const material = createSpiralRevealMaterial(materialOptions);
  material.uniforms.uResolution.value.set(window.innerWidth, window.innerHeight);

  const quad = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), material);
  scene.add(quad);

  const state = { duration };

  let rafId = null;
  let startTime = null;
  let finished = false;

  const handleResize = () => {
    renderer.setSize(window.innerWidth, window.innerHeight);
    material.uniforms.uResolution.value.set(window.innerWidth, window.innerHeight);
  };
  window.addEventListener("resize", handleResize);

  const tick = (now) => {
    if (startTime === null) startTime = now;
    const raw = Math.min((now - startTime) / state.duration, 1);
    const eased = easeInOutCubic(raw);

    material.uniforms.uProgression.value = eased;
    renderer.render(scene, camera);

    if (raw >= 1) {
      finished = true;
      onComplete?.();
      return;
    }
    rafId = requestAnimationFrame(tick);
  };
  rafId = requestAnimationFrame(tick);

  function setDuration(newDuration) {
    state.duration = newDuration;
  }

  function setColor(newColor) {
    material.uniforms.uColor.value.set(newColor);
  }

  function dispose() {
    if (rafId !== null) cancelAnimationFrame(rafId);
    window.removeEventListener("resize", handleResize);
    quad.geometry.dispose();
    material.dispose();
    renderer.dispose();
  }

  return {
    domElement: renderer.domElement,
    dispose,
    setDuration,
    setColor,
    get finished() { return finished; },
  };
}