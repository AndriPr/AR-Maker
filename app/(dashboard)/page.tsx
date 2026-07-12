"use client";

import { Image, Box, MoreVertical, Play, Edit3, Trash2, Plus } from 'lucide-react';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';

export default function Dashboard() {
  const router = useRouter();
  const [projects, setProjects] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    const checkAuthAndFetchData = async () => {
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

    checkAuthAndFetchData();
  }, [router]);

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
            className="bg-white border border-gray-200 rounded-xl px-4 py-2 text-sm focus:ring-2 focus:ring-pln-blue outline-none"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
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
          />
        ))}

        {projects.length === 0 && (
          <div className="col-span-1 md:col-span-2 lg:col-span-3 xl:col-span-3 flex flex-col items-center justify-center bg-gray-50 rounded-3xl border border-dashed border-gray-300 text-gray-500 p-10 min-h-[250px]">
            <Box size={48} className="mb-4 text-gray-300" />
            <p className="font-bold">Belum ada proyek</p>
            <p className="text-sm">Klik kartu biru untuk membuat proyek pertama Anda.</p>
          </div>
        )}
      </div>
    </div>
  );
}

function ProjectCard({ id, title, type, date, status, views, icon }: any) {
  return (
    <div className="bg-white border border-gray-100 rounded-3xl overflow-hidden shadow-sm hover:shadow-md transition-shadow group flex flex-col min-h-[250px]">
      <div className="h-32 bg-gray-100 relative group-hover:bg-gray-200 transition-colors flex items-center justify-center">
        <div className="absolute top-3 right-3 bg-white/90 backdrop-blur-sm p-1 rounded-md text-gray-600 shadow-sm opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
          <Link href={`/projects/${id}/edit`} className="p-1 hover:text-pln-blue"><Edit3 size={16} /></Link>
          <button className="p-1 hover:text-red-500"><Trash2 size={16} /></button>
        </div>
        {icon}
      </div>
      
      <div className="p-5 flex flex-col flex-1">
        <div className="flex justify-between items-start mb-2">
          <h3 className="font-bold text-gray-900 truncate pr-2">{title}</h3>
          <button className="text-gray-400 hover:text-gray-600 mt-1"><MoreVertical size={16} /></button>
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
    </div>
  );
}
