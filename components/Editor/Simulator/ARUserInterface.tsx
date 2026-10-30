"use client";

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
  RotateCcw,
  ScanLine,
  Sparkles,
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
  const [markerLockedAnim, setMarkerLockedAnim] = useState(false);
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
    const lockTimer = window.setTimeout(() => {
      setMarkerLockedAnim(true);
      const finishTimer = window.setTimeout(() => {
        setIsScanningAR(false);
        setMarkerLockedAnim(false);
      }, 700);
      return () => window.clearTimeout(finishTimer);
    }, 1600);
    return () => window.clearTimeout(lockTimer);
  }, [isScanningAR, setIsScanningAR]);

  const triggerStepAnimation = React.useCallback(() => {
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

  useEffect(() => {
    const cancel = triggerStepAnimation();
    return () => cancel?.();
  }, [triggerStepAnimation]);

  useEffect(() => () => {
    voiceoverRef.current?.pause();
  }, []);

  const playVoiceover = () => {
    if (!activeStep?.voiceoverUrl) return;
    voiceoverRef.current?.pause();
    try {
      const audio = new Audio(activeStep.voiceoverUrl);
      voiceoverRef.current = audio;
      void audio.play();
    } catch (err) {
      console.warn('Audio play error:', err);
    }
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
      {/* DOCK & SHEET FOR EDU PANEL */}
      {eduPanel && (
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
                className="pointer-events-auto flex w-full max-w-sm items-center gap-3 rounded-2xl border border-white/15 bg-black/80 p-2.5 text-left text-white shadow-2xl backdrop-blur-xl hover:bg-black/90 transition-all"
              >
                <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-pln-blue text-white shadow-md">
                  <BookOpen size={21} />
                </span>
                <span className="min-w-0 flex-1">
                  <strong className="block truncate text-sm font-bold">{eduPanel.panelTitle || 'Panel Edukasi AR'}</strong>
                  <small className="text-[10px] text-white/55">A. Komponen • B. Maintenance • C. General</small>
                </span>
                <ChevronRight size={17} className="text-white/50" />
              </motion.button>
            ) : (
              <motion.section
                key="panel"
                initial={{ y: 40, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                exit={{ y: 40, opacity: 0 }}
                className="pointer-events-auto flex max-h-[68vh] w-full max-w-sm flex-col overflow-hidden rounded-3xl border border-white/15 bg-black/90 text-white shadow-2xl backdrop-blur-2xl"
              >
                <header className="flex items-center justify-between border-b border-white/10 px-4 py-3 bg-white/5">
                  <div className="flex min-w-0 items-center gap-2">
                    {activeView !== 'menu' && (
                      <button
                        type="button"
                        onClick={() => setActiveView('menu')}
                        className="text-white/60 hover:text-white p-1 rounded-lg hover:bg-white/10"
                      >
                        <ChevronLeft size={18} />
                      </button>
                    )}
                    <div className="min-w-0">
                      <span className="block text-[8px] font-black tracking-widest text-pln-blue uppercase">MODE BELAJAR AR</span>
                      <h2 className="truncate text-sm font-bold">{eduPanel.panelTitle || 'Panel Edukasi'}</h2>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setActiveView('closed')}
                    className="rounded-full bg-white/10 p-1.5 text-white/60 hover:text-white hover:bg-white/20 transition-colors"
                  >
                    <X size={15} />
                  </button>
                </header>

                <div className="overflow-y-auto p-4 custom-scrollbar">
                  {/* MAIN MENU */}
                  {activeView === 'menu' && (
                    <div className="space-y-3">
                      <button
                        type="button"
                        onClick={() => setActiveView('components')}
                        className="flex w-full items-center gap-3 rounded-2xl border border-white/10 bg-white/5 p-3.5 text-left hover:bg-white/10 transition-colors"
                      >
                        <span className="grid h-10 w-10 place-items-center rounded-xl bg-cyan-500/20 text-cyan-300">
                          <Cpu size={20} />
                        </span>
                        <div className="min-w-0 flex-1">
                          <strong className="block text-xs font-bold text-white">A. Informasi Komponen</strong>
                          <small className="text-[10px] text-white/50">Daftar komponen perangkat & penjelasan fungsinya</small>
                        </div>
                        <ChevronRight size={15} className="text-white/40" />
                      </button>

                      <button
                        type="button"
                        onClick={() => setActiveView('maintenance')}
                        className="flex w-full items-center gap-3 rounded-2xl border border-white/10 bg-white/5 p-3.5 text-left hover:bg-white/10 transition-colors"
                      >
                        <span className="grid h-10 w-10 place-items-center rounded-xl bg-amber-500/20 text-amber-300">
                          <Wrench size={20} />
                        </span>
                        <div className="min-w-0 flex-1">
                          <strong className="block text-xs font-bold text-white">B. Prosedur Maintenance</strong>
                          <small className="text-[10px] text-white/50">Langkah perawatan, bongkar-pasang & animasi</small>
                        </div>
                        <ChevronRight size={15} className="text-white/40" />
                      </button>

                      <button
                        type="button"
                        onClick={() => setActiveView('general')}
                        className="flex w-full items-center gap-3 rounded-2xl border border-white/10 bg-white/5 p-3.5 text-left hover:bg-white/10 transition-colors"
                      >
                        <span className="grid h-10 w-10 place-items-center rounded-xl bg-emerald-500/20 text-emerald-300">
                          <Info size={20} />
                        </span>
                        <div className="min-w-0 flex-1">
                          <strong className="block text-xs font-bold text-white">C. Informasi General</strong>
                          <small className="text-[10px] text-white/50">Penjelasan menyeluruh dan spesifikasi alat</small>
                        </div>
                        <ChevronRight size={15} className="text-white/40" />
                      </button>

                      {scenes.length > 1 && (
                        <div className="pt-2 border-t border-white/10">
                          <span className="text-[9px] font-bold text-white/50 block mb-1.5 uppercase tracking-wider">Pilih Scene:</span>
                          <div className="grid grid-cols-2 gap-2">
                            {scenes.map((scene) => (
                              <button
                                key={scene.id}
                                type="button"
                                onClick={() => setCurrentSceneId(scene.id)}
                                className={`rounded-xl border px-2.5 py-2 text-[9px] font-bold truncate ${
                                  scene.id === currentSceneId
                                    ? 'border-pln-blue bg-pln-blue/20 text-white'
                                    : 'border-white/10 bg-white/5 text-white/60 hover:text-white'
                                }`}
                              >
                                {scene.name}
                              </button>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* A. KOMPONEN */}
                  {activeView === 'components' && (
                    <div className="space-y-2.5">
                      {!(eduPanel.eduComponents || []).length && (
                        <div className="rounded-2xl border border-dashed border-white/15 p-6 text-center text-xs text-white/45">
                          Belum ada komponen yang ditambahkan di Edu Dashboard.
                        </div>
                      )}
                      {(eduPanel.eduComponents || []).map((component) => (
                        <button
                          key={component.id}
                          type="button"
                          onClick={() => activateComponent(component)}
                          className="w-full rounded-2xl border border-white/10 bg-white/5 p-3.5 text-left hover:bg-white/10 transition-colors space-y-1.5"
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <span className="grid h-8 w-8 place-items-center rounded-lg bg-cyan-500/20 text-cyan-300">
                                <Box size={16} />
                              </span>
                              <strong className="text-xs font-bold text-white">{component.name}</strong>
                            </div>
                            {component.actionAnimation && (
                              <span className="rounded-full bg-cyan-500/20 border border-cyan-400/30 px-2 py-0.5 text-[8px] font-bold text-cyan-300">
                                Animasi
                              </span>
                            )}
                          </div>
                          {component.description && (
                            <p className="text-[10px] leading-relaxed text-white/60 whitespace-pre-wrap pl-10">
                              {component.description}
                            </p>
                          )}
                        </button>
                      ))}
                    </div>
                  )}

                  {/* B. MAINTENANCE */}
                  {activeView === 'maintenance' && (
                    <div className="space-y-3">
                      {!modules.length && (
                        <div className="rounded-2xl border border-dashed border-white/15 p-6 text-center text-xs text-white/45">
                          Belum ada modul maintenance pada Edu Dashboard.
                        </div>
                      )}

                      {modules.length > 1 && (
                        <div className="grid grid-cols-2 gap-2">
                          {modules.map((maintenance, index) => (
                            <button
                              key={maintenance.id}
                              type="button"
                              onClick={() => selectModule(index)}
                              className={`rounded-xl border p-2 text-left transition-colors ${
                                index === currentARModuleIndex
                                  ? 'border-amber-400/60 bg-amber-400/20 text-white'
                                  : 'border-white/10 bg-white/5 text-white/60 hover:text-white'
                              }`}
                            >
                              <strong className="block truncate text-[10px] font-bold">{maintenance.title}</strong>
                              <small className="text-[8px] text-white/45">{maintenance.steps.length} langkah</small>
                            </button>
                          ))}
                        </div>
                      )}

                      {activeModule && (
                        <article className="overflow-hidden rounded-2xl border border-white/10 bg-white/5">
                          <div className="border-b border-white/10 bg-amber-400/10 px-3.5 py-2.5">
                            <span className="text-[8.5px] font-black uppercase tracking-widest text-amber-300">
                              {activeModule.title}
                            </span>
                            {activeModule.description && (
                              <p className="mt-1 text-[9px] text-white/60 leading-relaxed">{activeModule.description}</p>
                            )}
                          </div>

                          {activeStep ? (
                            <>
                              <div className="h-1.5 bg-white/5">
                                <div
                                  className="h-full bg-amber-400 transition-all duration-150"
                                  style={{ width: `${Math.round(arPlaybackProgress * 100)}%` }}
                                />
                              </div>
                              <div className="p-4 space-y-2">
                                <div className="flex items-center justify-between">
                                  <span className="text-[9px] font-bold text-amber-300">
                                    Langkah {currentARStepIndex + 1} dari {steps.length}
                                  </span>
                                  <span className="text-[9px] text-white/50">{Math.round(arPlaybackProgress * 100)}%</span>
                                </div>
                                <h3 className="text-sm font-bold text-white">{activeStep.title}</h3>
                                <p className="whitespace-pre-wrap text-[11px] leading-relaxed text-white/70">
                                  {activeStep.instruction}
                                </p>

                                <div className="flex gap-2 pt-2">
                                  <button
                                    type="button"
                                    onClick={triggerStepAnimation}
                                    className="flex-1 flex items-center justify-center gap-1.5 rounded-xl bg-white/10 hover:bg-white/15 px-3 py-2 text-[9px] font-bold text-white transition-colors"
                                  >
                                    <RotateCcw size={12} /> Ulangi Animasi
                                  </button>
                                  {activeStep.voiceoverUrl && (
                                    <button
                                      type="button"
                                      onClick={playVoiceover}
                                      className="flex-1 flex items-center justify-center gap-1.5 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 text-amber-200 px-3 py-2 text-[9px] font-bold transition-colors"
                                    >
                                      <Headphones size={12} /> Putar Narasi
                                    </button>
                                  )}
                                </div>
                              </div>

                              <div className="grid grid-cols-2 gap-2 bg-black/25 p-2.5 border-t border-white/5">
                                <button
                                  type="button"
                                  disabled={currentARStepIndex === 0}
                                  onClick={() => setCurrentARStepIndex(Math.max(0, currentARStepIndex - 1))}
                                  className="rounded-xl bg-white/10 hover:bg-white/15 py-2.5 text-[9.5px] font-bold text-white disabled:opacity-30 transition-colors"
                                >
                                  ← Sebelumnya
                                </button>
                                <button
                                  type="button"
                                  onClick={handleNext}
                                  className="rounded-xl bg-amber-400 hover:bg-amber-300 py-2.5 text-[9.5px] font-bold text-black transition-colors"
                                >
                                  {currentARStepIndex === steps.length - 1 ? 'Selesai ✓' : 'Berikutnya →'}
                                </button>
                              </div>
                            </>
                          ) : (
                            <div className="p-6 text-center text-xs text-white/45">
                              Prosedur ini belum memiliki langkah.
                            </div>
                          )}
                        </article>
                      )}
                    </div>
                  )}

                  {/* C. GENERAL */}
                  {activeView === 'general' && (
                    <div className="rounded-2xl border border-white/10 bg-white/5 p-4 space-y-2">
                      <div className="flex items-center gap-2 text-emerald-300">
                        <Info size={20} />
                        <h3 className="text-sm font-bold">{general.title}</h3>
                      </div>
                      <p className="whitespace-pre-wrap text-[11px] leading-relaxed text-white/70">
                        {general.description || 'Informasi general belum diisi pada Edu Dashboard.'}
                      </p>
                    </div>
                  )}
                </div>
              </motion.section>
            )}
          </AnimatePresence>
        </div>
      )}

      {/* FINISH BANNER */}
      <AnimatePresence>
        {showFinishBanner && (
          <motion.div
            initial={{ opacity: 0, y: -10, x: '-50%' }}
            animate={{ opacity: 1, y: 0, x: '-50%' }}
            exit={{ opacity: 0, x: '-50%' }}
            className="absolute left-1/2 top-10 rounded-2xl border border-emerald-400/40 bg-emerald-500/20 p-4 text-center text-white backdrop-blur-xl shadow-xl"
          >
            <CheckCircle2 size={32} className="mx-auto mb-1.5 text-emerald-300" />
            <strong className="text-sm block">Prosedur Maintenance Selesai!</strong>
            <p className="text-[10px] text-emerald-100/70 mt-0.5">Seluruh langkah telah diselesaikan dengan baik.</p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
