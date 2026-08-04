import React, { useEffect, useState } from 'react';
import { useEditorStore } from '@/lib/store';
import { Camera, Maximize, X, Info, ScanLine, Type, Image as ImageIcon, Box, Video, Music, List, GraduationCap, ChevronLeft, ChevronRight, CheckCircle2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export function ARUserInterface() {
  const selectedId = useEditorStore(state => state.selectedId);
  const elements = useEditorStore(state => state.elements);
  const setSelectedId = useEditorStore(state => state.setSelectedId);
  const isScanningAR = useEditorStore(state => state.isScanningAR);
  const setIsScanningAR = useEditorStore(state => state.setIsScanningAR);
  const [flash, setFlash] = useState(false);
  const currentSceneId = useEditorStore(state => state.currentSceneId);
  
  const currentARStepIndex = useEditorStore(state => state.currentARStepIndex);
  const setCurrentARStepIndex = useEditorStore(state => state.setCurrentARStepIndex);
  const arPlaybackProgress = useEditorStore(state => state.arPlaybackProgress);
  const setArPlaybackProgress = useEditorStore(state => state.setArPlaybackProgress);
  const [showBottomPanel, setShowBottomPanel] = useState(false);
  const [showFinishBanner, setShowFinishBanner] = useState(false);

  const selectedElement = selectedId ? elements.find(el => el.id === selectedId) : undefined;

  // Filter out orphaned (ghost) elements
  const validElements = elements.filter(el => {
    if (!el.parentId) return true;
    let currentParent = el.parentId;
    while (currentParent) {
      const parent = elements.find(p => p.id === currentParent);
      if (!parent) return false;
      currentParent = parent.parentId;
    }
    return true;
  });
  const validSceneElements = validElements.filter(el => el.sceneId === (currentSceneId || ''));

  const eduPanel = elements.find(el => el.type === 'edu_panel' && el.sceneId === currentSceneId);
  const modules = (eduPanel as any)?.eduMaintenanceTasks || [];
  const activeModule = modules.length > 0 ? modules[0] : null;
  const steps = activeModule?.steps || [];
  const activeStep = steps[currentARStepIndex];

  useEffect(() => {
    if (steps.length === 0) return;
    const currentStep = steps[currentARStepIndex];
    if (!currentStep) return;

    setArPlaybackProgress(0);
    
    let start = performance.now();
    let frameId: number;
    const animate = (time: number) => {
      const elapsed = (time - start) / 1000;
      const progress = Math.min(elapsed / 2.0, 1.0);
      setArPlaybackProgress(progress);
      if (progress < 1.0) {
        frameId = requestAnimationFrame(animate);
      }
    };
    frameId = requestAnimationFrame(animate);

    return () => cancelAnimationFrame(frameId);
  }, [currentARStepIndex, steps, setArPlaybackProgress]);

  const handleNext = () => {
    if (currentARStepIndex < steps.length - 1) {
      setCurrentARStepIndex(currentARStepIndex + 1);
    } else {
      setShowFinishBanner(true);
      setTimeout(() => setShowFinishBanner(false), 3000);
    }
  };

  const handlePrev = () => {
    if (currentARStepIndex > 0) {
      setCurrentARStepIndex(currentARStepIndex - 1);
    }
  };

  useEffect(() => {
    if (isScanningAR) {
      const timer = setTimeout(() => {
        setIsScanningAR(false);
      }, 3000); // 3 seconds scanning phase
      return () => clearTimeout(timer);
    }
  }, [isScanningAR, setIsScanningAR]);

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
    <>
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
                  {(selectedElement as any).data?.description ? (
                    (selectedElement as any).data.description
                  ) : (
                    <>
                      {selectedElement.type === '3d_model' && "Model 3D interaktif. Anda dapat menambahkan deskripsi kustom untuk objek ini melalui panel properti di sebelah kanan editor."}
                      {selectedElement.type === '3d_text' && `Konten Teks: "${(selectedElement as any).data?.text || 'Teks kosong'}"`}
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

          {/* Bottom Action Bar (Unified Panel) */}
          <div className="w-full p-4 flex justify-center items-end pointer-events-none absolute bottom-4">
            <AnimatePresence mode="wait">
              {showBottomPanel ? (
                <motion.div
                  key="panel"
                  initial={{ y: 50, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  exit={{ y: 50, opacity: 0 }}
                  transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                  className="pointer-events-auto w-full max-w-sm bg-black/80 backdrop-blur-xl border border-white/10 rounded-3xl overflow-hidden shadow-2xl flex flex-col"
                >
                  <div className="flex justify-between items-center p-4 border-b border-white/10 bg-white/5">
                    <div className="flex items-center gap-2">
                      <GraduationCap size={18} className="text-pln-blue" />
                      <span className="text-white font-bold">Menu Pembelajaran AR</span>
                    </div>
                    <button onClick={() => setShowBottomPanel(false)} className="text-white/50 hover:text-white bg-white/5 hover:bg-white/10 p-1.5 rounded-full transition-colors">
                      <X size={16} />
                    </button>
                  </div>

                  <div className="flex flex-col p-4 max-h-[50vh] overflow-y-auto custom-scrollbar gap-6">
                    {/* Edu Dashboard Section */}
                    <div className="flex flex-col gap-3">
                      <h4 className="text-white/70 text-xs font-bold uppercase tracking-wider">Modul Aktif</h4>
                      {!eduPanel || steps.length === 0 ? (
                        <div className="bg-white/5 rounded-xl p-4 text-center text-white/50 text-xs">
                          Belum ada modul edukasi yang ditambahkan pada scene ini.
                        </div>
                      ) : (
                        <div className="bg-white/5 border border-white/10 rounded-xl overflow-hidden">
                          <div className="bg-pln-blue/20 px-3 py-2 border-b border-white/5 flex items-center justify-between">
                            <div>
                              <span className="text-pln-blue text-[9px] font-bold uppercase tracking-wider">{activeModule?.title}</span>
                              <h3 className="text-white font-bold text-xs leading-tight mt-0.5">Langkah {currentARStepIndex + 1} dari {steps.length}</h3>
                            </div>
                            
                            <div className="relative w-6 h-6 flex items-center justify-center">
                              <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
                                <path className="text-white/10" strokeDasharray="100, 100" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" stroke="currentColor" strokeWidth="3" fill="none" />
                                <path className="text-pln-blue transition-all duration-300" strokeDasharray={`\${arPlaybackProgress * 100}, 100`} d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" stroke="currentColor" strokeWidth="3" fill="none" />
                              </svg>
                              <span className="absolute text-[6px] font-bold text-white">{Math.round(arPlaybackProgress * 100)}%</span>
                            </div>
                          </div>

                          <div className="p-3">
                            <h4 className="text-white font-bold text-sm mb-1">{activeStep?.title}</h4>
                            <p className="text-gray-300 text-xs leading-relaxed">{activeStep?.instruction}</p>
                          </div>

                          <div className="p-2 bg-black/20 flex gap-2">
                            <button onClick={handlePrev} disabled={currentARStepIndex === 0} className="flex-1 py-2 bg-white/5 hover:bg-white/10 disabled:opacity-30 disabled:hover:bg-white/5 rounded-lg flex items-center justify-center text-white text-xs font-medium transition-colors">
                              <ChevronLeft size={14} className="mr-1" /> Prev
                            </button>
                            <button onClick={handleNext} className="flex-1 py-2 bg-pln-blue hover:bg-pln-blue/90 rounded-lg flex items-center justify-center text-white text-xs font-bold shadow-lg transition-colors">
                              {currentARStepIndex === steps.length - 1 ? 'Selesai' : 'Next'} <ChevronRight size={14} className="ml-1" />
                            </button>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Objects List Section */}
                    <div className="flex flex-col gap-3">
                      <h4 className="text-white/70 text-xs font-bold uppercase tracking-wider">Daftar Objek</h4>
                      <div className="flex flex-col gap-2">
                        {validSceneElements.length === 0 && (
                          <div className="text-center text-white/50 text-xs py-4">
                            Tidak ada objek di scene ini
                          </div>
                        )}
                        {validSceneElements.map(el => (
                          <button
                            key={el.id}
                            onClick={() => {
                              setSelectedId(el.id);
                              setShowBottomPanel(false);
                            }}
                            className={`w-full flex items-center gap-3 p-2.5 rounded-xl transition-all text-left \${selectedId === el.id ? 'bg-white/20 border border-white/30' : 'bg-white/5 hover:bg-white/10 border border-transparent'}`}
                          >
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 \${selectedId === el.id ? 'bg-pln-blue text-white' : 'bg-black/40 text-white/70'}`}>
                              {getElementIcon(el.type)}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className={`font-semibold text-xs truncate \${selectedId === el.id ? 'text-white' : 'text-white/80'}`}>{el.name}</div>
                              <div className="text-[9px] text-white/50 capitalize">{el.type}</div>
                            </div>
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                </motion.div>
              ) : (
                <motion.div 
                  key="pill"
                  initial={{ y: 50, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  exit={{ y: 50, opacity: 0 }}
                  className="pointer-events-auto bg-black/60 backdrop-blur-xl border border-white/10 rounded-full p-2 flex gap-4 items-center shadow-2xl"
                >
                  <button className="flex flex-col items-center justify-center w-12 h-12 rounded-full hover:bg-white/10 text-white/70 hover:text-white transition-colors">
                    <span className="text-[8px] font-bold tracking-wider">SCENES</span>
                  </button>
                  
                  <button 
                    onClick={() => setShowBottomPanel(true)}
                    className="w-16 h-16 rounded-full bg-pln-blue flex items-center justify-center shadow-[0_0_20px_rgba(0,162,233,0.4)] hover:scale-105 active:scale-95 transition-all text-white border-2 border-white/20"
                  >
                    <GraduationCap size={28} />
                  </button>
                  
                  <button 
                    onClick={() => setShowBottomPanel(true)}
                    className="flex flex-col items-center justify-center w-12 h-12 rounded-full hover:bg-white/10 text-white/70 hover:text-white transition-colors"
                  >
                    <span className="text-[8px] font-bold tracking-wider">OBJECTS</span>
                  </button>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Finish Banner Toast */}
            <AnimatePresence>
              {showFinishBanner && (
                <motion.div
                  initial={{ opacity: 0, y: -20, scale: 0.9, x: '-50%' }}
                  animate={{ opacity: 1, y: 0, scale: 1, x: '-50%' }}
                  exit={{ opacity: 0, scale: 0.9, x: '-50%' }}
                  className="absolute top-10 left-1/2 bg-green-500/20 backdrop-blur-md border border-green-500/50 rounded-xl p-4 flex flex-col items-center justify-center text-center shadow-2xl"
                >
                  <CheckCircle2 size={32} className="text-green-400 mb-2" />
                  <h3 className="text-green-100 font-bold text-lg">Modul Selesai!</h3>
                  <p className="text-green-200/80 text-xs">Anda telah menyelesaikan panduan ini.</p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </motion.div>
      )}
      </div>
    </>
  );
}
