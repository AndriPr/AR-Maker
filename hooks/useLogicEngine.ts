"use client";

import { Suspense, useEffect, useRef, useState, useMemo } from 'react';
import { Canvas, useFrame, useLoader } from '@react-three/fiber';

import { EffectComposer, Outline, Selection, Select } from '@react-three/postprocessing';
import { useHelper, OrbitControls, Grid, useGLTF, useTexture, TransformControls, Text, Text3D, Center, Html, useAnimations, Sparkles, Environment, GizmoHelper, GizmoViewport, PerspectiveCamera, OrthographicCamera, Box as DreiBox, Sphere, Cylinder, Plane, Cone, Torus, Tetrahedron, Icosahedron, Outlines , Line} from '@react-three/drei';
import * as THREE from 'three';
import { useEditorStore } from '@/lib/store';

// Logic Engine Hook
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

export function useLogicEngine() {
  const nodes = useEditorStore(state => state.nodes);
  const edges = useEditorStore(state => state.edges);
  const elements = useEditorStore(state => state.elements);
  const updateElement = useEditorStore(state => state.updateElement);
  const setCurrentSceneId = useEditorStore(state => state.setCurrentSceneId);
  const setPreviewAnimationData = useEditorStore(state => state.setPreviewAnimationData);
  const logicVariables = useEditorStore(state => state.logicVariables);
  const setLogicVariable = useEditorStore(state => state.setLogicVariable);

  const executeNode = (nodeId: string) => {
    const node = nodes.find(n => n.id === nodeId);
    if (!node) return;

    if (node.type === 'action') {
      const { actionType, targetId, actionValue, varName, varOperation, varValue } = node.data || {};
      if (actionType === 'play_animation' && targetId) {
        setPreviewAnimationData({ targetId, animationName: actionValue || '*' });
      } else if (actionType === 'toggle_visibility' && targetId) {
        const targetEl = useEditorStore.getState().elements.find(e => e.id === targetId);
        if (targetEl) updateElement(targetId, { isHidden: !targetEl.isHidden });
      } else if (actionType === 'open_url' && actionValue) {
        window.open(actionValue, '_blank');
      } else if (actionType === 'change_scene' && actionValue) {
        setCurrentSceneId(actionValue);
      } else if (actionType === 'play_audio' && targetId) {
        const targetEl = useEditorStore.getState().elements.find(e => e.id === targetId);
        if (targetEl) updateElement(targetId, { autoplay: !targetEl.autoplay });
      } else if (actionType === 'api_call' && actionValue) {
        const method = node.data.apiMethod || 'GET';
        fetch(actionValue, { method })
          .then(res => res.json())
          .then(data => console.log(`API Call Success (${actionValue}):`, data))
          .catch(err => console.error(`API Call Failed (${actionValue}):`, err));
      } else if (actionType === 'set_variable' && varName) {
        const currentVal = useEditorStore.getState().logicVariables[varName] || 0;
        const numVal = parseFloat(varValue) || 0;
        if (varOperation === 'add') setLogicVariable(varName, Number(currentVal) + numVal);
        else if (varOperation === 'sub') setLogicVariable(varName, Number(currentVal) - numVal);
        else setLogicVariable(varName, varValue);
      }
      
      // Continue execution to next connected nodes
      executeNextNodes(nodeId);
    } 
    else if (node.type === 'control') {
      // Handle Delay
      const delayTime = (node.data?.delayTime || 0) * 1000;
      setTimeout(() => {
        executeNextNodes(nodeId);
      }, delayTime);
    }
    else if (node.type === 'condition') {
      // Evaluate Branch
      const { varName, operator, compareValue } = node.data || {};
      const currentVal = useEditorStore.getState().logicVariables[varName || ''] || 0;
      const compVal = isNaN(Number(compareValue)) ? compareValue : Number(compareValue);
      const curValNum = isNaN(Number(currentVal)) ? currentVal : Number(currentVal);
      
      let isTrue = false;
      if (operator === '==') isTrue = curValNum == compVal;
      else if (operator === '!=') isTrue = curValNum != compVal;
      else if (operator === '>') isTrue = curValNum > compVal;
      else if (operator === '<') isTrue = curValNum < compVal;
      else if (operator === '>=') isTrue = curValNum >= compVal;
      else if (operator === '<=') isTrue = curValNum <= compVal;
      
      executeNextNodes(nodeId, isTrue ? 'true' : 'false');
    }
    else {
      // Triggers or other nodes, just pass through
      executeNextNodes(nodeId);
    }
  };

  const executeNextNodes = (sourceNodeId: string, sourceHandleId?: string) => {
    const connectedEdges = edges.filter(e => 
      e.source === sourceNodeId && 
      (!sourceHandleId || e.sourceHandle === sourceHandleId)
    );
    connectedEdges.forEach(edge => {
      executeNode(edge.target);
    });
  };

  return { executeNextNodes, executeNode };
}

// Engine component to handle per-frame proximity logic inside Canvas