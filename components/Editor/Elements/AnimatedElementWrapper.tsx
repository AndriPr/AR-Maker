"use client";

import { useEffect, useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { useEditorStore } from '@/lib/store';

export function AnimatedElementWrapper({ element, children }: { element: any, children: React.ReactNode }) {
  const groupRef = useRef<THREE.Group>(null);
    const prevTimeRef = useRef<number | null>(null);

  const posKfs = useMemo(() => element.keyframes?.filter((k: any) => k.position !== undefined) || [], [element.keyframes]);
  const rotKfs = useMemo(() => element.keyframes?.filter((k: any) => k.rotation !== undefined) || [], [element.keyframes]);
  const sclKfs = useMemo(() => element.keyframes?.filter((k: any) => k.scale !== undefined) || [], [element.keyframes]);

  // Every animated element re-scanned the full elements array for edu_panel
  // triggers on every frame (O(n) x every animated element x 60fps). Cache the
  // result and only recompute when the elements array reference actually
  // changes (a real edit), not on every render of the useFrame loop.
  const eduPanelsCacheRef = useRef<{ elements: any[] | null, eduPanels: any[] }>({ elements: null, eduPanels: [] });
  const getEduPanels = (elements: any[]) => {
    const cache = eduPanelsCacheRef.current;
    if (cache.elements !== elements) {
      cache.elements = elements;
      cache.eduPanels = elements.filter((el: any) => el.type === 'edu_panel');
    }
    return cache.eduPanels;
  };

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

    // Keyframe Animation (Timeline & Custom Triggers)
    if (element.keyframes && element.keyframes.length > 0) {
      const stateStore = useEditorStore.getState();
      const tTimeGlobal = stateStore.timelineTime;
      const activeTriggers = stateStore.activeTriggers;
      const elements = stateStore.elements;

      // Determine if this element is targeted by an active trigger. Only
      // relevant during AR simulation/playback - while editing in the Scene
      // tab, the object must keep following the global Timeline scrubber
      // (the Properties panel's own "Tombol Aksi" UI tells users to build
      // this animation from the Timeline), otherwise it looks frozen since
      // no trigger is ever "active" outside of a live simulation.
      let isTargeted = false;
      let isActive = false;

      if (stateStore.isSimulating) {
        const eduPanels = getEduPanels(elements);
        for (const panel of eduPanels) {
          if (panel.eduCustomTriggers) {
            for (const trigger of panel.eduCustomTriggers) {
              if (trigger.targetElementId === element.id) {
                isTargeted = true;
                if (activeTriggers.includes(trigger.id)) {
                  isActive = true;
                  break;
                }
              }
            }
          }
          if (isActive) break;
        }
      }

      // Calculate local time for trigger animation
      let tTime = tTimeGlobal;

      if (isTargeted) {
        if (group.userData.localAnimTime === undefined) {
          group.userData.localAnimTime = 0;
        }
        
        const maxTime = Math.max(...element.keyframes.map((k: any) => k.time));
        const animSpeed = 1.0; // Frames per second equivalent
        
        if (isActive && group.userData.localAnimTime < maxTime) {
          group.userData.localAnimTime = Math.min(maxTime, group.userData.localAnimTime + delta * animSpeed * 10); // scale speed to timeline format (fps)
        } else if (!isActive && group.userData.localAnimTime > 0) {
          group.userData.localAnimTime = Math.max(0, group.userData.localAnimTime - delta * animSpeed * 10);
        }
        
        tTime = group.userData.localAnimTime;
      }
      
      const keyframes = element.keyframes;
      
      if (keyframes.length === 1) {
         if (tTime >= keyframes[0].time) {
            const pos = keyframes[0].position || [0,0,0];
            const rot = keyframes[0].rotation || [0,0,0];
            const scl = keyframes[0].scale || [1,1,1];
            // Keyframe values are absolute (captured from element.position at
            // record time), but this group is nested inside the outer wrapper
            // that already applies element.position/rotation/scale. Cancel
            // that base out here so the two don't compound into double the offset.
            group.position.set(pos[0] - element.position[0], pos[1] - element.position[1], pos[2] - element.position[2]);
            group.rotation.set(rot[0] - element.rotation[0], rot[1] - element.rotation[1], rot[2] - element.rotation[2]);
            group.scale.set(scl[0] / (element.scale[0] || 1), scl[1] / (element.scale[1] || 1), scl[2] / (element.scale[2] || 1));
         }
      } else {
        // Reuse the arrays already memoized above (per element.keyframes change)
        // instead of re-filtering the full keyframe list 3x every frame.
        const getBoundingKeyframes = (propKfs: any[]) => {
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

        // Keyframe values are absolute, but this group sits inside the outer
        // wrapper that already applies element.position/rotation/scale - so the
        // base is subtracted (divided out for scale) here to avoid compounding
        // into double the offset (see the single-keyframe branch above).
        const posBounds = getBoundingKeyframes(posKfs);
        if (posBounds && posBounds.kf1.position && posBounds.kf2.position) {
          const progress = calculateProgress(posBounds.kf1, posBounds.kf2);
          group.position.x = THREE.MathUtils.lerp(posBounds.kf1.position[0], posBounds.kf2.position[0], progress) - element.position[0];
          group.position.y = THREE.MathUtils.lerp(posBounds.kf1.position[1], posBounds.kf2.position[1], progress) - element.position[1];
          group.position.z = THREE.MathUtils.lerp(posBounds.kf1.position[2], posBounds.kf2.position[2], progress) - element.position[2];
        }

        const rotBounds = getBoundingKeyframes(rotKfs);
        if (rotBounds && rotBounds.kf1.rotation && rotBounds.kf2.rotation) {
          const progress = calculateProgress(rotBounds.kf1, rotBounds.kf2);
          group.rotation.x = THREE.MathUtils.lerp(rotBounds.kf1.rotation[0], rotBounds.kf2.rotation[0], progress) - element.rotation[0];
          group.rotation.y = THREE.MathUtils.lerp(rotBounds.kf1.rotation[1], rotBounds.kf2.rotation[1], progress) - element.rotation[1];
          group.rotation.z = THREE.MathUtils.lerp(rotBounds.kf1.rotation[2], rotBounds.kf2.rotation[2], progress) - element.rotation[2];
        }

        const sclBounds = getBoundingKeyframes(sclKfs);
        if (sclBounds && sclBounds.kf1.scale && sclBounds.kf2.scale) {
          const progress = calculateProgress(sclBounds.kf1, sclBounds.kf2);
          group.scale.x = THREE.MathUtils.lerp(sclBounds.kf1.scale[0], sclBounds.kf2.scale[0], progress) / (element.scale[0] || 1);
          group.scale.y = THREE.MathUtils.lerp(sclBounds.kf1.scale[1], sclBounds.kf2.scale[1], progress) / (element.scale[1] || 1);
          group.scale.z = THREE.MathUtils.lerp(sclBounds.kf1.scale[2], sclBounds.kf2.scale[2], progress) / (element.scale[2] || 1);
        }
      }
    }
  });

  const isPrimarySelected = useEditorStore(state => state.selectedId === element.id);
  const isMultiSelected = useEditorStore(state => state.multiSelectedIds.includes(element.id));
  const isHovered = useEditorStore(state => state.hoveredId === element.id);
  const setHoveredId = useEditorStore(state => state.setHoveredId);
  const isTransforming = useEditorStore(state => state.isTransforming);

  useEffect(() => {
    if (!groupRef.current) return;
    const group = groupRef.current;
    const shouldOutline = isPrimarySelected || isMultiSelected;
    const color = isPrimarySelected ? '#ff7f00' : isMultiSelected ? '#cc4400' : 'white';
    
    let outlines: any[] = [];
    if (shouldOutline) {
      const mat = new THREE.LineBasicMaterial({ color, depthTest: false, transparent: true });
      group.traverse((node: any) => {
        if (node.isMesh && node.name !== 'selection_outline' && !node.userData.isHelper) {
           const edges = new THREE.EdgesGeometry(node.geometry, 15);
           const line = new THREE.LineSegments(edges, mat);
           line.name = 'selection_outline';
           line.renderOrder = 999;
           line.raycast = () => null;
           node.add(line);
           outlines.push(line);
        }
      });
      return () => {
        outlines.forEach(line => {
           line.removeFromParent();
           line.geometry.dispose();
        });
        mat.dispose();
      };
    }
  }, [isPrimarySelected, isMultiSelected, isHovered, children]);

  return (
    <group 
      ref={groupRef}
      userData={{ elementId: element.id }}
      
      
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
