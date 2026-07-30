"use client";

import React, { useRef, useEffect, useState } from 'react';
import { useEditorStore } from '@/lib/store';
import { Maximize2, Minimize2, Move } from 'lucide-react';

export function GraphEditorPanel({ onClose }: { onClose: () => void }) {
  const elements = useEditorStore(state => state.elements);
  const selectedId = useEditorStore(state => state.selectedId);
  const timelineTime = useEditorStore(state => state.timelineTime);
  const setTimelineTime = useEditorStore(state => state.setTimelineTime);
  const duration = 10; // Match timeline duration for now

  const selectedElement = elements.find(el => el.id === selectedId);
  
  const svgRef = useRef<SVGSVGElement>(null);
  
  const [viewBox, setViewBox] = useState({ x: 0, y: -5, w: duration, h: 10 });
  const [isPanning, setIsPanning] = useState(false);
  const [panStart, setPanStart] = useState({ x: 0, y: 0 });

  // Handle panning
  const handlePointerDown = (e: React.PointerEvent) => {
    if (e.button === 1 || e.button === 2 || e.altKey) { // Middle click, Right click, or Alt+Left
      setIsPanning(true);
      setPanStart({ x: e.clientX, y: e.clientY });
      e.currentTarget.setPointerCapture(e.pointerId);
    }
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (isPanning && svgRef.current) {
      const dx = e.clientX - panStart.x;
      const dy = e.clientY - panStart.y;
      
      const svgRect = svgRef.current.getBoundingClientRect();
      const scaleX = viewBox.w / svgRect.width;
      const scaleY = viewBox.h / svgRect.height;
      
      setViewBox(prev => ({
        ...prev,
        x: prev.x - dx * scaleX,
        y: prev.y - dy * scaleY
      }));
      setPanStart({ x: e.clientX, y: e.clientY });
    }
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    setIsPanning(false);
    e.currentTarget.releasePointerCapture(e.pointerId);
  };
  
  const handleWheel = (e: React.WheelEvent) => {
    const zoomFactor = e.deltaY > 0 ? 1.1 : 0.9;
    setViewBox(prev => ({
      ...prev,
      w: prev.w * zoomFactor,
      h: prev.h * zoomFactor,
      x: prev.x + (prev.w - prev.w * zoomFactor) / 2,
      y: prev.y + (prev.h - prev.h * zoomFactor) / 2
    }));
  };

  if (!selectedElement) {
    return (
      <div className="flex-1 bg-[#1a1b1e] flex items-center justify-center text-gray-500 text-xs h-full">
        Pilih objek untuk melihat kurva animasi.
      </div>
    );
  }

  const kfs = selectedElement.keyframes?.filter(k => k.position) || [];
  kfs.sort((a, b) => a.time - b.time);

  // Generate SVG path for a property array index (0=x, 1=y, 2=z)
  const generatePath = (axisIndex: 0|1|2) => {
    if (kfs.length === 0) return '';
    let path = `M ${kfs[0].time} ${-kfs[0].position![axisIndex]}`;
    
    for (let i = 1; i < kfs.length; i++) {
      const prev = kfs[i-1];
      const curr = kfs[i];
      
      const x1 = prev.time;
      const y1 = -prev.position![axisIndex];
      const x2 = curr.time;
      const y2 = -curr.position![axisIndex];
      
      // Simple cubic bezier interpolation approximation (Ease-In-Out)
      if (prev.easing === 'linear') {
        path += ` L ${x2} ${y2}`;
      } else {
        const cp1x = x1 + (x2 - x1) * 0.33;
        const cp1y = y1;
        const cp2x = x2 - (x2 - x1) * 0.33;
        const cp2y = y2;
        path += ` C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${x2} ${y2}`;
      }
    }
    return path;
  };

  return (
    <div className="absolute top-0 left-0 right-0 h-1/2 bg-[#151618] border-b border-[#2b2d31] z-40 flex flex-col shadow-2xl">
      <div className="h-8 bg-[#202227] border-b border-[#2b2d31] flex items-center px-4 justify-between">
        <div className="flex items-center gap-2">
          <Move size={12} className="text-gray-400" />
          <span className="text-[10px] font-bold text-gray-300 uppercase tracking-wider">Graph Editor (Position)</span>
        </div>
        <div className="flex gap-2">
          <button onClick={() => setViewBox({ x: 0, y: -5, w: duration, h: 10 })} className="text-[10px] text-pln-blue hover:text-blue-300 bg-pln-blue/10 px-2 py-0.5 rounded">Home</button>
          <button onClick={onClose} className="text-gray-400 hover:text-white"><Minimize2 size={12} /></button>
        </div>
      </div>
      
      <div className="flex-1 relative overflow-hidden" 
           onWheel={handleWheel}
           onPointerDown={handlePointerDown}
           onPointerMove={handlePointerMove}
           onPointerUp={handlePointerUp}
           onContextMenu={e => e.preventDefault()}
      >
        <svg 
          ref={svgRef}
          className="w-full h-full cursor-crosshair" 
          viewBox={`${viewBox.x} ${viewBox.y} ${viewBox.w} ${viewBox.h}`}
          preserveAspectRatio="none"
        >
          {/* Grid */}
          <line x1={0} y1={0} x2={duration} y2={0} stroke="#36393f" strokeWidth={viewBox.h * 0.005} />
          {Array.from({length: duration + 1}).map((_, i) => (
            <line key={`v-${i}`} x1={i} y1={-100} x2={i} y2={100} stroke="#36393f" strokeWidth={viewBox.w * 0.002} />
          ))}

          {/* Time Scrubber */}
          <line x1={timelineTime} y1={-100} x2={timelineTime} y2={100} stroke="#ef4444" strokeWidth={viewBox.w * 0.003} />

          {/* Curves */}
          <path d={generatePath(0)} fill="none" stroke="#ef4444" strokeWidth={viewBox.h * 0.015} />
          <path d={generatePath(1)} fill="none" stroke="#22c55e" strokeWidth={viewBox.h * 0.015} />
          <path d={generatePath(2)} fill="none" stroke="#3b82f6" strokeWidth={viewBox.h * 0.015} />

          {/* Keyframe Dots */}
          {kfs.map((kf, i) => (
            <g key={`dots-${kf.time}`}>
              <circle cx={kf.time} cy={-kf.position![0]} r={viewBox.h * 0.03} fill="#ef4444" />
              <circle cx={kf.time} cy={-kf.position![1]} r={viewBox.h * 0.03} fill="#22c55e" />
              <circle cx={kf.time} cy={-kf.position![2]} r={viewBox.h * 0.03} fill="#3b82f6" />
            </g>
          ))}
        </svg>
        
        {/* Legend */}
        <div className="absolute top-2 left-2 bg-[#1a1b1e]/80 border border-[#2b2d31] rounded p-1 text-[9px] font-mono flex flex-col gap-1 pointer-events-none">
          <div className="flex items-center gap-1"><div className="w-2 h-2 bg-red-500 rounded-full"></div> Pos X</div>
          <div className="flex items-center gap-1"><div className="w-2 h-2 bg-green-500 rounded-full"></div> Pos Y</div>
          <div className="flex items-center gap-1"><div className="w-2 h-2 bg-blue-500 rounded-full"></div> Pos Z</div>
        </div>
        <div className="absolute bottom-2 right-2 text-[9px] text-gray-500 pointer-events-none bg-[#1a1b1e]/50 px-1 rounded">
          M-Click/Alt+Drag to Pan | Scroll to Zoom
        </div>
      </div>
    </div>
  );
}
