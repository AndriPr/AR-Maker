"use client";

import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Store, DownloadCloud, Loader2, CheckCircle2, Box } from 'lucide-react';

const MOCK_MARKET_ASSETS = [
  {
    id: 'm1',
    name: 'Robot Animasi',
    url: 'https://modelviewer.dev/shared-assets/models/RobotExpressive.glb',
    category: 'Karakter',
    size: '1.2 MB'
  },
  {
    id: 'm2',
    name: 'Astronot',
    url: 'https://modelviewer.dev/shared-assets/models/Astronaut.glb',
    category: 'Karakter',
    size: '2.5 MB'
  },
  {
    id: 'm3',
    name: 'Helm Tempur',
    url: 'https://raw.githubusercontent.com/KhronosGroup/glTF-Sample-Models/master/2.0/DamagedHelmet/glTF-Binary/DamagedHelmet.glb',
    category: 'Aksesoris',
    size: '3.1 MB'
  },
  {
    id: 'm4',
    name: 'Bebek Karet',
    url: 'https://raw.githubusercontent.com/KhronosGroup/glTF-Sample-Models/master/2.0/Duck/glTF-Binary/Duck.glb',
    category: 'Mainan',
    size: '0.1 MB'
  },
  {
    id: 'm5',
    name: 'Rubah',
    url: 'https://raw.githubusercontent.com/KhronosGroup/glTF-Sample-Models/master/2.0/Fox/glTF-Binary/Fox.glb',
    category: 'Hewan',
    size: '1.1 MB'
  },
  {
    id: 'm6',
    name: 'Botol Minum',
    url: 'https://raw.githubusercontent.com/KhronosGroup/glTF-Sample-Models/master/2.0/WaterBottle/glTF-Binary/WaterBottle.glb',
    category: 'Produk',
    size: '1.5 MB'
  },
  {
    id: 'm7',
    name: 'Mobil Mainan',
    url: 'https://raw.githubusercontent.com/KhronosGroup/glTF-Sample-Models/master/2.0/ToyCar/glTF-Binary/ToyCar.glb',
    category: 'Kendaraan',
    size: '5.2 MB'
  },
  {
    id: 'm8',
    name: 'Korset Klasik',
    url: 'https://raw.githubusercontent.com/KhronosGroup/glTF-Sample-Models/master/2.0/Corset/glTF-Binary/Corset.glb',
    category: 'Pakaian',
    size: '4.8 MB'
  },
  {
    id: 'm9',
    name: 'Radio Boombox',
    url: 'https://raw.githubusercontent.com/KhronosGroup/glTF-Sample-Models/master/2.0/BoomBox/glTF-Binary/BoomBox.glb',
    category: 'Elektronik',
    size: '2.8 MB'
  },
  {
    id: 'm10',
    name: 'Alpukat',
    url: 'https://raw.githubusercontent.com/KhronosGroup/glTF-Sample-Models/master/2.0/Avocado/glTF-Binary/Avocado.glb',
    category: 'Makanan',
    size: '0.9 MB'
  },
  {
    id: 'm11',
    name: 'Lentera Antik',
    url: 'https://raw.githubusercontent.com/KhronosGroup/glTF-Sample-Models/master/2.0/Lantern/glTF-Binary/Lantern.glb',
    category: 'Furnitur',
    size: '2.1 MB'
  },
  {
    id: 'm12',
    name: 'Kamera Vintage',
    url: 'https://raw.githubusercontent.com/KhronosGroup/glTF-Sample-Models/master/2.0/AntiqueCamera/glTF-Binary/AntiqueCamera.glb',
    category: 'Elektronik',
    size: '3.3 MB'
  },
  {
    id: 'm13',
    name: 'Truk Susu',
    url: 'https://raw.githubusercontent.com/KhronosGroup/glTF-Sample-Models/master/2.0/CesiumMilkTruck/glTF-Binary/CesiumMilkTruck.glb',
    category: 'Kendaraan',
    size: '4.1 MB'
  },
  {
    id: 'm14',
    name: 'Robot Anatomi',
    url: 'https://raw.githubusercontent.com/KhronosGroup/glTF-Sample-Models/master/2.0/BrainStem/glTF-Binary/BrainStem.glb',
    category: 'Karakter',
    size: '1.9 MB'
  },
  {
    id: 'm15',
    name: 'Buggy Offroad',
    url: 'https://raw.githubusercontent.com/KhronosGroup/glTF-Sample-Models/master/2.0/Buggy/glTF-Binary/Buggy.glb',
    category: 'Kendaraan',
    size: '6.4 MB'
  },
  {
    id: 'm16',
    name: 'Mesin Gearbox',
    url: 'https://raw.githubusercontent.com/KhronosGroup/glTF-Sample-Models/master/2.0/GearboxAssy/glTF-Binary/GearboxAssy.glb',
    category: 'Mesin',
    size: '2.4 MB'
  }
];

export default function MarketPage() {
  const [importingId, setImportingId] = useState<string | null>(null);
  const [importedIds, setImportedIds] = useState<string[]>([]);
  const [hoveredId, setHoveredId] = useState<string | null>(null);

  const handleImport = async (asset: any) => {
    setImportingId(asset.id);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error("Sesi tidak valid");

      // Insert ke asset library
      const { error } = await supabase.from('assets').insert({
        user_id: session.user.id,
        name: asset.name,
        type: '3d_model',
        file_url: asset.url,
        size: asset.size
      });

      if (error) throw error;

      // Kirim Notifikasi
      supabase.from('notifications').insert({
        user_id: session.user.id,
        title: 'Aset Diimpor',
        message: `'${asset.name}' dari Marketplace berhasil ditambahkan ke Asset Library Anda.`
      }).then();

      setImportedIds(prev => [...prev, asset.id]);
    } catch (error: any) {
      alert("Gagal mengimpor aset: " + error.message);
    } finally {
      setImportingId(null);
    }
  };

  return (
    <div className="space-y-8 pb-10">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
          <Store className="text-purple-600" />
          3D Asset Marketplace
        </h1>
        <p className="text-gray-500 text-sm mt-1">Jelajahi dan impor model 3D berkualitas tinggi ke Asset Library Anda secara gratis.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {MOCK_MARKET_ASSETS.map((asset) => {
          const isImporting = importingId === asset.id;
          const isImported = importedIds.includes(asset.id);

          return (
            <div 
              key={asset.id} 
              className="bg-white border border-gray-100 rounded-3xl p-4 shadow-sm hover:shadow-md transition-all flex flex-col group relative overflow-hidden"
              onMouseEnter={() => setHoveredId(asset.id)}
              onMouseLeave={() => setHoveredId(null)}
            >
              <div className="h-48 bg-gray-50 rounded-2xl mb-4 relative overflow-hidden flex items-center justify-center">
                <div className="w-full h-full absolute inset-0 pointer-events-none opacity-90 group-hover:opacity-100 transition-opacity">
                  {hoveredId === asset.id ? (
                    /* @ts-ignore */
                    <model-viewer 
                      src={asset.url} 
                      auto-rotate 
                      camera-controls="false"
                      style={{ width: '100%', height: '100%', backgroundColor: 'transparent' }}
                    >
                    {/* @ts-ignore */}
                    </model-viewer>
                  ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center text-gray-300 gap-2">
                      <Box size={40} className="group-hover:scale-110 transition-transform" />
                      <span className="text-[10px] font-bold text-gray-400">Hover to Preview</span>
                    </div>
                  )}
                </div>
                <div className="absolute top-2 left-2 bg-white/80 backdrop-blur-md px-2 py-1 rounded-md text-[10px] font-bold text-gray-700 uppercase tracking-wider">
                  {asset.category}
                </div>
              </div>
              
              <h3 className="font-bold text-gray-900 text-lg line-clamp-1">{asset.name}</h3>
              <p className="text-xs text-gray-400 mb-4">{asset.size} • format .glb</p>
              
              <div className="mt-auto">
                <button
                  onClick={() => handleImport(asset)}
                  disabled={isImporting || isImported}
                  className={`w-full py-2.5 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-colors ${
                    isImported 
                      ? 'bg-green-50 text-green-600 border border-green-200' 
                      : 'bg-pln-blue text-white hover:bg-pln-blue-dark shadow-sm hover:shadow'
                  } disabled:opacity-70`}
                >
                  {isImporting ? (
                    <Loader2 className="animate-spin" size={16} />
                  ) : isImported ? (
                    <CheckCircle2 size={16} />
                  ) : (
                    <DownloadCloud size={16} />
                  )}
                  {isImporting ? 'Mengimpor...' : isImported ? 'Tersimpan di Library' : 'Simpan ke Aset Saya'}
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
