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
import { CameraController } from '@/components/Editor/Elements/CameraController';
import { RecursiveNode } from '@/components/Editor/Elements/RecursiveNode';
import { GroupFolderElement } from '@/components/Editor/Elements/GroupFolderElement';

export function OccluderElement({ element, mode }: { element: any, mode: 'translate' | 'rotate' | 'scale' }) {
  const isSimulating = useEditorStore(state => state.isSimulating);
  
  return (
    <AnimatedElementWrapper element={element}>
      <mesh>
        {element.type === 'occluder_cube' ? (
          <boxGeometry args={[1, 1, 1]} />
        ) : (
          <planeGeometry args={[1, 1]} />
        )}
        {/* colorWrite={false} makes the material invisible but still writes to the depth buffer, occluding anything behind it */}
        <meshBasicMaterial 
          colorWrite={!isSimulating} // Show slightly in editor, hide in simulation
          opacity={isSimulating ? 1 : 0.2}
          transparent={!isSimulating}
          color="#ff00ff"
          wireframe={!isSimulating}
        />
      </mesh>
      {!isSimulating && (
        <Html center position={[0, 0, 0]}>
          <div className="bg-[#ff00ff]/80 text-white text-[8px] px-1 py-0.5 rounded font-bold whitespace-nowrap pointer-events-none">
            OCCLUDER
          </div>
        </Html>
      )}
    </AnimatedElementWrapper>
  );
}
