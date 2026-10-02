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
    { id: 'blank', name: 'Blank Project', icon: File, type: 'image_tracking', desc: 'Start from scratch' },
    { id: 'business_card', name: 'AR Business Card', icon: Contact2, type: 'image_tracking', desc: 'Interactive personal branding' },
    { id: 'catalog', name: 'Product Catalog', icon: BookOpen, type: 'image_tracking', desc: '3D visualization for retail' },
    { id: 'wedding', name: 'Interactive Invitation', icon: PartyPopper, type: 'image_tracking', desc: 'Engagement for events' }
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
    <div className="max-w-4xl mx-auto space-y-6 mt-4 pb-12">
      
      {/* Hero Banner */}
      <div className="bg-white border-2 border-pln-blue/20 rounded-3xl p-6 sm:p-8 mb-10 shadow-sm relative overflow-hidden">
        <h1 className="text-[26px] font-black text-gray-900 tracking-tight">Memulai Membuat AR</h1>
        <p className="text-gray-600 mt-2 text-sm max-w-2xl font-medium">Pilih template untuk mempermudah pembuatan proyek augmented reality (AR), atau mulai dari awal dengan proyek kosong</p>
      </div>

      {error && (
        <div className="p-4 bg-red-50 text-red-600 rounded-xl border border-red-100 text-sm font-medium">
          {error}
        </div>
      )}

      {/* 1. Pilih Template */}
      <div className="mb-10">
        <h2 className="text-lg font-extrabold text-gray-900 mb-5">1. Pilih Template</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          {templates.map(tmpl => {
            const isSelected = selectedTemplate === tmpl.id;
            const isBlank = tmpl.id === 'blank';
            
            return (
              <div 
                key={tmpl.id}
                onClick={() => handleSelectTemplate(tmpl)}
                className={`cursor-pointer group flex flex-col`}
              >
                {isBlank ? (
                  <div className={`h-40 rounded-[24px] border-[2px] border-dashed flex flex-col items-center justify-center transition-all ${isSelected ? 'border-pln-blue bg-blue-50/50 shadow-sm' : 'border-gray-300 bg-[#F1F2F4] hover:border-gray-400'}`}>
                    <div className="w-10 h-10 rounded-full border-[1.5px] border-gray-400 flex items-center justify-center text-gray-500 mb-2 bg-transparent">
                      <span className="text-xl leading-none -mt-0.5">+</span>
                    </div>
                    <span className="text-[11px] font-bold text-gray-500">Create Empty</span>
                  </div>
                ) : (
                  <div className={`h-40 rounded-[24px] flex items-center justify-center transition-all ${isSelected ? 'bg-[#EAEBFF] border-[2px] border-pln-blue shadow-sm' : 'bg-[#EDEEFF] border-[2px] border-transparent hover:border-blue-200'}`}>
                    <Image size={24} className="text-[#8B93FF]" />
                  </div>
                )}
                
                <div className="mt-3 px-1">
                  <h3 className={`font-bold text-[13px] leading-tight ${isSelected ? 'text-gray-900' : 'text-gray-800'}`}>{tmpl.name}</h3>
                  <p className="text-[10px] text-gray-500 mt-1 leading-tight">{tmpl.desc}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 2. Detail Project */}
      <div>
        <h2 className="text-lg font-extrabold text-gray-900 mb-5">2. Detail Project</h2>
        
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            
            {/* Project Name */}
            <div>
              <Label className="block font-bold text-xs text-gray-800 mb-2">Project Name</Label>
              <Input 
                {...register("title")}
                placeholder="My New AR Experience" 
                className={`w-full py-5 px-4 text-sm bg-[#FAFAFA] rounded-2xl border-gray-200 focus-visible:ring-1 focus-visible:ring-pln-blue shadow-none ${errors.title ? 'border-red-500' : ''}`}
                autoFocus
              />
              {errors.title && <p className="text-red-500 text-xs font-medium mt-1">{errors.title.message}</p>}
            </div>

            {/* Save to Folder */}
            <div>
              <Label className="block font-bold text-xs text-gray-800 mb-2">Save to Folder</Label>
              <div className="flex flex-col gap-2 relative">
                <select
                  {...register("folderId")}
                  className="w-full bg-[#FAFAFA] border border-gray-200 rounded-2xl py-3 px-4 focus:ring-1 focus:ring-pln-blue outline-none text-sm appearance-none font-medium text-gray-700"
                >
                  <option value="PERSONAL">Main Workspace</option>
                  {existingFolders.map(folder => (
                    <option key={folder.id} value={folder.id}>{folder.name}</option>
                  ))}
                  <option value="NEW" className="font-bold text-pln-blue">+ Buat Folder Baru</option>
                </select>
                <div className="absolute right-4 top-3.5 pointer-events-none text-gray-400">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 20h16a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-7.93a2 2 0 0 1-1.66-.9l-1.22-1.8A2 2 0 0 0 7.53 3H4a2 2 0 0 0-2 2v13a2 2 0 0 0 2 2Z"/></svg>
                </div>
                
                {isCreatingNewFolder && (
                  <div className="animate-in fade-in slide-in-from-top-2 duration-200">
                    <Input 
                      {...register("newFolderInput")}
                      placeholder="Ketik nama folder baru..." 
                      className={`w-full py-2.5 px-4 text-sm rounded-xl ${errors.newFolderInput ? 'border-red-500' : ''}`}
                    />
                    {errors.newFolderInput && <p className="text-red-500 text-xs font-medium mt-1">{errors.newFolderInput.message}</p>}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Tracking Type */}
          <div>
            <Label className="block font-bold text-xs text-gray-800 mb-3">Tracking Type</Label>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <label className={`cursor-pointer border-2 rounded-2xl p-4 flex items-center justify-between transition-all ${trackingType === 'image_tracking' ? 'border-pln-blue bg-white shadow-[0_2px_10px_rgba(0,92,154,0.08)]' : 'border-gray-200 bg-white hover:border-gray-300'}`}>
                <div className="flex items-center gap-3">
                  <div className={`p-2.5 rounded-xl ${trackingType === 'image_tracking' ? 'bg-[#F0F7FF] text-pln-blue' : 'bg-gray-100 text-gray-500'}`}>
                    <Image size={20} />
                  </div>
                  <div>
                    <h3 className={`font-bold text-[13px] ${trackingType === 'image_tracking' ? 'text-gray-900' : 'text-gray-700'}`}>Image Tracking</h3>
                    <p className="text-[10px] text-gray-500">Triggers when a specific image is recognized</p>
                  </div>
                </div>
                <div className={`w-[18px] h-[18px] rounded-full border-2 flex items-center justify-center ${trackingType === 'image_tracking' ? 'border-pln-blue' : 'border-gray-300'}`}>
                  {trackingType === 'image_tracking' && <div className="w-[10px] h-[10px] rounded-full bg-pln-blue" />}
                </div>
                <input 
                  type="radio" 
                  value="image_tracking" 
                  checked={trackingType === 'image_tracking'}
                  onChange={() => setTrackingType('image_tracking')}
                  className="hidden"
                />
              </label>

              <label className={`cursor-not-allowed border-[1.5px] rounded-2xl p-4 flex items-center justify-between transition-all border-gray-100 bg-[#FAFAFA] opacity-70`}>
                <div className="flex items-center gap-3">
                  <div className={`p-2.5 rounded-xl bg-[#F0F0F0] text-[#B0B0B0]`}>
                    <Box size={20} />
                  </div>
                  <div>
                    <h3 className={`font-bold text-[13px] text-gray-500`}>Surface Tracking</h3>
                    <p className="text-[10px] text-gray-400">Places content on floors, tables, or walls</p>
                  </div>
                </div>
                <div className={`w-[18px] h-[18px] rounded-full border-2 border-gray-200 flex items-center justify-center`}>
                </div>
                <input 
                  type="radio" 
                  value="surface_tracking" 
                  disabled
                  className="hidden"
                />
              </label>
            </div>
          </div>

          <div className="flex items-center justify-end gap-6 pt-6 mt-10">
            <button 
              type="button"
              onClick={() => router.back()}
              className="text-[13px] font-bold text-gray-500 hover:text-gray-900 transition-colors"
            >
              Cancel
            </button>
            <button 
              type="submit" 
              disabled={loading}
              className="flex items-center gap-2 px-6 py-2.5 bg-[#365A82] hover:bg-[#254261] text-white font-bold rounded-[14px] transition-colors shadow-sm disabled:opacity-50 text-[13px]"
            >
              {loading ? <Loader2 className="animate-spin" size={16} /> : (
                <>
                  Create Project <span className="text-yellow-400">🚀</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
