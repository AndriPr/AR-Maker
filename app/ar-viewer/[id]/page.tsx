"use client";

import { useEffect, useState, use } from 'react';
import { supabase } from '@/lib/supabase';
import { Loader2 } from 'lucide-react';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

export default function ARViewer({ params }: { params: Promise<{ id: string }> }) {
  const unwrappedParams = use(params);
  const [project, setProject] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchProject = async () => {
      try {
        const { data, error } = await supabase
          .from('ar_projects')
          .select('*')
          .eq('id', unwrappedParams.id)
          .single();

        if (error) throw error;
        if (!data) throw new Error("Proyek tidak ditemukan.");
        
        setProject(data);
      } catch (err: any) {
        setError(err.message);
      }
    };

    fetchProject();
  }, [unwrappedParams.id]);

  if (error) {
    return <div className="h-screen w-screen flex flex-col items-center justify-center bg-gray-900 text-white p-4 text-center">
      <p className="text-red-400 mb-4">{error}</p>
      <Link href="/" className="px-4 py-2 bg-gray-800 rounded-lg hover:bg-gray-700">Kembali ke Dashboard</Link>
    </div>;
  }

  if (!project) {
    return (
      <div className="h-screen w-screen flex flex-col items-center justify-center bg-gray-900 text-white">
        <Loader2 className="animate-spin mb-4" size={32} />
        <p>Memuat Pengalaman AR...</p>
      </div>
    );
  }

  const brandColor = project.brand_color || '#00A2E9';

  return (
    <div className="h-[100dvh] w-screen overflow-hidden bg-black relative flex flex-col">
      {/* UI Overlay */}
      <div className="absolute top-0 left-0 w-full p-4 z-50 flex justify-between items-start pointer-events-none pt-[env(safe-area-inset-top)]">
        <div className="flex flex-col gap-2 pointer-events-auto">
           {project.brand_logo_url && (
             <div className="bg-white/90 backdrop-blur-md p-2 rounded-xl shadow-lg border border-white/20 mb-1 w-max">
               <img src={project.brand_logo_url} alt="Brand Logo" className="h-8 object-contain" />
             </div>
           )}
           <div className="flex gap-2 items-center">
             <Link href={`/projects/${project.id}/edit`} className="bg-black/50 backdrop-blur-md text-white p-2 rounded-full hover:bg-black/70 transition-colors border border-gray-700">
               <ArrowLeft size={16} />
             </Link>
             <div className="bg-black/50 backdrop-blur-md text-white px-4 py-2 rounded-full font-medium text-sm border border-gray-700 line-clamp-1 max-w-[150px]">
               {project.title}
             </div>
           </div>
        </div>
        <div 
          className="text-white px-3 py-1.5 rounded-full text-xs font-bold shadow-lg flex items-center gap-2 pointer-events-auto"
          style={{ backgroundColor: brandColor, boxShadow: `0 4px 14px 0 ${brandColor}80` }}
        >
          <div className="w-2 h-2 rounded-full bg-white animate-pulse"></div>
          AR Active
        </div>
      </div>

      {/* AR Container using real URL iframe to fix iOS Camera Permissions */}
      <div className="w-full flex-1">
        {project.tracking_type === 'image_tracking' ? (
           <iframe 
             src={`/ar-canvas/${project.id}`} 
             allow="camera; gyroscope; accelerometer; magnetometer; display-capture; xr-spatial-tracking"
             className="w-full h-full border-none"
             title="AR Experience"
           />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center text-gray-500 bg-gray-900">
            <p className="mb-2 text-center text-sm px-8">Surface Tracking (WebXR) belum diimplementasikan di versi preview ini.</p>
          </div>
        )}
      </div>
    </div>
  );
}
