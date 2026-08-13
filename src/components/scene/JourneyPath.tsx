'use client';

import { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { STAGES } from '@/lib/data/stages';

/**
 * The ribbon connecting the ten stages, plus a travelling marker that
 * represents a single batch moving through the pipeline.
 *
 * The ribbon sits at y=-0.10 — below the top of each platform but above the
 * ground plane — so it is hidden beneath the pads and visible only in the gaps
 * between them, exactly as in the reference illustration.
 */
export function JourneyPath() {
  const marker = useRef<THREE.Mesh>(null);
  const glow = useRef<THREE.Mesh>(null);

  const curve = useMemo(
    () =>
      new THREE.CatmullRomCurve3(
        STAGES.map((s) => new THREE.Vector3(s.position[0], -0.14, s.position[2])),
        false,
        'catmullrom',
        0.35,
      ),
    [],
  );

  const geometry = useMemo(() => {
    const g = new THREE.TubeGeometry(curve, 320, 0.5, 10, false);
    // Flatten into a ribbon that lies on the ground: half-height 0.055 puts its
    // top at y=-0.085, just under each platform's underside (-0.11), so the
    // path vanishes beneath the pads and shows only in the gaps between them.
    g.scale(1, 0.11, 1);
    return g;
  }, [curve]);

  // Colour the ribbon along its length so it carries the same green→amber
  // gradient as the stages it links.
  const gradient = useMemo(() => {
    const from = new THREE.Color(STAGES[0].color);
    const to = new THREE.Color(STAGES[STAGES.length - 1].color);
    const pos = geometry.attributes.position;
    const colors = new Float32Array(pos.count * 3);
    const c = new THREE.Color();
    // Tube vertices are generated ring by ring along the curve.
    const rings = 321;
    const perRing = pos.count / rings;
    for (let i = 0; i < pos.count; i++) {
      c.copy(from).lerp(to, Math.min(1, Math.floor(i / perRing) / rings));
      colors.set([c.r, c.g, c.b], i * 3);
    }
    return new THREE.BufferAttribute(colors, 3);
  }, [geometry]);

  useMemo(() => {
    geometry.setAttribute('color', gradient);
  }, [geometry, gradient]);

  useFrame(({ clock }) => {
    // ~34s for one full traverse: present, but never distracting.
    const t = (clock.elapsedTime * 0.03) % 1;
    const p = curve.getPointAt(t);
    if (marker.current) marker.current.position.set(p.x, p.y + 0.14, p.z);
    if (glow.current) {
      glow.current.position.set(p.x, p.y + 0.14, p.z);
      const pulse = 1 + Math.sin(clock.elapsedTime * 2.4) * 0.14;
      glow.current.scale.setScalar(pulse);
    }
  });

  return (
    <group>
      <mesh geometry={geometry} receiveShadow>
        <meshStandardMaterial vertexColors roughness={0.72} metalness={0.04} />
      </mesh>

      {/* Batch marker */}
      <mesh ref={glow}>
        <sphereGeometry args={[0.3, 12, 10]} />
        <meshBasicMaterial color="#ffd88f" transparent opacity={0.22} depthWrite={false} />
      </mesh>
      <mesh ref={marker}>
        <sphereGeometry args={[0.13, 14, 12]} />
        <meshStandardMaterial color="#fff2d4" emissive="#ffc766" emissiveIntensity={1.5} roughness={0.3} />
      </mesh>
    </group>
  );
}
