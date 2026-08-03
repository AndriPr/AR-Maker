"use client";

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { BarChart3, Eye, Wifi, FileText, MoreHorizontal } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { useWorkspace } from '@/components/providers/WorkspaceProvider';

export default function AnalyticsPage() {
  const { activeWorkspace, user, isLoading: workspaceLoading } = useWorkspace();
  const [stats, setStats] = useState({
    totalProjects: 0,
    totalViews: 0,
    published: 0,
    drafts: 0,
  });
  const [topProjects, setTopProjects] = useState<any[]>([]);
  const [weeklyData, setWeeklyData] = useState<any[]>([]);
  const [monthlyData, setMonthlyData] = useState<any[]>([]);
  const [period, setPeriod] = useState<'monthly' | 'weekly'>('monthly');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!workspaceLoading) {
      fetchStats();
    }
  }, [activeWorkspace, workspaceLoading]);

  const fetchStats = async () => {
    if (!user) return;

    let query = supabase
      .from('ar_projects')
      .select('is_published, views, title');
      
    if (activeWorkspace) {
      query = query.eq('workspace_id', activeWorkspace.id);
    } else {
      query = query.is('workspace_id', null).eq('user_id', user.id);
    }

    const { data: projects, error } = await query;

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

    // Hitung data tren 7 hari terakhir (mingguan)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6);
    sevenDaysAgo.setHours(0, 0, 0, 0);

    let viewsQuery = supabase
      .from('project_views')
      .select('created_at')
      .gte('created_at', sevenDaysAgo.toISOString());
      
    if (activeWorkspace) {
      viewsQuery = viewsQuery.eq('workspace_id', activeWorkspace.id);
    } else {
      viewsQuery = viewsQuery.is('workspace_id', null).eq('user_id', user.id);
    }

    const { data: viewsData, error: viewsError } = await viewsQuery;

    const days = ['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'];
    const weekly: any[] = [];
    
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      weekly.push({
        dateStr: d.toISOString().split('T')[0],
        name: days[d.getDay()],
        views: 0
      });
    }

    if (viewsData && !viewsError) {
      viewsData.forEach((v: any) => {
        const dateStr = v.created_at.split('T')[0];
        const dayEntry = weekly.find(c => c.dateStr === dateStr);
        if (dayEntry) {
          dayEntry.views += 1;
        }
      });
    }
    
    setWeeklyData(weekly);

    // Hitung data tren 8 bulan terakhir (bulanan)
    const eightMonthsAgo = new Date();
    eightMonthsAgo.setMonth(eightMonthsAgo.getMonth() - 7);
    eightMonthsAgo.setDate(1);
    eightMonthsAgo.setHours(0, 0, 0, 0);

    let monthlyQuery = supabase
      .from('project_views')
      .select('created_at')
      .gte('created_at', eightMonthsAgo.toISOString());

    if (activeWorkspace) {
      monthlyQuery = monthlyQuery.eq('workspace_id', activeWorkspace.id);
    } else {
      monthlyQuery = monthlyQuery.is('workspace_id', null).eq('user_id', user.id);
    }

    const { data: monthlyViewsData, error: monthlyError } = await monthlyQuery;

    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const monthly: any[] = [];

    for (let i = 7; i >= 0; i--) {
      const d = new Date();
      d.setMonth(d.getMonth() - i);
      monthly.push({
        key: `${d.getFullYear()}-${d.getMonth()}`,
        name: monthNames[d.getMonth()],
        views: 0
      });
    }

    if (monthlyViewsData && !monthlyError) {
      monthlyViewsData.forEach((v: any) => {
        const d = new Date(v.created_at);
        const key = `${d.getFullYear()}-${d.getMonth()}`;
        const entry = monthly.find(c => c.key === key);
        if (entry) entry.views += 1;
      });
    }

    setMonthlyData(monthly);
    setLoading(false);
  };

  if (loading) {
    return <div className="flex h-[50vh] items-center justify-center text-gray-500 font-bold">Memuat statistik...</div>;
  }

  const chartData = period === 'monthly' ? monthlyData : weeklyData;
  const maxTopViews = topProjects[0]?.views || 1;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Performance Analytics</h1>
        <p className="text-gray-500 text-sm mt-1">Pantau performa dan statistik seluruh proyek AR Anda.</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <div className="bg-white p-5 rounded-2xl border border-blue-100/60 shadow-[0_0_25px_2px_rgba(0,92,154,0.12)]">
          <div className="w-10 h-10 flex items-center justify-center bg-blue-50 text-pln-blue rounded-xl mb-4">
            <BarChart3 size={20} />
          </div>
          <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Total Proyek</p>
          <p className="text-3xl font-black text-gray-900 mt-1">{stats.totalProjects}</p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-blue-100/60 shadow-[0_0_25px_2px_rgba(0,92,154,0.12)]">
          <div className="w-10 h-10 flex items-center justify-center bg-yellow-50 text-yellow-500 rounded-xl mb-4">
            <Eye size={20} />
          </div>
          <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Total Views</p>
          <p className="text-3xl font-black text-gray-900 mt-1">{stats.totalViews}</p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-blue-100/60 shadow-[0_0_25px_2px_rgba(0,92,154,0.12)]">
          <div className="w-10 h-10 flex items-center justify-center bg-purple-50 text-purple-500 rounded-xl mb-4">
            <Wifi size={20} />
          </div>
          <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Aktif</p>
          <p className="text-3xl font-black text-gray-900 mt-1">{stats.published}</p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-blue-100/60 shadow-[0_0_25px_2px_rgba(0,92,154,0.12)]">
          <div className="w-10 h-10 flex items-center justify-center bg-gray-100 text-gray-500 rounded-xl mb-4">
            <FileText size={20} />
          </div>
          <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Proyek Draft</p>
          <p className="text-3xl font-black text-gray-900 mt-1">{stats.drafts}</p>
        </div>
      </div>

      {/* Bagian Grafik */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        
        {/* Grafik Area - Tren Pengunjung */}
        <div className="bg-white p-6 rounded-3xl border border-blue-100/60 shadow-[0_0_25px_2px_rgba(0,92,154,0.12)] lg:col-span-2">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-bold text-gray-900">Trends Pengunjung</h3>
            <div className="flex bg-gray-100 rounded-full p-1 text-xs font-bold">
              <button
                onClick={() => setPeriod('monthly')}
                className={`px-3.5 py-1.5 rounded-full transition-colors ${period === 'monthly' ? 'bg-white shadow-sm text-gray-900' : 'text-gray-500 hover:text-gray-700'}`}
              >
                Monthly
              </button>
              <button
                onClick={() => setPeriod('weekly')}
                className={`px-3.5 py-1.5 rounded-full transition-colors ${period === 'weekly' ? 'bg-white shadow-sm text-gray-900' : 'text-gray-500 hover:text-gray-700'}`}
              >
                Weekly
              </button>
            </div>
          </div>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="colorViews" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#005C9A" stopOpacity={0.35} />
                    <stop offset="95%" stopColor="#005C9A" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#9ca3af' }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#9ca3af' }} />
                <Tooltip 
                  contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                />
                <Area 
                  type="monotone" 
                  dataKey="views" 
                  stroke="#005C9A" 
                  strokeWidth={3} 
                  fill="url(#colorViews)"
                  dot={{ r: 4, fill: '#005C9A', strokeWidth: 0 }}
                  activeDot={{ r: 6, fill: '#FFC400', strokeWidth: 0 }}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Top Projects */}
        <div className="bg-white p-6 rounded-3xl border border-blue-100/60 shadow-[0_0_25px_2px_rgba(0,92,154,0.12)] flex flex-col">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-bold text-gray-900">Top Projects</h3>
            <button className="text-gray-400 hover:text-gray-600 transition-colors">
              <MoreHorizontal size={20} />
            </button>
          </div>

          <div className="space-y-5 flex-1">
            {topProjects.length === 0 ? (
              <div className="text-gray-400 font-medium text-sm">Belum ada proyek</div>
            ) : (
              topProjects.map((p, i) => {
                const pct = Math.round(((p.views || 0) / maxTopViews) * 100);
                return (
                  <div key={i}>
                    <div className="flex items-center justify-between text-sm mb-1.5">
                      <span className="font-bold text-gray-800 truncate pr-2">{p.title}</span>
                      <span className="font-bold text-emerald-500 shrink-0">{pct}%</span>
                    </div>
                    <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                      <div className="h-full bg-pln-blue rounded-full transition-all" style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                );
              })
            )}
          </div>

          <button className="mt-6 w-full border-2 border-pln-blue text-pln-blue font-bold py-2.5 rounded-xl hover:bg-blue-50 transition-colors text-sm">
            View All Reports
          </button>
        </div>

      </div>
    </div>
  );
}