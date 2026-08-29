import { useGLTF } from "@react-three/drei";
import { useEffect, useRef } from "react";
import { useThree } from "@react-three/fiber";
import * as THREE from "three";
import gsap from "gsap";
import { personalInfo } from "../../helper/data";
import { registerCursorTarget, setHover, clearHover } from "../../helper/cursorManager";


function findSocialForMeshName(meshName) {
  const name = meshName.toLowerCase();
  return personalInfo.socials.find((social) => name.includes(social.name));
}


const NIGHT_OVERLAY_SUFFIX = "_night_overlay";

const HOVER_SCALE = 1.1;
const SCALE_DURATION = 0.3;

export function Socials() {
  const { scene } = useGLTF("/models/room.glb");
  const { camera, controls, gl } = useThree();

  // Each entry: { mesh, nightMesh (or null), social, baseScale, nightBaseScale }
  const socialMeshesRef = useRef([]);
  const hoveredEntryRef = useRef(null);


  useEffect(() => {
    if (!scene) return;

    const entries = [];

    scene.traverse((child) => {
      if (!child.isMesh) return;
      if (child.name.endsWith(NIGHT_OVERLAY_SUFFIX)) return; // skip clones

      const social = findSocialForMeshName(child.name);
      if (!social) return;

      const nightMesh = child.parent?.children.find(
        (sibling) => sibling.name === child.name + NIGHT_OVERLAY_SUFFIX,
      ) ?? null;

      entries.push({
        mesh: child,
        nightMesh,
        social,
        baseScale: child.scale.clone(),
        nightBaseScale: nightMesh ? nightMesh.scale.clone() : null,
      });
    });

    socialMeshesRef.current = entries;

    return () => {
      // Reset any in-flight tweens/scale on unmount
      entries.forEach(({ mesh, nightMesh, baseScale, nightBaseScale }) => {
        gsap.killTweensOf(mesh.scale);
        mesh.scale.copy(baseScale);
        if (nightMesh && nightBaseScale) {
          gsap.killTweensOf(nightMesh.scale);
          nightMesh.scale.copy(nightBaseScale);
        }
      });
    };
  }, [scene]);

  // ── Hover + click handling ─────────────────────────────────
  useEffect(() => {
    if (!gl || !camera) return;
    registerCursorTarget(gl.domElement);

    const raycaster = new THREE.Raycaster();
    const pointer = new THREE.Vector2();

    // Scales the day mesh AND its night-overlay sibling (if any) together,
    const scaleEntry = (entry, hovered) => {
      const targetScale = hovered ? HOVER_SCALE : 1;

      gsap.to(entry.mesh.scale, {
        x: entry.baseScale.x * targetScale,
        y: entry.baseScale.y * targetScale,
        z: entry.baseScale.z * targetScale,
        duration: SCALE_DURATION,
        ease: "power2.out",
        overwrite: true,
      });

      if (entry.nightMesh && entry.nightBaseScale) {
        gsap.to(entry.nightMesh.scale, {
          x: entry.nightBaseScale.x * targetScale,
          y: entry.nightBaseScale.y * targetScale,
          z: entry.nightBaseScale.z * targetScale,
          duration: SCALE_DURATION,
          ease: "power2.out",
          overwrite: true,
        });
      }
    };

    const handlePointerMove = (event) => {
      const rect = gl.domElement.getBoundingClientRect();
      pointer.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
      pointer.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
      raycaster.setFromCamera(pointer, camera);

      const meshes = socialMeshesRef.current.map((e) => e.mesh);
      const intersects = meshes.length
        ? raycaster.intersectObjects(meshes, false)
        : [];

      const hitMesh = intersects[0]?.object ?? null;
      const hitEntry = hitMesh
        ? socialMeshesRef.current.find((e) => e.mesh === hitMesh)
        : null;

      const previousEntry = hoveredEntryRef.current;

      if (previousEntry === hitEntry) return; // no change

      // Unhover previous
      if (previousEntry) {
        scaleEntry(previousEntry, false);
      }

      // Hover new
      if (hitEntry) {
        scaleEntry(hitEntry, true);
      }

      hoveredEntryRef.current = hitEntry;
      setHover("socials", Boolean(hitEntry));
    };

    const handleClick = () => {
      const entry = hoveredEntryRef.current;
      if (!entry) return;
      window.open(entry.social.link, "_blank", "noopener,noreferrer");
    };

    gl.domElement.addEventListener("pointermove", handlePointerMove);
    gl.domElement.addEventListener("click", handleClick);

    return () => {
      clearHover("socials");
      gl.domElement.removeEventListener("pointermove", handlePointerMove);
      gl.domElement.removeEventListener("click", handleClick);
    };
  }, [gl, camera, controls]);

  return null;
}

useGLTF.preload("/models/room.glb");
