"use client";

import { Suspense, useEffect, useRef, useState, useMemo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';

import { useHelper, OrbitControls, Grid, useGLTF, useTexture, TransformControls, Text, Text3D, Center, Html, useAnimations, Sparkles, Environment, GizmoHelper, GizmoViewport, PerspectiveCamera, OrthographicCamera, Box as DreiBox, Sphere, Cylinder, Plane, Cone, Torus, Tetrahedron, Icosahedron } from '@react-three/drei';
import * as THREE from 'three';
import { useEditorStore } from '@/lib/store';

function AnimatedElementWrapper({ element, children }: { element: any, children: React.ReactNode }) {
  const groupRef = useRef<THREE.Group>(null);
  
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
  });

  return <group ref={groupRef}>{children}</group>;
}

function ShapeElement({ element, mode }: { element: any, mode: 'translate' | 'rotate' | 'scale' }) {
  const transformRef = useRef<any>(null);
  const groupRef = useRef<THREE.Group>(null);
  const updateElement = useEditorStore(state => state.updateElement);
  const selectedId = useEditorStore(state => state.selectedId);
  const setSelectedId = useEditorStore(state => state.setSelectedId);
  const isSelected = selectedId === element.id;
  const isSnapping = useEditorStore(state => state.isSnapping);

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

  const shapeObj = (
    <group ref={groupRef}>
      <AnimatedElementWrapper element={element}>
        <group
          onClick={(e) => { e.stopPropagation(); setSelectedId(element.id); }}
          onPointerMissed={(e) => {
            if (e.type === 'click') setSelectedId(null);
          }}
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
      <TransformControls
        ref={transformRef}
        mode={mode}
        position={element.position as [number, number, number]}
        rotation={element.rotation as [number, number, number]}
        scale={element.scale as [number, number, number]}
        translationSnap={isSnapping ? 0.5 : null}
        rotationSnap={isSnapping ? Math.PI / 4 : null}
        scaleSnap={isSnapping ? 0.25 : null}
      >
        {shapeObj}
      </TransformControls>
    );
  }

  return (
    <group
      position={element.position as [number, number, number]}
      rotation={element.rotation as [number, number, number]}
      scale={element.scale as [number, number, number]}
    >
      {shapeObj}
    </group>
  );
}

function ModelElement({ element, mode }: { element: any, mode: 'translate' | 'rotate' | 'scale' }) {
  const { scene, animations } = useGLTF(element.url) as any;
  const transformRef = useRef<any>(null);
  const groupRef = useRef<THREE.Group>(null);
  
  const updateElement = useEditorStore(state => state.updateElement);
  const selectedId = useEditorStore(state => state.selectedId);
  const setSelectedId = useEditorStore(state => state.setSelectedId);
  const previewAnim = useEditorStore(state => state.previewAnimationData);
  const isSnapping = useEditorStore(state => state.isSnapping);

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

  const { actions } = useAnimations(animations, groupRef);

  useEffect(() => {
    if (previewAnim && previewAnim.targetId === element.id) {
      if (previewAnim.animationName === '*') {
        Object.values(actions).forEach(action => action?.reset().play());
      } else {
        const action = actions[previewAnim.animationName];
        if (action) action.reset().play();
      }
    } else {
      Object.values(actions).forEach(action => action?.stop());
    }
  }, [previewAnim, actions, element.id]);

  if (!clonedScene) return null;

  const primitiveObj = (
    <group ref={groupRef}>
      <AnimatedElementWrapper element={element}>
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
      </AnimatedElementWrapper>
    </group>
  );

  if (isSelected) {
    return (
      <TransformControls 
        ref={transformRef} 
        mode={mode} 
        position={element.position} 
        rotation={element.rotation} 
        scale={element.scale}
        translationSnap={isSnapping ? 0.5 : null}
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
    </group>
  );
}

function TextElement({ element, mode }: { element: any, mode: 'translate' | 'rotate' | 'scale' }) {
  const transformRef = useRef<any>(null);
  
  const updateElement = useEditorStore(state => state.updateElement);
  const selectedId = useEditorStore(state => state.selectedId);
  const setSelectedId = useEditorStore(state => state.setSelectedId);
  const isSnapping = useEditorStore(state => state.isSnapping);

  const isSelected = selectedId === element.id;

  const [liveText, setLiveText] = useState(element.content || '');

  // Update when editor changes it
  useEffect(() => {
    if (!element.apiEndpoint) {
      setLiveText(element.content || '');
    }
  }, [element.content, element.apiEndpoint]);

  // Real-time API Binding (IoT)
  useEffect(() => {
    if (!element.apiEndpoint) return;
    
    let isMounted = true;
    const fetchData = async () => {
      try {
        const res = await fetch(element.apiEndpoint);
        if (!res.ok) throw new Error('API Error');
        let data = await res.json();
        
        if (!isMounted) return;
        
        if (element.apiJsonPath) {
          // simple dot notation path resolution
          const value = element.apiJsonPath.split('.').reduce((o: any, i: string) => o?.[i], data);
          if (value !== undefined) setLiveText(String(value));
        } else {
          setLiveText(typeof data === 'object' ? JSON.stringify(data) : String(data));
        }
      } catch (err) {
        console.error("Failed to fetch real-time data for 3d_text", err);
      }
    };
    
    fetchData(); // initial fetch
    const interval = setInterval(fetchData, 5000); // Poll every 5s
    
    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, [element.apiEndpoint, element.apiJsonPath]);

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

  const fontUrl2D = element.fontFamily && element.fontFamily.startsWith('http') 
    ? element.fontFamily 
    : "https://fonts.gstatic.com/s/raleway/v14/1Ptrg8zYS_SKggPNwK4vaqI.woff";
    
  const fontUrl3D = element.fontFamily && !element.fontFamily.startsWith('http')
    ? `https://cdn.jsdelivr.net/npm/three/examples/fonts/${element.fontFamily}_regular.typeface.json`
    : `https://cdn.jsdelivr.net/npm/three/examples/fonts/helvetiker_regular.typeface.json`;

  const color = element.color || "#ffffff";
  const isOutline = element.textEffect === 'outline';
  const isGlow = element.textEffect === 'glow';
  
  const safeText = liveText || " ";

  const textObj = (
    <AnimatedElementWrapper element={element}>
      <group
        onClick={(e: any) => {
          e.stopPropagation();
          setSelectedId(element.id);
        }}
        onPointerMissed={(e: any) => {
          if (e.type === 'click') setSelectedId(null);
        }}
      >
        {element.is3D ? (
          <Center>
            <Text3D
              font={fontUrl3D}
              size={0.5}
              height={0.1}
              curveSegments={12}
              bevelEnabled
              bevelThickness={0.02}
              bevelSize={0.02}
              bevelOffset={0}
              bevelSegments={5}
            >
              {safeText}
              <meshStandardMaterial 
                color={color} 
                emissive={isGlow ? color : '#000000'}
                emissiveIntensity={isGlow ? 2 : 0}
                wireframe={isOutline}
              />
            </Text3D>
          </Center>
        ) : (
          <Text 
            color={color} 
            fontSize={0.5} 
            maxWidth={5} 
            lineHeight={1}
            letterSpacing={0.02} 
            textAlign="center" 
            font={fontUrl2D} 
            anchorX="center" 
            anchorY="middle"
            outlineWidth={isOutline ? 0.02 : (isGlow ? 0.05 : 0)}
            outlineColor={isOutline ? '#000000' : (isGlow ? color : 'transparent')}
            outlineOpacity={isGlow ? 0.5 : 1}
          >
            {safeText}
            {isGlow && <meshBasicMaterial color={color} />}
          </Text>
        )}
      </group>
    </AnimatedElementWrapper>
  );

  if (isSelected) {
    return (
      <TransformControls 
        ref={transformRef} 
        mode={mode} 
        position={element.position} 
        rotation={element.rotation} 
        scale={element.scale}
        translationSnap={isSnapping ? 0.5 : null}
        rotationSnap={isSnapping ? Math.PI / 12 : null}
        scaleSnap={isSnapping ? 0.5 : null}
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
  const isSnapping = useEditorStore(state => state.isSnapping);
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
    <AnimatedElementWrapper element={element}>
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
    </AnimatedElementWrapper>
  );

  if (isSelected) {
    return (
      <TransformControls 
        ref={transformRef} 
        mode={mode} 
        position={element.position} 
        rotation={element.rotation} 
        scale={element.scale}
        translationSnap={isSnapping ? 0.5 : null}
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

function AudioElement({ element, mode }: { element: any, mode: 'translate' | 'rotate' | 'scale' }) {
  const transformRef = useRef<any>(null);
  const updateElement = useEditorStore(state => state.updateElement);
  const selectedId = useEditorStore(state => state.selectedId);
  const setSelectedId = useEditorStore(state => state.setSelectedId);
  const isSnapping = useEditorStore(state => state.isSnapping);
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

  const audioObj = (
    <AnimatedElementWrapper element={element}>
      <group 
        onClick={(e: any) => { e.stopPropagation(); setSelectedId(element.id); }}
        onPointerMissed={(e: any) => { if (e.type === 'click') setSelectedId(null); }}
      >
        <Html transform center position={[0,0,0]} scale={[0.5, 0.5, 0.5]}>
          <div className={`w-12 h-12 bg-gray-800 rounded-full flex items-center justify-center text-pink-400 border border-gray-700 shadow-xl cursor-pointer ${isSelected ? 'ring-4 ring-pink-500 scale-110 transition-transform bg-gray-700' : ''}`}>
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon><path d="M15.54 8.46a5 5 0 0 1 0 7.07"></path><path d="M19.07 4.93a10 10 0 0 1 0 14.14"></path></svg>
          </div>
        </Html>
        {/* Invisible hitbox */}
        <mesh visible={false} scale={[1, 1, 1]}>
           <sphereGeometry args={[0.5, 16, 16]} />
           <meshBasicMaterial />
        </mesh>
      </group>
    </AnimatedElementWrapper>
  );

  if (isSelected) {
    return (
      <TransformControls 
        ref={transformRef} 
        mode={mode} 
        position={element.position} 
        rotation={element.rotation} 
        scale={element.scale}
        translationSnap={isSnapping ? 0.5 : null}
        rotationSnap={isSnapping ? Math.PI / 12 : null}
        scaleSnap={isSnapping ? 0.5 : null}
      >
        {audioObj}
      </TransformControls>
    );
  }

  return (
    <group position={element.position} rotation={element.rotation} scale={element.scale}>
      {audioObj}
    </group>
  );
}

function ImageElement({ element, mode }: { element: any, mode: 'translate' | 'rotate' | 'scale' }) {
  const transformRef = useRef<any>(null);
  const updateElement = useEditorStore(state => state.updateElement);
  const selectedId = useEditorStore(state => state.selectedId);
  const setSelectedId = useEditorStore(state => state.setSelectedId);
  const isSnapping = useEditorStore(state => state.isSnapping);
  const isSelected = selectedId === element.id;
  
  // Optional: load the texture (if it fails, it just won't show)
  const texture = useTexture(element.url || 'https://via.placeholder.com/150');
  
  // Calculate aspect ratio
  const tex = texture as any;
  const aspect = tex.image ? tex.image.width / tex.image.height : 1;
  const width = aspect > 1 ? 3 : 3 * aspect;
  const height = aspect > 1 ? 3 / aspect : 3;

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

  const imageObj = (
    <AnimatedElementWrapper element={element}>
      <group 
        onClick={(e: any) => { e.stopPropagation(); setSelectedId(element.id); }}
        onPointerMissed={(e: any) => { if (e.type === 'click') setSelectedId(null); }}
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
      <TransformControls 
        ref={transformRef} 
        mode={mode} 
        position={element.position as [number, number, number]} 
        rotation={element.rotation as [number, number, number]} 
        scale={element.scale as [number, number, number]}
        translationSnap={isSnapping ? 0.5 : null}
        rotationSnap={isSnapping ? Math.PI / 12 : null}
        scaleSnap={isSnapping ? 0.5 : null}
      >
        {imageObj}
      </TransformControls>
    );
  }

  return (
    <group position={element.position as [number, number, number]} rotation={element.rotation as [number, number, number]} scale={element.scale as [number, number, number]}>
      {imageObj}
    </group>
  );
}

function VideoElement({ element, mode }: { element: any, mode: 'translate' | 'rotate' | 'scale' }) {
  const transformRef = useRef<any>(null);
  const updateElement = useEditorStore(state => state.updateElement);
  const selectedId = useEditorStore(state => state.selectedId);
  const setSelectedId = useEditorStore(state => state.setSelectedId);
  const isSnapping = useEditorStore(state => state.isSnapping);
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

  const videoObj = (
    <AnimatedElementWrapper element={element}>
      <group 
        onClick={(e: any) => { e.stopPropagation(); setSelectedId(element.id); }}
        onPointerMissed={(e: any) => { if (e.type === 'click') setSelectedId(null); }}
      >
        <mesh>
          <planeGeometry args={[3, 1.68]} />
          <meshBasicMaterial color="#374151" opacity={0.8} transparent />
        </mesh>
        <Html transform center position={[0,0,0]} scale={[0.5, 0.5, 0.5]}>
          <div className={`w-16 h-16 bg-gray-800 rounded-full flex items-center justify-center text-red-400 border border-gray-700 shadow-xl cursor-pointer ${isSelected ? 'ring-4 ring-red-500 scale-110 transition-transform bg-gray-700' : ''}`}>
            <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="5 3 19 12 5 21 5 3"></polygon></svg>
          </div>
        </Html>
        {/* Invisible hitbox */}
        <mesh visible={false} scale={[3, 1.68, 0.1]}>
           <boxGeometry />
           <meshBasicMaterial />
        </mesh>
      </group>
    </AnimatedElementWrapper>
  );

  if (isSelected) {
    return (
      <TransformControls 
        ref={transformRef} 
        mode={mode} 
        position={element.position} 
        rotation={element.rotation} 
        scale={element.scale}
        translationSnap={isSnapping ? 0.5 : null}
        rotationSnap={isSnapping ? Math.PI / 12 : null}
        scaleSnap={isSnapping ? 0.5 : null}
      >
        {videoObj}
      </TransformControls>
    );
  }

  return (
    <group position={element.position} rotation={element.rotation} scale={element.scale}>
      {videoObj}
    </group>
  );
}

function SparklesElement({ element, mode }: { element: any, mode: 'translate' | 'rotate' | 'scale' }) {
  const transformRef = useRef<any>(null);
  const updateElement = useEditorStore(state => state.updateElement);
  const selectedId = useEditorStore(state => state.selectedId);
  const setSelectedId = useEditorStore(state => state.setSelectedId);
  const isSnapping = useEditorStore(state => state.isSnapping);
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

  const sparklesObj = (
    <AnimatedElementWrapper element={element}>
      <group 
        onClick={(e: any) => { e.stopPropagation(); setSelectedId(element.id); }}
        onPointerMissed={(e: any) => { if (e.type === 'click') setSelectedId(null); }}
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
      <TransformControls 
        ref={transformRef} 
        mode={mode} 
        position={element.position} 
        rotation={element.rotation} 
        scale={element.scale}
        translationSnap={isSnapping ? 0.5 : null}
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

function HotspotElement({ element, mode }: { element: any, mode: 'translate' | 'rotate' | 'scale' }) {
  const transformRef = useRef<any>(null);
  const updateElement = useEditorStore(state => state.updateElement);
  const selectedId = useEditorStore(state => state.selectedId);
  const setSelectedId = useEditorStore(state => state.setSelectedId);
  const isSnapping = useEditorStore(state => state.isSnapping);
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

  const hotspotObj = (
    <AnimatedElementWrapper element={element}>
      <group 
        onClick={(e: any) => { e.stopPropagation(); setSelectedId(element.id); }}
        onPointerMissed={(e: any) => { if (e.type === 'click') setSelectedId(null); }}
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
      <TransformControls 
        ref={transformRef} 
        mode={mode} 
        position={element.position} 
        rotation={element.rotation} 
        scale={element.scale}
        translationSnap={isSnapping ? 0.5 : null}
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
  const isSnapping = useEditorStore(state => state.isSnapping);
  const ambientLightIntensity = useEditorStore(state => state.ambientLightIntensity);
  const directionalLightIntensity = useEditorStore(state => state.directionalLightIntensity);
  const environmentMap = useEditorStore(state => state.environmentMap);
  const trackingMode = useEditorStore(state => state.trackingMode);
  const currentSceneId = useEditorStore(state => state.currentSceneId);
  const isOrthographic = useEditorStore(state => state.isOrthographic);

  return (
    <div className="w-full h-full bg-gray-900 relative">
      <Canvas onPointerMissed={() => setSelectedId(null)}>
        {isOrthographic ? (
          <OrthographicCamera makeDefault position={[0, 4, 8]} zoom={80} />
        ) : (
          <PerspectiveCamera makeDefault position={[0, 4, 8]} fov={45} />
        )}
        <color attach="background" args={['#0f172a']} />
        
        {environmentMap !== 'none' && (
          <Environment preset={environmentMap as any} background={false} />
        )}

        <ambientLight intensity={ambientLightIntensity} />
        <directionalLight position={[10, 20, 10]} intensity={directionalLightIntensity} castShadow />
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
          {trackingMode === 'image' && targetImageUrl && <TargetImage url={targetImageUrl} />}
          {trackingMode === 'face' && (
            <group position={[0, 1, 0]}>
              <mesh>
                <sphereGeometry args={[1, 32, 32]} />
                <meshBasicMaterial color="#1e293b" wireframe />
              </mesh>
              <Html center position={[0, 0, 1.2]}>
                <div className="bg-gray-800/80 text-white text-[10px] px-2 py-1 rounded-md whitespace-nowrap">Face Mesh Dummy</div>
              </Html>
            </group>
          )}
          
          {elements.filter(el => el.sceneId === currentSceneId).map(el => {
            if (el.type === '3d_shape') {
              return <ShapeElement key={el.id} element={el} mode={transformMode} />;
            }
            if (el.type === '3d_model') {
              return <ModelElement key={el.id} element={el} mode={transformMode} />;
            }
            if (el.type === '3d_text') {
              return <TextElement key={el.id} element={el} mode={transformMode} />;
            }
            if (el.type === 'ui_button') {
              return <UIButtonElement key={el.id} element={el} mode={transformMode} />;
            }
            if (el.type === 'audio') {
              return <AudioElement key={el.id} element={el} mode={transformMode} />;
            }
            if (el.type === 'image') {
              return <ImageElement key={el.id} element={el} mode={transformMode} />;
            }
            if (el.type === 'video') {
              return <VideoElement key={el.id} element={el} mode={transformMode} />;
            }
            if (el.type === 'vfx_sparkles') {
              return <SparklesElement key={el.id} element={el} mode={transformMode} />;
            }
            if (el.type === 'hotspot') {
              return <HotspotElement key={el.id} element={el} mode={transformMode} />;
            }
            return null;
          })}
        </Suspense>

        <GizmoHelper
          alignment="bottom-right"
          margin={[340, 80]}
        >
          <GizmoViewport axisColors={['#ef4444', '#22c55e', '#3b82f6']} labelColor="black" />
        </GizmoHelper>

        <OrbitControls makeDefault />
      </Canvas>
    </div>
  );
}
