"use client";

import { Line } from '@react-three/drei';
import * as THREE from 'three';

export function MotionPathVisualizer({ element }: { element: any }) {
  if (!element.keyframes || element.keyframes.length < 2) return null;
  const posKfs = element.keyframes.filter((k: any) => k.position !== undefined).sort((a: any, b: any) => a.time - b.time);
  if (posKfs.length < 2) return null;

  const points = posKfs.map((kf: any) => new THREE.Vector3(...kf.position));
  return <Line points={points} color="#f97316" lineWidth={1.5} dashed={true} dashSize={0.2} gapSize={0.1} />;
}

