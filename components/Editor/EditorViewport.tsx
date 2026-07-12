"use client";

import { Suspense, useEffect, useRef, useState, useMemo } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Grid, useGLTF, useTexture, TransformControls, Text, Html } from '@react-three/drei';
import * as THREE from 'three';
import { useEditorStore } from '@/lib/store';

function ModelElement({ element, mode }: { element: any, mode: 'translate' | 'rotate' | 'scale' }) {
  const { scene, animations } = useGLTF(element.url) as any;
  const transformRef = useRef<any>(null);
  
  const updateElement = useEditorStore(state => state.updateElement);
  const selectedId = useEditorStore(state => state.selectedId);
  const setSelectedId = useEditorStore(state => state.setSelectedId);

  const isSelected = selectedId === element.id;
  
  const clonedScene = useMemo(() => {
    if (!scene) return null;
    const clone = scene.clone();
    try {
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
    } catch (e) {
      console.error("Failed to process GLTF", e);
    }
    return clone;
  }, [scene]);

  useEffect(() => {
    if (transformRef.current && isSelected) {
      const controls = transformRef.current;
      const callback = (e: any) => {
        if (e.value) return; // dragging started
        const obj = controls.object;
        if (obj) {
          updateElement(element.id, {
            position: [obj.position.x, obj.position.y, obj.position.z],
            rotation: [obj.rotation.x, obj.rotation.y, obj.rotation.z],
            scale: [obj.scale.x, obj.scale.y, obj.scale.z]
          });
        }
      };
      controls.addEventListener('dragging-changed', callback);
      return () => controls.removeEventListener('dragging-changed', callback);
    }
  }, [isSelected, element.id, updateElement]);

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

  if (!clonedScene) return null;

  const primitiveObj = (
    <primitive 
      object={clonedScene} 
      onClick={(e: any) => {
        e.stopPropagation();
        setSelectedId(element.id);
      }}
      onPointerMissed={(e: any) => {
        if (e.type === 'click') setSelectedId(null);
      }}
    />
  );

  if (isSelected) {
    return (
      <TransformControls 
        ref={transformRef} 
        mode={mode} 
        position={element.position} 
        rotation={element.rotation} 
        scale={element.scale}
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

function TextElement({ element, mode }: { element: any, mode: 'translate' | 'rotate' | 'scale' }) {
  const transformRef = useRef<any>(null);
  
  const updateElement = useEditorStore(state => state.updateElement);
  const selectedId = useEditorStore(state => state.selectedId);
  const setSelectedId = useEditorStore(state => state.setSelectedId);

  const isSelected = selectedId === element.id;

  useEffect(() => {
    if (transformRef.current && isSelected) {
      const controls = transformRef.current;
      const callback = (e: any) => {
        if (e.value) return; // dragging started
        const obj = controls.object;
        if (obj) {
          updateElement(element.id, {
            position: [obj.position.x, obj.position.y, obj.position.z],
            rotation: [obj.rotation.x, obj.rotation.y, obj.rotation.z],
            scale: [obj.scale.x, obj.scale.y, obj.scale.z]
          });
        }
      };
      controls.addEventListener('dragging-changed', callback);
      return () => controls.removeEventListener('dragging-changed', callback);
    }
  }, [isSelected, element.id, updateElement]);

  const textObj = (
    <Text 
      color={element.color || "#ffffff"} 
      fontSize={0.5} 
      maxWidth={5} 
      lineHeight={1}
      letterSpacing={0.02} 
      textAlign="center" 
      font="https://fonts.gstatic.com/s/raleway/v14/1Ptrg8zYS_SKggPNwK4vaqI.woff" 
      anchorX="center" 
      anchorY="middle"
      onClick={(e: any) => {
        e.stopPropagation();
        setSelectedId(element.id);
      }}
      onPointerMissed={(e: any) => {
        if (e.type === 'click') setSelectedId(null);
      }}
    >
      {element.content}
    </Text>
  );

  if (isSelected) {
    return (
      <TransformControls 
        ref={transformRef} 
        mode={mode} 
        position={element.position} 
        rotation={element.rotation} 
        scale={element.scale}
      >
        {textObj}
      </TransformControls>
    );
  }

  return (
    <group position={element.position} rotation={element.rotation} scale={element.scale}>
      {textObj}
    </group>
  );
}

function UIButtonElement({ element, mode }: { element: any, mode: 'translate' | 'rotate' | 'scale' }) {
  const transformRef = useRef<any>(null);
  const updateElement = useEditorStore(state => state.updateElement);
  const selectedId = useEditorStore(state => state.selectedId);
  const setSelectedId = useEditorStore(state => state.setSelectedId);
  const isSelected = selectedId === element.id;

  useEffect(() => {
    if (transformRef.current && isSelected) {
      const controls = transformRef.current;
      const callback = (e: any) => {
        if (e.value) return; 
        const obj = controls.object;
        if (obj) {
          updateElement(element.id, {
            position: [obj.position.x, obj.position.y, obj.position.z],
            rotation: [obj.rotation.x, obj.rotation.y, obj.rotation.z],
            scale: [obj.scale.x, obj.scale.y, obj.scale.z]
          });
        }
      };
      controls.addEventListener('dragging-changed', callback);
      return () => controls.removeEventListener('dragging-changed', callback);
    }
  }, [isSelected, element.id, updateElement]);

  const buttonObj = (
    <group 
      onClick={(e: any) => { e.stopPropagation(); setSelectedId(element.id); }}
      onPointerMissed={(e: any) => { if (e.type === 'click') setSelectedId(null); }}
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
  );

  if (isSelected) {
    return (
      <TransformControls ref={transformRef} mode={mode} position={element.position} rotation={element.rotation} scale={element.scale}>
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


function TargetImage({ url }: { url: string }) {
  const texture = useTexture(url);
  const img = texture.image as any;
  const aspect = img ? img.width / img.height : 1;
  const width = 3;
  const height = width / aspect;

  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.01, 0]}>
      <planeGeometry args={[width, height]} />
      <meshBasicMaterial map={texture} side={THREE.DoubleSide} transparent opacity={0.8} />
    </mesh>
  );
}

export default function EditorViewport({ transformMode = 'translate' }: { transformMode?: 'translate' | 'rotate' | 'scale' }) {
  const targetImageUrl = useEditorStore(state => state.targetImageUrl);
  const elements = useEditorStore(state => state.elements);
  const setSelectedId = useEditorStore(state => state.setSelectedId);

  return (
    <div className="w-full h-full bg-gray-900 relative">
      <Canvas camera={{ position: [0, 4, 8], fov: 45 }} onPointerMissed={() => setSelectedId(null)}>
        <color attach="background" args={['#0f172a']} />
        <ambientLight intensity={0.8} />
        <directionalLight position={[10, 20, 10]} intensity={1.8} castShadow />
        <spotLight position={[-10, 10, -10]} intensity={1.2} color="#818cf8" />
        
        <Grid 
          infiniteGrid 
          fadeDistance={40} 
          sectionColor="#1e3a8a" 
          sectionSize={1}
          cellColor="#0f172a" 
          cellSize={0.2}
          position={[0, -0.02, 0]} 
        />
        
        <Suspense fallback={null}>
          {targetImageUrl && <TargetImage url={targetImageUrl} />}
          
          {elements.map(el => {
            if (el.type === '3d_model') {
              return <ModelElement key={el.id} element={el} mode={transformMode} />;
            }
            if (el.type === '3d_text') {
              return <TextElement key={el.id} element={el} mode={transformMode} />;
            }
            if (el.type === 'ui_button') {
              return <UIButtonElement key={el.id} element={el} mode={transformMode} />;
            }
            return null;
          })}
        </Suspense>

        <OrbitControls makeDefault />
      </Canvas>
    </div>
  );
}
