import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useEditorStore, type EduComponent } from '@/lib/store';
import { getEduGeneralInfo, resolveEduAnimationSource } from '@/lib/education';
import {
  BookOpen,
  Box,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Cpu,
  Headphones,
  Info,
  ScanLine,
  Wrench,
  X,
} from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';

type ActiveView = 'closed' | 'menu' | 'components' | 'maintenance' | 'general';

export function ARUserInterface() {
  const elements = useEditorStore((state) => state.elements);
  const currentSceneId = useEditorStore((state) => state.currentSceneId);
  const scenes = useEditorStore((state) => state.scenes);
  const setCurrentSceneId = useEditorStore((state) => state.setCurrentSceneId);
  const setSelectedId = useEditorStore((state) => state.setSelectedId);
  const updateElement = useEditorStore((state) => state.updateElement);
  const setPreviewAnimationData = useEditorStore((state) => state.setPreviewAnimationData);
  const isScanningAR = useEditorStore((state) => state.isScanningAR);
  const setIsScanningAR = useEditorStore((state) => state.setIsScanningAR);
  const currentARModuleIndex = useEditorStore((state) => state.currentARModuleIndex);
  const setCurrentARModuleIndex = useEditorStore((state) => state.setCurrentARModuleIndex);
  const currentARStepIndex = useEditorStore((state) => state.currentARStepIndex);
  const setCurrentARStepIndex = useEditorStore((state) => state.setCurrentARStepIndex);
  const arPlaybackProgress = useEditorStore((state) => state.arPlaybackProgress);
  const setArPlaybackProgress = useEditorStore((state) => state.setArPlaybackProgress);

  const [activeView, setActiveView] = useState<ActiveView>('closed');
  const [showFinishBanner, setShowFinishBanner] = useState(false);
  const voiceoverRef = useRef<HTMLAudioElement | null>(null);

  const eduPanel = useMemo(() => (
    elements.find((element) => element.type === 'edu_panel' && element.sceneId === currentSceneId) ||
    elements.find((element) => element.type === 'edu_panel')
  ), [elements, currentSceneId]);
  const modules = eduPanel?.eduMaintenanceTasks || [];
  const activeModule = modules[currentARModuleIndex] || modules[0] || null;
  const steps = activeModule?.steps || [];
  const activeStep = steps[currentARStepIndex] || null;
  const general = getEduGeneralInfo(eduPanel);

  useEffect(() => {
    if (!isScanningAR) return;
    const timer = window.setTimeout(() => setIsScanningAR(false), 1800);
    return () => window.clearTimeout(timer);
  }, [isScanningAR, setIsScanningAR]);

  useEffect(() => {
    if (!activeStep) return;
    setArPlaybackProgress(0);
    const source = resolveEduAnimationSource(activeStep);
    if (source === 'blender' && activeStep.actionTargetId && activeStep.actionAnimation) {
      setPreviewAnimationData({ targetId: activeStep.actionTargetId, animationName: activeStep.actionAnimation });
    }
    if (activeStep.showTargetId) updateElement(activeStep.showTargetId, { isHidden: false }, { skipHistory: true });
    if (activeStep.hideTargetId) updateElement(activeStep.hideTargetId, { isHidden: true }, { skipHistory: true });

    const startedAt = performance.now();
    let frameId = 0;
    const animate = (time: number) => {
      const progress = Math.min((time - startedAt) / 2000, 1);
      setArPlaybackProgress(progress);
      if (progress < 1) frameId = requestAnimationFrame(animate);
    };
    frameId = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(frameId);
  }, [activeStep, setArPlaybackProgress, setPreviewAnimationData, updateElement]);

  useEffect(() => () => {
    voiceoverRef.current?.pause();
  }, []);

  const playVoiceover = () => {
    if (!activeStep?.voiceoverUrl) return;
    voiceoverRef.current?.pause();
    const audio = new Audio(activeStep.voiceoverUrl);
    voiceoverRef.current = audio;
    void audio.play();
  };

  const activateComponent = (component: EduComponent) => {
    if (component.actionTargetId) {
      setSelectedId(component.actionTargetId);
      if (component.actionAnimation) {
        setPreviewAnimationData({ targetId: component.actionTargetId, animationName: component.actionAnimation });
      }
    }
    if (component.showTargetId) updateElement(component.showTargetId, { isHidden: false }, { skipHistory: true });
    if (component.hideTargetId) updateElement(component.hideTargetId, { isHidden: true }, { skipHistory: true });
  };

  const selectModule = (index: number) => {
    setCurrentARModuleIndex(index);
    setCurrentARStepIndex(0);
  };

  const handleNext = () => {
    if (currentARStepIndex < steps.length - 1) {
      setCurrentARStepIndex(currentARStepIndex + 1);
      return;
    }
    setShowFinishBanner(true);
    window.setTimeout(() => setShowFinishBanner(false), 2500);
  };

  return (
    <div className="absolute inset-0 z-[50] flex flex-col pointer-events-none">
      <AnimatePresence>
        {isScanningAR && (
          <motion.div
            initial={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 z-[100] flex flex-col items-center justify-center bg-black/60 backdrop-blur-sm pointer-events-auto"
          >
            <ScanLine size={60} className="mb-4 text-pln-blue animate-pulse" />
            <h3 className="text-lg font-bold text-white">Menyiapkan pengalaman AR</h3>
            <p className="mt-2 max-w-[80%] text-center text-xs text-gray-300">Arahkan kamera ke marker untuk membuka materi edukasi.</p>
          </motion.div>
        )}
      </AnimatePresence>

      {!isScanningAR && eduPanel && (
        <div className="absolute inset-x-0 bottom-4 flex justify-center px-4">
          <AnimatePresence mode="wait">
            {activeView === 'closed' ? (
              <motion.button
                key="dock"
                initial={{ y: 30, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                exit={{ y: 30, opacity: 0 }}
                type="button"
                onClick={() => setActiveView('menu')}
                className="pointer-events-auto flex w-full max-w-sm items-center gap-3 rounded-2xl border border-white/15 bg-black/75 p-2.5 text-left text-white shadow-2xl backdrop-blur-xl"
              >
                <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-pln-blue"><BookOpen size={21} /></span>
                <span className="min-w-0 flex-1"><strong className="block truncate text-sm">{eduPanel.panelTitle || 'Panel Edukasi'}</strong><small className="text-[10px] text-white/55">Komponen • Maintenance • Informasi general</small></span>
                <ChevronRight size={17} className="text-white/50" />
              </motion.button>
            ) : (
              <motion.section
                key="panel"
                initial={{ y: 40, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                exit={{ y: 40, opacity: 0 }}
                className="pointer-events-auto flex max-h-[65vh] w-full max-w-sm flex-col overflow-hidden rounded-3xl border border-white/15 bg-black/85 text-white shadow-2xl backdrop-blur-2xl"
              >
                <header className="flex items-center justify-between border-b border-white/10 px-4 py-3">
                  <div className="flex min-w-0 items-center gap-2">
                    {activeView !== 'menu' && <button type="button" onClick={() => setActiveView('menu')} className="text-white/60 hover:text-white"><ChevronLeft size={18} /></button>}
                    <div className="min-w-0"><span className="block text-[8px] font-black tracking-widest text-pln-blue">MODE BELAJAR AR</span><h2 className="truncate text-sm font-bold">{eduPanel.panelTitle || 'Panel Edukasi'}</h2></div>
                  </div>
                  <button type="button" onClick={() => setActiveView('closed')} className="rounded-full bg-white/5 p-1.5 text-white/60 hover:text-white"><X size={15} /></button>
                </header>

                <div className="overflow-y-auto p-4 custom-scrollbar">
                  {activeView === 'menu' && (
                    <div className="space-y-3">
                      <button type="button" onClick={() => setActiveView('components')} className="flex w-full items-center gap-3 rounded-2xl border border-white/10 bg-white/5 p-3 text-left hover:bg-white/10">
                        <span className="grid h-10 w-10 place-items-center rounded-xl bg-blue-500/15 text-blue-300"><Cpu size={20} /></span><span><strong className="block text-xs">Informasi Komponen</strong><small className="text-[10px] text-white/45">Fungsi dan detail bagian model</small></span>
                      </button>
                      <button type="button" onClick={() => setActiveView('maintenance')} className="flex w-full items-center gap-3 rounded-2xl border border-white/10 bg-white/5 p-3 text-left hover:bg-white/10">
                        <span className="grid h-10 w-10 place-items-center rounded-xl bg-amber-500/15 text-amber-300"><Wrench size={20} /></span><span><strong className="block text-xs">Maintenance</strong><small className="text-[10px] text-white/45">Jenis perawatan dan prosedur animasi</small></span>
                      </button>
                      <button type="button" onClick={() => setActiveView('general')} className="flex w-full items-center gap-3 rounded-2xl border border-white/10 bg-white/5 p-3 text-left hover:bg-white/10">
                        <span className="grid h-10 w-10 place-items-center rounded-xl bg-emerald-500/15 text-emerald-300"><Info size={20} /></span><span><strong className="block text-xs">Informasi General</strong><small className="text-[10px] text-white/45">Penjelasan umum objek</small></span>
                      </button>
                      {scenes.length > 1 && <div className="grid grid-cols-2 gap-2 pt-1">{scenes.map((scene) => <button key={scene.id} type="button" onClick={() => setCurrentSceneId(scene.id)} className={`rounded-xl border px-2 py-2 text-[9px] font-bold ${scene.id === currentSceneId ? 'border-pln-blue bg-pln-blue/15 text-white' : 'border-white/10 bg-white/5 text-white/55'}`}>{scene.name}</button>)}</div>}
                    </div>
                  )}

                  {activeView === 'general' && (
                    <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                      <Info size={24} className="mb-3 text-emerald-300" />
                      <h3 className="text-base font-bold">{general.title}</h3>
                      <p className="mt-2 whitespace-pre-wrap text-xs leading-relaxed text-white/65">{general.description || 'Informasi general belum diisi pada Edu Dashboard.'}</p>
                    </div>
                  )}

                  {activeView === 'components' && (
                    <div className="space-y-2">
                      {!(eduPanel.eduComponents || []).length && <div className="rounded-2xl border border-dashed border-white/15 p-5 text-center text-xs text-white/45">Belum ada informasi komponen.</div>}
                      {(eduPanel.eduComponents || []).map((component) => (
                        <button key={component.id} type="button" onClick={() => activateComponent(component)} className="w-full rounded-2xl border border-white/10 bg-white/5 p-3 text-left hover:bg-white/10">
                          <div className="flex items-center gap-2"><span className="grid h-8 w-8 place-items-center rounded-lg bg-blue-500/15 text-blue-300"><Box size={16} /></span><strong className="text-xs">{component.name}</strong></div>
                          <p className="mt-2 text-[10px] leading-relaxed text-white/55">{component.description || 'Deskripsi komponen belum diisi.'}</p>
                          {component.actionAnimation && <span className="mt-2 inline-flex rounded-full bg-pln-blue/15 px-2 py-1 text-[8px] font-bold text-pln-blue">Ketuk untuk animasi</span>}
                        </button>
                      ))}
                    </div>
                  )}

                  {activeView === 'maintenance' && (
                    <div className="space-y-3">
                      {!modules.length && <div className="rounded-2xl border border-dashed border-white/15 p-5 text-center text-xs text-white/45">Belum ada jenis maintenance.</div>}
                      {modules.length > 1 && <div className="grid grid-cols-2 gap-2">{modules.map((maintenance, index) => <button key={maintenance.id} type="button" onClick={() => selectModule(index)} className={`rounded-xl border p-2 text-left ${index === currentARModuleIndex ? 'border-amber-400/60 bg-amber-400/15' : 'border-white/10 bg-white/5'}`}><strong className="block truncate text-[10px]">{maintenance.title}</strong><small className="text-[8px] text-white/45">{maintenance.steps.length} langkah</small></button>)}</div>}
                      {activeModule && (
                        <article className="overflow-hidden rounded-2xl border border-white/10 bg-white/5">
                          <div className="border-b border-white/10 bg-amber-400/10 px-3 py-2.5">
                            <span className="text-[8px] font-black uppercase tracking-widest text-amber-300">{activeModule.title}</span>
                            {activeModule.description && <p className="mt-1 text-[9px] text-white/50">{activeModule.description}</p>}
                          </div>
                          {activeStep ? (
                            <>
                              <div className="h-1 bg-white/5"><div className="h-full bg-pln-blue transition-all" style={{ width: `${Math.round(arPlaybackProgress * 100)}%` }} /></div>
                              <div className="p-4"><span className="text-[9px] font-bold text-pln-blue">Langkah {currentARStepIndex + 1} dari {steps.length}</span><h3 className="mt-1 text-sm font-bold">{activeStep.title}</h3><p className="mt-2 whitespace-pre-wrap text-[11px] leading-relaxed text-white/65">{activeStep.instruction}</p>{activeStep.voiceoverUrl && <button type="button" onClick={playVoiceover} className="mt-3 flex items-center gap-1.5 rounded-lg bg-white/10 px-3 py-2 text-[9px] font-bold"><Headphones size={12} /> Putar narasi</button>}</div>
                              <div className="grid grid-cols-2 gap-2 bg-black/15 p-2"><button type="button" disabled={currentARStepIndex === 0} onClick={() => setCurrentARStepIndex(Math.max(0, currentARStepIndex - 1))} className="rounded-lg bg-white/5 py-2 text-[9px] font-bold disabled:opacity-30">← Sebelumnya</button><button type="button" onClick={handleNext} className="rounded-lg bg-pln-blue py-2 text-[9px] font-bold">{currentARStepIndex === steps.length - 1 ? 'Selesai' : 'Berikutnya →'}</button></div>
                            </>
                          ) : <div className="p-4 text-center text-xs text-white/45">Jenis maintenance ini belum memiliki langkah.</div>}
                        </article>
                      )}
                    </div>
                  )}
                </div>
              </motion.section>
            )}
          </AnimatePresence>
        </div>
      )}

      <AnimatePresence>
        {showFinishBanner && (
          <motion.div initial={{ opacity: 0, y: -10, x: '-50%' }} animate={{ opacity: 1, y: 0, x: '-50%' }} exit={{ opacity: 0, x: '-50%' }} className="absolute left-1/2 top-10 rounded-2xl border border-green-400/40 bg-green-500/20 p-4 text-center text-white backdrop-blur-xl">
            <CheckCircle2 size={28} className="mx-auto mb-1 text-green-300" /><strong className="text-sm">Prosedur selesai</strong>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
