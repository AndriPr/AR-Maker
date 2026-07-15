"use client";

import { useEffect, useState, use } from 'react';
import { supabase } from '@/lib/supabase';
import { Canvas } from '@react-three/fiber';
import { XR, createXRStore } from '@react-three/xr';
import { useGLTF, Text } from '@react-three/drei';

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
  const [mapId, setMapId] = useState<string>('MOCK_MAP_ID_HERE');

  // Compatibility State
  const [isXrSupported, setIsXrSupported] = useState<boolean>(true);
  const [isIOS, setIsIOS] = useState<boolean>(false);
  const [showTutorial, setShowTutorial] = useState<boolean>(false);

  useEffect(() => {
    // Check for iOS
    const ios = /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream;
    setIsIOS(ios);

    // Check for WebXR Support
    if (navigator.xr) {
      navigator.xr.isSessionSupported('immersive-ar').then((supported) => {
        setIsXrSupported(supported);
      });
    } else {
      setIsXrSupported(false);
    }

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
      {!isXrSupported ? (
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-3 z-[60] w-11/12 max-w-sm">
          <div className="bg-red-500/90 backdrop-blur-md text-white text-xs text-center p-3 rounded-lg border border-red-400 shadow-lg">
            Browser Anda tidak mendukung WebXR secara default.
          </div>
          {isIOS && (
            <button 
              onClick={() => setShowTutorial(true)}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-full font-bold shadow-xl border border-white/20 transition-all text-sm"
            >
              Cara Mengaktifkan di iPhone
            </button>
          )}
        </div>
      ) : (
        <button 
          onClick={() => store.enterAR()}
          className="absolute bottom-8 left-1/2 -translate-x-1/2 bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 rounded-full font-bold z-[60] shadow-xl border border-white/20 transition-all"
        >
          START AR
        </button>
      )}

      {/* iOS Tutorial Modal */}
      {showTutorial && (
        <div className="absolute inset-0 z-[100] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-gray-800 text-white rounded-2xl p-6 max-w-sm w-full border border-gray-700 shadow-2xl relative">
            <button 
              onClick={() => setShowTutorial(false)}
              className="absolute top-4 right-4 text-gray-400 hover:text-white"
            >
              ✕
            </button>
            <h3 className="text-lg font-bold mb-4 text-blue-400">Cara Mengaktifkan AR di iOS</h3>
            <p className="text-sm text-gray-300 mb-4">Apple memblokir WebXR secara otomatis. Ikuti 3 langkah ini untuk menyalakannya:</p>
            <ol className="list-decimal pl-5 text-sm space-y-2 text-gray-300 mb-6">
              <li>Buka aplikasi <strong>Settings</strong> (Pengaturan) di iPhone Anda.</li>
              <li>Gulir ke bawah dan pilih <strong>Safari</strong> > <strong>Advanced</strong> > <strong>Feature Flags</strong>.</li>
              <li>Cari <strong>WebXR Device API</strong> dan <strong>WebXR Augmented Reality Module</strong>, lalu nyalakan <span className="text-green-400 font-bold">(hijau)</span>.</li>
            </ol>
            <p className="text-xs text-yellow-400 text-center bg-yellow-400/10 p-2 rounded-lg border border-yellow-400/20">
              Setelah menyala, tutup tab ini dan *refresh* halaman untuk memulai AR.
            </p>
          </div>
        </div>
      )}
      
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
