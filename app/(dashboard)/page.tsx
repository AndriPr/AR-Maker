"use client";

import { Image, Box, Play, Edit3, Trash2, Plus, QrCode, X, Download, ExternalLink } from 'lucide-react';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import { QRCodeSVG } from 'qrcode.react';

export default function Dashboard() {
  const router = useRouter();
  const [projects, setProjects] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  const [qrModalData, setQrModalData] = useState<{ id: string, title: string } | null>(null);

  useEffect(() => {
    fetchData();
  }, [router]);

  const fetchData = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      router.push('/login');
      return;
    }
    setUser(session.user);

    const { data, error } = await supabase
      .from('ar_projects')
      .select('*')
      .eq('user_id', session.user.id)
      .order('created_at', { ascending: false });

    if (data) {
      setProjects(data);
    }
    setLoading(false);
  };

  const handleDelete = async (id: string, title: string, mindFileUrl?: string) => {
    if (confirm(`Apakah Anda yakin ingin menghapus proyek "${title}"?`)) {
      // Hapus file .mind dari storage jika ada
      if (mindFileUrl) {
        try {
          const urlParts = mindFileUrl.split('/public/assets/');
          if (urlParts.length > 1) {
            const filePath = urlParts[1];
            await supabase.storage.from('assets').remove([filePath]);
          }
        } catch (e) {
          console.error("Gagal menghapus file .mind:", e);
        }
      }
      
      await supabase.from('ar_projects').delete().eq('id', id);
      fetchData();
    }
  };

  const handleRename = async (id: string, oldTitle: string) => {
    const newTitle = prompt("Masukkan judul baru:", oldTitle);
    if (newTitle && newTitle.trim() !== "" && newTitle !== oldTitle) {
      await supabase.from('ar_projects').update({ title: newTitle }).eq('id', id);
      fetchData();
    }
  };

  if (loading) {
    return <div className="flex h-[50vh] items-center justify-center text-gray-500 font-bold">Memuat proyek...</div>;
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">My Projects</h1>
          <p className="text-gray-500 text-sm mt-1">Kelola dan edit pengalaman Augmented Reality Anda.</p>
        </div>
        <div className="flex gap-3">
          <input 
            type="text" 
            placeholder="Cari proyek..." 
            className="bg-white border border-gray-200 rounded-xl px-4 py-2 text-sm focus:ring-2 focus:ring-pln-blue outline-none w-full md:w-auto"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {/* Create New Card */}
        <Link href="/projects/new" className="bg-pln-blue-dark rounded-3xl p-6 flex flex-col items-center justify-center text-white hover:bg-pln-blue transition-colors group min-h-[250px] border border-transparent hover:border-pln-yellow">
          <div className="w-16 h-16 bg-white/10 rounded-full flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
            <Plus size={32} />
          </div>
          <h3 className="font-bold text-lg">Buat Proyek Baru</h3>
          <p className="text-sm text-gray-300 mt-2 text-center">Mulai proyek AR dari awal</p>
        </Link>

        {/* Dynamic Projects Grid */}
        {projects.map((project) => (
          <ProjectCard 
            key={project.id}
            id={project.id}
            title={project.title}
            type={project.tracking_type === 'image_tracking' ? 'Image Tracking' : 'Surface Tracking'}
            date={new Date(project.created_at).toLocaleDateString('id-ID')}
            status={project.is_published ? 'Published' : 'Draft'}
            views={project.views}
            icon={project.tracking_type === 'image_tracking' ? <Image size={16} className="text-blue-500" /> : <Box size={16} className="text-purple-500" />}
            onRename={() => handleRename(project.id, project.title)}
            onDelete={() => handleDelete(project.id, project.title, project.mind_file_url)}
            onShowQR={() => setQrModalData({ id: project.id, title: project.title })}
          />
        ))}

        {projects.length === 0 && (
          <div className="col-span-1 sm:col-span-2 lg:col-span-3 xl:col-span-3 flex flex-col items-center justify-center bg-gray-50 rounded-3xl border border-dashed border-gray-300 text-gray-500 p-10 min-h-[250px]">
            <Box size={48} className="mb-4 text-gray-300" />
            <p className="font-bold">Belum ada proyek</p>
            <p className="text-sm">Klik kartu biru untuk membuat proyek pertama Anda.</p>
          </div>
        )}
      </div>

      {/* QR Code Modal */}
      {qrModalData && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl w-full max-w-sm shadow-2xl overflow-hidden flex flex-col relative">
            <button 
              onClick={() => setQrModalData(null)} 
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-900 transition-colors p-1 bg-gray-100 hover:bg-gray-200 rounded-full"
            >
              <X size={20} />
            </button>
            
            <div className="p-8 flex flex-col items-center pt-10">
              <h2 className="text-xl font-bold text-gray-900 text-center mb-1 line-clamp-1">{qrModalData.title}</h2>
              <p className="text-xs text-gray-500 text-center mb-6">
                Scan menggunakan kamera HP
              </p>
              
              <div className="bg-white p-2 rounded-2xl border-2 border-gray-100 shadow-inner mb-6" id="qr-code-dashboard">
                <QRCodeSVG 
                  value={`${window.location.origin}/ar-viewer/${qrModalData.id}`} 
                  size={200}
                  level="H"
                  includeMargin={true}
                />
              </div>

              <div className="flex flex-col w-full gap-2">
                <button 
                  onClick={() => {
                    const svg = document.querySelector('#qr-code-dashboard svg');
                    if (!svg) return;
                    const svgData = new XMLSerializer().serializeToString(svg);
                    const canvas = document.createElement("canvas");
                    const ctx = canvas.getContext("2d");
                    const img = new window.Image();
                    img.onload = () => {
                      canvas.width = img.width;
                      canvas.height = img.height;
                      ctx?.drawImage(img, 0, 0);
                      const pngFile = canvas.toDataURL("image/png");
                      const downloadLink = document.createElement("a");
                      downloadLink.download = `QR-${qrModalData.title.replace(/\s+/g, '-')}.png`;
                      downloadLink.href = `${pngFile}`;
                      downloadLink.click();
                    };
                    img.src = "data:image/svg+xml;base64," + btoa(unescape(encodeURIComponent(svgData)));
                  }}
                  className="flex items-center justify-center gap-2 w-full py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl font-bold transition-colors"
                >
                  <Download size={16} />
                  Download
                </button>
                
                <Link 
                  href={`/ar-viewer/${qrModalData.id}`}
                  target="_blank"
                  className="flex items-center justify-center gap-2 w-full py-2.5 bg-pln-blue hover:bg-pln-blue-dark text-white rounded-xl font-bold transition-colors"
                >
                  <ExternalLink size={16} />
                  Buka AR Viewer
                </Link>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function ProjectCard({ id, title, type, date, status, views, icon, onRename, onDelete, onShowQR }: any) {
  return (
    <Link href={`/projects/${id}/edit`} className="bg-white border border-gray-100 rounded-3xl overflow-hidden shadow-sm hover:shadow-md transition-shadow group flex flex-col min-h-[250px] cursor-pointer relative">
      <div className="h-32 bg-gray-100 relative group-hover:bg-gray-200 transition-colors flex items-center justify-center">
        <div className="absolute top-3 right-3 bg-white/90 backdrop-blur-sm p-1 rounded-md text-gray-600 shadow-sm opacity-0 group-hover:opacity-100 transition-opacity flex gap-1 z-10">
          <button 
            onClick={(e) => { e.preventDefault(); e.stopPropagation(); onRename(); }} 
            className="p-1 hover:text-pln-blue transition-colors"
            title="Ganti Judul"
          >
            <Edit3 size={16} />
          </button>
          {status === 'Published' && (
            <button 
              onClick={(e) => { e.preventDefault(); e.stopPropagation(); onShowQR(); }} 
              className="p-1 hover:text-green-500 transition-colors"
              title="Tampilkan QR Code"
            >
              <QrCode size={16} />
            </button>
          )}
          <button 
            onClick={(e) => { e.preventDefault(); e.stopPropagation(); onDelete(); }} 
            className="p-1 hover:text-red-500 transition-colors"
            title="Hapus Proyek"
          >
            <Trash2 size={16} />
          </button>
        </div>
        {icon}
      </div>
      
      <div className="p-5 flex flex-col flex-1">
        <div className="flex justify-between items-start mb-2">
          <h3 className="font-bold text-gray-900 line-clamp-1 pr-2">{title}</h3>
        </div>
        
        <div className="flex items-center gap-1.5 text-xs font-medium text-gray-500 mb-4">
          {icon}
          {type}
        </div>
        
        <div className="mt-auto flex items-center justify-between">
          <div className="flex flex-col">
            <span className={`text-xs font-bold ${status === 'Published' ? 'text-green-500' : 'text-gray-400'}`}>
              {status}
            </span>
            <span className="text-xs text-gray-400 mt-0.5">Dibuat: {date}</span>
          </div>
          {status === 'Published' && (
            <div className="flex items-center gap-1 text-xs font-bold text-gray-700 bg-gray-50 px-2 py-1 rounded-md">
              <Play size={12} className="text-pln-blue" />
              {views}
            </div>
          )}
        </div>
      </div>
    </Link>
  );
}
