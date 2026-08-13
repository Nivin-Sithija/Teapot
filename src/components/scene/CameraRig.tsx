'use client';

import { useEffect, useRef } from 'react';
import { OrbitControls } from '@react-three/drei';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import type { OrbitControls as OrbitControlsImpl } from 'three-stdlib';
import { useAtlas } from '@/lib/store';
import { getStage } from '@/lib/data/stages';

// Pulled back from the raw (13, 27, 20) framing — same distance from the
// origin, but a flatter angle (less top-down) and enough clearance for the
// top of the pipeline to sit below the masthead by default.
const OVERVIEW_POS = new THREE.Vector3(21, 30, 32);
const OVERVIEW_TARGET = new THREE.Vector3(0, 0, 0);
/**
 * Offset from a stage centre when flying in to inspect it.
 * Shifted left (negative x) so the focused stage stays in the visible left half
 * when the 50vw drawer occupies the right side of the screen.
 */
const DETAIL_OFFSET = new THREE.Vector3(4, 10, 11);


/**
 * Camera controller.
 *
 * Damped lerp toward a desired position/target derived from the current
 * selection. Manual orbiting hands control back to the user until the next
 * selection change, so the rig never fights the mouse.
 */
export function CameraRig({ compact }: { compact: boolean }) {
  const controls = useRef<OrbitControlsImpl>(null);
  const { camera } = useThree();

  const selected = useAtlas((s) => s.selected);
  const orbiting = useAtlas((s) => s.orbiting);
  const setOrbiting = useAtlas((s) => s.setOrbiting);

  const desiredPos = useRef(new THREE.Vector3());
  const desiredTarget = useRef(new THREE.Vector3());
  /** Cleared on user orbit, set on selection change. */
  const animating = useRef(true);

  // Recompute the goal whenever the selection (or viewport size class) changes.
  useEffect(() => {
    const stage = selected ? getStage(selected) : null;
    // Pull the camera back on narrow viewports so the drawer doesn't cover the subject.
    const zoom = compact ? 1.35 : 1;

    if (stage) {
      const centre = new THREE.Vector3(...stage.position);
      desiredTarget.current.copy(centre);
      desiredPos.current.copy(centre).add(DETAIL_OFFSET.clone().multiplyScalar(zoom));
    } else {
      desiredTarget.current.copy(OVERVIEW_TARGET);
      desiredPos.current.copy(OVERVIEW_POS).multiplyScalar(zoom);
    }
    animating.current = true;
    setOrbiting(false);
  }, [selected, compact, setOrbiting]);

  useFrame((_, dt) => {
    if (!animating.current || orbiting || !controls.current) return;

    const k = 1 - Math.pow(0.0016, Math.min(dt, 0.1));
    camera.position.lerp(desiredPos.current, k);
    controls.current.target.lerp(desiredTarget.current, k);
    controls.current.update();

    // Settle and stop, so we're not lerping forever at sub-pixel distances.
    if (camera.position.distanceTo(desiredPos.current) < 0.04) {
      camera.position.copy(desiredPos.current);
      controls.current.target.copy(desiredTarget.current);
      controls.current.update();
      animating.current = false;
    }
  });

  return (
    <OrbitControls
      ref={controls}
      makeDefault
      enablePan={false}
      enableDamping
      dampingFactor={0.08}
      minDistance={10}
      maxDistance={70}
      // Keep the camera above the horizon: an isometric-ish illustration read
      // breaks down the moment you can see under the platforms.
      minPolarAngle={0.18}
      maxPolarAngle={Math.PI / 2.8}
      onStart={() => setOrbiting(true)}
      onEnd={() => setOrbiting(false)}
    />
  );
}
