"use client";

import { useRef } from 'react';
import { Html, TransformControls } from '@react-three/drei';
import { useEditorStore } from '@/lib/store';
import { useActionHandler } from '@/hooks/useActionHandler';
import { AnimatedElementWrapper } from '@/components/Editor/Elements/AnimatedElementWrapper';
import { useTransformLogic } from '@/hooks/useTransformLogic';

export function UIButtonElement({ element, mode }: { element: any, mode: 'translate' | 'rotate' | 'scale' }) {
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

  useTransformLogic(element, isSelected, transformRef);

  const handleAction = useActionHandler();

  const buttonObj = (
    <AnimatedElementWrapper element={element}>
      <group 
        onClick={(e: any) => { 
          e.stopPropagation(); 
          if (!handleAction(element)) {
            handleElementClick(element.id, e.ctrlKey || e.metaKey || e.shiftKey, false); 
          }
        }}
        onPointerMissed={() => {}}
      >
        <Html transform center position={[0,0,0]} scale={[0.5, 0.5, 0.5]}>
          <div className={`px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl font-bold shadow-2xl whitespace-nowrap cursor-pointer select-none border border-white/20 ${isSelected ? 'ring-4 ring-pln-yellow scale-105 transition-transform' : ''}`}>
            👆 {element.buttonText || 'Tombol Aksi'}
          </div>
        </Html>
        {/* Invisible hitbox */}
        <mesh visible={false} scale={[2, 0.8, 0.1]}>
           <boxGeometry />
           <meshBasicMaterial />
        </mesh>
      </group>
    </AnimatedElementWrapper>
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
        {buttonObj}
      </TransformControls>
    );
  }

  return (
    <group position={element.position} rotation={element.rotation} scale={element.scale}>
      {buttonObj}
    </group>
  );
}



