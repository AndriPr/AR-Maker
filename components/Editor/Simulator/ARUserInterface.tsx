import React, { useEffect, useState } from 'react';
import { useEditorStore } from '@/lib/store';
import { Camera, Maximize, X, Info, ScanLine, Type, Image as ImageIcon, Box, Video, Music, List } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export function ARUserInterface() {
  const selectedId = useEditorStore(state => state.selectedId);
  const elements = useEditorStore(state => state.elements);
  const setSelectedId = useEditorStore(state => state.setSelectedId);
  const isScanningAR = useEditorStore(state => state.isScanningAR);
  const setIsScanningAR = useEditorStore(state => state.setIsScanningAR);
  const [flash, setFlash] = useState(false);
  const [showList, setShowList] = useState(false);
  const currentSceneId = useEditorStore(state => state.currentSceneId);
  
  const selectedElement = elements.find(el => el.id === selectedId);

  // Filter out orphaned (ghost) elements
  const validElements = elements.filter(el => {
    if (!el.parentId) return true;
    let currentParent = el.parentId;
    while (currentParent) {
      const parent = elements.find(p => p.id === currentParent);
      if (!parent) return false; // Parent doesn't exist, this is a ghost!
      currentParent = parent.parentId;
    }
    return true;
  });
  const validSceneElements = validElements.filter(el => el.sceneId === currentSceneId);

  useEffect(() => {
    if (isScanningAR) {
      const timer = setTimeout(() => {
        setIsScanningAR(false);
      }, 3000); // 3 seconds scanning phase
      return () => clearTimeout(timer);
    }
  }, [isScanningAR, setIsScanningAR]);

  const takeScreenshot = () => {
    const canvas = document.querySelector('canvas');
    if (canvas) {
      // Trigger visual flash
      setFlash(true);
      setTimeout(() => setFlash(false), 200);

      // We need to preserveDrawingBuffer to be true in the canvas context, 
      // but if not, this might yield a blank image. Assuming R3F handles it or we'll get what we see.
      const url = canvas.toDataURL('image/png');
      const a = document.createElement('a');
      a.href = url;
      a.download = 'ar-screenshot.png';
      a.click();
    }
  };

  const getElementIcon = (type: string) => {
    switch(type) {
      case '3d_model': return <Box size={20} />;
      case '3d_text': return <Type size={20} />;
      case 'image': return <ImageIcon size={20} />;
      case 'video': return <Video size={20} />;
      case 'audio': return <Music size={20} />;
      default: return <Info size={20} />;
    }
  };

  return (
    <div className="absolute inset-0 pointer-events-none flex flex-col z-[50]">
      {/* Screen Flash for Camera */}
      <AnimatePresence>
        {flash && (
          <motion.div 
            initial={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-white z-[100]"
          />
        )}
      </AnimatePresence>

      {/* Scanning Overlay */}
      <AnimatePresence>
        {isScanningAR && (
          <motion.div 
            initial={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/60 backdrop-blur-sm flex flex-col items-center justify-center pointer-events-auto"
          >
             <motion.div 
               animate={{ scale: [1, 1.1, 1], opacity: [0.5, 1, 0.5] }}
               transition={{ repeat: Infinity, duration: 1.5 }}
             >
               <ScanLine size={64} className="text-pln-blue mb-4" />
             </motion.div>
             <h3 className="text-white font-bold text-xl mb-2">Arahkan ke Permukaan</h3>
             <p className="text-gray-300 text-center max-w-[80%] text-sm">
               Cari permukaan datar dan terang untuk menempatkan objek AR Anda.
             </p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main AR UI (Only visible when not scanning) */}
      {!isScanningAR && (
        <motion.div 
          initial={{ opacity: 0 }} 
          animate={{ opacity: 1 }} 
          className="w-full h-full flex flex-col justify-between"
        >
          {/* Top Header */}
          <div className="w-full p-4 flex justify-between items-start pointer-events-auto">
             <button className="w-10 h-10 rounded-full bg-black/40 backdrop-blur-md border border-white/10 flex items-center justify-center text-white hover:bg-black/60 transition-colors">
                <Maximize size={18} />
             </button>
             
             {/* Hint Badge */}
             {!selectedId && (
               <div className="bg-black/50 backdrop-blur-md px-4 py-2 rounded-full border border-white/10 text-white text-xs font-medium animate-pulse shadow-lg">
                 Ketuk objek untuk info
               </div>
             )}
          </div>

          {/* Interactive Edu Panel (Glassmorphism) */}
          <AnimatePresence>
            {selectedElement && (
              <motion.div
                initial={{ y: 50, opacity: 0, scale: 0.95, x: '-50%' }}
                animate={{ y: 0, opacity: 1, scale: 1, x: '-50%' }}
                exit={{ y: 50, opacity: 0, scale: 0.95, x: '-50%' }}
                transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                className="absolute bottom-28 left-1/2 w-[90%] max-w-sm bg-white/10 backdrop-blur-xl border border-white/20 p-5 rounded-3xl shadow-2xl pointer-events-auto"
              >
                <button 
                  onClick={() => setSelectedId(null)}
                  className="absolute top-4 right-4 text-white/70 hover:text-white bg-black/20 rounded-full p-1 transition-colors"
                >
                  <X size={16} />
                </button>
                
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-pln-blue to-purple-600 flex items-center justify-center text-white shadow-lg shrink-0">
                    {getElementIcon(selectedElement.type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-white font-bold text-lg leading-tight truncate">{selectedElement.name}</h3>
                    <p className="text-white/60 text-xs capitalize">{selectedElement.type} Element</p>
                  </div>
                </div>
                
                <div className="text-white/80 text-sm leading-relaxed mb-4 max-h-32 overflow-y-auto custom-scrollbar">
                  {selectedElement.data?.description ? (
                    selectedElement.data.description
                  ) : (
                    <>
                      {selectedElement.type === '3d_model' && "Model 3D interaktif. Anda dapat menambahkan deskripsi kustom untuk objek ini melalui panel properti di sebelah kanan editor."}
                      {selectedElement.type === '3d_text' && `Konten Teks: "${selectedElement.data?.text || 'Teks kosong'}"`}
                      {selectedElement.type === 'video' && "Konten Video. Pengguna dapat memutar atau menjeda video ini langsung di dunia nyata."}
                      {selectedElement.type === 'audio' && "Efek Suara. Mendekat ke sumber suara untuk mendengarkan lebih jelas (Spatial Audio)."}
                      {['image', 'hotspot', '3d_shape', 'vfx_sparkles', 'group_folder', 'ui_button'].includes(selectedElement.type) && `Ini adalah elemen berjenis ${selectedElement.type.replace('3d_', '').replace('vfx_', '').replace('ui_', '')}. Anda bisa menambahkan deskripsi kustom di panel kanan editor.`}
                    </>
                  )}
                </div>
                
                <button className="w-full py-2.5 bg-white/20 hover:bg-white/30 text-white text-sm font-semibold rounded-xl transition-colors shadow-inner border border-white/10">
                  Lihat Detail Selengkapnya
                </button>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Bottom Action Bar */}
          <div className="w-full p-6 flex justify-center items-end pointer-events-none">
             <div className="pointer-events-auto bg-black/40 backdrop-blur-lg border border-white/10 rounded-full px-6 py-3 flex gap-8 items-center shadow-2xl">
                <button className="flex flex-col items-center gap-1 text-white/70 hover:text-white transition-colors">
                  <div className="w-1.5 h-1.5 rounded-full bg-transparent"></div>
                  <span className="text-[10px] font-bold">SCENES</span>
                </button>
                
                <button 
                  onClick={takeScreenshot}
                  className="w-14 h-14 rounded-full bg-white flex items-center justify-center shadow-[0_0_20px_rgba(255,255,255,0.4)] hover:scale-105 active:scale-95 transition-all text-black"
                >
                  <Camera size={24} className="fill-black" />
                </button>
                
                <button 
                  onClick={() => setShowList(!showList)}
                  className={`flex flex-col items-center gap-1 transition-colors ${showList ? 'text-pln-blue' : 'text-white/70 hover:text-white'}`}
                >
                  <div className={`w-1.5 h-1.5 rounded-full ${showList ? 'bg-pln-blue' : 'bg-transparent'}`}></div>
                  <span className="text-[10px] font-bold">OBJECTS</span>
                </button>
             </div>
          </div>
          
          {/* Objects List Side Panel */}
          <AnimatePresence>
            {showList && (
              <motion.div
                initial={{ x: '100%', opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                exit={{ x: '100%', opacity: 0 }}
                transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                className="absolute top-16 right-4 bottom-24 w-64 bg-black/60 backdrop-blur-xl border border-white/10 rounded-xl overflow-hidden flex flex-col pointer-events-auto shadow-2xl"
              >
                <div className="p-3 border-b border-white/10 bg-white/5 flex justify-between items-center">
                  <span className="text-white text-xs font-bold uppercase tracking-wider">Daftar Objek AR</span>
                  <button onClick={() => setShowList(false)} className="text-white/50 hover:text-white">
                    <X size={14} />
                  </button>
                </div>
                <div className="flex-1 overflow-y-auto p-2">
                  <div className="flex flex-col gap-1">
                    {validSceneElements.length === 0 && (
                      <div className="text-center text-white/50 text-sm mt-10">
                        Tidak ada objek di scene ini
                      </div>
                    )}
                    {validSceneElements.map(el => (
                    <button
                      key={el.id}
                      onClick={() => {
                        setSelectedId(el.id);
                        setShowList(false); // Auto close list when object is selected
                      }}
                      className={`w-full flex items-center gap-3 p-3 rounded-xl transition-all text-left ${selectedId === el.id ? 'bg-white/20 border border-white/30' : 'hover:bg-white/10 border border-transparent'}`}
                    >
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${selectedId === el.id ? 'bg-pln-blue text-white' : 'bg-black/40 text-white/70'}`}>
                        {getElementIcon(el.type)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className={`font-semibold text-sm truncate ${selectedId === el.id ? 'text-white' : 'text-white/80'}`}>{el.name}</div>
                        <div className="text-[10px] text-white/50 capitalize">{el.type}</div>
                      </div>
                    </button>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      )}
    </div>
  );
}
