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

export function ModelElement({ element, mode }: { element: any, mode: 'translate' | 'rotate' | 'scale' }) {
  const { scene, animations } = useGLTF(element.url) as any;
  const transformRef = useRef<any>(null);
  const groupRef = useRef<THREE.Group>(null);
  
  const updateElement = useEditorStore(state => state.updateElement);
  const selectedId = useEditorStore(state => state.selectedId);
  const setSelectedId = useEditorStore(state => state.setSelectedId);
  const handleElementClick = useEditorStore(state => state.handleElementClick);
  const previewAnim = useEditorStore(state => state.previewAnimationData);
  const isSnapping = useEditorStore(state => state.isSnapping);

  const timelinePlaying = useEditorStore(state => state.timelinePlaying);
  const isSelected = selectedId === element.id && !timelinePlaying;
  
  const clonedScene = useMemo(() => {
    if (!scene) return null;
    const clone = scene.clone();
    try {
      // Phase 7: Exploded Mesh separation - optimized to REMOVE unused meshes from graph
      if (element.targetMeshName) {
        const toRemove: any[] = [];
        clone.traverse((node: any) => {
           if (node.isMesh && node.name !== element.targetMeshName) {
             toRemove.push(node);
           }
        });
        toRemove.forEach(node => {
           node.parent?.remove(node);
        });
      }

      // Center geometry to origin (Origin to Geometry)
      const box = new THREE.Box3().setFromObject(clone);
      const center = box.getCenter(new THREE.Vector3());
      clone.position.x += (clone.position.x - center.x);
      clone.position.y += (clone.position.y - center.y);
      clone.position.z += (clone.position.z - center.z);
      
      const size = box.getSize(new THREE.Vector3());
      const maxDim = Math.max(size.x, size.y, size.z);
      if (maxDim > 5) {
        const s = 3 / maxDim;
        clone.scale.set(s, s, s);
      }

      // Apply custom materials
      clone.traverse((node: any) => {
        if (node.isMesh && node.material && node.material.name) {
          if (element.customMaterials && element.customMaterials[node.material.name]) {
            node.material = node.material.clone();
            node.material.color.set(element.customMaterials[node.material.name]);
          }
        }
      });

    } catch (e) {
      console.error("Failed to process GLTF", e);
    }
    return clone;
  }, [scene, element.customMaterials]);

  useTransformLogic(element, isSelected, transformRef);

  useEffect(() => {
    if (clonedScene && !element.targetMeshName) {
      const subMeshes: {name: string, position: [number, number, number], offset: [number, number, number]}[] = [];
      clonedScene.updateMatrixWorld(true);
      clonedScene.traverse((node: any) => {
        if (node.isMesh && node.geometry) {
           const box = new THREE.Box3().setFromObject(node);
           const center = box.getCenter(new THREE.Vector3());
           subMeshes.push({
              name: node.name,
              position: [center.x, center.y, center.z],
              offset: [-center.x, -center.y, -center.z]
           });
        }
      });
      // Sort alphabetically for stable comparison
      subMeshes.sort((a, b) => a.name.localeCompare(b.name));
      
      if (JSON.stringify(element.availableSubMeshes) !== JSON.stringify(subMeshes)) {
        // Use timeout to prevent state update during render
        setTimeout(() => updateElement(element.id, { availableSubMeshes: subMeshes }), 0);
      }
    }
  }, [clonedScene, element.id, element.targetMeshName, element.availableSubMeshes, updateElement]);

  useEffect(() => {
    // Extract available animations from the GLTF model
    if (animations && animations.length > 0) {
      const animNames = animations.map((a: any) => a.name);
      // Only update if it has changed to prevent infinite loops
      if (JSON.stringify(element.availableAnimations) !== JSON.stringify(animNames)) {
        updateElement(element.id, { availableAnimations: animNames });
      }
    }
  }, [animations, element.id, element.availableAnimations, updateElement]);

  useEffect(() => {
    if (scene) {
      const matNames: string[] = [];
      scene.traverse((node: any) => {
        if (node.isMesh && node.material && node.material.name) {
          if (!matNames.includes(node.material.name)) {
            matNames.push(node.material.name);
          }
        }
      });
      if (JSON.stringify(element.availableMaterials) !== JSON.stringify(matNames)) {
        updateElement(element.id, { availableMaterials: matNames });
      }
    }
  }, [scene, element.id, element.availableMaterials, updateElement]);

  const { actions, mixer } = useAnimations(animations, groupRef);

  useEffect(() => {
    if (!actions) return;

    // Reset all actions first
    Object.values(actions).forEach(action => {
      if (action) {
        action.stop();
        action.reset();
      }
    });

    // Determine which animation to play
    let animToPlay = null;
    
    // Priority 1: previewAnim (from clicking Play in panel or Logic Node)
    if (previewAnim && previewAnim.targetId === element.id) {
      animToPlay = previewAnim.animationName;
    } 
    // Priority 2: Autoplay animation set by user
    else if (element.autoplayAnimation) {
      animToPlay = element.autoplayAnimation;
    }

    if (animToPlay) {
      const applySettings = (action: THREE.AnimationAction) => {
        // Set Speed
        const speed = element.animationSpeed !== undefined ? element.animationSpeed : 1;
        action.setEffectiveTimeScale(speed);

        // Set Loop Mode
        if (element.animationLoopMode === 'once') {
          action.setLoop(THREE.LoopOnce, 1);
          action.clampWhenFinished = true;
        } else if (element.animationLoopMode === 'pingpong') {
          action.setLoop(THREE.LoopPingPong, Infinity);
        } else {
          // Default loop
          action.setLoop(THREE.LoopRepeat, Infinity);
        }
        
        action.play();
      };

      if (animToPlay === '*') {
        Object.values(actions).forEach(action => {
          if (action) applySettings(action);
        });
      } else {
        const action = actions[animToPlay];
        if (action) applySettings(action);
      }
    }
  }, [previewAnim, actions, element.id, element.autoplayAnimation, element.animationLoopMode, element.animationSpeed, mixer]);


  if (!clonedScene) return null;

  const primitiveObj = (
    <group ref={groupRef}>
      <AnimatedElementWrapper element={element}>
        <group position={element.meshPositionOffset || [0, 0, 0]}>
          <primitive dispose={null} object={clonedScene} 
            onClick={(e: any) => {
              e.stopPropagation();
              handleElementClick(element.id, e.ctrlKey || e.metaKey || e.shiftKey, false);
            }}
            onPointerMissed={() => {}}
          />
        </group>
      </AnimatedElementWrapper>
    </group>
  );

  if (isSelected) {
    return (
      <TransformControls size={1.2} 
        ref={transformRef} 
        mode={mode} 
        position={element.position} 
        rotation={element.rotation} 
        scale={element.scale}
        translationSnap={isSnapping ? 0.5 : null}
        rotationSnap={isSnapping ? Math.PI / 12 : null}
        scaleSnap={isSnapping ? 0.5 : null}
      >
        {primitiveObj}
      </TransformControls>
    );
  }

  return (
    <group position={element.position} rotation={element.rotation} scale={element.scale}>
      {primitiveObj}
    </group>
  );
}
