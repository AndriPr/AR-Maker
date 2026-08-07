"use client";

import { useEffect, useState, use } from 'react';
import { supabase } from '@/lib/supabase';
import { Suspense } from 'react';
import { Canvas, useThree } from '@react-three/fiber';
import { RecursiveNode } from '@/components/Editor/Elements/RecursiveNode';
import { useEditorStore } from '@/lib/store';
import { Bvh, Environment } from '@react-three/drei';
import * as THREE from 'three';

// Import MultiSet AI SDK
import { MultisetClient, XRSessionManager } from '@multisetai/vps/core';
import { ThreeAdapter } from '@multisetai/vps/three';

import { ARUserInterface } from '@/components/Editor/Simulator/ARUserInterface';

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
        const clientId = process.env.NEXT_PUBLIC_MULTISET_CLIENT_ID || '6f4edfb2-1e41-4976-8226-905e36a9efc1';
        const clientSecret = process.env.NEXT_PUBLIC_MULTISET_CLIENT_SECRET || '751c2cfb79160c9add42555d7e3e6992d86d87679626d6b06a51bf391fd3d603';

        const client = new MultisetClient({
          clientId,
          clientSecret,
          mapType: 'object-tracking',
          code: [mapId],
        });

        await client.authorize();

        if (!isMounted) return;

        const overlayElement = document.getElementById('ar-ui-overlay') || document.body;
        
        const session = new XRSessionManager(gl.getContext() as WebGL2RenderingContext, {
          client,
          overlayRoot: overlayElement,
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
          onError: (err: any) => {
            console.error('VPS Error:', err);
            alert(`Gagal memulai sesi AR. Kemungkinan besar karena: \n1. Map ID sedang dalam proses "Uploading" (0 MB) di MultiSet. Harap tunggu sampai selesai. \n2. Error: ${err.message || err}`);
          }
        });

        adapter = new ThreeAdapter({
          session,
          renderer: gl,
          scene,
          camera: camera as THREE.PerspectiveCamera,
          showObjectMeshes: false, // Dimatikan karena mesh VPS seringkali terlalu berat dan menyebabkan WebGL crash (layar hitam) di HP
        });
        
        // Render tombol "START AR" bawaan MultiSet
        adapter.initialize(); 

      } catch (err: any) {
        console.error("Failed to init VPS:", err);
        alert(`Koneksi ke MultiSet gagal: ${err.message || err}. Pastikan Map ID sudah selesai diproses (tidak Uploading).`);
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

  const setElements = useEditorStore(state => state.setElements);
  const setNodes = useEditorStore(state => state.setNodes);
  const setEdges = useEditorStore(state => state.setEdges);
  const setIsSimulating = useEditorStore(state => state.setIsSimulating);

  useEffect(() => {
    setIsSimulating(true);
  }, [setIsSimulating]);

  useEffect(() => {
    if (project && project.scene_data) {
      if (project.scene_data.elements) setElements(project.scene_data.elements);
      if (project.scene_data.nodes) setNodes(project.scene_data.nodes);
      if (project.scene_data.edges) setEdges(project.scene_data.edges);
    }
  }, [project, setElements, setNodes, setEdges]);

  if (!project) return <div className="text-white flex items-center justify-center h-full bg-gray-900">Memuat 3D Canvas...</div>;

  const allElements = project.scene_data?.elements || [];
  // Older saves have no `scenes` metadata at all - in that case we can't tell which
  // scene is "active", so show everything rather than filtering down to nothing.
  const hasSceneMetadata = !!(project.scene_data?.scenes && project.scene_data.scenes.length > 0);
  const currentElements = hasSceneMetadata
    ? allElements.filter((el: any) => !el.sceneId || el.sceneId === activeSceneId)
    : allElements;

  const childrenByParentId = new Map<string, any[]>();
  for (const el of allElements) {
    if (!el.parentId) continue;
    const siblings = childrenByParentId.get(el.parentId);
    if (siblings) siblings.push(el);
    else childrenByParentId.set(el.parentId, [el]);
  }

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
      
      {/* Landing Page UI before AR starts */}
      {!isArActive && isXrSupported && (
        <div className="absolute inset-0 bg-[#0a0a0c] z-[40] flex flex-col items-center justify-center p-6 text-center">
          <div className="w-20 h-20 mb-6 bg-gradient-to-br from-pln-blue to-purple-600 rounded-3xl shadow-[0_0_40px_rgba(0,162,233,0.3)] flex items-center justify-center animate-pulse">
            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path>
              <polyline points="3.27 6.96 12 12.01 20.73 6.96"></polyline>
              <line x1="12" y1="22.08" x2="12" y2="12"></line>
            </svg>
          </div>
          <h1 className="text-3xl font-black text-white mb-2">{project.title}</h1>
          <p className="text-gray-400 text-sm max-w-xs mb-8">
            Tekan tombol Start AR di bawah untuk mengaktifkan kamera dan memulai pengalaman WebXR.
          </p>
          
          {!mapId && (
            <div className="bg-red-500/20 border border-red-500 text-red-300 p-3 rounded-xl text-xs max-w-xs mb-4">
              <strong>Peringatan:</strong> Map ID belum disetel. Tombol Start AR tidak akan muncul. Silakan atur Map ID (VPS) di Editor.
            </div>
          )}

          {/* Pastikan tombol bawaan MultiSet selalu di atas segalanya */}
          <style dangerouslySetInnerHTML={{__html: `
            button, #ARButton { z-index: 99999 !important; }
          `}} />
          
          {/* Note: MultiSet automatically injects the Start AR button here with absolute positioning */}
        </div>
      )}

      {/* AR Simulator UI Overlay - Only show when AR is active */}
      <div id="ar-ui-overlay" className="absolute inset-0 pointer-events-none z-[50]">
        {isArActive && <ARUserInterface />}
      </div>

      <Canvas>
        <Bvh firstHitOnly>
        {isXrSupported && mapId && (
          <VPSManager mapId={mapId} setIsArActive={setIsArActive} />
        )}
        
        <ambientLight intensity={1.5} />
        <directionalLight position={[2, 5, 2]} intensity={2} castShadow />
        <directionalLight position={[-2, 3, -2]} intensity={0.5} />
        
        <Suspense fallback={null}>
          <Environment preset="city" />
        </Suspense>
        
        {/* Konten 3D - ThreeAdapter dari MultiSet akan otomatis menyesuaikan ruang origin (0,0,0) agar pas dengan objek di dunia nyata */}
        <group position={[0, 0, 0]}> 
          
          {currentElements.filter((el: any) => el.parentId === 'root' || !el.parentId).map((el: any) => (
            <RecursiveNode
              key={el.id}
              element={el}
              childrenByParentId={childrenByParentId}
              transformMode="translate"
            />
          ))}
        </group>
      </Bvh>
      </Canvas>
    </div>
  );
}
