'use client';

import { useLayoutEffect, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

/**
 * Shared low-poly building blocks for the stage dioramas.
 *
 * Everything here is procedural — no GLTF, no textures, no external assets.
 * That keeps the bundle small, the repo self-contained, and sidesteps model
 * licensing entirely. Geometries are memoised per component and materials are
 * flat MeshStandardMaterial so the whole scene reads as one illustration.
 *
 * Enhanced to include more human-like workers with arms and hands, factory
 * structures, wicker baskets, and background trees — inspired by isometric
 * tea-processing infographic illustrations.
 */

export const PALETTE = {
  platform: '#e6ead8',
  platformDark: '#2a3a2c',
  soil: '#6b4f35',
  leaf: '#4e7c3f',
  leafLight: '#6fa04e',
  leafDark: '#3b6130',
  witheredLeaf: '#93a552',
  oxidised: '#9a6b32',
  driedTea: '#4a3524',
  metal: '#b8bec4',
  metalDark: '#8b9299',
  wood: '#a9793f',
  skin: '#d9a978',
  apron: '#5d8a4a',
  hat: '#d8c48a',
  porcelain: '#faf8f2',
  liquor: '#c6862f',
  paperbag: '#cbb287',
  roof: '#b05a3a',
  concrete: '#d4cfc4',
  wicker: '#c49a5e',
} as const;

/**
 * A stylised worker: wide-brim hat, head, torso with arms, legs.
 * More human-like than before — arms extend from the torso, with
 * optional basket on back and forward-leaning "working" posture.
 */
export function Worker({
  position = [0, 0, 0],
  rotation = [0, 0, 0],
  scale = 1,
  hat = true,
  leaning = false,
  carryingBasket = false,
}: {
  position?: [number, number, number];
  rotation?: [number, number, number];
  scale?: number;
  hat?: boolean;
  leaning?: boolean;
  carryingBasket?: boolean;
}) {
  const leanAngle = leaning ? 0.25 : 0;
  return (
    <group position={position} rotation={rotation} scale={scale}>
      <group rotation={[leanAngle, 0, 0]}>
        {/* legs */}
        <mesh position={[-0.09, 0.2, 0]} castShadow>
          <capsuleGeometry args={[0.065, 0.28, 3, 6]} />
          <meshStandardMaterial color="#4d6b3f" roughness={0.85} />
        </mesh>
        <mesh position={[0.09, 0.2, 0]} castShadow>
          <capsuleGeometry args={[0.065, 0.28, 3, 6]} />
          <meshStandardMaterial color="#4d6b3f" roughness={0.85} />
        </mesh>
        {/* torso */}
        <mesh position={[0, 0.62, 0]} castShadow>
          <capsuleGeometry args={[0.16, 0.34, 4, 8]} />
          <meshStandardMaterial color={PALETTE.apron} roughness={0.8} />
        </mesh>
        {/* left arm */}
        <mesh position={[-0.24, 0.62, 0.05]} rotation={[0.3, 0, 0.2]} castShadow>
          <capsuleGeometry args={[0.048, 0.26, 3, 6]} />
          <meshStandardMaterial color={PALETTE.skin} roughness={0.75} />
        </mesh>
        {/* left hand */}
        <mesh position={[-0.28, 0.44, 0.14]} castShadow>
          <sphereGeometry args={[0.04, 6, 5]} />
          <meshStandardMaterial color={PALETTE.skin} roughness={0.7} />
        </mesh>
        {/* right arm */}
        <mesh position={[0.24, 0.62, 0.05]} rotation={[0.3, 0, -0.2]} castShadow>
          <capsuleGeometry args={[0.048, 0.26, 3, 6]} />
          <meshStandardMaterial color={PALETTE.skin} roughness={0.75} />
        </mesh>
        {/* right hand */}
        <mesh position={[0.28, 0.44, 0.14]} castShadow>
          <sphereGeometry args={[0.04, 6, 5]} />
          <meshStandardMaterial color={PALETTE.skin} roughness={0.7} />
        </mesh>
        {/* head */}
        <mesh position={[0, 0.95, 0]} castShadow>
          <sphereGeometry args={[0.115, 12, 10]} />
          <meshStandardMaterial color={PALETTE.skin} roughness={0.7} />
        </mesh>
        {hat && (
          <group position={[0, 1.04, 0]}>
            {/* wide brim */}
            <mesh castShadow>
              <cylinderGeometry args={[0.26, 0.28, 0.03, 14]} />
              <meshStandardMaterial color={PALETTE.hat} roughness={0.9} />
            </mesh>
            {/* crown */}
            <mesh position={[0, 0.08, 0]} castShadow>
              <coneGeometry args={[0.14, 0.14, 12]} />
              <meshStandardMaterial color={PALETTE.hat} roughness={0.9} />
            </mesh>
          </group>
        )}
        {carryingBasket && (
          <group position={[0, 0.55, -0.22]}>
            <Basket scale={0.6} />
          </group>
        )}
      </group>
    </group>
  );
}

/** Wicker basket — truncated cone with a wood/wicker colour. */
export function Basket({
  position = [0, 0, 0],
  scale = 1,
}: {
  position?: [number, number, number];
  scale?: number;
}) {
  return (
    <group position={position} scale={scale}>
      <mesh position={[0, 0.26, 0]} castShadow receiveShadow>
        <cylinderGeometry args={[0.42, 0.3, 0.52, 14, 1, true]} />
        <meshStandardMaterial color={PALETTE.wicker} roughness={0.9} side={THREE.DoubleSide} />
      </mesh>
      <mesh position={[0, 0.02, 0]} receiveShadow>
        <cylinderGeometry args={[0.3, 0.3, 0.04, 14]} />
        <meshStandardMaterial color={PALETTE.wicker} roughness={0.9} />
      </mesh>
      {/* wicker band detail */}
      <mesh position={[0, 0.35, 0]} castShadow>
        <cylinderGeometry args={[0.425, 0.4, 0.04, 14, 1, true]} />
        <meshStandardMaterial color="#a07840" roughness={0.95} side={THREE.DoubleSide} />
      </mesh>
    </group>
  );
}

/** Simple factory building — box with a pitched corrugated roof. */
export function FactoryWall({
  position = [0, 0, 0],
  size = [2, 1.2, 1.5],
  wallColor = PALETTE.concrete,
  roofColor = PALETTE.roof,
}: {
  position?: [number, number, number];
  size?: [number, number, number];
  wallColor?: string;
  roofColor?: string;
}) {
  const [w, h, d] = size;
  return (
    <group position={position}>
      {/* walls */}
      <mesh position={[0, h / 2, 0]} castShadow receiveShadow>
        <boxGeometry args={[w, h, d]} />
        <meshStandardMaterial color={wallColor} roughness={0.8} />
      </mesh>
      {/* roof — simple prism using a wider flat box */}
      <mesh position={[0, h + 0.08, 0]} castShadow>
        <boxGeometry args={[w + 0.15, 0.08, d + 0.2]} />
        <meshStandardMaterial color={roofColor} roughness={0.7} metalness={0.1} />
      </mesh>
      {/* roof ridge */}
      <mesh position={[0, h + 0.18, 0]} castShadow>
        <boxGeometry args={[w * 0.3, 0.06, d + 0.2]} />
        <meshStandardMaterial color={roofColor} roughness={0.7} metalness={0.1} />
      </mesh>
      {/* door */}
      <mesh position={[0, 0.35, d / 2 + 0.01]}>
        <boxGeometry args={[0.5, 0.7, 0.02]} />
        <meshStandardMaterial color="#33291f" roughness={0.9} />
      </mesh>
      {/* window */}
      <mesh position={[w * 0.3, h * 0.6, d / 2 + 0.01]}>
        <boxGeometry args={[0.35, 0.25, 0.02]} />
        <meshStandardMaterial color="#a8c4d0" roughness={0.3} metalness={0.1} />
      </mesh>
    </group>
  );
}

/** Cluster of background trees — for the plantation scene. */
export function TreeCluster({
  position = [0, 0, 0],
  count = 3,
  seed = 1,
}: {
  position?: [number, number, number];
  count?: number;
  seed?: number;
}) {
  let s = seed * 7919;
  const rand = () => {
    s = (s * 9301 + 49297) % 233280;
    return s / 233280;
  };

  const trees = Array.from({ length: count }, () => ({
    x: (rand() - 0.5) * 2,
    z: (rand() - 0.5) * 1.5,
    h: 0.8 + rand() * 0.6,
    r: 0.3 + rand() * 0.2,
    green: rand() > 0.5 ? PALETTE.leafDark : PALETTE.leaf,
  }));

  return (
    <group position={position}>
      {trees.map((t, i) => (
        <group key={i} position={[t.x, 0, t.z]}>
          {/* trunk */}
          <mesh position={[0, t.h * 0.4, 0]} castShadow>
            <cylinderGeometry args={[0.04, 0.06, t.h * 0.8, 6]} />
            <meshStandardMaterial color="#6b4f35" roughness={0.9} />
          </mesh>
          {/* canopy */}
          <mesh position={[0, t.h * 0.75, 0]} castShadow>
            <icosahedronGeometry args={[t.r, 1]} />
            <meshStandardMaterial color={t.green} roughness={0.9} flatShading />
          </mesh>
          <mesh position={[t.r * 0.4, t.h * 0.65, t.r * 0.3]} castShadow>
            <icosahedronGeometry args={[t.r * 0.65, 1]} />
            <meshStandardMaterial color={PALETTE.leafLight} roughness={0.9} flatShading />
          </mesh>
        </group>
      ))}
    </group>
  );
}

/** Small shed / shelter structure. */
export function Shed({
  position = [0, 0, 0],
  scale = 1,
}: {
  position?: [number, number, number];
  scale?: number;
}) {
  return (
    <group position={position} scale={scale}>
      {/* walls */}
      <mesh position={[0, 0.35, 0]} castShadow receiveShadow>
        <boxGeometry args={[0.8, 0.7, 0.65]} />
        <meshStandardMaterial color={PALETTE.wood} roughness={0.85} />
      </mesh>
      {/* roof */}
      <mesh position={[0, 0.76, 0]} castShadow>
        <boxGeometry args={[0.95, 0.06, 0.8]} />
        <meshStandardMaterial color={PALETTE.roof} roughness={0.7} />
      </mesh>
    </group>
  );
}

/** Sign post with a label — vertical pole + board. */
export function SignPost({
  position = [0, 0, 0],
  color = PALETTE.hat,
}: {
  position?: [number, number, number];
  color?: string;
}) {
  return (
    <group position={position}>
      {/* pole */}
      <mesh position={[0, 0.65, 0]} castShadow>
        <cylinderGeometry args={[0.025, 0.025, 1.3, 6]} />
        <meshStandardMaterial color={PALETTE.metalDark} roughness={0.5} metalness={0.4} />
      </mesh>
      {/* sign board */}
      <mesh position={[0, 1.2, 0]} castShadow>
        <boxGeometry args={[0.5, 0.2, 0.03]} />
        <meshStandardMaterial color={color} roughness={0.8} />
      </mesh>
    </group>
  );
}

/** Four-legged table used by sorting, withering, fermenting and grading. */
export function Table({
  position = [0, 0, 0],
  size = [3, 1.6],
  height = 0.62,
  top = PALETTE.metal,
}: {
  position?: [number, number, number];
  size?: [number, number];
  height?: number;
  top?: string;
}) {
  const [w, d] = size;
  const legs: [number, number][] = [
    [w / 2 - 0.1, d / 2 - 0.1],
    [-w / 2 + 0.1, d / 2 - 0.1],
    [w / 2 - 0.1, -d / 2 + 0.1],
    [-w / 2 + 0.1, -d / 2 + 0.1],
  ];
  return (
    <group position={position}>
      <mesh position={[0, height, 0]} castShadow receiveShadow>
        <boxGeometry args={[w, 0.08, d]} />
        <meshStandardMaterial color={top} roughness={0.45} metalness={0.25} />
      </mesh>
      {legs.map(([x, z], i) => (
        <mesh key={i} position={[x, height / 2, z]} castShadow>
          <cylinderGeometry args={[0.035, 0.035, height, 6]} />
          <meshStandardMaterial color={PALETTE.metalDark} roughness={0.5} metalness={0.35} />
        </mesh>
      ))}
    </group>
  );
}

/**
 * A bed of leaf material. Rendered as one InstancedMesh so a dense-looking
 * spread of a few hundred leaves costs a single draw call.
 */
export function LeafBed({
  position = [0, 0, 0],
  size = [2.6, 1.2],
  count = 90,
  color = PALETTE.leaf,
  scatter = 0.05,
  seed = 1,
}: {
  position?: [number, number, number];
  size?: [number, number];
  count?: number;
  color?: string;
  scatter?: number;
  seed?: number;
}) {
  const ref = useRef<THREE.InstancedMesh>(null);
  const [w, d] = size;

  // Written after mount so `ref.current` exists; deterministic PRNG keeps the
  // scatter stable across re-renders and between server and client.
  useLayoutEffect(() => {
    let s = seed * 9301;
    const rand = () => {
      s = (s * 9301 + 49297) % 233280;
      return s / 233280;
    };
    const dummy = new THREE.Object3D();
    const mesh = ref.current;
    if (!mesh) return;
    for (let i = 0; i < count; i++) {
      dummy.position.set((rand() - 0.5) * w, rand() * scatter, (rand() - 0.5) * d);
      dummy.rotation.set(rand() * 0.8, rand() * Math.PI * 2, rand() * 0.8);
      const sc = 0.55 + rand() * 0.6;
      dummy.scale.set(sc, sc * 0.4, sc);
      dummy.updateMatrix();
      mesh.setMatrixAt(i, dummy.matrix);
    }
    mesh.instanceMatrix.needsUpdate = true;
  }, [count, w, d, scatter, seed]);

  return (
    <instancedMesh ref={ref} args={[undefined, undefined, count]} position={position} castShadow receiveShadow>
      <icosahedronGeometry args={[0.11, 0]} />
      <meshStandardMaterial color={color} roughness={0.85} flatShading />
    </instancedMesh>
  );
}

/** A rounded tea bush — an irregular icosahedron cluster on a soil pad. */
export function TeaBush({
  position = [0, 0, 0],
  scale = 1,
  color = PALETTE.leaf,
  sway = 0,
}: {
  position?: [number, number, number];
  scale?: number;
  color?: string;
  sway?: number;
}) {
  const ref = useRef<THREE.Group>(null);
  useFrame(({ clock }) => {
    if (!ref.current || sway === 0) return;
    ref.current.rotation.z = Math.sin(clock.elapsedTime * 0.6 + sway) * 0.025;
  });
  return (
    <group ref={ref} position={position} scale={scale}>
      <mesh position={[0, 0.34, 0]} castShadow receiveShadow>
        <icosahedronGeometry args={[0.46, 1]} />
        <meshStandardMaterial color={color} roughness={0.9} flatShading />
      </mesh>
      <mesh position={[0.3, 0.24, 0.16]} castShadow>
        <icosahedronGeometry args={[0.3, 1]} />
        <meshStandardMaterial color={PALETTE.leafLight} roughness={0.9} flatShading />
      </mesh>
      <mesh position={[-0.28, 0.22, -0.14]} castShadow>
        <icosahedronGeometry args={[0.26, 1]} />
        <meshStandardMaterial color={PALETTE.leafDark} roughness={0.9} flatShading />
      </mesh>
    </group>
  );
}

/** Shallow round tray used for fermentation stacks. */
export function RoundTray({
  position = [0, 0, 0],
  radius = 0.42,
  color = PALETTE.wood,
  fill,
}: {
  position?: [number, number, number];
  radius?: number;
  color?: string;
  fill?: string;
}) {
  return (
    <group position={position}>
      <mesh castShadow receiveShadow>
        <cylinderGeometry args={[radius, radius, 0.12, 16, 1, true]} />
        <meshStandardMaterial color={color} roughness={0.85} side={THREE.DoubleSide} />
      </mesh>
      <mesh position={[0, -0.055, 0]} receiveShadow>
        <cylinderGeometry args={[radius, radius, 0.02, 16]} />
        <meshStandardMaterial color={color} roughness={0.85} />
      </mesh>
      {fill && (
        <mesh position={[0, 0.02, 0]}>
          <cylinderGeometry args={[radius * 0.92, radius * 0.92, 0.06, 16]} />
          <meshStandardMaterial color={fill} roughness={0.9} flatShading />
        </mesh>
      )}
    </group>
  );
}

/** Rotating fan — used for withering airflow and dryer intake. */
export function Fan({
  position = [0, 0, 0],
  rotation = [0, 0, 0],
  radius = 0.34,
  speed = 3,
}: {
  position?: [number, number, number];
  rotation?: [number, number, number];
  radius?: number;
  speed?: number;
}) {
  const blades = useRef<THREE.Group>(null);
  useFrame((_, dt) => {
    if (blades.current) blades.current.rotation.z += dt * speed;
  });
  return (
    <group position={position} rotation={rotation}>
      <mesh castShadow>
        <cylinderGeometry args={[radius + 0.06, radius + 0.06, 0.1, 16, 1, true]} />
        <meshStandardMaterial color={PALETTE.metalDark} roughness={0.4} metalness={0.5} side={THREE.DoubleSide} />
      </mesh>
      <group ref={blades}>
        {[0, 1, 2, 3].map((i) => (
          <mesh key={i} rotation={[Math.PI / 2, 0, (i * Math.PI) / 2]} position={[0, 0, 0]}>
            <boxGeometry args={[radius * 0.9, 0.02, 0.14]} />
            <meshStandardMaterial color={PALETTE.metal} roughness={0.35} metalness={0.6} />
          </mesh>
        ))}
      </group>
    </group>
  );
}

/** Rising steam/heat wisps. Cheap: three translucent spheres on a sine loop. */
export function Steam({
  position = [0, 0, 0],
  color = '#ffffff',
  count = 3,
  spread = 0.18,
}: {
  position?: [number, number, number];
  color?: string;
  count?: number;
  spread?: number;
}) {
  const group = useRef<THREE.Group>(null);
  useFrame(({ clock }) => {
    if (!group.current) return;
    const t = clock.elapsedTime;
    group.current.children.forEach((child, i) => {
      const phase = (t * 0.45 + i / count) % 1;
      child.position.y = phase * 0.75;
      child.position.x = Math.sin(phase * 5 + i) * spread * phase;
      const s = 0.06 + phase * 0.13;
      child.scale.setScalar(s);
      const mat = (child as THREE.Mesh).material as THREE.MeshStandardMaterial;
      mat.opacity = Math.max(0, 0.42 * (1 - phase));
    });
  });
  return (
    <group ref={group} position={position}>
      {Array.from({ length: count }, (_, i) => (
        <mesh key={i}>
          <sphereGeometry args={[1, 8, 6]} />
          <meshStandardMaterial color={color} transparent opacity={0.3} depthWrite={false} roughness={1} />
        </mesh>
      ))}
    </group>
  );
}
