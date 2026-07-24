import { viewportElementRefs } from '@/lib/viewportRefs';
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
import { CameraController } from '@/components/Editor/Elements/CameraController';
import { RecursiveNode } from '@/components/Editor/Elements/RecursiveNode';
import { GroupFolderElement } from '@/components/Editor/Elements/GroupFolderElement';

export function ShapeElement({ element, mode }: { element: any, mode: 'translate' | 'rotate' | 'scale' }) {
  const transformRef = useRef<any>(null);
  const groupRef = useRef<THREE.Group>(null);
  const updateElement = useEditorStore(state => state.updateElement);
  const selectedId = useEditorStore(state => state.selectedId);
  const setSelectedId = useEditorStore(state => state.setSelectedId);
  const handleElementClick = useEditorStore(state => state.handleElementClick);
  const timelinePlaying = useEditorStore(state => state.timelinePlaying);
  const isSelected = selectedId === element.id && !timelinePlaying;
  const isSnapping = useEditorStore(state => state.isSnapping);

  useTransformLogic(element, isSelected, transformRef);

  const shapeObj = (
    <group ref={groupRef}>
      <AnimatedElementWrapper element={element}>
        <group
          onClick={(e) => { e.stopPropagation(); handleElementClick(element.id, e.ctrlKey || e.metaKey || e.shiftKey, false); }}
          onPointerMissed={() => {}}
        >
          {element.shapeType === 'cube' && <DreiBox args={[1, 1, 1]}><meshStandardMaterial color={element.color || '#ffffff'} /></DreiBox>}
          {element.shapeType === 'sphere' && <Sphere args={[0.5, 32, 32]}><meshStandardMaterial color={element.color || '#ffffff'} /></Sphere>}
          {element.shapeType === 'cylinder' && <Cylinder args={[0.5, 0.5, 1, 32]}><meshStandardMaterial color={element.color || '#ffffff'} /></Cylinder>}
          {element.shapeType === 'plane' && <Plane args={[1, 1]}><meshStandardMaterial color={element.color || '#ffffff'} side={THREE.DoubleSide} /></Plane>}
          {element.shapeType === 'cone' && <Cone args={[0.5, 1, 32]}><meshStandardMaterial color={element.color || '#ffffff'} /></Cone>}
          {element.shapeType === 'torus' && <Torus args={[0.4, 0.1, 16, 100]}><meshStandardMaterial color={element.color || '#ffffff'} /></Torus>}
          {element.shapeType === 'tetrahedron' && <Tetrahedron args={[0.6]}><meshStandardMaterial color={element.color || '#ffffff'} /></Tetrahedron>}
          {element.shapeType === 'icosahedron' && <Icosahedron args={[0.5]}><meshStandardMaterial color={element.color || '#ffffff'} /></Icosahedron>}
        </group>
      </AnimatedElementWrapper>
    </group>
  );

  if (isSelected) {
    return (
      <TransformControls size={1.2}
        ref={transformRef}
        mode={mode}
        position={element.position as [number, number, number]}
        rotation={element.rotation as [number, number, number]}
        scale={element.scale as [number, number, number]}
        translationSnap={isSnapping ? 0.5 : null}
        rotationSnap={isSnapping ? Math.PI / 4 : null}
        scaleSnap={isSnapping ? 0.25 : null}
      >
        {shapeObj}
      </TransformControls>
    );
  }

  return (
    <group
      ref={(r) => {
        if (r) viewportElementRefs[element.id] = r;
        else delete viewportElementRefs[element.id];
      }}
      position={element.position as [number, number, number]}
      rotation={element.rotation as [number, number, number]}
      scale={element.scale as [number, number, number]}
    >
      <group position={element.meshPositionOffset || [0, 0, 0]}>
        {shapeObj}
      </group>
    </group>
  );
}
