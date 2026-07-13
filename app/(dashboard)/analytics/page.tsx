"use client";

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { BarChart3, Eye, FolderRoot, CheckCircle2 } from 'lucide-react';

export default function AnalyticsPage() {
  const [stats, setStats] = useState({
    totalProjects: 0,
    totalViews: 0,
    published: 0,
    drafts: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;

    const { data: projects, error } = await supabase
      .from('ar_projects')
      .select('is_published, views')
      .eq('user_id', session.user.id);

    if (projects && !error) {
      setStats({
        totalProjects: projects.length,
        totalViews: projects.reduce((sum, p) => sum + (p.views || 0), 0),
        published: projects.filter(p => p.is_published).length,
        drafts: projects.filter(p => !p.is_published).length,
      });
    }
    setLoading(false);
  };

  if (loading) {
    return <div className="flex h-[50vh] items-center justify-center text-gray-500 font-bold">Memuat statistik...</div>;
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Analytics</h1>
        <p className="text-gray-500 text-sm mt-1">Pantau performa dan statistik seluruh proyek AR Anda.</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm flex flex-col hover:shadow-md transition-shadow">
          <div className="flex items-center gap-4 mb-4">
            <div className="p-3 bg-blue-50 text-pln-blue rounded-xl">
              <FolderRoot size={24} />
            </div>
            <h3 className="font-bold text-gray-600">Total Proyek</h3>
          </div>
          <p className="text-4xl font-black text-gray-900">{stats.totalProjects}</p>
        </div>

        <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm flex flex-col hover:shadow-md transition-shadow">
          <div className="flex items-center gap-4 mb-4">
            <div className="p-3 bg-purple-50 text-purple-600 rounded-xl">
              <Eye size={24} />
            </div>
            <h3 className="font-bold text-gray-600">Total Views</h3>
          </div>
          <p className="text-4xl font-black text-gray-900">{stats.totalViews}</p>
        </div>

        <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm flex flex-col hover:shadow-md transition-shadow">
          <div className="flex items-center gap-4 mb-4">
            <div className="p-3 bg-green-50 text-green-600 rounded-xl">
              <CheckCircle2 size={24} />
            </div>
            <h3 className="font-bold text-gray-600">Aktif (Published)</h3>
          </div>
          <p className="text-4xl font-black text-gray-900">{stats.published}</p>
        </div>

        <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm flex flex-col hover:shadow-md transition-shadow">
          <div className="flex items-center gap-4 mb-4">
            <div className="p-3 bg-orange-50 text-orange-600 rounded-xl">
              <BarChart3 size={24} />
            </div>
            <h3 className="font-bold text-gray-600">Proyek Draft</h3>
          </div>
          <p className="text-4xl font-black text-gray-900">{stats.drafts}</p>
        </div>
      </div>
    </div>
  );
}
