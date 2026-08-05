"use client";

import { useLoader } from '@react-three/fiber';
import * as THREE from 'three';

export function TargetImage({ url }: { url: string }) {
  const texture = useLoader(THREE.TextureLoader, url);
  return (
    <mesh position={[0, -0.01, 0]} rotation={[-Math.PI / 2, 0, 0]}>
      <planeGeometry args={[2, 2 * (texture.image?.height / texture.image?.width || 1)]} />
      <meshBasicMaterial map={texture} opacity={0.5} transparent />
    </mesh>
  );
}

