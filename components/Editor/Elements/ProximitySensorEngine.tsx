"use client";

import { useEffect, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { useEditorStore } from '@/lib/store';
import { useLogicEngine } from '@/hooks/useLogicEngine';

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

