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
import { CameraController } from '@/components/Editor/Elements/CameraController';
import { RecursiveNode } from '@/components/Editor/Elements/RecursiveNode';

export function GroupFolderElement({ element, mode, children }: { element: any, mode: 'translate' | 'rotate' | 'scale', children: React.ReactNode }) {
  const transformRef = useRef<any>(null);
  const groupRef = useRef<THREE.Group>(null);
  const updateElement = useEditorStore(state => state.updateElement);
  const selectedId = useEditorStore(state => state.selectedId);
  const setSelectedId = useEditorStore(state => state.setSelectedId);
  const handleElementClick = useEditorStore(state => state.handleElementClick);
  const isSnapping = useEditorStore(state => state.isSnapping);
  const timelinePlaying = useEditorStore(state => state.timelinePlaying);
  const isSelected = selectedId === element.id && !timelinePlaying;

  useTransformLogic(element, isSelected, transformRef);

  const groupObj = (
    <group ref={groupRef}>
      <AnimatedElementWrapper element={element}>
        <group
          onClick={(e: any) => { e.stopPropagation(); handleElementClick(element.id, e.ctrlKey || e.metaKey || e.shiftKey, false); }}
          onPointerMissed={() => {}}
        >
          {/* Visible bounding box helper for the group when selected, otherwise invisible */}
          <DreiBox args={[1, 1, 1]} visible={isSelected}>
            <meshBasicMaterial color="#ffffff" wireframe transparent opacity={0.3} />
          </DreiBox>
          {children}
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
        {groupObj}
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
      {groupObj}
    </group>
  );
}

export const viewportElementRefs: Record<string, THREE.Group> = {};
