"use client";

import { Image, Box, Play, Edit3, Trash2, Plus, QrCode, X, Download, ExternalLink, MoreVertical, Link as LinkIcon, Filter, Copy, LayoutGrid, List, Folder, FolderPlus, Tag, Check, FolderInput, PanelLeft } from 'lucide-react';
import Link from 'next/link';
import React, { useEffect, useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import { QRCodeSVG } from 'qrcode.react';
import { useWorkspace } from '@/components/providers/WorkspaceProvider';
import { toast } from 'sonner';
import { ColumnDef } from '@tanstack/react-table';
import { DataTable } from '@/components/ui/data-table';

import { useQuery, useQueryClient } from '@tanstack/react-query';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { useDebounce } from '@/hooks/use-debounce';
import { RenameDialog } from '@/components/dashboard/RenameDialog';
import { ProjectCard } from '@/components/dashboard/ProjectCard';

export default function Dashboard() {
  const router = useRouter();
  const [confirmDialog, setConfirmDialog] = useState<{isOpen: boolean, title: string, description: string, onConfirm: () => void}>({
    isOpen: false,
    title: '',
    description: '',
    onConfirm: () => {}
  });
  const [renameDialog, setRenameDialog] = useState<{isOpen: boolean, id: string, title: string}>({
    isOpen: false,
    id: '',
    title: ''
  });
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [sortOrder, setSortOrder] = useState("newest");
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [activeFolderId, setActiveFolderId] = useState<string | null>('ALL');
  const [limit, setLimit] = useState(24);

  useEffect(() => {
    setLimit(24);
  }, [searchQuery, filterStatus, sortOrder, activeFolderId]);
  
  
  const [user, setUser] = useState<any>(null);
  const { activeWorkspace, activeRole, isLoading: workspaceLoading } = useWorkspace();
  const [qrModalData, setQrModalData] = useState<{ id: string, title: string } | null>(null);
  
  // QR Customization State
  const [qrFgColor, setQrFgColor] = useState("#000000");
  const [qrBgColor, setQrBgColor] = useState("#ffffff");
  const [qrLogoUrl, setQrLogoUrl] = useState("");

  // Folders & Multi-Select State
  const [selectedProjects, setSelectedProjects] = useState<string[]>([]);
  
  const [isMoveModalOpen, setIsMoveModalOpen] = useState(false);
  const [isCreateFolderModalOpen, setIsCreateFolderModalOpen] = useState(false);
  const [isFolderSidebarOpen, setIsFolderSidebarOpen] = useState(true);
  const [newFolderName, setNewFolderName] = useState("");
  const [targetFolder, setTargetFolder] = useState("Personal");
  const [projectToMove, setProjectToMove] = useState<string | null>(null);

  const { data: { projects = [], folders = [], totalProjects = 0 } = {}, isLoading: loading } = useQuery({
    queryKey: ['dashboard', activeWorkspace?.id, user?.id, limit, searchQuery, filterStatus, sortOrder, activeFolderId],
    queryFn: async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        router.push('/login');
        return { projects: [], folders: [], totalProjects: 0 };
      }
      setUser(session.user);

      let projectsQuery = supabase
        .from('ar_projects')
        .select('*', { count: 'exact' })
        .eq('is_deleted', false);

      if (activeWorkspace) {
        projectsQuery = projectsQuery.eq('workspace_id', activeWorkspace.id);
      } else {
        projectsQuery = projectsQuery.is('workspace_id', null).eq('user_id', session.user.id);
      }

      if (activeFolderId !== 'ALL') {
        if (activeFolderId === null) {
          projectsQuery = projectsQuery.is('folder_id', null);
        } else {
          projectsQuery = projectsQuery.eq('folder_id', activeFolderId);
        }
      }
      
      if (searchQuery) {
        projectsQuery = projectsQuery.ilike('title', `%${searchQuery}%`);
      }
      
      if (filterStatus === 'published') {
        projectsQuery = projectsQuery.eq('is_published', true);
      } else if (filterStatus === 'draft') {
        projectsQuery = projectsQuery.eq('is_published', false);
      }

      if (sortOrder === 'newest') {
        projectsQuery = projectsQuery.order('created_at', { ascending: false });
      } else {
        projectsQuery = projectsQuery.order('views', { ascending: false });
      }

      projectsQuery = projectsQuery.limit(limit);

      let foldersQuery = supabase
        .from('folders')
        .select('*')
        .order('created_at', { ascending: true });

      if (activeWorkspace) {
        foldersQuery = foldersQuery.eq('workspace_id', activeWorkspace.id);
      } else {
        foldersQuery = foldersQuery.is('workspace_id', null).eq('user_id', session.user.id);
      }

      const [ { data: projectsData, count }, { data: folderData } ] = await Promise.all([
        projectsQuery,
        foldersQuery
      ]);

      return { projects: projectsData || [], folders: folderData || [], totalProjects: count || 0 };
    },
    enabled: !workspaceLoading
  });

  const fetchData = () => {
    queryClient.invalidateQueries({ queryKey: ['dashboard'] });
  };

  const handleDelete = async (id: string, title: string) => {
    setConfirmDialog({
      isOpen: true,
      title: 'Hapus Proyek',
      description: `Apakah Anda yakin ingin memindahkan proyek "${title}" ke Tong Sampah?`,
      onConfirm: async () => {
        await supabase.from('ar_projects').update({ is_deleted: true }).eq('id', id);
        
        // Kirim Notifikasi
        supabase.from('notifications').insert({
          user_id: user?.id,
          title: 'Proyek Dihapus',
          message: `Proyek '${title}' telah dipindahkan ke Tong Sampah.`
        }).then();

        toast.success(`Proyek "${title}" dipindahkan ke Tong Sampah.`);
        fetchData();
      }
    });
  };

  const handleRename = async (id: string, oldTitle: string) => {
    setRenameDialog({ isOpen: true, id, title: oldTitle });
  };

  const executeRename = async (newTitle: string) => {
    if (newTitle && newTitle.trim() !== "" && newTitle !== renameDialog.title) {
      await supabase.from('ar_projects').update({ title: newTitle }).eq('id', renameDialog.id);
      toast.success('Nama proyek berhasil diubah.');
      fetchData();
    }
  };

  const handleDuplicate = async (project: any) => {
    
    const newProject = {
      ...project,
      id: undefined,
      created_at: undefined,
      title: `${project.title} (Copy)`,
      views: 0
    };
    await supabase.from('ar_projects').insert([newProject]);

    // Kirim Notifikasi
    supabase.from('notifications').insert({
      user_id: user?.id,
      title: 'Proyek Digandakan',
      message: `Berhasil menduplikasi proyek '${project.title}'.`
    }).then();

    toast.success(`Proyek "${project.title}" berhasil digandakan.`);
    fetchData();
  };

  const handleToggleSelect = (id: string) => {
    setSelectedProjects(prev => prev.includes(id) ? prev.filter(p => p !== id) : [...prev, id]);
  };

  const handleBulkDelete = async () => {
    setConfirmDialog({
      isOpen: true,
      title: 'Hapus Proyek Masal',
      description: `Apakah Anda yakin ingin menghapus ${selectedProjects.length} proyek terpilih?`,
      onConfirm: async () => {
        await supabase.from('ar_projects').update({ is_deleted: true }).in('id', selectedProjects);
        toast.success(`${selectedProjects.length} proyek berhasil dihapus.`);
        setSelectedProjects([]);
        fetchData();
      }
    });
  };

  const handleBulkMove = async () => {
    if (!targetFolder.trim()) return; // Here targetFolder is a folder ID or 'PERSONAL'
    const finalTargetId = targetFolder === 'PERSONAL' ? null : targetFolder;
    const ids = projectToMove ? [projectToMove] : selectedProjects;
    
    // Update DB
    await supabase.from('ar_projects').update({ folder_id: finalTargetId }).in('id', ids);
    
    setSelectedProjects([]);
    setProjectToMove(null);
    setIsMoveModalOpen(false);
    fetchData();
  };

  const handleCreateFolder = async () => {
    if (!newFolderName.trim() || !activeWorkspace) return;
    const { data, error } = await supabase.from('folders').insert({
      user_id: user.id,
      workspace_id: activeWorkspace.id,
      name: newFolderName.trim(),
      parent_id: activeFolderId === 'ALL' ? null : activeFolderId
    }).select().single();

    if (data) {
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
    }
    setNewFolderName("");
    setIsCreateFolderModalOpen(false);
  };

  const handleDeleteFolder = async (folderId: string, folderName: string) => {
    const subfolders = folders.filter(f => f.parent_id === folderId);
    const folderProjects = projects.filter(p => p.folder_id === folderId);
    
    let desc = `Apakah Anda yakin ingin menghapus folder "${folderName}"? `;
    if (folderProjects.length > 0) desc += `\n${folderProjects.length} proyek di dalamnya akan dipindahkan ke folder "Personal". `;
    if (subfolders.length > 0) desc += `\n${subfolders.length} sub-folder akan dihapus secara permanen.`;

    setConfirmDialog({
      isOpen: true,
      title: 'Hapus Folder',
      description: desc,
      onConfirm: async () => {
        await supabase.from('folders').delete().eq('id', folderId);
        toast.success(`Folder "${folderName}" berhasil dihapus.`);
        if (activeFolderId === folderId) setActiveFolderId(null);
        fetchData();
      }
    });
  };



  const getBreadcrumbs = (folderId: string | null) => {
    if (folderId === 'ALL' || !folderId) return [];
    const crumbs = [];
    let currentId: string | null = folderId;
    while (currentId) {
      const f = folders.find(x => x.id === currentId);
      if (f) {
        crumbs.unshift(f);
        currentId = f.parent_id;
      } else {
        break;
      }
    }
    return crumbs;
  };
  const breadcrumbSegments = getBreadcrumbs(activeFolderId);

  const buildFolderTree = (parentId: string | null, depth: number = 0): any[] => {
    return folders.filter(f => f.parent_id === parentId).flatMap(f => [
      { ...f, depth },
      ...buildFolderTree(f.id, depth + 1)
    ]);
  };
  const folderTree = buildFolderTree(null);

  
  const columns: ColumnDef<any>[] = [
    {
      accessorKey: "title",
      header: "Proyek",
      cell: ({ row }) => {
        const project = row.original;
        return (
          <div className="flex items-center gap-3 pl-2">
            <div className="absolute left-2 top-1/2 -translate-y-1/2">
              <input 
                type="checkbox"
                checked={selectedProjects.includes(project.id)}
                onChange={() => handleToggleSelect(project.id)}
                className="w-4 h-4 text-pln-blue border-gray-300 rounded focus:ring-pln-blue cursor-pointer"
              />
            </div>
            <div className="w-10 h-10 rounded-lg bg-gray-100 overflow-hidden shrink-0 border border-gray-200 flex items-center justify-center ml-6">
              {project.target_image_url ? (
                <img src={project.target_image_url} className="w-full h-full object-cover" />
              ) : (
                <Box size={16} className="text-gray-400" />
              )}
            </div>
            <div>
              <Link href={`/projects/${project.id}/edit`} className="font-bold text-gray-900 hover:text-pln-blue transition-colors line-clamp-1">{project.title}</Link>
              <span className="text-[10px] text-gray-500 flex items-center gap-1 mt-0.5"><Image size={10}/> Image Tracking</span>
            </div>
          </div>
        )
      },
    },
    {
      accessorKey: "folder_id",
      header: "Folder",
      cell: ({ row }) => {
        const project = row.original;
        const folder = folders.find(f => f.id === project.folder_id);
        return folder && folder.name !== 'Personal' ? (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-gray-100 text-gray-600 text-xs font-medium border border-gray-200">
            <Folder size={12} /> {folder.name}
          </span>
        ) : (
          <span className="text-gray-400 text-xs">-</span>
        );
      },
    },
    {
      accessorKey: "is_published",
      header: "Status",
      cell: ({ row }) => {
        const project = row.original;
        return (
          <span className={`inline-block px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${project.is_published ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
            {project.is_published ? 'Published' : 'Draft'}
          </span>
        );
      },
    },
    {
      accessorKey: "views",
      header: "Views",
      cell: ({ row }) => {
        return <div className="text-center font-mono text-sm text-gray-600">{row.original.views || 0}</div>;
      },
    },
    {
      accessorKey: "created_at",
      header: "Tgl Dibuat",
      cell: ({ row }) => {
        return <div className="text-sm text-gray-500">{new Date(row.original.created_at).toLocaleDateString('id-ID')}</div>;
      },
    },
    {
      id: "actions",
      header: () => <div className="text-right">Aksi</div>,
      cell: ({ row }) => {
        const project = row.original;
        return (
          <div className="flex items-center justify-end gap-2 pr-2">
            <button onClick={() => setQrModalData({ id: project.id, title: project.title })} className="p-2 text-gray-400 hover:text-pln-blue bg-white hover:bg-blue-50 border border-gray-200 rounded-lg transition-colors" title="QR Code">
              <QrCode size={16} />
            </button>
            {activeRole !== 'viewer' && (
              <Link href={`/projects/${project.id}/edit`} className="p-2 text-gray-400 hover:text-pln-blue bg-white hover:bg-blue-50 border border-gray-200 rounded-lg transition-colors" title="Edit">
                <Edit3 size={16} />
              </Link>
            )}
            <button onClick={() => { setProjectToMove(project.id); setIsMoveModalOpen(true); }} className="p-2 text-gray-400 hover:text-pln-blue bg-white hover:bg-blue-50 border border-gray-200 rounded-lg transition-colors" title="Pindahkan">
              <FolderInput size={16} />
            </button>
            {activeRole === 'admin' && (
              <button onClick={() => handleDelete(project.id, project.title)} className="p-2 text-gray-400 hover:text-red-500 bg-white hover:bg-red-50 border border-gray-200 rounded-lg transition-colors" title="Hapus">
                <Trash2 size={16} />
              </button>
            )}
          </div>
        );
      },
    },
  ];

  if (loading || workspaceLoading) {
    return (
      <div className="space-y-8 flex flex-col md:flex-row gap-8">
        <div className="w-full md:w-56 shrink-0 space-y-4">
          <div className="h-10 bg-gray-100 rounded-xl animate-pulse"></div>
          <div className="h-10 bg-gray-100 rounded-xl animate-pulse"></div>
          <div className="h-40 bg-gray-100 rounded-xl animate-pulse mt-8"></div>
        </div>
        <div className="flex-1 space-y-6">
          <div className="h-12 bg-gray-100 rounded-xl animate-pulse"></div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {[1,2,3,4,5,6].map(i => <div key={i} className="h-64 bg-gray-100 rounded-3xl animate-pulse"></div>)}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 flex flex-col md:flex-row gap-8">
      
      {/* Folder Sidebar */}
      <div className={`shrink-0 space-y-2 overflow-hidden transition-all duration-300 ease-in-out ${isFolderSidebarOpen ? 'w-full md:w-56 opacity-100' : 'w-0 opacity-0 hidden md:block'}`}>
        <h2 className="text-xs font-bold text-gray-400 uppercase tracking-wider px-3 mb-4">Folders</h2>
        
        <div className="space-y-1 mb-2">
          <button
            onClick={() => setActiveFolderId('ALL')}
            className={`w-full text-left px-4 py-2.5 rounded-xl text-sm font-medium flex items-center gap-3 transition-colors pr-4 ${activeFolderId === 'ALL' ? 'bg-pln-blue text-white shadow-md shadow-blue-900/20' : 'text-gray-600 hover:bg-gray-100'}`}
          >
            <LayoutGrid size={16} className={activeFolderId === 'ALL' ? 'text-white' : 'text-gray-400'} />
            Semua Proyek
          </button>
          
          <button
            onClick={() => setActiveFolderId(null)}
            className={`w-full text-left px-4 py-2.5 rounded-xl text-sm font-medium flex items-center gap-3 transition-colors pr-4 ${activeFolderId === null ? 'bg-pln-blue text-white shadow-md shadow-blue-900/20' : 'text-gray-600 hover:bg-gray-100'}`}
          >
            <Folder size={16} className={activeFolderId === null ? 'text-white' : 'text-gray-400'} />
            Personal
          </button>
        </div>

        {folderTree.map(folder => (
            <div key={folder.id} className="group relative flex items-center" style={{ paddingLeft: `${folder.depth * 0.75}rem` }}>
              <button
                onClick={() => setActiveFolderId(folder.id)}
                className={`w-full text-left px-4 py-2.5 rounded-xl text-sm font-medium flex items-center gap-3 transition-colors pr-10 ${activeFolderId === folder.id ? 'bg-pln-blue text-white shadow-md shadow-blue-900/20' : 'text-gray-600 hover:bg-gray-100'}`}
              >
                <Folder size={16} className={activeFolderId === folder.id ? 'text-white' : 'text-gray-400'} />
                {folder.name}
              </button>
              {activeRole === 'admin' && (
                <button 
                  onClick={() => handleDeleteFolder(folder.id, folder.name)}
                  className="absolute right-2 opacity-0 group-hover:opacity-100 p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"
                  title="Hapus Folder"
                >
                  <Trash2 size={14} />
                </button>
              )}
            </div>
        ))}
        {activeRole !== 'viewer' && (
          <button 
            onClick={() => setIsCreateFolderModalOpen(true)}
            className="w-full text-left px-4 py-2.5 rounded-xl text-sm font-medium flex items-center gap-3 text-pln-blue hover:bg-blue-50 transition-colors mt-4 border border-dashed border-blue-200"
          >
            <FolderPlus size={16} />
            Buat Folder Baru
          </button>
        )}
      </div>

      {/* Main Content */}
      <div className="flex-1 space-y-6 min-w-0">
        
        <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center gap-4">
          <div>
            <div className="flex items-center gap-2 text-2xl font-bold text-gray-900 mb-1">
              <button 
                onClick={() => setIsFolderSidebarOpen(!isFolderSidebarOpen)} 
                className="p-1.5 mr-2 -ml-1 text-gray-400 hover:text-pln-blue bg-gray-50 hover:bg-blue-50 rounded-lg transition-colors hidden md:block"
                title="Toggle Folders"
              >
                <PanelLeft size={20} />
              </button>
              <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Proyek Anda</h1>
              <p className="text-gray-500 text-sm mt-1 flex items-center gap-2">
                Kelola dan kembangkan pengalaman AR Anda
                {activeRole === 'viewer' && (
                   <span className="bg-gray-100 text-gray-500 px-2 py-0.5 rounded text-xs font-bold uppercase tracking-wider">Read Only</span>
                )}
              </p>
            </div>
            
            <div className="flex gap-2 sm:gap-3 shrink-0">
              {activeRole !== 'viewer' && (
                <>
                  <button 
                    onClick={() => setIsCreateFolderModalOpen(true)}
                    className="hidden sm:flex items-center gap-2 bg-white border border-gray-200 hover:border-gray-300 hover:bg-gray-50 text-gray-700 font-bold px-4 py-2.5 rounded-xl transition-all shadow-sm"
                  >
                    <FolderPlus size={18} />
                    <span className="hidden md:inline">Folder Baru</span>
                  </button>
                  
                  <Link 
                    href="/projects/new" 
                    className="flex items-center gap-2 bg-gray-900 hover:bg-black text-white font-bold px-5 py-2.5 rounded-xl transition-all shadow-sm hover:shadow-md"
                  >
                    <Plus size={20} />
                    <span className="hidden sm:inline">Buat Proyek</span>
                  </Link>
                </>
              )}
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-3 w-full xl:w-auto">
            
            {/* Bulk Actions */}
            {selectedProjects.length > 0 && (
              <>
                <button 
                  onClick={() => { setProjectToMove(null); setIsMoveModalOpen(true); }}
                  className="bg-pln-blue text-white px-4 py-2 rounded-xl text-sm font-bold shadow-sm shadow-blue-500/20 hover:bg-pln-blue-dark transition-colors flex items-center gap-2 animate-in fade-in zoom-in duration-200"
                >
                  <FolderInput size={16} />
                  Pindahkan ({selectedProjects.length})
                </button>
                {activeRole === 'admin' && (
                  <button 
                    onClick={handleBulkDelete}
                    className="bg-red-50 text-red-600 border border-red-100 px-4 py-2 rounded-xl text-sm font-bold shadow-sm hover:bg-red-100 transition-colors flex items-center gap-2 animate-in fade-in zoom-in duration-200"
                  >
                    <Trash2 size={16} />
                    Hapus ({selectedProjects.length})
                  </button>
                )}
              </>
            )}
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="bg-white border border-gray-200 rounded-xl px-4 py-2 text-sm focus:ring-2 focus:ring-pln-blue outline-none"
            >
              <option value="all">Semua Status</option>
              <option value="published">Published</option>
              <option value="draft">Draft</option>
            </select>
            <select
              value={sortOrder}
              onChange={(e) => setSortOrder(e.target.value)}
              className="bg-white border border-gray-200 rounded-xl px-4 py-2 text-sm focus:ring-2 focus:ring-pln-blue outline-none"
            >
              <option value="newest">Terbaru</option>
              <option value="popular">Terpopuler</option>
            </select>
            <input 
              type="text" 
              placeholder="Cari proyek..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="bg-white border border-gray-200 rounded-xl px-4 py-2 text-sm focus:ring-2 focus:ring-pln-blue outline-none w-full sm:w-auto flex-1"
            />
            <div className="flex bg-gray-100 rounded-xl p-1 border border-gray-200">
              <button 
                onClick={() => setViewMode('grid')}
                className={`p-1.5 rounded-lg transition-colors ${viewMode === 'grid' ? 'bg-white shadow-sm text-pln-blue' : 'text-gray-500 hover:text-gray-900'}`}
              >
                <LayoutGrid size={18} />
              </button>
              <button 
                onClick={() => setViewMode('list')}
                className={`p-1.5 rounded-lg transition-colors ${viewMode === 'list' ? 'bg-white shadow-sm text-pln-blue' : 'text-gray-500 hover:text-gray-900'}`}
              >
                <List size={18} />
              </button>
            </div>
          </div>
        </div>

        {viewMode === 'grid' ? (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ staggerChildren: 0.1 }}
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
          >
            {projects.map((project, index) => (
              <motion.div
                key={project.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05, ease: "easeOut" }}
              >
                <ProjectCard 
                key={project.id}
                id={project.id}
                title={project.title}
                type={project.tracking_type === 'image_tracking' ? 'Image Tracking' : 'Surface Tracking'}
                date={new Date(project.created_at).toLocaleDateString('id-ID')}
                status={project.is_published ? 'Published' : 'Draft'}
                views={project.views}
                icon={project.tracking_type === 'image_tracking' ? <Image size={16} className="text-blue-500" /> : <Box size={16} className="text-purple-500" />}
                targetImageUrl={project.target_image_url}
                folderName={folders.find(f => f.id === project.folder_id)?.name || 'Personal'}
                isSelected={selectedProjects.includes(project.id)}
                onToggleSelect={() => handleToggleSelect(project.id)}
                onRename={() => handleRename(project.id, project.title)}
                onDuplicate={() => handleDuplicate(project)}
                onDelete={() => handleDelete(project.id, project.title)}
                onShowQR={() => setQrModalData({ id: project.id, title: project.title })}
                onMove={() => { setProjectToMove(project.id); setIsMoveModalOpen(true); }}
                activeRole={activeRole}
              />
              </motion.div>
            ))}
          </motion.div>
        ) : (
          <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">

            <DataTable columns={columns} data={projects} />
            {projects.length < totalProjects && (
              <div className="flex justify-center mt-4">
                <button 
                  onClick={() => setLimit(prev => prev + 24)}
                  className="px-6 py-2 bg-white border border-gray-200 text-gray-700 font-medium rounded-full shadow-sm hover:bg-gray-50 hover:text-pln-blue transition-colors"
                >
                  Muat Lebih Banyak
                </button>
              </div>
            )}
          </div>

        )}

        {projects.length === 0 && viewMode === 'grid' && (
          <div className="col-span-1 sm:col-span-2 lg:col-span-3 xl:col-span-3 flex flex-col items-center justify-center bg-gray-50 rounded-3xl border border-dashed border-gray-300 text-gray-500 p-10 min-h-[250px] mt-6">
            <Box size={48} className="mb-4 text-gray-300" />
            <p className="font-bold">Belum ada proyek</p>
            <p className="text-sm">Klik kartu biru untuk membuat proyek pertama Anda.</p>
          </div>
        )}
      </div>

      {/* QR Code Modal */}
      {qrModalData && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl w-full max-w-sm shadow-2xl overflow-hidden flex flex-col relative">
            <button 
              onClick={() => setQrModalData(null)} 
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-900 transition-colors p-1 bg-gray-100 hover:bg-gray-200 rounded-full"
            >
              <X size={20} />
            </button>
            
            <div className="p-8 flex flex-col items-center pt-10">
              <h2 className="text-xl font-bold text-gray-900 text-center mb-1 line-clamp-1">{qrModalData.title}</h2>
              <p className="text-xs text-gray-500 text-center mb-6">
                Scan menggunakan kamera HP
              </p>
              
              <div className="bg-white p-2 rounded-2xl border-2 border-gray-100 shadow-inner mb-4" id="qr-code-dashboard">
                <QRCodeSVG 
                  value={`${window.location.origin}/ar-viewer/${qrModalData.id}`} 
                  size={200}
                  level="H"
                  includeMargin={true}
                  fgColor={qrFgColor}
                  bgColor={qrBgColor}
                  imageSettings={qrLogoUrl ? {
                    src: qrLogoUrl,
                    height: 48,
                    width: 48,
                    excavate: true,
                  } : undefined}
                />
              </div>

              <div className="w-full bg-gray-50 rounded-xl p-3 mb-6 space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-gray-700">Warna QR</label>
                  <input type="color" value={qrFgColor} onChange={(e) => setQrFgColor(e.target.value)} className="w-6 h-6 rounded cursor-pointer border-0 p-0" />
                </div>
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-gray-700">Warna Latar</label>
                  <input type="color" value={qrBgColor} onChange={(e) => setQrBgColor(e.target.value)} className="w-6 h-6 rounded cursor-pointer border-0 p-0" />
                </div>
                <div>
                  <label className="text-xs font-bold text-gray-700 block mb-1">URL Logo (Tengah)</label>
                  <input 
                    type="text" 
                    placeholder="https://.../logo.png" 
                    value={qrLogoUrl}
                    onChange={(e) => setQrLogoUrl(e.target.value)}
                    className="w-full text-xs p-2 border border-gray-200 rounded-lg outline-none focus:ring-1 focus:ring-pln-blue"
                  />
                </div>
              </div>

              <div className="flex flex-col w-full gap-2">
                <button 
                  onClick={() => {
                    const svg = document.querySelector('#qr-code-dashboard svg');
                    if (!svg) return;
                    const svgData = new XMLSerializer().serializeToString(svg);
                    const canvas = document.createElement("canvas");
                    const ctx = canvas.getContext("2d");
                    const img = new window.Image();
                    img.onload = () => {
                      canvas.width = img.width;
                      canvas.height = img.height;
                      ctx?.drawImage(img, 0, 0);
                      const pngFile = canvas.toDataURL("image/png");
                      const downloadLink = document.createElement("a");
                      downloadLink.download = `QR-${qrModalData.title.replace(/\s+/g, '-')}.png`;
                      downloadLink.href = `${pngFile}`;
                      downloadLink.click();
                    };
                    img.src = "data:image/svg+xml;base64," + btoa(unescape(encodeURIComponent(svgData)));
                  }}
                  className="flex items-center justify-center gap-2 w-full py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl font-bold transition-colors"
                >
                  <Download size={16} />
                  Download
                </button>
                
                <Link 
                  href={`/ar-viewer/${qrModalData.id}`}
                  target="_blank"
                  className="flex items-center justify-center gap-2 w-full py-2.5 bg-pln-blue hover:bg-pln-blue-dark text-white rounded-xl font-bold transition-colors"
                >
                  <ExternalLink size={16} />
                  Buka AR Viewer
                </Link>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Create Folder Modal */}
      {isCreateFolderModalOpen && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl w-full max-w-sm shadow-2xl p-6">
            <h2 className="text-lg font-bold text-gray-900 mb-4">Buat Folder Baru</h2>
            <input 
              type="text" 
              value={newFolderName}
              onChange={(e) => setNewFolderName(e.target.value)}
              placeholder="Nama Folder (Misal: Portofolio)" 
              className="w-full bg-gray-50 border border-gray-200 rounded-xl py-3 px-4 focus:ring-2 focus:ring-pln-blue outline-none transition-shadow text-sm mb-6"
              autoFocus
              onKeyDown={(e) => { if (e.key === 'Enter') handleCreateFolder(); }}
            />
            <div className="flex justify-end gap-3">
              <button onClick={() => setIsCreateFolderModalOpen(false)} className="px-4 py-2 text-sm font-bold text-gray-500 hover:bg-gray-100 rounded-xl transition-colors">Batal</button>
              <button onClick={handleCreateFolder} className="px-4 py-2 text-sm font-bold text-white bg-pln-blue hover:bg-pln-blue-dark rounded-xl transition-colors shadow-sm">Buat Folder</button>
            </div>
          </div>
        </div>
      )}

      {/* Move To Modal */}
      {isMoveModalOpen && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl w-full max-w-sm shadow-2xl p-6 flex flex-col max-h-[80vh]">
            <h2 className="text-lg font-bold text-gray-900 mb-1">Pindahkan Proyek</h2>
            <p className="text-sm text-gray-500 mb-4">Pilih folder tujuan untuk memindahkan {projectToMove ? '1 proyek' : `${selectedProjects.length} proyek`}.</p>
            
            <div className="overflow-y-auto space-y-2 mb-6 border border-gray-100 p-2 rounded-2xl bg-gray-50 flex-1">
                <select 
                  value={targetFolder} 
                  onChange={(e) => setTargetFolder(e.target.value)}
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-pln-blue outline-none"
                >
                  <option value="PERSONAL">Personal (Tanpa Folder)</option>
                  {folderTree.map(folder => (
                    <option key={folder.id} value={folder.id}>
                      {'\u00A0'.repeat(folder.depth * 4)} {folder.name}
                    </option>
                  ))}
                </select></div>

            <div className="flex justify-end gap-3 mt-auto">
              <button onClick={() => setIsMoveModalOpen(false)} className="px-4 py-2 text-sm font-bold text-gray-500 hover:bg-gray-100 rounded-xl transition-colors">Batal</button>
              <button onClick={handleBulkMove} className="px-4 py-2 text-sm font-bold text-white bg-pln-blue hover:bg-pln-blue-dark rounded-xl transition-colors shadow-sm">Pindahkan ke {targetFolder}</button>
            </div>
          </div>
        </div>
      )}
      {/* Global Modals */}
      <ConfirmDialog 
        isOpen={confirmDialog.isOpen} 
        onOpenChange={(open) => setConfirmDialog(prev => ({...prev, isOpen: open}))}
        title={confirmDialog.title}
        description={confirmDialog.description}
        onConfirm={confirmDialog.onConfirm}
        confirmText="Ya, Lanjutkan"
        cancelText="Batal"
      />

      <RenameDialog
        isOpen={renameDialog.isOpen}
        onOpenChange={(open) => setRenameDialog(prev => ({...prev, isOpen: open}))}
        title="Ganti Nama Proyek"
        initialValue={renameDialog.title}
        onConfirm={executeRename}
      />
    </div>
  );
}

