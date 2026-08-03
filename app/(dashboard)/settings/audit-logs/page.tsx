"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { useWorkspace } from "@/components/providers/WorkspaceProvider";
import { Activity, Clock, FileEdit, Trash2, Rocket, Share2, Shield, FolderPlus, UserPlus, FilePlus, UploadCloud, Image as ImageIcon, Box } from "lucide-react";

export default function AuditLogsPage() {
  const { activeWorkspace, activeRole } = useWorkspace();
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [limit, setLimit] = useState(10);

  useEffect(() => {
    if (activeWorkspace) {
      fetchLogs(limit);
    }
  }, [activeWorkspace, limit]);

  const fetchLogs = async (currentLimit: number) => {
    if (currentLimit === 10) setLoading(true);
    const { data, error } = await supabase
      .from('audit_logs')
      .select('*')
      .eq('workspace_id', activeWorkspace?.id)
      .order('created_at', { ascending: false })
      .limit(currentLimit);
      
    if (data) setLogs(data);
    setLoading(false);
    setLoadingMore(false);
  };

  const handleLoadMore = () => {
    setLoadingMore(true);
    setLimit((prev) => prev + 10);
  };

  const getActionInfo = (action: string) => {
    switch (action) {
      case 'PUBLISH_PROJECT': return { color: 'text-green-500', bg: 'bg-green-50', icon: Rocket, label: 'Proyek Dipublikasikan' };
      case 'REQUEST_PUBLISH': return { color: 'text-orange-500', bg: 'bg-orange-50', icon: Share2, label: 'Permintaan Publikasi' };
      case 'CREATE_PROJECT': return { color: 'text-blue-500', bg: 'bg-blue-50', icon: FilePlus, label: 'Proyek Dibuat' };
      case 'DELETE_PROJECT': return { color: 'text-red-500', bg: 'bg-red-50', icon: Trash2, label: 'Proyek Dihapus' };
      case 'CREATE_FOLDER': return { color: 'text-indigo-500', bg: 'bg-indigo-50', icon: FolderPlus, label: 'Folder Dibuat' };
      case 'DELETE_FOLDER': return { color: 'text-red-500', bg: 'bg-red-50', icon: Trash2, label: 'Folder Dihapus' };
      case 'INVITE_MEMBER': return { color: 'text-purple-500', bg: 'bg-purple-50', icon: UserPlus, label: 'Anggota Diundang' };
      case 'REMOVE_MEMBER': return { color: 'text-red-500', bg: 'bg-red-50', icon: Shield, label: 'Akses Dicabut' };
      case 'UPLOAD_ASSET': return { color: 'text-blue-500', bg: 'bg-blue-50', icon: UploadCloud, label: 'Aset Diunggah' };
      case 'DELETE_ASSET': return { color: 'text-red-500', bg: 'bg-red-50', icon: Trash2, label: 'Aset Dihapus' };
      default: return { color: 'text-gray-500', bg: 'bg-gray-100', icon: Activity, label: action };
    }
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('id-ID', {
      day: 'numeric', month: 'short', year: 'numeric',
      hour: '2-digit', minute: '2-digit'
    }).format(date);
  };

  if (activeRole !== 'admin') {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <Shield size={48} className="text-gray-300 mb-4" />
        <h2 className="text-xl font-bold text-gray-900 mb-2">Akses Ditolak</h2>
        <p className="text-gray-500 max-w-md">Anda memerlukan peran Administrator untuk melihat riwayat aktivitas Workspace ini.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-start sm:items-center justify-between gap-3 flex-col sm:flex-row">
        <div>
          <h2 className="text-lg font-bold text-gray-900">Riwayat Aktivitas</h2>
          <p className="text-sm text-gray-500 mt-0.5">Telusuri semua perubahan dan tindakan terbaru dalam ruang kerja Anda.</p>
        </div>
        <button onClick={() => fetchLogs(limit)} className="text-sm text-pln-blue font-medium hover:underline shrink-0">
          Segarkan Data
        </button>
      </div>

      {loading ? (
        <div className="text-sm text-gray-500">Memuat log aktivitas...</div>
      ) : logs.length === 0 ? (
        <div className="text-center py-12 border border-dashed border-gray-200 rounded-2xl bg-gray-50/50">
          <Activity size={32} className="mx-auto text-gray-300 mb-3" />
          <p className="text-gray-500 font-medium">Belum ada aktivitas tercatat di Workspace ini.</p>
        </div>
      ) : (
        <div className="border border-gray-200 rounded-xl overflow-hidden bg-white">
          <ul className="divide-y divide-gray-100">
            {logs.map((log) => {
              const info = getActionInfo(log.action);
              const Icon = info.icon;
              
              return (
                <li key={log.id} className="p-4 sm:px-6 hover:bg-gray-50 transition-colors">
                  <div className="flex items-start gap-4">
                    <div className={`mt-1 p-2 rounded-full ${info.bg} ${info.color} shrink-0`}>
                      <Icon size={16} />
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 mb-1">
                        <p className="text-sm font-bold text-gray-900">
                          {info.label}
                        </p>
                        <div className="flex items-center gap-1.5 text-xs text-gray-400 shrink-0">
                          <Clock size={12} />
                          <time>{formatTime(log.created_at)}</time>
                        </div>
                      </div>
                      
                      <div className="text-sm text-gray-600 mb-2">
                        Objek: <span className="font-semibold text-gray-800">{log.resource_name || 'Tidak diketahui'}</span>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <div className="w-5 h-5 rounded-full bg-gray-200 text-gray-600 flex items-center justify-center text-[8px] font-bold shrink-0">
                          U
                        </div>
                        <span className="text-xs text-gray-500 font-mono">
                          {log.user_id ? log.user_id.substring(0, 12) + '...' : 'System'}
                        </span>
                      </div>
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        </div>
      )}

      {!loading && logs.length > 0 && logs.length >= limit && (
        <div className="flex justify-center pt-2">
          <button
            onClick={handleLoadMore}
            disabled={loadingMore}
            className="px-5 py-2.5 rounded-full border border-gray-200 text-sm font-medium text-gray-600 hover:bg-gray-50 hover:border-gray-300 transition-colors disabled:opacity-50"
          >
            {loadingMore ? "Memuat..." : "Muat Aktivitas Lainnya"}
          </button>
        </div>
      )}
    </div>
  );
}