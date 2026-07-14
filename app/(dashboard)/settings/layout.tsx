"use client";

import { useWorkspace } from "@/components/providers/WorkspaceProvider";
import { Users, History, Building2 } from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect } from "react";

export default function SettingsLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { activeWorkspace, activeRole, isLoading } = useWorkspace();

  useEffect(() => {
    if (!isLoading && activeRole !== 'admin') {
      router.push('/');
    }
  }, [activeRole, isLoading, router]);

  if (isLoading) {
    return <div className="p-8 text-center text-gray-500">Memuat Pengaturan...</div>;
  }

  if (activeRole !== 'admin') {
    return null;
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="flex items-center gap-3 mb-8">
        <div className="bg-gray-900 p-3 rounded-xl text-white">
          <Building2 size={24} />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Pengaturan Workspace</h1>
          <p className="text-sm text-gray-500">Kelola anggota, hak akses, dan lihat riwayat aktivitas {activeWorkspace?.name}.</p>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="border-b border-gray-100 flex overflow-x-auto">
          <Link
            href="/settings/members"
            className={`flex items-center gap-2 px-6 py-4 font-semibold text-sm whitespace-nowrap transition-colors ${pathname === '/settings/members' ? 'text-pln-blue border-b-2 border-pln-blue bg-blue-50/30' : 'text-gray-500 hover:bg-gray-50 hover:text-gray-900'}`}
          >
            <Users size={16} /> Anggota & Akses
          </Link>
          <Link
            href="/settings/audit-logs"
            className={`flex items-center gap-2 px-6 py-4 font-semibold text-sm whitespace-nowrap transition-colors ${pathname === '/settings/audit-logs' ? 'text-pln-blue border-b-2 border-pln-blue bg-blue-50/30' : 'text-gray-500 hover:bg-gray-50 hover:text-gray-900'}`}
          >
            <History size={16} /> Audit Logs
          </Link>
        </div>
        
        <div className="p-6 md:p-8">
          {children}
        </div>
      </div>
    </div>
  );
}
