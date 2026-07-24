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

export function useActionHandler() {
  const isSimulating = useEditorStore(state => state.isSimulating);
  const elements = useEditorStore(state => state.elements);
  const updateElement = useEditorStore(state => state.updateElement);
  const setCurrentSceneId = useEditorStore(state => state.setCurrentSceneId);
  const setPreviewAnimationData = useEditorStore(state => state.setPreviewAnimationData);
  const nodes = useEditorStore(state => state.nodes);
  
  const { executeNextNodes } = useLogicEngine();

  return (element: any) => {
    if (!isSimulating) return false;
    
    let actionTriggered = false;

    // 1. Process Visual Logic Nodes (New Engine)
    const triggers = nodes.filter(n => n.type === 'trigger' && n.data?.triggerType === 'on_click' && n.data?.targetId === element.id);
    
    triggers.forEach(triggerNode => {
      actionTriggered = true;
      executeNextNodes(triggerNode.id);
    });

    // 2. Process legacy onClickActions
    if (element.onClickActions && element.onClickActions.length > 0) {
      element.onClickActions.forEach((action: any) => {
        if (action.type === 'play_animation' && action.targetId) {
          if (action.value === '*') {
            setPreviewAnimationData({ targetId: action.targetId, animationName: '*' });
          } else if (action.value) {
            setPreviewAnimationData({ targetId: action.targetId, animationName: action.value });
          }
        } else if (action.type === 'change_scene' && action.value) {
          setCurrentSceneId(action.value);
        } else if (action.type === 'open_url' && action.value) {
          window.open(action.value, '_blank');
        } else if (action.type === 'toggle_visibility' && action.targetId) {
          const targetEl = elements.find(e => e.id === action.targetId);
          if (targetEl) {
            updateElement(action.targetId, { isHidden: !targetEl.isHidden });
          }
        } else if (action.type === 'play_audio' && action.targetId) {
           const targetEl = elements.find(e => e.id === action.targetId);
           if (targetEl) {
              updateElement(action.targetId, { autoplay: !targetEl.autoplay }); 
           }
        }
      });
      actionTriggered = true;
    }

    if (actionTriggered) return true;

    // 3. Legacy Fallback
    if (element.onClickActionType === 'change_scene' && element.onClickActionValue) {
       setCurrentSceneId(element.onClickActionValue);
       return true;
    }
    if (element.onClickActionType === 'url' && element.onClickActionValue) {
       window.open(element.onClickActionValue, '_blank');
       return true;
    }
    if (element.onClickActionType === 'animation' && element.actionTargetId) {
       setPreviewAnimationData({ targetId: element.actionTargetId, animationName: element.actionAnimation || '*' });
       return true;
    }

    return false; 
  };
}
