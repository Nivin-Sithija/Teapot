'use client';

import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import {
  Basket,
  FactoryWall,
  Fan,
  LeafBed,
  PALETTE,
  RoundTray,
  Shed,
  SignPost,
  Steam,
  Table,
  TeaBush,
  TreeCluster,
  Worker,
} from './primitives';

/**
 * One diorama per pipeline stage, each sized to sit inside a 4×4 platform.
 *
 * Colour choices track the leaf's real transformation: fresh green through the
 * yellow-green of wither, the copper of oxidation, to dark dried tea and finally
 * amber liquor. Animation is deliberately minimal — one moving element per
 * stage, enough to signal "this is a process" without turning into a screensaver.
 *
 * Enhanced with more human figures (arms, baskets), factory structures,
 * trees, and richer compositions inspired by isometric tea infographics.
 */

// ── 1. Plantation ──────────────────────────────────────────────────────────
function Plantation() {
  return (
    <group>
      {/* soil bed */}
      <mesh position={[0, 0.06, 0]} receiveShadow>
        <boxGeometry args={[3, 0.12, 2.2]} />
        <meshStandardMaterial color={PALETTE.soil} roughness={1} />
      </mesh>
      {/* tea bush rows */}
      <TeaBush position={[-0.95, 0.12, -0.35]} scale={1.05} sway={0.4} />
      <TeaBush position={[0.05, 0.12, 0.25]} scale={1.2} sway={1.3} />
      <TeaBush position={[1.05, 0.12, -0.3]} scale={0.95} sway={2.1} />
      <TeaBush position={[-0.4, 0.12, 0.62]} scale={0.75} color={PALETTE.leafLight} sway={2.8} />
      <TeaBush position={[0.55, 0.12, 0.7]} scale={0.65} color={PALETTE.leafDark} sway={3.2} />
      {/* workers picking tea */}
      <Worker position={[1.15, 0.12, 0.62]} rotation={[0, -0.7, 0]} scale={0.82} leaning carryingBasket />
      <Worker position={[-1.1, 0.12, 0.2]} rotation={[0, 0.4, 0]} scale={0.78} leaning carryingBasket />
      {/* background trees */}
      <TreeCluster position={[-1.3, 0.12, -0.85]} count={2} seed={5} />
      <TreeCluster position={[1.3, 0.12, -0.8]} count={2} seed={9} />
      {/* small shed */}
      <Shed position={[1.35, 0.12, -0.05]} scale={0.55} />
    </group>
  );
}

// ── 2. Harvest ─────────────────────────────────────────────────────────────
function Harvest() {
  return (
    <group>
      {/* workers picking — more of them, leaning, carrying baskets */}
      <Worker position={[-0.5, 0, 0.1]} rotation={[0, 0.5, 0]} scale={0.9} leaning carryingBasket />
      <Worker position={[0.55, 0, -0.15]} rotation={[0, -0.6, 0]} scale={0.88} leaning />
      <Worker position={[-0.1, 0, 0.8]} rotation={[0, 0.2, 0]} scale={0.82} leaning carryingBasket />
      {/* collection baskets on ground */}
      <group position={[0.8, 0, 0.75]}>
        <Basket scale={0.7} />
        <LeafBed position={[0, 0.5, 0]} size={[0.6, 0.6]} count={40} seed={7} scatter={0.06} />
      </group>
      <group position={[-0.85, 0, 0.7]}>
        <Basket scale={0.55} />
        <LeafBed position={[0, 0.4, 0]} size={[0.45, 0.45]} count={25} seed={14} scatter={0.04} />
      </group>
      {/* tea bushes */}
      <TeaBush position={[-1.15, 0, -0.6]} scale={0.85} sway={1.1} />
      <TeaBush position={[1.1, 0, -0.7]} scale={0.8} sway={2.4} />
      <TeaBush position={[0.0, 0, -0.75]} scale={0.9} sway={1.8} />
      {/* sign post */}
      <SignPost position={[1.35, 0, 0.15]} color={PALETTE.hat} />
    </group>
  );
}

// ── 3. Sorting ─────────────────────────────────────────────────────────────
function Sorting() {
  return (
    <group>
      <Table position={[0, 0, 0]} size={[2.9, 1.5]} height={0.6} />
      <LeafBed position={[0, 0.68, 0]} size={[2.5, 1.2]} count={110} seed={3} />
      {/* inspection lamp */}
      <mesh position={[0.95, 1.28, -0.5]} castShadow>
        <cylinderGeometry args={[0.02, 0.02, 0.72, 6]} />
        <meshStandardMaterial color={PALETTE.metalDark} metalness={0.5} roughness={0.4} />
      </mesh>
      <mesh position={[0.95, 1.6, -0.5]} rotation={[Math.PI, 0, 0]} castShadow>
        <coneGeometry args={[0.16, 0.18, 12, 1, true]} />
        <meshStandardMaterial color={PALETTE.metal} metalness={0.6} roughness={0.3} side={THREE.DoubleSide} />
      </mesh>
      <mesh position={[0.95, 1.5, -0.5]}>
        <sphereGeometry args={[0.06, 8, 6]} />
        <meshStandardMaterial color="#fff3d0" emissive="#ffd98a" emissiveIntensity={1.6} />
      </mesh>
      {/* workers inspecting */}
      <Worker position={[-0.15, 0, 1.1]} rotation={[0, Math.PI, 0]} scale={0.9} hat={false} />
      <Worker position={[0.75, 0, 1.05]} rotation={[0, Math.PI - 0.3, 0]} scale={0.85} hat={false} leaning />
      {/* factory wall backdrop */}
      <FactoryWall position={[0, 0, -1.2]} size={[2.6, 1.0, 0.5]} wallColor="#d9d4c6" />
    </group>
  );
}

// ── 4. Withering ───────────────────────────────────────────────────────────
function Withering() {
  return (
    <group>
      {/* trough */}
      <mesh position={[0, 0.62, 0]} castShadow receiveShadow>
        <boxGeometry args={[3.1, 0.16, 1.5]} />
        <meshStandardMaterial color={PALETTE.metal} metalness={0.3} roughness={0.45} />
      </mesh>
      {[
        [1.45, 0.65],
        [-1.45, 0.65],
        [1.45, -0.65],
        [-1.45, -0.65],
      ].map(([x, z], i) => (
        <mesh key={i} position={[x, 0.31, z]} castShadow>
          <boxGeometry args={[0.08, 0.62, 0.08]} />
          <meshStandardMaterial color={PALETTE.metalDark} metalness={0.4} roughness={0.5} />
        </mesh>
      ))}
      {/* leaf losing water: yellow-green, not fresh green */}
      <LeafBed position={[0, 0.74, 0]} size={[2.8, 1.25]} count={130} color={PALETTE.witheredLeaf} seed={11} />
      {/* fans */}
      <Fan position={[-1.72, 0.62, 0]} rotation={[0, 0, Math.PI / 2]} radius={0.3} speed={4.5} />
      <mesh position={[-1.72, 0.62, 0]} rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.38, 0.38, 0.26, 14, 1, true]} />
        <meshStandardMaterial color={PALETTE.metalDark} metalness={0.4} roughness={0.5} side={THREE.DoubleSide} />
      </mesh>
      {/* worker checking trough */}
      <Worker position={[0.4, 0, 1.0]} rotation={[0, Math.PI, 0]} scale={0.85} hat={false} leaning />
      {/* temperature gauge */}
      <mesh position={[1.6, 0.9, -0.55]} castShadow>
        <boxGeometry args={[0.18, 0.25, 0.04]} />
        <meshStandardMaterial color="#e9e6d8" roughness={0.6} />
      </mesh>
      <mesh position={[1.6, 0.92, -0.53]}>
        <boxGeometry args={[0.1, 0.08, 0.02]} />
        <meshStandardMaterial color="#2f4a35" emissive="#5aa06a" emissiveIntensity={0.7} />
      </mesh>
    </group>
  );
}

// ── 5. Rolling ─────────────────────────────────────────────────────────────
function Rolling() {
  const drum = useRef<THREE.Mesh>(null);
  useFrame((_, dt) => {
    if (drum.current) drum.current.rotation.y += dt * 0.9;
  });
  return (
    <group>
      {/* base */}
      <mesh position={[0, 0.22, 0]} castShadow receiveShadow>
        <cylinderGeometry args={[0.95, 1.05, 0.44, 16]} />
        <meshStandardMaterial color="#3f6b46" roughness={0.6} metalness={0.2} />
      </mesh>
      {/* rolling table */}
      <mesh position={[0, 0.5, 0]} receiveShadow>
        <cylinderGeometry args={[1.0, 1.0, 0.14, 20]} />
        <meshStandardMaterial color={PALETTE.metal} metalness={0.45} roughness={0.35} />
      </mesh>
      {/* rotating drum */}
      <mesh ref={drum} position={[0, 0.92, 0]} castShadow>
        <cylinderGeometry args={[0.62, 0.62, 0.72, 16]} />
        <meshStandardMaterial color="#4c7c52" metalness={0.3} roughness={0.5} />
      </mesh>
      {/* pressure cap */}
      <mesh position={[0, 1.36, 0]} castShadow>
        <cylinderGeometry args={[0.3, 0.44, 0.2, 14]} />
        <meshStandardMaterial color={PALETTE.metalDark} metalness={0.55} roughness={0.35} />
      </mesh>
      {/* discharged leaf, now bruised */}
      <LeafBed position={[1.35, 0.06, 0.55]} size={[0.7, 0.6]} count={45} color="#7d7f3c" seed={5} />
      {/* worker operating the machine */}
      <Worker position={[-1.4, 0, 0.5]} rotation={[0, 1.0, 0]} scale={0.85} hat={false} />
      {/* housing enclosure */}
      <mesh position={[0, 0.5, -1.1]} castShadow receiveShadow>
        <boxGeometry args={[1.4, 1.0, 0.2]} />
        <meshStandardMaterial color={PALETTE.metalDark} metalness={0.3} roughness={0.5} />
      </mesh>
      {/* control panel */}
      <mesh position={[-0.4, 0.6, -0.98]}>
        <boxGeometry args={[0.3, 0.2, 0.04]} />
        <meshStandardMaterial color="#2f4a35" emissive="#5aa06a" emissiveIntensity={0.5} />
      </mesh>
    </group>
  );
}

// ── 6. Fermenting ──────────────────────────────────────────────────────────
function Fermenting() {
  const group = useRef<THREE.Group>(null);
  // Slow colour drift stands in for oxidation progressing over hours.
  useFrame(({ clock }) => {
    if (!group.current) return;
    const t = (Math.sin(clock.elapsedTime * 0.35) + 1) / 2;
    group.current.traverse((o) => {
      const mesh = o as THREE.Mesh;
      if (mesh.userData.oxidising && mesh.material) {
        (mesh.material as THREE.MeshStandardMaterial).color.lerpColors(
          new THREE.Color('#8a9440'),
          new THREE.Color('#a05f2c'),
          t,
        );
      }
    });
  });

  return (
    <group ref={group}>
      <Table position={[0, 0, 0.55]} size={[2.8, 1.1]} height={0.55} top={PALETTE.metalDark} />
      {[-0.85, 0.05, 0.95].map((x, s) => (
        <group key={s} position={[x, 0.62, 0.55]}>
          {[0, 1, 2].map((i) => (
            <RoundTray key={i} position={[0, i * 0.15, 0]} radius={0.38} fill={i === 2 ? '#8a9440' : undefined} />
          ))}
          <mesh position={[0, 0.34, 0]} userData={{ oxidising: true }}>
            <cylinderGeometry args={[0.35, 0.35, 0.06, 16]} />
            <meshStandardMaterial color="#8a9440" roughness={0.9} flatShading />
          </mesh>
        </group>
      ))}
      {/* humidity control unit */}
      <mesh position={[0, 0.3, -0.95]} castShadow receiveShadow>
        <boxGeometry args={[0.9, 0.6, 0.35]} />
        <meshStandardMaterial color="#e9e6d8" roughness={0.6} />
      </mesh>
      <mesh position={[0, 0.42, -0.77]}>
        <boxGeometry args={[0.34, 0.16, 0.02]} />
        <meshStandardMaterial color="#2f4a35" emissive="#5aa06a" emissiveIntensity={0.7} />
      </mesh>
      <Steam position={[0, 0.62, -0.95]} color="#dff0e2" count={3} spread={0.12} />
      {/* walled room suggestion */}
      <mesh position={[-1.55, 0.4, 0]} castShadow>
        <boxGeometry args={[0.12, 0.8, 2.2]} />
        <meshStandardMaterial color={PALETTE.concrete} roughness={0.8} />
      </mesh>
      {/* worker monitoring */}
      <Worker position={[1.25, 0, 0.1]} rotation={[0, -0.8, 0]} scale={0.82} hat={false} />
    </group>
  );
}

// ── 7. Drying ──────────────────────────────────────────────────────────────
function Drying() {
  const belt = useRef<THREE.Group>(null);
  useFrame((_, dt) => {
    if (!belt.current) return;
    belt.current.children.forEach((slat) => {
      slat.position.x += dt * 0.5;
      if (slat.position.x > 1.3) slat.position.x = -1.3;
    });
  });

  return (
    <group>
      {/* dryer body */}
      <mesh position={[0, 0.55, 0]} castShadow receiveShadow>
        <boxGeometry args={[2.8, 1.1, 1.3]} />
        <meshStandardMaterial color={PALETTE.metal} metalness={0.35} roughness={0.45} />
      </mesh>
      {/* mouth */}
      <mesh position={[0, 0.62, 0.66]}>
        <boxGeometry args={[2.4, 0.5, 0.04]} />
        <meshStandardMaterial color="#33291f" roughness={0.9} />
      </mesh>
      {/* moving belt slats */}
      <group ref={belt} position={[0, 0.62, 0.69]}>
        {Array.from({ length: 9 }, (_, i) => (
          <mesh key={i} position={[-1.3 + i * 0.32, 0, 0]}>
            <boxGeometry args={[0.1, 0.42, 0.05]} />
            <meshStandardMaterial color={PALETTE.metalDark} metalness={0.5} roughness={0.4} />
          </mesh>
        ))}
      </group>
      {/* dried output */}
      <LeafBed position={[1.62, 0.06, 0.4]} size={[0.7, 0.6]} count={50} color={PALETTE.driedTea} seed={13} />
      {/* chimney / vent */}
      <mesh position={[-0.3, 1.35, -0.2]} castShadow>
        <cylinderGeometry args={[0.12, 0.14, 0.5, 8]} />
        <meshStandardMaterial color={PALETTE.metalDark} metalness={0.4} roughness={0.45} />
      </mesh>
      <Steam position={[-0.3, 1.6, -0.2]} color="#f2e4cf" count={3} spread={0.16} />
      <Steam position={[0.6, 1.15, 0.2]} color="#f2e4cf" count={3} spread={0.16} />
      <Fan position={[-1.55, 0.55, 0]} rotation={[0, 0, Math.PI / 2]} radius={0.26} speed={6} />
      {/* worker monitoring output */}
      <Worker position={[1.45, 0, -0.5]} rotation={[0, -1.2, 0]} scale={0.82} hat={false} />
    </group>
  );
}

// ── 8. Grading ─────────────────────────────────────────────────────────────
function Grading() {
  const sieves = useRef<THREE.Group>(null);
  // Lateral shake — the actual motion of a sorting sieve.
  useFrame(({ clock }) => {
    if (sieves.current) sieves.current.position.x = Math.sin(clock.elapsedTime * 7) * 0.035;
  });

  const grades = ['#5a4430', '#6b5137', '#7d6142', '#8f724e'];

  return (
    <group>
      <Table position={[0, 0, 0]} size={[3.1, 1.5]} height={0.58} top={PALETTE.metalDark} />
      <group ref={sieves}>
        {grades.map((c, i) => (
          <group key={i} position={[-1.12 + i * 0.75, 0.66, 0]}>
            <mesh castShadow receiveShadow>
              <boxGeometry args={[0.66, 0.16, 1.15]} />
              <meshStandardMaterial color={PALETTE.wood} roughness={0.85} />
            </mesh>
            <mesh position={[0, 0.1, 0]}>
              <boxGeometry args={[0.58, 0.05, 1.05]} />
              <meshStandardMaterial color={c} roughness={0.95} flatShading />
            </mesh>
          </group>
        ))}
      </group>
      {/* collection bins underneath */}
      {[-0.75, 0.0, 0.75].map((x, i) => (
        <mesh key={i} position={[x, 0.15, 0.9]} castShadow receiveShadow>
          <boxGeometry args={[0.4, 0.28, 0.3]} />
          <meshStandardMaterial color={PALETTE.wood} roughness={0.9} />
        </mesh>
      ))}
      {/* workers */}
      <Worker position={[0, 0, 1.15]} rotation={[0, Math.PI, 0]} scale={0.88} hat={false} leaning />
      <Worker position={[-1.3, 0, 0.9]} rotation={[0, Math.PI * 0.7, 0]} scale={0.8} hat={false} />
    </group>
  );
}

// ── 9. Packaging ───────────────────────────────────────────────────────────
function Packaging() {
  return (
    <group>
      {/* retail carton */}
      <group position={[0.15, 0, -0.1]}>
        <mesh position={[0, 0.62, 0]} castShadow receiveShadow>
          <boxGeometry args={[0.78, 1.24, 0.5]} />
          <meshStandardMaterial color="#2f5b3a" roughness={0.65} />
        </mesh>
        <mesh position={[0, 0.72, 0.26]}>
          <boxGeometry args={[0.56, 0.42, 0.02]} />
          <meshStandardMaterial color="#f0ead6" roughness={0.8} />
        </mesh>
        <mesh position={[0, 1.12, 0.26]}>
          <boxGeometry args={[0.34, 0.14, 0.02]} />
          <meshStandardMaterial color={PALETTE.liquor} roughness={0.6} />
        </mesh>
      </group>
      {/* kraft pouches */}
      <mesh position={[-0.95, 0.42, 0.25]} rotation={[0, 0.3, 0]} castShadow receiveShadow>
        <boxGeometry args={[0.52, 0.84, 0.3]} />
        <meshStandardMaterial color={PALETTE.paperbag} roughness={0.9} />
      </mesh>
      <mesh position={[-1.4, 0.32, -0.3]} rotation={[0, -0.4, 0]} castShadow receiveShadow>
        <boxGeometry args={[0.46, 0.64, 0.28]} />
        <meshStandardMaterial color="#b9a077" roughness={0.9} />
      </mesh>
      {/* sachets */}
      {[
        [0.95, 0.5],
        [1.28, 0.28],
        [1.05, 0.05],
      ].map(([x, z], i) => (
        <mesh key={i} position={[x, 0.03, z]} rotation={[0, i * 0.6, 0]} castShadow receiveShadow>
          <boxGeometry args={[0.34, 0.05, 0.28]} />
          <meshStandardMaterial color="#7fa268" roughness={0.85} />
        </mesh>
      ))}
      {/* warehouse wall backdrop */}
      <FactoryWall position={[-0.2, 0, -0.85]} size={[2.4, 0.9, 0.4]} wallColor="#d4cfc4" />
      {/* worker labelling */}
      <Worker position={[0.85, 0, 0.85]} rotation={[0, Math.PI + 0.3, 0]} scale={0.82} hat={false} />
      {/* loose graded tea awaiting pack */}
      <LeafBed position={[-0.55, 0.03, 0.85]} size={[0.6, 0.45]} count={35} color={PALETTE.driedTea} seed={17} />
    </group>
  );
}

// ── 10. Cup ────────────────────────────────────────────────────────────────
function Cup() {
  return (
    <group>
      {/* tray */}
      <mesh position={[0, 0.06, 0]} receiveShadow castShadow>
        <cylinderGeometry args={[1.55, 1.6, 0.12, 28]} />
        <meshStandardMaterial color={PALETTE.porcelain} roughness={0.5} />
      </mesh>
      {/* teapot */}
      <group position={[-0.25, 0.12, -0.25]}>
        <mesh position={[0, 0.42, 0]} castShadow>
          <sphereGeometry args={[0.44, 20, 14]} />
          <meshStandardMaterial color={PALETTE.porcelain} roughness={0.28} metalness={0.05} />
        </mesh>
        <mesh position={[0, 0.78, 0]} castShadow>
          <cylinderGeometry args={[0.17, 0.22, 0.12, 14]} />
          <meshStandardMaterial color={PALETTE.porcelain} roughness={0.28} />
        </mesh>
        <mesh position={[0, 0.88, 0]} castShadow>
          <sphereGeometry args={[0.08, 10, 8]} />
          <meshStandardMaterial color={PALETTE.porcelain} roughness={0.28} />
        </mesh>
        {/* spout */}
        <mesh position={[0.44, 0.5, 0]} rotation={[0, 0, -0.7]} castShadow>
          <cylinderGeometry args={[0.05, 0.1, 0.46, 10]} />
          <meshStandardMaterial color={PALETTE.porcelain} roughness={0.28} />
        </mesh>
        {/* handle */}
        <mesh position={[-0.44, 0.46, 0]} rotation={[Math.PI / 2, 0, 0]} castShadow>
          <torusGeometry args={[0.19, 0.045, 8, 18, Math.PI * 1.3]} />
          <meshStandardMaterial color={PALETTE.porcelain} roughness={0.28} />
        </mesh>
        <Steam position={[0.62, 0.72, 0]} color="#ffffff" count={3} spread={0.14} />
      </group>
      {/* two filled cups */}
      {[
        [0.62, 0.35],
        [0.15, 0.72],
      ].map(([x, z], i) => (
        <group key={i} position={[x, 0.12, z]}>
          <mesh position={[0, 0.02, 0]} receiveShadow>
            <cylinderGeometry args={[0.29, 0.29, 0.04, 18]} />
            <meshStandardMaterial color={PALETTE.porcelain} roughness={0.35} />
          </mesh>
          <mesh position={[0, 0.14, 0]} castShadow>
            <cylinderGeometry args={[0.21, 0.15, 0.22, 18, 1, true]} />
            <meshStandardMaterial color={PALETTE.porcelain} roughness={0.28} side={THREE.DoubleSide} />
          </mesh>
          <mesh position={[0, 0.05, 0]}>
            <cylinderGeometry args={[0.15, 0.15, 0.02, 18]} />
            <meshStandardMaterial color={PALETTE.porcelain} roughness={0.3} />
          </mesh>
          {/* the liquor */}
          <mesh position={[0, 0.22, 0]}>
            <cylinderGeometry args={[0.198, 0.198, 0.03, 18]} />
            <meshStandardMaterial
              color={PALETTE.liquor}
              roughness={0.15}
              metalness={0.1}
              emissive={PALETTE.liquor}
              emissiveIntensity={0.18}
            />
          </mesh>
          <Steam position={[0, 0.28, 0]} color="#ffffff" count={2} spread={0.1} />
        </group>
      ))}
      {/* person seated / standing nearby */}
      <Worker position={[-1.1, 0.0, 0.45]} rotation={[0, 0.6, 0]} scale={0.78} hat={false} />
      {/* a couple of fresh leaves on the tray, closing the loop */}
      <LeafBed position={[-0.95, 0.13, 0.6]} size={[0.34, 0.24]} count={6} color={PALETTE.leaf} seed={23} scatter={0.01} />
    </group>
  );
}

/** Diorama lookup by stage slug. */
export const DIORAMAS: Record<string, () => React.JSX.Element> = {
  plantation: Plantation,
  harvest: Harvest,
  sorting: Sorting,
  withering: Withering,
  rolling: Rolling,
  fermenting: Fermenting,
  drying: Drying,
  grading: Grading,
  packaging: Packaging,
  cup: Cup,
};
