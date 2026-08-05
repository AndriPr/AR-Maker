"use client";

import { useRef } from 'react';
import { Html, TransformControls } from '@react-three/drei';
import { useEditorStore } from '@/lib/store';
import { useActionHandler } from '@/hooks/useActionHandler';
import { AnimatedElementWrapper } from '@/components/Editor/Elements/AnimatedElementWrapper';
import { useTransformLogic } from '@/hooks/useTransformLogic';

export function HotspotElement({ element, mode }: { element: any, mode: 'translate' | 'rotate' | 'scale' }) {
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

  const hotspotObj = (
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
        {/* Glowing Dot */}
        <mesh>
          <sphereGeometry args={[0.2, 16, 16]} />
          <meshBasicMaterial color="#fb923c" transparent opacity={0.8} />
        </mesh>
        <mesh scale={[1.5, 1.5, 1.5]}>
          <sphereGeometry args={[0.2, 16, 16]} />
          <meshBasicMaterial color="#f97316" transparent opacity={0.3} />
        </mesh>

        {/* Label Box */}
        <Html center position={[0, 0.5, 0]}>
          <div className={`px-3 py-2 rounded-lg text-xs font-bold whitespace-nowrap shadow-xl transition-all ${isSelected ? 'bg-orange-500 text-white ring-2 ring-white scale-110' : 'bg-gray-800 text-orange-400 border border-gray-700'}`}>
            <div className="flex items-center gap-1.5">
              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path><circle cx="12" cy="10" r="3"></circle></svg>
              {element.hotspotText || "Hotspot"}
            </div>
          </div>
        </Html>
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
        {hotspotObj}
      </TransformControls>
    );
  }

  return (
    <group position={element.position} rotation={element.rotation} scale={element.scale}>
      {hotspotObj}
    </group>
  );
}




