import * as THREE from "three";

const perlinNoiseGLSL = /* glsl */ `
  vec3 mod289(vec3 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
  vec4 mod289(vec4 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
  vec4 permute(vec4 x) { return mod289(((x * 34.0) + 1.0) * x); }
  vec4 taylorInvSqrt(vec4 r) { return 1.79284291400159 - 0.85373472095314 * r; }
  vec3 fade(vec3 t) { return t * t * t * (t * (t * 6.0 - 15.0) + 10.0); }

  float cnoise(vec3 P) {
    vec3 Pi0 = floor(P);
    vec3 Pi1 = Pi0 + vec3(1.0);
    Pi0 = mod289(Pi0);
    Pi1 = mod289(Pi1);
    vec3 Pf0 = fract(P);
    vec3 Pf1 = Pf0 - vec3(1.0);
    vec4 ix = vec4(Pi0.x, Pi1.x, Pi0.x, Pi1.x);
    vec4 iy = vec4(Pi0.yy, Pi1.yy);
    vec4 iz0 = Pi0.zzzz;
    vec4 iz1 = Pi1.zzzz;

    vec4 ixy = permute(permute(ix) + iy);
    vec4 ixy0 = permute(ixy + iz0);
    vec4 ixy1 = permute(ixy + iz1);

    vec4 gx0 = ixy0 * (1.0 / 7.0);
    vec4 gy0 = fract(floor(gx0) * (1.0 / 7.0)) - 0.5;
    gx0 = fract(gx0);
    vec4 gz0 = vec4(0.5) - abs(gx0) - abs(gy0);
    vec4 sz0 = step(gz0, vec4(0.0));
    gx0 -= sz0 * (step(0.0, gx0) - 0.5);
    gy0 -= sz0 * (step(0.0, gy0) - 0.5);

    vec4 gx1 = ixy1 * (1.0 / 7.0);
    vec4 gy1 = fract(floor(gx1) * (1.0 / 7.0)) - 0.5;
    gx1 = fract(gx1);
    vec4 gz1 = vec4(0.5) - abs(gx1) - abs(gy1);
    vec4 sz1 = step(gz1, vec4(0.0));
    gx1 -= sz1 * (step(0.0, gx1) - 0.5);
    gy1 -= sz1 * (step(0.0, gy1) - 0.5);

    vec3 g000 = vec3(gx0.x, gy0.x, gz0.x);
    vec3 g100 = vec3(gx0.y, gy0.y, gz0.y);
    vec3 g010 = vec3(gx0.z, gy0.z, gz0.z);
    vec3 g110 = vec3(gx0.w, gy0.w, gz0.w);
    vec3 g001 = vec3(gx1.x, gy1.x, gz1.x);
    vec3 g101 = vec3(gx1.y, gy1.y, gz1.y);
    vec3 g011 = vec3(gx1.z, gy1.z, gz1.z);
    vec3 g111 = vec3(gx1.w, gy1.w, gz1.w);

    vec4 norm0 = taylorInvSqrt(vec4(dot(g000, g000), dot(g010, g010), dot(g100, g100), dot(g110, g110)));
    g000 *= norm0.x; g010 *= norm0.y; g100 *= norm0.z; g110 *= norm0.w;
    vec4 norm1 = taylorInvSqrt(vec4(dot(g001, g001), dot(g011, g011), dot(g101, g101), dot(g111, g111)));
    g001 *= norm1.x; g011 *= norm1.y; g101 *= norm1.z; g111 *= norm1.w;

    float n000 = dot(g000, Pf0);
    float n100 = dot(g100, vec3(Pf1.x, Pf0.yz));
    float n010 = dot(g010, vec3(Pf0.x, Pf1.y, Pf0.z));
    float n110 = dot(g110, vec3(Pf1.xy, Pf0.z));
    float n001 = dot(g001, vec3(Pf0.xy, Pf1.z));
    float n101 = dot(g101, vec3(Pf1.x, Pf0.y, Pf1.z));
    float n011 = dot(g011, vec3(Pf0.x, Pf1.yz));
    float n111 = dot(g111, Pf1);

    vec3 fadeXYZ = fade(Pf0);
    vec4 nZ = mix(vec4(n000, n100, n010, n110), vec4(n001, n101, n011, n111), fadeXYZ.z);
    vec2 nYZ = mix(nZ.xy, nZ.zw, fadeXYZ.y);
    float nXYZ = mix(nYZ.x, nYZ.y, fadeXYZ.x);
    return 2.2 * nXYZ;
  }
`;

// ── Derive a color from a mesh's existing texture instead of picking
//    one arbitrarily — downsamples it to a tiny canvas and averages
//    the pixels, then pushes that average toward something punchier
//    so it reads as a glow rather than a flat swatch. ───────────────

export function getAverageTextureColor(texture) {
  if (!texture || !texture.image) return null;

  const image = texture.image;
  const width = image.width || image.videoWidth;
  const height = image.height || image.videoHeight;
  if (!width || !height) return null;

  const size = 16; // we only need an average — no reason to sample full-res
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d");
  if (!ctx) return null;

  try {
    ctx.drawImage(image, 0, 0, size, size);
    const { data } = ctx.getImageData(0, 0, size, size);

    let r = 0;
    let g = 0;
    let b = 0;
    let count = 0;

    for (let i = 0; i < data.length; i += 4) {
      if (data[i + 3] < 8) continue; // skip near-transparent pixels
      r += data[i];
      g += data[i + 1];
      b += data[i + 2];
      count += 1;
    }

    if (count === 0) return null;

    const color = new THREE.Color(r / count / 255, g / count / 255, b / count / 255);

    // Push the flat average toward something that reads as a glow
    // rather than the object's dull average tone.
    const hsl = { h: 0, s: 0, l: 0 };
    color.getHSL(hsl);
    color.setHSL(hsl.h, Math.min(1, hsl.s * 1.3 + 0.2), Math.min(0.75, hsl.l * 1.4 + 0.15));
    return color;
  } catch {

    return null;
  }
}


export function patchDissolveMaterial(material, options = {}) {
  const {
    color = new THREE.Color("#ff6600"),
    edgeWidth = 0.08,
    frequency = 2.0,
    amplitude = 1.0,
    progress = -1.2,
  } = options;

  const uniforms = {
    uProgress: { value: progress },
    uEdge: { value: edgeWidth },
    uFreq: { value: frequency },
    uAmp: { value: amplitude },
    uEdgeColor: { value: color },
  };

  material.onBeforeCompile = (shader) => {
    Object.assign(shader.uniforms, uniforms);

    shader.vertexShader = shader.vertexShader
      .replace(
        "#include <common>",
        `#include <common>
        varying vec3 vDissolvePos;`,
      )
      .replace(
        "#include <begin_vertex>",
        `#include <begin_vertex>
        vDissolvePos = position;`,
      );

    shader.fragmentShader = shader.fragmentShader
      .replace(
        "#include <common>",
        `#include <common>
        uniform float uProgress;
        uniform float uEdge;
        uniform float uFreq;
        uniform float uAmp;
        uniform vec3 uEdgeColor;
        varying vec3 vDissolvePos;
        ${perlinNoiseGLSL}`,
      )
      .replace(
        "#include <dithering_fragment>",
        `#include <dithering_fragment>
        float dissolveNoise = cnoise(vDissolvePos * uFreq) * uAmp;
        if (dissolveNoise < uProgress) discard;
        if (dissolveNoise < uProgress + uEdge) {
          gl_FragColor = vec4(uEdgeColor, 1.0);
        }`,
      );
  };

  material.userData.dissolveUniforms = uniforms;
  material.needsUpdate = true;

  return uniforms;
}

// ── Area-weighted random sampling across a geometry's triangles.
//    Used instead of the mesh's raw vertices so particle density
//    doesn't depend on how low-poly the source mesh is. ────────────

function sampleSurfacePoints(geometry, count) {
  const posAttr = geometry.attributes.position;
  const index = geometry.index ? geometry.index.array : null;
  const triCount = index ? index.length / 3 : Math.floor(posAttr.count / 3);

  const areas = new Float32Array(triCount);
  let totalArea = 0;

  const vA = new THREE.Vector3();
  const vB = new THREE.Vector3();
  const vC = new THREE.Vector3();
  const ab = new THREE.Vector3();
  const ac = new THREE.Vector3();
  const cross = new THREE.Vector3();

  const getTriVerts = (t) => {
    let ia, ib, ic;
    if (index) {
      ia = index[t * 3];
      ib = index[t * 3 + 1];
      ic = index[t * 3 + 2];
    } else {
      ia = t * 3;
      ib = t * 3 + 1;
      ic = t * 3 + 2;
    }
    vA.fromBufferAttribute(posAttr, ia);
    vB.fromBufferAttribute(posAttr, ib);
    vC.fromBufferAttribute(posAttr, ic);
  };

  for (let t = 0; t < triCount; t++) {
    getTriVerts(t);
    ab.subVectors(vB, vA);
    ac.subVectors(vC, vA);
    cross.crossVectors(ab, ac);
    const area = cross.length() * 0.5;
    areas[t] = area;
    totalArea += area;
  }

  const positions = new Float32Array(count * 3);

  for (let i = 0; i < count; i++) {
    let r = Math.random() * totalArea;
    let t = 0;
    while (t < triCount - 1 && r > areas[t]) {
      r -= areas[t];
      t += 1;
    }
    getTriVerts(t);

    let u = Math.random();
    let v = Math.random();
    if (u + v > 1) {
      u = 1 - u;
      v = 1 - v;
    }
    const w = 1 - u - v;

    positions[i * 3 + 0] = vA.x * w + vB.x * u + vC.x * v;
    positions[i * 3 + 1] = vA.y * w + vB.y * u + vC.y * v;
    positions[i * 3 + 2] = vA.z * w + vB.z * u + vC.z * v;
  }

  return positions;
}


export function createDissolveParticles(mesh, options = {}) {
  const {
    color = new THREE.Color("#ffaa33"),
    baseSize = 60,
    speed = 0.6,
    frequency = 2.0,
    amplitude = 1.0,
    edgeWidth = 0.08,
    progress = -1.2,
    particleCount = 600,
  } = options;

  const count = particleCount;
  const initPos = sampleSurfacePoints(mesh.geometry, count);
  const currPos = Float32Array.from(initPos);
  const velocity = new Float32Array(count * 3);
  const maxOffset = new Float32Array(count);
  const angle = new Float32Array(count);
  const dist = new Float32Array(count);

  mesh.updateMatrixWorld(true);
  const inverseWorld = mesh.matrixWorld.clone().invert();
  const worldUpLocal = new THREE.Vector3(0, 1, 0)
    .transformDirection(inverseWorld)
    .normalize();

  for (let i = 0; i < count; i++) {
 
    const upward = Math.random() * 0.9 + 0.7;
    const spreadX = (Math.random() - 0.5) * 0.3;
    const spreadY = (Math.random() - 0.5) * 0.08;
    const spreadZ = (Math.random() - 0.5) * 0.3;

    velocity[i * 3 + 0] = worldUpLocal.x * upward + spreadX;
    velocity[i * 3 + 1] = worldUpLocal.y * upward + spreadY;
    velocity[i * 3 + 2] = worldUpLocal.z * upward + spreadZ;

    maxOffset[i] = Math.random() * 1.8 + 0.7;
    angle[i] = Math.random() * Math.PI * 2;
  }

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.BufferAttribute(currPos, 3));
  geometry.setAttribute("aInitPos", new THREE.BufferAttribute(initPos, 3));
  geometry.setAttribute("aAngle", new THREE.BufferAttribute(angle, 1));
  geometry.setAttribute("aDist", new THREE.BufferAttribute(dist, 1));

  const material = new THREE.ShaderMaterial({
    uniforms: {
      uColor: { value: color },
      uBaseSize: { value: baseSize },
      uProgress: { value: progress },
      uEdge: { value: edgeWidth },
      uFreq: { value: frequency },
      uAmp: { value: amplitude },
    },
    vertexShader: /* glsl */ `
      uniform float uBaseSize;
      uniform float uFreq;
      uniform float uAmp;

      attribute vec3 aInitPos;
      attribute float aAngle;
      attribute float aDist;

      varying float vNoise;
      varying float vAngle;

      ${perlinNoiseGLSL}

      void main() {
       
        vNoise = cnoise(aInitPos * uFreq) * uAmp;
        vAngle = aAngle;

        vec4 viewPosition = modelViewMatrix * vec4(position, 1.0);
        gl_Position = projectionMatrix * viewPosition;

        float size = uBaseSize / (aDist + 1.0);
        gl_PointSize = size / -viewPosition.z;
      }
    `,
    fragmentShader: /* glsl */ `
      uniform vec3 uColor;
      uniform float uEdge;
      uniform float uProgress;

      varying float vNoise;
      varying float vAngle;

      void main() {
        if (vNoise < uProgress) discard;
        if (vNoise > uProgress + uEdge) discard;

        vec2 coord = gl_PointCoord - 0.5;
        float c = cos(vAngle);
        float s = sin(vAngle);
        coord = mat2(c, s, -s, c) * coord;
        coord += 0.5;

        float d = length(coord - 0.5);
        float alpha = smoothstep(0.5, 0.1, d);
        if (alpha < 0.05) discard;

        gl_FragColor = vec4(uColor, alpha);
      }
    `,
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
  });

  const points = new THREE.Points(geometry, material);
  points.frustumCulled = false;

  points.renderOrder = 20;

  const state = { speedFactor: speed * 0.035 };
  const vA = new THREE.Vector3();
  const vB = new THREE.Vector3();

  function update() {
    for (let i = 0; i < count; i++) {
      const x = i * 3;
      const y = i * 3 + 1;
      const z = i * 3 + 2;

      currPos[x] += velocity[x] * state.speedFactor;
      currPos[y] += velocity[y] * state.speedFactor;
      currPos[z] += velocity[z] * state.speedFactor;

      vA.set(initPos[x], initPos[y], initPos[z]);
      vB.set(currPos[x], currPos[y], currPos[z]);
      const d = vA.distanceTo(vB);
      dist[i] = d;

      if (d > maxOffset[i]) {
        currPos[x] = initPos[x];
        currPos[y] = initPos[y];
        currPos[z] = initPos[z];
        dist[i] = 0;
      }

      angle[i] += 0.01;
    }

    geometry.attributes.position.needsUpdate = true;
    geometry.attributes.aDist.needsUpdate = true;
    geometry.attributes.aAngle.needsUpdate = true;
  }

  function setProgress(value) {
    material.uniforms.uProgress.value = value;
  }

  function setSpeed(newSpeed) {
    state.speedFactor = newSpeed * 0.035;
  }

  function dispose() {
    geometry.dispose();
    material.dispose();
  }

  return {
    points,
    update,
    setProgress,
    setSpeed,
    uniforms: material.uniforms,
    dispose,
  };
}



export function createDissolveEffect(mesh, options = {}) {
  const settings = {
    cycleDuration: options.cycleDuration ?? 16, 
    progressRange: options.progressRange ?? [-1.2, 1.2],
    phase: options.phase ?? 0,
  };
  let startTime = null;

  const {
    edgeWidth = 0.08,
    frequency = 2.0,
    amplitude = 1.0,
    edgeColor = new THREE.Color("#ff6600"),
    particleColor = new THREE.Color("#ffaa33"),
    particleSize = 60,
    particleSpeed = 0.6,
    particleCount = 600,
  } = options;

  const materialUniforms = patchDissolveMaterial(mesh.material, {
    color: edgeColor,
    edgeWidth,
    frequency,
    amplitude,
    progress: settings.progressRange[0],
  });

  const particles = createDissolveParticles(mesh, {
    color: particleColor,
    baseSize: particleSize,
    speed: particleSpeed,
    frequency,
    amplitude,
    edgeWidth,
    progress: settings.progressRange[0],
    particleCount,
  });

  function update(elapsedTime) {
    if (startTime === null) startTime = elapsedTime;

    const [minProgress, maxProgress] = settings.progressRange;
    const localTime = Math.max(0, elapsedTime - startTime);
    const t = (localTime / settings.cycleDuration) * Math.PI * 2;
    const wave = (1 - Math.cos(t)) / 2; // 0 -> 1 -> 0
    const progress = minProgress + wave * (maxProgress - minProgress);

    materialUniforms.uProgress.value = progress;
    particles.setProgress(progress);
    particles.update();
  }


  function setParams(partial) {
    if (partial.cycleDuration !== undefined) settings.cycleDuration = partial.cycleDuration;
    if (partial.progressRange !== undefined) settings.progressRange = partial.progressRange;
    if (partial.phase !== undefined) settings.phase = partial.phase;

    if (partial.edgeWidth !== undefined) {
      materialUniforms.uEdge.value = partial.edgeWidth;
      particles.uniforms.uEdge.value = partial.edgeWidth;
    }
    if (partial.frequency !== undefined) {
      materialUniforms.uFreq.value = partial.frequency;
      particles.uniforms.uFreq.value = partial.frequency;
    }
    if (partial.amplitude !== undefined) {
      materialUniforms.uAmp.value = partial.amplitude;
      particles.uniforms.uAmp.value = partial.amplitude;
    }
    if (partial.edgeColor !== undefined) {
      materialUniforms.uEdgeColor.value.copy(partial.edgeColor);
    }
    if (partial.particleColor !== undefined) {
      particles.uniforms.uColor.value.copy(partial.particleColor);
    }
    if (partial.particleSize !== undefined) {
      particles.uniforms.uBaseSize.value = partial.particleSize;
    }
    if (partial.particleSpeed !== undefined) {
      particles.setSpeed(partial.particleSpeed);
    }
  }

  function dispose() {
    particles.dispose();
  }

  return {
    update,
    setParams,
    dispose,
    points: particles.points,
    uniforms: materialUniforms,
    particleUniforms: particles.uniforms,
  };
}