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

      }
    }
  });

  const isPrimarySelected = useEditorStore(state => state.selectedId === element.id);
  const isMultiSelected = useEditorStore(state => state.multiSelectedIds.includes(element.id));
  const isHovered = useEditorStore(state => state.hoveredId === element.id);
  const setHoveredId = useEditorStore(state => state.setHoveredId);
  const helperColor = isPrimarySelected ? '#ff7f00' : isMultiSelected ? '#cc4400' : 'white';
  const helper = useHelper(isPrimarySelected || isMultiSelected || isHovered ? groupRef as any : null, THREE.BoxHelper, helperColor);

  useEffect(() => {
    if (helper && helper.current) {
      helper.current.raycast = () => null;
    }
  }, [helper, isPrimarySelected, isMultiSelected, isHovered]);

  return (
    <group 
      ref={groupRef}
      onPointerOver={(e: any) => { e.stopPropagation(); setHoveredId(element.id); }}
      onPointerOut={(e: any) => { setHoveredId(null); }}
      onDoubleClick={(e: any) => {
        e.stopPropagation();
        const setCameraFocusTarget = useEditorStore.getState().setCameraFocusTarget;
        const targetPos = new THREE.Vector3();
        if (groupRef.current) {
          (groupRef.current as any).getWorldPosition(targetPos);
          setCameraFocusTarget([targetPos.x, targetPos.y, targetPos.z]);
        }
      }}
    >
      {children}
    </group>
  );
}



