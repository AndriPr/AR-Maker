import React, { useEffect, useState } from 'react';
import { useEditorStore } from '@/lib/store';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight, CheckCircle2 } from 'lucide-react';

export function ARFloatingEduHUD() {
  const elements = useEditorStore(state => state.elements);
  const currentARStepIndex = useEditorStore(state => state.currentARStepIndex);
  const setCurrentARStepIndex = useEditorStore(state => state.setCurrentARStepIndex);
  const setTimelineTime = useEditorStore(state => state.setTimelineTime);
  const setTimelinePlaying = useEditorStore(state => state.setTimelinePlaying);
  const currentSceneId = useEditorStore(state => state.currentSceneId);

  const eduPanel = elements.find(el => el.type === 'edu_panel' && el.sceneId === currentSceneId);
  const modules = eduPanel?.eduMaintenanceTasks || [];
  
  const activeModule = modules.length > 0 ? modules[0] : null;
  const steps = activeModule?.steps || [];

  const [showFinishBanner, setShowFinishBanner] = useState(false);
  const playbackProgress = useEditorStore(state => state.arPlaybackProgress);
  const setPlaybackProgress = useEditorStore(state => state.setArPlaybackProgress);

  useEffect(() => {
    if (steps.length === 0) return;
    const currentStep = steps[currentARStepIndex];
    if (!currentStep) return;

    setPlaybackProgress(0);
    
    let start = performance.now();
    let frameId: number;
    const animate = (time: number) => {
      const elapsed = (time - start) / 1000;
      const progress = Math.min(elapsed / 2.0, 1.0);
      setPlaybackProgress(progress);
      if (progress < 1.0) {
        frameId = requestAnimationFrame(animate);
      }
    };
    frameId = requestAnimationFrame(animate);

    return () => cancelAnimationFrame(frameId);
  }, [currentARStepIndex, steps]);

  if (!eduPanel || steps.length === 0) return null;

  const activeStep = steps[currentARStepIndex];

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

  return (
    <div className="absolute top-4 left-1/2 -translate-x-1/2 w-[90%] max-w-sm pointer-events-auto z-50">
      <AnimatePresence mode="wait">
        {showFinishBanner ? (
          <motion.div
            key="finish"
            initial={{ opacity: 0, y: -20, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="bg-green-500/20 backdrop-blur-md border border-green-500/50 rounded-xl p-4 flex flex-col items-center justify-center text-center shadow-2xl"
          >
            <CheckCircle2 size={32} className="text-green-400 mb-2" />
            <h3 className="text-green-100 font-bold text-lg">Modul Selesai!</h3>
            <p className="text-green-200/80 text-xs">Anda telah menyelesaikan panduan {activeModule?.title}.</p>
          </motion.div>
        ) : (
          <motion.div
            key="step"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="bg-[#1a1b1e]/80 backdrop-blur-md border border-white/10 rounded-2xl overflow-hidden shadow-2xl"
          >
            <div className="bg-pln-blue/20 px-4 py-3 border-b border-white/5 flex items-center justify-between">
              <div>
                <span className="text-pln-blue text-[10px] font-bold uppercase tracking-wider">{activeModule?.title}</span>
                <h3 className="text-white font-bold text-sm leading-tight mt-0.5">Langkah {currentARStepIndex + 1} dari {steps.length}</h3>
              </div>
              
              <div className="relative w-8 h-8 flex items-center justify-center">
                <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
                  <path
                    className="text-white/10"
                    strokeDasharray="100, 100"
                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                    stroke="currentColor"
                    strokeWidth="3"
                    fill="none"
                  />
                  <path
                    className="text-pln-blue transition-all duration-300"
                    strokeDasharray="$($(playbackProgress * 100)), 100"
                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                    stroke="currentColor"
                    strokeWidth="3"
                    fill="none"
                  />
                </svg>
                <span className="absolute text-[8px] font-bold text-white">{Math.round(playbackProgress * 100)}%</span>
              </div>
            </div>

            <div className="p-4">
              <h4 className="text-white font-bold text-base mb-2">{activeStep?.title}</h4>
              <p className="text-gray-300 text-sm leading-relaxed">{activeStep?.instruction}</p>
            </div>

            <div className="p-2 bg-black/20 flex gap-2">
              <button 
                onClick={handlePrev}
                disabled={currentARStepIndex === 0}
                className="flex-1 py-3 bg-white/5 hover:bg-white/10 disabled:opacity-30 disabled:hover:bg-white/5 rounded-xl flex items-center justify-center text-white text-sm font-medium transition-colors"
              >
                <ChevronLeft size={16} className="mr-1" /> Prev
              </button>
              <button 
                onClick={handleNext}
                className="flex-1 py-3 bg-pln-blue hover:bg-pln-blue/90 rounded-xl flex items-center justify-center text-white text-sm font-bold shadow-lg transition-colors"
              >
                {currentARStepIndex === steps.length - 1 ? 'Selesai' : 'Next'} <ChevronRight size={16} className="ml-1" />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
