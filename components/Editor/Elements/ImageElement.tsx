"use client";
import { viewportElementRefs } from '@/lib/viewportRefs';

import { useRef } from 'react';
import { useTexture, TransformControls } from '@react-three/drei';
import * as THREE from 'three';
import { useEditorStore } from '@/lib/store';
import { AnimatedElementWrapper } from '@/components/Editor/Elements/AnimatedElementWrapper';
import { useTransformLogic } from '@/hooks/useTransformLogic';

export function ImageElement({ element, mode }: { element: any, mode: 'translate' | 'rotate' | 'scale' }) {
  const transformRef = useRef<any>(null);
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
  
  // Optional: load the texture (if it fails, it just won't show)
  const texture = useTexture(element.url || 'https://via.placeholder.com/150');
  
  // Calculate aspect ratio
  const tex = texture as any;
  const aspect = tex.image ? tex.image.width / tex.image.height : 1;
  const width = aspect > 1 ? 3 : 3 * aspect;
  const height = aspect > 1 ? 3 / aspect : 3;

  useTransformLogic(element, isSelected, transformRef);

  const imageObj = (
    <AnimatedElementWrapper element={element}>
      <group 
        onClick={(e: any) => { e.stopPropagation(); handleElementClick(element.id, e.ctrlKey || e.metaKey || e.shiftKey, false); }}
        onPointerMissed={() => {}}
      >
        <mesh>
          <planeGeometry args={[width, height]} />
          <meshBasicMaterial map={tex} transparent side={THREE.DoubleSide} />
        </mesh>
      </group>
    </AnimatedElementWrapper>
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
        rotationSnap={isSnapping ? Math.PI / 12 : null}
        scaleSnap={isSnapping ? 0.5 : null}
      >
        {imageObj}
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
      scale={element.scale as [number, number, number]}>
      {imageObj}
    </group>
  );
}



