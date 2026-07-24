"use client";

import { Suspense, useEffect, useRef, useState, useMemo } from 'react';
import { Canvas, useFrame, useLoader } from '@react-three/fiber';

import { EffectComposer, Outline, Selection, Select } from '@react-three/postprocessing';
import { useHelper, OrbitControls, Grid, useGLTF, useTexture, TransformControls, Text, Text3D, Center, Html, useAnimations, Sparkles, Environment, GizmoHelper, GizmoViewport, PerspectiveCamera, OrthographicCamera, Box as DreiBox, Sphere, Cylinder, Plane, Cone, Torus, Tetrahedron, Icosahedron, Outlines , Line} from '@react-three/drei';
import * as THREE from 'three';
import { useEditorStore } from '@/lib/store';

// Logic Engine Hook
import { useLogicEngine } from '@/hooks/useLogicEngine';
import { ProximitySensorEngine } from '@/components/Editor/Elements/ProximitySensorEngine';
import { useActionHandler } from '@/hooks/useActionHandler';
import { AnimatedElementWrapper } from '@/components/Editor/Elements/AnimatedElementWrapper';
import { MotionPathVisualizer } from '@/components/Editor/Elements/MotionPathVisualizer';
import { useTransformLogic } from '@/hooks/useTransformLogic';
import { ShapeElement } from '@/components/Editor/Elements/ShapeElement';
import { ModelElement } from '@/components/Editor/Elements/ModelElement';
import { TextElement } from '@/components/Editor/Elements/TextElement';
import { UIButtonElement } from '@/components/Editor/Elements/UIButtonElement';
import { AudioElement } from '@/components/Editor/Elements/AudioElement';
import { ImageElement } from '@/components/Editor/Elements/ImageElement';
import { VideoElement } from '@/components/Editor/Elements/VideoElement';
import { SparklesElement } from '@/components/Editor/Elements/SparklesElement';
import { HotspotElement } from '@/components/Editor/Elements/HotspotElement';
import { TargetImage } from '@/components/Editor/Elements/TargetImage';
import { OccluderElement } from '@/components/Editor/Elements/OccluderElement';
import { RecursiveNode } from '@/components/Editor/Elements/RecursiveNode';
import { GroupFolderElement } from '@/components/Editor/Elements/GroupFolderElement';

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
      enableDamping={true} 
      dampingFactor={0.05}
      onStart={() => {
        if (cameraFocusTarget) setCameraFocusTarget(null);
      }}
    />
  );
}

// Recursive Node Renderer