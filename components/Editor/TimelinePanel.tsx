"use client";

import React, { useState, useEffect, useRef } from 'react';
import { Play, Pause, Plus, Clock, Circle, SkipBack, SkipForward, ScanLine, Activity } from 'lucide-react';
import { useEditorStore } from '@/lib/store';
import { GraphEditorPanel } from './Panels/GraphEditorPanel';

// --- ENTERPRISE KEYFRAME NODE ---
function KeyframeNode({ elementId, kf, duration, onUpdate, onRemove, isSelected, onSelect }: any) {
  const [isDragging, setIsDragging] = useState(false);
  const [localTime, setLocalTime] = useState<number | null>(null);
  const [showMenu, setShowMenu] = useState(false);
  const [menuPos, setMenuPos] = useState({ x: 0, y: 0 });

  const displayTime = localTime !== null ? localTime : kf.time;

  const handlePointerDown = (e: React.PointerEvent) => {
    e.stopPropagation();
    if (e.button === 2) {
       e.preventDefault();
       setShowMenu(true);
       setMenuPos({ x: e.clientX, y: e.clientY });
       return;
    }
    
    setIsDragging(true);
    setLocalTime(kf.time);
    if (onSelect) onSelect(e.shiftKey);
    e.currentTarget.setPointerCapture(e.pointerId);
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!isDragging) return;
    const parentRect = e.currentTarget.parentElement?.getBoundingClientRect();
    if (!parentRect) return;
    
    const x = e.clientX - parentRect.left;
    let newTime = (x / parentRect.width) * duration;
    newTime = Math.max(0, Math.min(duration, newTime));
    
    // Blender-like snapping: Hold Ctrl to snap to grid (0.1s)
    if (e.ctrlKey) {
      newTime = parseFloat(newTime.toFixed(1));
    }
    
    setLocalTime(newTime);
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    if (isDragging) {
      setIsDragging(false);
      e.currentTarget.releasePointerCapture(e.pointerId);
      if (localTime !== null && localTime !== kf.time) {
        onUpdate(kf.time, { ...kf, time: localTime });
      }
      setLocalTime(null);
    }
  };

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
        className={`absolute top-1/2 -translate-y-1/2 w-2.5 h-2.5 rotate-45 cursor-grab active:cursor-grabbing transition-transform ${isDragging ? 'scale-150' : 'hover:scale-150'} ${isSelected ? 'bg-yellow-400 shadow-[0_0_8px_rgba(250,204,21,0.8)]' : 'bg-gray-300'} border border-[#1a1b1e]`}
        style={{ left: `${(displayTime / duration) * 100}%`, zIndex: isDragging || isSelected ? 50 : 10 }}
        title={`Keyframe at ${displayTime.toFixed(2)}s (${kf.easing || 'linear'})`}
      >
        {isDragging && (
          <div className="absolute -top-6 -left-4 bg-gray-800 text-white text-[9px] px-1 py-0.5 rounded -rotate-45 whitespace-nowrap shadow-lg border border-gray-600">
            {displayTime.toFixed(2)}s
          </div>
        )}
      </div>

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

function TimelineTimeDisplay() {
  const timelineTime = useEditorStore(state => state.timelineTime);
  return (
    <div className="text-white text-xs font-mono w-16 text-center bg-[#1a1b1e] px-2 py-1 rounded border border-[#36393f] mx-2">
      {timelineTime.toFixed(1)}s
    </div>
  );
}

function TimelineScrubber({ duration }: { duration: number }) {
  const timelineTime = useEditorStore(state => state.timelineTime);
  return (
    <div className="absolute top-0 bottom-0 border-l-2 border-blue-500 z-30 pointer-events-none" style={{ left: `${(timelineTime / duration) * 100}%` }}>
      <div className="w-3 h-3 bg-blue-500 rounded-sm sticky top-1 -translate-x-1/2 shadow-lg shadow-blue-500/50"></div>
    </div>
  );
}

export default function TimelinePanel() {
  const leftPanelRef = useRef<HTMLDivElement>(null);
  const elements = useEditorStore(state => state.elements);
  const selectedId = useEditorStore(state => state.selectedId);
  const updateElement = useEditorStore(state => state.updateElement);
  const setTimelineTime = useEditorStore(state => state.setTimelineTime);
  const timelinePlaying = useEditorStore(state => state.timelinePlaying);
  const setTimelinePlaying = useEditorStore(state => state.setTimelinePlaying);
  const isAutoKeying = useEditorStore(state => state.isAutoKeying);
  const setIsAutoKeying = useEditorStore(state => state.setIsAutoKeying);
  const addKeyframe = useEditorStore(state => state.addKeyframe);

  const [duration, setDuration] = useState(10); // 10 seconds default
  const [panelHeight, setPanelHeight] = useState(192); // 48rem * 4 = 192px default
  const [showGraphEditor, setShowGraphEditor] = useState(false);
  const playbackRange = useEditorStore(state => state.playbackRange);
  const setPlaybackRange = useEditorStore(state => state.setPlaybackRange);
  const selectedKeyframes = useEditorStore(state => state.selectedKeyframes);
  const setSelectedKeyframes = useEditorStore(state => state.setSelectedKeyframes);
  
  const selectedElement = elements.find(el => el.id === selectedId);

  // Global Keyboard Shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore if typing in an input
      if (['INPUT', 'TEXTAREA', 'SELECT'].includes((e.target as HTMLElement).tagName)) return;
      
      const state = useEditorStore.getState();
      
      if (e.code === 'Space') {
        e.preventDefault();
        setTimelinePlaying(!state.timelinePlaying);
      } else if (e.key.toLowerCase() === 'i') {
        e.preventDefault();
        addKeyframe();
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault();
        if (e.shiftKey) {
           setTimelineTime(0);
        } else {
           const selEl = state.selectedId ? state.elements.find(el => el.id === state.selectedId) : null;
           if (selEl && selEl.keyframes && selEl.keyframes.length > 0) {
             const times = selEl.keyframes.map(k => k.time).sort((a,b)=>a-b);
             const prev = times.reverse().find(t => t < state.timelineTime - 0.01);
             if (prev !== undefined) setTimelineTime(prev);
             else setTimelineTime(Math.max(0, state.timelineTime - 0.1));
           } else {
             setTimelineTime(Math.max(0, state.timelineTime - 0.1));
           }
        }
      } else if (e.key === 'ArrowRight') {
        e.preventDefault();
        if (e.shiftKey) {
           setTimelineTime(duration);
        } else {
           const selEl = state.selectedId ? state.elements.find(el => el.id === state.selectedId) : null;
           if (selEl && selEl.keyframes && selEl.keyframes.length > 0) {
             const times = selEl.keyframes.map(k => k.time).sort((a,b)=>a-b);
             const next = times.find(t => t > state.timelineTime + 0.01);
             if (next !== undefined) setTimelineTime(next);
             else setTimelineTime(Math.min(duration, state.timelineTime + 0.1));
           } else {
             setTimelineTime(Math.min(duration, state.timelineTime + 0.1));
           }
        }
      } else if (e.key === 'ArrowUp' || e.key === 'ArrowDown') {
        e.preventDefault();
        // Jump to next/prev keyframe
        if (!selectedId) return;
        const targetElement = elements.find(el => el.id === selectedId);
        if (!targetElement || !targetElement.keyframes) return;
        
        const times = targetElement.keyframes.map((k: any) => k.time).sort((a: any, b: any) => a - b);
        if (times.length === 0) return;
        
        if (e.key === 'ArrowUp') {
           // Previous keyframe
           const prevTimes = times.filter((t: any) => t < state.timelineTime - 0.05);
           if (prevTimes.length > 0) {
              setTimelineTime(prevTimes[prevTimes.length - 1]);
           }
        } else {
           // Next keyframe
           const nextTimes = times.filter((t: any) => t > state.timelineTime + 0.05);
           if (nextTimes.length > 0) {
              setTimelineTime(nextTimes[0]);
           }
        }
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedId, elements, duration, setTimelinePlaying, setTimelineTime]); // Need dependencies for addKeyframe and navigation to work correctly

  // Panel Resize Logic
  const [isResizing, setIsResizing] = useState(false);
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isResizing) return;
      const newHeight = window.innerHeight - e.clientY;
      setPanelHeight(Math.max(100, Math.min(newHeight, window.innerHeight * 0.8)));
    };
    const handleMouseUp = () => setIsResizing(false);
    
    if (isResizing) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
    }
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isResizing]);

  useEffect(() => {
    let animationFrameId: number;
    let lastTime = performance.now();

    const loop = (currentTime: number) => {
      const state = useEditorStore.getState();
      if (!state.timelinePlaying) return;

      const delta = (currentTime - lastTime) / 1000; // convert to seconds
      lastTime = currentTime;

      const direction = state.playbackDirection || 1;
      const range = state.playbackRange;
      const prev = state.timelineTime;
      const nextTime = prev + (delta * direction);

      if (range) {
        if (direction === 1 && nextTime >= range[1]) {
           setTimelineTime(range[1]);
           setTimelinePlaying(false);
           return;
        } else if (direction === -1 && nextTime <= range[0]) {
           setTimelineTime(range[0]);
           setTimelinePlaying(false);
           return;
        }
      } else {
        if (direction === 1 && nextTime >= duration) {
          if (state.timelineLooping) {
            setTimelineTime(0);
            animationFrameId = requestAnimationFrame(loop);
            return;
          } else {
            setTimelineTime(duration);
            setTimelinePlaying(false);
            return;
          }
        } else if (direction === -1 && nextTime <= 0) {
          setTimelineTime(0);
          setTimelinePlaying(false);
          return;
        }
      }

      setTimelineTime(nextTime);
      animationFrameId = requestAnimationFrame(loop);
    };

    if (timelinePlaying) {
      lastTime = performance.now();
      animationFrameId = requestAnimationFrame(loop);
    }

    return () => cancelAnimationFrame(animationFrameId);
  }, [timelinePlaying, duration, setTimelineTime, setTimelinePlaying]);



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
    <div className="absolute bottom-0 left-0 right-0 bg-[#1a1b1e] border-t border-[#2b2d31] flex flex-col z-30 shadow-[0_-10px_20px_rgba(0,0,0,0.3)]" style={{ height: panelHeight }}>
      {/* Drag Handle to Resize */}
      <div 
        className="absolute top-0 left-0 right-0 h-1 cursor-ns-resize z-50 hover:bg-pln-blue/50"
        onMouseDown={() => setIsResizing(true)}
      ></div>
      
      {/* Header / Controls */}
      <div className="h-10 bg-[#202227] border-b border-[#2b2d31] flex items-center px-4 gap-2">
        <button 
          onClick={() => setTimelineTime(playbackRange ? playbackRange[0] : 0)}
          className="p-1.5 rounded-md text-gray-400 hover:bg-[#36393f] transition-colors"
          title="Jump to Start"
        >
          <SkipBack size={14} />
        </button>
        <button 
          onClick={() => setTimelinePlaying(!timelinePlaying)}
          className={`p-1.5 rounded-md ${timelinePlaying ? 'bg-red-500 text-white' : 'bg-pln-blue text-white'} hover:opacity-80 transition-opacity`}
        >
          {timelinePlaying ? <Pause size={14} /> : <Play size={14} />}
        </button>
        <button 
          onClick={() => setTimelineTime(playbackRange ? playbackRange[1] : duration)}
          className="p-1.5 rounded-md text-gray-400 hover:bg-[#36393f] transition-colors"
          title="Jump to End"
        >
          <SkipForward size={14} />
        </button>
        <TimelineTimeDisplay />
        
        {/* Auto-keying Button (Blender style) */}
        <div className="w-px h-4 bg-gray-700 mx-1"></div>
        <button 
          onClick={() => setIsAutoKeying(!isAutoKeying)}
          className={`p-1.5 rounded-full transition-colors ml-1 ${isAutoKeying ? 'bg-red-500/20 text-red-500 ring-1 ring-red-500' : 'text-gray-400 hover:bg-[#36393f]'}`}
          title="Auto Keying: Record transforms automatically"
        >
          <Circle size={14} fill={isAutoKeying ? "currentColor" : "none"} />
        </button>

        <div className="flex-1"></div>

        <button 
          onClick={() => addKeyframe()}
          disabled={!selectedId}
          className={`px-3 py-1.5 rounded-md text-xs font-medium flex items-center gap-1.5 ${!selectedId ? 'bg-gray-800 text-gray-600 cursor-not-allowed' : 'bg-gray-700 text-gray-200 hover:bg-gray-600 transition-colors border border-gray-600'}`}
          title="Insert Keyframe (I)"
        >
          <Plus size={12} />
          Keyframe (I)
        </button>
          
          {selectedKeyframes && selectedKeyframes.length > 0 && (
            <button 
              onClick={() => {
                selectedKeyframes.forEach(kf => removeKeyframe(kf.elementId, kf.time));
                setSelectedKeyframes([]);
              }}
              className="px-3 py-1.5 ml-2 rounded-md text-xs font-medium bg-red-900/30 text-red-400 hover:bg-red-800/40 transition-colors border border-red-800/50"
              title="Delete Selected Keyframes"
            >
              Hapus Keyframe
            </button>
          )}
        
        <button 
          onClick={() => setPlaybackRange(playbackRange ? null : [0, duration])}
          className={`ml-2 flex items-center gap-1 px-2 py-1 text-[10px] font-bold border rounded transition-colors ${playbackRange ? 'bg-pln-blue/20 text-pln-blue border-pln-blue/50' : 'text-gray-400 border-gray-600 hover:bg-[#36393f]'}`}
          title="Toggle Playback Range"
        >
          <ScanLine size={10} /> RANGE
        </button>

        <button 
          onClick={() => setShowGraphEditor(!showGraphEditor)}
          className={`ml-2 flex items-center gap-1 px-2 py-1 text-[10px] font-bold border rounded transition-colors ${showGraphEditor ? 'bg-purple-500/20 text-purple-400 border-purple-500/50' : 'text-gray-400 border-gray-600 hover:bg-[#36393f]'}`}
          title="Toggle Graph Editor"
        >
          <Activity size={10} /> GRAPH EDITOR
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
      
      {/* Graph Editor Overlay */}
      {showGraphEditor && (
        <GraphEditorPanel onClose={() => setShowGraphEditor(false)} />
      )}
      
      {/* Timeline Tracks */}
        <div className="flex-1 flex overflow-hidden relative">
          {/* Track Headers */}
          <div ref={leftPanelRef} className="w-48 shrink-0 bg-[#1a1b1e] border-r border-[#2b2d31] overflow-hidden">
            <div className="sticky top-0 h-5 bg-[#1a1b1e]/90 border-b border-[#36393f] z-30 backdrop-blur-sm"></div>
            {elements.map(el => (
            <div key={`header-${el.id}`}>
              <div 
                className={`group h-8 border-b border-[#2b2d31] flex items-center px-2 text-[10px] cursor-pointer hover:bg-[#2b2d31]/50 ${selectedId === el.id ? 'bg-[#2b2d31] text-white font-bold' : 'text-gray-400'}`}
                onClick={() => updateElement(el.id, { isTimelineExpanded: !el.isTimelineExpanded })}
              >
                <div className="mr-1 w-3 text-center">{el.isTimelineExpanded ? '▼' : '▶'}</div>
                <div className="w-2 h-2 rounded-full mr-2" style={{ backgroundColor: el.keyframes?.length ? '#f59e0b' : '#36393f' }}></div>
                <span className="flex-1 truncate">{el.name}</span>
                <button 
                  onClick={(e) => { e.stopPropagation(); addKeyframe(el.id); }}
                  className="w-5 h-5 flex items-center justify-center text-gray-500 hover:text-orange-400 opacity-0 group-hover:opacity-100 transition-opacity"
                  title="Add Keyframe (K)"
                >
                  ♦
                </button>
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
        <div 
          className="flex-1 bg-[#1e1e1e] relative overflow-auto custom-scrollbar"
          onScroll={(e) => {
            if (leftPanelRef.current) {
              leftPanelRef.current.scrollTop = e.currentTarget.scrollTop;
            }
          }}
        >
          <div className="relative w-full min-w-[800px] min-h-max select-none">
            {/* Ruler for Scrubbing */}
            <div 
              className="sticky top-0 left-0 right-0 h-5 bg-[#1a1b1e]/90 border-b border-[#36393f] z-40 cursor-ew-resize select-none backdrop-blur-sm"
              onPointerDown={(e) => {
                const rect = e.currentTarget.getBoundingClientRect();
                const updateTime = (evt: React.PointerEvent | PointerEvent) => {
                  const x = evt.clientX - rect.left;
                  const percentage = Math.max(0, Math.min(1, x / rect.width));
                  setTimelineTime(percentage * duration);
                };
                updateTime(e);
                
                const onMove = (evt: PointerEvent) => updateTime(evt);
                const onUp = () => {
                  window.removeEventListener('pointermove', onMove);
                  window.removeEventListener('pointerup', onUp);
                };
                window.addEventListener('pointermove', onMove);
                window.addEventListener('pointerup', onUp);
              }}
            >
              {Array.from({ length: duration + 1 }).map((_, i) => (
                <div key={`tick-${i}`} className="absolute top-0 bottom-0 border-l border-[#36393f]" style={{ left: `${(i / duration) * 100}%` }}>
                  <span className="absolute top-0 left-1 text-[8px] text-gray-400 font-mono">{i}s</span>
                </div>
              ))}
            </div>

            {/* Time Scrubber Background */}
            <TimelineScrubber duration={duration} />

            {/* Playback Range Overlay */}
            {playbackRange && (
              <div 
                className="absolute top-0 bottom-0 bg-pln-blue/10 border-x border-pln-blue z-10 pointer-events-none"
                style={{ 
                  left: `${(playbackRange[0] / duration) * 100}%`,
                  width: `${((playbackRange[1] - playbackRange[0]) / duration) * 100}%`
                }}
              ></div>
            )}
            
            {/* Grid lines */}
            {Array.from({ length: duration + 1 }).map((_, i) => (
              <div key={`grid-${i}`} className="absolute top-0 bottom-0 border-l border-[#36393f]/30 pointer-events-none" style={{ left: `${(i / duration) * 100}%` }}></div>
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
                        isSelected={selectedKeyframes?.some((sk: any) => sk.elementId === el.id && sk.time === kf.time)}
                        onSelect={(shift: boolean) => {
                          if (shift) {
                            const isAlreadySelected = selectedKeyframes?.some((sk: any) => sk.elementId === el.id && sk.time === kf.time);
                            if (isAlreadySelected) {
                              setSelectedKeyframes(selectedKeyframes?.filter((sk: any) => !(sk.elementId === el.id && sk.time === kf.time)) || []);
                            } else {
                              setSelectedKeyframes([...(selectedKeyframes || []), { elementId: el.id, time: kf.time }]);
                            }
                          } else {
                            setSelectedKeyframes([{ elementId: el.id, time: kf.time }]);
                          }
                        }}
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
                            isSelected={selectedKeyframes?.some((sk: any) => sk.elementId === el.id && sk.time === kf.time)}
                            onSelect={(shift: boolean) => {
                              if (shift) {
                                setSelectedKeyframes([...(selectedKeyframes || []), { elementId: el.id, time: kf.time }]);
                              } else {
                                setSelectedKeyframes([{ elementId: el.id, time: kf.time }]);
                              }
                            }}
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
                            isSelected={selectedKeyframes?.some((sk: any) => sk.elementId === el.id && sk.time === kf.time)}
                            onSelect={(shift: boolean) => {
                              if (shift) {
                                setSelectedKeyframes([...(selectedKeyframes || []), { elementId: el.id, time: kf.time }]);
                              } else {
                                setSelectedKeyframes([{ elementId: el.id, time: kf.time }]);
                              }
                            }}
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
                            isSelected={selectedKeyframes?.some((sk: any) => sk.elementId === el.id && sk.time === kf.time)}
                            onSelect={(shift: boolean) => {
                              if (shift) {
                                setSelectedKeyframes([...(selectedKeyframes || []), { elementId: el.id, time: kf.time }]);
                              } else {
                                setSelectedKeyframes([{ elementId: el.id, time: kf.time }]);
                              }
                            }}
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
