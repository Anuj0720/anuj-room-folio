import { useGLTF } from "@react-three/drei";
import { useEffect, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { useControls, folder } from "leva";
import * as THREE from "three";
import {
  createDissolveEffect,
  patchDissolveMaterial,
  getAverageTextureColor,
} from "../shaders/dissolveShader";
import { SHOWCASE_TARGETS } from "./showcaseTargets";

const FALLBACK_EDGE_COLOR = new THREE.Color("#ff6600");
const FALLBACK_PARTICLE_COLOR = new THREE.Color("#ffaa33");


const NIGHT_OVERLAY_SUFFIX = "_night_overlay";


export function Showcase({ activeId }) {
  const { scene } = useGLTF("/models/room.glb");

  
  const registryRef = useRef(new Map());
  const liveRef = useRef(new Map());
  const lastParticleCountRef = useRef(null);

  const {
    cycleDuration,
    edgeWidth,
    frequency,
    amplitude,
    particleCount,
    particleSize,
    particleSpeed,
    phaseStep,
    useTextureColor,
    edgeColor,
    particleColor,
  } = useControls("Dissolve Effect", {
    timing: folder({
      cycleDuration: { value: 9, min: 4, max: 40, step: 1, label: "cycle (s)" },
      phaseStep: { value: 1.4, min: 0, max: 6, step: 0.1, label: "stagger (s)" },
    }),
    shape: folder({
      edgeWidth: { value: 0.08, min: 0.01, max: 0.4, step: 0.01 },
      frequency: { value: 2.0, min: 0.2, max: 6, step: 0.1 },
      amplitude: { value: 1.0, min: 0.2, max: 2, step: 0.05 },
    }),
    particles: folder({
      particleCount: { value: 600, min: 50, max: 2000, step: 50 },
      particleSize: { value: 60, min: 5, max: 200, step: 5 },
      particleSpeed: { value: 0.6, min: 0, max: 3, step: 0.05 },
    }),
    color: folder({
      useTextureColor: { value: true, label: "match mesh texture" },
      edgeColor: { value: "#ff6600", render: (get) => !get("Dissolve Effect.color.useTextureColor") },
      particleColor: { value: "#ffaa33", render: (get) => !get("Dissolve Effect.color.useTextureColor") },
    }),
  });

  useEffect(() => {
    if (!scene) return;

    const registry = new Map();
    let matchIndex = 0;

    scene.traverse((child) => {
      if (!child.isMesh) return;
      if (child.name.toLowerCase().endsWith(NIGHT_OVERLAY_SUFFIX)) return; // handled via its day mesh below

      const name = child.name.toLowerCase();
      const target = SHOWCASE_TARGETS.find((t) => t.match.some((m) => name.includes(m)));
      if (!target) return;

      const nightMesh =
        child.parent?.children.find(
          (sibling) => sibling.name === `${child.name}${NIGHT_OVERLAY_SUFFIX}`,
        ) ?? null;

      const derivedColor =
        getAverageTextureColor(child.material.map) ??
        (child.material.color ? child.material.color.clone() : null);
      const textureEdgeColor = derivedColor ? derivedColor.clone() : FALLBACK_EDGE_COLOR.clone();
      const textureParticleColor = derivedColor
        ? derivedColor.clone().offsetHSL(0, 0, 0.15)
        : FALLBACK_PARTICLE_COLOR.clone();

      registry.set(target.id, {
        dayMesh: child,
        nightMesh,
        originalDayMaterial: child.material,
        originalNightMaterial: nightMesh ? nightMesh.material : null,
        textureEdgeColor,
        textureParticleColor,
        matchIndex,
      });
      matchIndex += 1;
    });

    registryRef.current = registry;

    return () => {
      liveRef.current.forEach(({ effect }, id) => {
        const entry = registry.get(id);
        effect.dispose();
        if (entry) entry.dayMesh.remove(effect.points);
      });
      liveRef.current.clear();
      registryRef.current = new Map();
    };
  }, [scene]);

  // ── Start/stop effects to match `activeId`. 
  useEffect(() => {
    const registry = registryRef.current;
    const live = liveRef.current;

    const wantedIds = activeId ? new Set([activeId]) : new Set();
    const particleCountChanged =
      lastParticleCountRef.current !== null &&
      lastParticleCountRef.current !== particleCount;
    lastParticleCountRef.current = particleCount;

    const stopEffect = (id) => {
      const liveEntry = live.get(id);
      const entry = registry.get(id);
      if (!liveEntry) return;
      if (entry) {
        entry.dayMesh.remove(liveEntry.effect.points);
        entry.dayMesh.material.dispose();
        entry.dayMesh.material = entry.originalDayMaterial;
        if (entry.nightMesh && entry.originalNightMaterial) {
          entry.nightMesh.material.dispose();
          entry.nightMesh.material = entry.originalNightMaterial;
        }
      }
      liveEntry.effect.dispose();
      live.delete(id);
    };

    live.forEach((_, id) => {
      if (!wantedIds.has(id) || particleCountChanged) stopEffect(id);
    });

    wantedIds.forEach((id) => {
      if (live.has(id)) return;
      const entry = registry.get(id);
      if (!entry) return;

      const edge = useTextureColor ? entry.textureEdgeColor : new THREE.Color(edgeColor);
      const particle = useTextureColor ? entry.textureParticleColor : new THREE.Color(particleColor);

      entry.dayMesh.material = entry.originalDayMaterial.clone();
      const effect = createDissolveEffect(entry.dayMesh, {
        cycleDuration,
        phase: entry.matchIndex * phaseStep,
        edgeWidth,
        frequency,
        amplitude,
        particleCount,
        particleSize,
        particleSpeed,
        edgeColor: edge,
        particleColor: particle,
      });
      entry.dayMesh.add(effect.points);

      let nightUniforms = null;
      if (entry.nightMesh && entry.originalNightMaterial) {
        entry.nightMesh.material = entry.originalNightMaterial.clone();
        nightUniforms = patchDissolveMaterial(entry.nightMesh.material, {
          color: edge,
          edgeWidth,
          frequency,
          amplitude,
          progress: -1.2,
        });
      }

      live.set(id, { effect, nightUniforms });
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeId, particleCount]);

  useEffect(() => {
    const registry = registryRef.current;
    liveRef.current.forEach(({ effect, nightUniforms }, id) => {
      const entry = registry.get(id);
      if (!entry) return;
      const edge = useTextureColor ? entry.textureEdgeColor : new THREE.Color(edgeColor);
      const particle = useTextureColor ? entry.textureParticleColor : new THREE.Color(particleColor);

      effect.setParams({
        cycleDuration,
        phase: entry.matchIndex * phaseStep,
        edgeWidth,
        frequency,
        amplitude,
        particleSize,
        particleSpeed,
        edgeColor: edge,
        particleColor: particle,
      });

      if (nightUniforms) {
        nightUniforms.uEdge.value = edgeWidth;
        nightUniforms.uFreq.value = frequency;
        nightUniforms.uAmp.value = amplitude;
        nightUniforms.uEdgeColor.value.copy(edge);
      }
    });
  }, [
    cycleDuration,
    phaseStep,
    edgeWidth,
    frequency,
    amplitude,
    particleSize,
    particleSpeed,
    useTextureColor,
    edgeColor,
    particleColor,
  ]);

  useFrame((state) => {
    liveRef.current.forEach(({ effect, nightUniforms }) => {
      effect.update(state.clock.elapsedTime);
   
   
      if (nightUniforms) {
        nightUniforms.uProgress.value = effect.uniforms.uProgress.value;
      }
    });
  });

  return null;
}

useGLTF.preload("/models/room.glb");
