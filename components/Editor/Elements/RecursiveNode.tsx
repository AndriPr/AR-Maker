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
import { GroupFolderElement } from '@/components/Editor/Elements/GroupFolderElement';

export function RecursiveNode({ element, elements, transformMode }: { element: any, elements: any[], transformMode: 'translate' | 'rotate' | 'scale' }) {
  const children = elements.filter(el => el.parentId === element.id);
  
  let component = null;
  if (element.type === 'group_folder') component = <GroupFolderElement element={element} mode={transformMode}>{children.map(child => <RecursiveNode key={child.id} element={child} elements={elements} transformMode={transformMode} />)}</GroupFolderElement>;
  else if (element.type === '3d_shape') component = <ShapeElement element={element} mode={transformMode} />;
  else if (element.type === '3d_model') component = <ModelElement element={element} mode={transformMode} />;
  else if (element.type === '3d_text') component = <TextElement element={element} mode={transformMode} />;
  else if (element.type === 'ui_button') component = <UIButtonElement element={element} mode={transformMode} />;
  else if (element.type === 'audio') component = <AudioElement element={element} mode={transformMode} />;
  else if (element.type === 'image') component = <ImageElement element={element} mode={transformMode} />;
  else if (element.type === 'video') component = <VideoElement element={element} mode={transformMode} />;
  else if (element.type === 'vfx_sparkles') component = <SparklesElement element={element} mode={transformMode} />;
  else if (element.type === 'hotspot') component = <HotspotElement element={element} mode={transformMode} />;
  else if (element.type === 'occluder_plane' || element.type === 'occluder_cube') component = <OccluderElement element={element} mode={transformMode} />;

  return (
    <group visible={!element.isHidden}>
      {component}
      {/* If it's NOT a group folder, but somehow has children, we render them here attached to the parent's pivot. */}
      {element.type !== 'group_folder' && children.length > 0 && (
        <group position={element.position as [number, number, number]} rotation={element.rotation as [number, number, number]} scale={element.scale as [number, number, number]}>
          {children.map(child => <RecursiveNode key={child.id} element={child} elements={elements} transformMode={transformMode} />)}
        </group>
      )}
    </group>
  );
}
