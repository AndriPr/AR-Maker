"use client";

import { useRef } from 'react';
import { TransformControls } from '@react-three/drei';
import * as THREE from 'three';
import { useEditorStore } from '@/lib/store';
import { AnimatedElementWrapper } from '@/components/Editor/Elements/AnimatedElementWrapper';
import { useTransformLogic } from '@/hooks/useTransformLogic';
// Shared with ShapeElement/ImageElement - previously this file declared its own
// disconnected local object here, so multi-select drag never found group folders
// (useTransformLogic looks refs up from this shared module).
import { viewportElementRefs } from '@/lib/viewportRefs';

export function GroupFolderElement({ element, mode, children }: { element: any, mode: 'translate' | 'rotate' | 'scale', children: React.ReactNode }) {
  const transformRef = useRef<any>(null);
  const groupRef = useRef<THREE.Group>(null);
  const updateElement = useEditorStore(state => state.updateElement);
  const selectedId = useEditorStore(state => state.selectedId);
  const setSelectedId = useEditorStore(state => state.setSelectedId);
  const handleElementClick = useEditorStore(state => state.handleElementClick);
  const isSnapping = useEditorStore(state => state.isSnapping);
  const axisLock = useEditorStore(state => state.axisLock);
  const transformSpace = useEditorStore(state => state.transformSpace);
  const snapGrid = useEditorStore(state => state.snapGrid);
  const timelinePlaying = useEditorStore(state => state.timelinePlaying);
  const isSimulating = useEditorStore(state => state.isSimulating);
  const isSelected = selectedId === element.id && !timelinePlaying && !isSimulating;

  useTransformLogic(element, isSelected, transformRef);

  const groupObj = (
    <group ref={groupRef}>
      <AnimatedElementWrapper element={element}>
        <group
          onClick={(e: any) => { e.stopPropagation(); handleElementClick(element.id, e.ctrlKey || e.metaKey || e.shiftKey, false); }}
          onPointerMissed={() => {}}
        >

          {children}
        </group>
      </AnimatedElementWrapper>
    </group>
  );

  if (isSelected) {
    return (
      <TransformControls size={0.7} space={transformSpace} showX={axisLock === null || axisLock === "x"} showY={axisLock === null || axisLock === "y"} showZ={axisLock === null || axisLock === "z"}
        ref={transformRef}
        mode={mode}
        position={element.position as [number, number, number]}
        rotation={element.rotation as [number, number, number]}
        scale={element.scale as [number, number, number]}
        translationSnap={isSnapping ? snapGrid : null}
        rotationSnap={isSnapping ? Math.PI / 4 : null}
        scaleSnap={isSnapping ? 0.25 : null}
      >
        {groupObj}
      </TransformControls>
    );
  }

  return (
    <group
      ref={(r) => {
        if (r) viewportElementRefs[element.id] = r;
        else delete viewportElementRefs[element.id];
      }}
      position={element.position as [number, number, number]}
      rotation={element.rotation as [number, number, number]}
      scale={element.scale as [number, number, number]}
    >
      {groupObj}
    </group>
  );
}



