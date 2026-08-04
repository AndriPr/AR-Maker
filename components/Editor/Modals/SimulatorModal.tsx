import React, { useState } from 'react';
import { X, Play, Smartphone, Tablet, Monitor } from 'lucide-react';
import dynamic from 'next/dynamic';

import { DeviceFrame, DeviceType } from '../Simulator/DeviceFrame';
import { ARUserInterface } from '../Simulator/ARUserInterface';

const EditorViewport = dynamic(() => import('@/components/Editor/EditorViewport'), { ssr: false });

interface SimulatorModalProps {
  onClose: () => void;
}

export function SimulatorModal({ onClose }: SimulatorModalProps) {
  const [deviceType, setDeviceType] = useState<DeviceType>('mobile');

  return (
    <div className="fixed inset-0 bg-[#0a0a0c] z-[100] flex flex-col">
      {/* Simulator Header / Toolbar */}
      <div className="h-16 bg-[#1a1b1e] border-b border-[#2b2d31] flex items-center justify-between px-6 shrink-0 shadow-md">
        <div className="flex items-center gap-2">
          <h2 className="text-white font-bold flex items-center gap-2">
            <Play className="text-green-400" size={20} />
            AR Simulator <span className="text-xs text-pln-blue ml-1">v1.3</span>
          </h2>
        </div>
        
        {/* Device Selector */}
        <div className="flex items-center gap-1 bg-[#2b2d31] p-1 rounded-lg">
          <button 
            onClick={() => setDeviceType('mobile')}
            className={`p-2 rounded-md transition-colors ${deviceType === 'mobile' ? 'bg-pln-blue text-white shadow-sm' : 'text-gray-400 hover:text-white hover:bg-gray-700'}`}
            title="Mobile View"
          >
            <Smartphone size={18} />
          </button>
          <button 
            onClick={() => setDeviceType('tablet')}
            className={`p-2 rounded-md transition-colors ${deviceType === 'tablet' ? 'bg-pln-blue text-white shadow-sm' : 'text-gray-400 hover:text-white hover:bg-gray-700'}`}
            title="Tablet View"
          >
            <Tablet size={18} />
          </button>
          <button 
            onClick={() => setDeviceType('desktop')}
            className={`p-2 rounded-md transition-colors ${deviceType === 'desktop' ? 'bg-pln-blue text-white shadow-sm' : 'text-gray-400 hover:text-white hover:bg-gray-700'}`}
            title="Desktop Fullscreen"
          >
            <Monitor size={18} />
          </button>
        </div>

        <div className="flex items-center gap-4">
          <div className="text-xs text-gray-400 flex items-center gap-2 bg-[#0a0a0c] px-3 py-1.5 rounded-md border border-[#2b2d31]">
            <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
            Simulasi AR Aktif
          </div>
          <button 
            onClick={onClose} 
            className="bg-red-500/10 hover:bg-red-500/20 text-red-400 px-4 py-2 rounded-md text-sm font-bold transition-colors flex items-center border border-red-500/20"
          >
            <X size={16} className="mr-1" /> Tutup
          </button>
        </div>
      </div>
      
      {/* Simulator Content */}
      <div className="flex-1 w-full bg-gradient-to-b from-[#111] to-[#0a0a0c] relative overflow-hidden flex items-center justify-center">
        <DeviceFrame deviceType={deviceType}>
          <div className="w-full h-full relative">
            <EditorViewport simulateMode={true} />
            <ARUserInterface />
          </div>
        </DeviceFrame>
      </div>
    </div>
  );
}
