"use client";

import { useEffect, useState, use } from 'react';
import { supabase } from '@/lib/supabase';
import { Canvas } from '@react-three/fiber';
import { XR, createXRStore } from '@react-three/xr';
import { useGLTF, Text } from '@react-three/drei';
// Import MultiSet AI SDK 
// import { MultiSetProvider, ObjectAnchor } from '@multisetai/vps';

// Simple model component
function Model({ url, position, rotation, scale }: any) {
  const { scene } = useGLTF(url as string) as any;
  return <primitive object={scene.clone()} position={position} rotation={rotation} scale={scale} />;
}

const store = createXRStore();

export default function ARCanvas({ params }: { params: Promise<{ id: string }> }) {
  const unwrappedParams = use(params);
  const [project, setProject] = useState<any>(null);
  
  // Multiset State
  const clientId = process.env.NEXT_PUBLIC_MULTISET_CLIENT_ID;
  const [mapId, setMapId] = useState<string>('MOCK_MAP_ID_HERE'); // This will eventually come from project.scene_data

  useEffect(() => {
    const fetchProject = async () => {
      const { data } = await supabase
        .from('ar_projects')
        .select('*')
        .eq('id', unwrappedParams.id)
        .single();
      if (data) setProject(data);
    };
    fetchProject();
  }, [unwrappedParams.id]);

  if (!project) return <div className="text-white flex items-center justify-center h-full">Memuat 3D Canvas...</div>;

  const elements = project.scene_data?.elements || [];

  return (
    <div className="w-full h-screen bg-gray-900 relative">
      <button 
        onClick={() => store.enterAR()}
        className="absolute bottom-8 left-1/2 -translate-x-1/2 bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 rounded-full font-bold z-[60] shadow-xl border border-white/20 transition-all"
      >
        START AR
      </button>
      
      {/* UI React Murni untuk Edu Panel */}
      <div className="absolute top-4 left-4 z-50 text-white p-4 bg-black/50 rounded-xl pointer-events-none border border-white/10">
        <h2 className="font-bold text-xl mb-1">{project.title}</h2>
        <p className="text-xs text-green-400 font-medium">MultiSet Engine Active</p>
        <p className="text-[10px] text-gray-400 mt-2">Client ID: {clientId?.substring(0, 8)}...</p>
        <p className="text-[10px] text-gray-400">Map ID: {mapId}</p>
      </div>

      <Canvas>
        <XR store={store}>
          <ambientLight intensity={1} />
          <directionalLight position={[1, 2, 1]} intensity={1.5} />
          
          {/* 
            Placeholder untuk MultiSet AI Object Tracking. 
            Nantinya kita akan bungkus elemen-elemen ini dengan <ObjectAnchor mapId={mapId}> 
          */}
          <group position={[0, 0, -1]}> 
            {elements.map((el: any) => {
              if (el.type === '3d_model' && el.url) {
                return (
                  <Model 
                    key={el.id}
                    url={el.url}
                    position={el.position}
                    rotation={el.rotation}
                    scale={el.scale}
                  />
                );
              }
              if (el.type === '3d_text') {
                return (
                  <Text
                    key={el.id}
                    position={el.position}
                    rotation={el.rotation}
                    scale={el.scale}
                    color={el.color || 'white'}
                    anchorX="center"
                    anchorY="middle"
                  >
                    {el.content}
                  </Text>
                );
              }
              return null;
            })}
          </group>
        </XR>
      </Canvas>
    </div>
  );
}
