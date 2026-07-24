"use client";

import { Suspense, useEffect, useRef, useState, useMemo } from 'react';
import { Canvas, useFrame, useLoader } from '@react-three/fiber';

import { EffectComposer, Outline, Selection, Select } from '@react-three/postprocessing';
import { useHelper, OrbitControls, Grid, useGLTF, useTexture, TransformControls, Text, Text3D, Center, Html, useAnimations, Sparkles, Environment, GizmoHelper, GizmoViewport, PerspectiveCamera, OrthographicCamera, Box as DreiBox, Sphere, Cylinder, Plane, Cone, Torus, Tetrahedron, Icosahedron, Outlines , Line} from '@react-three/drei';
import * as THREE from 'three';
import { useEditorStore } from '@/lib/store';

// Logic Engine Hook
import { useLogicEngine } from '@/hooks/useLogicEngine';
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

export function ProximitySensorEngine() {
  const isSimulating = useEditorStore(state => state.isSimulating);
  const elements = useEditorStore(state => state.elements);
  const nodes = useEditorStore(state => state.nodes);
  const { executeNextNodes } = useLogicEngine();
  const proximityTriggered = useRef<Set<string>>(new Set());

  useEffect(() => {
    if (isSimulating) {
      proximityTriggered.current.clear();
    }
  }, [isSimulating]);

  useFrame(({ camera }) => {
    if (!isSimulating) return;

    const proximityTriggers = nodes.filter(n => n.type === 'trigger' && n.data?.triggerType === 'on_proximity');
    proximityTriggers.forEach(triggerNode => {
      const { targetId, distance = 2 } = triggerNode.data || {};
      if (!targetId) return;

      const targetEl = elements.find(e => e.id === targetId);
      if (targetEl && targetEl.position) {
        const elPos = new THREE.Vector3(...(targetEl.position as [number, number, number]));
        const dist = camera.position.distanceTo(elPos);
        
        if (dist <= distance) {
          if (!proximityTriggered.current.has(triggerNode.id)) {
            proximityTriggered.current.add(triggerNode.id);
            executeNextNodes(triggerNode.id);
          }
        } else {
          // Reset if they move away, allowing it to trigger again
          proximityTriggered.current.delete(triggerNode.id);
        }
      }
    });
  });

  return null;
}
