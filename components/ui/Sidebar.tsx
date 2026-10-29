'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Box, Shapes, BarChart3, Store, Trash2, Settings, Plus, X, ChevronsUpDown, Folder, LogOut } from 'lucide-react';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { useWorkspace } from '@/components/providers/WorkspaceProvider';
import { usePathname, useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { useDashboardStore } from '@/lib/dashboardStore';
import { useFolders, buildFolderTree } from '@/hooks/useFolders';
import { RenameDialog } from '@/components/dashboard/RenameDialog';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger, DropdownMenuGroup } from '@/components/ui/dropdown-menu';

const navItemBase = 'flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-[15px] transition-colors';
const navItemActive = 'bg-pln-blue text-white font-semibold shadow-sm shadow-blue-900/10';
const navItemIdle = 'text-gray-600 font-medium hover:bg-white/70 hover:text-pln-blue';

export default function Sidebar({ isOpen, onClose }: { isOpen?: boolean, onClose?: () => void }) {
  const pathname = usePathname();
  const router = useRouter();
  const queryClient = useQueryClient();
  const { workspaces, activeWorkspace, activeRole, setActiveWorkspaceId, isLoading } = useWorkspace();

  const { data: folders = [] } = useFolders();
  const folderTree = useMemo(() => buildFolderTree(folders), [folders]);
  const activeFolderId = useDashboardStore((s) => s.activeFolderId);
  const setActiveFolderId = useDashboardStore((s) => s.setActiveFolderId);
  const setSearchQuery = useDashboardStore((s) => s.setSearchQuery);

  const [isCreateFolderOpen, setIsCreateFolderOpen] = useState(false);
  const [folderToDelete, setFolderToDelete] = useState<{ id: string; name: string } | null>(null);

  // Folder hanya tampil di halaman My Projects
  const isProjectsPage = pathname === '/';

  // Filter folder & search cuma terlihat di tab Projects, jadi di-reset saat pindah ke tab lain.
  // Tanpa ini, filter "nyangkut" dan Projects tampil kosong saat kamu kembali.
  useEffect(() => {
    if (pathname !== '/') {
      setActiveFolderId('ALL');
      setSearchQuery('');
    }
  }, [pathname, setActiveFolderId, setSearchQuery]);

  // Folder berbeda per workspace, jadi filter di-reset saat workspace berganti
  useEffect(() => {
    setActiveFolderId('ALL');
  }, [activeWorkspace?.id, setActiveFolderId]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/login');
  };

  const handleCreateFolder = async (name: string) => {
    if (!activeWorkspace) return;
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;

    const { error } = await supabase.from('folders').insert({
      user_id: session.user.id,
      workspace_id: activeWorkspace.id,
      name,
      parent_id: activeFolderId === 'ALL' ? null : activeFolderId,
    });

    if (error) {
      toast.error('Gagal membuat folder.');
      return;
    }
    toast.success(`Folder "${name}" berhasil dibuat.`);
    queryClient.invalidateQueries({ queryKey: ['folders'] });
  };

  const handleDeleteFolder = async () => {
    if (!folderToDelete) return;
    const { id, name } = folderToDelete;
    const { error } = await supabase.from('folders').delete().eq('id', id);
    if (error) {
      toast.error('Gagal menghapus folder.');
      return;
    }
    toast.success(`Folder "${name}" berhasil dihapus.`);
    if (activeFolderId === id) setActiveFolderId('ALL');
    queryClient.invalidateQueries({ queryKey: ['folders'] });
    queryClient.invalidateQueries({ queryKey: ['dashboard'] });
  };

  const navItems = [
    { href: '/', label: 'Projects', icon: Box, active: pathname === '/' },
    { href: '/assets', label: 'Assets', icon: Shapes, active: pathname === '/assets' },
    { href: '/analytics', label: 'Analytics', icon: BarChart3, active: pathname === '/analytics' },
    { href: '/market', label: 'Marketplace', icon: Store, active: pathname === '/market' },
    { href: '/trash', label: 'Tong Sampah', icon: Trash2, active: pathname === '/trash' },
  ];

  return (
    <>
      <aside className={`w-64 h-screen bg-gray-100 flex flex-col fixed left-0 top-0 z-50 transform transition-transform duration-300 ease-in-out md:translate-x-0 ${isOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="p-4 sm:p-6 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Image src="/Logo_PLN.png" alt="Logo PLN" width={28} height={38} />
            <span className="text-xl font-bold text-pln-blue">AR Maker</span>
          </div>
          {/* Close button for mobile */}
          <button onClick={onClose} className="md:hidden p-2 text-gray-500 hover:bg-white/70 rounded-lg transition-colors">
            <X size={20} />
          </button>
        </div>

        {/* Workspace Switcher */}
        {!isLoading && (
          <div className="px-4 sm:px-5 mb-3">
            <DropdownMenu>
              <DropdownMenuTrigger className="w-full flex items-center justify-between gap-2 bg-white border border-gray-100 shadow-sm p-2.5 rounded-xl transition-all focus:outline-none focus:ring-2 focus:ring-pln-blue/20">
                <div className="flex items-center gap-3 overflow-hidden">
                  <div className="bg-pln-blue text-white p-2 rounded-lg shrink-0">
                    <Box size={16} />
                  </div>
                  <div className="flex flex-col items-start text-left truncate">
                    <span className="text-[15px] font-bold text-pln-blue truncate w-full leading-tight">{activeWorkspace?.name || 'Personal Workspace'}</span>
                    <span className="text-[11px] text-gray-500 capitalize">{activeRole}</span>
                  </div>
                </div>
                <ChevronsUpDown size={14} className="text-gray-400 shrink-0" />
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-[var(--radix-dropdown-menu-trigger-width)] min-w-56 rounded-xl" align="start">
                <DropdownMenuGroup>
                  <DropdownMenuLabel className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Switch Workspace</DropdownMenuLabel>
                </DropdownMenuGroup>
                <DropdownMenuSeparator />
                {workspaces.map(ws => (
                  <DropdownMenuItem
                    key={ws.id}
                    onClick={() => setActiveWorkspaceId(ws.id)}
                    className={`cursor-pointer flex items-center gap-2 rounded-lg ${activeWorkspace?.id === ws.id ? 'bg-blue-50 text-pln-blue font-bold' : 'text-gray-700'}`}
                  >
                    <Box size={14} className={activeWorkspace?.id === ws.id ? 'text-pln-blue' : 'text-gray-400'} />
                    <span className="truncate">{ws.name}</span>
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        )}

        <div className="px-4 sm:px-5 mb-5">
          <Link href="/projects/new" onClick={onClose} className="w-full flex items-center justify-center gap-2 bg-pln-blue hover:bg-pln-blue-dark text-white font-semibold py-2.5 rounded-xl shadow-sm transition-colors">
            <Plus size={18} />
            Create New AR
          </Link>
        </div>

        <nav className="flex-1 px-4 sm:px-5 space-y-1 overflow-y-auto">
          {navItems.map(({ href, label, icon: Icon, active }) => (
            <Link
              key={href}
              href={href}
              onClick={() => {
                // Klik "Projects" = kembali ke tampilan awal (semua proyek, tanpa filter)
                if (href === '/') {
                  setActiveFolderId('ALL');
                  setSearchQuery('');
                }
                onClose?.();
              }}
              className={`${navItemBase} ${active ? navItemActive : navItemIdle}`}
            >
              <Icon size={18} />
              {label}
            </Link>
          ))}

          {activeRole === 'admin' && (
            <Link
              href="/settings/members"
              onClick={onClose}
              className={`${navItemBase} ${pathname.startsWith('/settings') ? navItemActive : navItemIdle}`}
            >
              <Settings size={18} />
              Workspace Settings
            </Link>
          )}

          {/* Folders: hanya muncul di tab Projects */}
          {isProjectsPage && !isLoading && (
            <div className="pt-6 pb-4">
              <p className="px-3.5 mb-2 text-[11px] font-semibold text-gray-400 uppercase tracking-wider">Folders</p>

              <div className="space-y-0.5">
                {folderTree.map((folder) => {
                  const isActive = activeFolderId === folder.id;
                  return (
                    <div key={folder.id} className="group relative" style={{ paddingLeft: `${folder.depth * 0.75}rem` }}>
                      <button
                        onClick={() => { setActiveFolderId(isActive ? 'ALL' : folder.id); onClose?.(); }}
                        className={`w-full flex items-center gap-3 px-3.5 py-2 rounded-xl text-sm transition-colors ${activeRole === 'admin' ? 'pr-9' : ''} ${isActive ? 'bg-blue-50 text-pln-blue font-semibold' : 'text-gray-600 hover:bg-white/70'}`}
                      >
                        <Folder size={16} className={isActive ? 'text-pln-blue' : 'text-gray-400'} />
                        <span className="truncate">{folder.name}</span>
                      </button>
                      {activeRole === 'admin' && (
                        <button
                          onClick={() => setFolderToDelete({ id: folder.id, name: folder.name })}
                          className="absolute right-2 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"
                          title="Hapus Folder"
                        >
                          <Trash2 size={14} />
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>

              {activeRole !== 'viewer' && (
                <button
                  onClick={() => setIsCreateFolderOpen(true)}
                  className="mt-3 w-full flex items-center justify-center gap-2 border border-gray-300 rounded-full py-2 text-sm font-medium text-gray-700 bg-white/50 hover:bg-white transition-colors"
                >
                  <Plus size={16} />
                  Create New Folder
                </button>
              )}
            </div>
          )}
        </nav>

        <div className="p-4 sm:p-5 mt-auto">
          <button onClick={handleLogout} className="flex items-center gap-3 px-3.5 py-2 w-full text-gray-700 hover:bg-red-50 font-medium rounded-xl transition-colors">
            <LogOut size={18} className="text-red-500" />
            Log out
          </button>
        </div>
      </aside>

      <RenameDialog
        isOpen={isCreateFolderOpen}
        onOpenChange={setIsCreateFolderOpen}
        title="Buat Folder Baru"
        initialValue=""
        onConfirm={handleCreateFolder}
      />

      <ConfirmDialog
        isOpen={!!folderToDelete}
        onOpenChange={(open) => { if (!open) setFolderToDelete(null); }}
        title="Hapus Folder"
        description={`Apakah Anda yakin ingin menghapus folder "${folderToDelete?.name ?? ''}"? Proyek di dalamnya akan dipindahkan ke Personal dan sub-folder akan ikut terhapus.`}
        onConfirm={handleDeleteFolder}
        confirmText="Ya, Hapus"
        cancelText="Batal"
      />
    </>
  );
}
