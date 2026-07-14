"use client";

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import { Trash2, RefreshCw, AlertTriangle, Box } from 'lucide-react';
import { useWorkspace } from '@/components/providers/WorkspaceProvider';

export default function TrashPage() {
  const router = useRouter();
  const { activeWorkspace, user, isLoading: workspaceLoading } = useWorkspace();
  const [projects, setProjects] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!workspaceLoading) {
      fetchDeletedProjects();
    }
  }, [router, activeWorkspace, workspaceLoading]);

  const fetchDeletedProjects = async () => {
    if (!user) {
      router.push('/login');
      return;
    }

    let query = supabase
      .from('ar_projects')
      .select('*')
      .eq('is_deleted', true)
      .order('created_at', { ascending: false });
      
    if (activeWorkspace) {
      query = query.eq('workspace_id', activeWorkspace.id);
    } else {
      query = query.is('workspace_id', null).eq('user_id', user.id);
    }

    const { data } = await query;

    if (data) setProjects(data);
    setLoading(false);
  };

  const handleRestore = async (id: string, title: string) => {
    if (confirm(`Kembalikan proyek "${title}" ke Dashboard?`)) {
      await supabase.from('ar_projects').update({ is_deleted: false }).eq('id', id);
      fetchDeletedProjects();
    }
  };

  const handlePermanentDelete = async (id: string, title: string, mindFileUrl?: string) => {
    if (confirm(`PERINGATAN: Penghapusan "${title}" bersifat permanen dan tidak bisa dibatalkan. Lanjutkan?`)) {
      if (mindFileUrl) {
        try {
          const urlParts = mindFileUrl.split('/public/assets/');
          if (urlParts.length > 1) {
            await supabase.storage.from('assets').remove([urlParts[1]]);
          }
        } catch (e) {
          console.error("Gagal menghapus file:", e);
        }
      }
      
      await supabase.from('ar_projects').delete().eq('id', id);
      fetchDeletedProjects();
    }
  };

  if (loading) {
    return <div className="flex h-[50vh] items-center justify-center text-gray-500 font-bold">Memuat tong sampah...</div>;
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
          <Trash2 className="text-red-500" />
          Tong Sampah
        </h1>
        <p className="text-gray-500 text-sm mt-1">Proyek yang dihapus akan disimpan di sini.</p>
      </div>

      {projects.length === 0 ? (
        <div className="flex flex-col items-center justify-center bg-gray-50 rounded-3xl border border-dashed border-gray-300 text-gray-500 p-10 min-h-[300px]">
          <Box size={48} className="mb-4 text-gray-300" />
          <p className="font-bold">Tong sampah kosong</p>
          <p className="text-sm">Tidak ada proyek yang dihapus.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {projects.map((project) => (
            <div key={project.id} className="bg-white border border-gray-200 rounded-2xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-sm">
              <div className="flex flex-col">
                <h3 className="font-bold text-gray-900">{project.title}</h3>
                <span className="text-xs text-gray-500 mt-1">
                  Dihapus dari Dashboard | Dibuat pada: {new Date(project.created_at).toLocaleDateString('id-ID')}
                </span>
              </div>
              <div className="flex gap-2 w-full sm:w-auto">
                <button 
                  onClick={() => handleRestore(project.id, project.title)}
                  className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2 bg-green-50 hover:bg-green-100 text-green-700 font-bold rounded-xl transition-colors text-sm"
                >
                  <RefreshCw size={16} /> Restore
                </button>
                <button 
                  onClick={() => handlePermanentDelete(project.id, project.title, project.mind_file_url)}
                  className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2 bg-red-50 hover:bg-red-100 text-red-600 font-bold rounded-xl transition-colors text-sm"
                >
                  <AlertTriangle size={16} /> Hapus Permanen
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
