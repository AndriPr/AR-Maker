"use client";

import { Image, Box, Play, Edit3, Trash2, Plus, QrCode, X, Download, ExternalLink, MoreVertical, Link as LinkIcon, Filter, Copy, LayoutGrid, List, Folder, FolderPlus, Tag, Check, FolderInput, PanelLeft } from 'lucide-react';
import Link from 'next/link';
import React, { useEffect, useState, useMemo } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import { QRCodeSVG } from 'qrcode.react';

export default function Dashboard() {
  const router = useRouter();
  const [projects, setProjects] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [sortOrder, setSortOrder] = useState("newest");
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [activeFolderId, setActiveFolderId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [user, setUser] = useState<any>(null);
  const [qrModalData, setQrModalData] = useState<{ id: string, title: string } | null>(null);
  
  // QR Customization State
  const [qrFgColor, setQrFgColor] = useState("#000000");
  const [qrBgColor, setQrBgColor] = useState("#ffffff");
  const [qrLogoUrl, setQrLogoUrl] = useState("");

  // Folders & Multi-Select State
  const [selectedProjects, setSelectedProjects] = useState<string[]>([]);
  const [folders, setFolders] = useState<any[]>([]);
  const [isMoveModalOpen, setIsMoveModalOpen] = useState(false);
  const [isCreateFolderModalOpen, setIsCreateFolderModalOpen] = useState(false);
  const [isFolderSidebarOpen, setIsFolderSidebarOpen] = useState(true);
  const [newFolderName, setNewFolderName] = useState("");
  const [targetFolder, setTargetFolder] = useState("Personal");
  const [projectToMove, setProjectToMove] = useState<string | null>(null);

  useEffect(() => {
    fetchData();
    fetchData();
  }, [router]);

  const fetchData = async () => {
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
      .eq('is_deleted', false)
      .order('created_at', { ascending: false });

    if (error) {
      setFetchError(error.message);
      console.error("Fetch error:", error);
    }

    const { data: folderData } = await supabase
      .from('folders')
      .select('*')
      .eq('user_id', session.user.id)
      .order('created_at', { ascending: true });

    if (folderData) {
      setFolders(folderData);
    }

    if (data) {
      setProjects(data);
    }
    setLoading(false);
  };

  const handleDelete = async (id: string, title: string) => {
    if (confirm(`Apakah Anda yakin ingin memindahkan proyek "${title}" ke Tong Sampah?`)) {
      await supabase.from('ar_projects').update({ is_deleted: true }).eq('id', id);
      
      // Kirim Notifikasi
      supabase.from('notifications').insert({
        user_id: user?.id,
        title: 'Proyek Dihapus',
        message: `Proyek '${title}' telah dipindahkan ke Tong Sampah.`
      }).then();

      fetchData();
    }
  };

  const handleRename = async (id: string, oldTitle: string) => {
    const newTitle = prompt("Masukkan judul baru:", oldTitle);
    if (newTitle && newTitle.trim() !== "" && newTitle !== oldTitle) {
      await supabase.from('ar_projects').update({ title: newTitle }).eq('id', id);
      fetchData();
    }
  };

  const handleDuplicate = async (project: any) => {
    setLoading(true);
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

    fetchData();
  };

  const handleToggleSelect = (id: string) => {
    setSelectedProjects(prev => prev.includes(id) ? prev.filter(p => p !== id) : [...prev, id]);
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
    if (!newFolderName.trim()) return;
    const { data, error } = await supabase.from('folders').insert({
      user_id: user.id,
      name: newFolderName.trim(),
      parent_id: activeFolderId
    }).select().single();

    if (data) {
      setFolders([...folders, data]);
    }
    setNewFolderName("");
    setIsCreateFolderModalOpen(false);
  };

  const handleDeleteFolder = async (folderId: string, folderName: string) => {
    if (confirm(`Hapus folder "${folderName}"? Proyek di dalamnya akan dipindahkan ke "Personal".`)) {
      // Supabase ON DELETE CASCADE is NOT on ar_projects, it's ON DELETE SET NULL which moves them to Personal (null)!
      await supabase.from('folders').delete().eq('id', folderId);
      
      if (activeFolderId === folderId) setActiveFolderId(null);
      fetchData();
    }
  };

  const filteredProjects = projects
    .filter(p => p.folder_id === activeFolderId)
    .filter(p => p.title?.toLowerCase().includes(searchQuery.toLowerCase()))
    .filter(p => filterStatus === 'all' ? true : filterStatus === 'published' ? p.is_published : !p.is_published)
    .sort((a, b) => sortOrder === 'newest' ? new Date(b.created_at).getTime() - new Date(a.created_at).getTime() : (b.views || 0) - (a.views || 0));

  const getBreadcrumbs = (folderId: string | null) => {
    if (!folderId) return [];
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

  if (loading) {
    return <div className="flex h-[50vh] items-center justify-center text-gray-500 font-bold">Memuat proyek...</div>;
  }

  return (
    <div className="space-y-8 flex flex-col md:flex-row gap-8">
      
      {/* Folder Sidebar */}
      <div className={`shrink-0 space-y-2 overflow-hidden transition-all duration-300 ease-in-out ${isFolderSidebarOpen ? 'w-full md:w-56 opacity-100' : 'w-0 opacity-0 hidden md:block'}`}>
        <h2 className="text-xs font-bold text-gray-400 uppercase tracking-wider px-3 mb-4">Folders</h2>
        {folderTree.map(folder => (
            <div key={folder.id} className="group relative flex items-center" style={{ paddingLeft: `${folder.depth * 0.75}rem` }}>
              <button
                onClick={() => setActiveFolderId(folder.id)}
                className={`w-full text-left px-4 py-2.5 rounded-xl text-sm font-medium flex items-center gap-3 transition-colors pr-10 ${activeFolderId === folder.id ? 'bg-pln-blue text-white shadow-md shadow-blue-900/20' : 'text-gray-600 hover:bg-gray-100'}`}
              >
                <Folder size={16} className={activeFolderId === folder.id ? 'text-white' : 'text-gray-400'} />
                {folder.name}
              </button>
              <button 
                onClick={(e) => { e.stopPropagation(); handleDeleteFolder(folder.id, folder.name); }} 
                className={`absolute right-2 p-1.5 rounded-lg transition-all opacity-0 group-hover:opacity-100 ${activeFolderId === folder.id ? 'text-blue-200 hover:text-white hover:bg-blue-600' : 'text-gray-400 hover:text-red-500 hover:bg-red-50'}`}
                title="Hapus Folder"
              >
                <Trash2 size={14} />
              </button>
            </div>
        ))}
        <button 
          onClick={() => setIsCreateFolderModalOpen(true)}
          className="w-full text-left px-4 py-2.5 rounded-xl text-sm font-medium flex items-center gap-3 text-pln-blue hover:bg-blue-50 transition-colors mt-4 border border-dashed border-blue-200"
        >
          <FolderPlus size={16} />
          Buat Folder Baru
        </button>
      </div>

      {/* Main Content */}
      <div className="flex-1 space-y-6 min-w-0">
        {fetchError && (
          <div className="bg-red-50 text-red-500 p-4 rounded-xl border border-red-200">
            <strong>Error Fetching Projects:</strong> {fetchError}
          </div>
        )}
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
              <span className="cursor-pointer hover:text-pln-blue transition-colors" onClick={() => setActiveFolderId(null)}>My Projects</span>
              {breadcrumbSegments.map((segment, index) => {
                const isLast = index === breadcrumbSegments.length - 1;
                return (
                  <React.Fragment key={segment.id}>
                    <span className="text-gray-300">/</span>
                    <span 
                      className={isLast ? "text-gray-900" : "text-gray-500 cursor-pointer hover:text-pln-blue transition-colors"}
                      onClick={() => !isLast && setActiveFolderId(segment.id)}
                    >
                      {segment.name}
                    </span>
                  </React.Fragment>
                );
              })}
            </div>
            <p className="text-gray-500 text-sm">Kelola dan edit pengalaman Augmented Reality Anda.</p>
          </div>
          <div className="flex flex-wrap items-center gap-3 w-full xl:w-auto">
            
            {/* Bulk Actions */}
            {selectedProjects.length > 0 && (
              <button 
                onClick={() => { setProjectToMove(null); setIsMoveModalOpen(true); }}
                className="bg-pln-blue text-white px-4 py-2 rounded-xl text-sm font-bold shadow-sm shadow-blue-500/20 hover:bg-pln-blue-dark transition-colors flex items-center gap-2 animate-in fade-in zoom-in duration-200"
              >
                <FolderInput size={16} />
                Pindahkan ({selectedProjects.length})
              </button>
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
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredProjects.map((project) => (
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
              />
            ))}
          </div>
        ) : (
          <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-100 text-xs uppercase text-gray-500 font-bold tracking-wider">
                    <th className="p-4 pl-6">Proyek</th>
                    <th className="p-4">Folder</th>
                    <th className="p-4">Status</th>
                    <th className="p-4 text-center">Views</th>
                    <th className="p-4">Tgl Dibuat</th>
                    <th className="p-4 pr-6 text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {filteredProjects.map(project => (
                    <tr key={project.id} className={`transition-colors ${selectedProjects.includes(project.id) ? 'bg-blue-50/50' : 'hover:bg-blue-50/30'}`}>
                      <td className="p-4 pl-6 relative">
                        <div className="absolute left-2 top-1/2 -translate-y-1/2">
                          <input 
                            type="checkbox"
                            checked={selectedProjects.includes(project.id)}
                            onChange={() => handleToggleSelect(project.id)}
                            className="w-4 h-4 text-pln-blue border-gray-300 rounded focus:ring-pln-blue cursor-pointer"
                          />
                        </div>
                        <div className="flex items-center gap-3 pl-4">
                          <div className="w-10 h-10 rounded-lg bg-gray-100 overflow-hidden shrink-0 border border-gray-200 flex items-center justify-center">
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
                      </td>
                      <td className="p-4">
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-gray-100 text-gray-600 text-xs font-medium border border-gray-200">
                          <Folder size={12} /> {folders.find(f => f.id === project.folder_id)?.name || 'Personal'}
                        </span>
                      </td>
                      <td className="p-4">
                        <span className={`inline-block px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${project.is_published ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                          {project.is_published ? 'Published' : 'Draft'}
                        </span>
                      </td>
                      <td className="p-4 text-center font-mono text-sm text-gray-600">{project.views || 0}</td>
                      <td className="p-4 text-sm text-gray-500">{new Date(project.created_at).toLocaleDateString('id-ID')}</td>
                      <td className="p-4 pr-6 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button onClick={() => setQrModalData({ id: project.id, title: project.title })} className="p-2 text-gray-400 hover:text-pln-blue bg-white hover:bg-blue-50 border border-gray-200 rounded-lg transition-colors" title="QR Code">
                            <QrCode size={16} />
                          </button>
                          <Link href={`/projects/${project.id}/edit`} className="p-2 text-gray-400 hover:text-pln-blue bg-white hover:bg-blue-50 border border-gray-200 rounded-lg transition-colors" title="Edit">
                            <Edit3 size={16} />
                          </Link>
                          <button onClick={() => { setProjectToMove(project.id); setIsMoveModalOpen(true); }} className="p-2 text-gray-400 hover:text-pln-blue bg-white hover:bg-blue-50 border border-gray-200 rounded-lg transition-colors" title="Pindahkan">
                            <FolderInput size={16} />
                          </button>
                          <button onClick={() => handleDelete(project.id, project.title)} className="p-2 text-gray-400 hover:text-red-500 bg-white hover:bg-red-50 border border-gray-200 rounded-lg transition-colors" title="Hapus">
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {filteredProjects.length === 0 && (
                    <tr>
                      <td colSpan={6} className="p-8 text-center text-gray-500 text-sm">Tidak ada proyek yang ditemukan.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
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
    </div>
  );
}

function ProjectCard({ id, title, type, date, status, views, icon, targetImageUrl, folderName, onRename, onDuplicate, onDelete, onShowQR, isSelected, onToggleSelect, onMove }: any) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const handleCopyLink = (e: any) => {
    e.preventDefault();
    e.stopPropagation();
    navigator.clipboard.writeText(`${window.location.origin}/ar-viewer/${id}`);
    alert('Link berhasil disalin!');
    setIsMenuOpen(false);
  };

  return (
    <div className="relative">
      <Link href={`/projects/${id}/edit`} className="bg-white border border-gray-100 rounded-3xl overflow-hidden shadow-sm hover:shadow-md transition-shadow group flex flex-col min-h-[250px] cursor-pointer relative">
        <div 
          className="h-32 bg-gray-100 relative group-hover:bg-gray-200 transition-colors flex items-center justify-center bg-cover bg-center"
          style={targetImageUrl ? { backgroundImage: `url(${targetImageUrl})` } : {}}
        >
          {targetImageUrl && <div className="absolute inset-0 bg-black/30 group-hover:bg-black/20 transition-colors"></div>}
          
          <div className="absolute top-3 left-3 z-20">
            <div 
              onClick={(e) => { e.preventDefault(); e.stopPropagation(); onToggleSelect(); }}
              className={`w-6 h-6 rounded-lg border-2 flex items-center justify-center transition-all cursor-pointer ${isSelected ? 'bg-pln-blue border-pln-blue text-white shadow-md scale-110' : 'bg-white/90 border-gray-300 text-transparent hover:border-pln-blue opacity-0 group-hover:opacity-100 shadow-sm'}`}
            >
              <Check size={14} />
            </div>
          </div>

          <div className="absolute top-3 right-3 z-20">
            <button 
              onClick={(e) => { e.preventDefault(); e.stopPropagation(); setIsMenuOpen(!isMenuOpen); }} 
              className={`p-1.5 rounded-lg shadow-sm transition-colors ${isMenuOpen || targetImageUrl ? 'bg-white/90 text-gray-700 hover:text-pln-blue' : 'bg-white/90 text-gray-400 hover:text-pln-blue opacity-0 group-hover:opacity-100'}`}
              title="Menu Opsi"
            >
              <MoreVertical size={18} />
            </button>
          </div>
          
          {!targetImageUrl && icon}
        </div>
      
      <div className="p-5 flex flex-col flex-1">
        <div className="flex justify-between items-start mb-2">
          <h3 className="font-bold text-gray-900 line-clamp-1 pr-2">{title}</h3>
        </div>
        
        <div className="flex items-center gap-2 text-xs font-medium text-gray-500 mb-4 flex-wrap">
          <span className="flex items-center gap-1">
            {icon} {type}
          </span>
          <span className="text-gray-300">•</span>
          <span className="flex items-center gap-1 bg-gray-50 px-2 py-0.5 rounded-md line-clamp-1 border border-gray-100">
            <Folder size={10} /> {folderName}
          </span>
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
              {views || 0}
            </div>
          )}
        </div>
      </div>
      </Link>

      {/* Dropdown Menu */}
      {isMenuOpen && (
        <div className="absolute top-12 right-3 w-48 bg-white rounded-xl shadow-xl border border-gray-100 py-2 z-30 transform origin-top-right transition-all">
          <button
            onClick={(e) => { e.preventDefault(); e.stopPropagation(); setIsMenuOpen(false); onRename(); }}
            className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 hover:text-pln-blue flex items-center gap-2"
          >
            <Edit3 size={14} /> Ganti Nama
          </button>
          <button
            onClick={(e) => { e.preventDefault(); e.stopPropagation(); setIsMenuOpen(false); onDuplicate(); }}
            className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 hover:text-pln-blue flex items-center gap-2"
          >
            <Copy size={14} /> Gandakan Proyek
          </button>
          <button
            onClick={(e) => { e.preventDefault(); e.stopPropagation(); setIsMenuOpen(false); onMove(); }}
            className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 hover:text-pln-blue flex items-center gap-2"
          >
            <FolderInput size={14} /> Pindahkan
          </button>
          {status === 'Published' && (
            <>
              <button
                onClick={handleCopyLink}
                className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 hover:text-pln-blue flex items-center gap-2"
              >
                <LinkIcon size={14} /> Copy Share Link
              </button>
              <button
                onClick={(e) => { e.preventDefault(); e.stopPropagation(); setIsMenuOpen(false); onShowQR(); }}
                className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 hover:text-green-600 flex items-center gap-2"
              >
                <QrCode size={14} /> Tampilkan QR Code
              </button>
            </>
          )}
          <div className="h-px bg-gray-100 my-1"></div>
          <button
            onClick={(e) => { e.preventDefault(); e.stopPropagation(); setIsMenuOpen(false); onDelete(); }}
            className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 flex items-center gap-2"
          >
            <Trash2 size={14} /> Hapus Proyek
          </button>
        </div>
      )}
      
      {/* Invisible overlay to close menu when clicking outside */}
      {isMenuOpen && (
        <div 
          className="fixed inset-0 z-20"
          onClick={(e) => { e.preventDefault(); e.stopPropagation(); setIsMenuOpen(false); }}
        ></div>
      )}
    </div>
  );
}
