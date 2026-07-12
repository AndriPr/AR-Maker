"use client";

import { useEffect, useRef, useState, use } from 'react';
import { supabase } from '@/lib/supabase';
import { Loader2 } from 'lucide-react';
import dynamic from 'next/dynamic';

const MindARViewer = dynamic(() => import('@/components/AR/MindARViewer'), { 
  ssr: false, 
  loading: () => <div className="text-white text-center p-10 font-bold animate-pulse">Memuat AR Engine...</div>
});

export default function ARViewer({ params }: { params: Promise<{ id: string }> }) {
  const unwrappedParams = use(params);
  const [project, setProject] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const sceneRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // 1. Fetch Project Data
    const fetchProject = async () => {
      try {
        const { data, error } = await supabase
          .from('ar_projects')
          .select('*, assets(*)')
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

  useEffect(() => {
    // 2. Initialize AR Engine when project is loaded
    if (!project || !sceneRef.current) return;

    // TODO: Initialize MindAR (Image Tracking) or WebXR (Surface Tracking)
    // Here we will inject A-Frame / MindAR scripts dynamically 
    // to avoid Next.js SSR issues with browser-only libraries.

  }, [project]);

  if (error) {
    return <div className="h-screen w-screen flex items-center justify-center bg-gray-900 text-white p-4 text-center">{error}</div>;
  }

  if (!project) {
    return (
      <div className="h-screen w-screen flex flex-col items-center justify-center bg-gray-900 text-white">
        <Loader2 className="animate-spin mb-4" size={32} />
        <p>Memuat Pengalaman AR...</p>
      </div>
    );
  }

  return (
    <div className="h-screen w-screen overflow-hidden bg-black relative">
      {/* UI Overlay */}
      <div className="absolute top-0 left-0 w-full p-4 z-50 flex justify-between items-center pointer-events-none">
        <div className="bg-black/50 backdrop-blur-md text-white px-4 py-2 rounded-full font-medium text-sm border border-gray-700">
          {project.title}
        </div>
        <div className="bg-pln-blue text-white px-3 py-1 rounded-full text-xs font-bold shadow-lg shadow-blue-900/50">
          AR Active
        </div>
      </div>

      {/* AR Container */}
      <div ref={sceneRef} className="w-full h-full">
        {project.tracking_type === 'image_tracking' ? (
           <MindARViewer 
             mindFileUrl={project.mind_file_url || "https://cdn.jsdelivr.net/gh/hiukim/mind-ar-js@1.2.2/example/image-tracking/assets/card-example/card.mind"} 
             elements={project.scene_data?.elements || []} 
           />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center text-gray-500">
            <p className="mb-2 text-center text-sm px-8">Surface Tracking (WebXR) belum diimplementasikan di versi preview ini.</p>
          </div>
        )}
      </div>
    </div>
  );
}
