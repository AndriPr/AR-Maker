"use client";
import { viewportElementRefs } from '@/lib/viewportRefs';

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
import { VideoElement } from '@/components/Editor/Elements/VideoElement';
import { SparklesElement } from '@/components/Editor/Elements/SparklesElement';
import { HotspotElement } from '@/components/Editor/Elements/HotspotElement';
import { TargetImage } from '@/components/Editor/Elements/TargetImage';
import { OccluderElement } from '@/components/Editor/Elements/OccluderElement';
import { CameraController } from '@/components/Editor/Elements/CameraController';
import { RecursiveNode } from '@/components/Editor/Elements/RecursiveNode';
import { GroupFolderElement } from '@/components/Editor/Elements/GroupFolderElement';

export function ImageElement({ element, mode }: { element: any, mode: 'translate' | 'rotate' | 'scale' }) {
  const transformRef = useRef<any>(null);
  const updateElement = useEditorStore(state => state.updateElement);
  const selectedId = useEditorStore(state => state.selectedId);
  const setSelectedId = useEditorStore(state => state.setSelectedId);
  const handleElementClick = useEditorStore(state => state.handleElementClick);
  const isSnapping = useEditorStore(state => state.isSnapping);
  const timelinePlaying = useEditorStore(state => state.timelinePlaying);
  const isSelected = selectedId === element.id && !timelinePlaying;
  
  // Optional: load the texture (if it fails, it just won't show)
  const texture = useTexture(element.url || 'https://via.placeholder.com/150');
  
  // Calculate aspect ratio
  const tex = texture as any;
  const aspect = tex.image ? tex.image.width / tex.image.height : 1;
  const width = aspect > 1 ? 3 : 3 * aspect;
  const height = aspect > 1 ? 3 / aspect : 3;

  useTransformLogic(element, isSelected, transformRef);

  const imageObj = (
    <AnimatedElementWrapper element={element}>
      <group 
        onClick={(e: any) => { e.stopPropagation(); handleElementClick(element.id, e.ctrlKey || e.metaKey || e.shiftKey, false); }}
        onPointerMissed={() => {}}
      >
        <mesh>
          <planeGeometry args={[width, height]} />
          <meshBasicMaterial map={tex} transparent side={THREE.DoubleSide} />
        </mesh>
      </group>
    </AnimatedElementWrapper>
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
        rotationSnap={isSnapping ? Math.PI / 12 : null}
        scaleSnap={isSnapping ? 0.5 : null}
      >
        {imageObj}
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
      scale={element.scale as [number, number, number]}>
      {imageObj}
    </group>
  );
}
