import React from 'react';
import { 
  ImageIcon, FolderOpen, Box, Type, MousePointerClick, 
  LayoutDashboard, Volume2, Video, Sparkles, MapPin, 
  Trash2, Search, Loader2, Plus, Music 
} from 'lucide-react';
import { useEditorStore } from '@/lib/store';
import ShapePreview from '@/components/Editor/ShapePreview';

interface LeftPanelExpandedProps {
  isLeftPanelOpen: boolean;
  leftPanelTab: 'hierarchy' | 'library' | 'shapes' | 'prefabs';
  assets: any[];
  assetSearchQuery: string;
  setAssetSearchQuery: (query: string) => void;
  assetFilter: string;
  setAssetFilter: (filter: string) => void;
  isUploadingAsset: boolean;
  handleUploadAsset: (e: React.ChangeEvent<HTMLInputElement>) => void;
  fileInputRef: React.RefObject<HTMLInputElement | null>;
  setTargetImageUrl: (url: string | null) => void;
}

export function LeftPanelExpanded({
  isLeftPanelOpen,
  leftPanelTab,
  assets,
  assetSearchQuery,
  setAssetSearchQuery,
  assetFilter,
  setAssetFilter,
  isUploadingAsset,
  handleUploadAsset,
  fileInputRef,
  setTargetImageUrl
}: LeftPanelExpandedProps) {
  
  const { 
    elements, 
    selectedId, 
    setSelectedId, 
    multiSelectedIds, 
    setMultiSelectedIds, 
    addElement, 
    removeElement, 
    reparentElement, 
    currentSceneId 
  } = useEditorStore();

  const handleElementClick = (id: string, ctrlKey: boolean, shiftKey: boolean) => {
    if (ctrlKey || shiftKey) {
      if (multiSelectedIds.includes(id)) {
        setMultiSelectedIds(multiSelectedIds.filter(selId => selId !== id));
      } else {
        const newIds = [...multiSelectedIds, id];
        if (selectedId && !multiSelectedIds.includes(selectedId)) {
           newIds.push(selectedId);
        }
        setMultiSelectedIds(newIds);
      }
    } else {
      setSelectedId(id);
      setMultiSelectedIds([]);
    }
  };

  const renderAssetCard = (asset: any) => (
    <div 
      key={asset.id} 
      onClick={() => {
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
      }}
      className={`aspect-square rounded border border-[#2b2d31] flex flex-col items-center justify-center cursor-pointer transition-colors relative overflow-hidden bg-[#202227] hover:border-pln-blue group`}
    >
      {asset.type === 'image' ? (
         <>
           <img src={asset.file_url} className="w-full h-full object-cover opacity-70 group-hover:opacity-30 transition-opacity" />
           <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity p-2">
             <button 
               onClick={(e) => { e.stopPropagation(); setTargetImageUrl(asset.file_url); setSelectedId(null); }}
               className="w-full py-1.5 bg-pln-blue hover:bg-blue-600 text-white text-[9px] font-bold rounded shadow-lg"
             >
               Jadikan Marker
             </button>
             <button 
               onClick={(e) => { 
                 e.stopPropagation(); 
                 addElement({ type: 'image', name: asset.name, url: asset.file_url, position: [0, 0, 0], rotation: [0, 0, 0], scale: [1, 1, 1] }); 
               }}
               className="w-full py-1.5 bg-[#2b2d31] hover:bg-[#36393f] text-white text-[9px] font-bold rounded shadow-lg"
             >
               Tambah Objek
             </button>
           </div>
         </>
      ) : asset.type === 'audio' ? (
         <Music size={20} className="text-gray-500 group-hover:text-pln-blue mb-1 transition-colors" />
      ) : asset.type === 'video' ? (
         <Video size={20} className="text-gray-500 group-hover:text-pln-blue mb-1 transition-colors" />
      ) : asset.type === '3d_model' ? (
         <div className="w-full h-full pointer-events-none opacity-80 group-hover:opacity-100 transition-opacity flex items-center justify-center">
           {/* @ts-ignore */}
           <model-viewer 
             src={asset.file_url} 
             auto-rotate 
             style={{ width: '100%', height: '100%', backgroundColor: 'transparent' }}
           >
           {/* @ts-ignore */}
           </model-viewer>
         </div>
      ) : (
         <Box size={20} className="text-gray-500 group-hover:text-pln-blue mb-1 transition-colors" />
      )}
      
      {asset.type !== 'image' && (
         <span className="text-[8px] text-gray-500 truncate w-full text-center px-1 mt-1 group-hover:text-gray-300">{asset.name}</span>
      )}
    </div>
  );

  return (
    <aside className={`pointer-events-auto absolute top-14 bottom-0 left-12 z-20 w-64 bg-[#202227] border-r border-[#2b2d31] flex flex-col shrink-0 transform transition-transform duration-300 ease-in-out shadow-2xl ${isLeftPanelOpen ? 'translate-x-0' : '-translate-x-[150%]'} overflow-hidden`}>
      
      {leftPanelTab === 'hierarchy' && (
        <>
          {/* Hierarchy View */}
          <div className="flex border-b border-[#2b2d31] bg-[#1a1b1e]">
            <button className="flex-1 py-3 text-[10px] font-bold text-white border-b-2 border-pln-blue bg-[#202227]">SCENE HIERARCHY</button>
          </div>
          <div className="flex-1 overflow-y-auto custom-scrollbar min-h-0 bg-[#202227]">
            <div className="p-2 space-y-0.5">
              <div 
                className={`flex items-center gap-2 px-3 py-2 mt-1 rounded text-xs cursor-pointer transition-colors ${
                  selectedId === null ? 'bg-pln-blue/20 text-pln-blue font-bold border border-pln-blue/30' : 'text-gray-300 hover:bg-[#2b2d31] border border-transparent'
                }`}
                onClick={() => { setSelectedId(null); setMultiSelectedIds([]); }}
              >
                <ImageIcon size={12} className="shrink-0" />
                <span className="truncate">Marker Image</span>
              </div>
              
              {/* Add Group Button */}
              <button 
                onClick={() => {
                  addElement({
                    type: 'group_folder',
                    name: 'New Group',
                    position: [0, 0, 0],
                    rotation: [0, 0, 0],
                    scale: [1, 1, 1],
                    sceneId: currentSceneId
                  });
                }}
                className="w-full flex items-center justify-center gap-2 px-3 py-1.5 mb-2 rounded text-xs bg-gray-800 hover:bg-gray-700 text-gray-300 border border-gray-700 transition-colors"
              >
                <FolderOpen size={12} />
                Buat Grup Baru
              </button>

              {/* Recursive Hierarchy */}
              {(() => {
                const renderHierarchyNode = (el: any, depth: number = 0) => {
                  const children = elements.filter(child => child.parentId === el.id);
                  const isMultiSelected = multiSelectedIds.includes(el.id);
                  const isPrimarySelected = selectedId === el.id;
                  const isSelected = isPrimarySelected || isMultiSelected;

                  return (
                    <div key={el.id} className="space-y-0.5 mt-0.5">
                      <div 
                        draggable
                        onDragStart={(e) => {
                          e.dataTransfer.setData('text/plain', el.id);
                        }}
                        onDragOver={(e) => {
                          e.preventDefault();
                          e.currentTarget.classList.add('bg-[#2b2d31]');
                        }}
                        onDragLeave={(e) => {
                          e.currentTarget.classList.remove('bg-[#2b2d31]');
                        }}
                        onDrop={(e) => {
                          e.preventDefault();
                          e.currentTarget.classList.remove('bg-[#2b2d31]');
                          const draggedId = e.dataTransfer.getData('text/plain');
                          if (draggedId && draggedId !== el.id) {
                            if (el.type === 'group_folder') {
                              reparentElement(draggedId, el.id);
                            } else {
                              // Drop on a non-folder makes it a sibling
                              reparentElement(draggedId, el.parentId);
                            }
                          }
                        }}
                        onClick={(e) => {
                          handleElementClick(el.id, e.ctrlKey || e.metaKey, e.shiftKey);
                        }}
                        className={`flex items-center justify-between px-3 py-1.5 rounded text-xs cursor-pointer transition-colors ${
                          isSelected ? 'bg-pln-blue/20 text-pln-blue font-bold border border-pln-blue/30' : 'text-gray-300 hover:bg-[#2b2d31] border border-transparent'
                        }`}
                        style={{ paddingLeft: `${0.75 + (depth * 1.5)}rem` }}
                      >
                        <div className="flex items-center gap-2 overflow-hidden pointer-events-none">
                          {el.type === 'group_folder' ? (
                            <FolderOpen size={12} className={isSelected ? "text-pln-blue" : "text-gray-400"} />
                          ) : el.type === '3d_model' ? (
                            <Box size={12} className="shrink-0" />
                          ) : el.type === '3d_text' ? (
                            <Type size={12} className="shrink-0" />
                          ) : el.type === 'ui_button' ? (
                            <MousePointerClick size={12} className="shrink-0" />
                          ) : el.type === 'edu_panel' ? (
                            <LayoutDashboard size={12} className="shrink-0" />
                          ) : el.type === 'audio' ? (
                            <Volume2 size={12} className="shrink-0" />
                          ) : el.type === 'video' ? (
                            <Video size={12} className="shrink-0" />
                          ) : el.type === 'vfx_sparkles' ? (
                            <Sparkles size={12} className="shrink-0" />
                          ) : el.type === 'hotspot' ? (
                            <MapPin size={12} className="shrink-0" />
                          ) : (
                            <Box size={12} className="shrink-0 text-gray-500" />
                          )}
                          <span className="truncate">{el.name}</span>
                        </div>
                        {isSelected && (
                          <div className="flex items-center">
                            <button onClick={(e) => { e.stopPropagation(); removeElement(el.id); }} className="text-red-400 hover:text-red-300 p-1 bg-[#1a1b1e] rounded border border-[#2b2d31]" title="Hapus">
                              <Trash2 size={12} />
                            </button>
                          </div>
                        )}
                      </div>
                      {children.map(child => renderHierarchyNode(child, depth + 1))}
                    </div>
                  );
                };

                // Only render root elements, they will recursively render their children
                return elements.filter(el => !el.parentId).map(el => renderHierarchyNode(el, 0));
              })()}
            </div>
          </div>
        </>
      )}
      
      {leftPanelTab === 'library' && (
        <>
          {/* Library View */}
          <div className="flex border-b border-[#2b2d31] bg-[#1a1b1e]">
            <button className="flex-1 py-3 text-[10px] font-bold text-white border-b-2 border-pln-blue bg-[#202227]">PROJECT ASSETS</button>
            <input 
              type="file" 
              ref={fileInputRef} 
              className="hidden" 
              onChange={handleUploadAsset} 
              accept="image/*,video/*,audio/*,.glb,.gltf"
            />
            <button 
              onClick={() => fileInputRef.current?.click()} 
              disabled={isUploadingAsset}
              className="flex-1 py-3 text-[10px] font-bold text-gray-500 hover:text-gray-300 bg-[#1a1b1e] text-center flex items-center justify-center border-l border-[#2b2d31] disabled:opacity-50"
            >
              {isUploadingAsset ? <Loader2 size={12} className="animate-spin mr-1" /> : <Plus size={12} className="mr-1" />}
              UPLOAD ASSET
            </button>
          </div>
          <div className="p-2 border-b border-[#2b2d31] bg-[#1a1b1e] flex gap-2">
            <div className="relative flex-1">
              <Search size={12} className="absolute left-2 top-1/2 -translate-y-1/2 text-gray-500" />
              <input 
                type="text" 
                placeholder="Cari aset..." 
                value={assetSearchQuery}
                onChange={(e) => setAssetSearchQuery(e.target.value)}
                className="w-full bg-[#2b2d31] text-white text-[10px] rounded px-6 py-1.5 focus:outline-none focus:ring-1 focus:ring-pln-blue"
              />
            </div>
            <select 
              value={assetFilter}
              onChange={(e) => setAssetFilter(e.target.value)}
              className="bg-[#2b2d31] text-white text-[10px] rounded px-2 py-1.5 focus:outline-none focus:ring-1 focus:ring-pln-blue cursor-pointer"
            >
              <option value="all">Semua Kategori</option>
              <option value="3d_model">Objek 3D</option>
              <option value="image">Gambar</option>
              <option value="video">Video</option>
              <option value="audio">Audio</option>
            </select>
          </div>
        <div className="flex-1 overflow-y-auto custom-scrollbar min-h-0">
          <div className="p-2 grid grid-cols-2 gap-2">
          {(() => {
            const premiumAssets = [
              { id: 'pa-1', type: '3d_model', name: 'Duck', file_url: 'https://raw.githubusercontent.com/KhronosGroup/glTF-Sample-Models/master/2.0/Duck/glTF-Binary/Duck.glb' },
              { id: 'pa-2', type: '3d_model', name: 'Avocado', file_url: 'https://raw.githubusercontent.com/KhronosGroup/glTF-Sample-Models/master/2.0/Avocado/glTF-Binary/Avocado.glb' },
              { id: 'pa-3', type: '3d_model', name: 'Flight Helmet', file_url: 'https://raw.githubusercontent.com/KhronosGroup/glTF-Sample-Models/master/2.0/FlightHelmet/glTF/FlightHelmet.gltf' },
              { id: 'pa-4', type: '3d_model', name: 'Damaged Helmet', file_url: 'https://raw.githubusercontent.com/KhronosGroup/glTF-Sample-Models/master/2.0/DamagedHelmet/glTF-Binary/DamagedHelmet.glb' },
              { id: 'pa-5', type: 'image', name: 'Premium Abstract', file_url: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=2564&auto=format&fit=crop' },
              { id: 'pa-6', type: 'image', name: 'Modern Texture', file_url: 'https://images.unsplash.com/photo-1550684848-fac1c5b4e853?q=80&w=2000&auto=format&fit=crop' }
            ];
            
            const allAssets = [...premiumAssets, ...assets];
            
            const filteredAssets = allAssets.filter(asset => {
              const matchesSearch = asset.name.toLowerCase().includes(assetSearchQuery.toLowerCase());
              const matchesFilter = assetFilter === 'all' || asset.type === assetFilter;
              return matchesSearch && matchesFilter;
            });
            
            return (
              <>
                {filteredAssets.filter(a => a.type === '3d_model').length > 0 && (
                  <>
                    <div className="col-span-2 mt-2 px-1 border-b border-[#2b2d31] pb-1"><span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Objek 3D</span></div>
                    {filteredAssets.filter(a => a.type === '3d_model').map(renderAssetCard)}
                  </>
                )}
                {filteredAssets.filter(a => a.type === 'image').length > 0 && (
                  <>
                    <div className="col-span-2 mt-2 px-1 border-b border-[#2b2d31] pb-1"><span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Gambar</span></div>
                    {filteredAssets.filter(a => a.type === 'image').map(renderAssetCard)}
                  </>
                )}
                {filteredAssets.filter(a => a.type === 'video').length > 0 && (
                  <>
                    <div className="col-span-2 mt-2 px-1 border-b border-[#2b2d31] pb-1"><span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Video</span></div>
                    {filteredAssets.filter(a => a.type === 'video').map(renderAssetCard)}
                  </>
                )}
                {filteredAssets.filter(a => a.type === 'audio').length > 0 && (
                  <>
                    <div className="col-span-2 mt-2 px-1 border-b border-[#2b2d31] pb-1"><span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Audio</span></div>
                    {filteredAssets.filter(a => a.type === 'audio').map(renderAssetCard)}
                  </>
                )}
                
                {filteredAssets.length === 0 && (
                  <div className="col-span-2 flex flex-col items-center justify-center text-gray-500 text-[10px] text-center p-4">
                    {assets.length === 0 ? (
                      <>Belum ada aset.<br/>Upload dari halaman My Assets.</>
                    ) : (
                      <>Aset tidak ditemukan.</>
                    )}
                  </div>
                )}
              </>
            );
          })()}
          </div>
        </div>
      </>
      )}

      {leftPanelTab === 'shapes' && (
        <>
          <div className="flex border-b border-[#2b2d31] bg-[#1a1b1e]">
            <button className="flex-1 py-3 text-[10px] font-bold text-white border-b-2 border-pln-blue bg-[#202227]">BASIC SHAPES</button>
          </div>
          <div className="flex-1 overflow-y-auto custom-scrollbar min-h-0">
            <div className="p-2 grid grid-cols-2 gap-2">
              {[
                { id: 'cube', name: 'Kubus' },
                { id: 'sphere', name: 'Bola' },
                { id: 'cylinder', name: 'Silinder' },
                { id: 'plane', name: 'Bidang' },
                { id: 'cone', name: 'Kerucut' },
                { id: 'torus', name: 'Cincin' },
                { id: 'tetrahedron', name: 'Piramida' },
                { id: 'icosahedron', name: 'Polihedron' },
              ].map(shape => (
                <div 
                  key={shape.id} 
                  onClick={() => addElement({ type: '3d_shape', shapeType: shape.id as any, name: shape.name, position: [0, 0, 0], rotation: [0, 0, 0], scale: [1, 1, 1], color: '#ffffff' })}
                  className="aspect-square rounded border border-[#2b2d31] flex flex-col items-center justify-center cursor-pointer transition-colors bg-[#202227] hover:border-pln-blue text-gray-400 hover:text-white group relative overflow-hidden"
                >
                  <ShapePreview type={shape.id as any} />
                  <span className="text-[10px] font-medium mt-1 absolute bottom-1.5 z-10 bg-[#202227]/80 px-2 rounded-full">{shape.name}</span>
                </div>
              ))}
            </div>
          </div>
        </>
      )}

    </aside>
  );
}
