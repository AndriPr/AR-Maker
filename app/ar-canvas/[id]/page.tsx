"use client";

import { useEffect, useState, use, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import { Canvas, useThree } from '@react-three/fiber';
import { RecursiveNode } from '@/components/Editor/Elements/RecursiveNode';
import { useEditorStore } from '@/lib/store';
import { useGLTF, Text } from '@react-three/drei';
import * as THREE from 'three';

// Import MultiSet AI SDK
import { MultisetClient, XRSessionManager } from '@multisetai/vps/core';
import { ThreeAdapter } from '@multisetai/vps/three';

function Model({ url, position, rotation, scale, onClick }: any) {
  const { scene } = useGLTF(url as string) as any;
  return <primitive object={scene.clone()} position={position} rotation={rotation} scale={scale} onClick={onClick} />;
}

// HACK: WebXR Viewer di iOS melempar error jika addEventListener dipanggil sebelum session dimulai.
if (typeof navigator !== 'undefined' && navigator.xr) {
  const originalAdd = (navigator.xr as any).addEventListener;
  if (originalAdd) {
    (navigator.xr as any).addEventListener = function() {
      try {
        originalAdd.apply(this, arguments);
      } catch (e) {
        console.warn("Ignored WebXR Viewer event listener error:", e);
      }
    };
  }
}

// Komponen VPS Manager (berjalan di dalam Canvas)
function VPSManager({ 
  mapId, 
  setIsArActive 
}: { 
  mapId: string, 
  setIsArActive: (active: boolean) => void
}) {
  const { gl, scene, camera } = useThree();

  useEffect(() => {
    if (!mapId || mapId.trim() === '') return;

    let isMounted = true;
    let adapter: any = null;

    const initVPS = async () => {
      try {
        const clientId = process.env.NEXT_PUBLIC_MULTISET_CLIENT_ID || 'dummy';
        const clientSecret = process.env.NEXT_PUBLIC_MULTISET_CLIENT_SECRET || 'dummy';

        const client = new MultisetClient({
          clientId,
          clientSecret,
          mapType: 'object-tracking',
          code: [mapId],
        });

        await client.authorize();

        if (!isMounted) return;

        const session = new XRSessionManager(gl.getContext() as WebGL2RenderingContext, {
          client,
          overlayRoot: document.body,
          autoTracking: true,
          confidenceCheck: true,
          confidenceThreshold: 0.5,
          onSessionStart: () => {
            gl.domElement.style.display = 'none';
            setIsArActive(true);
          },
          onSessionEnd: () => {
            gl.domElement.style.display = 'block';
            setIsArActive(false);
          },
          onObjectTrackingSuccess: (result: any) => {
            console.log('Object localized at:', result.position);
          },
          onObjectTrackingFailure: (reason: any) => {
            console.warn('Tracking failed:', reason);
          },
          onError: (err: any) => console.error('VPS Error:', err)
        });

        adapter = new ThreeAdapter({
          session,
          renderer: gl,
          scene,
          camera: camera as THREE.PerspectiveCamera,
          showObjectMeshes: true, // Tampilkan mesh outline agar user tahu object mana yg dilacak
        });
        
        // Render tombol "START AR" bawaan MultiSet
        adapter.initialize(); 

      } catch (err) {
        console.error("Failed to init VPS:", err);
      }
    };

    initVPS();

    return () => {
      isMounted = false;
      if (adapter && adapter.dispose) {
        adapter.dispose();
      }
    };
  }, [gl, scene, camera, mapId, setIsArActive]);

  return null;
}

export default function ARCanvas({ params }: { params: Promise<{ id: string }> }) {
  const unwrappedParams = use(params);
  const [project, setProject] = useState<any>(null);
  
  // Multiset State
  const clientId = process.env.NEXT_PUBLIC_MULTISET_CLIENT_ID;
  const [mapId, setMapId] = useState<string>('');
  const [isArActive, setIsArActive] = useState<boolean>(false);

  // Compatibility State
  const [isXrSupported, setIsXrSupported] = useState<boolean>(true);
  const [isIOS, setIsIOS] = useState<boolean>(false);
  const [showTutorial, setShowTutorial] = useState<boolean>(false);
  
  // Scene State
  const [activeSceneId, setActiveSceneId] = useState<string | null>(null);

  useEffect(() => {
    // Check for iOS
    const ios = /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream;
    setIsIOS(ios);

    // Check for WebXR Support
    if (navigator.xr) {
      navigator.xr.isSessionSupported('immersive-ar')
        .then((supported) => setIsXrSupported(supported))
        .catch(() => setIsXrSupported(false));
    } else {
      setIsXrSupported(false);
    }

    const fetchProject = async () => {
      const { data } = await supabase
        .from('ar_projects')
        .select('*')
        .eq('id', unwrappedParams.id)
        .single();
      if (data) {
        setProject(data);
        if (data.scene_data && data.scene_data.multiset_map_id) {
          setMapId(data.scene_data.multiset_map_id);
        }
        if (data.scene_data && data.scene_data.scenes && data.scene_data.scenes.length > 0) {
          setActiveSceneId(data.scene_data.scenes[0].id);
        }
      }
    };
    fetchProject();
  }, [unwrappedParams.id]);

  if (!project) return <div className="text-white flex items-center justify-center h-full bg-gray-900">Memuat 3D Canvas...</div>;

  
  const setElements = useEditorStore(state => state.setElements);

  const setIsSimulating = useEditorStore(state => state.setIsSimulating);
  useEffect(() => {
    setIsSimulating(true);
  }, [setIsSimulating]);

  const elements = useEditorStore(state => state.elements);
  
  useEffect(() => {
    if (project && project.scene_data && project.scene_data.elements) {
      setElements(project.scene_data.elements);
    }
  }, [project, setElements]);

  const allElements = project.scene_data?.elements || [];
  const currentElements = allElements.filter((el: any) => !el.sceneId || el.sceneId === activeSceneId);

  const handleElementClick = (e: any, el: any) => {
    e.stopPropagation();
    if (el.onClickActionType === 'change_scene' && el.onClickActionValue) {
      setActiveSceneId(el.onClickActionValue);
    } else if (el.onClickActionType === 'url' && el.onClickActionValue) {
      window.open(el.onClickActionValue, '_blank');
    }
  };

  return (
    <div className="w-full h-screen bg-gray-900 relative">
      {!isXrSupported && (
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-3 z-[60] w-11/12 max-w-sm pointer-events-auto">
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
            <h3 className="text-lg font-bold mb-4 text-blue-400">WebXR di iPhone (iOS)</h3>
            <p className="text-sm text-gray-300 mb-4">Apple memblokir akses kamera untuk WebXR di Safari secara bawaan.</p>
            <p className="text-sm text-gray-300 mb-4">Untuk mencoba AR ini di iPhone, <strong>Anda wajib menggunakan browser khusus AR:</strong></p>
            <ol className="list-decimal pl-5 text-sm space-y-2 text-gray-300 mb-6">
              <li>Buka App Store dan unduh aplikasi <strong>"WebXR Viewer"</strong> (buatan Mozilla).</li>
              <li>Buka aplikasi tersebut.</li>
              <li>Salin (Copy) link web AR ini dan Tempel (Paste) di kolom pencariannya.</li>
            </ol>
            <p className="text-xs text-yellow-400 text-center bg-yellow-400/10 p-2 rounded-lg border border-yellow-400/20">
              Tombol START AR akan langsung berfungsi di dalam aplikasi tersebut!
            </p>
          </div>
        </div>
      )}
      
      {/* UI React Murni untuk Edu Panel */}
      <div className="absolute top-4 left-4 z-50 text-white p-4 bg-black/50 rounded-xl pointer-events-none border border-white/10">
        <h2 className="font-bold text-xl mb-1">{project.title}</h2>
        {isArActive ? (
          <p className="text-xs text-green-400 font-medium">MultiSet AR Active</p>
        ) : (
          <p className="text-xs text-yellow-400 font-medium">MultiSet AR Idle</p>
        )}
        <p className="text-[10px] text-gray-400 mt-2">Client ID: {clientId?.substring(0, 8)}...</p>
        <p className="text-[10px] text-gray-400">Map ID: {mapId || 'Belum disetel'}</p>
      </div>

      <Canvas>
        {isXrSupported && mapId && (
          <VPSManager mapId={mapId} setIsArActive={setIsArActive} />
        )}
        
        <ambientLight intensity={1} />
        <directionalLight position={[1, 2, 1]} intensity={1.5} />
        
        {/* Konten 3D - ThreeAdapter dari MultiSet akan otomatis menyesuaikan ruang origin (0,0,0) agar pas dengan objek di dunia nyata */}
        <group position={[0, 0, 0]}> 
          
          {currentElements.filter((el: any) => el.parentId === 'root' || !el.parentId).map((el: any) => (
            <RecursiveNode 
              key={el.id} 
              element={el} 
              elements={allElements} 
              transformMode="translate" 
            />
          ))}
        </group>
      </Canvas>
    </div>
  );
}
