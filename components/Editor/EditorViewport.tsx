"use client";

import { Suspense, useEffect, useRef, useState, useMemo } from 'react';
import { Canvas, useFrame, useLoader, useThree } from '@react-three/fiber';
import { GLTFExporter } from 'three/examples/jsm/exporters/GLTFExporter.js';

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

function ExporterComponent() {
  const { scene } = useThree();

  useEffect(() => {
    const handleExport = () => {
      const exporter = new GLTFExporter();
      exporter.parse(
        scene,
        (gltf) => {
          if (gltf instanceof ArrayBuffer) {
            const blob = new Blob([gltf], { type: 'application/octet-stream' });
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.style.display = 'none';
            link.href = url;
            link.download = 'ar-maker-export.glb';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(url);
          }
        },
        (error) => {
          console.error('An error happened during parsing', error);
        },
        { binary: true }
      );
    };

    window.addEventListener('export-glb', handleExport);
    return () => window.removeEventListener('export-glb', handleExport);
  }, [scene]);

  return null;
}

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
  const viewportShading = useEditorStore(state => state.viewportShading);
  const setViewportShading = useEditorStore(state => state.setViewportShading);

  return (
    <div className="w-full h-full bg-[#242424] relative">
      {/* Viewport Shading Toggles (Blender-like) */}
      {!simulateMode && (
        <div className="absolute top-4 right-28 z-10 flex bg-[#1a1b1e] rounded-md border border-[#2b2d31] p-0.5 shadow-lg">
          <button 
            onClick={() => setViewportShading('wireframe')}
            className={`p-1.5 rounded transition-colors ${viewportShading === 'wireframe' ? 'bg-[#4a4d53] text-white' : 'text-gray-400 hover:text-white hover:bg-[#2b2d31]'}`}
            title="Wireframe"
          >
            <div className="w-4 h-4 rounded-full border-2 border-current border-dashed opacity-80" />
          </button>
          <button 
            onClick={() => setViewportShading('solid')}
            className={`p-1.5 rounded transition-colors ${viewportShading === 'solid' ? 'bg-[#4a4d53] text-white' : 'text-gray-400 hover:text-white hover:bg-[#2b2d31]'}`}
            title="Solid"
          >
            <div className="w-4 h-4 rounded-full bg-current opacity-80" />
          </button>
        </div>
      )}

      <Canvas onPointerMissed={() => setSelectedId(null)}>
        <ExporterComponent />
        {isOrthographic ? (
          <OrthographicCamera makeDefault position={[0, 4, 8]} zoom={80} />
        ) : (
          <PerspectiveCamera makeDefault position={[0, 4, 8]} fov={45} />
        )}
        <color attach="background" args={['#242424']} />
        
        {environmentMap !== 'none' && (
          <Environment preset={environmentMap as any} background={false} />
        )}

        <ambientLight intensity={ambientLightIntensity} />
        <directionalLight position={[10, 20, 10]} intensity={directionalLightIntensity} castShadow />
        <spotLight position={[-10, 10, -10]} intensity={1.2} color="#818cf8" />
        
        {!simulateMode && (
          <>
            <Grid 
              infiniteGrid 
              fadeDistance={40} 
              sectionColor="#4b4d52" 
              sectionSize={1}
              cellColor="#36393f" 
              cellSize={0.2}
              position={[0, -0.02, 0]} 
            />
            {/* Infinite X and Y Axes lines */}
            <group position={[0, -0.015, 0]}>
              <mesh rotation={[-Math.PI / 2, 0, 0]}>
                <planeGeometry args={[80, 0.02]} />
                <meshBasicMaterial color="#ff3333" />
              </mesh>
              <mesh rotation={[-Math.PI / 2, 0, Math.PI / 2]}>
                <planeGeometry args={[80, 0.02]} />
                <meshBasicMaterial color="#33ff33" />
              </mesh>
            </group>
          </>
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
            alignment="top-right"
            margin={[50, 50]}
          >
            <GizmoViewport axisColors={['#ff3333', '#33ff33', '#3333ff']} labelColor="white" />
          </GizmoHelper>
        )}

        <CameraController />

      </Canvas>
    </div>
  );
}
