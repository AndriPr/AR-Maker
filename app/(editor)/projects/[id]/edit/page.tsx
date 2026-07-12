"use client";

import { ArrowLeft, Save, Play, Settings, Image as ImageIcon, Box, Move, RotateCw, Maximize, Layers, Loader2, Type, Trash2, X, PanelLeftClose, PanelRightClose, QrCode, Download, ExternalLink, Copy, MousePointerClick } from 'lucide-react';
import Link from 'next/link';
import { useEffect, useState, use } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
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
  const [isRightPanelOpen, setRightPanelOpen] = useState(false);
  const [showPublishModal, setShowPublishModal] = useState(false);
  
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
  
  const [transformMode, setTransformMode] = useState<'translate' | 'rotate' | 'scale'>('translate');
  
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
          scene_data: sceneData
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
      const { error } = await supabase
        .from('ar_projects')
        .update({ 
          is_published: true,
          target_image_url: targetImageUrl,
          scene_data: sceneData,
          ...(finalMindUrl ? { mind_file_url: finalMindUrl } : {})
        })
        .eq('id', project.id);
        
      if (error) throw error;
      
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
          
          <div className="hidden sm:block h-4 w-px bg-gray-700 mx-1"></div>

          <button onClick={() => handleSave(false)} disabled={saving} className="flex items-center justify-center w-8 h-8 sm:w-auto sm:h-auto sm:px-3 sm:py-1.5 text-[10px] sm:text-sm font-medium text-gray-300 hover:text-white hover:bg-gray-800 rounded-lg transition-colors disabled:opacity-50">
            {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
            <span className="hidden sm:inline sm:ml-2">Simpan Manual</span>
          </button>
          
          <button onClick={handlePublish} disabled={saving || publishProgress !== null} className="flex items-center gap-1 sm:gap-2 px-2 sm:px-4 py-1.5 text-[10px] sm:text-sm font-bold bg-pln-blue hover:bg-pln-blue-dark text-white rounded-lg transition-colors disabled:opacity-50">
            {publishProgress ? (
               <Loader2 size={14} className="animate-spin" />
            ) : (
               <Play size={14} />
            )}
            <span className="hidden sm:inline">{publishProgress || 'Publish & Preview'}</span>
            <span className="sm:hidden">{publishProgress || 'Publish'}</span>
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
                    if(window.innerWidth < 768) setLeftPanelOpen(false);
                  }}
                  className={`aspect-square rounded-md border flex flex-col items-center justify-center cursor-pointer transition-colors relative overflow-hidden bg-gray-800 border-gray-700 hover:border-gray-500`}
                >
                  {asset.type === 'image' ? (
                     <img src={asset.file_url} className="w-full h-full object-cover opacity-70" />
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
        <div className="pointer-events-auto absolute top-4 left-1/2 -translate-x-1/2 bg-gray-900/80 backdrop-blur-xl border border-gray-700/50 rounded-full flex p-1.5 shadow-2xl z-40 gap-1.5">
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
              <div>
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
            )}

            {/* Element Properties */}
            {selectedElement && (
              <>
                <div>
                  <h3 className="text-sm font-bold text-gray-200 mb-3 flex items-center justify-between">
                    {selectedElement.type === '3d_model' ? '3D Model' : selectedElement.type === '3d_text' ? '3D Text' : 'UI Button'}
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
                      <>
                        <div className="flex flex-col gap-1.5">
                          <label className="text-xs text-gray-400">Konten Teks</label>
                          <textarea 
                            value={selectedElement.content}
                            onChange={(e) => updateElement(selectedElement.id, { content: e.target.value })}
                            className="w-full bg-gray-800/80 border border-gray-600 rounded-lg p-3 text-sm text-white outline-none focus:border-pln-blue h-28 resize-none transition-colors shadow-inner font-medium"
                            placeholder="Ketik sesuatu..."
                          />
                        </div>
                        <div className="flex flex-col gap-1.5">
                          <label className="text-xs text-gray-400">Warna Teks</label>
                          <input 
                            type="color" 
                            value={selectedElement.color || '#ffffff'}
                            onChange={(e) => updateElement(selectedElement.id, { color: e.target.value })}
                            className="w-full bg-gray-800 border border-gray-700 rounded-lg h-10 outline-none cursor-pointer p-1"
                          />
                        </div>
                      </>
                    )}
                      {/* UI Button Specific Properties */}
                      {selectedElement.type === 'ui_button' && (
                        <div className="space-y-4 pt-4 border-t border-gray-800">
                          <h4 className="text-xs font-bold text-gray-400 uppercase">Interactivity</h4>
                          
                          <div className="flex flex-col gap-1.5">
                            <label className="text-xs text-gray-400">Label Tombol</label>
                            <input 
                              type="text"
                              value={selectedElement.buttonText || ''}
                              onChange={(e) => updateElement(selectedElement.id, { buttonText: e.target.value })}
                              className="w-full bg-gray-800/80 border border-gray-600 rounded-lg p-2 text-sm text-white outline-none focus:border-pln-blue shadow-inner"
                              placeholder="Misal: Mulai Animasi"
                            />
                          </div>

                          <div className="flex flex-col gap-1.5">
                            <label className="text-xs text-gray-400">Target Model 3D</label>
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
                              <label className="text-xs text-gray-400">Pilih Animasi (Otomatis)</label>
                              <select
                                value={selectedElement.actionAnimation || ''}
                                onChange={(e) => updateElement(selectedElement.id, { actionAnimation: e.target.value })}
                                className="w-full bg-gray-800/80 border border-gray-600 rounded-lg p-2 text-sm text-white outline-none focus:border-pln-blue shadow-inner"
                              >
                                <option value="">-- Pilih Animasi --</option>
                                {elements.find(el => el.id === selectedElement.actionTargetId)?.availableAnimations?.map(anim => (
                                  <option key={anim} value={anim}>{anim}</option>
                                ))}
                              </select>
                            </div>
                          )}
                        </div>
                      )}

                      {/* 3D Model Animations Display */}
                      {selectedElement.type === '3d_model' && selectedElement.availableAnimations && selectedElement.availableAnimations.length > 0 && (
                        <div className="space-y-3 pt-4 border-t border-gray-800">
                          <h4 className="text-xs font-bold text-gray-400 uppercase flex items-center gap-2">
                            <Play size={12} className="text-pln-yellow"/> Animasi Bawaan Terdeteksi
                          </h4>
                          <div className="flex flex-wrap gap-2">
                            {selectedElement.availableAnimations.map(anim => (
                              <span key={anim} className="bg-gray-800 border border-gray-700 text-xs px-2.5 py-1 rounded-md text-gray-300 font-medium">
                                {anim}
                              </span>
                            ))}
                          </div>
                          <p className="text-[10px] text-gray-500">Buat elemen "UI Button" untuk memicu animasi ini di AR.</p>
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
              </>
            )}

          </div>
        </aside>
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
              
              <div className="bg-white p-4 rounded-xl shadow-lg mb-6" id="qr-code-container">
                <QRCodeSVG 
                  value={`${window.location.origin}/ar-viewer/${project?.id}`} 
                  size={200}
                  level="H"
                  includeMargin={true}
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
