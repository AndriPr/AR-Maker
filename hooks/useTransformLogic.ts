"use client";
import { viewportElementRefs } from '@/lib/viewportRefs';

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

export function useTransformLogic(element: any, isSelected: boolean, transformRef: React.MutableRefObject<any>) {
  const updateElement = useEditorStore(state => state.updateElement);
  
  useEffect(() => {
    if (transformRef.current && isSelected) {
      const controls = transformRef.current;
      let startPos = [0,0,0];
      
      const callbackStart = (e: any) => {
         const obj = controls.object;
         if (obj) {
            startPos = [obj.position.x, obj.position.y, obj.position.z];
         }
      };

      const callbackChange = (e: any) => {
         if (!controls.dragging) return;
         const obj = controls.object;
         if (!obj) return;
         
         const dx = obj.position.x - startPos[0];
         const dy = obj.position.y - startPos[1];
         const dz = obj.position.z - startPos[2];
         
         const state = useEditorStore.getState();
         if (state.multiSelectedIds.length > 0) {
            state.multiSelectedIds.forEach(id => {
               if (id === element.id) return; 
               const ref = viewportElementRefs[id];
               const el = state.elements.find(el => el.id === id);
               if (ref && el) {
                  ref.position.set(
                    el.position[0] + dx,
                    el.position[1] + dy,
                    el.position[2] + dz
                  );
               }
            });
         }
      };

      const callbackEnd = (e: any) => {
        const obj = controls.object;
        if (obj) {
          const dx = obj.position.x - element.position[0];
          const dy = obj.position.y - element.position[1];
          const dz = obj.position.z - element.position[2];
          
          const rx = obj.rotation.x - element.rotation[0];
          const ry = obj.rotation.y - element.rotation[1];
          const rz = obj.rotation.z - element.rotation[2];
          
          const sx = obj.scale.x - element.scale[0];
          const sy = obj.scale.y - element.scale[1];
          const sz = obj.scale.z - element.scale[2];
          
          const posChanged = Math.abs(dx) > 0.0001 || Math.abs(dy) > 0.0001 || Math.abs(dz) > 0.0001;
          const rotChanged = Math.abs(rx) > 0.0001 || Math.abs(ry) > 0.0001 || Math.abs(rz) > 0.0001;
          const scaleChanged = Math.abs(sx) > 0.0001 || Math.abs(sy) > 0.0001 || Math.abs(sz) > 0.0001;

          if (posChanged) {
            useEditorStore.getState().applyTransformDelta(element.id, [dx, dy, dz]);
          }
          
          const updates: any = {};
          if (posChanged) updates.position = [obj.position.x, obj.position.y, obj.position.z];
          if (rotChanged) updates.rotation = [obj.rotation.x, obj.rotation.y, obj.rotation.z];
          if (scaleChanged) updates.scale = [obj.scale.x, obj.scale.y, obj.scale.z];
          
          // Fallback if somehow nothing changed but event fired (unlikely)
          if (!posChanged && !rotChanged && !scaleChanged) return;

          updateElement(element.id, updates);
        }
      };

      const onChangeEnd = (e: any) => {
         if (e.value) callbackStart(e);
         else callbackEnd(e);
      };

      controls.addEventListener('dragging-changed', onChangeEnd);
      controls.addEventListener('change', callbackChange);
      
      return () => {
         controls.removeEventListener('dragging-changed', onChangeEnd);
         controls.removeEventListener('change', callbackChange);
      };
    }
  }, [isSelected, element.id, updateElement]);
}

