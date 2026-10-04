import * as THREE from "three";

const VERT = /* glsl */ `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = vec4(position.xy, 0.0, 1.0);
  }
`;

const FRAG = /* glsl */ `
  precision highp float;

  uniform sampler2D tColor;
  uniform sampler2D tDepth;
  uniform vec2  uRes;       // drawing-buffer size in px
  uniform vec2  uNearFar;
  uniform float uProgress;  // 0 = normal 3D, 1 = full drawing
  uniform vec2  uOrigin;    // where the ink wipe starts (uv)
  uniform float uSeed;      // changes a few times a second -> "boiling" lines
  uniform float uPx;        // resolution scale (1 at ~1000px tall)
  uniform float uLine;      // outline thickness multiplier
  uniform float uHatch;     // hatch / stipple strength multiplier
  varying vec2 vUv;

  float hash12(vec2 p) {
    vec3 p3 = fract(vec3(p.xyx) * 0.1031);
    p3 += dot(p3, p3.yzx + 33.33);
    return fract((p3.x + p3.y) * p3.z);
  }
  float vnoise(vec2 p) {
    vec2 i = floor(p), f = fract(p);
    f = f * f * (3.0 - 2.0 * f);
    return mix(mix(hash12(i), hash12(i + vec2(1.0, 0.0)), f.x),
               mix(hash12(i + vec2(0.0, 1.0)), hash12(i + vec2(1.0, 1.0)), f.x), f.y);
  }

  float linDepth(vec2 uv) {
    float z = texture2D(tDepth, uv).x * 2.0 - 1.0;
    float n = uNearFar.x, f = uNearFar.y;
    return 2.0 * n * f / (f + n - z * (f - n));
  }
  float lumOf(vec3 c) { return dot(c, vec3(0.2126, 0.7152, 0.0722)); }
  float perc(vec3 c)  { return pow(max(lumOf(c), 1e-4), 1.0 / 2.2); }
  float percAt(vec2 uv) { return perc(texture2D(tColor, uv).rgb); }

  vec3 stylize(vec3 src) {
    vec2 pxc = vUv * uRes;
    vec2 q = pxc / uPx;               // resolution-independent "paper pixels"

    // ── 1. flat cel colours (soft-edged tonal bands, hue kept) ──────────
    float lum = lumOf(src);
    float g = perc(src);
    float bands = 5.0;
    float f = g * bands;
    float fl = floor(f);
    float gb = (fl + smoothstep(0.43, 0.57, fract(f))) / bands;
    vec3 flatC = src * clamp(pow(max(gb, 0.02), 2.2) / max(lum, 1e-4), 0.0, 4.0);
    // punchier, more saturated flat colour like inked + coloured paper
    float fl2 = lumOf(flatC);
    flatC = max(mix(vec3(fl2), flatC, 1.18), 0.0);

    // ── 2. hatching + stipple where it is dark ─────────────────────────
    float shade = (1.0 - smoothstep(0.24, 0.66, g)) * uHatch;
    float wob = vnoise(q / 38.0) * 3.0;

    float hA = (q.x + q.y) / 7.5 + wob;
    float triA = abs(fract(hA) - 0.5) * 2.0;
    float wA = shade * 0.72;
    float hatchA = (1.0 - smoothstep(wA - 0.07, wA, triA)) * step(0.16, shade);

    float hB = (q.x - q.y) / 8.5 + wob * 0.7;
    float triB = abs(fract(hB) - 0.5) * 2.0;
    float wB = smoothstep(0.5, 1.0, shade) * 0.6;
    float hatchB = (1.0 - smoothstep(wB - 0.07, wB, triB)) * step(0.55, shade);

    float dots = step(1.0 - shade * 0.55, hash12(floor(q / 2.2))) * smoothstep(0.08, 0.3, shade);

    vec3 inkC = vec3(0.040, 0.014, 0.007);
    float inkAmt = max(max(hatchA, hatchB) * 0.9, dots * 0.8);
    vec3 c = mix(flatC, mix(flatC, inkC, 0.8), inkAmt);

    // ── 3. paper grain + warm tint ──────────────────────────────────────
    float grain = hash12(floor(q * 0.9) + 7.0);
    c *= 0.93 + 0.10 * grain;
    c *= 0.97 + 0.05 * vnoise(q / 3.0);
    c *= vec3(1.03, 1.0, 0.95);

    // ── 4. wobbly ink outlines ─────────────────────────────────────────
    vec2 o  = vec2(uLine * uPx * 1.7) / uRes;      // silhouette weight
    vec2 ox = vec2(o.x, 0.0), oy = vec2(0.0, o.y);
    vec2 oc = vec2(uLine * uPx * 0.9) / uRes;      // finer detail lines
    vec2 cx = vec2(oc.x, 0.0), cy = vec2(0.0, oc.y);
    vec2 wb = (vec2(vnoise(q / 29.0 + uSeed * 1.7), vnoise(q / 29.0 + 41.0 - uSeed * 2.3)) - 0.5)
              * 2.4 * uPx / uRes;
    vec2 uv = vUv + wb;

    // depth: inverse depth is linear on any flat surface, so its second
    // difference is ~0 on planes and spikes on silhouettes and creases
    float dC = linDepth(uv);
    float iC = 1.0 / dC;
    float lap = abs(1.0 / linDepth(uv - ox) + 1.0 / linDepth(uv + ox) - 2.0 * iC)
              + abs(1.0 / linDepth(uv - oy) + 1.0 / linDepth(uv + oy) - 2.0 * iC);
    float eD = smoothstep(0.0035, 0.011, lap * dC);

    // faint colour edges pick out details drawn on flat surfaces
    float cE = abs(percAt(uv + cx + cy) - percAt(uv - cx - cy))
             + abs(percAt(uv + cx - cy) - percAt(uv - cx + cy));
    float eC = smoothstep(0.16, 0.34, cE) * 0.55;

    float edge = max(eD, eC);
    edge *= 0.82 + 0.18 * vnoise(q / 6.0);      // uneven pressure
    edge = smoothstep(0.30, 0.62, edge);

    vec3 lineC = vec3(0.022, 0.009, 0.004);
    c = mix(c, lineC, edge * 0.94);
    return c;
  }

  void main() {
    vec3 src = texture2D(tColor, vUv).rgb;
    vec3 outC = src;

    if (uProgress > 0.0005) {
      // ink wipe radiating from the button
      float aspect = uRes.x / uRes.y;
      vec2 d = (vUv - uOrigin) * vec2(aspect, 1.0);
      vec2 far = max(uOrigin, 1.0 - uOrigin) * vec2(aspect, 1.0);
      float front = uProgress * length(far) * 1.1;
      float dist = length(d) + (vnoise(vUv * 7.0) - 0.5) * 0.05 + (vnoise(vUv * 23.0) - 0.5) * 0.02;

      float mask = 1.0 - smoothstep(front - 0.012, front, dist);
      float ringW = 0.02;
      float ring = smoothstep(front - ringW, front - ringW * 0.55, dist)
                 * (1.0 - smoothstep(front - ringW * 0.15, front, dist));

      if (mask > 0.001) outC = mix(src, stylize(src), mask);
      outC = mix(outC, vec3(0.03, 0.012, 0.006), ring * 0.9);
    }

    gl_FragColor = vec4(outC, 1.0);
    #include <tonemapping_fragment>
    #include <colorspace_fragment>
  }
`;

export class InkPipeline {
  constructor() {
    this.depthTexture = new THREE.DepthTexture(1, 1);
    this.depthTexture.type = THREE.UnsignedIntType;

    this.target = new THREE.WebGLRenderTarget(1, 1, {
      type: THREE.HalfFloatType,
      minFilter: THREE.NearestFilter,
      magFilter: THREE.NearestFilter,
      depthBuffer: true,
      depthTexture: this.depthTexture,
    });

    this.material = new THREE.ShaderMaterial({
      vertexShader: VERT,
      fragmentShader: FRAG,
      uniforms: {
        tColor: { value: this.target.texture },
        tDepth: { value: this.depthTexture },
        uRes: { value: new THREE.Vector2(1, 1) },
        uNearFar: { value: new THREE.Vector2(1, 1000) },
        uProgress: { value: 0 },
        uOrigin: { value: new THREE.Vector2(0.94, 0.9) },
        uSeed: { value: 0 },
        uPx: { value: 1 },
        uLine: { value: 1 },
        uHatch: { value: 1 },
      },
      depthTest: false,
      depthWrite: false,
    });

    this.quad = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), this.material);
    this.quad.frustumCulled = false;
    this.quadScene = new THREE.Scene();
    this.quadScene.add(this.quad);
    this.quadCamera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);

    this._size = new THREE.Vector2();
  }

  // Tweakable look
  set lineWidth(v) {
    this.material.uniforms.uLine.value = v;
  }
  set hatchStrength(v) {
    this.material.uniforms.uHatch.value = v;
  }

  render(renderer, scene, camera, { progress, origin, seed = 0 }) {
    renderer.getDrawingBufferSize(this._size);
    const w = Math.max(1, Math.floor(this._size.x));
    const h = Math.max(1, Math.floor(this._size.y));

    if (this.target.width !== w || this.target.height !== h) {
      this.target.setSize(w, h);
      this.depthTexture.image.width = w;
      this.depthTexture.image.height = h;
    }

    const u = this.material.uniforms;
    u.uRes.value.set(w, h);
    u.uPx.value = h / 1000;
    u.uNearFar.value.set(camera.near, camera.far);
    u.uProgress.value = progress;
    u.uSeed.value = seed;
    if (origin) u.uOrigin.value.set(origin[0], origin[1]);

    const prevTarget = renderer.getRenderTarget();
    renderer.setRenderTarget(this.target);
    renderer.render(scene, camera);

    renderer.setRenderTarget(prevTarget);
    renderer.render(this.quadScene, this.quadCamera);
  }

  dispose() {
    this.target.dispose();
    this.depthTexture.dispose();
    this.material.dispose();
    this.quad.geometry.dispose();
  }
}
