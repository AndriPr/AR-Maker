"use client";

import { Canvas, useFrame } from '@react-three/fiber';
import { useRef } from 'react';
import * as THREE from 'three';
import { Box as DreiBox, Sphere, Cylinder, Plane, Cone, Torus, Tetrahedron, Icosahedron } from '@react-three/drei';

function SpinningShape({ type }: { type: string }) {
  const meshRef = useRef<THREE.Mesh>(null);
  
  useFrame((state, delta) => {
    if (meshRef.current) {
      meshRef.current.rotation.x += delta * 0.5;
      meshRef.current.rotation.y += delta * 1;
    }
  });

  return (
    <mesh ref={meshRef as any}>
      {type === 'cube' && <boxGeometry args={[1.5, 1.5, 1.5]} />}
      {type === 'sphere' && <sphereGeometry args={[1, 32, 32]} />}
      {type === 'cylinder' && <cylinderGeometry args={[0.8, 0.8, 1.5, 32]} />}
      {type === 'plane' && <planeGeometry args={[1.5, 1.5]} />}
      {type === 'cone' && <coneGeometry args={[1, 1.5, 32]} />}
      {type === 'torus' && <torusGeometry args={[0.8, 0.3, 16, 50]} />}
      {type === 'tetrahedron' && <tetrahedronGeometry args={[1.2]} />}
      {type === 'icosahedron' && <icosahedronGeometry args={[1]} />}
      <meshStandardMaterial color="#3b82f6" wireframe={false} roughness={0.4} metalness={0.1} />
    </mesh>
  );
}

export default function ShapePreview({ type }: { type: string }) {
  return (
    <div className="w-12 h-12 mb-1 pointer-events-none">
      <Canvas camera={{ position: [0, 0, 3], fov: 50 }}>
        <ambientLight intensity={1.5} />
        <directionalLight position={[2, 2, 2]} intensity={2} />
        <SpinningShape type={type} />
      </Canvas>
    </div>
  );
}
