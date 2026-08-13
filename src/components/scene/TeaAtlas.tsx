'use client';

import { Suspense, useEffect, useState } from 'react';
import { Canvas } from '@react-three/fiber';
import { PerformanceMonitor, Preload } from '@react-three/drei';
import * as THREE from 'three';
import { STAGES } from '@/lib/data/stages';
import { useAtlas } from '@/lib/store';
import { useThemeColors } from '@/lib/useThemeColors';
import { StageNode } from './StageNode';
import { JourneyPath } from './JourneyPath';
import { CameraRig } from './CameraRig';

function Lighting({ shadows }: { shadows: boolean }) {
  return (
    <>
      <ambientLight intensity={0.52} />
      <hemisphereLight args={['#eaf3e4', '#c3b79b', 0.5]} />
      <directionalLight
        position={[14, 22, 10]}
        intensity={1.3}
        castShadow={shadows}
        shadow-mapSize={[2048, 2048]}
        shadow-bias={-0.0006}
        shadow-normalBias={0.02}
      >
        {/* Tight ortho bounds keep shadow texels dense across the whole board. */}
        <orthographicCamera attach="shadow-camera" args={[-26, 26, 26, -26, 1, 70]} />
      </directionalLight>
      {/* Cool fill from the opposite side stops the shadowed faces going muddy. */}
      <directionalLight position={[-16, 10, -12]} intensity={0.42} color="#cfe0e8" />
    </>
  );
}

function Ground({ color }: { color: string }) {
  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.22, 0]} receiveShadow>
      <circleGeometry args={[62, 64]} />
      <meshStandardMaterial color={color} roughness={1} metalness={0} />
    </mesh>
  );
}

function Scene({ compact }: { compact: boolean }) {
  const { paper, fog } = useThemeColors();
  const quality = useAtlas((s) => s.quality);
  const select = useAtlas((s) => s.select);

  return (
    <>
      <fog attach="fog" args={[fog, 48, 105]} />
      <Lighting shadows={quality === 'high'} />
      {/* Click-away target: an invisible floor that clears the selection. */}
      <mesh
        rotation={[-Math.PI / 2, 0, 0]}
        position={[0, -0.23, 0]}
        onClick={() => select(null)}
        visible={false}
      >
        <circleGeometry args={[80, 8]} />
        <meshBasicMaterial />
      </mesh>
      <Ground color={paper} />
      <JourneyPath />
      {STAGES.map((stage) => (
        <StageNode key={stage.slug} stage={stage} />
      ))}
      <CameraRig compact={compact} />
      <Preload all />
    </>
  );
}

/**
 * Canvas host.
 *
 * Kept deliberately lean: no post-processing, no external HDRIs or model files,
 * and shadow quality degrades automatically on weak hardware via
 * PerformanceMonitor. Everything rendered is procedural geometry.
 */
export function TeaAtlas() {
  const setQuality = useAtlas((s) => s.setQuality);
  const [dpr, setDpr] = useState(1.5);
  const [compact, setCompact] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia('(max-width: 1024px)');
    const sync = () => setCompact(mq.matches);
    sync();
    mq.addEventListener('change', sync);

    // Coarse capability check up front; PerformanceMonitor refines it at runtime.
    const cores = navigator.hardwareConcurrency ?? 4;
    if (cores <= 4 || mq.matches) setQuality('low');

    return () => mq.removeEventListener('change', sync);
  }, [setQuality]);

  return (
    <Canvas
      shadows
      dpr={dpr}
      gl={{
        antialias: true,
        alpha: true,
        powerPreference: 'high-performance',
        toneMapping: THREE.ACESFilmicToneMapping,
      }}
      camera={{ position: [13, 27, 20], fov: 34, near: 0.5, far: 200 }}
      style={{ position: 'absolute', inset: 0 }}
    >
      <PerformanceMonitor
        onDecline={() => {
          setDpr(1);
          setQuality('low');
        }}
        onIncline={() => setDpr(Math.min(2, window.devicePixelRatio))}
      />
      <Suspense fallback={null}>
        <Scene compact={compact} />
      </Suspense>
    </Canvas>
  );
}
