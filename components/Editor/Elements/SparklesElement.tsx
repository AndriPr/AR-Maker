"use client";

import { useRef } from 'react';
import { Sparkles, Html, TransformControls } from '@react-three/drei';
import { useEditorStore } from '@/lib/store';
import { AnimatedElementWrapper } from '@/components/Editor/Elements/AnimatedElementWrapper';
import { useTransformLogic } from '@/hooks/useTransformLogic';

export function SparklesElement({ element, mode }: { element: any, mode: 'translate' | 'rotate' | 'scale' }) {
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

  const sparklesObj = (
    <AnimatedElementWrapper element={element}>
      <group 
        onClick={(e: any) => { e.stopPropagation(); handleElementClick(element.id, e.ctrlKey || e.metaKey || e.shiftKey, false); }}
        onPointerMissed={() => {}}
      >
        <Sparkles 
          count={element.sparkleCount || 100} 
          scale={5} 
          size={element.sparkleSize || 2} 
          color={element.sparkleColor || "#ffffff"} 
          speed={0.4} 
          noise={1} 
        />
        {isSelected && (
          <Html transform center position={[0,0,0]}>
            <div className="px-2 py-1 bg-yellow-400 text-black text-[10px] font-bold rounded shadow-lg whitespace-nowrap">
              ✨ VFX Zone
            </div>
          </Html>
        )}
        {/* Invisible hitbox */}
        <mesh visible={false} scale={[2, 2, 2]}>
           <sphereGeometry args={[1, 16, 16]} />
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
        {sparklesObj}
      </TransformControls>
    );
  }

  return (
    <group position={element.position} rotation={element.rotation} scale={element.scale}>
      {sparklesObj}
    </group>
  );
}



