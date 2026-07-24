import { X, Eye } from 'lucide-react';

interface WebcamTestModalProps {
  onClose: () => void;
  projectId: string;
}

export function WebcamTestModal({ onClose, projectId }: WebcamTestModalProps) {
  return (
    <div className="fixed inset-0 bg-black z-[100] flex flex-col">
      <div className="h-14 bg-gray-900 border-b border-gray-800 flex items-center justify-between px-6 shrink-0">
        <h2 className="text-white font-bold flex items-center gap-2">
          <Eye className="text-indigo-400" size={20} />
          Webcam Test Mode
        </h2>
        <div className="flex items-center gap-4">
          <div className="text-xs text-gray-400 flex items-center gap-2 bg-gray-800 px-3 py-1.5 rounded-md">
            <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
            Gunakan marker fisik di depan webcam
          </div>
          <button 
            onClick={onClose} 
            className="bg-red-500 hover:bg-red-600 text-white px-4 py-1.5 rounded-md text-sm font-bold transition-colors flex items-center"
          >
            <X size={16} className="mr-1" /> Tutup
          </button>
        </div>
      </div>
      <div className="flex-1 w-full bg-black relative">
        <iframe 
          src={`/ar-viewer/${projectId}`}
          className="w-full h-full border-0"
          allow="camera; microphone; xr-spatial-tracking"
        ></iframe>
      </div>
    </div>
  );
}
