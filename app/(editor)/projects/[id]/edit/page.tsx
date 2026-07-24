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

import { LeftToolbar } from '@/components/Editor/Panels/LeftToolbar';
import { LeftPanelExpanded } from '@/components/Editor/Panels/LeftPanelExpanded';
import { EditorHeader } from '@/components/Editor/EditorHeader';
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
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore if user is typing in an input
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement || e.target instanceof HTMLSelectElement) {
        return;
      }
      
      switch (e.key.toLowerCase()) {
        case 'w': setTransformMode('translate'); break;
        case 'e': setTransformMode('rotate'); break;
        case 'r': setTransformMode('rotate'); break; // R for rotate in Blender
        case 's': setTransformMode('scale'); break; // S for scale in Blender
        case 'escape': 
          setSelectedId(null); 
          setMultiSelectedIds([]);
          break;
        case 'x':
        case 'delete':
        case 'backspace':
          if (selectedId) removeElement(selectedId);
          break;
        case 'g':
          if (e.ctrlKey || e.metaKey) {
            e.preventDefault();
            groupSelectedElements();
          } else {
            setTransformMode('translate'); // G for grab in Blender
          }
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
        case 'a':
          if (e.altKey) {
            setSelectedId(null);
            setMultiSelectedIds([]);
          } else {
             const allIds = elements.map(el => el.id);
             setMultiSelectedIds(allIds);
          }
          break;
        case 'd':
          if (e.shiftKey && selectedId) {
            e.preventDefault();
            duplicateElement(selectedId);
          }
          break;
        case '5':
          setIsOrthographic(!isOrthographic);
          break;
        case 'h':
          if (e.altKey) {
             elements.forEach(el => updateElement(el.id, { isHidden: false }));
          } else if (selectedId) {
             const el = elements.find(el => el.id === selectedId);
             if (el) updateElement(selectedId, { isHidden: !el.isHidden });
          }
          break;
        case 'f':
        case '.':
          if (selectedId) {
            const el = elements.find(el => el.id === selectedId);
            if (el && el.position) {
              setCameraFocusTarget(el.position as [number, number, number]);
            }
          }
          break;
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedId, multiSelectedIds, removeElement, undo, redo, setSelectedId, groupSelectedElements, elements, duplicateElement, isOrthographic, setIsOrthographic, updateElement, setCameraFocusTarget]);

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

  const handlePreview = async () => {
    if (!project) return;
    if (!targetImageUrl) {
      alert("Harap pilih atau unggah Target Image (Marker) terlebih dahulu untuk preview AR!");
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
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('Not authenticated');

      const fileExt = file.name.split('.').pop();
      const fileName = `${Math.random().toString(36).substring(2, 15)}.${fileExt}`;
      const filePath = `${session.user.id}/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('assets')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

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

      if (dbError) throw dbError;

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
        {!isRightPanelOpen && (
          <button 
            onClick={() => setRightPanelOpen(true)}
            className="pointer-events-auto absolute top-1/2 right-0 -translate-y-1/2 bg-[#1a1b1e] border border-[#2b2d31] border-r-0 text-gray-400 hover:text-white p-2 py-6 rounded-l-md shadow-xl z-20 flex flex-col items-center justify-center transition-colors group"
            title="Buka Properties"
          >
            <ChevronLeft size={16} className="group-hover:-translate-x-1 transition-transform" />
            <span className="text-[10px] uppercase font-bold [writing-mode:vertical-rl] rotate-180 mt-2 tracking-widest group-hover:text-pln-blue transition-colors">Properties</span>
          </button>
        )}

        <aside className={`pointer-events-auto absolute top-14 bottom-0 right-0 z-20 w-[280px] bg-[#1a1b1e] border-l border-[#2b2d31] flex flex-col shrink-0 transform transition-transform duration-300 ease-in-out shadow-2xl ${isRightPanelOpen ? 'translate-x-0' : 'translate-x-full'} overflow-hidden`}>
          <div className="bg-[#202227] p-3 border-b border-[#2b2d31] text-[10px] font-bold text-gray-400 uppercase flex items-center justify-between tracking-wider">
            PROPERTIES
            {/* Properties Toggle */}
            <button className="p-2 text-gray-400 hover:text-white" onClick={() => setRightPanelOpen(false)}>
              <X size={18} />
            </button>
          </div>
          
          <div className="flex-1 overflow-y-auto custom-scrollbar">
            
            {/* Target Image Info (Shown when no element is selected) */}
            {selectedId === null && (
              <div className="divide-y divide-[#2b2d31]">
                {/* Accordion 1: Marker */}
                <div className="p-4">
                  <h3 className="text-[10px] font-bold text-gray-500 mb-3 uppercase tracking-wider flex items-center justify-between">
                    Target Image (Marker)
                    <button className="text-red-400 hover:text-red-300" onClick={() => setTargetImageUrl(null)}>Clear</button>
                  </h3>
                  <div className="aspect-video bg-[#0f1013] rounded border border-[#2b2d31] flex items-center justify-center overflow-hidden">
                    {targetImageUrl ? (
                      <img src={targetImageUrl} className="w-full h-full object-cover opacity-80" />
                    ) : (
                      <ImageIcon size={24} className="text-gray-600" />
                    )}
                  </div>
                </div>

                {/* Accordion 2: Project Settings */}
                <div className="p-4 bg-[#202227]">
                  <h3 className="text-[10px] font-bold text-gray-500 mb-3 uppercase tracking-wider">Pengaturan Proyek</h3>
                  <div className="flex flex-col gap-3">
                    <div className="flex flex-col gap-1.5">
                      <label className="text-[10px] text-gray-400">Nama Folder</label>
                      <input 
                        type="text" 
                        value={folderName}
                        onChange={(e) => {
                          setFolderName(e.target.value);
                          handleSave(true);
                        }}
                        className="w-full bg-[#1a1b1e] border border-[#2b2d31] rounded p-2 text-xs text-gray-200 outline-none focus:border-pln-blue transition-colors"
                      />
                    </div>
                    
                    <div className="flex flex-col gap-1.5">
                      <label className="text-[10px] text-gray-400">Mode Tracking (MultiSet Engine)</label>
                      <select
                        value={trackingMode}
                        onChange={(e) => setTrackingMode(e.target.value as any)}
                        className="w-full bg-[#1a1b1e] border border-[#2b2d31] rounded p-2 text-xs text-gray-200 outline-none focus:border-pln-blue"
                      >
                        <option value="image">MultiSet - Object Tracking / Flat Image</option>
                        <option value="cylinder">MultiSet - Area Target (VPS)</option>
                      </select>
                    </div>

                    <div className="flex flex-col gap-1.5 mt-2">
                      <label className="text-[10px] text-gray-400">MultiSet Map ID / Object Code</label>
                      <input 
                        type="text" 
                        value={multisetMapId}
                        onChange={(e) => {
                          setMultisetMapId(e.target.value);
                          handleSave(true);
                        }}
                        className="w-full bg-[#1a1b1e] border border-[#2b2d31] rounded p-2 text-xs text-gray-200 outline-none focus:border-pln-blue transition-colors font-mono"
                        placeholder="c4b1a..."
                      />
                      <p className="text-[9px] text-gray-500">Dapatkan Map ID dari dashboard akun MultiSet AI Anda.</p>
                    </div>
                  </div>
                </div>

                {/* Accordion 3: Lighting */}
                <div className="p-4">
                  <h3 className="text-[10px] font-bold text-gray-500 mb-3 uppercase tracking-wider">Pencahayaan</h3>
                  <div className="space-y-4">
                    <div className="flex flex-col gap-1.5">
                      <label className="text-[10px] text-gray-400 flex justify-between">
                        Ambient Light
                        <span className="font-mono">{ambientLightIntensity.toFixed(1)}</span>
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
                      <label className="text-[10px] text-gray-400 flex justify-between">
                        Directional Light (Shadows)
                        <span className="font-mono">{directionalLightIntensity.toFixed(1)}</span>
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
                      <label className="text-[10px] text-gray-400">Environment Reflection (HDRI)</label>
                      <select
                        value={environmentMap}
                        onChange={(e) => setEnvironmentMap(e.target.value as any)}
                        className="bg-[#1a1b1e] border border-[#2b2d31] rounded p-2 text-xs text-white outline-none focus:border-pln-blue"
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

                {/* Accordion 4: Branding */}
                <div className="p-4 bg-[#202227]">
                  <h3 className="text-[10px] font-bold text-gray-500 mb-3 uppercase tracking-wider">White-Label Branding</h3>
                  <div className="space-y-4">
                    <div className="flex flex-col gap-1.5">
                      <label className="text-[10px] text-gray-400 flex justify-between">
                        Warna Utama
                        <span className="font-mono bg-[#1a1b1e] px-1 rounded border border-[#2b2d31]">{brandColor}</span>
                      </label>
                      <div className="flex gap-2">
                        <input 
                          type="color" 
                          value={brandColor}
                          onChange={(e) => {
                            setBrandColor(e.target.value);
                            handleSave(true);
                          }}
                          className="w-8 h-8 bg-[#1a1b1e] border border-[#2b2d31] rounded cursor-pointer p-0"
                        />
                        <button 
                          onClick={() => { setBrandColor('#00A2E9'); handleSave(true); }}
                          className="text-[10px] text-gray-400 hover:text-white px-2 py-1 bg-[#1a1b1e] hover:bg-[#2b2d31] rounded border border-[#2b2d31]"
                        >
                          Reset Default
                        </button>
                      </div>
                    </div>

                    <div className="flex flex-col gap-1.5">
                      <label className="text-[10px] text-gray-400 flex justify-between">
                        Logo Perusahaan
                        {brandLogoUrl && <button className="text-red-400 hover:text-red-300" onClick={() => { setBrandLogoUrl(null); handleSave(true); }}>Hapus</button>}
                      </label>
                      <div className="h-12 bg-[#0f1013] rounded border border-[#2b2d31] flex items-center justify-center overflow-hidden p-1 relative shadow-inner">
                        {brandLogoUrl ? (
                          <img src={brandLogoUrl} className="max-h-full max-w-full object-contain" />
                        ) : (
                          <span className="text-[10px] text-gray-600">Belum ada logo</span>
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
                        className="text-[10px] text-center w-full py-1.5 bg-[#2b2d31] hover:bg-[#36393f] text-gray-300 hover:text-white rounded transition-colors"
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
              <div className="divide-y divide-[#2b2d31]">
                {/* Header and Name */}
                <div className="p-4">
                  <h3 className="text-xs font-bold text-gray-300 mb-3 flex items-center justify-between">
                    {selectedElement.type === '3d_model' ? '3D Model' : 
                     selectedElement.type === '3d_text' ? '3D Text' : 
                     selectedElement.type === 'edu_panel' ? 'Edu Dashboard' : 'UI Button'}
                    <div className="flex gap-2">
                      <button className="text-blue-400 text-[10px] hover:text-blue-300 flex items-center gap-1 bg-[#1a1b1e] px-2 py-1 rounded border border-[#2b2d31]" onClick={() => duplicateElement(selectedElement.id)}><Copy size={10}/> Duplikat</button>
                      <button className="text-red-400 text-[10px] hover:text-red-300 flex items-center gap-1 bg-[#1a1b1e] px-2 py-1 rounded border border-[#2b2d31]" onClick={() => removeElement(selectedElement.id)}><Trash2 size={10}/> Hapus</button>
                    </div>
                  </h3>
                  
                  <div className="flex flex-col gap-1.5 mt-4">
                    <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">Nama Elemen</label>
                    <input 
                      type="text" 
                      value={selectedElement.name}
                      onChange={(e) => updateElement(selectedElement.id, { name: e.target.value })}
                      className="w-full bg-[#1a1b1e] border border-[#2b2d31] rounded p-2 text-xs text-gray-200 outline-none focus:border-pln-blue transition-colors"
                    />
                  </div>
                </div>

                {/* Advanced Animations Panel (For all elements) */}
                <div className="p-4 space-y-4 border-t border-[#2b2d31]">
                  <h4 className="text-[10px] font-bold text-gray-500 uppercase tracking-wider flex items-center gap-2">
                    <Sparkles size={12} className="text-purple-400"/> Animasi Lanjutan
                  </h4>
                  
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] text-gray-400 font-medium">Animasi Muncul (Entrance)</label>
                    <select
                      value={selectedElement.entranceAnimation || 'none'}
                      onChange={(e) => updateElement(selectedElement.id, { entranceAnimation: e.target.value as any })}
                      className="w-full bg-[#1a1b1e] border border-[#2b2d31] rounded p-2 text-xs text-white outline-none focus:border-pln-blue shadow-inner"
                    >
                      <option value="none">Tidak Ada (Langsung Muncul)</option>
                      <option value="fade">Fade In (Mengudar)</option>
                      <option value="scale">Pop/Scale In (Membesar)</option>
                      <option value="slide-up">Slide Up (Naik dari Bawah)</option>
                    </select>
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] text-gray-400 font-medium">Animasi Diam (Idle)</label>
                    <select
                      value={selectedElement.idleAnimation || 'none'}
                      onChange={(e) => updateElement(selectedElement.id, { idleAnimation: e.target.value as any })}
                      className="w-full bg-[#1a1b1e] border border-[#2b2d31] rounded p-2 text-xs text-white outline-none focus:border-pln-blue shadow-inner"
                    >
                      <option value="none">Diam</option>
                      <option value="rotate">Berputar (Auto-Rotate)</option>
                      <option value="hover">Melayang (Hover)</option>
                      <option value="both">Berputar & Melayang</option>
                    </select>
                  </div>

                  {selectedElement.idleAnimation && selectedElement.idleAnimation !== 'none' && (
                    <div className="flex flex-col gap-1.5">
                      <label className="text-[10px] text-gray-400 font-medium flex justify-between">
                        Kecepatan Animasi Idle
                        <span className="font-mono text-[10px]">{(selectedElement.idleAnimationSpeed ?? 1).toFixed(1)}x</span>
                      </label>
                      <input 
                        type="range" 
                        min="0.1" max="5" step="0.1" 
                        value={selectedElement.idleAnimationSpeed ?? 1}
                        onChange={(e) => updateElement(selectedElement.id, { idleAnimationSpeed: parseFloat(e.target.value) })}
                        className="w-full accent-purple-400"
                      />
                    </div>
                  )}
                </div>

                {selectedElement.type === '3d_text' && (
                      <div className="space-y-4 pt-4 border-t border-[#2b2d31]">
                        <h4 className="text-[10px] font-bold text-gray-500 uppercase tracking-wider flex items-center gap-2">
                          <Type size={12} className="text-green-400"/> Pengaturan Teks
                        </h4>
                        <div className="flex flex-col gap-1.5">
                          <label className="text-[10px] text-gray-400 font-medium">Isi Teks</label>
                          <input 
                            type="text" 
                            value={selectedElement.content || ''}
                            onChange={(e) => updateElement(selectedElement.id, { content: e.target.value })}
                            className="w-full bg-[#1a1b1e] border border-[#2b2d31] rounded p-2 text-xs text-white outline-none focus:border-pln-blue"
                          />
                        </div>
                        
                        <div className="flex flex-col gap-1.5">
                          <label className="text-[10px] text-gray-400 font-medium">Warna Teks</label>
                          <div className="flex items-center gap-2">
                            <input 
                              type="color" 
                              value={selectedElement.color || '#ffffff'}
                              onChange={(e) => updateElement(selectedElement.id, { color: e.target.value })}
                              className="w-8 h-8 bg-[#1a1b1e] border border-[#2b2d31] rounded cursor-pointer shrink-0"
                            />
                            <input 
                              type="text" 
                              value={selectedElement.color || '#ffffff'}
                              onChange={(e) => updateElement(selectedElement.id, { color: e.target.value })}
                              className="flex-1 bg-[#1a1b1e] border border-[#2b2d31] rounded p-1.5 text-xs text-white outline-none focus:border-pln-blue font-mono"
                            />
                          </div>
                        </div>

                        <div className="flex flex-col gap-1.5">
                          <label className="text-[10px] text-gray-400 font-medium">Jenis Font</label>
                          {selectedElement.is3D ? (
                            <select 
                              value={selectedElement.fontFamily || 'helvetiker'}
                              onChange={(e) => updateElement(selectedElement.id, { fontFamily: e.target.value })}
                              className="w-full bg-[#1a1b1e] border border-[#2b2d31] rounded p-2 text-xs text-white outline-none focus:border-pln-blue"
                            >
                              <option value="helvetiker">Helvetiker</option>
                              <option value="optimer">Optimer</option>
                              <option value="gentilis">Gentilis</option>
                              <option value="droid_sans">Droid Sans</option>
                              <option value="droid_serif">Droid Serif</option>
                            </select>
                          ) : (
                            <select 
                              value={selectedElement.fontFamily || 'https://cdn.jsdelivr.net/npm/@fontsource/raleway/files/raleway-latin-400-normal.woff'}
                              onChange={(e) => updateElement(selectedElement.id, { fontFamily: e.target.value })}
                              className="w-full bg-[#1a1b1e] border border-[#2b2d31] rounded p-2 text-xs text-white outline-none focus:border-pln-blue"
                            >
                              <option value="https://cdn.jsdelivr.net/npm/@fontsource/raleway/files/raleway-latin-400-normal.woff">Raleway</option>
                              <option value="https://cdn.jsdelivr.net/npm/@fontsource/roboto/files/roboto-latin-400-normal.woff">Roboto</option>
                              <option value="https://cdn.jsdelivr.net/npm/@fontsource/oswald/files/oswald-latin-400-normal.woff">Oswald</option>
                              <option value="https://cdn.jsdelivr.net/npm/@fontsource/inter/files/inter-latin-400-normal.woff">Inter</option>
                            </select>
                          )}
                        </div>

                        <div className="flex flex-col gap-1.5">
                          <label className="text-[10px] text-gray-400 font-medium">Gaya Teks</label>
                          <select 
                            value={selectedElement.is3D ? '3d' : '2d'}
                            onChange={(e) => {
                              const is3D = e.target.value === '3d';
                              updateElement(selectedElement.id, { 
                                is3D, 
                                fontFamily: is3D ? 'helvetiker' : 'https://cdn.jsdelivr.net/npm/@fontsource/raleway/files/raleway-latin-400-normal.woff' 
                              });
                            }}
                            className="w-full bg-[#1a1b1e] border border-[#2b2d31] rounded p-2 text-xs text-white outline-none focus:border-pln-blue"
                          >
                            <option value="2d">Datar (2D)</option>
                            <option value="3d">Timbul (3D)</option>
                          </select>
                        </div>

                        <div className="flex flex-col gap-1.5">
                          <label className="text-[10px] text-gray-400 font-medium">Efek Spesial</label>
                          <select 
                            value={selectedElement.textEffect || 'none'}
                            onChange={(e) => updateElement(selectedElement.id, { textEffect: e.target.value })}
                            className="w-full bg-[#1a1b1e] border border-[#2b2d31] rounded p-2 text-xs text-white outline-none focus:border-pln-blue"
                          >
                            <option value="none">Tidak Ada</option>
                            <option value="outline">Garis Tepi (Outline)</option>
                            <option value="glow">Menyala (Neon/Glow)</option>
                          </select>
                        </div>

                        <div className="flex flex-col gap-1.5 pt-3 border-t border-[#2b2d31]/50">
                          <label className="text-[10px] text-gray-300 font-medium font-bold flex items-center gap-2">
                            <Loader2 size={12} className="text-blue-400" /> Real-time Data (IoT)
                          </label>
                          <p className="text-[10px] text-gray-500 mb-1">Ambil teks secara live dari API (misal: suhu/harga saham).</p>
                          
                          <label className="text-[10px] text-gray-400 font-medium mt-1">API Endpoint URL</label>
                          <input 
                            type="url" 
                            value={selectedElement.apiEndpoint || ''}
                            onChange={(e) => updateElement(selectedElement.id, { apiEndpoint: e.target.value })}
                            className="w-full bg-[#1a1b1e] border border-[#2b2d31] rounded p-2 text-xs text-white outline-none focus:border-pln-blue"
                            placeholder="https://api.example.com/data"
                          />

                          {selectedElement.apiEndpoint && (
                            <>
                              <label className="text-[10px] text-gray-400 font-medium mt-1">JSON Path (Optional)</label>
                              <input 
                                type="text" 
                                value={selectedElement.apiJsonPath || ''}
                                onChange={(e) => updateElement(selectedElement.id, { apiJsonPath: e.target.value })}
                                className="w-full bg-[#1a1b1e] border border-[#2b2d31] rounded p-2 text-xs text-white outline-none focus:border-pln-blue"
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
                        <div className="space-y-4 pt-4 border-t border-[#2b2d31]">
                          <h4 className="text-[10px] font-bold text-gray-500 uppercase tracking-wider flex items-center gap-2">
                            <MousePointerClick size={12} className="text-blue-400" /> Tampilan Tombol
                          </h4>
                          <div className="flex flex-col gap-1.5">
                            <label className="text-[10px] text-gray-400 font-medium">Teks pada Tombol</label>
                            <input 
                              type="text"
                              value={selectedElement.buttonText || ''}
                              onChange={(e) => updateElement(selectedElement.id, { buttonText: e.target.value })}
                              className="w-full bg-[#1a1b1e] border border-[#2b2d31] rounded p-2 text-sm text-white outline-none focus:border-pln-blue shadow-inner"
                              placeholder="Misal: Buka Mesin"
                            />
                          </div>

                          <div className="h-px bg-[#2b2d31] my-2"></div>

                          <div className="flex items-center justify-between">
                            <h4 className="text-[10px] font-bold text-gray-500 uppercase tracking-wider flex items-center gap-2">
                              <Magnet size={12} className="text-yellow-400" /> Aksi Tombol (Events)
                            </h4>
                            <button 
                              onClick={() => {
                                const newActions = [...(selectedElement.onClickActions || [])];
                                newActions.push({ id: crypto.randomUUID(), type: 'play_animation' });
                                updateElement(selectedElement.id, { onClickActions: newActions });
                              }}
                              className="text-[10px] bg-pln-blue/20 text-pln-blue px-2 py-1 rounded border border-pln-blue/30 hover:bg-pln-blue/30 flex items-center gap-1"
                            >
                              <Plus size={10} /> Tambah Aksi
                            </button>
                          </div>

                          <div className="space-y-2 mt-2">
                            {(!selectedElement.onClickActions || selectedElement.onClickActions.length === 0) && (
                              <div className="text-[10px] text-gray-500 italic text-center py-3 bg-[#1a1b1e]/50 rounded border border-[#2b2d31] border-dashed">Belum ada aksi. Klik Tambah Aksi.</div>
                            )}
                            
                            {selectedElement.onClickActions?.map((action, idx) => (
                              <div key={action.id} className="bg-[#1a1b1e]/80 border border-gray-700 rounded p-2 space-y-2 relative">
                                <button 
                                  onClick={() => {
                                    const newActions = selectedElement.onClickActions!.filter(a => a.id !== action.id);
                                    updateElement(selectedElement.id, { onClickActions: newActions });
                                  }}
                                  className="absolute top-2 right-2 text-gray-500 hover:text-red-400"
                                >
                                  <Trash2 size={12} />
                                </button>
                                
                                <select
                                  value={action.type}
                                  onChange={(e) => {
                                    const newActions = [...selectedElement.onClickActions!];
                                    newActions[idx].type = e.target.value as any;
                                    newActions[idx].targetId = '';
                                    newActions[idx].value = '';
                                    updateElement(selectedElement.id, { onClickActions: newActions });
                                  }}
                                  className="w-[calc(100%-20px)] bg-[#0f1013] border border-[#2b2d31] rounded p-1.5 text-[10px] text-white outline-none focus:border-pln-blue"
                                >
                                  <option value="play_animation">Mainkan Animasi 3D</option>
                                  <option value="play_audio">Putar Audio</option>
                                  <option value="toggle_visibility">Tampilkan/Sembunyikan Objek</option>
                                  <option value="open_url">Buka URL</option>
                                  <option value="change_scene">Pindah Scene</option>
                                </select>

                                {/* Action Type Context */}
                                {action.type === 'play_animation' && (
                                  <>
                                    <select
                                      value={action.targetId || ''}
                                      onChange={(e) => {
                                        const newActions = [...selectedElement.onClickActions!];
                                        newActions[idx].targetId = e.target.value;
                                        newActions[idx].value = '';
                                        updateElement(selectedElement.id, { onClickActions: newActions });
                                      }}
                                      className="w-full bg-[#0f1013] border border-[#2b2d31] rounded p-1.5 text-[10px] text-white outline-none"
                                    >
                                      <option value="">-- Pilih Model 3D --</option>
                                      {elements.filter(el => el.type === '3d_model').map(model => (
                                        <option key={model.id} value={model.id}>{model.name}</option>
                                      ))}
                                    </select>
                                    
                                    {action.targetId && (
                                      <select
                                        value={action.value || ''}
                                        onChange={(e) => {
                                          const newActions = [...selectedElement.onClickActions!];
                                          newActions[idx].value = e.target.value;
                                          updateElement(selectedElement.id, { onClickActions: newActions });
                                        }}
                                        className="w-full bg-[#0f1013] border border-[#2b2d31] rounded p-1.5 text-[10px] text-white outline-none"
                                      >
                                        <option value="">-- Pilih Animasi --</option>
                                        <option value="*">Semua Animasi (*)</option>
                                        {elements.find(el => el.id === action.targetId)?.availableAnimations?.map(anim => (
                                          <option key={anim} value={anim}>{anim}</option>
                                        ))}
                                      </select>
                                    )}
                                  </>
                                )}

                                {action.type === 'play_audio' && (
                                  <select
                                    value={action.targetId || ''}
                                    onChange={(e) => {
                                      const newActions = [...selectedElement.onClickActions!];
                                      newActions[idx].targetId = e.target.value;
                                      updateElement(selectedElement.id, { onClickActions: newActions });
                                    }}
                                    className="w-full bg-[#0f1013] border border-[#2b2d31] rounded p-1.5 text-[10px] text-white outline-none"
                                  >
                                    <option value="">-- Pilih Audio --</option>
                                    {elements.filter(el => el.type === 'audio').map(audio => (
                                      <option key={audio.id} value={audio.id}>{audio.name}</option>
                                    ))}
                                  </select>
                                )}

                                {action.type === 'toggle_visibility' && (
                                  <select
                                    value={action.targetId || ''}
                                    onChange={(e) => {
                                      const newActions = [...selectedElement.onClickActions!];
                                      newActions[idx].targetId = e.target.value;
                                      updateElement(selectedElement.id, { onClickActions: newActions });
                                    }}
                                    className="w-full bg-[#0f1013] border border-[#2b2d31] rounded p-1.5 text-[10px] text-white outline-none"
                                  >
                                    <option value="">-- Pilih Objek --</option>
                                    {elements.filter(el => el.id !== selectedElement.id).map(el => (
                                      <option key={el.id} value={el.id}>{el.name}</option>
                                    ))}
                                  </select>
                                )}

                                {action.type === 'open_url' && (
                                  <input 
                                    type="url"
                                    value={action.value || ''}
                                    onChange={(e) => {
                                      const newActions = [...selectedElement.onClickActions!];
                                      newActions[idx].value = e.target.value;
                                      updateElement(selectedElement.id, { onClickActions: newActions });
                                    }}
                                    className="w-full bg-[#0f1013] border border-[#2b2d31] rounded p-1.5 text-[10px] text-white outline-none"
                                    placeholder="https://..."
                                  />
                                )}

                                {action.type === 'change_scene' && (
                                  <select
                                    value={action.value || ''}
                                    onChange={(e) => {
                                      const newActions = [...selectedElement.onClickActions!];
                                      newActions[idx].value = e.target.value;
                                      updateElement(selectedElement.id, { onClickActions: newActions });
                                    }}
                                    className="w-full bg-[#0f1013] border border-[#2b2d31] rounded p-1.5 text-[10px] text-white outline-none"
                                  >
                                    <option value="">-- Pilih Scene --</option>
                                    {scenes.map(sc => (
                                      <option key={sc.id} value={sc.id}>{sc.name}</option>
                                    ))}
                                  </select>
                                )}

                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Media URL Properties (Video, Audio, Image) */}
                      {(selectedElement.type === 'video' || selectedElement.type === 'audio' || selectedElement.type === 'image') && (
                        <div className="space-y-4 pt-4 border-t border-[#2b2d31]">
                          <h4 className="text-[10px] font-bold text-gray-500 uppercase tracking-wider flex items-center gap-2">
                            <ExternalLink size={12} className="text-blue-400" /> Sumber Media
                          </h4>
                          <div className="flex flex-col gap-1.5">
                            <label className="text-[10px] text-gray-400 font-medium">URL {selectedElement.type}</label>
                            <input 
                              type="url"
                              value={selectedElement.url || ''}
                              onChange={(e) => updateElement(selectedElement.id, { url: e.target.value })}
                              className="w-full bg-[#1a1b1e] border border-[#2b2d31] rounded p-2 text-xs text-white outline-none focus:border-pln-blue"
                              placeholder="https://example.com/media.mp4"
                            />
                            {selectedElement.type === 'audio' && (
                              <p className="text-[9px] text-gray-500 mt-1">Audio akan otomatis berputar (loop) secara default.</p>
                            )}
                          </div>
                        </div>
                      )}

                      {/* VFX Sparkles Properties */}
                      {selectedElement.type === 'vfx_sparkles' && (
                        <div className="space-y-4 pt-4 border-t border-[#2b2d31]">
                          <h4 className="text-[10px] font-bold text-gray-500 uppercase tracking-wider flex items-center gap-2">
                            <Sparkles size={12} className="text-yellow-400" /> Efek Partikel
                          </h4>
                          <div className="flex flex-col gap-3">
                            <div className="flex flex-col gap-1.5">
                              <label className="text-[10px] text-gray-400 font-medium">Warna Partikel</label>
                              <div className="flex gap-2">
                                <input 
                                  type="color" 
                                  value={selectedElement.sparkleColor || '#f1c40f'}
                                  onChange={(e) => updateElement(selectedElement.id, { sparkleColor: e.target.value })}
                                  className="w-8 h-8 rounded cursor-pointer bg-transparent border-0 p-0"
                                />
                                <input 
                                  type="text" 
                                  value={selectedElement.sparkleColor || '#f1c40f'}
                                  onChange={(e) => updateElement(selectedElement.id, { sparkleColor: e.target.value })}
                                  className="flex-1 bg-[#1a1b1e] border border-[#2b2d31] rounded px-2 text-xs text-white outline-none focus:border-pln-blue font-mono uppercase"
                                />
                              </div>
                            </div>
                            
                            <div className="flex flex-col gap-1.5">
                              <label className="text-[10px] text-gray-400 font-medium flex justify-between">
                                Jumlah Partikel
                                <span className="font-mono text-pln-blue">{selectedElement.sparkleCount || 50}</span>
                              </label>
                              <input 
                                type="range" 
                                min="10" max="500" step="10"
                                value={selectedElement.sparkleCount || 50}
                                onChange={(e) => updateElement(selectedElement.id, { sparkleCount: parseFloat(e.target.value) })}
                                className="w-full accent-pln-blue"
                              />
                            </div>

                            <div className="flex flex-col gap-1.5">
                              <label className="text-[10px] text-gray-400 font-medium flex justify-between">
                                Ukuran Partikel
                                <span className="font-mono text-pln-blue">{selectedElement.sparkleSize || 4}</span>
                              </label>
                              <input 
                                type="range" 
                                min="1" max="20" step="1"
                                value={selectedElement.sparkleSize || 4}
                                onChange={(e) => updateElement(selectedElement.id, { sparkleSize: parseFloat(e.target.value) })}
                                className="w-full accent-pln-blue"
                              />
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Edu Panel Specific Properties */}
                      {selectedElement.type === 'edu_panel' && (
                        <div className="space-y-4 pt-4 border-t border-[#2b2d31]">
                          <h4 className="text-xs font-bold text-pln-yellow uppercase flex items-center gap-2">
                            <LayoutDashboard size={14} /> Edu Panel Konten
                          </h4>
                          <p className="text-[10px] text-gray-500 leading-tight">
                            Panel ini akan melayang di layar AR saat audiens memindai gambar.
                          </p>
                          
                          <div className="flex flex-col gap-1.5">
                            <label className="text-[10px] text-gray-400 font-medium">Judul Panel Utama</label>
                            <input 
                              type="text"
                              value={selectedElement.panelTitle || ''}
                              onChange={(e) => updateElement(selectedElement.id, { panelTitle: e.target.value })}
                              className="w-full bg-[#1a1b1e] border border-[#2b2d31] rounded p-2 text-sm text-white outline-none focus:border-pln-blue shadow-inner"
                              placeholder="Misal: MESIN MOTOR"
                            />
                          </div>

                          <div className="h-px bg-[#1a1b1e] my-4"></div>

                          {/* Asset Information (Components) Builder */}
                          <div className="flex items-center justify-between">
                            <h4 className="text-[10px] font-bold text-gray-500 uppercase tracking-wider flex items-center gap-2">
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
                              <div className="text-[10px] text-gray-500 italic text-center py-2 bg-[#1a1b1e]/50 rounded border border-[#2b2d31] border-dashed">Belum ada komponen.</div>
                            )}
                            {selectedElement.eduComponents?.map((comp, idx) => (
                              <div key={comp.id} className="bg-[#1a1b1e]/80 border border-gray-700 rounded p-2 space-y-2">
                                <div className="flex items-center gap-2">
                                  <input 
                                    type="text"
                                    value={comp.name}
                                    onChange={(e) => {
                                      const newComps = [...selectedElement.eduComponents!];
                                      newComps[idx].name = e.target.value;
                                      updateElement(selectedElement.id, { eduComponents: newComps });
                                    }}
                                    className="flex-1 bg-[#0f1013] border border-[#2b2d31] rounded p-1 text-xs text-white outline-none focus:border-pln-blue"
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
                                    className="flex-1 min-w-0 text-ellipsis bg-[#0f1013] border border-[#2b2d31] rounded p-1 text-[10px] text-white outline-none"
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
                                      className="flex-1 min-w-0 text-ellipsis bg-[#0f1013] border border-[#2b2d31] rounded p-1 text-[10px] text-white outline-none"
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
                                    className="flex-1 min-w-0 text-ellipsis bg-[#0f1013] border border-[#2b2d31] rounded p-1 text-[10px] text-green-400 outline-none"
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
                                    className="flex-1 min-w-0 text-ellipsis bg-[#0f1013] border border-[#2b2d31] rounded p-1 text-[10px] text-red-400 outline-none"
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

                          <div className="h-px bg-[#1a1b1e] my-4"></div>

                          {/* Maintenance Tasks Builder */}
                          <div className="flex items-center justify-between">
                            <h4 className="text-[10px] font-bold text-gray-500 uppercase tracking-wider flex items-center gap-2">
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
                              <div className="text-[10px] text-gray-500 italic text-center py-2 bg-[#1a1b1e]/50 rounded border border-[#2b2d31] border-dashed">Belum ada tugas maintenance.</div>
                            )}
                            {selectedElement.eduMaintenanceTasks?.map((task, tIdx) => (
                              <div key={task.id} className="bg-[#202227] border border-[#2b2d31] rounded p-2 space-y-2">
                                <div className="flex items-center gap-2">
                                  <input 
                                    type="text"
                                    value={task.title}
                                    onChange={(e) => {
                                      const newTasks = [...selectedElement.eduMaintenanceTasks!];
                                      newTasks[tIdx].title = e.target.value;
                                      updateElement(selectedElement.id, { eduMaintenanceTasks: newTasks });
                                    }}
                                    className="flex-1 bg-[#0f1013] border border-[#2b2d31] rounded p-1 text-xs font-bold text-pln-yellow outline-none focus:border-pln-yellow"
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
                                    <div key={step.id} className="bg-[#0f1013] border border-[#2b2d31] rounded p-2 space-y-1.5">
                                      <div className="flex items-start gap-2">
                                        <span className="text-[10px] font-bold text-gray-500 bg-[#1a1b1e] px-1.5 rounded mt-0.5">{sIdx + 1}</span>
                                        <textarea
                                          value={step.instruction}
                                          onChange={(e) => {
                                            const newTasks = [...selectedElement.eduMaintenanceTasks!];
                                            newTasks[tIdx].steps[sIdx].instruction = e.target.value;
                                            updateElement(selectedElement.id, { eduMaintenanceTasks: newTasks });
                                          }}
                                          className="flex-1 bg-[#1a1b1e] border border-[#2b2d31] rounded p-1 text-[10px] text-white outline-none focus:border-pln-blue min-h-[40px] resize-none"
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
                                          className="flex-1 min-w-0 text-ellipsis bg-[#1a1b1e] border border-[#2b2d31] rounded p-1 text-[9px] text-white outline-none"
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
                                            className="flex-1 min-w-0 text-ellipsis bg-[#1a1b1e] border border-[#2b2d31] rounded p-1 text-[9px] text-white outline-none"
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
                                          className="flex-1 min-w-0 text-ellipsis bg-[#1a1b1e] border border-[#2b2d31] rounded p-1 text-[9px] text-green-400 outline-none"
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
                                          className="flex-1 min-w-0 text-ellipsis bg-[#1a1b1e] border border-[#2b2d31] rounded p-1 text-[9px] text-red-400 outline-none"
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
                        <div className="space-y-3 pt-4 border-t border-[#2b2d31]">
                          <h4 className="text-[10px] font-bold text-gray-500 uppercase tracking-wider flex items-center gap-2">
                            <Eye size={12} className="text-pln-blue"/> Visibilitas Awal
                          </h4>
                          <div className="flex bg-gray-900 rounded p-1 border border-gray-700">
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

                      {/* 3D Model Custom Materials */}
                      {selectedElement.type === '3d_model' && selectedElement.availableMaterials && selectedElement.availableMaterials.length > 0 && (
                        <div className="space-y-3 pt-4 border-t border-[#2b2d31]">
                          <h4 className="text-[10px] font-bold text-gray-500 uppercase tracking-wider flex items-center gap-2">
                            <Palette size={12} className="text-pln-blue"/> Material & Warna
                          </h4>
                          <div className="flex flex-col gap-2">
                            {selectedElement.availableMaterials.map((matName: string, i: number) => (
                              <div key={i} className="flex items-center justify-between bg-[#1a1b1e] border border-[#2b2d31] p-2 rounded">
                                <span className="text-[10px] text-gray-300 truncate max-w-[120px]" title={matName}>{matName}</span>
                                <div className="flex items-center gap-2">
                                  <input 
                                    type="color" 
                                    value={selectedElement.customMaterials?.[matName] || '#ffffff'}
                                    onChange={(e) => {
                                      const newMats = { ...(selectedElement.customMaterials || {}) };
                                      newMats[matName] = e.target.value;
                                      updateElement(selectedElement.id, { customMaterials: newMats });
                                    }}
                                    className="w-6 h-6 p-0 border-0 rounded cursor-pointer"
                                  />
                                  {selectedElement.customMaterials?.[matName] && (
                                    <button
                                      onClick={() => {
                                        const newMats = { ...(selectedElement.customMaterials || {}) };
                                        delete newMats[matName];
                                        updateElement(selectedElement.id, { customMaterials: newMats });
                                      }}
                                      className="text-red-400 hover:text-red-300 ml-1"
                                      title="Reset Warna"
                                    >
                                      <X size={12} />
                                    </button>
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Phase 7: Mesh Separation (Explode) */}
                      {selectedElement.type === '3d_model' && !selectedElement.targetMeshName && selectedElement.availableSubMeshes && selectedElement.availableSubMeshes.length > 0 && (
                        <div className="space-y-3 pt-4 border-t border-[#2b2d31]">
                          <h4 className="text-[10px] font-bold text-gray-500 uppercase tracking-wider flex items-center gap-2">
                            <Layers size={12} className="text-orange-400"/> Pisah Objek (Blender Outliner)
                          </h4>
                          <p className="text-[10px] text-gray-400 leading-tight">
                            Terdeteksi <strong>{selectedElement.availableSubMeshes.length}</strong> komponen di dalam model ini. Anda bisa memisahkannya menjadi elemen-elemen terpisah agar bisa dianimasikan secara mandiri (roda, pintu, dll).
                          </p>
                          <button
                            onClick={() => {
                              if (confirm('Apakah Anda yakin ingin memecah model ini? Tindakan ini tidak bisa dibatalkan dan akan memisahkan semua mesh ke Timeline.')) {
                                explodeModel(selectedElement.id);
                              }
                            }}
                            className="w-full flex items-center justify-center gap-2 px-3 py-2 bg-orange-500/20 text-orange-400 border border-orange-500/50 hover:bg-orange-500 hover:text-white transition-all rounded text-[11px] font-bold"
                          >
                            <Box size={14} />
                            Pecah Model (Explode)
                          </button>
                        </div>
                      )}

                      {/* 3D Model Animations Display */}
                      {selectedElement.type === '3d_model' && selectedElement.availableAnimations && selectedElement.availableAnimations.length > 0 && (
                        <div className="space-y-4 pt-4 border-t border-[#2b2d31]">
                          <h4 className="text-[10px] font-bold text-gray-500 uppercase tracking-wider flex items-center gap-2">
                            <Play size={12} className="text-pln-yellow"/> Animasi Bawaan (Blender/GLTF)
                          </h4>
                          
                          {/* Autoplay Selection */}
                          <div className="space-y-2">
                            <label className="text-[10px] text-gray-400">Autoplay Animasi (Default)</label>
                            <select 
                              value={selectedElement.autoplayAnimation || ""}
                              onChange={(e) => updateElement(selectedElement.id, { autoplayAnimation: e.target.value })}
                              className="w-full bg-[#1a1b1e] text-xs text-gray-300 border border-gray-700 rounded p-1.5 focus:border-pln-blue outline-none"
                            >
                              <option value="">-- Tidak ada (Idle) --</option>
                              <option value="*">Mainkan Semua Bersamaan</option>
                              {selectedElement.availableAnimations.map(anim => (
                                <option key={anim} value={anim}>{anim}</option>
                              ))}
                            </select>
                            <p className="text-[9px] text-gray-500">Animasi ini akan langsung diputar saat objek dirender di AR.</p>
                          </div>

                          {/* Loop Mode */}
                          <div className="space-y-2">
                            <label className="text-[10px] text-gray-400">Mode Pengulangan (Loop)</label>
                            <div className="flex gap-2">
                              {['loop', 'once', 'pingpong'].map(mode => (
                                <button
                                  key={mode}
                                  onClick={() => updateElement(selectedElement.id, { animationLoopMode: mode as any })}
                                  className={`flex-1 py-1.5 text-[10px] font-medium rounded border transition-colors ${
                                    (selectedElement.animationLoopMode || 'loop') === mode
                                      ? 'bg-pln-yellow/20 border-pln-yellow text-pln-yellow'
                                      : 'bg-[#1a1b1e] border-gray-700 text-gray-400 hover:bg-gray-700'
                                  }`}
                                >
                                  {mode === 'loop' ? 'Ulang Terus' : mode === 'once' ? '1x Saja' : 'Maju Mundur'}
                                </button>
                              ))}
                            </div>
                          </div>

                          {/* Animation Speed */}
                          <div className="space-y-2">
                            <div className="flex justify-between">
                              <label className="text-[10px] text-gray-400">Kecepatan (Time Scale)</label>
                              <span className="text-[10px] text-gray-300">{selectedElement.animationSpeed || 1}x</span>
                            </div>
                            <input
                              type="range"
                              min="0.1"
                              max="3"
                              step="0.1"
                              value={selectedElement.animationSpeed || 1}
                              onChange={(e) => updateElement(selectedElement.id, { animationSpeed: parseFloat(e.target.value) })}
                              className="w-full h-1 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-pln-yellow"
                            />
                          </div>

                          {/* Preview Manual */}
                          <div className="pt-2">
                            <label className="text-[10px] text-gray-400 block mb-2">Uji Coba Manual</label>
                            <div className="flex flex-col gap-2">
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
                                  className={`flex items-center justify-between px-3 py-1.5 rounded text-xs font-medium transition-colors border ${
                                    previewAnim?.targetId === selectedElement.id && previewAnim?.animationName === anim 
                                    ? 'bg-blue-500/20 border-blue-500 text-blue-400' 
                                    : 'bg-[#1a1b1e]/50 hover:bg-gray-700 border-gray-700/50 text-gray-400'
                                  }`}
                                >
                                  <span className="truncate pr-2">{anim}</span>
                                  {previewAnim?.targetId === selectedElement.id && previewAnim?.animationName === anim ? <span className="text-[10px]">🛑 Stop</span> : <Play size={10} />}
                                </button>
                              ))}
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Audio Properties Display */}
                      {selectedElement.type === 'audio' && (
                        <div className="space-y-4 pt-4 border-t border-[#2b2d31]">
                          <h4 className="text-[10px] font-bold text-gray-500 uppercase tracking-wider flex items-center gap-2">
                            <Volume2 size={12} className="text-pink-400"/> Audio Settings
                          </h4>
                          
                          <div className="flex flex-col gap-3">
                            <div className="flex items-center justify-between">
                              <label className="text-[10px] text-gray-300 font-medium">Autoplay (BGM)</label>
                              <input 
                                type="checkbox"
                                checked={selectedElement.autoplay !== false}
                                onChange={(e) => updateElement(selectedElement.id, { autoplay: e.target.checked })}
                                className="w-4 h-4 accent-pln-blue"
                              />
                            </div>
                            
                            <div className="flex items-center justify-between">
                              <label className="text-[10px] text-gray-300 font-medium">Loop (Ulang Terus)</label>
                              <input 
                                type="checkbox"
                                checked={selectedElement.loop !== false}
                                onChange={(e) => updateElement(selectedElement.id, { loop: e.target.checked })}
                                className="w-4 h-4 accent-pln-blue"
                              />
                            </div>
                            
                            <div className="flex flex-col gap-1.5">
                              <label className="text-[10px] text-gray-400 font-medium flex justify-between">
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
                        <div className="space-y-4 pt-4 border-t border-[#2b2d31]">
                          <h4 className="text-[10px] font-bold text-gray-500 uppercase tracking-wider flex items-center gap-2">
                            <Video size={12} className="text-red-400"/> Video Settings
                          </h4>
                          
                          <div className="flex flex-col gap-3">
                            <div className="flex items-center justify-between">
                              <label className="text-[10px] text-gray-300 font-medium">Autoplay</label>
                              <input 
                                type="checkbox"
                                checked={selectedElement.autoplay !== false}
                                onChange={(e) => updateElement(selectedElement.id, { autoplay: e.target.checked })}
                                className="w-4 h-4 accent-pln-blue"
                              />
                            </div>
                            
                            <div className="flex items-center justify-between">
                              <label className="text-[10px] text-gray-300 font-medium">Loop</label>
                              <input 
                                type="checkbox"
                                checked={selectedElement.loop !== false}
                                onChange={(e) => updateElement(selectedElement.id, { loop: e.target.checked })}
                                className="w-4 h-4 accent-pln-blue"
                              />
                            </div>

                            <div className="flex items-center justify-between pt-2 border-t border-gray-700/50">
                              <label className="text-[10px] text-gray-300 font-medium font-bold">Hologram (Chroma Key)</label>
                              <input 
                                type="checkbox"
                                checked={selectedElement.chromaKey || false}
                                onChange={(e) => updateElement(selectedElement.id, { chromaKey: e.target.checked })}
                                className="w-4 h-4 accent-pln-blue"
                              />
                            </div>

                            {selectedElement.chromaKey && (
                              <div className="flex flex-col gap-1.5">
                                <label className="text-[10px] text-gray-400 font-medium flex justify-between">
                                  Warna Latar untuk Dihapus
                                  <span className="font-mono text-[10px] bg-[#1a1b1e] px-1 rounded">{selectedElement.chromaKeyColor || '#00ff00'}</span>
                                </label>
                                <input 
                                  type="color" 
                                  value={selectedElement.chromaKeyColor || '#00ff00'}
                                  onChange={(e) => updateElement(selectedElement.id, { chromaKeyColor: e.target.value })}
                                  className="w-full h-8 bg-[#1a1b1e] border border-[#2b2d31] rounded cursor-pointer"
                                />
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                      
                      {selectedElement.type === '3d_shape' && (
                        <div className="p-4 space-y-4 border-t border-[#2b2d31]">
                          <h4 className="text-[10px] font-bold text-gray-500 uppercase tracking-wider flex items-center gap-2">
                            <Box size={12} className="text-blue-400"/> Pengaturan Objek 3D Dasar
                          </h4>
                          
                          <div className="flex flex-col gap-1.5">
                            <label className="text-[10px] text-gray-400 font-medium">Bentuk Objek</label>
                            <select
                              value={selectedElement.shapeType || 'cube'}
                              onChange={(e) => updateElement(selectedElement.id, { shapeType: e.target.value as any })}
                              className="w-full bg-[#1a1b1e] border border-[#2b2d31] rounded p-2 text-xs text-white outline-none focus:border-pln-blue"
                            >
                            <option value="cube">Kubus (Cube)</option>
                            <option value="sphere">Bola (Sphere)</option>
                            <option value="cylinder">Silinder (Cylinder)</option>
                            <option value="plane">Bidang (Plane)</option>
                            <option value="cone">Kerucut (Cone)</option>
                            <option value="torus">Cincin (Torus)</option>
                            <option value="tetrahedron">Piramida (Tetrahedron)</option>
                            <option value="icosahedron">Polihedron (Icosahedron)</option>
                            </select>
                          </div>
                          
                          <div className="flex flex-col gap-1.5">
                            <label className="text-[10px] text-gray-400 font-medium">Warna Objek</label>
                            <div className="flex items-center gap-2">
                              <input 
                                type="color" 
                                value={selectedElement.color || '#ffffff'}
                                onChange={(e) => updateElement(selectedElement.id, { color: e.target.value })}
                                className="w-8 h-8 bg-[#1a1b1e] border border-[#2b2d31] rounded cursor-pointer shrink-0"
                              />
                              <input 
                                type="text" 
                                value={selectedElement.color || '#ffffff'}
                                onChange={(e) => updateElement(selectedElement.id, { color: e.target.value })}
                                className="flex-1 bg-[#1a1b1e] border border-[#2b2d31] rounded p-1.5 text-xs text-white outline-none focus:border-pln-blue font-mono"
                              />
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Hotspot Properties Display */}
                      {selectedElement.type === 'hotspot' && (
                        <div className="space-y-4 pt-4 border-t border-[#2b2d31]">
                          <h4 className="text-[10px] font-bold text-gray-500 uppercase tracking-wider flex items-center gap-2">
                            <MapPin size={12} className="text-orange-400"/> Hotspot Settings
                          </h4>
                          
                          <div className="flex flex-col gap-1.5">
                            <label className="text-[10px] text-gray-400 font-medium">Teks Penjelasan</label>
                            <textarea
                              value={selectedElement.hotspotText || ''}
                              onChange={(e) => updateElement(selectedElement.id, { hotspotText: e.target.value })}
                              className="w-full bg-[#1a1b1e] border border-[#2b2d31] rounded p-2.5 text-xs text-white outline-none focus:border-pln-blue min-h-[80px]"
                              placeholder="Masukkan teks saat hotspot diklik..."
                            />
                          </div>
                        </div>
                      )}

                      {/* VFX Properties Display */}
                      {selectedElement.type === 'vfx_sparkles' && (
                        <div className="space-y-4 pt-4 border-t border-[#2b2d31]">
                          <h4 className="text-[10px] font-bold text-gray-500 uppercase tracking-wider flex items-center gap-2">
                            <Sparkles size={12} className="text-yellow-400"/> VFX Settings
                          </h4>
                          
                          <div className="flex flex-col gap-3">
                            <div className="flex flex-col gap-1.5">
                              <label className="text-[10px] text-gray-400 font-medium flex justify-between">
                                Warna Partikel
                                <span className="font-mono text-[10px] bg-[#1a1b1e] px-1 rounded">{selectedElement.sparkleColor || '#ffffff'}</span>
                              </label>
                              <input 
                                type="color" 
                                value={selectedElement.sparkleColor || '#ffffff'}
                                onChange={(e) => updateElement(selectedElement.id, { sparkleColor: e.target.value })}
                                className="w-full h-8 bg-[#1a1b1e] border border-[#2b2d31] rounded cursor-pointer"
                              />
                            </div>
                            
                            <div className="flex flex-col gap-1.5">
                              <label className="text-[10px] text-gray-400 font-medium flex justify-between">
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
                              <label className="text-[10px] text-gray-400 font-medium flex justify-between">
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

                <div className="p-4 border-b border-[#2b2d31]">
                  <h3 className="text-[10px] font-bold text-gray-500 mb-3 uppercase tracking-wider flex items-center gap-2">
                    <FolderOpen size={12} className="text-gray-400" /> Parent Group
                  </h3>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] text-gray-400 font-medium">Grup Induk (Hierarchy)</label>
                    <select 
                      value={selectedElement.parentId || ''}
                      onChange={(e) => reparentElement(selectedElement.id, e.target.value || undefined)}
                      className="w-full bg-[#1a1b1e] text-white text-xs p-2 rounded border border-[#2b2d31] focus:border-pln-blue focus:outline-none"
                    >
                      <option value="">-- Tidak Ada (Root) --</option>
                      {elements.filter(el => el.type === 'group_folder' && el.id !== selectedElement.id).map(group => (
                        <option key={group.id} value={group.id}>{group.name}</option>
                      ))}
                    </select>
                    <p className="text-[9px] text-gray-500 mt-1">Jika diatur, posisi dan skala objek ini akan relatif terhadap grup induknya.</p>
                  </div>
                </div>

                <div className="p-4">
                  <h3 className="text-[10px] font-bold text-gray-500 mb-3 uppercase tracking-wider">Transform</h3>
                  <div className="space-y-4">
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


                <div className="p-4 bg-[#202227]">
                  <h3 className="text-[10px] font-bold text-gray-500 mb-3 uppercase tracking-wider flex items-center gap-2">
                    <MousePointerClick size={12} className="text-blue-400" /> Interaktivitas (On-Click)
                  </h3>
                  <div className="space-y-4">
                    <div className="flex flex-col gap-1.5">
                      <label className="text-[10px] text-gray-400 font-medium">Pilih Aksi</label>
                      <select
                        value={selectedElement.onClickActionType || 'none'}
                        onChange={(e) => updateElement(selectedElement.id, { 
                          onClickActionType: e.target.value as any,
                          onClickActionValue: '' // reset value
                        })}
                        className="bg-[#1a1b1e] border border-[#2b2d31] rounded p-2 text-xs text-white outline-none focus:border-pln-blue"
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
                        <label className="text-[10px] text-gray-400 font-medium">URL Tujuan</label>
                        <input
                          type="url"
                          value={selectedElement.onClickActionValue || ''}
                          onChange={(e) => updateElement(selectedElement.id, { onClickActionValue: e.target.value })}
                          className="bg-[#1a1b1e] border border-[#2b2d31] rounded p-2 text-xs text-white outline-none focus:border-pln-blue"
                          placeholder="https://..."
                        />
                      </div>
                    )}

                    {selectedElement.onClickActionType === 'change_scene' && (
                      <div className="flex flex-col gap-1.5">
                        <label className="text-[10px] text-gray-400 font-medium">Pilih Scene Tujuan</label>
                        <select
                          value={selectedElement.onClickActionValue || ''}
                          onChange={(e) => updateElement(selectedElement.id, { onClickActionValue: e.target.value })}
                          className="bg-[#1a1b1e] border border-[#2b2d31] rounded p-2 text-xs text-white outline-none focus:border-pln-blue"
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
                        <label className="text-[10px] text-gray-400 font-medium">Pilih Elemen Audio</label>
                        <select
                          value={selectedElement.onClickActionValue || ''}
                          onChange={(e) => updateElement(selectedElement.id, { onClickActionValue: e.target.value })}
                          className="bg-[#1a1b1e] border border-[#2b2d31] rounded p-2 text-xs text-white outline-none focus:border-pln-blue"
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
                        <label className="text-[10px] text-gray-400 font-medium">Target Model 3D</label>
                        <select
                          value={selectedElement.onClickActionValue ? selectedElement.onClickActionValue.split('|')[0] : ''}
                          onChange={(e) => updateElement(selectedElement.id, { onClickActionValue: e.target.value + '|*' })} // Default select All
                          className="bg-[#1a1b1e] border border-[#2b2d31] rounded p-2 text-xs text-white outline-none focus:border-pln-blue"
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
                            className="bg-[#1a1b1e] border border-[#2b2d31] rounded p-2 text-xs text-white outline-none focus:border-pln-blue mt-1"
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
            </div>
          )}

          {leftPanelTab === 'prefabs' && (
            <div className="h-full flex flex-col">
              <div className="p-4 border-b border-[#2b2d31]">
                <h3 className="text-white font-bold text-sm">Templates (Prefabs)</h3>
                <p className="text-xs text-gray-400 mt-1">Gunakan template siap pakai untuk mempercepat pengerjaan.</p>
              </div>
              <div className="flex-1 overflow-y-auto p-4 space-y-3">
                <button 
                  onClick={() => {
                    const sceneId = currentSceneId || undefined;
                    // Background Card
                    addElement({ type: '3d_shape', shapeType: 'plane', name: 'Latar Kartu', position: [0, 0, 0], rotation: [0, 0, 0], scale: [3.5, 2, 1], sceneId, color: '#2c3e50' });
                    // Profile Picture Placeholder
                    addElement({ type: '3d_shape', shapeType: 'plane', name: 'Foto Profil', position: [-1, 0, 0.05], rotation: [0, 0, 0], scale: [1.2, 1.2, 1], sceneId, color: '#ecf0f1' });
                    // Text Details
                    addElement({ type: '3d_text', name: 'Nama Anda', content: 'Nama Anda', position: [0, 0.3, 0.05], rotation: [0, 0, 0], scale: [0.6, 0.6, 0.6], sceneId, color: '#ffffff' });
                    addElement({ type: '3d_text', name: 'Jabatan', content: 'Jabatan / Pekerjaan', position: [0, -0.1, 0.05], rotation: [0, 0, 0], scale: [0.3, 0.3, 0.3], sceneId, color: '#3498db' });
                    // Button
                    addElement({ type: 'ui_button', name: 'Tombol Website', buttonText: 'Kunjungi Website', actionTargetId: '', actionAnimation: '', position: [0.3, -0.6, 0.05], rotation: [0, 0, 0], scale: [0.8, 0.8, 0.8], sceneId });
                  }}
                  className="w-full bg-[#1a1b1e] border border-[#2b2d31] p-3 rounded-lg flex flex-col items-center gap-2 hover:border-pln-blue transition-colors group text-left"
                >
                  <div className="w-full aspect-video bg-[#2b2d31] rounded flex items-center justify-center text-gray-500 group-hover:bg-pln-blue/10 group-hover:text-pln-blue transition-colors">
                    <LayoutTemplate size={32} />
                  </div>
                  <div className="w-full">
                    <div className="text-white text-xs font-bold">Kartu Nama AR</div>
                    <div className="text-gray-400 text-[10px]">Teks Nama, Jabatan, dan Tombol Website</div>
                  </div>
                </button>
                
                <button 
                  onClick={() => {
                    const sceneId = currentSceneId || undefined;
                    // Main Background
                    addElement({ type: '3d_shape', shapeType: 'plane', name: 'Latar Undangan', position: [0, 0, -0.1], rotation: [0, 0, 0], scale: [4, 3, 1], sceneId, color: '#fff0f5' });
                    // Photos
                    addElement({ type: '3d_shape', shapeType: 'plane', name: 'Foto Mempelai 1', position: [-1.2, 0.2, 0], rotation: [0, 0, 0], scale: [1, 1.5, 1], sceneId, color: '#ffcccc' });
                    addElement({ type: '3d_shape', shapeType: 'plane', name: 'Foto Utama', position: [0, 0.2, 0.1], rotation: [0, 0, 0], scale: [1.2, 1.8, 1], sceneId, color: '#ffffff' });
                    addElement({ type: '3d_shape', shapeType: 'plane', name: 'Foto Mempelai 2', position: [1.2, 0.2, 0], rotation: [0, 0, 0], scale: [1, 1.5, 1], sceneId, color: '#ccffcc' });
                    // Texts
                    addElement({ type: '3d_text', name: 'Nama Mempelai', content: 'Romeo & Juliet', position: [0, -1, 0.05], rotation: [0, 0, 0], scale: [0.7, 0.7, 0.7], sceneId, color: '#d35400' });
                    addElement({ type: '3d_text', name: 'Tanggal', content: 'Minggu, 12 Desember 2026', position: [0, -1.4, 0.05], rotation: [0, 0, 0], scale: [0.3, 0.3, 0.3], sceneId, color: '#7f8c8d' });
                  }}
                  className="w-full bg-[#1a1b1e] border border-[#2b2d31] p-3 rounded-lg flex flex-col items-center gap-2 hover:border-pln-blue transition-colors group text-left"
                >
                  <div className="w-full aspect-video bg-[#2b2d31] rounded flex items-center justify-center text-gray-500 group-hover:bg-pln-blue/10 group-hover:text-pln-blue transition-colors">
                    <ImageIcon size={32} />
                  </div>
                  <div className="w-full">
                    <div className="text-white text-xs font-bold">Galeri Foto</div>
                    <div className="text-gray-400 text-[10px]">3 Frame Foto Melayang berdampingan</div>
                  </div>
                </button>
              </div>
            </div>
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
