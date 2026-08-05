"use client";

import { Suspense, useEffect, useRef, useState, useMemo } from 'react';
import { Canvas, useFrame, useLoader } from '@react-three/fiber';

import { EffectComposer, Outline, Selection, Select } from '@react-three/postprocessing';
import { useHelper, OrbitControls, Grid, useGLTF, useTexture, TransformControls, Text, Text3D, Center, Html, useAnimations, Sparkles, Environment, GizmoHelper, GizmoViewport, PerspectiveCamera, OrthographicCamera, Box as DreiBox, Sphere, Cylinder, Plane, Cone, Torus, Tetrahedron, Icosahedron, Outlines , Line, Edges} from '@react-three/drei';
import * as THREE from 'three';
import { useEditorStore } from '@/lib/store';

// Custom Selection Pointer
const SelectionPointer = ({ targetRef }: { targetRef: React.RefObject<THREE.Group | null> }) => {
  const pointerGroupRef = useRef<THREE.Group>(null);

  useFrame(() => {
    if (targetRef.current && pointerGroupRef.current) {
      const box = new THREE.Box3().setFromObject(targetRef.current);
      if (box.isEmpty()) return;
      
      const c = new THREE.Vector3();
      box.getCenter(c);
      
      const size = new THREE.Vector3();
      box.getSize(size);
      
      // Place pointer slightly above the object
      c.y += size.y / 2 + 0.1;
      
      // Convert world center to local space of the group
      targetRef.current.worldToLocal(c);
      
      pointerGroupRef.current.position.copy(c);
    }
  });

  return (
    <group ref={pointerGroupRef}>
      <Html center zIndexRange={[100, 0]} transform={false}>
        <div className="flex flex-col items-center pointer-events-none animate-bounce" style={{ pointerEvents: 'none' }}>
          <div className="w-8 h-8 bg-pln-blue text-white rounded-full flex items-center justify-center shadow-[0_0_15px_rgba(14,165,233,0.5)] border border-white/50 backdrop-blur-md">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10"></circle>
              <circle cx="12" cy="12" r="3"></circle>
            </svg>
          </div>
          <div className="w-0.5 h-6 bg-gradient-to-b from-pln-blue to-transparent mt-1" />
        </div>
      </Html>
    </group>
  );
};

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


// --- Deep Edu Dashboard: Sub-Mesh Animator ---
const SubMeshAnimator = ({ scene, elementId }: { scene: THREE.Group, elementId: string }) => {
  const elements = useEditorStore(state => state.elements);
  const currentARStepIndex = useEditorStore(state => state.currentARStepIndex);
  const arPlaybackProgress = useEditorStore(state => state.arPlaybackProgress);

  useFrame(() => {
    const eduPanel = elements.find(el => el.type === 'edu_panel');
    if (!eduPanel) return;
    const modules = eduPanel.eduMaintenanceTasks || [];
    if (modules.length === 0) return;
    const activeModule = modules[0];
    const steps = activeModule.steps || [];
    if (steps.length === 0) return;
    const currentStep = steps[currentARStepIndex];
    if (!currentStep) return;

    currentStep.animations?.forEach(anim => {
      // In a full implementation, we'd check anim.targetElementId === elementId
      const mesh = scene.getObjectByName(anim.targetSubMeshName);
      if (!mesh) return;

      if (anim.keyframes && anim.keyframes.length >= 2) {
        const kfStart = anim.keyframes[0];
        const kfEnd = anim.keyframes[1];
        
        const startPos = new THREE.Vector3(...kfStart.position);
        const endPos = new THREE.Vector3(...kfEnd.position);
        mesh.position.lerpVectors(startPos, endPos, arPlaybackProgress);
        
        const qStart = new THREE.Quaternion().setFromEuler(new THREE.Euler(...kfStart.rotation));
        const qEnd = new THREE.Quaternion().setFromEuler(new THREE.Euler(...kfEnd.rotation));
        mesh.quaternion.slerpQuaternions(qStart, qEnd, arPlaybackProgress);
        
        const startScale = new THREE.Vector3(...kfStart.scale);
        const endScale = new THREE.Vector3(...kfEnd.scale);
        mesh.scale.lerpVectors(startScale, endScale, arPlaybackProgress);
      }
    });
  });

  return null;
}
// ---------------------------------------------

// Logical Object Helper for Multi-material Meshes
const isLogicalObject = (node: any) => {
  if (node.isMesh) {
    const parent = node.parent;
    if (parent && parent.isGroup && parent.children.length > 0 && parent.children.every((c: any) => c.isMesh && c.name.startsWith(parent.name + '_'))) {
      return false;
    }
    return true;
  }
  if (node.isGroup) {
    if (node.children.length > 0 && node.children.every((c: any) => c.isMesh && c.name.startsWith(node.name + '_'))) {
      return true;
    }
  }
  return false;
};

export function ModelElement({ element, mode }: { element: any, mode: 'translate' | 'rotate' | 'scale' }) {
  const { scene, animations } = useGLTF(element.url) as any;
  const transformRef = useRef<any>(null);
  const groupRef = useRef<THREE.Group>(null);
  
  const updateElement = useEditorStore(state => state.updateElement);
  const selectedId = useEditorStore(state => state.selectedId);
  const setSelectedId = useEditorStore(state => state.setSelectedId);
  const handleElementClick = useEditorStore(state => state.handleElementClick);
  const hoveredId = useEditorStore(state => state.hoveredId);
  const previewAnim = useEditorStore(state => state.previewAnimationData);
  const isSnapping = useEditorStore(state => state.isSnapping);
  const axisLock = useEditorStore(state => state.axisLock);
  const transformSpace = useEditorStore(state => state.transformSpace);
  const snapGrid = useEditorStore(state => state.snapGrid);

  const timelinePlaying = useEditorStore(state => state.timelinePlaying);
  const isSimulating = useEditorStore(state => state.isSimulating);
  const isSelected = selectedId === element.id && !timelinePlaying && !isSimulating;
  const isSelectedInAR = selectedId === element.id && isSimulating;
  
  const clonedScene = useMemo(() => {
    if (!scene) return null;
    
    try {
      // PERF OPTIMIZATION: If we are extracting a specific sub-mesh, DON'T clone the entire scene!
      if (element.targetMeshName && !element.meshPositionOffset) {
          let targetNode: any = null;
          scene.traverse((node: any) => { // traverse original scene!
             if (isLogicalObject(node) && node.name === element.targetMeshName) {
               targetNode = node;
             }
          });
          
          if (targetNode) {
             const newObj = targetNode.clone(false); // Only clone the targeted object
             if (targetNode.isGroup && targetNode.children.length > 0 && targetNode.children.every((c: any) => c.isMesh && c.name.startsWith(targetNode.name + '_'))) {
                targetNode.children.forEach((c: any) => {
                   newObj.add(c.clone(false));
                });
             }
             
             newObj.position.set(0, 0, 0);
             newObj.quaternion.identity();
             newObj.scale.set(1, 1, 1);
             
             newObj.traverse((child: any) => {
               if (child.isMesh && child.material && child.material.name) {
                 if (element.customMaterials && element.customMaterials[child.material.name]) {
                   child.material = child.material.clone();
                   child.material.color.set(element.customMaterials[child.material.name]);
                 }
               }
             });
             
             const newGroup = new THREE.Group();
             newGroup.add(newObj);
             return newGroup;
          }
      }
      
      const clone = scene.clone();
      if (element.targetMeshName && element.meshPositionOffset) {
          const toRemove: any[] = [];
          clone.traverse((node: any) => {
             if (node.isMesh && node.name !== element.targetMeshName) {
               toRemove.push(node);
             }
          });
          toRemove.forEach((node: any) => {
             if (node.parent) node.parent.remove(node);
          });
      }

      // Auto-centering and auto-scaling have been removed.
      // This ensures that meshes exported from Blender (especially when exploded)
      // maintain their original positions, origins, and sizes.


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
      const subMeshes: {name: string, position: [number, number, number], offset: [number, number, number], quaternion: [number, number, number, number], scale: [number, number, number]}[] = [];
      clonedScene.updateMatrixWorld(true);
      clonedScene.traverse((node: any) => {
        if (isLogicalObject(node)) {
           const pos = new THREE.Vector3();
           const quat = new THREE.Quaternion();
           const scale = new THREE.Vector3();
           node.getWorldPosition(pos);
           node.getWorldQuaternion(quat);
           node.getWorldScale(scale);
           
           const box = new THREE.Box3().setFromObject(node);
           const center = box.getCenter(new THREE.Vector3());
           
           subMeshes.push({
              name: node.name,
              position: [pos.x, pos.y, pos.z],
              quaternion: [quat.x, quat.y, quat.z, quat.w],
              scale: [scale.x, scale.y, scale.z],
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
    <group ref={groupRef as any} userData={{ elementId: element.id }}>
      <AnimatedElementWrapper element={element}>
        <group position={element.meshPositionOffset || [0, 0, 0]}>
          {!element.targetMeshName && <SubMeshAnimator scene={clonedScene as any} elementId={element.id} />}
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
      <TransformControls size={0.7} space={transformSpace} showX={axisLock === null || axisLock === "x"} showY={axisLock === null || axisLock === "y"} showZ={axisLock === null || axisLock === "z"} 
        ref={transformRef} 
        mode={mode} 
        position={element.position} 
        rotation={element.rotation} 
        scale={element.scale}
        translationSnap={isSnapping ? snapGrid : null}
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
      {isSelectedInAR && <SelectionPointer targetRef={groupRef} />}
      {hoveredId === element.id && <SelectionPointer targetRef={groupRef} />}
    </group>
  );
}

