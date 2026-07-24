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
import { HotspotElement } from '@/components/Editor/Elements/HotspotElement';
import { TargetImage } from '@/components/Editor/Elements/TargetImage';
import { OccluderElement } from '@/components/Editor/Elements/OccluderElement';
import { CameraController } from '@/components/Editor/Elements/CameraController';
import { RecursiveNode } from '@/components/Editor/Elements/RecursiveNode';
import { GroupFolderElement } from '@/components/Editor/Elements/GroupFolderElement';

export function SparklesElement({ element, mode }: { element: any, mode: 'translate' | 'rotate' | 'scale' }) {
  const transformRef = useRef<any>(null);
  const updateElement = useEditorStore(state => state.updateElement);
  const selectedId = useEditorStore(state => state.selectedId);
  const setSelectedId = useEditorStore(state => state.setSelectedId);
  const handleElementClick = useEditorStore(state => state.handleElementClick);
  const isSnapping = useEditorStore(state => state.isSnapping);
  const timelinePlaying = useEditorStore(state => state.timelinePlaying);
  const isSelected = selectedId === element.id && !timelinePlaying;

  useTransformLogic(element, isSelected, transformRef);

  const sparklesObj = (
    <AnimatedElementWrapper element={element}>
      <group 
        onClick={(e: any) => { e.stopPropagation(); handleElementClick(element.id, e.ctrlKey || e.metaKey || e.shiftKey, false); }}
        onPointerMissed={() => {}}
      >
        <Sparkles 
          count={element.sparkleCount || 100} 
          scale={5} 
          size={element.sparkleSize || 2} 
          color={element.sparkleColor || "#ffffff"} 
          speed={0.4} 
          noise={1} 
        />
        {isSelected && (
          <Html transform center position={[0,0,0]}>
            <div className="px-2 py-1 bg-yellow-400 text-black text-[10px] font-bold rounded shadow-lg whitespace-nowrap">
              ✨ VFX Zone
            </div>
          </Html>
        )}
        {/* Invisible hitbox */}
        <mesh visible={false} scale={[2, 2, 2]}>
           <sphereGeometry args={[1, 16, 16]} />
           <meshBasicMaterial />
        </mesh>
      </group>
    </AnimatedElementWrapper>
  );

  if (isSelected) {
    return (
      <TransformControls size={1.2} 
        ref={transformRef} 
        mode={mode} 
        position={element.position} 
        rotation={element.rotation} 
        scale={element.scale}
        translationSnap={isSnapping ? 0.5 : null}
        rotationSnap={isSnapping ? Math.PI / 12 : null}
        scaleSnap={isSnapping ? 0.5 : null}
      >
        {sparklesObj}
      </TransformControls>
    );
  }

  return (
    <group position={element.position} rotation={element.rotation} scale={element.scale}>
      {sparklesObj}
    </group>
  );
}
