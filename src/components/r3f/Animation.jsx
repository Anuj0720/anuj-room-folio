import { useEffect } from "react";
import { useThree } from "@react-three/fiber";
import gsap from "gsap";

export default function Animation() {
  const { scene } = useThree();

  useEffect(() => {
    let mounted = true;
    const timelines = [];

    const findTargets = () => {
      const byNameIncludes = (substrs, skip = []) => {
        const out = [];
        scene.traverse((child) => {
          if (!child.isMesh) return;
          const name = (child.name || "").toLowerCase();
          if (skip.some((s) => name.includes(s))) return;
          for (const s of substrs) if (name.includes(s)) return out.push(child);
        });
        return out;
      };

      // animate1 boxes
      const a1 = byNameIncludes([
        "animate1",
        "animate1_box1",
        "animate1_box2",
        "animate1_box3",
      ]);

      // animate2 groups
      const a2_group1 = byNameIncludes([
        "animate2_1",
        "animate2_2",
        "animate2_3",
        "animate2_4",
      ]);
      const a2_imac = byNameIncludes(["animate2_imac1", "animate2_imac2"]);
      const a2_imac_screens = byNameIncludes(["imac_screen"]);
      const a2_mac = byNameIncludes(["animate2_mac1", "animate2_mac2"]);
      const a2_mac_screens = byNameIncludes(["mac_screen"]);
      const a2_flowers = byNameIncludes([
        "animate2_pot1",
        "animate2_flower1",
        "animate2_flower2",
        "animate2_flower3",
      ]);
      const chariTop = byNameIncludes(["chari_top"]);

      // animate3 numbered 1..10
      const animate3Names = Array.from(
        { length: 10 },
        (_, i) => `animate3_${i + 1}`,
      );
      const a3 = byNameIncludes(animate3Names);

      return {
        a1,
        a2_group1,
        a2_imac,
        a2_imac_screens,
        a2_mac,
        a2_mac_screens,
        a2_flowers,
        chariTop,
        a3,
      };
    };

    const setScaleZero = (list) => {
      list.forEach((m) => m.scale.set(0, 0, 0));
    };

    const getScreenMaterials = (screens) => {
      const materials = [];
      screens.forEach((mesh) => {
        const apply = (mat) => {
          mat.transparent = true;
          mat.opacity = 0;
          materials.push(mat);
        };

        if (Array.isArray(mesh.material)) {
          mesh.material.forEach(apply);
        } else if (mesh.material) {
          apply(mesh.material);
        }
      });

      return [...new Set(materials)];
    };

    const setupAndPlay = () => {
      const {
        a1,
        a2_group1,
        a2_imac,
        a2_imac_screens,
        a2_mac,
        a2_mac_screens,
        a2_flowers,
        chariTop,
        a3,
      } = findTargets();
      const all = [
        ...a1,
        ...a2_group1,
        ...a2_imac,
        ...a2_mac,
        ...a2_flowers,
        ...a3,
      ];
      if (all.length === 0) return false;

      // start all at 0
      setScaleZero(all);

      const imacScreenMaterials = getScreenMaterials(a2_imac_screens);
      const macScreenMaterials = getScreenMaterials(a2_mac_screens);
      const master = gsap.timeline();

      const rotateChariTop = (list) => {
        if (!list || list.length === 0) return null;
        const rotations = list.map((m) => m.rotation);
        return gsap.to(rotations, {
          z: Math.PI / 12,
          duration: 2.5,
          ease: "power1.inOut",
          repeat: -1,
          yoyo: true,
          overwrite: true,
          paused: true,
        });
      };

      const show = (list, opts = {}) => {
        if (!list || list.length === 0) return;
        master.to(
          list.map((m) => m.scale),
          Object.assign(
            {
              x: 1,
              y: 1,
              z: 1,
              duration: 1.2,
              ease: "back.out(1.7)",
              stagger: 0.16,
            },
            opts,
          ),
        );
      };

      // animate1 sequence: box1 -> box2 -> box3
      show(a1, { duration: 0.95, stagger: 0.12 });
      const chariTopLoop = rotateChariTop(chariTop);
      if (chariTopLoop) {
        master.add(() => chariTopLoop.play());
        timelines.push(chariTopLoop);
      }

      // animate2: group1 (1..4) then imacs then imac_screen then mac then mac_screen then flowers
      show(a2_group1, { duration: 1.0, stagger: 0.14 });
      show(a2_imac, { duration: 1.1, stagger: 0.14 });
      if (imacScreenMaterials.length > 0) {
        master.to(imacScreenMaterials, {
          opacity: 1,
          duration: 0.8,
          ease: "power1.out",
        });
      }
      show(a2_mac, { duration: 1.1, stagger: 0.14 });
      if (macScreenMaterials.length > 0) {
        master.to(macScreenMaterials, {
          opacity: 1,
          duration: 0.8,
          ease: "power1.out",
        });
      }
      show(a2_flowers, { duration: 1.1, stagger: 0.12 });

      // animate3: many items in sequence
      show(a3, { duration: 1.1, stagger: 0.1 });

      timelines.push(master);
      return true;
    };

    // Try immediate setup (in case model already in scene)
    if (!setupAndPlay()) {
      // Poll until model is added to the scene (or component unmounts)
      const interval = setInterval(() => {
        if (!mounted) return;
        if (setupAndPlay()) clearInterval(interval);
      }, 100);

      return () => {
        mounted = false;
        clearInterval(interval);
        timelines.forEach((t) => t.kill());
      };
    }

    return () => {
      mounted = false;
      timelines.forEach((t) => t.kill());
    };
  }, [scene]);

  return null;
}
