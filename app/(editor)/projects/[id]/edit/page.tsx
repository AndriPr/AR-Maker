"use client";

import { ArrowLeft, Save, Play, Settings, Image as ImageIcon, Box, Move, RotateCw, Maximize, Layers, Loader2, Type, Trash2, X, PanelLeftClose, PanelRightClose, QrCode, Download, ExternalLink, Copy, MousePointerClick, LayoutDashboard, Plus, ChevronDown, ChevronRight, ListChecks, Wrench, Eye, Rocket, Magnet, Volume2, Music, Sparkles, Video, MapPin, Bot, Send, MessageSquare } from 'lucide-react';
import Link from 'next/link';
import { useEffect, useState, use } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import { useWorkspace } from '@/components/providers/WorkspaceProvider';
import dynamic from 'next/dynamic';
import { QRCodeSVG } from 'qrcode.react';
import { useEditorStore } from '@/lib/store';

const EditorViewport = dynamic(() => import('@/components/Editor/EditorViewport'), { ssr: false });

export default function AREditor({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const unwrappedParams = use(params);
  const [project, setProject] = useState<any>(null);
  const [assets, setAssets] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  
  // Mobile Panel States
  const [isLeftPanelOpen, setLeftPanelOpen] = useState(false);
  const [isRightPanelOpen, setRightPanelOpen] = useState(true);

  // AI Assistant State
  const [isAIOpen, setIsAIOpen] = useState(false);
  const [aiInput, setAiInput] = useState('');
  const [aiMessages, setAiMessages] = useState<{role: 'user' | 'ai', text: string}[]>([
    { role: 'ai', text: 'Halo Bos! Saya Asisten AI Anda. Mau ganti suasana (misal: "buat suasana malam") atau tambah efek?' }
  ]);
  const [isAIProcessing, setIsAIProcessing] = useState(false);
  const [showPublishModal, setShowPublishModal] = useState(false);
  
  const { activeWorkspace, activeRole, user } = useWorkspace();
  
  // Zustand Store
  const elements = useEditorStore(state => state.elements);
  const setElements = useEditorStore(state => state.setElements);
  const targetImageUrl = useEditorStore(state => state.targetImageUrl);
  const setTargetImageUrl = useEditorStore(state => state.setTargetImageUrl);
  const selectedId = useEditorStore(state => state.selectedId);
  const setSelectedId = useEditorStore(state => state.setSelectedId);
  const addElement = useEditorStore(state => state.addElement);
  const removeElement = useEditorStore(state => state.removeElement);
  const duplicateElement = useEditorStore(state => state.duplicateElement);
  const updateElement = useEditorStore(state => state.updateElement);
  const previewAnim = useEditorStore(state => state.previewAnimationData);
  const setPreviewAnimationData = useEditorStore(state => state.setPreviewAnimationData);
  const undo = useEditorStore(state => state.undo);
  const redo = useEditorStore(state => state.redo);
  const isSnapping = useEditorStore(state => state.isSnapping);
  const setIsSnapping = useEditorStore(state => state.setIsSnapping);
  
  const ambientLightIntensity = useEditorStore(state => state.ambientLightIntensity);
  const setAmbientLightIntensity = useEditorStore(state => state.setAmbientLightIntensity);
  const directionalLightIntensity = useEditorStore(state => state.directionalLightIntensity);
  const setDirectionalLightIntensity = useEditorStore(state => state.setDirectionalLightIntensity);
  const environmentMap = useEditorStore(state => state.environmentMap);
  const setEnvironmentMap = useEditorStore(state => state.setEnvironmentMap);
  const trackingMode = useEditorStore(state => state.trackingMode);
  const setTrackingMode = useEditorStore(state => state.setTrackingMode);
  const scenes = useEditorStore(state => state.scenes);
  const currentSceneId = useEditorStore(state => state.currentSceneId);
  const addScene = useEditorStore(state => state.addScene);
  const setCurrentSceneId = useEditorStore(state => state.setCurrentSceneId);
  const removeScene = useEditorStore(state => state.removeScene);
  
  const [transformMode, setTransformMode] = useState<'translate' | 'rotate' | 'scale'>('translate');
  
  // Keyboard Shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore if user is typing in an input
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement || e.target instanceof HTMLSelectElement) {
        return;
      }
      
      switch (e.key.toLowerCase()) {
        case 'w': setTransformMode('translate'); break;
        case 'e': setTransformMode('rotate'); break;
        case 'r': setTransformMode('scale'); break;
        case 'escape': setSelectedId(null); break;
        case 'delete':
        case 'backspace':
          if (selectedId) removeElement(selectedId);
          break;
        case 'z':
          if (e.ctrlKey || e.metaKey) {
            e.preventDefault();
            if (e.shiftKey) redo();
            else undo();
          }
          break;
        case 'y':
          if (e.ctrlKey || e.metaKey) {
            e.preventDefault();
            redo();
          }
          break;
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedId, removeElement, undo, redo, setSelectedId]);

  // AI Logic
  const handleAISubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!aiInput.trim() || isAIProcessing) return;
    
    const userText = aiInput.trim();
    const lowerText = userText.toLowerCase();
    
    setAiMessages(prev => [...prev, { role: 'user', text: userText }]);
    setAiInput('');
    setIsAIProcessing(true);

    setTimeout(() => {
      let aiResponse = "Maaf bos, saya belum paham. Coba ketik 'buat jadi malam' atau 'tambah salju'.";
      let hasAction = false;

      // Intent 1: Lighting & Environment
      if (lowerText.includes('malam') || lowerText.includes('gelap') || lowerText.includes('city') || lowerText.includes('kota')) {
        setEnvironmentMap('city');
        setAmbientLightIntensity(0.2);
        setDirectionalLightIntensity(0.5);
        aiResponse = "Siap! Suasana telah saya ubah menjadi malam hari di kota. Cahaya sudah saya redupkan.";
        hasAction = true;
      } else if (lowerText.includes('sore') || lowerText.includes('sunset') || lowerText.includes('senja')) {
        setEnvironmentMap('sunset');
        setAmbientLightIntensity(0.6);
        setDirectionalLightIntensity(1.5);
        aiResponse = "Siap bos! Efek langit senja (sunset) telah diaktifkan.";
        hasAction = true;
      } else if (lowerText.includes('terang') || lowerText.includes('studio') || lowerText.includes('siang')) {
        setEnvironmentMap('studio');
        setAmbientLightIntensity(1.0);
        setDirectionalLightIntensity(2.0);
        aiResponse = "Lampu studio menyala! Suasana kembali terang benderang.";
        hasAction = true;
      }

      // Intent 2: VFX
      if (lowerText.includes('efek') || lowerText.includes('salju') || lowerText.includes('bintang') || lowerText.includes('sparkle')) {
        addElement({
          type: 'vfx_sparkles',
          name: 'VFX dari AI',
          position: [0, 0, 0],
          rotation: [0, 0, 0],
          scale: [1, 1, 1],
          sparkleColor: lowerText.includes('emas') || lowerText.includes('gold') ? '#ffd700' : (lowerText.includes('biru') ? '#0000ff' : '#ffffff'),
          sparkleCount: 150,
          sparkleSize: 3,
          sceneId: currentSceneId
        });
        aiResponse = hasAction ? `${aiResponse} Oh ya, efek magis juga sudah saya tambahkan ke kanvas.` : "Siap bos! Efek partikel magis sudah saya taburkan ke dalam AR.";
        hasAction = true;
      }

      // Intent 3: Scene
      if ((lowerText.includes('scene') || lowerText.includes('slide')) && (lowerText.includes('tambah') || lowerText.includes('baru'))) {
        addScene(`Scene AI ${Math.floor(Math.random() * 100)}`);
        aiResponse = hasAction ? `${aiResponse} Dan Scene baru sudah disiapkan di bawah.` : "Tentu! Scene baru telah saya siapkan di panel bawah.";
        hasAction = true;
      }

      if (!hasAction) {
        if (lowerText.includes('halo') || lowerText.includes('hai')) {
          aiResponse = "Halo! Silakan beri perintah untuk mengubah suasana (misal: 'buat gelap') atau tambah elemen (misal: 'tambah salju').";
        }
      }

      setAiMessages(prev => [...prev, { role: 'ai', text: aiResponse }]);
      setIsAIProcessing(false);
    }, 800);
  };
  
  // White-Label State
  const [brandColor, setBrandColor] = useState('#00A2E9');
  const [brandLogoUrl, setBrandLogoUrl] = useState<string | null>(null);
  
  // Folder State
  const [folderName, setFolderName] = useState('Personal');
  
  const fetchEditorData = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      router.push('/login');
      return;
    }

    const { data: projData } = await supabase
      .from('ar_projects')
      .select('*')
      .eq('id', unwrappedParams.id)
      .single();
      
    if (projData) {
      setProject(projData);
      setTargetImageUrl(projData.target_image_url);
      setBrandColor(projData.brand_color || '#00A2E9');
      setBrandLogoUrl(projData.brand_logo_url || null);
      setFolderName(projData.folder_name || 'Personal');
      
      // Load scene data from JSONB
      if (projData.scene_data && projData.scene_data.elements) {
        setElements(projData.scene_data.elements);
      }
    }

    const { data: assetsData } = await supabase
      .from('assets')
      .select('*')
      .eq('user_id', session.user.id)
      .order('created_at', { ascending: false });

    if (assetsData) setAssets(assetsData);
    
    setLoading(false);
  };

  useEffect(() => {
    fetchEditorData();
  }, [unwrappedParams.id, router]);

  const handleSave = async (silent = false) => {
    if (!project) return;
    if (!silent) setSaving(true);
    
    try {
      const sceneData = { elements };
      const { error } = await supabase
        .from('ar_projects')
        .update({
          target_image_url: targetImageUrl,
          scene_data: sceneData,
          brand_color: brandColor,
          brand_logo_url: brandLogoUrl
          // folder_name: folderName // Temporarily disabled until DB is migrated
        })
        .eq('id', project.id);
        
      if (error) throw error;
      setLastSaved(new Date());
      if (!silent) alert('Draft berhasil disimpan!');
    } catch (err: any) {
      if (!silent) alert('Gagal menyimpan: ' + err.message);
    } finally {
      if (!silent) setSaving(false);
    }
  };

  // Auto Save Effect
  useEffect(() => {
    if (loading || !project) return;
    const timer = setTimeout(() => {
      handleSave(true);
    }, 2000);
    return () => clearTimeout(timer);
  }, [elements, targetImageUrl]);

  const [publishProgress, setPublishProgress] = useState<string | null>(null);

  const handlePublish = async () => {
    if (!project) return;
    if (!targetImageUrl) {
      alert("Harap pilih atau unggah Target Image (Marker) terlebih dahulu!");
      return;
    }
    
    if (activeRole === 'editor' || activeRole === 'viewer') {
      alert("Anda hanya memiliki akses Editor/Viewer. Permintaan publikasi telah dikirim ke Admin Workspace Anda.");
      await supabase.from('ar_projects').update({ status: 'in_review' }).eq('id', project.id);
      
      // Kirim Notifikasi ke Admin (Simulasi log)
      await supabase.from('audit_logs').insert({
        workspace_id: activeWorkspace?.id,
        user_id: user?.id,
        action: 'REQUEST_PUBLISH',
        resource_name: project.title
      });
      return;
    }
    
    setSaving(true);
    
    try {
      setPublishProgress("Memuat AR Compiler...");
      
      // 1. Load MindAR Compiler Script
      await new Promise<void>((resolve, reject) => {
        if ((window as any).MINDAR?.IMAGE?.Compiler) {
          resolve();
          return;
        }
        const script = document.createElement('script');
        script.src = 'https://cdn.jsdelivr.net/gh/hiukim/mind-ar-js@1.1.5/dist/mindar-image.prod.js';
        script.onload = () => resolve();
        script.onerror = () => reject(new Error("Gagal memuat Compiler"));
        document.head.appendChild(script);
      });

      setPublishProgress("Mengunduh gambar marker...");
      
      // 2. Fetch image as Blob to bypass canvas CORS
      const res = await fetch(targetImageUrl);
      const blob = await res.blob();
      const imgUrl = URL.createObjectURL(blob);
      
      const image = new Image();
      image.src = imgUrl;
      await new Promise((resolve) => { image.onload = resolve; });

      setPublishProgress("Kompilasi AI Marker (Bisa memakan waktu 5-15 detik)...");

      // 3. Compile the image
      const compiler = new (window as any).MINDAR.IMAGE.Compiler();
      await compiler.compileImageTargets([image], (progress: number) => {
         setPublishProgress(`Kompilasi Marker: ${Math.round(progress)}%`);
      });
      const exportedBuffer = await compiler.exportData();

      setPublishProgress("Mengunggah file AR ke server...");

      // 4. Upload to Supabase Storage
      const fileName = `mind_targets/target-${project.id}-${Date.now()}.mind`;
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('assets') // Using the 'assets' bucket
        .upload(fileName, exportedBuffer, { 
          contentType: 'application/octet-stream',
          upsert: true
        });
        
      if (uploadError) {
         // Sometimes RLS blocks upload if bucket policy is strict. Fallback to default if error
         console.warn("Upload .mind failed, possibly due to RLS. Using default marker. Error:", uploadError);
      }
      
      let finalMindUrl = project.mind_file_url;
      if (!uploadError && uploadData) {
         const { data: publicUrlData } = supabase.storage.from('assets').getPublicUrl(fileName);
         finalMindUrl = publicUrlData.publicUrl;
      }

      setPublishProgress("Menyimpan proyek...");

      // 5. Update Database
      const sceneData = { elements };
      const { error: finalError } = await supabase
        .from('ar_projects')
        .update({ 
          is_published: true,
          target_image_url: targetImageUrl,
          scene_data: sceneData,
          brand_color: brandColor,
          brand_logo_url: brandLogoUrl,
          // folder_name: folderName, // Temporarily disabled until DB is migrated
          status: 'published',
          ...(finalMindUrl ? { mind_file_url: finalMindUrl } : {})
        })
        .eq('id', project.id);
        
      if (finalError) throw finalError;

      // 6. Record Audit Log
      await supabase.from('audit_logs').insert({
        workspace_id: activeWorkspace?.id,
        user_id: user?.id,
        action: 'PUBLISH_PROJECT',
        resource_name: project.title
      });
      
      setPublishProgress("Selesai!");
      setShowPublishModal(true);
      setTimeout(() => setPublishProgress(null), 1000);
    } catch (err: any) {
      alert('Gagal mem-publish: ' + err.message);
      setSaving(false);
      setPublishProgress(null);
    }
  };

  const handleAddText = () => {
    addElement({
      type: '3d_text',
      name: 'Text Baru',
      content: 'Halo Dunia',
      color: '#ffffff',
      position: [0, 0, 0],
      rotation: [0, 0, 0],
      scale: [1, 1, 1]
    });
  };

  if (loading) {
    return <div className="h-screen w-screen flex items-center justify-center bg-gray-900 text-white"><Loader2 className="animate-spin" size={32} /></div>;
  }

  const selectedElement = elements.find(el => el.id === selectedId);

  return (
    <div className="h-[100dvh] flex flex-col overflow-hidden bg-black relative">
      {/* Editor Header - Float Top */}
      <header className="absolute top-0 left-0 right-0 bg-gray-900/80 backdrop-blur-lg border-b border-gray-800/50 flex items-center justify-between px-2 sm:px-4 shrink-0 z-50 min-h-14 pt-[env(safe-area-inset-top)] pb-2 shadow-sm">
        <div className="flex items-center gap-2 sm:gap-4 mt-2">
          <Link href="/" className="text-gray-400 hover:text-white transition-colors p-1 sm:p-0">
            <ArrowLeft size={20} />
          </Link>
          
          <button 
            onClick={() => setLeftPanelOpen(!isLeftPanelOpen)} 
            className="md:hidden p-1.5 text-gray-400 hover:text-white bg-gray-800 rounded-md transition-colors"
          >
            <Layers size={18} />
          </button>

          <div className="hidden sm:block h-6 w-px bg-gray-700"></div>
          <div className="hidden sm:block">
            <h1 className="text-sm font-bold text-white truncate max-w-[150px]">{project?.title}</h1>
            <p className="text-[10px] text-gray-400 truncate">
              {lastSaved ? `Saved ${lastSaved.getHours()}:${lastSaved.getMinutes().toString().padStart(2, '0')}` : 'Belum disimpan'}
            </p>
          </div>
        </div>
        
        <div className="flex items-center gap-1.5 sm:gap-3 mt-2">
          <button onClick={handleAddText} className="flex items-center gap-1 sm:gap-2 px-2 sm:px-3 py-1.5 text-[10px] sm:text-xs font-bold bg-gray-800 hover:bg-gray-700 text-white rounded-lg transition-colors border border-gray-700">
            <Type size={14} />
            <span className="hidden sm:inline">Add Text</span>
          </button>

          <button 
            className="flex items-center gap-1 sm:gap-2 px-2 sm:px-3 py-1.5 text-[10px] sm:text-xs font-bold bg-gray-800 hover:bg-gray-700 text-white rounded-lg transition-colors border border-gray-700"
            onClick={() => {
              const animatedModels = elements.filter(el => el.type === '3d_model' && el.availableAnimations && el.availableAnimations.length > 0);
              const defaultTarget = animatedModels.length > 0 ? animatedModels[0].id : '';
              const defaultAnim = animatedModels.length > 0 && animatedModels[0].availableAnimations ? animatedModels[0].availableAnimations[0] : '';
              addElement({ 
                type: 'ui_button', 
                name: 'Tombol Aksi', 
                position: [0, -1, 0], 
                rotation: [0, 0, 0], 
                scale: [1, 1, 1], 
                buttonText: 'Mulai Animasi',
                actionTargetId: defaultTarget,
                actionAnimation: defaultAnim
              });
            }}
          >
            <MousePointerClick size={14} />
            <span className="hidden sm:inline">Add Button</span>
          </button>

          <button 
            className="flex items-center gap-1 sm:gap-2 px-2 sm:px-3 py-1.5 text-[10px] sm:text-xs font-bold bg-pln-yellow/20 hover:bg-pln-yellow/30 text-pln-yellow border border-pln-yellow/50 rounded-lg transition-colors"
            onClick={() => {
              const animatedModels = elements.filter(el => el.type === '3d_model' && el.availableAnimations && el.availableAnimations.length > 0);
              const defaultTarget = animatedModels.length > 0 ? animatedModels[0].id : '';
              const defaultAnim = animatedModels.length > 0 && animatedModels[0].availableAnimations ? animatedModels[0].availableAnimations[0] : '';
              addElement({ 
                type: 'edu_panel', 
                name: 'Edu Dashboard', 
                position: [0, 0, 0], 
                rotation: [0, 0, 0], 
                scale: [1, 1, 1], 
                panelTitle: 'NAMA KOMPONEN',
                eduComponents: [],
                eduMaintenanceTasks: []
              });
            }}
          >
            <LayoutDashboard size={14} />
            <span className="hidden sm:inline">Add Panel</span>
          </button>
          <div className="hidden sm:block h-4 w-px bg-gray-700 mx-1"></div>

          <button onClick={() => handleSave(false)} disabled={saving} className="flex items-center justify-center w-8 h-8 sm:w-auto sm:h-auto sm:px-3 sm:py-1.5 text-[10px] sm:text-sm font-medium text-gray-300 hover:text-white hover:bg-gray-800 rounded-lg transition-colors disabled:opacity-50">
            {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
            <span className="hidden sm:inline sm:ml-2">Simpan Manual</span>
          </button>
          
          <button onClick={handlePublish} disabled={saving || publishProgress !== null || activeRole === 'viewer'} className={`flex items-center gap-1 sm:gap-2 px-2 sm:px-4 py-1.5 text-[10px] sm:text-sm font-bold text-white rounded-lg transition-colors disabled:opacity-50 ${(activeRole === 'editor') ? 'bg-orange-500 hover:bg-orange-600' : 'bg-pln-blue hover:bg-pln-blue-dark'}`}>
            {saving ? <Loader2 size={16} className="animate-spin" /> : <Rocket size={16} />}
            <span className="hidden sm:inline">
              {(activeRole === 'editor') ? 'Request Publish' : 'Publish'}
            </span>
          </button>

          <button 
            onClick={() => setRightPanelOpen(!isRightPanelOpen)} 
            className="md:hidden p-1.5 text-gray-400 hover:text-white bg-gray-800 rounded-md transition-colors ml-1"
          >
            <Settings size={18} />
          </button>
        </div>
      </header>

      {/* Fullscreen 3D Viewport Area */}
      <main className="absolute inset-0 z-0">
        <div className="w-full h-full relative">
          <EditorViewport transformMode={transformMode} />
        </div>
      </main>

      {/* Editor Body Overlay */}
      <div className="flex-1 flex overflow-hidden absolute inset-0 z-10 pointer-events-none mt-14">
        
        {/* Mobile Overlays */}
        {(isLeftPanelOpen || isRightPanelOpen) && (
          <div 
            className="absolute inset-0 bg-black/60 z-10 md:hidden" 
            onClick={() => { setLeftPanelOpen(false); setRightPanelOpen(false); }}
          />
        )}

        {/* Left Sidebar (Hierarchy) */}
        <aside className={`pointer-events-auto absolute md:absolute top-4 bottom-4 left-4 z-20 w-64 bg-gray-900/75 backdrop-blur-xl border border-gray-700/50 rounded-2xl flex flex-col shrink-0 transform transition-transform duration-300 ease-in-out shadow-2xl ${isLeftPanelOpen ? 'translate-x-0' : '-translate-x-[120%]'} md:translate-x-0 overflow-hidden`}>
          <div className="p-3 border-b border-gray-800 text-xs font-bold text-gray-400 uppercase flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <Layers size={14} />
              Scene Hierarchy
            </div>
            <button className="md:hidden text-gray-500 hover:text-white" onClick={() => setLeftPanelOpen(false)}>
              <PanelLeftClose size={16} />
            </button>
          </div>
          <div className="flex-1 overflow-y-auto p-2 space-y-1">
            <div 
              className={`flex items-center gap-2 px-3 py-2 rounded-md text-sm border cursor-pointer transition-colors ${
                selectedId === null ? 'bg-blue-900/40 border-pln-blue text-white' : 'bg-gray-800 border-gray-700 text-gray-200 hover:border-gray-600'
              }`}
              onClick={() => { setSelectedId(null); if(window.innerWidth < 768) setLeftPanelOpen(false); }}
            >
              <ImageIcon size={16} className="text-blue-400 shrink-0" />
              <span className="truncate">Marker Image</span>
            </div>
            
            {elements.map(el => (
              <div 
                key={el.id}
                onClick={() => { setSelectedId(el.id); if(window.innerWidth < 768) setLeftPanelOpen(false); }}
                className={`flex items-center justify-between px-3 py-2 rounded-md text-sm cursor-pointer transition-colors pl-6 border ${
                  selectedId === el.id ? 'bg-blue-900/40 border-pln-blue text-white' : 'bg-gray-800/50 border-gray-700/50 text-gray-300 hover:border-gray-600'
                }`}
              >
                <div className="flex items-center gap-2 overflow-hidden">
                  {el.type === '3d_model' && <Box size={14} className="text-purple-400 shrink-0" />}
                  {el.type === '3d_text' && <Type size={14} className="text-green-400 shrink-0" />}
                  {el.type === 'ui_button' && <MousePointerClick size={14} className="text-blue-400 shrink-0" />}
                  {el.type === 'edu_panel' && <LayoutDashboard size={14} className="text-pln-yellow shrink-0" />}
                  {el.type === 'audio' && <Volume2 size={14} className="text-pink-400 shrink-0" />}
                  {el.type === 'video' && <Video size={14} className="text-red-400 shrink-0" />}
                  {el.type === 'vfx_sparkles' && <Sparkles size={14} className="text-yellow-400 shrink-0" />}
                  {el.type === 'hotspot' && <MapPin size={14} className="text-orange-400 shrink-0" />}
                  <span className="truncate text-xs">{el.name}</span>
                </div>
                {selectedId === el.id && (
                  <div className="flex items-center">
                    <button onClick={(e) => { e.stopPropagation(); duplicateElement(el.id); }} className="text-blue-400 hover:text-blue-300 p-1" title="Duplicate">
                      <Copy size={12} />
                    </button>
                    <button onClick={(e) => { e.stopPropagation(); removeElement(el.id); }} className="text-red-400 hover:text-red-300 p-1" title="Hapus">
                      <Trash2 size={12} />
                    </button>
                  </div>
                )}
              </div>
            ))}
            
            <div className="flex items-center gap-2 px-3 py-2 rounded-md text-sm text-gray-500 pl-6 cursor-not-allowed">
              <div className="w-4 h-4 rounded-full border border-yellow-500/50 flex items-center justify-center shrink-0">
                <div className="w-1.5 h-1.5 bg-yellow-400 rounded-full"></div>
              </div>
              <span className="text-xs">Directional Light</span>
            </div>
          </div>
          
          {/* Asset Library Panel */}
          <div className="h-1/2 border-t border-gray-700/50 flex flex-col bg-gray-900/40">
            <div className="p-3 border-b border-gray-800 flex justify-between items-center">
              <span className="text-xs font-bold text-gray-400 uppercase">My Assets</span>
              <Link href="/assets" target="_blank" className="text-xs text-pln-blue hover:underline">Manage</Link>
            </div>
            <div className="flex-1 p-2 grid grid-cols-2 gap-2 overflow-y-auto">
              {assets.map(asset => (
                <div 
                  key={asset.id} 
                  onClick={() => {
                    if (asset.type === 'image') {
                      setTargetImageUrl(asset.file_url);
                      setSelectedId(null);
                    }
                    if (asset.type === '3d_model') {
                      addElement({
                         type: '3d_model',
                         name: asset.name,
                         url: asset.file_url,
                         position: [0, 0, 0],
                         rotation: [0, 0, 0],
                         scale: [1, 1, 1]
                      });
                    }
                    if (asset.type === 'audio') {
                      addElement({
                         type: 'audio',
                         name: asset.name,
                         url: asset.file_url,
                         position: [0, 0, 0],
                         rotation: [0, 0, 0],
                         scale: [1, 1, 1],
                         loop: true,
                         autoplay: true,
                         volume: 1
                      });
                    }
                    if (asset.type === 'video') {
                      addElement({
                         type: 'video',
                         name: asset.name,
                         url: asset.file_url,
                         position: [0, 0, 0],
                         rotation: [0, 0, 0],
                         scale: [1, 1, 1],
                         loop: true,
                         autoplay: true
                      });
                    }
                    if(window.innerWidth < 768) setLeftPanelOpen(false);
                  }}
                  className={`aspect-square rounded-md border flex flex-col items-center justify-center cursor-pointer transition-colors relative overflow-hidden bg-gray-800 border-gray-700 hover:border-gray-500`}
                >
                  {asset.type === 'image' ? (
                     <img src={asset.file_url} className="w-full h-full object-cover opacity-70" />
                  ) : asset.type === 'audio' ? (
                     <Music size={24} className="text-pink-400 mb-1" />
                  ) : asset.type === 'video' ? (
                     <Video size={24} className="text-red-400 mb-1" />
                  ) : (
                     <Box size={24} className="text-gray-400 mb-1" />
                  )}
                  
                  {asset.type !== 'image' && (
                     <span className="text-[10px] text-gray-400 truncate w-full text-center px-1">{asset.name}</span>
                  )}
                </div>
              ))}
              {assets.length === 0 && (
                <div className="col-span-2 flex flex-col items-center justify-center text-gray-500 text-xs text-center p-4">
                  Belum ada aset.
                </div>
              )}
            </div>
          </div>
        </aside>

        {/* Toolbar Transform (Floating Center) */}
        <div className="pointer-events-auto absolute top-4 left-1/2 -translate-x-1/2 bg-gray-900/80 backdrop-blur-xl border border-gray-700/50 rounded-full flex p-1.5 shadow-2xl z-40 gap-1.5 items-center">
          <button 
            onClick={() => setTransformMode('translate')} 
            className={`p-2 sm:p-2.5 rounded-full transition-all ${transformMode === 'translate' ? 'bg-pln-blue text-white shadow-lg' : 'text-gray-400 hover:text-white hover:bg-gray-800'}`}
            title="Geser (Translate)"
          >
            <Move size={18} />
          </button>
          <button 
            onClick={() => setTransformMode('rotate')} 
            className={`p-2 sm:p-2.5 rounded-full transition-all ${transformMode === 'rotate' ? 'bg-pln-blue text-white shadow-lg' : 'text-gray-400 hover:text-white hover:bg-gray-800'}`}
            title="Putar (Rotate)"
          >
            <RotateCw size={18} />
          </button>
          <button 
            onClick={() => setTransformMode('scale')} 
            className={`p-2 sm:p-2.5 rounded-full transition-all ${transformMode === 'scale' ? 'bg-pln-blue text-white shadow-lg' : 'text-gray-400 hover:text-white hover:bg-gray-800'}`}
            title="Perbesar/Kecil (Scale)"
          >
            <Maximize size={18} />
          </button>
          
          <div className="w-px h-6 bg-gray-700 mx-1"></div>
          
          <button 
            onClick={() => setIsSnapping(!isSnapping)} 
            className={`p-2 sm:p-2.5 rounded-full transition-all ${isSnapping ? 'bg-pln-yellow/20 text-pln-yellow shadow-lg' : 'text-gray-400 hover:text-white hover:bg-gray-800'}`}
            title={isSnapping ? "Matikan Snapping" : "Hidupkan Snapping"}
          >
            <Magnet size={18} />
          </button>

          <div className="w-px h-6 bg-gray-700 mx-1"></div>

          <button 
            onClick={() => {
              addElement({
                type: 'vfx_sparkles',
                name: 'Efek Salju/Bintang',
                position: [0, 0, 0],
                rotation: [0, 0, 0],
                scale: [1, 1, 1],
                sparkleColor: '#ffffff',
                sparkleCount: 100,
                sparkleSize: 2
              });
            }} 
            className={`p-2 sm:p-2.5 rounded-full transition-all text-yellow-400 hover:text-white hover:bg-gray-800`}
            title="Tambah Efek Visual (VFX)"
          >
            <Sparkles size={18} />
          </button>

          <button 
            onClick={() => {
              addElement({
                type: 'hotspot',
                name: '3D Hotspot',
                position: [0, 0, 0],
                rotation: [0, 0, 0],
                scale: [1, 1, 1],
                hotspotText: 'Penjelasan Produk...'
              });
            }} 
            className={`p-2 sm:p-2.5 rounded-full transition-all text-orange-400 hover:text-white hover:bg-gray-800`}
            title="Tambah Titik Penjelasan (Hotspot)"
          >
            <MapPin size={18} />
          </button>
        </div>

        {/* Right Sidebar (Properties) */}
        <aside className={`pointer-events-auto absolute md:absolute top-4 bottom-4 right-4 z-20 w-72 bg-gray-900/75 backdrop-blur-xl border border-gray-700/50 rounded-2xl flex flex-col shrink-0 transform transition-transform duration-300 ease-in-out shadow-2xl ${isRightPanelOpen ? 'translate-x-0' : 'translate-x-[120%]'} md:translate-x-0 overflow-hidden`}>
          <div className="p-3 border-b border-gray-800 text-xs font-bold text-gray-400 uppercase flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <Settings size={14} />
              Properties
            </div>
            <button className="md:hidden text-gray-500 hover:text-white" onClick={() => setRightPanelOpen(false)}>
              <PanelRightClose size={16} />
            </button>
          </div>
          
          <div className="p-4 space-y-6 overflow-y-auto">
            
            {/* Target Image Info (Shown when no element is selected) */}
            {selectedId === null && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-xs font-bold text-gray-500 mb-3 px-1 uppercase tracking-wider flex items-center justify-between">
                    Hierarchy
                    <span className="bg-gray-800 text-gray-400 px-2 py-0.5 rounded-full text-[10px]">{elements.filter(e => e.sceneId === currentSceneId).length}</span>
                  </h3>
                  <h3 className="text-sm font-bold text-gray-200 mb-3 flex items-center justify-between">
                    Target Image (Marker)
                    <button className="text-red-400 text-xs hover:underline" onClick={() => setTargetImageUrl(null)}>Clear</button>
                  </h3>
                  <div className="aspect-video bg-gray-800 rounded-lg border border-gray-700 flex items-center justify-center overflow-hidden relative shadow-inner">
                    {targetImageUrl ? (
                      <img src={targetImageUrl} className="w-full h-full object-cover" />
                    ) : (
                      <ImageIcon size={32} className="text-gray-600" />
                    )}
                  </div>
                </div>

                {/* Folder Settings */}
                <div className="pt-4 border-t border-gray-800">
                  <h3 className="text-sm font-bold text-gray-200 mb-3">Pengaturan Proyek</h3>
                  <div className="flex flex-col gap-3">
                    <div className="flex flex-col gap-1.5">
                      <label className="text-xs text-gray-400">Nama Folder</label>
                      <input 
                        type="text" 
                        value={folderName}
                        onChange={(e) => {
                          setFolderName(e.target.value);
                          handleSave(true);
                        }}
                        className="w-full bg-gray-800 border border-gray-700 rounded-lg p-2.5 text-xs text-gray-200 outline-none focus:border-pln-blue transition-colors"
                        placeholder="e.g. Klien A, Personal"
                      />
                    </div>
                    
                    <div className="flex flex-col gap-1.5">
                      <label className="text-xs text-gray-400">Mode Tracking (8th Wall Engine)</label>
                      <select
                        value={trackingMode}
                        onChange={(e) => setTrackingMode(e.target.value as any)}
                        className="w-full bg-gray-800 border border-gray-700 rounded-lg p-2.5 text-xs text-gray-200 outline-none focus:border-pln-blue"
                      >
                        <option value="image">8th Wall - Flat Image (Poster/Kartu)</option>
                        <option value="cylinder">8th Wall - Curved/Cylinder (Botol/Kaleng)</option>
                        <option value="face">8th Wall - Face Tracking (Filter Wajah)</option>
                      </select>
                      {trackingMode === 'face' && (
                        <p className="text-[10px] text-pln-yellow mt-1">
                          Mode Wajah diaktifkan! Letakkan objek (misal: kacamata/topi) di tengah kanvas.
                        </p>
                      )}
                      {trackingMode === 'cylinder' && (
                        <p className="text-[10px] text-pln-blue mt-1">
                          Mode Botol/Silinder aktif! AR akan membungkus target gambar ke objek botol.
                        </p>
                      )}
                    </div>
                  </div>
                </div>

                {/* Environment Lighting Settings */}
                <div className="pt-4 border-t border-gray-800">
                  <h3 className="text-sm font-bold text-gray-200 mb-3">Pencahayaan Lingkungan</h3>
                  <div className="space-y-4">
                    <div className="flex flex-col gap-1.5">
                      <label className="text-xs text-gray-400 flex justify-between">
                        Ambient Light
                        <span className="font-mono text-[10px]">{ambientLightIntensity.toFixed(1)}</span>
                      </label>
                      <input 
                        type="range" 
                        min="0" max="2" step="0.1" 
                        value={ambientLightIntensity}
                        onChange={(e) => setAmbientLightIntensity(parseFloat(e.target.value))}
                        className="w-full accent-pln-blue"
                      />
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <label className="text-xs text-gray-400 flex justify-between">
                        Directional Light (Shadows)
                        <span className="font-mono text-[10px]">{directionalLightIntensity.toFixed(1)}</span>
                      </label>
                      <input 
                        type="range" 
                        min="0" max="3" step="0.1" 
                        value={directionalLightIntensity}
                        onChange={(e) => setDirectionalLightIntensity(parseFloat(e.target.value))}
                        className="w-full accent-pln-blue"
                      />
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <label className="text-xs text-gray-400">Environment Reflection (HDRI)</label>
                      <select
                        value={environmentMap}
                        onChange={(e) => setEnvironmentMap(e.target.value as any)}
                        className="bg-gray-800 border border-gray-700 rounded-lg p-2 text-xs text-white outline-none focus:border-pln-blue"
                      >
                        <option value="none">Kosong (Tidak Ada Pantulan)</option>
                        <option value="studio">Studio Foto</option>
                        <option value="city">Perkotaan (Malam)</option>
                        <option value="sunset">Sunset (Senja)</option>
                        <option value="forest">Hutan</option>
                        <option value="apartment">Apartemen Mewah</option>
                      </select>
                    </div>
                  </div>
                </div>

                {/* White-Label Branding */}
                <div className="pt-4 border-t border-gray-800">
                  <h3 className="text-sm font-bold text-gray-200 mb-3">White-Label Branding</h3>
                  <p className="text-xs text-gray-400 mb-4">Kustomisasi halaman AR Viewer dengan logo dan warna Anda sendiri.</p>
                  
                  <div className="space-y-4">
                    <div className="flex flex-col gap-1.5">
                      <label className="text-xs text-gray-400 flex justify-between">
                        Warna Utama (Tema)
                        <span className="font-mono text-[10px] bg-gray-800 px-1 rounded">{brandColor}</span>
                      </label>
                      <div className="flex gap-2">
                        <input 
                          type="color" 
                          value={brandColor}
                          onChange={(e) => {
                            setBrandColor(e.target.value);
                            handleSave(true); // auto-save branding
                          }}
                          className="w-10 h-10 bg-gray-800 border border-gray-700 rounded-lg cursor-pointer"
                        />
                        <button 
                          onClick={() => { setBrandColor('#00A2E9'); handleSave(true); }}
                          className="text-[10px] text-gray-400 hover:text-white px-2 py-1 bg-gray-800 rounded-md border border-gray-700"
                        >
                          Reset Default
                        </button>
                      </div>
                    </div>

                    <div className="flex flex-col gap-1.5">
                      <label className="text-xs text-gray-400 flex justify-between">
                        Logo Perusahaan
                        {brandLogoUrl && <button className="text-red-400 text-[10px] hover:underline" onClick={() => { setBrandLogoUrl(null); handleSave(true); }}>Hapus</button>}
                      </label>
                      <div className="h-16 bg-gray-800 rounded-lg border border-gray-700 flex items-center justify-center overflow-hidden p-2 relative shadow-inner">
                        {brandLogoUrl ? (
                          <img src={brandLogoUrl} className="max-h-full max-w-full object-contain" />
                        ) : (
                          <span className="text-[10px] text-gray-500">Belum ada logo</span>
                        )}
                      </div>
                      <button 
                        onClick={() => {
                          const url = prompt('Masukkan URL gambar Logo Anda (.png transparan direkomendasikan):', brandLogoUrl || '');
                          if (url !== null) {
                            setBrandLogoUrl(url);
                            handleSave(true);
                          }
                        }}
                        className="text-[10px] text-center w-full py-2 bg-gray-800 hover:bg-gray-700 text-white rounded-md transition-colors border border-gray-700 mt-1"
                      >
                        {brandLogoUrl ? 'Ubah URL Logo' : 'Set URL Logo'}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Element Properties */}
            {selectedElement && (
              <>
                <div>
                  <h3 className="text-sm font-bold text-gray-200 mb-3 flex items-center justify-between">
                    {selectedElement.type === '3d_model' ? '3D Model' : 
                     selectedElement.type === '3d_text' ? '3D Text' : 
                     selectedElement.type === 'edu_panel' ? 'Edu Dashboard' : 'UI Button'}
                    <div className="flex gap-3">
                      <button className="text-blue-400 text-xs hover:underline flex items-center gap-1" onClick={() => duplicateElement(selectedElement.id)}><Copy size={12}/> Duplikat</button>
                      <button className="text-red-400 text-xs hover:underline flex items-center gap-1" onClick={() => removeElement(selectedElement.id)}><Trash2 size={12}/> Hapus</button>
                    </div>
                  </h3>
                  
                  <div className="space-y-4">
                    <div className="flex flex-col gap-1.5">
                      <label className="text-xs text-gray-400">Nama Elemen</label>
                      <input 
                        type="text" 
                        value={selectedElement.name}
                        onChange={(e) => updateElement(selectedElement.id, { name: e.target.value })}
                        className="w-full bg-gray-800 border border-gray-700 rounded-lg p-2.5 text-xs text-gray-200 outline-none focus:border-pln-blue transition-colors"
                      />
                    </div>

                    {selectedElement.type === '3d_text' && (
                      <div className="space-y-4 pt-4 border-t border-gray-800">
                        <h4 className="text-xs font-bold text-gray-400 uppercase flex items-center gap-2">
                          <Type size={12} className="text-green-400"/> Pengaturan Teks
                        </h4>
                        <div className="flex flex-col gap-1.5">
                          <label className="text-xs text-gray-400">Isi Teks</label>
                          <input 
                            type="text" 
                            value={selectedElement.content || ''}
                            onChange={(e) => updateElement(selectedElement.id, { content: e.target.value })}
                            className="w-full bg-gray-800 border border-gray-700 rounded-lg p-2 text-xs text-white outline-none focus:border-pln-blue"
                          />
                        </div>
                        
                        <div className="flex flex-col gap-1.5">
                          <label className="text-xs text-gray-400">Warna Teks</label>
                          <div className="flex items-center gap-2">
                            <input 
                              type="color" 
                              value={selectedElement.color || '#ffffff'}
                              onChange={(e) => updateElement(selectedElement.id, { color: e.target.value })}
                              className="w-8 h-8 bg-gray-800 border border-gray-700 rounded cursor-pointer shrink-0"
                            />
                            <input 
                              type="text" 
                              value={selectedElement.color || '#ffffff'}
                              onChange={(e) => updateElement(selectedElement.id, { color: e.target.value })}
                              className="flex-1 bg-gray-800 border border-gray-700 rounded p-1.5 text-xs text-white outline-none focus:border-pln-blue font-mono"
                            />
                          </div>
                        </div>

                        <div className="flex flex-col gap-1.5 pt-3 border-t border-gray-800/50">
                          <label className="text-xs text-gray-300 font-bold flex items-center gap-2">
                            <Loader2 size={12} className="text-blue-400" /> Real-time Data (IoT)
                          </label>
                          <p className="text-[10px] text-gray-500 mb-1">Ambil teks secara live dari API (misal: suhu/harga saham).</p>
                          
                          <label className="text-xs text-gray-400 mt-1">API Endpoint URL</label>
                          <input 
                            type="url" 
                            value={selectedElement.apiEndpoint || ''}
                            onChange={(e) => updateElement(selectedElement.id, { apiEndpoint: e.target.value })}
                            className="w-full bg-gray-800 border border-gray-700 rounded p-2 text-xs text-white outline-none focus:border-pln-blue"
                            placeholder="https://api.example.com/data"
                          />

                          {selectedElement.apiEndpoint && (
                            <>
                              <label className="text-xs text-gray-400 mt-1">JSON Path (Optional)</label>
                              <input 
                                type="text" 
                                value={selectedElement.apiJsonPath || ''}
                                onChange={(e) => updateElement(selectedElement.id, { apiJsonPath: e.target.value })}
                                className="w-full bg-gray-800 border border-gray-700 rounded p-2 text-xs text-white outline-none focus:border-pln-blue"
                                placeholder="e.g. data.temperature"
                              />
                              <p className="text-[10px] text-pln-yellow mt-1">Di AR, teks ini akan otomatis di-update setiap 5 detik sesuai data API.</p>
                            </>
                          )}
                        </div>
                      </div>
                    )}
                      {/* UI Button Specific Properties */}
                      {selectedElement.type === 'ui_button' && (
                        <div className="space-y-4 pt-4 border-t border-gray-800">
                          <h4 className="text-xs font-bold text-gray-400 uppercase flex items-center gap-2">
                            <MousePointerClick size={12} className="text-blue-400" /> Interaktivitas Tombol
                          </h4>
                          <p className="text-[10px] text-gray-500 leading-tight">
                            Tombol ini akan muncul di layar HP saat AR digunakan. Anda bisa mengaturnya untuk memutar animasi pada model 3D.
                          </p>
                          
                          <div className="flex flex-col gap-1.5">
                            <label className="text-xs text-gray-400">Teks pada Tombol</label>
                            <input 
                              type="text"
                              value={selectedElement.buttonText || ''}
                              onChange={(e) => updateElement(selectedElement.id, { buttonText: e.target.value })}
                              className="w-full bg-gray-800/80 border border-gray-600 rounded-lg p-2 text-sm text-white outline-none focus:border-pln-blue shadow-inner"
                              placeholder="Misal: Buka Mesin"
                            />
                          </div>

                          {elements.filter(el => el.type === '3d_model').length === 0 ? (
                            <div className="bg-pln-yellow/10 border border-pln-yellow/30 p-3 rounded-lg">
                              <p className="text-[10px] text-pln-yellow font-medium">
                                💡 Anda belum memasukkan Model 3D ke dalam Editor. Masukkan model 3D terlebih dahulu agar tombol ini bisa menggerakkannya!
                              </p>
                            </div>
                          ) : (
                            <>
                              <div className="flex flex-col gap-1.5">
                                <label className="text-xs text-gray-400">Pilih Model 3D yang akan Bergerak</label>
                                <select
                                  value={selectedElement.actionTargetId || ''}
                                  onChange={(e) => updateElement(selectedElement.id, { actionTargetId: e.target.value, actionAnimation: '' })}
                                  className="w-full bg-gray-800/80 border border-gray-600 rounded-lg p-2 text-sm text-white outline-none focus:border-pln-blue shadow-inner"
                                >
                                  <option value="">-- Pilih Model --</option>
                                  {elements.filter(el => el.type === '3d_model').map(model => (
                                    <option key={model.id} value={model.id}>{model.name}</option>
                                  ))}
                                </select>
                              </div>

                              {selectedElement.actionTargetId && (
                                <div className="flex flex-col gap-1.5">
                                  <label className="text-xs text-gray-400">Pilih Animasi yang Diputar</label>
                                  {elements.find(el => el.id === selectedElement.actionTargetId)?.availableAnimations?.length ? (
                                    <select
                                      value={selectedElement.actionAnimation || ''}
                                      onChange={(e) => updateElement(selectedElement.id, { actionAnimation: e.target.value })}
                                      className="w-full bg-gray-800/80 border border-gray-600 rounded-lg p-2 text-sm text-white outline-none focus:border-pln-blue shadow-inner"
                                    >
                                      <option value="">-- Pilih Animasi --</option>
                                      <option value="*">✨ Mainkan Semua Animasi Bersamaan (*)</option>
                                      {elements.find(el => el.id === selectedElement.actionTargetId)?.availableAnimations?.map(anim => (
                                        <option key={anim} value={anim}>{anim}</option>
                                      ))}
                                    </select>
                                  ) : (
                                    <div className="bg-red-500/10 border border-red-500/30 p-2 rounded-lg">
                                      <p className="text-[10px] text-red-400">
                                        Model yang Anda pilih tidak memiliki animasi bawaan. Silakan gunakan file .glb lain yang beranimasi.
                                      </p>
                                    </div>
                                  )}
                                </div>
                              )}
                            </>
                          )}
                        </div>
                      )}

                      {/* Edu Panel Specific Properties */}
                      {selectedElement.type === 'edu_panel' && (
                        <div className="space-y-4 pt-4 border-t border-gray-800">
                          <h4 className="text-xs font-bold text-pln-yellow uppercase flex items-center gap-2">
                            <LayoutDashboard size={14} /> Edu Panel Konten
                          </h4>
                          <p className="text-[10px] text-gray-500 leading-tight">
                            Panel ini akan melayang di layar AR saat audiens memindai gambar.
                          </p>
                          
                          <div className="flex flex-col gap-1.5">
                            <label className="text-xs text-gray-400">Judul Panel Utama</label>
                            <input 
                              type="text"
                              value={selectedElement.panelTitle || ''}
                              onChange={(e) => updateElement(selectedElement.id, { panelTitle: e.target.value })}
                              className="w-full bg-gray-800/80 border border-gray-600 rounded-lg p-2 text-sm text-white outline-none focus:border-pln-blue shadow-inner"
                              placeholder="Misal: MESIN MOTOR"
                            />
                          </div>

                          <div className="h-px bg-gray-800 my-4"></div>

                          {/* Asset Information (Components) Builder */}
                          <div className="flex items-center justify-between">
                            <h4 className="text-xs font-bold text-gray-400 uppercase flex items-center gap-2">
                              <ListChecks size={14} /> Info Aset (Komponen)
                            </h4>
                            <button 
                              onClick={() => {
                                const newComps = [...(selectedElement.eduComponents || []), { id: crypto.randomUUID(), name: 'Komponen Baru' }];
                                updateElement(selectedElement.id, { eduComponents: newComps });
                              }}
                              className="text-[10px] bg-pln-blue/20 text-pln-blue px-2 py-1 rounded border border-pln-blue/30 hover:bg-pln-blue/30 flex items-center gap-1"
                            >
                              <Plus size={10} /> Tambah
                            </button>
                          </div>
                          
                          <div className="space-y-2 mt-2">
                            {(!selectedElement.eduComponents || selectedElement.eduComponents.length === 0) && (
                              <div className="text-[10px] text-gray-500 italic text-center py-2 bg-gray-800/50 rounded border border-gray-800 border-dashed">Belum ada komponen.</div>
                            )}
                            {selectedElement.eduComponents?.map((comp, idx) => (
                              <div key={comp.id} className="bg-gray-800/80 border border-gray-700 rounded-lg p-2 space-y-2">
                                <div className="flex items-center gap-2">
                                  <input 
                                    type="text"
                                    value={comp.name}
                                    onChange={(e) => {
                                      const newComps = [...selectedElement.eduComponents!];
                                      newComps[idx].name = e.target.value;
                                      updateElement(selectedElement.id, { eduComponents: newComps });
                                    }}
                                    className="flex-1 bg-gray-900 border border-gray-600 rounded p-1 text-xs text-white outline-none focus:border-pln-blue"
                                    placeholder="Nama Komponen"
                                  />
                                  <button 
                                    onClick={() => {
                                      const newComps = selectedElement.eduComponents!.filter(c => c.id !== comp.id);
                                      updateElement(selectedElement.id, { eduComponents: newComps });
                                    }}
                                    className="text-red-400 hover:text-red-300 p-1"
                                  ><Trash2 size={12} /></button>
                                </div>
                                <div className="flex gap-2">
                                  <select
                                    value={comp.actionTargetId || ''}
                                    onChange={(e) => {
                                      const newComps = [...selectedElement.eduComponents!];
                                      newComps[idx].actionTargetId = e.target.value;
                                      newComps[idx].actionAnimation = '';
                                      updateElement(selectedElement.id, { eduComponents: newComps });
                                    }}
                                    className="flex-1 min-w-0 text-ellipsis bg-gray-900 border border-gray-600 rounded p-1 text-[10px] text-white outline-none"
                                  >
                                    <option value="">-- Target Model 3D --</option>
                                    {elements.filter(el => el.type === '3d_model').map(model => (
                                      <option key={model.id} value={model.id}>{model.name}</option>
                                    ))}
                                  </select>
                                  {comp.actionTargetId && (
                                    <select
                                      value={comp.actionAnimation || ''}
                                      onChange={(e) => {
                                        const newComps = [...selectedElement.eduComponents!];
                                        newComps[idx].actionAnimation = e.target.value;
                                        updateElement(selectedElement.id, { eduComponents: newComps });
                                      }}
                                      className="flex-1 min-w-0 text-ellipsis bg-gray-900 border border-gray-600 rounded p-1 text-[10px] text-white outline-none"
                                    >
                                      <option value="">-- Animasi --</option>
                                      <option value="*">Semua (*)</option>
                                      {elements.find(el => el.id === comp.actionTargetId)?.availableAnimations?.map(anim => (
                                        <option key={anim} value={anim}>{anim}</option>
                                      ))}
                                    </select>
                                  )}
                                </div>
                                <div className="flex gap-2">
                                  <select
                                    value={comp.showTargetId || ''}
                                    onChange={(e) => {
                                      const newComps = [...selectedElement.eduComponents!];
                                      newComps[idx].showTargetId = e.target.value;
                                      updateElement(selectedElement.id, { eduComponents: newComps });
                                    }}
                                    className="flex-1 min-w-0 text-ellipsis bg-gray-900 border border-gray-600 rounded p-1 text-[10px] text-green-400 outline-none"
                                  >
                                    <option value="">- Munculkan Model -</option>
                                    {elements.filter(el => el.type === '3d_model').map(model => (
                                      <option key={model.id} value={model.id}>{model.name}</option>
                                    ))}
                                  </select>
                                  <select
                                    value={comp.hideTargetId || ''}
                                    onChange={(e) => {
                                      const newComps = [...selectedElement.eduComponents!];
                                      newComps[idx].hideTargetId = e.target.value;
                                      updateElement(selectedElement.id, { eduComponents: newComps });
                                    }}
                                    className="flex-1 min-w-0 text-ellipsis bg-gray-900 border border-gray-600 rounded p-1 text-[10px] text-red-400 outline-none"
                                  >
                                    <option value="">- Sembunyikan Model -</option>
                                    {elements.filter(el => el.type === '3d_model').map(model => (
                                      <option key={model.id} value={model.id}>{model.name}</option>
                                    ))}
                                  </select>
                                </div>
                              </div>
                            ))}
                          </div>

                          <div className="h-px bg-gray-800 my-4"></div>

                          {/* Maintenance Tasks Builder */}
                          <div className="flex items-center justify-between">
                            <h4 className="text-xs font-bold text-gray-400 uppercase flex items-center gap-2">
                              <Wrench size={14} /> Tugas Maintenance
                            </h4>
                            <button 
                              onClick={() => {
                                const newTasks = [...(selectedElement.eduMaintenanceTasks || []), { id: crypto.randomUUID(), title: 'Tugas Baru', steps: [] }];
                                updateElement(selectedElement.id, { eduMaintenanceTasks: newTasks });
                              }}
                              className="text-[10px] bg-pln-yellow/20 text-pln-yellow px-2 py-1 rounded border border-pln-yellow/30 hover:bg-pln-yellow/30 flex items-center gap-1"
                            >
                              <Plus size={10} /> Tambah
                            </button>
                          </div>

                          <div className="space-y-3 mt-2">
                            {(!selectedElement.eduMaintenanceTasks || selectedElement.eduMaintenanceTasks.length === 0) && (
                              <div className="text-[10px] text-gray-500 italic text-center py-2 bg-gray-800/50 rounded border border-gray-800 border-dashed">Belum ada tugas maintenance.</div>
                            )}
                            {selectedElement.eduMaintenanceTasks?.map((task, tIdx) => (
                              <div key={task.id} className="bg-gray-800/60 border border-gray-700 rounded-lg p-2 space-y-2">
                                <div className="flex items-center gap-2">
                                  <input 
                                    type="text"
                                    value={task.title}
                                    onChange={(e) => {
                                      const newTasks = [...selectedElement.eduMaintenanceTasks!];
                                      newTasks[tIdx].title = e.target.value;
                                      updateElement(selectedElement.id, { eduMaintenanceTasks: newTasks });
                                    }}
                                    className="flex-1 bg-gray-900 border border-gray-600 rounded p-1 text-xs font-bold text-pln-yellow outline-none focus:border-pln-yellow"
                                    placeholder="Judul Tugas (misal: Ganti RAM)"
                                  />
                                  <button 
                                    onClick={() => {
                                      const newTasks = selectedElement.eduMaintenanceTasks!.filter(t => t.id !== task.id);
                                      updateElement(selectedElement.id, { eduMaintenanceTasks: newTasks });
                                    }}
                                    className="text-red-400 hover:text-red-300 p-1"
                                  ><Trash2 size={12} /></button>
                                </div>
                                
                                {/* Steps Builder */}
                                <div className="pl-3 border-l-2 border-gray-700 space-y-2">
                                  {task.steps.map((step, sIdx) => (
                                    <div key={step.id} className="bg-gray-900/50 border border-gray-700 rounded p-2 space-y-1.5">
                                      <div className="flex items-start gap-2">
                                        <span className="text-[10px] font-bold text-gray-500 bg-gray-800 px-1.5 rounded mt-0.5">{sIdx + 1}</span>
                                        <textarea
                                          value={step.instruction}
                                          onChange={(e) => {
                                            const newTasks = [...selectedElement.eduMaintenanceTasks!];
                                            newTasks[tIdx].steps[sIdx].instruction = e.target.value;
                                            updateElement(selectedElement.id, { eduMaintenanceTasks: newTasks });
                                          }}
                                          className="flex-1 bg-gray-800 border border-gray-700 rounded p-1 text-[10px] text-white outline-none focus:border-pln-blue min-h-[40px] resize-none"
                                          placeholder="Instruksi langkah..."
                                        />
                                        <button 
                                          onClick={() => {
                                            const newTasks = [...selectedElement.eduMaintenanceTasks!];
                                            newTasks[tIdx].steps = newTasks[tIdx].steps.filter(s => s.id !== step.id);
                                            updateElement(selectedElement.id, { eduMaintenanceTasks: newTasks });
                                          }}
                                          className="text-red-400 hover:text-red-300 mt-1"
                                        ><X size={12} /></button>
                                      </div>
                                      <div className="flex gap-2 pl-6">
                                        <select
                                          value={step.actionTargetId || ''}
                                          onChange={(e) => {
                                            const newTasks = [...selectedElement.eduMaintenanceTasks!];
                                            newTasks[tIdx].steps[sIdx].actionTargetId = e.target.value;
                                            newTasks[tIdx].steps[sIdx].actionAnimation = '';
                                            updateElement(selectedElement.id, { eduMaintenanceTasks: newTasks });
                                          }}
                                          className="flex-1 min-w-0 text-ellipsis bg-gray-800 border border-gray-700 rounded p-1 text-[9px] text-white outline-none"
                                        >
                                          <option value="">- Animasi Model -</option>
                                          {elements.filter(el => el.type === '3d_model').map(model => (
                                            <option key={model.id} value={model.id}>{model.name}</option>
                                          ))}
                                        </select>
                                        {step.actionTargetId && (
                                          <select
                                            value={step.actionAnimation || ''}
                                            onChange={(e) => {
                                              const newTasks = [...selectedElement.eduMaintenanceTasks!];
                                              newTasks[tIdx].steps[sIdx].actionAnimation = e.target.value;
                                              updateElement(selectedElement.id, { eduMaintenanceTasks: newTasks });
                                            }}
                                            className="flex-1 min-w-0 text-ellipsis bg-gray-800 border border-gray-700 rounded p-1 text-[9px] text-white outline-none"
                                          >
                                            <option value="">- Clip -</option>
                                            <option value="*">Semua (*)</option>
                                            {elements.find(el => el.id === step.actionTargetId)?.availableAnimations?.map(anim => (
                                              <option key={anim} value={anim}>{anim}</option>
                                            ))}
                                          </select>
                                        )}
                                      </div>
                                      <div className="flex gap-2 pl-6">
                                        <select
                                          value={step.showTargetId || ''}
                                          onChange={(e) => {
                                            const newTasks = [...selectedElement.eduMaintenanceTasks!];
                                            newTasks[tIdx].steps[sIdx].showTargetId = e.target.value;
                                            updateElement(selectedElement.id, { eduMaintenanceTasks: newTasks });
                                          }}
                                          className="flex-1 min-w-0 text-ellipsis bg-gray-800 border border-gray-700 rounded p-1 text-[9px] text-green-400 outline-none"
                                        >
                                          <option value="">- Munculkan Model -</option>
                                          {elements.filter(el => el.type === '3d_model').map(model => (
                                            <option key={model.id} value={model.id}>{model.name}</option>
                                          ))}
                                        </select>
                                        <select
                                          value={step.hideTargetId || ''}
                                          onChange={(e) => {
                                            const newTasks = [...selectedElement.eduMaintenanceTasks!];
                                            newTasks[tIdx].steps[sIdx].hideTargetId = e.target.value;
                                            updateElement(selectedElement.id, { eduMaintenanceTasks: newTasks });
                                          }}
                                          className="flex-1 min-w-0 text-ellipsis bg-gray-800 border border-gray-700 rounded p-1 text-[9px] text-red-400 outline-none"
                                        >
                                          <option value="">- Sembunyikan Model -</option>
                                          {elements.filter(el => el.type === '3d_model').map(model => (
                                            <option key={model.id} value={model.id}>{model.name}</option>
                                          ))}
                                        </select>
                                      </div>
                                    </div>
                                  ))}
                                  
                                  <button 
                                    onClick={() => {
                                      const newTasks = [...selectedElement.eduMaintenanceTasks!];
                                      newTasks[tIdx].steps.push({ id: crypto.randomUUID(), instruction: '' });
                                      updateElement(selectedElement.id, { eduMaintenanceTasks: newTasks });
                                    }}
                                    className="text-[9px] text-gray-400 hover:text-white flex items-center gap-1 ml-1"
                                  >
                                    <Plus size={10} /> Tambah Langkah
                                  </button>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* 3D Model Visibility Options */}
                      {selectedElement.type === '3d_model' && (
                        <div className="space-y-3 pt-4 border-t border-gray-800">
                          <h4 className="text-xs font-bold text-gray-400 uppercase flex items-center gap-2">
                            <Eye size={12} className="text-pln-blue"/> Visibilitas Awal
                          </h4>
                          <div className="flex bg-gray-900 rounded-lg p-1 border border-gray-700">
                            <button
                              onClick={() => updateElement(selectedElement.id, { visibilityMode: 'visible' })}
                              className={`flex-1 py-1.5 text-[10px] font-bold rounded-md transition-colors ${selectedElement.visibilityMode !== 'hidden' ? 'bg-pln-blue text-white' : 'text-gray-400 hover:text-white'}`}
                            >
                              Tampil (Main)
                            </button>
                            <button
                              onClick={() => updateElement(selectedElement.id, { visibilityMode: 'hidden' })}
                              className={`flex-1 py-1.5 text-[10px] font-bold rounded-md transition-colors ${selectedElement.visibilityMode === 'hidden' ? 'bg-pln-blue text-white' : 'text-gray-400 hover:text-white'}`}
                            >
                              Sembunyi (Second)
                            </button>
                          </div>
                        </div>
                      )}

                      {/* 3D Model Animations Display */}
                      {selectedElement.type === '3d_model' && selectedElement.availableAnimations && selectedElement.availableAnimations.length > 0 && (
                        <div className="space-y-3 pt-4 border-t border-gray-800">
                          <h4 className="text-xs font-bold text-gray-400 uppercase flex items-center gap-2">
                            <Play size={12} className="text-pln-yellow"/> Animasi Bawaan Terdeteksi
                          </h4>
                          
                          <div className="flex flex-col gap-2">
                            <button 
                              onClick={() => {
                                if (previewAnim?.targetId === selectedElement.id && previewAnim?.animationName === '*') {
                                  setPreviewAnimationData(null);
                                } else {
                                  setPreviewAnimationData({ targetId: selectedElement.id, animationName: '*' });
                                }
                              }}
                              className={`flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium transition-colors border ${
                                previewAnim?.targetId === selectedElement.id && previewAnim?.animationName === '*' 
                                ? 'bg-pln-yellow/20 border-pln-yellow text-pln-yellow' 
                                : 'bg-gray-800 hover:bg-gray-700 border-gray-700 text-gray-300'
                              }`}
                            >
                              <span>✨ Mainkan Semua Bersamaan</span>
                              {previewAnim?.targetId === selectedElement.id && previewAnim?.animationName === '*' ? <span className="text-[10px]">🛑 Stop</span> : <Play size={10} />}
                            </button>

                            {selectedElement.availableAnimations.map(anim => (
                              <button 
                                key={anim}
                                onClick={() => {
                                  if (previewAnim?.targetId === selectedElement.id && previewAnim?.animationName === anim) {
                                    setPreviewAnimationData(null);
                                  } else {
                                    setPreviewAnimationData({ targetId: selectedElement.id, animationName: anim });
                                  }
                                }}
                                className={`flex items-center justify-between px-3 py-1.5 rounded-lg text-xs font-medium transition-colors border ${
                                  previewAnim?.targetId === selectedElement.id && previewAnim?.animationName === anim 
                                  ? 'bg-blue-500/20 border-blue-500 text-blue-400' 
                                  : 'bg-gray-800/50 hover:bg-gray-700 border-gray-700/50 text-gray-400'
                                }`}
                              >
                                <span className="truncate pr-2">{anim}</span>
                                {previewAnim?.targetId === selectedElement.id && previewAnim?.animationName === anim ? <span className="text-[10px]">🛑 Stop</span> : <Play size={10} />}
                              </button>
                            ))}
                          </div>
                          <p className="text-[10px] text-gray-500">Klik tombol di atas untuk melihat *preview* animasi di kanvas. Buat "UI Button" untuk memicunya di AR.</p>
                        </div>
                      )}

                      {/* Audio Properties Display */}
                      {selectedElement.type === 'audio' && (
                        <div className="space-y-4 pt-4 border-t border-gray-800">
                          <h4 className="text-xs font-bold text-gray-400 uppercase flex items-center gap-2">
                            <Volume2 size={12} className="text-pink-400"/> Audio Settings
                          </h4>
                          
                          <div className="flex flex-col gap-3">
                            <div className="flex items-center justify-between">
                              <label className="text-xs text-gray-300">Autoplay (BGM)</label>
                              <input 
                                type="checkbox"
                                checked={selectedElement.autoplay !== false}
                                onChange={(e) => updateElement(selectedElement.id, { autoplay: e.target.checked })}
                                className="w-4 h-4 accent-pln-blue"
                              />
                            </div>
                            
                            <div className="flex items-center justify-between">
                              <label className="text-xs text-gray-300">Loop (Ulang Terus)</label>
                              <input 
                                type="checkbox"
                                checked={selectedElement.loop !== false}
                                onChange={(e) => updateElement(selectedElement.id, { loop: e.target.checked })}
                                className="w-4 h-4 accent-pln-blue"
                              />
                            </div>
                            
                            <div className="flex flex-col gap-1.5">
                              <label className="text-xs text-gray-400 flex justify-between">
                                Volume
                                <span className="font-mono text-[10px]">{(selectedElement.volume ?? 1).toFixed(1)}</span>
                              </label>
                              <input 
                                type="range" 
                                min="0" max="1" step="0.1" 
                                value={selectedElement.volume ?? 1}
                                onChange={(e) => updateElement(selectedElement.id, { volume: parseFloat(e.target.value) })}
                                className="w-full accent-pln-blue"
                              />
                            </div>
                          </div>
                        </div>
                      )}
                      
                      {/* Video Properties Display */}
                      {selectedElement.type === 'video' && (
                        <div className="space-y-4 pt-4 border-t border-gray-800">
                          <h4 className="text-xs font-bold text-gray-400 uppercase flex items-center gap-2">
                            <Video size={12} className="text-red-400"/> Video Settings
                          </h4>
                          
                          <div className="flex flex-col gap-3">
                            <div className="flex items-center justify-between">
                              <label className="text-xs text-gray-300">Autoplay</label>
                              <input 
                                type="checkbox"
                                checked={selectedElement.autoplay !== false}
                                onChange={(e) => updateElement(selectedElement.id, { autoplay: e.target.checked })}
                                className="w-4 h-4 accent-pln-blue"
                              />
                            </div>
                            
                            <div className="flex items-center justify-between">
                              <label className="text-xs text-gray-300">Loop</label>
                              <input 
                                type="checkbox"
                                checked={selectedElement.loop !== false}
                                onChange={(e) => updateElement(selectedElement.id, { loop: e.target.checked })}
                                className="w-4 h-4 accent-pln-blue"
                              />
                            </div>

                            <div className="flex items-center justify-between pt-2 border-t border-gray-700/50">
                              <label className="text-xs text-gray-300 font-bold">Hologram (Chroma Key)</label>
                              <input 
                                type="checkbox"
                                checked={selectedElement.chromaKey || false}
                                onChange={(e) => updateElement(selectedElement.id, { chromaKey: e.target.checked })}
                                className="w-4 h-4 accent-pln-blue"
                              />
                            </div>

                            {selectedElement.chromaKey && (
                              <div className="flex flex-col gap-1.5">
                                <label className="text-xs text-gray-400 flex justify-between">
                                  Warna Latar untuk Dihapus
                                  <span className="font-mono text-[10px] bg-gray-800 px-1 rounded">{selectedElement.chromaKeyColor || '#00ff00'}</span>
                                </label>
                                <input 
                                  type="color" 
                                  value={selectedElement.chromaKeyColor || '#00ff00'}
                                  onChange={(e) => updateElement(selectedElement.id, { chromaKeyColor: e.target.value })}
                                  className="w-full h-8 bg-gray-800 border border-gray-700 rounded cursor-pointer"
                                />
                              </div>
                            )}
                          </div>
                        </div>
                      )}

                      {/* Hotspot Properties Display */}
                      {selectedElement.type === 'hotspot' && (
                        <div className="space-y-4 pt-4 border-t border-gray-800">
                          <h4 className="text-xs font-bold text-gray-400 uppercase flex items-center gap-2">
                            <MapPin size={12} className="text-orange-400"/> Hotspot Settings
                          </h4>
                          
                          <div className="flex flex-col gap-1.5">
                            <label className="text-xs text-gray-400">Teks Penjelasan</label>
                            <textarea
                              value={selectedElement.hotspotText || ''}
                              onChange={(e) => updateElement(selectedElement.id, { hotspotText: e.target.value })}
                              className="w-full bg-gray-800 border border-gray-700 rounded-lg p-2.5 text-xs text-white outline-none focus:border-pln-blue min-h-[80px]"
                              placeholder="Masukkan teks saat hotspot diklik..."
                            />
                          </div>
                        </div>
                      )}

                      {/* VFX Properties Display */}
                      {selectedElement.type === 'vfx_sparkles' && (
                        <div className="space-y-4 pt-4 border-t border-gray-800">
                          <h4 className="text-xs font-bold text-gray-400 uppercase flex items-center gap-2">
                            <Sparkles size={12} className="text-yellow-400"/> VFX Settings
                          </h4>
                          
                          <div className="flex flex-col gap-3">
                            <div className="flex flex-col gap-1.5">
                              <label className="text-xs text-gray-400 flex justify-between">
                                Warna Partikel
                                <span className="font-mono text-[10px] bg-gray-800 px-1 rounded">{selectedElement.sparkleColor || '#ffffff'}</span>
                              </label>
                              <input 
                                type="color" 
                                value={selectedElement.sparkleColor || '#ffffff'}
                                onChange={(e) => updateElement(selectedElement.id, { sparkleColor: e.target.value })}
                                className="w-full h-8 bg-gray-800 border border-gray-700 rounded cursor-pointer"
                              />
                            </div>
                            
                            <div className="flex flex-col gap-1.5">
                              <label className="text-xs text-gray-400 flex justify-between">
                                Jumlah Partikel
                                <span className="font-mono text-[10px]">{selectedElement.sparkleCount || 100}</span>
                              </label>
                              <input 
                                type="range" 
                                min="10" max="500" step="10" 
                                value={selectedElement.sparkleCount || 100}
                                onChange={(e) => updateElement(selectedElement.id, { sparkleCount: parseInt(e.target.value) })}
                                className="w-full accent-pln-blue"
                              />
                            </div>

                            <div className="flex flex-col gap-1.5">
                              <label className="text-xs text-gray-400 flex justify-between">
                                Ukuran Partikel
                                <span className="font-mono text-[10px]">{selectedElement.sparkleSize || 2}</span>
                              </label>
                              <input 
                                type="range" 
                                min="0.5" max="10" step="0.5" 
                                value={selectedElement.sparkleSize || 2}
                                onChange={(e) => updateElement(selectedElement.id, { sparkleSize: parseFloat(e.target.value) })}
                                className="w-full accent-pln-blue"
                              />
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                <div className="h-px bg-gray-800 my-2"></div>

                <div>
                  <h3 className="text-sm font-bold text-gray-200 mb-3">Transform</h3>
                  <div className="space-y-3">
                    <TransformRow 
                      label="Posisi" 
                      values={selectedElement.position} 
                      onChange={(i, val) => {
                        const newPos = [...selectedElement.position];
                        newPos[i] = val;
                        updateElement(selectedElement.id, { position: newPos as [number, number, number] });
                      }}
                    />
                    <TransformRow 
                      label="Rotasi" 
                      values={selectedElement.rotation} 
                      onChange={(i, val) => {
                        const newRot = [...selectedElement.rotation];
                        newRot[i] = val;
                        updateElement(selectedElement.id, { rotation: newRot as [number, number, number] });
                      }}
                    />
                    <TransformRow 
                      label="Skala" 
                      values={selectedElement.scale} 
                      onChange={(i, val) => {
                        const newScale = [...selectedElement.scale];
                        newScale[i] = val;
                        updateElement(selectedElement.id, { scale: newScale as [number, number, number] });
                      }}
                    />
                  </div>
                  <p className="text-[10px] text-gray-500 mt-4 text-center">
                    Tarik panah/lingkaran navigasi 3D di viewport untuk mengubah letak secara langsung.
                  </p>
                </div>

                <div className="h-px bg-gray-800 my-2"></div>

                <div>
                  <h3 className="text-sm font-bold text-gray-200 mb-3 flex items-center gap-2">
                    <MousePointerClick size={14} className="text-blue-400" /> Interaktivitas (On-Click)
                  </h3>
                  <div className="space-y-3">
                    <div className="flex flex-col gap-1.5">
                      <label className="text-xs text-gray-400">Pilih Aksi</label>
                      <select
                        value={selectedElement.onClickActionType || 'none'}
                        onChange={(e) => updateElement(selectedElement.id, { 
                          onClickActionType: e.target.value as any,
                          onClickActionValue: '' // reset value
                        })}
                        className="bg-gray-800 border border-gray-700 rounded-lg p-2 text-xs text-white outline-none focus:border-pln-blue"
                      >
                        <option value="none">-- Tidak Ada Aksi --</option>
                        <option value="url">Buka Link (URL / WhatsApp)</option>
                        <option value="audio">Putar Audio</option>
                        <option value="animation">Mainkan Animasi Model 3D</option>
                        <option value="change_scene">Pindah Scene (Multi-Scene)</option>
                      </select>
                    </div>

                    {selectedElement.onClickActionType === 'url' && (
                      <div className="flex flex-col gap-1.5">
                        <label className="text-xs text-gray-400">URL Tujuan</label>
                        <input
                          type="url"
                          value={selectedElement.onClickActionValue || ''}
                          onChange={(e) => updateElement(selectedElement.id, { onClickActionValue: e.target.value })}
                          className="bg-gray-800 border border-gray-700 rounded-lg p-2 text-xs text-white outline-none focus:border-pln-blue"
                          placeholder="https://..."
                        />
                      </div>
                    )}

                    {selectedElement.onClickActionType === 'change_scene' && (
                      <div className="flex flex-col gap-1.5">
                        <label className="text-xs text-gray-400">Pilih Scene Tujuan</label>
                        <select
                          value={selectedElement.onClickActionValue || ''}
                          onChange={(e) => updateElement(selectedElement.id, { onClickActionValue: e.target.value })}
                          className="bg-gray-800 border border-gray-700 rounded-lg p-2 text-xs text-white outline-none focus:border-pln-blue"
                        >
                          <option value="">-- Pilih Scene --</option>
                          {scenes.map(sc => (
                            <option key={sc.id} value={sc.id}>{sc.name}</option>
                          ))}
                        </select>
                        <p className="text-[10px] text-gray-500">Saat objek ini diklik di AR, presentasi akan berpindah ke Scene yang dipilih.</p>
                      </div>
                    )}

                    {selectedElement.onClickActionType === 'audio' && (
                      <div className="flex flex-col gap-1.5">
                        <label className="text-xs text-gray-400">Pilih Elemen Audio</label>
                        <select
                          value={selectedElement.onClickActionValue || ''}
                          onChange={(e) => updateElement(selectedElement.id, { onClickActionValue: e.target.value })}
                          className="bg-gray-800 border border-gray-700 rounded-lg p-2 text-xs text-white outline-none focus:border-pln-blue"
                        >
                          <option value="">-- Pilih Audio --</option>
                          {elements.filter(el => el.type === 'audio').map(audio => (
                            <option key={audio.id} value={audio.id}>{audio.name}</option>
                          ))}
                        </select>
                      </div>
                    )}

                    {selectedElement.onClickActionType === 'animation' && (
                      <div className="flex flex-col gap-1.5">
                        <label className="text-xs text-gray-400">Target Model 3D</label>
                        <select
                          value={selectedElement.onClickActionValue ? selectedElement.onClickActionValue.split('|')[0] : ''}
                          onChange={(e) => updateElement(selectedElement.id, { onClickActionValue: e.target.value + '|*' })} // Default select All
                          className="bg-gray-800 border border-gray-700 rounded-lg p-2 text-xs text-white outline-none focus:border-pln-blue"
                        >
                          <option value="">-- Pilih Model 3D --</option>
                          {elements.filter(el => el.type === '3d_model').map(model => (
                            <option key={model.id} value={model.id}>{model.name}</option>
                          ))}
                        </select>
                        
                        {selectedElement.onClickActionValue && selectedElement.onClickActionValue.split('|')[0] && (
                          <select
                            value={selectedElement.onClickActionValue.split('|')[1] || '*'}
                            onChange={(e) => {
                              const targetId = selectedElement.onClickActionValue!.split('|')[0];
                              updateElement(selectedElement.id, { onClickActionValue: `${targetId}|${e.target.value}` });
                            }}
                            className="bg-gray-800 border border-gray-700 rounded-lg p-2 text-xs text-white outline-none focus:border-pln-blue mt-1"
                          >
                            <option value="*">Semua Animasi (*)</option>
                            {elements.find(el => el.id === selectedElement.onClickActionValue!.split('|')[0])?.availableAnimations?.map(anim => (
                              <option key={anim} value={anim}>{anim}</option>
                            ))}
                          </select>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </>
            )}

          </div>
        </aside>

        {/* Bottom Scene Manager */}
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 pointer-events-auto bg-gray-900/90 backdrop-blur-xl border border-gray-700/50 rounded-full flex p-1.5 shadow-2xl z-40 gap-1 items-center max-w-[90vw] overflow-x-auto custom-scrollbar">
          {scenes.map(sc => (
            <div key={sc.id} className="relative group flex items-center">
              <button
                onClick={() => setCurrentSceneId(sc.id)}
                className={`px-4 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition-colors ${currentSceneId === sc.id ? 'bg-pln-blue text-white shadow-md' : 'text-gray-400 hover:text-white hover:bg-gray-800'}`}
              >
                {sc.name}
              </button>
              {scenes.length > 1 && currentSceneId !== sc.id && (
                <button 
                  onClick={(e) => { e.stopPropagation(); removeScene(sc.id); }}
                  className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity shadow-lg"
                >
                  <X size={10} />
                </button>
              )}
            </div>
          ))}
          <div className="w-px h-5 bg-gray-700 mx-1"></div>
          <button
            onClick={() => addScene(`Scene ${scenes.length + 1}`)}
            className="p-1.5 text-gray-400 hover:text-white hover:bg-gray-800 rounded-full transition-colors flex items-center justify-center shrink-0"
            title="Tambah Scene Baru"
          >
            <Plus size={16} />
          </button>
        </div>

        {/* Floating AI Assistant Widget */}
        <div className="absolute bottom-20 right-4 md:right-[310px] z-50 flex flex-col items-end pointer-events-none">
          {isAIOpen && (
            <div className="bg-gray-900 border border-gray-700/50 rounded-2xl shadow-2xl w-80 h-96 mb-4 flex flex-col overflow-hidden pointer-events-auto transition-all animate-in slide-in-from-bottom-5">
              <div className="bg-gradient-to-r from-pln-blue to-purple-600 p-3 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Bot size={18} className="text-white" />
                  <span className="font-bold text-sm text-white">AI Editor Assistant</span>
                </div>
                <button onClick={() => setIsAIOpen(false)} className="text-white/80 hover:text-white">
                  <X size={16} />
                </button>
              </div>
              <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-3 custom-scrollbar bg-gray-900/50">
                {aiMessages.map((msg, i) => (
                  <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-[85%] rounded-xl p-2.5 text-xs ${msg.role === 'user' ? 'bg-pln-blue text-white rounded-tr-sm' : 'bg-gray-800 text-gray-200 border border-gray-700 rounded-tl-sm'}`}>
                      {msg.text}
                    </div>
                  </div>
                ))}
                {isAIProcessing && (
                  <div className="flex justify-start">
                    <div className="max-w-[85%] rounded-xl p-2.5 text-xs bg-gray-800 text-gray-400 border border-gray-700 rounded-tl-sm flex items-center gap-1">
                      <span className="animate-bounce">.</span><span className="animate-bounce delay-75">.</span><span className="animate-bounce delay-150">.</span>
                    </div>
                  </div>
                )}
              </div>
              <div className="p-3 border-t border-gray-800 bg-gray-900">
                <form onSubmit={handleAISubmit} className="relative">
                  <input
                    type="text"
                    value={aiInput}
                    onChange={(e) => setAiInput(e.target.value)}
                    placeholder="Ketik 'buat gelap'..."
                    className="w-full bg-gray-800 border border-gray-700 rounded-full py-2 pl-4 pr-10 text-xs text-white outline-none focus:border-pln-blue placeholder-gray-500"
                    disabled={isAIProcessing}
                  />
                  <button 
                    type="submit" 
                    disabled={isAIProcessing || !aiInput.trim()}
                    className="absolute right-1 top-1 bottom-1 w-8 bg-pln-blue hover:bg-pln-blue-dark rounded-full flex items-center justify-center transition-colors disabled:opacity-50"
                  >
                    <Send size={12} className="text-white" />
                  </button>
                </form>
              </div>
            </div>
          )}
          <button
            onClick={() => setIsAIOpen(!isAIOpen)}
            className="w-12 h-12 bg-gradient-to-tr from-pln-blue to-purple-600 rounded-full flex items-center justify-center shadow-2xl hover:scale-105 transition-transform pointer-events-auto border-2 border-gray-900"
          >
            {isAIOpen ? <X size={20} className="text-white" /> : <MessageSquare size={20} className="text-white" />}
          </button>
        </div>

      </div>

      {/* Publish Success & QR Code Modal */}
      {showPublishModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-gray-900 border border-gray-800 rounded-2xl w-full max-w-md shadow-2xl overflow-hidden flex flex-col">
            <div className="p-4 border-b border-gray-800 flex items-center justify-between">
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <QrCode className="text-pln-blue" size={20} />
                Proyek Berhasil Di-publish!
              </h2>
              <button onClick={() => setShowPublishModal(false)} className="text-gray-400 hover:text-white transition-colors p-1 rounded-md hover:bg-gray-800">
                <X size={20} />
              </button>
            </div>
            
            <div className="p-6 flex flex-col items-center">
              <p className="text-sm text-gray-400 text-center mb-6">
                Scan QR Code ini menggunakan kamera HP audiens Anda untuk langsung membuka pengalaman AR tanpa harus menginstal aplikasi.
              </p>
              
              <div className="bg-white p-4 rounded-xl shadow-lg mb-6 border-4" style={{ borderColor: brandColor }} id="qr-code-container">
                <QRCodeSVG 
                  value={`${window.location.origin}/ar-viewer/${project?.id}`} 
                  size={200}
                  level="H"
                  includeMargin={true}
                  fgColor={brandColor}
                  imageSettings={brandLogoUrl ? {
                    src: brandLogoUrl,
                    x: undefined,
                    y: undefined,
                    height: 48,
                    width: 48,
                    excavate: true,
                  } : undefined}
                />
              </div>

              <div className="flex flex-col w-full gap-3">
                <button 
                  onClick={() => {
                    const svg = document.querySelector('#qr-code-container svg');
                    if (!svg) return;
                    const svgData = new XMLSerializer().serializeToString(svg);
                    const canvas = document.createElement("canvas");
                    const ctx = canvas.getContext("2d");
                    const img = new Image();
                    img.onload = () => {
                      canvas.width = img.width;
                      canvas.height = img.height;
                      ctx?.drawImage(img, 0, 0);
                      const pngFile = canvas.toDataURL("image/png");
                      const downloadLink = document.createElement("a");
                      downloadLink.download = `QR-${project?.title.replace(/\s+/g, '-')}.png`;
                      downloadLink.href = `${pngFile}`;
                      downloadLink.click();
                    };
                    img.src = "data:image/svg+xml;base64," + btoa(unescape(encodeURIComponent(svgData)));
                  }}
                  className="flex items-center justify-center gap-2 w-full py-2.5 bg-gray-800 hover:bg-gray-700 text-white rounded-lg font-medium transition-colors border border-gray-700"
                >
                  <Download size={16} />
                  Download QR Code (PNG)
                </button>
                
                <Link 
                  href={`/ar-viewer/${project?.id}`}
                  target="_blank"
                  className="flex items-center justify-center gap-2 w-full py-2.5 bg-pln-blue hover:bg-pln-blue-dark text-white rounded-lg font-bold transition-colors"
                >
                  <ExternalLink size={16} />
                  Buka AR Viewer Sekarang
                </Link>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function TransformRow({ label, values, onChange }: { label: string, values: number[], onChange: (index: number, val: number) => void }) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 sm:gap-2">
      <span className="text-xs text-gray-500 sm:w-12">{label}</span>
      <div className="flex gap-1 flex-1">
        {['X', 'Y', 'Z'].map((axis, i) => (
          <div key={axis} className="flex items-center bg-gray-800 rounded-md flex-1 overflow-hidden border border-gray-700 focus-within:border-pln-blue transition-colors">
            <span className="text-[10px] text-gray-500 px-1.5 bg-gray-800/50 border-r border-gray-700/50 font-medium">{axis}</span>
            <input 
              type="number" 
              step="0.1"
              value={Number(values[i]).toFixed(2)} 
              onChange={(e) => onChange(i, parseFloat(e.target.value) || 0)}
              className="w-full bg-transparent text-[11px] text-white px-1 py-1.5 outline-none text-center" 
            />
          </div>
        ))}
      </div>
    </div>
  );
}
