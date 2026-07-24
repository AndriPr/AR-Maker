import { QRCodeSVG } from 'qrcode.react';
import { X, QrCode, Download, ExternalLink } from 'lucide-react';
import Link from 'next/link';

interface PublishModalProps {
  onClose: () => void;
  project: any;
  brandColor: string;
  brandLogoUrl: string | null;
}

export function PublishModal({ onClose, project, brandColor, brandLogoUrl }: PublishModalProps) {
  const downloadQRCode = () => {
    const svg = document.querySelector('#qr-code-container svg');
    if (!svg) return;
    const svgData = new XMLSerializer().serializeToString(svg);
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    const img = new Image();
    img.onload = () => {
      canvas.width = img.width;
      canvas.height = img.height;
      ctx?.drawImage(img, 0, 0);
      const pngFile = canvas.toDataURL("image/png");
      const downloadLink = document.createElement("a");
      downloadLink.download = `QR-${project?.title.replace(/\\s+/g, '-')}.png`;
      downloadLink.href = `${pngFile}`;
      downloadLink.click();
    };
    img.src = "data:image/svg+xml;base64," + btoa(unescape(encodeURIComponent(svgData)));
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-gray-900 border border-gray-800 rounded-2xl w-full max-w-md shadow-2xl overflow-hidden flex flex-col">
        <div className="p-4 border-b border-gray-800 flex items-center justify-between">
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <QrCode className="text-pln-blue" size={20} />
            Proyek Berhasil Di-publish!
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-white transition-colors p-1 rounded-md hover:bg-gray-800">
            <X size={20} />
          </button>
        </div>
        
        <div className="p-6 flex flex-col items-center">
          <p className="text-sm text-gray-400 text-center mb-6">
            Scan QR Code ini menggunakan kamera HP audiens Anda untuk langsung membuka pengalaman AR tanpa harus menginstal aplikasi.
          </p>
          
          <div className="bg-white p-4 rounded-xl shadow-lg mb-6 border-4" style={{ borderColor: brandColor }} id="qr-code-container">
            <QRCodeSVG 
              value={`${window.location.origin}/ar-viewer/${project?.id}`} 
              size={200}
              level="H"
              includeMargin={true}
              fgColor={brandColor}
              imageSettings={brandLogoUrl ? {
                src: brandLogoUrl,
                x: undefined,
                y: undefined,
                height: 48,
                width: 48,
                excavate: true,
              } : undefined}
            />
          </div>

          <div className="flex flex-col w-full gap-3">
            <button 
              onClick={downloadQRCode}
              className="flex items-center justify-center gap-2 w-full py-2.5 bg-gray-800 hover:bg-gray-700 text-white rounded-lg font-medium transition-colors border border-gray-700"
            >
              <Download size={16} />
              Download QR Code (PNG)
            </button>
            
            <Link 
              href={`/ar-viewer/${project?.id}`}
              target="_blank"
              className="flex items-center justify-center gap-2 w-full py-2.5 bg-pln-blue hover:bg-pln-blue-dark text-white rounded-lg font-bold transition-colors"
            >
              <ExternalLink size={16} />
              Buka AR Viewer Sekarang
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
