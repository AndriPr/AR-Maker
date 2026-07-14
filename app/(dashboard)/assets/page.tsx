"use client";

import { UploadCloud, Box, Image as ImageIcon, Trash2, Link as LinkIcon, Search, Filter, Loader2, X } from 'lucide-react';
import Link from 'next/link';
import { useEffect, useState, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import { useWorkspace } from '@/components/providers/WorkspaceProvider';

export default function AssetLibraryPage() {
  const router = useRouter();
  const { activeWorkspace, activeRole } = useWorkspace();
  const [assets, setAssets] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [previewModal, setPreviewModal] = useState<{ url: string, name: string, type: string } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const fetchAssets = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      router.push('/login');
      return;
    }

    let query = supabase.from('assets').select('*').order('created_at', { ascending: false });
    
    if (activeWorkspace) {
      query = query.eq('workspace_id', activeWorkspace.id);
    } else {
      query = query.eq('user_id', session.user.id).is('workspace_id', null);
    }

    const { data, error } = await query;

    if (data) {
      setAssets(data);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchAssets();
  }, [router, activeWorkspace]);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement> | any) => {
    const file = e.target?.files?.[0] || e.dataTransfer?.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error("Tidak ada sesi yang aktif");

      // 1. Tentukan tipe file (image atau 3d_model)
      const isGlb = file.name.endsWith('.glb') || file.name.endsWith('.gltf');
      const isImage = file.type.startsWith('image/');
      
      if (!isGlb && !isImage) {
        throw new Error("Format file tidak didukung. Harap unggah gambar atau file .glb/.gltf");
      }
      
      const assetType = isGlb ? '3d_model' : 'image';
      
      // 2. Upload file ke Supabase Storage (bucket 'assets')
      const fileExt = file.name.split('.').pop();
      const fileName = `${Math.random().toString(36).substring(2, 15)}.${fileExt}`;
      const filePath = `${session.user.id}/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('assets')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      // 3. Dapatkan Public URL
      const { data: { publicUrl } } = supabase.storage
        .from('assets')
        .getPublicUrl(filePath);

      // 4. Simpan ke Database
      const { data: insertedAsset, error: dbError } = await supabase
        .from('assets')
        .insert({
          user_id: session.user.id,
          workspace_id: activeWorkspace?.id || null,
          name: file.name,
          type: assetType,
          file_url: publicUrl,
          size: `${(file.size / (1024 * 1024)).toFixed(2)} MB`
        })
        .select()
        .single();

      if (dbError) throw dbError;

      await supabase.from('audit_logs').insert({
        workspace_id: activeWorkspace?.id,
        user_id: session.user.id,
        action: 'UPLOAD_ASSET',
        resource_name: file.name,
        details: { type: assetType, size: file.size }
      });

      alert("File berhasil diunggah!");
      fetchAssets();
    } catch (error: any) {
      alert("Error saat mengunggah: " + error.message);
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleDelete = async (asset: any) => {
    if (!confirm('Yakin ingin menghapus aset ini?')) return;
    
    try {
      await supabase.from('assets').delete().eq('id', asset.id);
      
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        await supabase.from('audit_logs').insert({
          workspace_id: activeWorkspace?.id,
          user_id: session.user.id,
          action: 'DELETE_ASSET',
          resource_name: asset.name,
          details: { asset_id: asset.id }
        });
      }

      fetchAssets();
    } catch (err) {
      console.error(err);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (activeRole !== 'viewer' && e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFileUpload(e as any);
    }
  };

  return (
    <div 
      className={`space-y-6 ${isDragging ? 'border-2 border-pln-blue border-dashed rounded-3xl p-4 bg-blue-50/50' : 'p-4'}`}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Asset Library</h1>
          <p className="text-gray-500 text-sm mt-1">Kelola model 3D (.glb) dan gambar target untuk proyek AR Anda.</p>
        </div>
        <div className="flex flex-col sm:flex-row gap-3">
          {activeRole !== 'viewer' && (
            <>
              <input 
                type="file" 
                className="hidden" 
                ref={fileInputRef}
                accept="image/*,.glb,.gltf"
                onChange={handleFileUpload}
              />
              <button 
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading}
                className="bg-gray-900 hover:bg-black text-white px-5 py-2.5 rounded-xl font-bold text-sm flex items-center justify-center gap-2 disabled:opacity-50 transition-colors shadow-sm"
              >
                {uploading ? (
                  <><Loader2 size={18} className="animate-spin" /> Mengunggah...</>
                ) : (
                  <><UploadCloud size={18} /> Unggah Baru</>
                )}
              </button>
            </>
          )}
        </div>
      </div>

      <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-sm mb-6">
        <div className="relative w-full max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
          <input 
            type="text" 
            placeholder="Cari nama aset..." 
            className="w-full bg-gray-50 border border-gray-200 rounded-xl py-2 pl-10 pr-4 text-sm focus:ring-2 focus:ring-pln-blue outline-none"
          />
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center p-10 text-gray-500 font-bold">Memuat aset...</div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
          {assets.map((asset) => (
            <div key={asset.id} className="bg-white border border-gray-100 rounded-2xl p-4 shadow-sm hover:shadow-md transition-shadow flex flex-col group relative">
              <div 
                className="h-24 bg-gray-50 rounded-xl mb-3 flex items-center justify-center relative overflow-hidden cursor-pointer"
                onClick={() => setPreviewModal({ url: asset.file_url, name: asset.name, type: asset.type })}
              >
                {asset.type === 'image' ? (
                  <div className="w-full h-full bg-cover bg-center" style={{ backgroundImage: `url(${asset.file_url})` }}></div>
                ) : (
                  <div className="w-full h-full pointer-events-none opacity-80 group-hover:opacity-100 transition-opacity">
                    {/* @ts-ignore */}
                    <model-viewer 
                      src={asset.file_url} 
                      auto-rotate 
                      style={{ width: '100%', height: '100%', backgroundColor: 'transparent' }}
                    >
                    {/* @ts-ignore */}
                    </model-viewer>
                  </div>
                )}
              </div>
              
              <h3 className="font-bold text-gray-900 text-sm truncate" title={asset.name}>{asset.name}</h3>
              
              {activeRole === 'viewer' && (
                <div className="w-full h-8 flex items-center justify-center bg-gray-50 border border-gray-100 rounded-lg text-xs font-medium text-gray-400 mt-2">
                  View Only
                </div>
              )}

              {activeRole !== 'viewer' && (
                <div className="flex items-center gap-2 mt-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button 
                    onClick={() => {
                      navigator.clipboard.writeText(asset.file_url);
                      alert("URL berhasil disalin!");
                    }}
                    className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 py-1.5 rounded-lg text-xs font-bold flex items-center justify-center gap-1 transition-colors"
                  >
                    <LinkIcon size={14} /> Salin URL
                  </button>
                  
                  {activeRole === 'admin' && (
                    <button 
                      onClick={() => handleDelete(asset)}
                      className="bg-red-50 hover:bg-red-100 text-red-600 p-1.5 rounded-lg transition-colors"
                      title="Hapus aset"
                    >
                      <Trash2 size={16} />
                    </button>
                  )}
                </div>
              )}
              
              <div className="flex justify-between items-center text-xs text-gray-500 mt-2">
                <span className="capitalize">{asset.type.replace('_', ' ')}</span>
                <span>{asset.size || '-'}</span>
              </div>
            </div>
          ))}

          {assets.length === 0 && (
             <div className="col-span-2 md:col-span-4 lg:col-span-5 xl:col-span-6 p-10 flex flex-col items-center justify-center bg-gray-50 rounded-2xl border border-dashed border-gray-300 text-gray-500">
               <UploadCloud size={48} className="mb-4 text-gray-300" />
               <p className="font-bold">Belum ada aset</p>
               <p className="text-sm">Silakan upload model 3D atau gambar Anda.</p>
             </div>
          )}
        </div>
      )}

      {/* 3D Preview Modal */}
      {previewModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setPreviewModal(null)}>
          <div className="bg-white rounded-3xl w-full max-w-2xl shadow-2xl overflow-hidden flex flex-col relative" onClick={(e) => e.stopPropagation()}>
            <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
              <h3 className="font-bold text-gray-900">{previewModal.name}</h3>
              <button onClick={() => setPreviewModal(null)} className="p-1 rounded-full text-gray-500 hover:bg-gray-200 transition-colors">
                <X size={20} />
              </button>
            </div>
            <div className="w-full h-[60vh] bg-gray-100 flex items-center justify-center relative">
              {previewModal.type === '3d_model' ? (
                // @ts-ignore
                <model-viewer 
                  src={previewModal.url} 
                  auto-rotate 
                  camera-controls 
                  ar 
                  shadow-intensity="1"
                  style={{ width: '100%', height: '100%', backgroundColor: '#f3f4f6' }}
                >
                {/* @ts-ignore */}
                </model-viewer>
              ) : (
                <img src={previewModal.url} alt={previewModal.name} className="max-w-full max-h-full object-contain" />
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
