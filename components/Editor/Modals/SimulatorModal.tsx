import { X, Play } from 'lucide-react';
import dynamic from 'next/dynamic';

const EditorViewport = dynamic(() => import('@/components/Editor/EditorViewport'), { ssr: false });

interface SimulatorModalProps {
  onClose: () => void;
}

export function SimulatorModal({ onClose }: SimulatorModalProps) {
  return (
    <div className="fixed inset-0 bg-black z-[100] flex flex-col">
      <div className="h-14 bg-gray-900 border-b border-gray-800 flex items-center justify-between px-6 shrink-0">
        <h2 className="text-white font-bold flex items-center gap-2">
          <Play className="text-green-400" size={20} />
          AR Simulator (End-User Preview)
        </h2>
        <div className="flex items-center gap-4">
          <div className="text-xs text-gray-400 flex items-center gap-2 bg-gray-800 px-3 py-1.5 rounded-md">
            <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
            Klik objek untuk menguji event (animasi/audio/URL)
          </div>
          <button 
            onClick={onClose} 
            className="bg-red-500 hover:bg-red-600 text-white px-4 py-1.5 rounded-md text-sm font-bold transition-colors flex items-center"
          >
            <X size={16} className="mr-1" /> Tutup Simulator
          </button>
        </div>
      </div>
      <div className="flex-1 w-full bg-gradient-to-b from-[#111] to-[#222] relative">
        <div className="absolute inset-0">
           <EditorViewport simulateMode={true} />
        </div>
      </div>
    </div>
  );
}
