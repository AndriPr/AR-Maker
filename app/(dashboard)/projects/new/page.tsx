"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { Image, Box, ArrowRight, Loader2, File, Contact2, BookOpen, PartyPopper } from 'lucide-react';
import { useWorkspace } from '@/components/providers/WorkspaceProvider';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

const projectSchema = z.object({
  title: z.string().min(1, { message: "Nama proyek wajib diisi" }),
  folderId: z.string(),
  newFolderInput: z.string().optional(),
}).refine(data => {
  if (data.folderId === 'NEW' && (!data.newFolderInput || data.newFolderInput.trim().length === 0)) {
    return false;
  }
  return true;
}, {
  message: "Nama folder baru wajib diisi",
  path: ["newFolderInput"]
});

type ProjectFormValues = z.infer<typeof projectSchema>;

export default function NewProjectPage() {
  const router = useRouter();
  const [trackingType, setTrackingType] = useState('image_tracking');
  const [selectedTemplate, setSelectedTemplate] = useState('blank');
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

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<ProjectFormValues>({
    resolver: zodResolver(projectSchema),
    defaultValues: {
      title: "",
      folderId: "PERSONAL",
      newFolderInput: "",
    },
  });

  const selectedFolderId = watch("folderId");
  const isCreatingNewFolder = selectedFolderId === 'NEW';
  const currentTitle = watch("title");

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
    if (tmpl.id !== 'blank' && !currentTitle) {
      setValue('title', tmpl.name, { shouldValidate: true });
    }
  };

  const onSubmit = async (data: ProjectFormValues) => {
    setLoading(true);
    setError(null);

    try {
      const { data: authData } = await supabase.auth.getSession();
      const session = authData.session;
      if (!session) throw new Error("Silakan login terlebih dahulu.");
      if (!activeWorkspace) throw new Error("Silakan pilih Workspace terlebih dahulu.");

      // Handle Folder Creation
      let finalFolderId = null; // null means Personal/Root
      
      if (isCreatingNewFolder && data.newFolderInput?.trim()) {
        const { data: folderData, error: folderError } = await supabase
          .from('folders')
          .insert({
            user_id: session.user.id,
            workspace_id: activeWorkspace.id,
            name: data.newFolderInput.trim()
          })
          .select()
          .single();
          
        if (folderError) throw folderError;
        finalFolderId = folderData.id;
      } else if (data.folderId !== 'PERSONAL' && data.folderId !== 'NEW') {
        finalFolderId = data.folderId;
      }

      let initialSceneData: any = { elements: [] };
      let initialTargetImageUrl: string | null = null;

      if (selectedTemplate === 'business_card') {
        initialTargetImageUrl = 'https://images.unsplash.com/photo-1589829085413-56de8ae18c73?auto=format&fit=crop&q=80&w=800';
        initialSceneData.elements = [
          { id: crypto.randomUUID(), type: '3d_shape', shapeType: 'plane', name: 'Latar Kartu', position: [0, 0, 0], rotation: [0, 0, 0], scale: [3.5, 2, 1], color: '#2c3e50', sceneId: 'scene-1' },
          { id: crypto.randomUUID(), type: '3d_shape', shapeType: 'plane', name: 'Foto Profil', position: [-1, 0, 0.05], rotation: [0, 0, 0], scale: [1.2, 1.2, 1], color: '#ecf0f1', sceneId: 'scene-1' },
          { id: crypto.randomUUID(), type: '3d_text', name: 'Nama Anda', content: 'Nama Anda', position: [0, 0.3, 0.05], rotation: [0, 0, 0], scale: [0.6, 0.6, 0.6], color: '#ffffff', sceneId: 'scene-1' },
          { id: crypto.randomUUID(), type: '3d_text', name: 'Jabatan', content: 'Jabatan / Pekerjaan', position: [0, -0.1, 0.05], rotation: [0, 0, 0], scale: [0.3, 0.3, 0.3], color: '#3498db', sceneId: 'scene-1' },
          { id: crypto.randomUUID(), type: 'ui_button', name: 'Tombol Website', buttonText: 'Kunjungi Website', actionTargetId: '', actionAnimation: '', position: [0.3, -0.6, 0.05], rotation: [0, 0, 0], scale: [0.8, 0.8, 0.8], sceneId: 'scene-1' }
        ];
      } else if (selectedTemplate === 'catalog') {
        initialTargetImageUrl = 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&q=80&w=800';
        initialSceneData.elements = [
          { id: crypto.randomUUID(), type: '3d_shape', shapeType: 'cylinder', name: 'Podium', position: [0, -1, 0], rotation: [0, 0, 0], scale: [2, 0.2, 2], color: '#34495e', sceneId: 'scene-1' },
          { id: crypto.randomUUID(), type: '3d_shape', shapeType: 'box', name: 'Kotak Produk', position: [0, 0, 0], rotation: [0, 0, 0], scale: [1.2, 1.8, 1.2], color: '#f1c40f', sceneId: 'scene-1' },
          { id: crypto.randomUUID(), type: '3d_text', name: 'Nama Produk', content: 'PRODUK SUPER', position: [0, 1.3, 0], rotation: [0, 0, 0], scale: [0.8, 0.8, 0.8], color: '#ffffff', sceneId: 'scene-1' },
          { id: crypto.randomUUID(), type: '3d_text', name: 'Harga', content: 'Rp 99.000', position: [0, 0.9, 0], rotation: [0, 0, 0], scale: [0.5, 0.5, 0.5], color: '#2ecc71', sceneId: 'scene-1' },
          { id: crypto.randomUUID(), type: 'ui_button', name: 'Beli Sekarang', buttonText: 'Beli Sekarang', actionTargetId: '', actionAnimation: '', position: [0, -1.5, 0], rotation: [0, 0, 0], scale: [1, 1, 1], sceneId: 'scene-1' }
        ];
      } else if (selectedTemplate === 'wedding') {
        initialTargetImageUrl = 'https://images.unsplash.com/photo-1511285560929-80b456fea0bc?auto=format&fit=crop&q=80&w=800';
        initialSceneData.elements = [
          { id: crypto.randomUUID(), type: '3d_shape', shapeType: 'plane', name: 'Latar Undangan', position: [0, 0, -0.1], rotation: [0, 0, 0], scale: [4, 3, 1], color: '#fff0f5', sceneId: 'scene-1' },
          { id: crypto.randomUUID(), type: '3d_shape', shapeType: 'plane', name: 'Foto Mempelai 1', position: [-1.2, 0.2, 0], rotation: [0, 0, 0], scale: [1, 1.5, 1], color: '#ffcccc', sceneId: 'scene-1' },
          { id: crypto.randomUUID(), type: '3d_shape', shapeType: 'plane', name: 'Foto Utama', position: [0, 0.2, 0.1], rotation: [0, 0, 0], scale: [1.2, 1.8, 1], color: '#ffffff', sceneId: 'scene-1' },
          { id: crypto.randomUUID(), type: '3d_shape', shapeType: 'plane', name: 'Foto Mempelai 2', position: [1.2, 0.2, 0], rotation: [0, 0, 0], scale: [1, 1.5, 1], color: '#ccffcc', sceneId: 'scene-1' },
          { id: crypto.randomUUID(), type: '3d_text', name: 'Nama Mempelai', content: 'Romeo & Juliet', position: [0, -1, 0.05], rotation: [0, 0, 0], scale: [0.7, 0.7, 0.7], color: '#d35400', sceneId: 'scene-1' },
          { id: crypto.randomUUID(), type: '3d_text', name: 'Tanggal', content: 'Minggu, 12 Desember 2026', position: [0, -1.4, 0.05], rotation: [0, 0, 0], scale: [0.3, 0.3, 0.3], color: '#7f8c8d', sceneId: 'scene-1' }
        ];
      }

      // Insert new project to database
      const { data: projData, error: dbError } = await supabase
        .from('ar_projects')
        .insert({
          user_id: session.user.id,
          workspace_id: activeWorkspace.id,
          title: data.title,
          tracking_type: trackingType,
          is_published: false,
          folder_id: finalFolderId,
          scene_data: initialSceneData,
          target_image_url: initialTargetImageUrl
        })
        .select()
        .single();

      if (dbError) throw dbError;

      // Create Notification (Fire and forget)
      supabase.from('notifications').insert({
        user_id: session.user.id,
        title: 'Proyek Baru Dibuat',
        message: `Proyek '${data.title}' berhasil ditambahkan ke ruang kerja Anda.`
      }).then();

      // Redirect to editor
      if (projData) {
        router.push(`/projects/${projData.id}/edit`);
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

      <form onSubmit={handleSubmit(onSubmit)} className="bg-white rounded-3xl p-6 sm:p-8 shadow-sm border border-gray-100 space-y-8">
        
        {/* Nama Proyek */}
        <div className="mb-8">
          <Label className="block font-bold text-gray-700 mb-2">Nama Proyek</Label>
          <Input 
            {...register("title")}
            placeholder="Misal: Brosur Interaktif V1" 
            className={`w-full py-6 px-4 text-lg font-medium ${errors.title ? 'border-red-500 focus-visible:ring-red-500' : ''}`}
            autoFocus
          />
          {errors.title && <p className="text-red-500 text-xs font-medium mt-1">{errors.title.message}</p>}
        </div>

        {/* Folder Penyimpanan */}
        <div className="mb-8">
          <Label className="block font-bold text-gray-700 mb-2">Simpan di Folder</Label>
          <div className="flex flex-col gap-3">
            <select
              {...register("folderId")}
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
                <Input 
                  {...register("newFolderInput")}
                  placeholder="Ketik nama folder baru (Misal: Client X)..." 
                  className={`w-full py-3 px-4 text-sm ${errors.newFolderInput ? 'border-red-500 focus-visible:ring-red-500' : ''}`}
                />
                {errors.newFolderInput && <p className="text-red-500 text-xs font-medium mt-1">{errors.newFolderInput.message}</p>}
              </div>
            )}
          </div>
          <p className="text-xs text-gray-500 mt-2">Folder akan otomatis dibuat berserta proyek ini.</p>
        </div>

        {/* Tipe Tracking */}
        <div className="mb-8">
          <Label className="block font-bold text-gray-700 mb-4">Pilih Tipe Tracking</Label>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Image Tracking Option */}
            <label className={`cursor-pointer border-2 rounded-2xl p-6 flex items-start gap-4 transition-all ${trackingType === 'image_tracking' ? 'border-pln-blue bg-blue-50/50' : 'border-gray-200 hover:border-gray-300'}`}>
              <input 
                type="radio" 
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
            disabled={loading}
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
