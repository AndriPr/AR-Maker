"use client";

import { UploadCloud, Box, Image as ImageIcon, Trash2, Link as LinkIcon, Search, Filter, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { useEffect, useState, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';

export default function AssetLibraryPage() {
  const router = useRouter();
  const [assets, setAssets] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const fetchAssets = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      router.push('/login');
      return;
    }

    const { data, error } = await supabase
      .from('assets')
      .select('*')
      .eq('user_id', session.user.id)
      .order('created_at', { ascending: false });

    if (data) {
      setAssets(data);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchAssets();
  }, [router]);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
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
      const { error: dbError } = await supabase
        .from('assets')
        .insert({
          user_id: session.user.id,
          name: file.name,
          type: assetType,
          file_url: publicUrl,
          size: `${(file.size / (1024 * 1024)).toFixed(2)} MB`
        });

      if (dbError) throw dbError;

      alert("File berhasil diunggah!");
      fetchAssets(); // Refresh list
    } catch (error: any) {
      alert("Error saat mengunggah: " + error.message);
    } finally {
      setUploading(false);
      // Reset input
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleDelete = async (id: string, fileUrl: string) => {
    if (!confirm('Yakin ingin menghapus aset ini?')) return;
    
    try {
      // Hapus dari database
      await supabase.from('assets').delete().eq('id', id);
      
      // Ekstrak file path dari URL dan hapus dari storage (opsional/lanjutan)
      // ...

      fetchAssets();
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Asset Library</h1>
          <p className="text-gray-500 text-sm mt-1">Kelola model 3D (.glb) dan gambar target untuk proyek AR Anda.</p>
        </div>
        <div className="flex gap-3">
          <input 
            type="file" 
            ref={fileInputRef} 
            onChange={handleFileUpload} 
            className="hidden" 
            accept=".glb,.gltf,image/png,image/jpeg,image/webp"
          />
          <button 
            disabled={uploading}
            onClick={() => fileInputRef.current?.click()}
            className="flex items-center gap-2 bg-pln-blue hover:bg-pln-blue-dark text-white font-bold px-5 py-2.5 rounded-xl transition-colors disabled:opacity-50"
          >
            {uploading ? <Loader2 className="animate-spin" size={20} /> : <UploadCloud size={20} />}
            {uploading ? 'Mengunggah...' : 'Upload Asset'}
          </button>
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
              <div className="absolute top-2 right-2 flex flex-col gap-1 opacity-0 group-hover:opacity-100 transition-opacity z-10">
                <button className="bg-white p-1.5 rounded-md text-gray-500 hover:text-pln-blue shadow-sm" onClick={() => navigator.clipboard.writeText(asset.file_url)} title="Copy URL">
                  <LinkIcon size={14} />
                </button>
                <button className="bg-white p-1.5 rounded-md text-gray-500 hover:text-red-500 shadow-sm" onClick={() => handleDelete(asset.id, asset.file_url)} title="Hapus Aset">
                  <Trash2 size={14} />
                </button>
              </div>
              
              <div className="bg-gray-50 rounded-xl h-24 mb-3 flex items-center justify-center border border-dashed border-gray-200 overflow-hidden relative">
                {asset.type === 'image' ? (
                   <img src={asset.file_url} alt={asset.name} className="w-full h-full object-cover" />
                ) : (
                   <Box size={32} className="text-purple-500" />
                )}
              </div>
              
              <h3 className="font-bold text-gray-900 text-sm truncate" title={asset.name}>{asset.name}</h3>
              <div className="flex justify-between items-center text-xs text-gray-500 mt-1">
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
    </div>
  );
}
