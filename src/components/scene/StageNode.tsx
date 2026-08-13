'use client';

import { useRef, useState } from 'react';
import { Html, RoundedBox } from '@react-three/drei';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import type { Stage } from '@/lib/types';
import { useAtlas } from '@/lib/store';
import { DIORAMAS } from './dioramas';

const PLATFORM = 4.6;
/** Thin enough to read as a pad from above rather than a slab from the side. */
const THICKNESS = 0.22;
/** Dioramas are authored ~3 units wide; this fills the pad without crowding it. */
const DIORAMA_SCALE = 1.18;

/**
 * One clickable stage: a rounded platform, its diorama, a numbered badge and a
 * label. Hover and selection are expressed as a vertical lift plus a ring of
 * light — no colour change, so the stage keeps its position in the green→amber
 * progression regardless of interaction state.
 */
export function StageNode({ stage }: { stage: Stage }) {
  const group = useRef<THREE.Group>(null);
  const ring = useRef<THREE.Mesh>(null);
  const [localHover, setLocalHover] = useState(false);

  const selected = useAtlas((s) => s.selected === stage.slug);
  const hovered = useAtlas((s) => s.hovered === stage.slug) || localHover;
  const select = useAtlas((s) => s.select);
  const hover = useAtlas((s) => s.hover);
  const anySelected = useAtlas((s) => s.selected !== null);

  const Diorama = DIORAMAS[stage.slug];

  useFrame((_, dt) => {
    if (!group.current) return;
    const k = 1 - Math.pow(0.001, dt); // frame-rate independent damping

    const targetY = selected ? 0.55 : hovered ? 0.28 : 0;
    group.current.position.y += (targetY - group.current.position.y) * k;

    // Dim unrelated stages once something is selected, so the drawer's subject
    // is unambiguous without hiding the rest of the pipeline.
    const targetScale = selected ? 1.04 : 1;
    const s = group.current.scale.x + (targetScale - group.current.scale.x) * k;
    group.current.scale.setScalar(s);

    if (ring.current) {
      const mat = ring.current.material as THREE.MeshBasicMaterial;
      const targetOpacity = selected ? 0.85 : hovered ? 0.45 : 0;
      mat.opacity += (targetOpacity - mat.opacity) * k;
      ring.current.visible = mat.opacity > 0.01;
    }
  });

  const dimmed = anySelected && !selected;

  return (
    <group position={stage.position}>
      <group ref={group}>
        {/* Selection ring, drawn just above the platform surface. */}
        <mesh ref={ring} rotation={[-Math.PI / 2, 0, 0]} position={[0, THICKNESS / 2 + 0.01, 0]} visible={false}>
          <ringGeometry args={[PLATFORM / 2 - 0.16, PLATFORM / 2 - 0.03, 48]} />
          <meshBasicMaterial color={stage.accent} transparent opacity={0} side={THREE.DoubleSide} />
        </mesh>

        <RoundedBox
          args={[PLATFORM, THICKNESS, PLATFORM]}
          radius={0.36}
          smoothness={4}
          position={[0, 0, 0]}
          castShadow
          receiveShadow
          onPointerOver={(e) => {
            e.stopPropagation();
            setLocalHover(true);
            hover(stage.slug);
            document.body.style.cursor = 'pointer';
          }}
          onPointerOut={(e) => {
            e.stopPropagation();
            setLocalHover(false);
            hover(null);
            document.body.style.cursor = 'auto';
          }}
          onClick={(e) => {
            e.stopPropagation();
            select(stage.slug);
          }}
        >
          <meshStandardMaterial
            color="#e2e7d3"
            roughness={0.88}
            metalness={0}
            transparent
            opacity={dimmed ? 0.7 : 1}
          />
        </RoundedBox>




        <group position={[0, THICKNESS / 2, 0]} scale={DIORAMA_SCALE}>
          {Diorama ? <Diorama /> : null}
        </group>

        {/* Numbered badge + label. Html keeps type crisp at any zoom and lets the
            label inherit the page's font stack instead of shipping an SDF atlas.
            The pill background is load-bearing: bare text disappeared against
            the pale platforms. */}
        <Html
          position={[0, 3.1, 0]}
          center
          distanceFactor={15}
          zIndexRange={[20, 0]}
          style={{ pointerEvents: 'none', opacity: dimmed ? 0.5 : 1, transition: 'opacity 240ms' }}
        >
          <div
            className="flex select-none items-center gap-1.5 rounded-full border py-1 pr-3 pl-1 whitespace-nowrap"
            style={{
              background: 'color-mix(in srgb, var(--color-surface) 92%, transparent)',
              borderColor: 'var(--color-line)',
              backdropFilter: 'blur(6px)',
              boxShadow: '0 2px 10px -4px rgb(31 61 43 / 0.35)',
            }}
          >
            <span
              className="grid h-5 w-5 shrink-0 place-items-center rounded-full text-[10px] font-bold text-white"
              style={{ background: stage.color }}
            >
              {stage.index}
            </span>
            <span className="text-[12px] font-semibold tracking-tight" style={{ color: 'var(--color-ink)' }}>
              {stage.name}
            </span>
          </div>
        </Html>
      </group>
    </group>
  );
}
