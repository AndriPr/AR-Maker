"use client";

import { Html } from '@react-three/drei';
import { useEditorStore } from '@/lib/store';
import { AnimatedElementWrapper } from '@/components/Editor/Elements/AnimatedElementWrapper';

export function OccluderElement({ element, mode }: { element: any, mode: 'translate' | 'rotate' | 'scale' }) {
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

