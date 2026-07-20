"use client";

import { Suspense, useEffect, useRef, useState, useMemo } from 'react';
import { Canvas, useFrame, useLoader } from '@react-three/fiber';

import { useHelper, OrbitControls, Grid, useGLTF, useTexture, TransformControls, Text, Text3D, Center, Html, useAnimations, Sparkles, Environment, GizmoHelper, GizmoViewport, PerspectiveCamera, OrthographicCamera, Box as DreiBox, Sphere, Cylinder, Plane, Cone, Torus, Tetrahedron, Icosahedron, Outlines } from '@react-three/drei';
import * as THREE from 'three';
import { useEditorStore } from '@/lib/store';

// Logic Engine Hook
function useLogicEngine() {
  const nodes = useEditorStore(state => state.nodes);
  const edges = useEditorStore(state => state.edges);
  const elements = useEditorStore(state => state.elements);
  const updateElement = useEditorStore(state => state.updateElement);
  const setCurrentSceneId = useEditorStore(state => state.setCurrentSceneId);
  const setPreviewAnimationData = useEditorStore(state => state.setPreviewAnimationData);

  const executeNode = (nodeId: string) => {
    const node = nodes.find(n => n.id === nodeId);
    if (!node) return;

    if (node.type === 'action') {
      const { actionType, targetId, actionValue } = node.data || {};
      if (actionType === 'play_animation' && targetId) {
        setPreviewAnimationData({ targetId, animationName: actionValue || '*' });
      } else if (actionType === 'toggle_visibility' && targetId) {
        const targetEl = useEditorStore.getState().elements.find(e => e.id === targetId);
        if (targetEl) updateElement(targetId, { isHidden: !targetEl.isHidden });
      } else if (actionType === 'open_url' && actionValue) {
        window.open(actionValue, '_blank');
      } else if (actionType === 'change_scene' && actionValue) {
        setCurrentSceneId(actionValue);
      } else if (actionType === 'play_audio' && targetId) {
        const targetEl = useEditorStore.getState().elements.find(e => e.id === targetId);
        if (targetEl) updateElement(targetId, { autoplay: !targetEl.autoplay });
      } else if (actionType === 'api_call' && actionValue) {
        // Basic API Fetch (Enterprise logic feature)
        const method = node.data.apiMethod || 'GET';
        fetch(actionValue, { method })
          .then(res => res.json())
          .then(data => console.log(`API Call Success (${actionValue}):`, data))
          .catch(err => console.error(`API Call Failed (${actionValue}):`, err));
      }
      
      // Continue execution to next connected nodes
      executeNextNodes(nodeId);
    } 
    else if (node.type === 'control') {
      // Handle Delay
      const delayTime = (node.data?.delayTime || 0) * 1000;
      setTimeout(() => {
        executeNextNodes(nodeId);
      }, delayTime);
    }
    else {
      // Triggers or other nodes, just pass through
      executeNextNodes(nodeId);
    }
  };

  const executeNextNodes = (sourceNodeId: string) => {
    const connectedEdges = edges.filter(e => e.source === sourceNodeId);
    connectedEdges.forEach(edge => {
      executeNode(edge.target);
    });
  };

  return { executeNextNodes, executeNode };
}

function useActionHandler() {
  const isSimulating = useEditorStore(state => state.isSimulating);
  const elements = useEditorStore(state => state.elements);
  const updateElement = useEditorStore(state => state.updateElement);
  const setCurrentSceneId = useEditorStore(state => state.setCurrentSceneId);
  const setPreviewAnimationData = useEditorStore(state => state.setPreviewAnimationData);
  const nodes = useEditorStore(state => state.nodes);
  
  const { executeNextNodes } = useLogicEngine();

  return (element: any) => {
    if (!isSimulating) return false;
    
    let actionTriggered = false;

    // 1. Process Visual Logic Nodes (New Engine)
    const triggers = nodes.filter(n => n.type === 'trigger' && n.data?.triggerType === 'on_click' && n.data?.targetId === element.id);
    
    triggers.forEach(triggerNode => {
      actionTriggered = true;
      executeNextNodes(triggerNode.id);
    });

    // 2. Process legacy onClickActions
    if (element.onClickActions && element.onClickActions.length > 0) {
      element.onClickActions.forEach((action: any) => {
        if (action.type === 'play_animation' && action.targetId) {
          if (action.value === '*') {
            setPreviewAnimationData({ targetId: action.targetId, animationName: '*' });
          } else if (action.value) {
            setPreviewAnimationData({ targetId: action.targetId, animationName: action.value });
          }
        } else if (action.type === 'change_scene' && action.value) {
          setCurrentSceneId(action.value);
        } else if (action.type === 'open_url' && action.value) {
          window.open(action.value, '_blank');
        } else if (action.type === 'toggle_visibility' && action.targetId) {
          const targetEl = elements.find(e => e.id === action.targetId);
          if (targetEl) {
            updateElement(action.targetId, { isHidden: !targetEl.isHidden });
          }
        } else if (action.type === 'play_audio' && action.targetId) {
           const targetEl = elements.find(e => e.id === action.targetId);
           if (targetEl) {
              updateElement(action.targetId, { autoplay: !targetEl.autoplay }); 
           }
        }
      });
      actionTriggered = true;
    }

    if (actionTriggered) return true;

    // 3. Legacy Fallback
    if (element.onClickActionType === 'change_scene' && element.onClickActionValue) {
       setCurrentSceneId(element.onClickActionValue);
       return true;
    }
    if (element.onClickActionType === 'url' && element.onClickActionValue) {
       window.open(element.onClickActionValue, '_blank');
       return true;
    }
    if (element.onClickActionType === 'animation' && element.actionTargetId) {
       setPreviewAnimationData({ targetId: element.actionTargetId, animationName: element.actionAnimation || '*' });
       return true;
    }

    return false; 
  };
}

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

    // Keyframe Animation (Timeline)
    if (element.keyframes && element.keyframes.length > 0) {
      const tTime = useEditorStore.getState().timelineTime;
      const keyframes = element.keyframes;
      
      if (keyframes.length === 1) {
         if (tTime >= keyframes[0].time) {
            const pos = keyframes[0].position || [0,0,0];
            const rot = keyframes[0].rotation || [0,0,0];
            const scl = keyframes[0].scale || [1,1,1];
            group.position.set(pos[0], pos[1], pos[2]);
            group.rotation.set(rot[0], rot[1], rot[2]);
            group.scale.set(scl[0], scl[1], scl[2]);
         }
      } else {
        // Find the two keyframes to interpolate between
        let kf1 = keyframes[0];
        let kf2 = keyframes[keyframes.length - 1];
        
        if (tTime <= keyframes[0].time) {
           kf1 = keyframes[0];
           kf2 = keyframes[0];
        } else if (tTime >= keyframes[keyframes.length - 1].time) {
           kf1 = keyframes[keyframes.length - 1];
           kf2 = keyframes[keyframes.length - 1];
        } else {
           for (let i = 0; i < keyframes.length - 1; i++) {
             if (tTime >= keyframes[i].time && tTime <= keyframes[i+1].time) {
               kf1 = keyframes[i];
               kf2 = keyframes[i+1];
               break;
             }
           }
        }

        let progress = 0;
        if (kf2.time > kf1.time) {
           progress = (tTime - kf1.time) / (kf2.time - kf1.time);
        }

        if (kf1.position && kf2.position) {
           group.position.x = THREE.MathUtils.lerp(kf1.position[0], kf2.position[0], progress);
           group.position.y = THREE.MathUtils.lerp(kf1.position[1], kf2.position[1], progress);
           group.position.z = THREE.MathUtils.lerp(kf1.position[2], kf2.position[2], progress);
        }
        if (kf1.rotation && kf2.rotation) {
           group.rotation.x = THREE.MathUtils.lerp(kf1.rotation[0], kf2.rotation[0], progress);
           group.rotation.y = THREE.MathUtils.lerp(kf1.rotation[1], kf2.rotation[1], progress);
           group.rotation.z = THREE.MathUtils.lerp(kf1.rotation[2], kf2.rotation[2], progress);
        }
        if (kf1.scale && kf2.scale) {
           group.scale.x = THREE.MathUtils.lerp(kf1.scale[0], kf2.scale[0], progress);
           group.scale.y = THREE.MathUtils.lerp(kf1.scale[1], kf2.scale[1], progress);
           group.scale.z = THREE.MathUtils.lerp(kf1.scale[2], kf2.scale[2], progress);
        }
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

      // Apply custom materials
      clone.traverse((node: any) => {
        if (node.isMesh && node.material && node.material.name) {
          if (element.customMaterials && element.customMaterials[node.material.name]) {
            node.material = node.material.clone();
            node.material.color.set(element.customMaterials[node.material.name]);
          }
        }
      });
    } catch (e) {
      console.error("Failed to process GLTF", e);
    }
    return clone;
  }, [scene, element.customMaterials]);

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

  useEffect(() => {
    if (scene) {
      const matNames: string[] = [];
      scene.traverse((node: any) => {
        if (node.isMesh && node.material && node.material.name) {
          if (!matNames.includes(node.material.name)) {
            matNames.push(node.material.name);
          }
        }
      });
      if (JSON.stringify(element.availableMaterials) !== JSON.stringify(matNames)) {
        updateElement(element.id, { availableMaterials: matNames });
      }
    }
  }, [scene, element.id, element.availableMaterials, updateElement]);

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
    : "https://cdn.jsdelivr.net/npm/@fontsource/raleway/files/raleway-latin-400-normal.woff";
    
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
              />
              {isOutline && <Outlines thickness={0.02} color="#000000" />}
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

  const handleAction = useActionHandler();

  const buttonObj = (
    <AnimatedElementWrapper element={element}>
      <group 
        onClick={(e: any) => { 
          e.stopPropagation(); 
          if (!handleAction(element)) {
            setSelectedId(element.id); 
          }
        }}
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

  const handleAction = useActionHandler();

  const hotspotObj = (
    <AnimatedElementWrapper element={element}>
      <group 
        onClick={(e: any) => { 
          e.stopPropagation(); 
          if (!handleAction(element)) {
            setSelectedId(element.id); 
          }
        }}
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
  const texture = useLoader(THREE.TextureLoader, url);
  return (
    <mesh position={[0, -0.01, 0]} rotation={[-Math.PI / 2, 0, 0]}>
      <planeGeometry args={[2, 2 * (texture.image?.height / texture.image?.width || 1)]} />
      <meshBasicMaterial map={texture} opacity={0.5} transparent />
    </mesh>
  );
}

function OccluderElement({ element, mode }: { element: any, mode: 'translate' | 'rotate' | 'scale' }) {
  const isSimulating = useEditorStore(state => state.isSimulating);
  
  return (
    <AnimatedElementWrapper element={element}>
      <mesh>
        {element.type === 'occluder_cube' ? (
          <boxGeometry args={[1, 1, 1]} />
        ) : (
          <planeGeometry args={[1, 1]} />
        )}
        {/* colorWrite={false} makes the material invisible but still writes to the depth buffer, occluding anything behind it */}
        <meshBasicMaterial 
          colorWrite={!isSimulating} // Show slightly in editor, hide in simulation
          opacity={isSimulating ? 1 : 0.2}
          transparent={!isSimulating}
          color="#ff00ff"
          wireframe={!isSimulating}
        />
      </mesh>
      {!isSimulating && (
        <Html center position={[0, 0, 0]}>
          <div className="bg-[#ff00ff]/80 text-white text-[8px] px-1 py-0.5 rounded font-bold whitespace-nowrap pointer-events-none">
            OCCLUDER
          </div>
        </Html>
      )}
    </AnimatedElementWrapper>
  );
}

function CameraController() {
  const controlsRef = useRef<any>(null);
  const cameraResetTrigger = useEditorStore(state => state.cameraResetTrigger);
  const isOrthographic = useEditorStore(state => state.isOrthographic);

  useEffect(() => {
    if (controlsRef.current) {
      controlsRef.current.reset();
    }
  }, [cameraResetTrigger, isOrthographic]);

  return <OrbitControls makeDefault ref={controlsRef} />;
}

export default function EditorViewport({ transformMode = 'translate', simulateMode = false }: { transformMode?: 'translate' | 'rotate' | 'scale', simulateMode?: boolean }) {
  const isSimulating = simulateMode || useEditorStore(state => state.isSimulating);
  const elements = useEditorStore(state => state.elements);
  const updateElement = useEditorStore(state => state.updateElement);
  const selectedId = useEditorStore(state => state.selectedId);
  const setSelectedId = useEditorStore(state => state.setSelectedId);
  const targetImageUrl = useEditorStore(state => state.targetImageUrl);
  const setPreviewAnimationData = useEditorStore(state => state.setPreviewAnimationData);
  const isOrthographic = useEditorStore(state => state.isOrthographic);
  const trackingMode = useEditorStore(state => state.trackingMode);
  const setCurrentSceneId = useEditorStore(state => state.setCurrentSceneId);

  // Logic Engine Setup
  const nodes = useEditorStore(state => state.nodes);
  const { executeNextNodes } = useLogicEngine();
  const proximityTriggered = useRef<Set<string>>(new Set());
  
  useEffect(() => {
    if (isSimulating) {
      // Find "On Scene Start" triggers
      const startTriggers = nodes.filter(n => n.type === 'trigger' && n.data?.triggerType === 'on_scene_start');
      
      startTriggers.forEach(triggerNode => {
        setTimeout(() => {
          executeNextNodes(triggerNode.id);
        }, 100);
      });
      
      proximityTriggered.current.clear();
    }
  }, [isSimulating, nodes, executeNextNodes]);

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

  const isSnapping = useEditorStore(state => state.isSnapping);
  const ambientLightIntensity = useEditorStore(state => state.ambientLightIntensity);
  const directionalLightIntensity = useEditorStore(state => state.directionalLightIntensity);
  const environmentMap = useEditorStore(state => state.environmentMap);
  const currentSceneId = useEditorStore(state => state.currentSceneId);

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
        
        {!simulateMode && (
          <Grid 
            infiniteGrid 
            fadeDistance={40} 
            sectionColor="#1e3a8a" 
            sectionSize={1}
            cellColor="#0f172a" 
            cellSize={0.2}
            position={[0, -0.02, 0]} 
          />
        )}
        
        
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
            let component = null;
            if (el.type === '3d_shape') component = <ShapeElement key={el.id} element={el} mode={transformMode} />;
            if (el.type === '3d_model') component = <ModelElement key={el.id} element={el} mode={transformMode} />;
            if (el.type === '3d_text') component = <TextElement key={el.id} element={el} mode={transformMode} />;
            if (el.type === 'ui_button') component = <UIButtonElement key={el.id} element={el} mode={transformMode} />;
            if (el.type === 'audio') component = <AudioElement key={el.id} element={el} mode={transformMode} />;
            if (el.type === 'image') component = <ImageElement key={el.id} element={el} mode={transformMode} />;
            if (el.type === 'video') component = <VideoElement key={el.id} element={el} mode={transformMode} />;
            if (el.type === 'vfx_sparkles') component = <SparklesElement key={el.id} element={el} mode={transformMode} />;
            if (el.type === 'hotspot') component = <HotspotElement key={el.id} element={el} mode={transformMode} />;
            if (el.type === 'occluder_plane' || el.type === 'occluder_cube') component = <OccluderElement key={el.id} element={el} mode={transformMode} />;
            
            return (
              <group key={`wrapper-${el.id}`} visible={!el.isHidden}>
                {component}
              </group>
            );
          })}
        </Suspense>

        {!simulateMode && (
          <GizmoHelper
            alignment="bottom-right"
            margin={[340, 80]}
          >
            <GizmoViewport axisColors={['#ef4444', '#22c55e', '#3b82f6']} labelColor="black" />
          </GizmoHelper>
        )}

        <CameraController />
      </Canvas>
    </div>
  );
}
