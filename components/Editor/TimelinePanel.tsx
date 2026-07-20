"use client";

import React, { useState, useEffect } from 'react';
import { Play, Pause, Plus, Clock, Circle } from 'lucide-react';
import { useEditorStore } from '@/lib/store';

// --- ENTERPRISE KEYFRAME NODE ---
function KeyframeNode({ elementId, kf, duration, onUpdate, onRemove }: any) {
  const [isDragging, setIsDragging] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [menuPos, setMenuPos] = useState({ x: 0, y: 0 });

  const handlePointerDown = (e: React.PointerEvent) => {
    e.stopPropagation();
    if (e.button === 2) {
       // Right click Context Menu
       e.preventDefault();
       setShowMenu(true);
       setMenuPos({ x: e.clientX, y: e.clientY });
       return;
    }
    
    setIsDragging(true);
    e.currentTarget.setPointerCapture(e.pointerId);
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!isDragging) return;
    const parentRect = e.currentTarget.parentElement?.getBoundingClientRect();
    if (!parentRect) return;
    
    const x = e.clientX - parentRect.left;
    let newTime = (x / parentRect.width) * duration;
    newTime = Math.max(0, Math.min(duration, newTime));
    newTime = parseFloat(newTime.toFixed(1)); // snap to 0.1s
    
    if (newTime !== kf.time) {
      onUpdate(kf.time, { ...kf, time: newTime });
    }
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    if (isDragging) {
      setIsDragging(false);
      e.currentTarget.releasePointerCapture(e.pointerId);
    }
  };

  // Close context menu on global click
  useEffect(() => {
    const close = () => setShowMenu(false);
    if (showMenu) document.addEventListener('click', close);
    return () => document.removeEventListener('click', close);
  }, [showMenu]);

  return (
    <>
      <div 
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onContextMenu={(e) => e.preventDefault()}
        className={`absolute top-1/2 -translate-y-1/2 w-3 h-3 rotate-45 cursor-grab active:cursor-grabbing hover:scale-150 transition-transform ${kf.easing && kf.easing !== 'linear' ? 'bg-purple-500' : 'bg-orange-500'}`}
        style={{ left: `${(kf.time / duration) * 100}%`, zIndex: isDragging ? 50 : 10 }}
        title={`Keyframe at ${kf.time}s (${kf.easing || 'linear'})`}
      ></div>

      {showMenu && (
        <div className="fixed z-[99999] bg-[#1a1b1e] border border-[#36393f] rounded shadow-2xl w-32 py-1 text-xs" style={{ left: menuPos.x, top: menuPos.y - 150 }}>
          <div className="px-2 py-1 text-[10px] text-gray-500 font-bold uppercase border-b border-[#2b2d31]">Easing Type</div>
          {['linear', 'ease-in', 'ease-out', 'ease-in-out', 'bounce'].map(ease => (
             <button 
               key={ease} 
               className="w-full text-left px-3 py-1.5 text-gray-300 hover:bg-pln-blue/20 hover:text-pln-blue flex justify-between"
               onClick={() => { onUpdate(kf.time, { ...kf, easing: ease }); setShowMenu(false); }}
             >
               {ease}
               {kf.easing === ease || (!kf.easing && ease === 'linear') ? <span className="text-pln-blue text-[10px]">✔</span> : null}
             </button>
          ))}
          <div className="border-t border-[#36393f] mt-1 pt-1">
             <button 
               className="w-full text-left px-3 py-1.5 text-red-400 hover:bg-red-500/20"
               onClick={() => { onRemove(kf.time); setShowMenu(false); }}
             >
               Delete Keyframe
             </button>
          </div>
        </div>
      )}
    </>
  );
}

export default function TimelinePanel() {
  const elements = useEditorStore(state => state.elements);
  const selectedId = useEditorStore(state => state.selectedId);
  const updateElement = useEditorStore(state => state.updateElement);
  const timelineTime = useEditorStore(state => state.timelineTime);
  const setTimelineTime = useEditorStore(state => state.setTimelineTime);
  const timelinePlaying = useEditorStore(state => state.timelinePlaying);
  const setTimelinePlaying = useEditorStore(state => state.setTimelinePlaying);
  const isAutoKeying = useEditorStore(state => state.isAutoKeying);
  const setIsAutoKeying = useEditorStore(state => state.setIsAutoKeying);

  const [duration, setDuration] = useState(10); // 10 seconds default

  const selectedElement = elements.find(el => el.id === selectedId);

  useEffect(() => {
    let interval: any;
    if (timelinePlaying) {
      interval = setInterval(() => {
        const prev = useEditorStore.getState().timelineTime;
        if (prev >= duration) {
          setTimelinePlaying(false);
          setTimelineTime(0);
        } else {
          setTimelineTime(prev + 0.1);
        }
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

  const removeKeyframe = (elementId: string, time: number) => {
    const el = elements.find(e => e.id === elementId);
    if (!el || !el.keyframes) return;
    const updatedKeyframes = el.keyframes.filter(kf => kf.time !== time);
    updateElement(elementId, { keyframes: updatedKeyframes });
  };

  const updateKeyframe = (elementId: string, oldTime: number, newKeyframe: any) => {
    const el = elements.find(e => e.id === elementId);
    if (!el || !el.keyframes) return;
    
    // Replace the old keyframe with the new one
    const updatedKeyframes = el.keyframes.map(kf => 
      kf.time === oldTime ? newKeyframe : kf
    ).sort((a, b) => a.time - b.time);
    
    // Remove duplicates if dragging on top of another keyframe (unless it's the exact same one)
    const uniqueKeyframes = updatedKeyframes.filter((kf, index, self) => 
      index === self.findIndex((k) => k.time === kf.time)
    );
    
    updateElement(elementId, { keyframes: uniqueKeyframes });
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
        <button 
          onClick={() => setIsAutoKeying(!isAutoKeying)}
          className={`flex items-center gap-1 px-2 py-1 text-[10px] font-bold border rounded transition-colors ${isAutoKeying ? 'bg-red-500/20 text-red-500 border-red-500/50 animate-pulse' : 'text-gray-400 border-gray-600 hover:bg-[#36393f]'}`}
          title="Auto-Key (Record Mode)"
        >
          <Circle size={10} fill={isAutoKeying ? 'currentColor' : 'none'} /> REC
        </button>
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
            <div key={`header-${el.id}`}>
              <div 
                className={`h-8 border-b border-[#2b2d31] flex items-center px-2 text-[10px] cursor-pointer hover:bg-[#2b2d31]/50 ${selectedId === el.id ? 'bg-[#2b2d31] text-white font-bold' : 'text-gray-400'}`}
                onClick={() => updateElement(el.id, { isTimelineExpanded: !el.isTimelineExpanded })}
              >
                <div className="mr-1 w-3 text-center">{el.isTimelineExpanded ? '▼' : '▶'}</div>
                <div className="w-2 h-2 rounded-full mr-2" style={{ backgroundColor: el.keyframes?.length ? '#f59e0b' : '#36393f' }}></div>
                <span className="truncate">{el.name}</span>
              </div>
              {el.isTimelineExpanded && (
                <div className="bg-[#151618]">
                  <div className="h-6 border-b border-[#2b2d31]/50 flex items-center px-8 text-[9px] text-red-400/80">Position</div>
                  <div className="h-6 border-b border-[#2b2d31]/50 flex items-center px-8 text-[9px] text-green-400/80">Rotation</div>
                  <div className="h-6 border-b border-[#2b2d31]/50 flex items-center px-8 text-[9px] text-blue-400/80">Scale</div>
                </div>
              )}
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
            <div className="relative w-full" style={{ paddingTop: '1.25rem' }}>
              {elements.map((el) => (
                <div key={`track-${el.id}`}>
                  {/* Main Summary Track */}
                  <div className="relative h-8 border-b border-[#2b2d31]">
                    {el.keyframes?.map(kf => (
                      <KeyframeNode 
                        key={`kf-${el.id}-${kf.time}`} 
                        elementId={el.id} 
                        kf={kf} 
                        duration={duration} 
                        onUpdate={(oldTime: number, newKf: any) => updateKeyframe(el.id, oldTime, newKf)}
                        onRemove={(time: number) => removeKeyframe(el.id, time)}
                      />
                    ))}
                  </div>
                  
                  {/* Expanded Sub-tracks */}
                  {el.isTimelineExpanded && (
                    <div className="bg-[#151618]">
                      {/* Position Track */}
                      <div className="relative h-6 border-b border-[#2b2d31]/50">
                        {el.keyframes?.filter(k => k.position).map(kf => (
                          <KeyframeNode 
                            key={`kf-pos-${el.id}-${kf.time}`} 
                            elementId={el.id} 
                            kf={kf} 
                            duration={duration} 
                            onUpdate={(oldTime: number, newKf: any) => updateKeyframe(el.id, oldTime, newKf)}
                            onRemove={(time: number) => removeKeyframe(el.id, time)}
                          />
                        ))}
                      </div>
                      {/* Rotation Track */}
                      <div className="relative h-6 border-b border-[#2b2d31]/50">
                        {el.keyframes?.filter(k => k.rotation).map(kf => (
                          <KeyframeNode 
                            key={`kf-rot-${el.id}-${kf.time}`} 
                            elementId={el.id} 
                            kf={kf} 
                            duration={duration} 
                            onUpdate={(oldTime: number, newKf: any) => updateKeyframe(el.id, oldTime, newKf)}
                            onRemove={(time: number) => removeKeyframe(el.id, time)}
                          />
                        ))}
                      </div>
                      {/* Scale Track */}
                      <div className="relative h-6 border-b border-[#2b2d31]/50">
                        {el.keyframes?.filter(k => k.scale).map(kf => (
                          <KeyframeNode 
                            key={`kf-scl-${el.id}-${kf.time}`} 
                            elementId={el.id} 
                            kf={kf} 
                            duration={duration} 
                            onUpdate={(oldTime: number, newKf: any) => updateKeyframe(el.id, oldTime, newKf)}
                            onRemove={(time: number) => removeKeyframe(el.id, time)}
                          />
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
