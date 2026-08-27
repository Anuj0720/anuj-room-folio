import * as THREE from "three";

const videoVertexShader = `
  varying vec2 vUv;
  varying vec3 vPosition;

  void main() {
    vUv = uv;
    // Pass the local object-space position to the fragment shader
    vPosition = position; 
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

const videoFragmentShader = `
  uniform sampler2D uMap;
  uniform float uTime;
  
  // Leva Control Uniforms
  uniform float uTimeMultiplier;
  uniform float uJitterMagnitude;
  uniform float uFreq;
  uniform vec3 uInkColor;
  uniform vec3 uLumThresholds;
  
  varying vec2 vUv;
  varying vec3 vPosition;

  // Pseudo-random noise function for the "boil" effect
  float rand(vec2 co){
      return fract(sin(dot(co.xy ,vec2(12.9898,78.233))) * 43758.5453);
  }

  void main() {
    // 1. Stepped time variable to create a stop-motion / sketchy jitter
    float timeStep = floor(uTime * uTimeMultiplier);
    
    // 2. Sample the underlying video texture
    vec4 texColor = texture2D(uMap, vUv);
    
    // Calculate luminance to determine where to draw the sketch lines
    float lum = dot(texColor.rgb, vec3(0.299, 0.587, 0.114));
    
    // 3. Jitter the object-space coordinates to make the lines feel hand-drawn
    vec3 jitteredPos = vPosition + vec3(
      rand(vPosition.xy + timeStep) * uJitterMagnitude,
      rand(vPosition.yz + timeStep) * uJitterMagnitude,
      rand(vPosition.zx + timeStep) * uJitterMagnitude
    );

    // Density of the hatching lines
    float freq = uFreq;
    
    // 4. Object-Space Line Art: generate strokes using the 3D position 
    float hatch1 = sin((jitteredPos.x + jitteredPos.y) * freq);
    float hatch2 = sin((jitteredPos.x - jitteredPos.y) * freq);
    float hatch3 = sin((jitteredPos.x + jitteredPos.y + jitteredPos.z) * freq);
    
    float sketch = 1.0;
    
    // 5. Tone mapping: the darker the video pixel, the more cross-hatching layers apply
    if (lum < uLumThresholds.x) sketch *= smoothstep(0.0, 0.2, hatch1);
    if (lum < uLumThresholds.y) sketch *= smoothstep(0.0, 0.2, hatch2);
    if (lum < uLumThresholds.z) sketch *= smoothstep(0.0, 0.2, hatch3);
    
    // 6. Final composition: Blend dark ink lines with the original video color
    vec3 finalColor = mix(uInkColor, texColor.rgb, sketch);
    
    gl_FragColor = vec4(finalColor, 1.0);
  }
`;

export const getSketchyVideoMaterial = (videoTexture) => {
  return new THREE.ShaderMaterial({
    uniforms: {
      uMap: { value: videoTexture },
      uTime: { value: 0.0 },
      // Default values mapping to the original hardcoded settings
      uTimeMultiplier: { value: 8.0 },
      uJitterMagnitude: { value: 0.015 },
      uFreq: { value: 120.0 },
      uInkColor: { value: new THREE.Color(0.02, 0.02, 0.05) },
      uLumThresholds: { value: new THREE.Vector3(0.75, 0.50, 0.25) }
    },
    vertexShader: videoVertexShader,
    fragmentShader: videoFragmentShader,
    side: THREE.FrontSide,
    toneMapped: false,
  });
};