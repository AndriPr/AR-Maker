import { QRCodeSVG } from 'qrcode.react';
import { X, QrCode, Eye, Copy, ExternalLink } from 'lucide-react';
import Link from 'next/link';

interface PreviewModalProps {
  onClose: () => void;
  onOpenWebcamTest: () => void;
  project: any;
}

export function PreviewModal({ onClose, onOpenWebcamTest, project }: PreviewModalProps) {
  const handleCopyLink = () => {
    navigator.clipboard.writeText(`${window.location.origin}/ar-viewer/${project?.id}`);
    alert('Link berhasil disalin!');
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-gray-900 border border-gray-800 rounded-2xl w-full max-w-md shadow-2xl overflow-hidden flex flex-col">
        <div className="p-4 border-b border-gray-800 flex items-center justify-between">
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <QrCode className="text-indigo-400" size={20} />
            Preview WebXR
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-white transition-colors p-1 rounded-md hover:bg-gray-800">
            <X size={20} />
          </button>
        </div>
        
        <div className="p-6 flex flex-col items-center">
          <p className="text-sm text-gray-400 text-center mb-6">
            Scan QR Code ini dengan HP kamu untuk mencoba langsung proyek AR ini.
          </p>
          
          <div className="bg-white p-4 rounded-xl shadow-lg mb-6 border-4 border-indigo-500" id="preview-qr-code">
            <QRCodeSVG 
              value={`${window.location.origin}/ar-viewer/${project?.id}`} 
              size={200}
              level="H"
              includeMargin={true}
              fgColor="#000000"
            />
          </div>
          
          <div className="flex gap-3 w-full">
            <button 
              onClick={() => {
                onClose();
                onOpenWebcamTest();
              }}
              className="flex-[2] bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2.5 px-4 rounded-lg flex items-center justify-center transition-colors text-sm shadow-md"
            >
              <Eye size={16} className="mr-2" /> Tes dengan Kamera PC
            </button>
          </div>
          
          <div className="flex gap-3 w-full mt-3">
            <button 
              onClick={handleCopyLink}
              className="flex-1 bg-gray-800 hover:bg-gray-700 text-white font-bold py-2.5 px-4 rounded-lg flex items-center justify-center transition-colors text-xs"
            >
              <Copy size={14} className="mr-2" /> Salin Link
            </button>
            <Link 
              href={`/ar-viewer/${project?.id}`} 
              target="_blank"
              className="flex-1 bg-gray-700 hover:bg-gray-600 text-white font-bold py-2.5 px-4 rounded-lg flex items-center justify-center transition-colors text-xs"
            >
              Buka di Browser <ExternalLink size={14} className="ml-2" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
