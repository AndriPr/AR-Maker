"use client";

import { ArrowLeft, Save, Play, Settings, Image as ImageIcon, Box, Move, RotateCw, Maximize, Layers, Loader2, Type, Trash2 } from 'lucide-react';
import Link from 'next/link';
import { useEffect, useState, use } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';
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
  
  // Zustand Store
  const elements = useEditorStore(state => state.elements);
  const setElements = useEditorStore(state => state.setElements);
  const targetImageUrl = useEditorStore(state => state.targetImageUrl);
  const setTargetImageUrl = useEditorStore(state => state.setTargetImageUrl);
  const selectedId = useEditorStore(state => state.selectedId);
  const setSelectedId = useEditorStore(state => state.setSelectedId);
  const addElement = useEditorStore(state => state.addElement);
  const removeElement = useEditorStore(state => state.removeElement);
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

  const handlePublish = async () => {
    if (!project) return;
    setSaving(true);
    
    try {
      const { error } = await supabase
        .from('ar_projects')
        .update({ is_published: true })
        .eq('id', project.id);
        
      if (error) throw error;
      router.push(`/ar-viewer/${project.id}`);
    } catch (err: any) {
      alert('Gagal mem-publish: ' + err.message);
      setSaving(false);
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
    <div className="h-screen flex flex-col">
      {/* Editor Header */}
      <header className="h-14 bg-gray-900 border-b border-gray-800 flex items-center justify-between px-4 shrink-0">
        <div className="flex items-center gap-4">
          <Link href="/" className="text-gray-400 hover:text-white transition-colors">
            <ArrowLeft size={20} />
          </Link>
          <div className="h-6 w-px bg-gray-700"></div>
          <div>
            <h1 className="text-sm font-bold text-white">{project?.title}</h1>
            <p className="text-xs text-gray-400">
              {lastSaved ? `Tersimpan otomatis ${lastSaved.toLocaleTimeString()}` : 'Belum ada perubahan'}
            </p>
          </div>
        </div>
        
        <div className="flex items-center gap-3">
          <button onClick={handleAddText} className="flex items-center gap-2 px-3 py-1.5 text-xs font-bold bg-gray-800 hover:bg-gray-700 text-white rounded-lg transition-colors border border-gray-700">
            <Type size={14} />
            Add Text
          </button>
          
          <div className="h-4 w-px bg-gray-700 mx-2"></div>

          <button onClick={() => handleSave(false)} disabled={saving} className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-gray-300 hover:text-white hover:bg-gray-800 rounded-lg transition-colors disabled:opacity-50">
            {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
            Simpan Manual
          </button>
          <button onClick={handlePublish} disabled={saving} className="flex items-center gap-2 px-4 py-1.5 text-sm font-bold bg-pln-blue hover:bg-pln-blue-dark text-white rounded-lg transition-colors disabled:opacity-50">
            <Play size={16} />
            Publish & Preview
          </button>
        </div>
      </header>

      {/* Editor Body */}
      <div className="flex-1 flex overflow-hidden">
        
        {/* Left Sidebar */}
        <aside className="w-64 bg-gray-900 border-r border-gray-800 flex flex-col shrink-0">
          <div className="p-3 border-b border-gray-800 text-xs font-bold text-gray-400 uppercase flex items-center gap-2">
            <Layers size={14} />
            Scene Hierarchy
          </div>
          <div className="flex-1 overflow-y-auto p-2 space-y-1">
            <div 
              className={`flex items-center gap-2 px-3 py-2 rounded-md text-sm border cursor-pointer transition-colors ${
                selectedId === null ? 'bg-blue-900/40 border-pln-blue text-white' : 'bg-gray-800 border-gray-700 text-gray-200 hover:border-gray-600'
              }`}
              onClick={() => setSelectedId(null)}
            >
              <ImageIcon size={16} className="text-blue-400 shrink-0" />
              <span className="truncate">Marker Image</span>
            </div>
            
            {elements.map(el => (
              <div 
                key={el.id}
                onClick={() => setSelectedId(el.id)}
                className={`flex items-center justify-between px-3 py-2 rounded-md text-sm cursor-pointer transition-colors pl-6 border ${
                  selectedId === el.id ? 'bg-blue-900/40 border-pln-blue text-white' : 'bg-gray-800/50 border-gray-700/50 text-gray-300 hover:border-gray-600'
                }`}
              >
                <div className="flex items-center gap-2 overflow-hidden">
                  {el.type === '3d_model' && <Box size={14} className="text-purple-400 shrink-0" />}
                  {el.type === '3d_text' && <Type size={14} className="text-green-400 shrink-0" />}
                  <span className="truncate text-xs">{el.name}</span>
                </div>
                {selectedId === el.id && (
                  <button onClick={(e) => { e.stopPropagation(); removeElement(el.id); }} className="text-red-400 hover:text-red-300">
                    <Trash2 size={12} />
                  </button>
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
          <div className="h-1/2 border-t border-gray-800 flex flex-col">
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

        {/* 3D Viewport Area */}
        <main className="flex-1 relative flex flex-col">
          {/* Toolbar */}
          <div className="absolute top-4 left-1/2 -translate-x-1/2 bg-gray-900/80 backdrop-blur-sm border border-gray-700 rounded-lg flex p-1 shadow-xl z-10 gap-1">
            <button 
              onClick={() => setTransformMode('translate')} 
              className={`p-2 rounded-md transition-colors ${transformMode === 'translate' ? 'bg-pln-blue text-white' : 'text-gray-400 hover:text-white hover:bg-gray-800'}`}
              title="Geser (Translate)"
            >
              <Move size={18} />
            </button>
            <button 
              onClick={() => setTransformMode('rotate')} 
              className={`p-2 rounded-md transition-colors ${transformMode === 'rotate' ? 'bg-pln-blue text-white' : 'text-gray-400 hover:text-white hover:bg-gray-800'}`}
              title="Putar (Rotate)"
            >
              <RotateCw size={18} />
            </button>
            <button 
              onClick={() => setTransformMode('scale')} 
              className={`p-2 rounded-md transition-colors ${transformMode === 'scale' ? 'bg-pln-blue text-white' : 'text-gray-400 hover:text-white hover:bg-gray-800'}`}
              title="Perbesar/Kecil (Scale)"
            >
              <Maximize size={18} />
            </button>
          </div>
          
          <div className="w-full h-full relative overflow-hidden bg-black">
            <EditorViewport transformMode={transformMode} />
          </div>
        </main>

        {/* Right Sidebar */}
        <aside className="w-72 bg-gray-900 border-l border-gray-800 flex flex-col shrink-0">
          <div className="p-3 border-b border-gray-800 text-xs font-bold text-gray-400 uppercase flex items-center gap-2">
            <Settings size={14} />
            Properties
          </div>
          
          <div className="p-4 space-y-6 overflow-y-auto">
            
            {/* Target Image Info (Shown when no element is selected) */}
            {selectedId === null && (
              <div>
                <h3 className="text-sm font-bold text-gray-200 mb-3 flex items-center justify-between">
                  Target Image (Marker)
                  <button className="text-red-400 text-xs hover:underline" onClick={() => setTargetImageUrl(null)}>Clear</button>
                </h3>
                <div className="aspect-video bg-gray-800 rounded-lg border border-gray-700 flex items-center justify-center overflow-hidden relative">
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
                    {selectedElement.type === '3d_model' ? '3D Model' : '3D Text'}
                    <button className="text-red-400 text-xs hover:underline" onClick={() => removeElement(selectedElement.id)}>Hapus</button>
                  </h3>
                  
                  <div className="space-y-4">
                    <div className="flex flex-col gap-1">
                      <label className="text-xs text-gray-400">Nama Elemen</label>
                      <input 
                        type="text" 
                        value={selectedElement.name}
                        onChange={(e) => updateElement(selectedElement.id, { name: e.target.value })}
                        className="w-full bg-gray-800 border border-gray-700 rounded p-2 text-xs text-gray-200 outline-none focus:border-pln-blue"
                      />
                    </div>

                    {selectedElement.type === '3d_text' && (
                      <>
                        <div className="flex flex-col gap-1">
                          <label className="text-xs text-gray-400">Konten Teks</label>
                          <textarea 
                            value={selectedElement.content}
                            onChange={(e) => updateElement(selectedElement.id, { content: e.target.value })}
                            className="w-full bg-gray-800 border border-gray-700 rounded p-2 text-xs text-gray-200 outline-none focus:border-pln-blue h-20"
                          />
                        </div>
                        <div className="flex flex-col gap-1">
                          <label className="text-xs text-gray-400">Warna Teks</label>
                          <input 
                            type="color" 
                            value={selectedElement.color || '#ffffff'}
                            onChange={(e) => updateElement(selectedElement.id, { color: e.target.value })}
                            className="w-full bg-gray-800 border border-gray-700 rounded h-8 outline-none cursor-pointer"
                          />
                        </div>
                      </>
                    )}
                  </div>
                </div>

                <div className="h-px bg-gray-800"></div>

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
                  <p className="text-[10px] text-gray-500 mt-3 text-center">Tarik garis navigasi 3D di viewport untuk mengubah.</p>
                </div>
              </>
            )}

          </div>
        </aside>
      </div>
    </div>
  );
}

function TransformRow({ label, values, onChange }: { label: string, values: number[], onChange: (index: number, val: number) => void }) {
  return (
    <div className="flex items-center justify-between gap-2">
      <span className="text-xs text-gray-500 w-12">{label}</span>
      <div className="flex gap-1 flex-1">
        {['X', 'Y', 'Z'].map((axis, i) => (
          <div key={axis} className="flex items-center bg-gray-800 rounded flex-1 overflow-hidden border border-gray-700 focus-within:border-pln-blue">
            <span className="text-[10px] text-gray-500 px-1.5 bg-gray-800/50 border-r border-gray-700/50">{axis}</span>
            <input 
              type="number" 
              step="0.1"
              value={Number(values[i]).toFixed(2)} 
              onChange={(e) => onChange(i, parseFloat(e.target.value) || 0)}
              className="w-full bg-transparent text-xs text-white px-1 py-1 outline-none text-center" 
            />
          </div>
        ))}
      </div>
    </div>
  );
}
