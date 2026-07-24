"use client";

import { ArrowLeft, Save, Play, Settings, Image as ImageIcon, Box, Square, Move, RotateCw, Maximize, Layers, Loader2, Type, Trash2, X, PanelLeftClose, PanelRightClose, QrCode, Download, ExternalLink, Copy, MousePointerClick, LayoutDashboard, Plus, ChevronDown, ChevronRight, ChevronLeft, ListChecks, Wrench, Eye, Rocket, Magnet, Volume2, Music, Sparkles, Video, MapPin, Bot, Send, MessageSquare, FolderOpen, Database, Shapes, Triangle, Hexagon, Cone, Cylinder, Circle, Search, LayoutTemplate, Palette, Focus, Clock } from 'lucide-react';
import Link from 'next/link';
import { useEffect, useState, use, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import { useWorkspace } from '@/components/providers/WorkspaceProvider';
import dynamic from 'next/dynamic';
import ShapePreview from '@/components/Editor/ShapePreview';
import { QRCodeSVG } from 'qrcode.react';
import { useEditorStore } from '@/lib/store';
import LogicEditor from '@/components/Editor/LogicEditor';
import TimelinePanel from '@/components/Editor/TimelinePanel';

import { PublishModal } from '@/components/Editor/Modals/PublishModal';
import { PreviewModal } from '@/components/Editor/Modals/PreviewModal';
import { WebcamTestModal } from '@/components/Editor/Modals/WebcamTestModal';
import { SimulatorModal } from '@/components/Editor/Modals/SimulatorModal';

import { RightPanel } from '@/components/Editor/Panels/RightPanel';
import { LeftToolbar } from '@/components/Editor/Panels/LeftToolbar';
import { LeftPanelExpanded } from '@/components/Editor/Panels/LeftPanelExpanded';
import { EditorHeader } from '@/components/Editor/EditorHeader';
import { useEditorShortcuts } from '@/hooks/useEditorShortcuts';
import { toast } from 'sonner';
const EditorViewport = dynamic(() => import('@/components/Editor/EditorViewport'), { ssr: false });

export default function AREditor({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const unwrappedParams = use(params);
  const [project, setProject] = useState<any>(null);
  const [assets, setAssets] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  
  // Asset Filter States
  const [assetSearchQuery, setAssetSearchQuery] = useState('');
  const [assetFilter, setAssetFilter] = useState('all');
  
  // Mobile Panel States
  const [isLeftPanelOpen, setLeftPanelOpen] = useState(false);
  const [leftPanelTab, setLeftPanelTab] = useState<'hierarchy' | 'library' | 'shapes' | 'prefabs'>('hierarchy');
  const [isRightPanelOpen, setRightPanelOpen] = useState(true);

  // AI Assistant State
  const [isAIOpen, setIsAIOpen] = useState(false);
  const [aiInput, setAiInput] = useState('');
  const [aiMessages, setAiMessages] = useState<{role: 'user' | 'ai', text: string}[]>([
    { role: 'ai', text: 'Halo Bos! Saya Asisten AI Anda. Mau ganti suasana (misal: "buat suasana malam") atau tambah efek?' }
  ]);
  const [isAIProcessing, setIsAIProcessing] = useState(false);

  const [showPublishModal, setShowPublishModal] = useState(false);
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [showWebcamTestModal, setShowWebcamTestModal] = useState(false);
  const [showLogicEditor, setShowLogicEditor] = useState(false);
  const [showTimeline, setShowTimeline] = useState(false);
  
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
  const explodeModel = useEditorStore(state => state.explodeModel);
  const multiSelectedIds = useEditorStore(state => state.multiSelectedIds);
  const setMultiSelectedIds = useEditorStore(state => state.setMultiSelectedIds);
  const handleElementClick = useEditorStore(state => state.handleElementClick);
  const groupSelectedElements = useEditorStore(state => state.groupSelectedElements);
  const reparentElement = useEditorStore(state => state.reparentElement);
  const updateElement = useEditorStore(state => state.updateElement);
  const previewAnim = useEditorStore(state => state.previewAnimationData);
  const setPreviewAnimationData = useEditorStore(state => state.setPreviewAnimationData);
  const isSimulating = useEditorStore(state => state.isSimulating);
  const setIsSimulating = useEditorStore(state => state.setIsSimulating);
  const undo = useEditorStore(state => state.undo);
  const redo = useEditorStore(state => state.redo);
  const isSnapping = useEditorStore(state => state.isSnapping);
  const setIsSnapping = useEditorStore(state => state.setIsSnapping);
  const isOrthographic = useEditorStore(state => state.isOrthographic);
  const setIsOrthographic = useEditorStore(state => state.setIsOrthographic);
  const setCameraFocusTarget = useEditorStore(state => state.setCameraFocusTarget);
  const ambientLightIntensity = useEditorStore(state => state.ambientLightIntensity);
  const setAmbientLightIntensity = useEditorStore(state => state.setAmbientLightIntensity);
  const directionalLightIntensity = useEditorStore(state => state.directionalLightIntensity);
  const setDirectionalLightIntensity = useEditorStore(state => state.setDirectionalLightIntensity);
  const environmentMap = useEditorStore(state => state.environmentMap);
  const setEnvironmentMap = useEditorStore(state => state.setEnvironmentMap);
  const trackingMode = useEditorStore(state => state.trackingMode);
  const setTrackingMode = useEditorStore(state => state.setTrackingMode);
  const multisetMapId = useEditorStore(state => state.multisetMapId);
  const setMultisetMapId = useEditorStore(state => state.setMultisetMapId);
  const scenes = useEditorStore(state => state.scenes);
  const currentSceneId = useEditorStore(state => state.currentSceneId);
  const addScene = useEditorStore(state => state.addScene);
  const setCurrentSceneId = useEditorStore(state => state.setCurrentSceneId);
  const removeScene = useEditorStore(state => state.removeScene);
  const triggerCameraReset = useEditorStore(state => state.triggerCameraReset);
  
  const [transformMode, setTransformMode] = useState<'translate' | 'rotate' | 'scale'>('translate');
  
  // Keyboard Shortcuts
  useEditorShortcuts(setTransformMode);

  // Auto-open right panel when an element is selected
  useEffect(() => {
    if (selectedId) {
      setRightPanelOpen(true);
    }
  }, [selectedId]);

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
      if (projData.scene_data) {
        if (projData.scene_data.elements) {
          setElements(projData.scene_data.elements);
        }
        if (projData.scene_data.multiset_map_id) {
          setMultisetMapId(projData.scene_data.multiset_map_id);
        }
      }
    }

    let assetsQuery = supabase.from('assets').select('*').order('created_at', { ascending: false });
    if (activeWorkspace) {
      assetsQuery = assetsQuery.eq('workspace_id', activeWorkspace.id);
    } else {
      assetsQuery = assetsQuery.eq('user_id', session.user.id).is('workspace_id', null);
    }
    const { data: assetsData } = await assetsQuery;

    if (assetsData) setAssets(assetsData);
    
    setLoading(false);
  };

  useEffect(() => {
    fetchEditorData();
  }, [unwrappedParams.id, router, activeWorkspace]);

  const handleSave = async (silent = false) => {
    if (!project) return;
    if (!silent) setSaving(true);
    
    try {
      const sceneData = { elements, multiset_map_id: multisetMapId };
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
      if (!silent) toast.success('Draft berhasil disimpan!');
    } catch (err: any) {
      if (!silent) toast.error('Gagal menyimpan: ' + err.message);
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

  const handlePreview = async () => {
    if (!project) return;
    if (!targetImageUrl) {
      toast.error("Harap pilih atau unggah Target Image (Marker) terlebih dahulu untuk preview AR!");
      return;
    }
    
    // Save draft first to ensure preview is up to date
    await handleSave(true);
    setShowPreviewModal(true);
  };

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
      const sceneData = { elements, multiset_map_id: multisetMapId };
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

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isUploadingAsset, setIsUploadingAsset] = useState(false);

  const handleUploadAsset = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setIsUploadingAsset(true);
      toast.loading('Mengunggah aset...', { id: 'upload' });
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('Not authenticated');

      const fileExt = file.name.split('.').pop();
      const fileName = `${Math.random().toString(36).substring(2, 15)}.${fileExt}`;
      const filePath = `${session.user.id}/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('assets')
        .upload(filePath, file);

      if (uploadError) {
        toast.error('Gagal mengunggah file', { id: 'upload' });
        throw uploadError;
      }

      const { data: { publicUrl } } = supabase.storage
        .from('assets')
        .getPublicUrl(filePath);

      let assetType = 'image';
      if (file.type.startsWith('video/')) assetType = 'video';
      else if (file.type.startsWith('audio/')) assetType = 'audio';
      else if (file.name.endsWith('.glb') || file.name.endsWith('.gltf')) assetType = '3d_model';

      const { error: dbError } = await supabase
        .from('assets')
        .insert({
          user_id: session.user.id,
          workspace_id: activeWorkspace?.id || null,
          name: file.name,
          type: assetType,
          file_url: publicUrl,
          size: `${(file.size / (1024 * 1024)).toFixed(2)} MB`
        });

      if (dbError) {
        toast.error('Gagal menyimpan data ke database', { id: 'upload' });
        throw dbError;
      }
      toast.success('Aset berhasil diunggah!', { id: 'upload' });

      // refresh assets
      fetchEditorData();
    } catch (err: any) {
      alert('Gagal mengunggah: ' + err.message);
    } finally {
      setIsUploadingAsset(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  if (loading) {
    return <div className="h-screen w-screen flex items-center justify-center bg-gray-900 text-white"><Loader2 className="animate-spin" size={32} /></div>;
  }

  const selectedElement = elements.find(el => el.id === selectedId);

  

  return (
    <div className="h-[100dvh] flex flex-col overflow-hidden bg-black relative">
      {/* Editor Header - Blippar Style */}
      <EditorHeader 
        project={project}
        saving={saving}
        lastSaved={lastSaved}
        publishProgress={publishProgress}
        activeRole={activeRole}
        isLeftPanelOpen={isLeftPanelOpen}
        setLeftPanelOpen={setLeftPanelOpen}
        isRightPanelOpen={isRightPanelOpen}
        setRightPanelOpen={setRightPanelOpen}
        handleSave={handleSave}
        handlePreview={handlePreview}
        handlePublish={handlePublish}
        undo={undo}
        redo={redo}
        setIsSimulating={setIsSimulating}
      />

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

        {/* Ultra-slim Toolbar (Blippar Style) */}
        
        <LeftToolbar 
          isLeftPanelOpen={isLeftPanelOpen}
          setLeftPanelOpen={setLeftPanelOpen}
          leftPanelTab={leftPanelTab}
          setLeftPanelTab={setLeftPanelTab}
          showTimeline={showTimeline}
          setShowTimeline={setShowTimeline}
          setShowLogicEditor={setShowLogicEditor}
          addElement={addElement}
          elements={elements}
        />
        
        <LeftPanelExpanded 
          isLeftPanelOpen={isLeftPanelOpen}
          leftPanelTab={leftPanelTab}
          assets={assets}
          assetSearchQuery={assetSearchQuery}
          setAssetSearchQuery={setAssetSearchQuery}
          assetFilter={assetFilter}
          setAssetFilter={setAssetFilter}
          isUploadingAsset={isUploadingAsset}
          handleUploadAsset={handleUploadAsset}
          fileInputRef={fileInputRef}
          setTargetImageUrl={setTargetImageUrl}
        />

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
            className={`p-2 sm:p-2.5 rounded-full transition-all ${isSnapping ? 'bg-pln-yellow/20 text-pln-yellow shadow-lg' : 'text-gray-400 hover:text-white hover:bg-[#1a1b1e]'}`}
            title={isSnapping ? "Matikan Snapping" : "Hidupkan Snapping"}
          >
            <Magnet size={14} />
          </button>
          
          <div className="w-px h-6 bg-gray-700 mx-1"></div>
          
          <button 
            onClick={() => triggerCameraReset()} 
            className="p-2 sm:p-2.5 rounded-full transition-all text-gray-400 hover:text-white hover:bg-gray-800"
            title="Reset Posisi Kamera (View Default)"
          >
            <Focus size={16} />
          </button>

          <div className="w-px h-6 bg-gray-700 mx-1"></div>

          <button 
            onClick={() => setIsOrthographic(!isOrthographic)}
            className={`p-2 sm:p-2.5 rounded-full transition-all ${isOrthographic ? 'bg-pln-blue text-white shadow-lg' : 'text-gray-400 hover:text-white hover:bg-[#1a1b1e]'}`}
            title={isOrthographic ? "Mode 2D (Orthographic)" : "Mode 3D (Perspective)"}
          >
            {isOrthographic ? <Square size={14} /> : <Box size={14} />}
          </button>
          
        </div>

        {/* Right Sidebar (Properties - Blippar Style) */}
        
        {/* Properties Pull-out Tab (Visible when closed) */}
        
        <RightPanel 
          isRightPanelOpen={isRightPanelOpen}
          setRightPanelOpen={setRightPanelOpen}
          targetImageUrl={targetImageUrl}
          setTargetImageUrl={setTargetImageUrl}
          folderName={folderName}
          setFolderName={setFolderName}
          trackingMode={trackingMode}
          setTrackingMode={setTrackingMode}
          multisetMapId={multisetMapId}
          setMultisetMapId={setMultisetMapId}
          ambientLightIntensity={ambientLightIntensity}
          setAmbientLightIntensity={setAmbientLightIntensity}
          directionalLightIntensity={directionalLightIntensity}
          setDirectionalLightIntensity={setDirectionalLightIntensity}
          environmentMap={environmentMap}
          setEnvironmentMap={setEnvironmentMap}
          brandColor={brandColor}
          setBrandColor={setBrandColor}
          brandLogoUrl={brandLogoUrl}
          setBrandLogoUrl={setBrandLogoUrl}
          handleSave={handleSave}
        />

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



      </div>

            {showPublishModal && (
        <PublishModal 
          onClose={() => setShowPublishModal(false)}
          project={project}
          brandColor={brandColor}
          brandLogoUrl={brandLogoUrl}
        />
      )}

      {showPreviewModal && (
        <PreviewModal 
          onClose={() => setShowPreviewModal(false)}
          onOpenWebcamTest={() => setShowWebcamTestModal(true)}
          project={project}
        />
      )}

      {showWebcamTestModal && (
        <WebcamTestModal 
          onClose={() => setShowWebcamTestModal(false)}
          projectId={project?.id}
        />
      )}

      {isSimulating && (
        <SimulatorModal 
          onClose={() => setIsSimulating(false)}
        />
      )}

      {showLogicEditor && (
        <LogicEditor onClose={() => setShowLogicEditor(false)} />
      )}
      
      {showTimeline && (
        <TimelinePanel />
      )}

    </div>
  );
}

function TransformRow({ label, values, onChange }: { label: string, values: number[], onChange: (index: number, val: number) => void }) {
  return (
    <div className="flex flex-col gap-1 mb-3">
      <div className="flex items-center justify-between text-[9px] text-gray-400 uppercase tracking-wider font-bold">
        <span>{label}</span>
      </div>
      <div className="flex gap-1 w-full">
        {['X', 'Y', 'Z'].map((axis, i) => (
          <div key={axis} className="flex-1 flex flex-col items-center bg-[#1a1b1e] border border-[#2b2d31] rounded-sm focus-within:border-pln-blue transition-colors p-1 relative group">
            <span className="text-[8px] text-gray-600 mb-0.5 absolute left-1 top-1">{axis}</span>
            <input 
              type="number" 
              step="0.01"
              value={Number(values[i]).toFixed(3)} 
              onChange={(e) => onChange(i, parseFloat(e.target.value) || 0)}
              className="w-full bg-transparent text-[10px] text-gray-300 outline-none text-center font-mono mt-2" 
            />
          </div>
        ))}
      </div>
    </div>
  );
}
