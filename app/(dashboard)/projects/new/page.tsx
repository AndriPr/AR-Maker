"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { Image, Box, ArrowRight, Loader2, File, Contact2, BookOpen, PartyPopper } from 'lucide-react';
import { useWorkspace } from '@/components/providers/WorkspaceProvider';

export default function NewProjectPage() {
  const router = useRouter();
  const [title, setTitle] = useState('');
  const [trackingType, setTrackingType] = useState('image_tracking');
  const [selectedTemplate, setSelectedTemplate] = useState('blank');
  const [folderId, setFolderId] = useState<string>('PERSONAL');
  const [isCreatingNewFolder, setIsCreatingNewFolder] = useState(false);
  const [newFolderInput, setNewFolderInput] = useState('');
  const [existingFolders, setExistingFolders] = useState<{id: string, name: string}[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { activeWorkspace, isLoading: workspaceLoading } = useWorkspace();

  const templates = [
    { id: 'blank', name: 'Blank Project', icon: File, type: 'image_tracking', desc: 'Mulai dari kanvas kosong.' },
    { id: 'business_card', name: 'Kartu Nama AR', icon: Contact2, type: 'image_tracking', desc: 'Munculkan info kontak 3D di atas kartu.' },
    { id: 'catalog', name: 'Katalog Produk', icon: BookOpen, type: 'image_tracking', desc: 'Tampilkan produk 3D dari brosur.' },
    { id: 'wedding', name: 'Undangan Interaktif', icon: PartyPopper, type: 'image_tracking', desc: 'Galeri foto melayang di undangan.' }
  ];

  // Fetch existing folders for autocomplete
  useEffect(() => {
    const fetchFolders = async () => {
      if (!activeWorkspace) return;
      
      const { data } = await supabase
        .from('folders')
        .select('id, name')
        .eq('workspace_id', activeWorkspace.id)
        .order('created_at', { ascending: true });
        
      if (data) {
        setExistingFolders(data);
      }
    };
    if (!workspaceLoading) {
      fetchFolders();
    }
  }, [activeWorkspace, workspaceLoading]);

  const handleSelectTemplate = (tmpl: any) => {
    setSelectedTemplate(tmpl.id);
    setTrackingType(tmpl.type);
    if (tmpl.id !== 'blank' && !title) {
      setTitle(tmpl.name);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    setLoading(true);
    setError(null);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error("Silakan login terlebih dahulu.");
      if (!activeWorkspace) throw new Error("Silakan pilih Workspace terlebih dahulu.");

      // Handle Folder Creation
      let finalFolderId = null; // null means Personal/Root
      
      if (isCreatingNewFolder && newFolderInput.trim()) {
        const { data: folderData, error: folderError } = await supabase
          .from('folders')
          .insert({
            user_id: session.user.id,
            workspace_id: activeWorkspace.id,
            name: newFolderInput.trim()
          })
          .select()
          .single();
          
        if (folderError) throw folderError;
        finalFolderId = folderData.id;
      } else if (folderId !== 'PERSONAL' && folderId !== 'NEW') {
        finalFolderId = folderId;
      }

      let initialSceneData: any = { elements: [] };

      if (selectedTemplate === 'business_card') {
        initialSceneData.elements = [
          { id: crypto.randomUUID(), type: '3d_text', name: 'Nama Anda', content: 'Nama Anda', position: [0, 0.5, 0], rotation: [0, 0, 0], scale: [1, 1, 1], color: '#ffffff' },
          { id: crypto.randomUUID(), type: '3d_text', name: 'Jabatan', content: 'Jabatan / Pekerjaan', position: [0, 0, 0], rotation: [0, 0, 0], scale: [0.5, 0.5, 0.5], color: '#aaaaaa' },
          { id: crypto.randomUUID(), type: 'ui_button', name: 'Tombol Website', buttonText: 'Kunjungi Website', actionTargetId: '', actionAnimation: '', position: [0, -0.8, 0], rotation: [0, 0, 0], scale: [1, 1, 1] }
        ];
      } else if (selectedTemplate === 'catalog') {
        initialSceneData.elements = [
          { id: crypto.randomUUID(), type: '3d_text', name: 'Nama Produk', content: 'PRODUK SUPER', position: [0, 1.2, 0], rotation: [0, 0, 0], scale: [1, 1, 1], color: '#ffffff' },
          { id: crypto.randomUUID(), type: '3d_shape', shapeType: 'box', name: 'Kotak Produk', position: [0, 0, 0], rotation: [0, 0, 0], scale: [1, 1, 1], color: '#pln-blue' },
          { id: crypto.randomUUID(), type: 'ui_button', name: 'Beli Sekarang', buttonText: 'Beli Sekarang', actionTargetId: '', actionAnimation: '', position: [0, -1.2, 0], rotation: [0, 0, 0], scale: [1, 1, 1] }
        ];
      } else if (selectedTemplate === 'wedding') {
        initialSceneData.elements = [
          { id: crypto.randomUUID(), type: '3d_shape', shapeType: 'plane', name: 'Foto Mempelai 1', position: [-1.2, 0, 0], rotation: [0, 0, 0], scale: [1, 1.5, 1], color: '#ffcccc' },
          { id: crypto.randomUUID(), type: '3d_shape', shapeType: 'plane', name: 'Foto Utama', position: [0, 0, 0.2], rotation: [0, 0, 0], scale: [1.2, 1.8, 1], color: '#ffffff' },
          { id: crypto.randomUUID(), type: '3d_shape', shapeType: 'plane', name: 'Foto Mempelai 2', position: [1.2, 0, 0], rotation: [0, 0, 0], scale: [1, 1.5, 1], color: '#ccffcc' },
          { id: crypto.randomUUID(), type: '3d_text', name: 'Teks Undangan', content: 'Undangan Pernikahan', position: [0, -1.2, 0], rotation: [0, 0, 0], scale: [0.5, 0.5, 0.5], color: '#ffffff' }
        ];
      }

      // Insert new project to database
      const { data, error: dbError } = await supabase
        .from('ar_projects')
        .insert({
          user_id: session.user.id,
          workspace_id: activeWorkspace.id,
          title: title,
          tracking_type: trackingType,
          is_published: false,
          folder_id: finalFolderId,
          scene_data: initialSceneData
        })
        .select()
        .single();

      if (dbError) throw dbError;

      // Create Notification (Fire and forget)
      supabase.from('notifications').insert({
        user_id: session.user.id,
        title: 'Proyek Baru Dibuat',
        message: `Proyek '${title}' berhasil ditambahkan ke ruang kerja Anda.`
      }).then();

      // Redirect to editor
      if (data) {
        router.push(`/projects/${data.id}/edit`);
      }
    } catch (err: any) {
      setError(err.message);
      setLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6 mt-10">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Buat Proyek AR Baru</h1>
        <p className="text-gray-500 mt-2">Pilih jenis pelacakan (tracking) dan beri nama proyek Anda.</p>
      </div>

      {error && (
        <div className="p-4 bg-red-50 text-red-600 rounded-xl border border-red-100 text-sm font-medium">
          {error}
        </div>
      )}

      {/* Template Selection */}
      <div className="mb-8">
        <h2 className="text-sm font-bold text-gray-700 mb-3">Mulai dari Template (Opsional)</h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {templates.map(tmpl => {
            const Icon = tmpl.icon;
            const isSelected = selectedTemplate === tmpl.id;
            return (
              <div 
                key={tmpl.id}
                onClick={() => handleSelectTemplate(tmpl)}
                className={`p-4 rounded-2xl border-2 cursor-pointer transition-all ${isSelected ? 'border-pln-blue bg-blue-50' : 'border-gray-100 bg-white hover:border-blue-200'}`}
              >
                <Icon size={24} className={`mb-2 ${isSelected ? 'text-pln-blue' : 'text-gray-400'}`} />
                <h3 className={`font-bold text-sm ${isSelected ? 'text-pln-blue-dark' : 'text-gray-900'}`}>{tmpl.name}</h3>
              </div>
            );
          })}
        </div>
      </div>

      <form onSubmit={handleSubmit} className="bg-white rounded-3xl p-6 sm:p-8 shadow-sm border border-gray-100 space-y-8">
        
        {/* Nama Proyek */}
        <div className="mb-8">
          <label className="block text-sm font-bold text-gray-700 mb-2">Nama Proyek</label>
          <input 
            type="text" 
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Misal: Brosur Interaktif V1" 
            className="w-full bg-gray-50 border border-gray-200 rounded-xl py-3 px-4 focus:ring-2 focus:ring-pln-blue outline-none transition-shadow text-lg font-medium"
            required
            autoFocus
          />
        </div>

        {/* Folder Penyimpanan */}
        <div className="mb-8">
          <label className="block text-sm font-bold text-gray-700 mb-2">Simpan di Folder</label>
          <div className="flex flex-col gap-3">
            <select
              value={isCreatingNewFolder ? 'NEW' : folderId}
              onChange={(e) => {
                if (e.target.value === 'NEW') {
                  setIsCreatingNewFolder(true);
                } else {
                  setIsCreatingNewFolder(false);
                  setFolderId(e.target.value);
                }
              }}
              className="w-full bg-white border border-gray-200 rounded-xl py-3 px-4 focus:ring-2 focus:ring-pln-blue outline-none transition-shadow text-sm"
            >
              <option value="PERSONAL">Personal (Tanpa Folder)</option>
              {existingFolders.map(folder => (
                <option key={folder.id} value={folder.id}>{folder.name}</option>
              ))}
              <option value="NEW" className="font-bold text-pln-blue">+ Buat Folder Baru</option>
            </select>
            
            {isCreatingNewFolder && (
              <div className="animate-in fade-in slide-in-from-top-2 duration-200">
                <input 
                  type="text" 
                  value={newFolderInput}
                  onChange={(e) => setNewFolderInput(e.target.value)}
                  placeholder="Ketik nama folder baru (Misal: Client X)..." 
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl py-3 px-4 focus:ring-2 focus:ring-pln-blue outline-none transition-shadow text-sm"
                  autoFocus
                  required
                />
              </div>
            )}
          </div>
          <p className="text-xs text-gray-500 mt-2">Folder akan otomatis dibuat berserta proyek ini.</p>
        </div>

        {/* Tipe Tracking */}
        <div className="mb-8">
          <label className="block text-sm font-bold text-gray-700 mb-4">Pilih Tipe Tracking</label>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            
            {/* Image Tracking Option */}
            <label className={`cursor-pointer border-2 rounded-2xl p-6 flex items-start gap-4 transition-all ${trackingType === 'image_tracking' ? 'border-pln-blue bg-blue-50/50' : 'border-gray-200 hover:border-gray-300'}`}>
              <input 
                type="radio" 
                name="tracking_type" 
                value="image_tracking" 
                checked={trackingType === 'image_tracking'}
                onChange={() => setTrackingType('image_tracking')}
                className="hidden"
              />
              <div className={`p-3 rounded-xl ${trackingType === 'image_tracking' ? 'bg-pln-blue text-white' : 'bg-gray-100 text-gray-500'}`}>
                <Image size={24} />
              </div>
              <div>
                <h3 className={`font-bold text-lg mb-1 ${trackingType === 'image_tracking' ? 'text-pln-blue-dark' : 'text-gray-900'}`}>Image Tracking</h3>
                <p className="text-sm text-gray-500 leading-relaxed">
                  Objek 3D akan muncul di atas gambar spesifik (marker) seperti kartu nama, brosur, atau poster.
                </p>
              </div>
            </label>

            {/* Surface Tracking Option */}
            <label className={`cursor-pointer border-2 rounded-2xl p-6 flex items-start gap-4 transition-all opacity-50 bg-gray-50`}>
              <input 
                type="radio" 
                name="tracking_type" 
                value="surface_tracking" 
                disabled
                className="hidden"
              />
              <div className={`p-3 rounded-xl bg-gray-200 text-gray-400`}>
                <Box size={24} />
              </div>
              <div>
                <h3 className={`font-bold text-lg mb-1 text-gray-500`}>Surface Tracking <span className="text-xs bg-gray-200 px-2 py-0.5 rounded-full ml-2">Segera Hadir</span></h3>
                <p className="text-sm text-gray-400 leading-relaxed">
                  Letakkan objek 3D di permukaan datar dunia nyata seperti lantai atau meja (WebXR).
                </p>
              </div>
            </label>

          </div>
        </div>

        <div className="flex justify-end pt-4 border-t border-gray-100">
          <button 
            type="submit" 
            disabled={loading || !title.trim()}
            className="flex items-center gap-2 px-8 py-3 bg-pln-yellow hover:bg-pln-yellow-hover text-gray-900 font-bold rounded-xl transition-colors disabled:opacity-50"
          >
            {loading ? <Loader2 className="animate-spin" size={20} /> : (
              <>
                Lanjutkan ke Editor
                <ArrowRight size={20} />
              </>
            )}
          </button>
        </div>

      </form>
    </div>
  );
}
