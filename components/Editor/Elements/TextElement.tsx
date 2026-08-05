"use client";

import { useEffect, useRef, useState } from 'react';
import { TransformControls, Text, Text3D, Center, Outlines } from '@react-three/drei';
import { useEditorStore } from '@/lib/store';
import { AnimatedElementWrapper } from '@/components/Editor/Elements/AnimatedElementWrapper';
import { useTransformLogic } from '@/hooks/useTransformLogic';

export function TextElement({ element, mode }: { element: any, mode: 'translate' | 'rotate' | 'scale' }) {
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

  useTransformLogic(element, isSelected, transformRef);

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
          handleElementClick(element.id, e.ctrlKey || e.metaKey || e.shiftKey, false);
        }}
        onPointerMissed={() => {}}
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



