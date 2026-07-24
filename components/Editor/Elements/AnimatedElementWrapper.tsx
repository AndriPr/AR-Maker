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

export function AnimatedElementWrapper({ element, children }: { element: any, children: React.ReactNode }) {
  const groupRef = useRef<THREE.Group>(null);
  
  useFrame((state, delta) => {
    if (!groupRef.current) return;
    const group = groupRef.current;
    
    // Initialize entrance animation
    if (element.entranceAnimation && element.entranceAnimation !== 'none' && group.userData.entranceProgress === undefined) {
      group.userData.entranceProgress = 0;
      if (element.entranceAnimation === 'scale') group.scale.set(0.001, 0.001, 0.001);
      if (element.entranceAnimation === 'slide-up') group.position.set(0, -2, 0);
      if (element.entranceAnimation === 'fade') {
        group.traverse((child: any) => {
          if (child.isMesh && child.material) {
            child.userData.origTransparent = child.material.transparent;
            child.material.transparent = true;
            child.material.opacity = 0;
          }
        });
      }
    }

    let currentEntranceProgress = 1;

    // Run entrance animation
    if (element.entranceAnimation && element.entranceAnimation !== 'none' && group.userData.entranceProgress < 1) {
      group.userData.entranceProgress += delta * 1.5;
      if (group.userData.entranceProgress > 1) group.userData.entranceProgress = 1;
      
      const p = group.userData.entranceProgress;
      currentEntranceProgress = p;

      if (element.entranceAnimation === 'scale') {
         group.scale.set(p, p, p);
      }
      if (element.entranceAnimation === 'slide-up') {
         group.position.set(0, -2 * (1 - p), 0);
      }
      if (element.entranceAnimation === 'fade') {
         group.traverse((child: any) => {
            if (child.isMesh && child.material) {
               child.material.opacity = p;
               if (p >= 1 && child.userData.origTransparent === false) {
                 child.material.transparent = false;
               }
            }
         });
      }
    }

    // Run idle animation
    if (element.idleAnimation && element.idleAnimation !== 'none') {
       const speed = element.idleAnimationSpeed ?? 1;
       
       if (element.idleAnimation === 'rotate' || element.idleAnimation === 'both') {
          group.rotation.y += delta * speed;
       }
       
       if (element.idleAnimation === 'hover' || element.idleAnimation === 'both') {
          const baseV = (element.entranceAnimation === 'slide-up' && currentEntranceProgress < 1) 
              ? -2 * (1 - currentEntranceProgress) : 0;
          group.position.y = baseV + Math.sin(state.clock.elapsedTime * 2 * speed) * 0.1;
       }
    }

    // Keyframe Animation (Timeline)
    if (element.keyframes && element.keyframes.length > 0) {
      const tTime = useEditorStore.getState().timelineTime;
      const keyframes = element.keyframes;
      
      if (keyframes.length === 1) {
         if (tTime >= keyframes[0].time) {
            const pos = keyframes[0].position || [0,0,0];
            const rot = keyframes[0].rotation || [0,0,0];
            const scl = keyframes[0].scale || [1,1,1];
            group.position.set(pos[0], pos[1], pos[2]);
            group.rotation.set(rot[0], rot[1], rot[2]);
            group.scale.set(scl[0], scl[1], scl[2]);
         }
      } else {
        const getBoundingKeyframes = (prop: 'position' | 'rotation' | 'scale') => {
          const propKfs = keyframes.filter((k: any) => k[prop] !== undefined);
          if (propKfs.length === 0) return null;
          if (propKfs.length === 1) return { kf1: propKfs[0], kf2: propKfs[0] };
          
          if (tTime <= propKfs[0].time) return { kf1: propKfs[0], kf2: propKfs[0] };
          if (tTime >= propKfs[propKfs.length - 1].time) return { kf1: propKfs[propKfs.length - 1], kf2: propKfs[propKfs.length - 1] };
          
          for (let i = 0; i < propKfs.length - 1; i++) {
             if (tTime >= propKfs[i].time && tTime <= propKfs[i+1].time) {
                return { kf1: propKfs[i], kf2: propKfs[i+1] };
             }
          }
          return null;
        };

        const calculateProgress = (kf1: any, kf2: any) => {
          let progress = 0;
          if (kf2.time > kf1.time) {
             progress = (tTime - kf1.time) / (kf2.time - kf1.time);
             const easing = kf1.easing || 'linear';
             if (easing === 'ease-in') {
               progress = progress * progress;
             } else if (easing === 'ease-out') {
               progress = progress * (2 - progress);
             } else if (easing === 'ease-in-out') {
               progress = progress < .5 ? 2 * progress * progress : -1 + (4 - 2 * progress) * progress;
             } else if (easing === 'bounce') {
               const n1 = 7.5625;
               const d1 = 2.75;
               let p = progress;
               if (p < 1 / d1) { progress = n1 * p * p; } 
               else if (p < 2 / d1) { progress = n1 * (p -= 1.5 / d1) * p + 0.75; } 
               else if (p < 2.5 / d1) { progress = n1 * (p -= 2.25 / d1) * p + 0.9375; } 
               else { progress = n1 * (p -= 2.625 / d1) * p + 0.984375; }
             }
          }
          return progress;
        };

        const posBounds = getBoundingKeyframes('position');
        if (posBounds && posBounds.kf1.position && posBounds.kf2.position) {
          const progress = calculateProgress(posBounds.kf1, posBounds.kf2);
          group.position.x = THREE.MathUtils.lerp(posBounds.kf1.position[0], posBounds.kf2.position[0], progress);
          group.position.y = THREE.MathUtils.lerp(posBounds.kf1.position[1], posBounds.kf2.position[1], progress);
          group.position.z = THREE.MathUtils.lerp(posBounds.kf1.position[2], posBounds.kf2.position[2], progress);
        }

        const rotBounds = getBoundingKeyframes('rotation');
        if (rotBounds && rotBounds.kf1.rotation && rotBounds.kf2.rotation) {
          const progress = calculateProgress(rotBounds.kf1, rotBounds.kf2);
          group.rotation.x = THREE.MathUtils.lerp(rotBounds.kf1.rotation[0], rotBounds.kf2.rotation[0], progress);
          group.rotation.y = THREE.MathUtils.lerp(rotBounds.kf1.rotation[1], rotBounds.kf2.rotation[1], progress);
          group.rotation.z = THREE.MathUtils.lerp(rotBounds.kf1.rotation[2], rotBounds.kf2.rotation[2], progress);
        }

        const sclBounds = getBoundingKeyframes('scale');
        if (sclBounds && sclBounds.kf1.scale && sclBounds.kf2.scale) {
          const progress = calculateProgress(sclBounds.kf1, sclBounds.kf2);
          group.scale.x = THREE.MathUtils.lerp(sclBounds.kf1.scale[0], sclBounds.kf2.scale[0], progress);
          group.scale.y = THREE.MathUtils.lerp(sclBounds.kf1.scale[1], sclBounds.kf2.scale[1], progress);
          group.scale.z = THREE.MathUtils.lerp(sclBounds.kf1.scale[2], sclBounds.kf2.scale[2], progress);
        }
      }
    }
  });

  const isSelected = useEditorStore(state => state.selectedId === element.id || state.multiSelectedIds.includes(element.id));
  const isHovered = useEditorStore(state => state.hoveredId === element.id);
  const setHoveredId = useEditorStore(state => state.setHoveredId);
  const helper = useHelper(isSelected || isHovered ? groupRef as any : null, THREE.BoxHelper, isSelected ? '#f97316' : 'white');

  useEffect(() => {
    if (helper && helper.current) {
      helper.current.raycast = () => null;
    }
  }, [helper, isSelected, isHovered]);

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


