import { useGLTF } from "@react-three/drei";
import { useEffect, useRef } from "react";
import { useThree } from "@react-three/fiber";
import * as THREE from "three";
import gsap from "gsap";
import { registerCursorTarget, setHover, clearHover } from "../../helper/cursorManager";

const NIGHT_OVERLAY_SUFFIX = "_night_overlay";

const HOVER_TARGET_NAMES = [
  "letter_1",
  "letter_2",
  "letter_3",
  "letter_4",
  "letter_5",
  "letter_6",
  "letter_7",
  "letter_8",
  "letter_9",
  "letter_10",
  "box1",
  "box2",
  "box3",
  "Football",
  "flower1",
  "flower2",
  "flower3",
];

function matchesHoverTarget(meshName) {
  const name = meshName.toLowerCase();
  return HOVER_TARGET_NAMES.some((target) => {

    const pattern = new RegExp(`(^|[^a-z0-9])${target}([^a-z0-9]|$)`, "i");
    return pattern.test(name);
  });
}

const HOVER_SCALE = 1.1;
const SCALE_DURATION = 0.3;

const REST_SCALE = new THREE.Vector3(1, 1, 1);


export function InteractiveHoverMeshes() {
  const { scene } = useGLTF("/models/room.glb");
  const { camera, controls, gl } = useThree();

  const meshEntriesRef = useRef([]);
  const hoveredEntryRef = useRef(null);

  // ── Collect matching meshes ────────────────────────────────
  useEffect(() => {
    if (!scene) return;

    const entries = [];

    scene.traverse((child) => {
      if (!child.isMesh) return;
      if (child.name.endsWith(NIGHT_OVERLAY_SUFFIX)) return; 

      if (!matchesHoverTarget(child.name)) return;

      const nightMesh = child.parent?.children.find(
        (sibling) => sibling.name === child.name + NIGHT_OVERLAY_SUFFIX,
      ) ?? null;

      entries.push({
        mesh: child,
        nightMesh,
        baseScale: REST_SCALE,
        nightBaseScale: nightMesh ? REST_SCALE : null,
      });
    });

    meshEntriesRef.current = entries;

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

  // ── Hover-only  ─────────────────────────
  useEffect(() => {
    if (!gl || !camera) return;
    registerCursorTarget(gl.domElement);

    const raycaster = new THREE.Raycaster();
    const pointer = new THREE.Vector2();

    // Scales the mesh AND its night-overlay sibling (if any) together.
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

      const meshes = meshEntriesRef.current.map((e) => e.mesh);
      const intersects = meshes.length
        ? raycaster.intersectObjects(meshes, false)
        : [];

      const hitMesh = intersects[0]?.object ?? null;
      const hitEntry = hitMesh
        ? meshEntriesRef.current.find((e) => e.mesh === hitMesh)
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
      setHover("interactiveDecor", Boolean(hitEntry));
    };

    // Make sure we don't get stuck hovered/pointer when the cursor

    const handlePointerLeave = () => {
      if (hoveredEntryRef.current) {
        scaleEntry(hoveredEntryRef.current, false);
      }
      hoveredEntryRef.current = null;
      setHover("interactiveDecor", false);
    };

    gl.domElement.addEventListener("pointermove", handlePointerMove);
    gl.domElement.addEventListener("pointerleave", handlePointerLeave);

    return () => {
      clearHover("interactiveDecor");
      gl.domElement.removeEventListener("pointermove", handlePointerMove);
      gl.domElement.removeEventListener("pointerleave", handlePointerLeave);
    };
  }, [gl, camera, controls]);

  return null;
}

useGLTF.preload("/models/room.glb");
