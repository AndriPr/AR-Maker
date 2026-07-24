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
import { GroupFolderElement } from '@/components/Editor/Elements/GroupFolderElement';

export default function EditorViewport({ transformMode = 'translate', simulateMode = false }: { transformMode?: 'translate' | 'rotate' | 'scale', simulateMode?: boolean }) {
  const isSimulating = simulateMode || useEditorStore(state => state.isSimulating);
  const elements = useEditorStore(state => state.elements);
  const updateElement = useEditorStore(state => state.updateElement);
  const selectedId = useEditorStore(state => state.selectedId);
  const selectedElement = elements.find(el => el.id === selectedId);
  const setSelectedId = useEditorStore(state => state.setSelectedId);
  const handleElementClick = useEditorStore(state => state.handleElementClick);
  const targetImageUrl = useEditorStore(state => state.targetImageUrl);
  const setPreviewAnimationData = useEditorStore(state => state.setPreviewAnimationData);
  const isOrthographic = useEditorStore(state => state.isOrthographic);
  const trackingMode = useEditorStore(state => state.trackingMode);
  const setCurrentSceneId = useEditorStore(state => state.setCurrentSceneId);

  // Logic Engine Setup
  const nodes = useEditorStore(state => state.nodes);
  const { executeNextNodes } = useLogicEngine();
  const proximityTriggered = useRef<Set<string>>(new Set());
  
  useEffect(() => {
    if (isSimulating) {
      // Find "On Scene Start" triggers
      const startTriggers = nodes.filter(n => n.type === 'trigger' && n.data?.triggerType === 'on_scene_start');
      
      startTriggers.forEach(triggerNode => {
        setTimeout(() => {
          executeNextNodes(triggerNode.id);
        }, 100);
      });
      
    }
  }, [isSimulating, nodes, executeNextNodes]);

  const isSnapping = useEditorStore(state => state.isSnapping);
  const ambientLightIntensity = useEditorStore(state => state.ambientLightIntensity);
  const directionalLightIntensity = useEditorStore(state => state.directionalLightIntensity);
  const environmentMap = useEditorStore(state => state.environmentMap);
  const currentSceneId = useEditorStore(state => state.currentSceneId);

  return (
    <div className="w-full h-full bg-gray-900 relative">
      <Canvas onPointerMissed={() => setSelectedId(null)}>
        {isOrthographic ? (
          <OrthographicCamera makeDefault position={[0, 4, 8]} zoom={80} />
        ) : (
          <PerspectiveCamera makeDefault position={[0, 4, 8]} fov={45} />
        )}
        <color attach="background" args={['#0f172a']} />
        
        {environmentMap !== 'none' && (
          <Environment preset={environmentMap as any} background={false} />
        )}

        <ambientLight intensity={ambientLightIntensity} />
        <directionalLight position={[10, 20, 10]} intensity={directionalLightIntensity} castShadow />
        <spotLight position={[-10, 10, -10]} intensity={1.2} color="#818cf8" />
        
        {!simulateMode && (
          <Grid 
            infiniteGrid 
            fadeDistance={40} 
            sectionColor="#1e3a8a" 
            sectionSize={1}
            cellColor="#0f172a" 
            cellSize={0.2}
            position={[0, -0.02, 0]} 
          />
        )}
        
        <ProximitySensorEngine />
        <Suspense fallback={null}>
            {trackingMode === 'image' && targetImageUrl && <TargetImage url={targetImageUrl} />}
            {trackingMode === 'face' && (
              <group position={[0, 1, 0]}>
                <mesh>
                  <sphereGeometry args={[1, 32, 32]} />
                  <meshBasicMaterial color="#1e293b" wireframe />
                </mesh>
                <Html center position={[0, 0, 1.2]}>
                  <div className="bg-gray-800/80 text-white text-[10px] px-2 py-1 rounded-md whitespace-nowrap">Face Mesh Dummy</div>
                </Html>
              </group>
            )}
            
            {/* Render Root Elements Only (those without a parent) */}
            {elements.filter(el => el.sceneId === currentSceneId && !el.parentId).map(el => (
              <RecursiveNode key={el.id} element={el} elements={elements} transformMode={transformMode} />
            ))}
          </Suspense>

        {!simulateMode && (
          <GizmoHelper
            alignment="bottom-right"
            margin={[340, 80]}
          >
            <GizmoViewport axisColors={['#ef4444', '#22c55e', '#3b82f6']} labelColor="black" />
          </GizmoHelper>
        )}

        <CameraController />

      </Canvas>
    </div>
  );
}
