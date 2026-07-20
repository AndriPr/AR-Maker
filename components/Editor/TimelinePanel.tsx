"use client";

import React, { useState, useEffect } from 'react';
import { Play, Pause, Plus, Trash2, Clock } from 'lucide-react';
import { useEditorStore } from '@/lib/store';

export default function TimelinePanel() {
  const elements = useEditorStore(state => state.elements);
  const selectedId = useEditorStore(state => state.selectedId);
  const updateElement = useEditorStore(state => state.updateElement);
  const timelineTime = useEditorStore(state => state.timelineTime);
  const setTimelineTime = useEditorStore(state => state.setTimelineTime);
  const timelinePlaying = useEditorStore(state => state.timelinePlaying);
  const setTimelinePlaying = useEditorStore(state => state.setTimelinePlaying);

  const [duration, setDuration] = useState(10); // 10 seconds default

  const selectedElement = elements.find(el => el.id === selectedId);

  // Playback loop
  useEffect(() => {
    let interval: any;
    if (timelinePlaying) {
      interval = setInterval(() => {
        setTimelineTime((prev) => {
          if (prev >= duration) {
            setTimelinePlaying(false);
            return 0;
          }
          return prev + 0.1;
        });
      }, 100);
    }
    return () => clearInterval(interval);
  }, [timelinePlaying, duration, setTimelineTime, setTimelinePlaying]);

  const addKeyframe = () => {
    if (!selectedElement) return;

    const currentKeyframes = selectedElement.keyframes || [];
    
    // Check if keyframe already exists at this time (allow 0.1s tolerance)
    const existingIndex = currentKeyframes.findIndex(kf => Math.abs(kf.time - timelineTime) < 0.05);
    
    const newKeyframe = {
      time: parseFloat(timelineTime.toFixed(1)),
      position: [...selectedElement.position] as [number, number, number],
      rotation: [...selectedElement.rotation] as [number, number, number],
      scale: [...selectedElement.scale] as [number, number, number],
    };

    let updatedKeyframes;
    if (existingIndex >= 0) {
      updatedKeyframes = [...currentKeyframes];
      updatedKeyframes[existingIndex] = newKeyframe;
    } else {
      updatedKeyframes = [...currentKeyframes, newKeyframe].sort((a, b) => a.time - b.time);
    }

    updateElement(selectedElement.id, { keyframes: updatedKeyframes });
  };

  const removeKeyframe = (time: number) => {
    if (!selectedElement || !selectedElement.keyframes) return;
    const updatedKeyframes = selectedElement.keyframes.filter(kf => kf.time !== time);
    updateElement(selectedElement.id, { keyframes: updatedKeyframes });
  };

  return (
    <div className="absolute bottom-0 left-0 right-0 h-48 bg-[#1a1b1e] border-t border-[#2b2d31] flex flex-col z-30 shadow-[0_-10px_20px_rgba(0,0,0,0.3)]">
      {/* Header / Controls */}
      <div className="h-10 bg-[#202227] border-b border-[#2b2d31] flex items-center px-4 gap-4">
        <button 
          onClick={() => setTimelinePlaying(!timelinePlaying)}
          className={`p-1.5 rounded-md ${timelinePlaying ? 'bg-red-500 text-white' : 'bg-pln-blue text-white'} hover:opacity-80 transition-opacity`}
        >
          {timelinePlaying ? <Pause size={14} /> : <Play size={14} />}
        </button>
        <div className="text-white text-xs font-mono w-16 text-center bg-[#1a1b1e] px-2 py-1 rounded border border-[#36393f]">
          {timelineTime.toFixed(1)}s
        </div>
        <div className="w-px h-4 bg-[#36393f]"></div>
        <button 
          onClick={addKeyframe}
          disabled={!selectedElement}
          className="flex items-center gap-1 px-2 py-1 text-[10px] font-bold text-orange-400 border border-orange-400/30 rounded hover:bg-orange-400/10 disabled:opacity-50 transition-colors"
        >
          <Plus size={12} /> ADD KEYFRAME
        </button>
        
        <div className="flex-1"></div>
        <div className="flex items-center gap-2 text-[10px] text-gray-400">
          <Clock size={12} />
          <span>Duration: </span>
          <input 
            type="number" 
            value={duration} 
            onChange={(e) => setDuration(Number(e.target.value) || 10)} 
            className="w-12 bg-[#1a1b1e] border border-[#36393f] rounded px-1 py-0.5 text-white"
          />
          <span>s</span>
        </div>
      </div>
      
      {/* Timeline Tracks */}
      <div className="flex-1 flex overflow-hidden">
        {/* Track Headers */}
        <div className="w-48 bg-[#1a1b1e] border-r border-[#2b2d31] overflow-y-auto">
          {elements.map(el => (
            <div 
              key={`header-${el.id}`} 
              className={`h-8 border-b border-[#2b2d31] flex items-center px-2 text-[10px] ${selectedId === el.id ? 'bg-[#2b2d31] text-white font-bold' : 'text-gray-400'}`}
            >
              <div className="w-2 h-2 rounded-full mr-2" style={{ backgroundColor: el.keyframes?.length ? '#f59e0b' : '#36393f' }}></div>
              <span className="truncate">{el.name}</span>
            </div>
          ))}
        </div>
        
        {/* Track Grid */}
        <div className="flex-1 bg-[#1e1e1e] relative overflow-x-auto overflow-y-auto custom-scrollbar">
          {/* Time Scrubber Background */}
          <div className="absolute top-0 bottom-0 border-l-2 border-red-500 z-10 pointer-events-none" style={{ left: `${(timelineTime / duration) * 100}%` }}>
            <div className="w-2 h-2 bg-red-500 rounded-full -translate-x-1/2 -translate-y-1/2"></div>
          </div>
          
          <div className="relative w-full min-w-[800px] h-full" onClick={(e) => {
            const rect = e.currentTarget.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const percentage = Math.max(0, Math.min(1, x / rect.width));
            setTimelineTime(percentage * duration);
          }}>
            {/* Grid lines */}
            {Array.from({ length: duration + 1 }).map((_, i) => (
              <div key={`grid-${i}`} className="absolute top-0 bottom-0 border-l border-[#36393f]/50 pointer-events-none" style={{ left: `${(i / duration) * 100}%` }}>
                <span className="absolute top-0 -translate-x-1/2 text-[8px] text-gray-600 bg-[#1e1e1e] px-1">{i}s</span>
              </div>
            ))}
            
            {/* Tracks */}
            {elements.map((el, index) => (
              <div key={`track-${el.id}`} className="absolute left-0 right-0 h-8 border-b border-[#2b2d31]" style={{ top: `${index * 2}rem` }}>
                {el.keyframes?.map(kf => (
                  <div 
                    key={`kf-${el.id}-${kf.time}`}
                    onClick={(e) => { e.stopPropagation(); removeKeyframe(kf.time); }}
                    className="absolute top-1/2 -translate-y-1/2 w-2 h-2 rotate-45 bg-orange-500 cursor-pointer hover:scale-150 transition-transform"
                    style={{ left: `${(kf.time / duration) * 100}%` }}
                    title={`Delete Keyframe at ${kf.time}s`}
                  ></div>
                ))}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
