"use client";
import { viewportElementRefs } from '@/lib/viewportRefs';

import { useRef } from 'react';
import { TransformControls, Box as DreiBox, Sphere, Cylinder, Plane, Cone, Torus, Tetrahedron, Icosahedron } from '@react-three/drei';
import * as THREE from 'three';
import { useEditorStore } from '@/lib/store';
import { AnimatedElementWrapper } from '@/components/Editor/Elements/AnimatedElementWrapper';
import { useTransformLogic } from '@/hooks/useTransformLogic';

export function ShapeElement({ element, mode }: { element: any, mode: 'translate' | 'rotate' | 'scale' }) {
  const transformRef = useRef<any>(null);
  const groupRef = useRef<THREE.Group>(null);
  const updateElement = useEditorStore(state => state.updateElement);
  const selectedId = useEditorStore(state => state.selectedId);
  const setSelectedId = useEditorStore(state => state.setSelectedId);
  const handleElementClick = useEditorStore(state => state.handleElementClick);
  const timelinePlaying = useEditorStore(state => state.timelinePlaying);
  const isSimulating = useEditorStore(state => state.isSimulating);
  const isSelected = selectedId === element.id && !timelinePlaying && !isSimulating;
  const isSnapping = useEditorStore(state => state.isSnapping);
  const axisLock = useEditorStore(state => state.axisLock);
  const transformSpace = useEditorStore(state => state.transformSpace);
  const snapGrid = useEditorStore(state => state.snapGrid);

  useTransformLogic(element, isSelected, transformRef);

  const shapeObj = (
    <group ref={groupRef}>
      <AnimatedElementWrapper element={element}>
        <group
          onClick={(e) => { e.stopPropagation(); handleElementClick(element.id, e.ctrlKey || e.metaKey || e.shiftKey, false); }}
          onPointerMissed={() => {}}
        >
          {element.shapeType === 'cube' && <DreiBox args={[1, 1, 1]}><meshStandardMaterial color={element.color || '#ffffff'} /></DreiBox>}
          {element.shapeType === 'sphere' && <Sphere args={[0.5, 32, 32]}><meshStandardMaterial color={element.color || '#ffffff'} /></Sphere>}
          {element.shapeType === 'cylinder' && <Cylinder args={[0.5, 0.5, 1, 32]}><meshStandardMaterial color={element.color || '#ffffff'} /></Cylinder>}
          {element.shapeType === 'plane' && <Plane args={[1, 1]}><meshStandardMaterial color={element.color || '#ffffff'} side={THREE.DoubleSide} /></Plane>}
          {element.shapeType === 'cone' && <Cone args={[0.5, 1, 32]}><meshStandardMaterial color={element.color || '#ffffff'} /></Cone>}
          {element.shapeType === 'torus' && <Torus args={[0.4, 0.1, 16, 100]}><meshStandardMaterial color={element.color || '#ffffff'} /></Torus>}
          {element.shapeType === 'tetrahedron' && <Tetrahedron args={[0.6]}><meshStandardMaterial color={element.color || '#ffffff'} /></Tetrahedron>}
          {element.shapeType === 'icosahedron' && <Icosahedron args={[0.5]}><meshStandardMaterial color={element.color || '#ffffff'} /></Icosahedron>}
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
        {shapeObj}
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
      <group position={element.meshPositionOffset || [0, 0, 0]}>
        {shapeObj}
      </group>
    </group>
  );
}



