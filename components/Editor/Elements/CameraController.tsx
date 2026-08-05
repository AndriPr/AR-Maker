"use client";

import { useEffect, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import * as THREE from 'three';
import { useEditorStore } from '@/lib/store';

export function CameraController() {
  const controlsRef = useRef<any>(null);
  const cameraResetTrigger = useEditorStore(state => state.cameraResetTrigger);
  const isOrthographic = useEditorStore(state => state.isOrthographic);
  const cameraFocusTarget = useEditorStore(state => state.cameraFocusTarget);
  const setCameraFocusTarget = useEditorStore(state => state.setCameraFocusTarget);

  useEffect(() => {
    if (controlsRef.current) {
      controlsRef.current.reset();
    }
  }, [cameraResetTrigger, isOrthographic]);

  useFrame((state, delta) => {
    if (cameraFocusTarget && controlsRef.current) {
      const targetVec = new THREE.Vector3(...cameraFocusTarget);
      controlsRef.current.target.lerp(targetVec, delta * 5);
      
      if (controlsRef.current.target.distanceTo(targetVec) < 0.01) {
        setCameraFocusTarget(null);
      }
    }
  });

  return (
    <OrbitControls 
      makeDefault 
      ref={controlsRef} 
      enableDamping={false} 
      zoomSpeed={0.8}
      panSpeed={0.8}
      rotateSpeed={0.8}
      onStart={() => {
        if (cameraFocusTarget) setCameraFocusTarget(null);
      }}
    />
  );
}

// Recursive Node Renderer
