"use client";

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { BarChart3, Eye, FolderRoot, CheckCircle2 } from 'lucide-react';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';

export default function AnalyticsPage() {
  const [stats, setStats] = useState({
    totalProjects: 0,
    totalViews: 0,
    published: 0,
    drafts: 0,
  });
  const [topProjects, setTopProjects] = useState<any[]>([]);
  const [weeklyData, setWeeklyData] = useState<any[]>([]);
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

      // Ambil 5 proyek dengan views tertinggi
      const sorted = [...projects].sort((a, b) => (b.views || 0) - (a.views || 0)).slice(0, 5);
      setTopProjects(sorted);
    }

    // Hitung data tren 7 hari terakhir
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6);
    sevenDaysAgo.setHours(0, 0, 0, 0);

    const { data: viewsData, error: viewsError } = await supabase
      .from('project_views')
      .select('created_at')
      .eq('user_id', session.user.id)
      .gte('created_at', sevenDaysAgo.toISOString());

    const days = ['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'];
    const chartData = [];
    
    // Inisialisasi 7 hari terakhir dengan 0 views
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      chartData.push({
        dateStr: d.toISOString().split('T')[0], // yyyy-mm-dd
        name: days[d.getDay()],
        views: 0
      });
    }

    if (viewsData && !viewsError) {
      viewsData.forEach((v: any) => {
        const dateStr = v.created_at.split('T')[0];
        const dayEntry = chartData.find(c => c.dateStr === dateStr);
        if (dayEntry) {
          dayEntry.views += 1;
        }
      });
    }
    
    setWeeklyData(chartData);
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

      {/* Bagian Grafik */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-8">
        
        {/* Grafik Garis - Tren Mingguan */}
        <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm">
          <div className="mb-6">
            <h3 className="text-lg font-bold text-gray-900">Tren Pengunjung (7 Hari Terakhir)</h3>
            <p className="text-xs text-gray-500">Data real-time (Live)</p>
          </div>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={weeklyData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#6b7280' }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#6b7280' }} />
                <Tooltip 
                  contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                />
                <Line 
                  type="monotone" 
                  dataKey="views" 
                  stroke="#005C9A" 
                  strokeWidth={4} 
                  dot={{ r: 4, fill: '#005C9A', strokeWidth: 0 }} 
                  activeDot={{ r: 6, fill: '#FFC400', strokeWidth: 0 }} 
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Grafik Batang - Proyek Teratas */}
        <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm">
          <div className="mb-6">
            <h3 className="text-lg font-bold text-gray-900">Top 5 Proyek Populer</h3>
            <p className="text-xs text-gray-500">Berdasarkan jumlah kunjungan aktual</p>
          </div>
          <div className="h-[300px] w-full">
            {topProjects.length === 0 ? (
              <div className="h-full flex items-center justify-center text-gray-400 font-medium">Belum ada proyek</div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={topProjects} layout="vertical" margin={{ top: 0, right: 0, left: 30, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f3f4f6" />
                  <XAxis type="number" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#6b7280' }} />
                  <YAxis dataKey="title" type="category" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#6b7280' }} width={100} />
                  <Tooltip 
                    cursor={{ fill: '#f8fafc' }}
                    contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                  />
                  <Bar dataKey="views" fill="#FFC400" radius={[0, 8, 8, 0]} barSize={24} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
