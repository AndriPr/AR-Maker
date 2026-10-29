"use client";

import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Store, DownloadCloud, Loader2, CheckCircle2, Box, Filter, SlidersHorizontal } from 'lucide-react';
import { useWorkspace } from '@/components/providers/WorkspaceProvider';
import { useDashboardStore } from '@/lib/dashboardStore';

const MOCK_MARKET_ASSETS = [
  {
    id: 'm1',
    name: 'Robot Animasi',
    url: 'https://modelviewer.dev/shared-assets/models/RobotExpressive.glb',
    cover: 'https://images.unsplash.com/photo-1485827404703-89b55fcc595e?q=80&w=600&auto=format&fit=crop',
    category: 'Karakter',
    size: '1.2 MB'
  },
  {
    id: 'm2',
    name: 'Astronot',
    url: 'https://modelviewer.dev/shared-assets/models/Astronaut.glb',
    cover: 'https://images.unsplash.com/photo-1541185933-ef5d8ed016c2?q=80&w=600&auto=format&fit=crop',
    category: 'Karakter',
    size: '2.5 MB'
  },
  {
    id: 'm3',
    name: 'Helm Tempur',
    url: 'https://raw.githubusercontent.com/KhronosGroup/glTF-Sample-Models/master/2.0/DamagedHelmet/glTF-Binary/DamagedHelmet.glb',
    cover: 'https://images.unsplash.com/photo-1558981403-c5f9899a28bc?q=80&w=600&auto=format&fit=crop',
    category: 'Aksesoris',
    size: '3.1 MB'
  },
  {
    id: 'm4',
    name: 'Bebek Karet',
    url: 'https://raw.githubusercontent.com/KhronosGroup/glTF-Sample-Models/master/2.0/Duck/glTF-Binary/Duck.glb',
    cover: 'https://images.unsplash.com/photo-1589419163274-0f2c42171c66?q=80&w=600&auto=format&fit=crop',
    category: 'Mainan',
    size: '0.1 MB'
  },
  {
    id: 'm5',
    name: 'Rubah',
    url: 'https://raw.githubusercontent.com/KhronosGroup/glTF-Sample-Models/master/2.0/Fox/glTF-Binary/Fox.glb',
    cover: 'https://images.unsplash.com/photo-1516934024742-b461fba47600?q=80&w=600&auto=format&fit=crop',
    category: 'Hewan',
    size: '1.1 MB'
  },
  {
    id: 'm6',
    name: 'Botol Minum',
    url: 'https://raw.githubusercontent.com/KhronosGroup/glTF-Sample-Models/master/2.0/WaterBottle/glTF-Binary/WaterBottle.glb',
    cover: 'https://images.unsplash.com/photo-1602143407151-7111542de6e8?q=80&w=600&auto=format&fit=crop',
    category: 'Produk',
    size: '1.5 MB'
  },
  {
    id: 'm7',
    name: 'Mobil Mainan',
    url: 'https://raw.githubusercontent.com/KhronosGroup/glTF-Sample-Models/master/2.0/ToyCar/glTF-Binary/ToyCar.glb',
    cover: 'https://images.unsplash.com/photo-1581235720704-06d3acfcb36f?q=80&w=600&auto=format&fit=crop',
    category: 'Kendaraan',
    size: '5.2 MB'
  },
  {
    id: 'm8',
    name: 'Korset Klasik',
    url: 'https://raw.githubusercontent.com/KhronosGroup/glTF-Sample-Models/master/2.0/Corset/glTF-Binary/Corset.glb',
    cover: 'https://images.unsplash.com/photo-1584916201218-f4242ceb4809?q=80&w=600&auto=format&fit=crop',
    category: 'Pakaian',
    size: '4.8 MB'
  },
  {
    id: 'm9',
    name: 'Radio Boombox',
    url: 'https://raw.githubusercontent.com/KhronosGroup/glTF-Sample-Models/master/2.0/BoomBox/glTF-Binary/BoomBox.glb',
    cover: 'https://images.unsplash.com/photo-1596461404969-9ae70f2830c1?q=80&w=600&auto=format&fit=crop',
    category: 'Elektronik',
    size: '2.8 MB'
  },
  {
    id: 'm10',
    name: 'Alpukat',
    url: 'https://raw.githubusercontent.com/KhronosGroup/glTF-Sample-Models/master/2.0/Avocado/glTF-Binary/Avocado.glb',
    cover: 'https://images.unsplash.com/photo-1523049673857-eb18f1d7b578?q=80&w=600&auto=format&fit=crop',
    category: 'Makanan',
    size: '0.9 MB'
  },
  {
    id: 'm11',
    name: 'Lentera Antik',
    url: 'https://raw.githubusercontent.com/KhronosGroup/glTF-Sample-Models/master/2.0/Lantern/glTF-Binary/Lantern.glb',
    cover: 'https://images.unsplash.com/photo-1516246843873-9d12356b6fab?q=80&w=600&auto=format&fit=crop',
    category: 'Furnitur',
    size: '2.1 MB'
  },
  {
    id: 'm12',
    name: 'Kamera Vintage',
    url: 'https://raw.githubusercontent.com/KhronosGroup/glTF-Sample-Models/master/2.0/AntiqueCamera/glTF-Binary/AntiqueCamera.glb',
    cover: 'https://images.unsplash.com/photo-1516035069371-29a1b244cc32?q=80&w=600&auto=format&fit=crop',
    category: 'Elektronik',
    size: '3.3 MB'
  },
  {
    id: 'm13',
    name: 'Truk Susu',
    url: 'https://raw.githubusercontent.com/KhronosGroup/glTF-Sample-Models/master/2.0/CesiumMilkTruck/glTF-Binary/CesiumMilkTruck.glb',
    cover: 'https://images.unsplash.com/photo-1587284428055-e45f94d93ee4?q=80&w=600&auto=format&fit=crop',
    category: 'Kendaraan',
    size: '4.1 MB'
  },
  {
    id: 'm14',
    name: 'Robot Anatomi',
    url: 'https://raw.githubusercontent.com/KhronosGroup/glTF-Sample-Models/master/2.0/BrainStem/glTF-Binary/BrainStem.glb',
    cover: 'https://images.unsplash.com/photo-1559757175-5700dde675bc?q=80&w=600&auto=format&fit=crop',
    category: 'Karakter',
    size: '1.9 MB'
  },
  {
    id: 'm15',
    name: 'Buggy Offroad',
    url: 'https://raw.githubusercontent.com/KhronosGroup/glTF-Sample-Models/master/2.0/Buggy/glTF-Binary/Buggy.glb',
    cover: 'https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?q=80&w=600&auto=format&fit=crop',
    category: 'Kendaraan',
    size: '6.4 MB'
  },
  {
    id: 'm16',
    name: 'Mesin Gearbox',
    url: 'https://raw.githubusercontent.com/KhronosGroup/glTF-Sample-Models/master/2.0/GearboxAssy/glTF-Binary/GearboxAssy.glb',
    cover: 'https://images.unsplash.com/photo-1537151377170-9c19a791bbea?q=80&w=600&auto=format&fit=crop',
    category: 'Mesin',
    size: '2.4 MB'
  }
];

export default function MarketPage() {
  const { activeWorkspace } = useWorkspace();
  const [importingId, setImportingId] = useState<string | null>(null);
  const [importedIds, setImportedIds] = useState<string[]>([]);
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const searchQuery = useDashboardStore((s) => s.searchQuery);
  const [activeFilter, setActiveFilter] = useState<string>('all');
  const [sortOrder, setSortOrder] = useState<'default' | 'name-asc' | 'name-desc'>('default');
  const [showFilterMenu, setShowFilterMenu] = useState(false);
  const [showSortMenu, setShowSortMenu] = useState(false);

  const categories = ['all', ...Array.from(new Set(MOCK_MARKET_ASSETS.map(a => a.category)))];

  let filteredAssets = MOCK_MARKET_ASSETS.filter(asset => 
    asset.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    asset.category.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (activeFilter !== 'all') {
    filteredAssets = filteredAssets.filter(a => a.category === activeFilter);
  }

  if (sortOrder === 'name-asc') {
    filteredAssets.sort((a, b) => a.name.localeCompare(b.name));
  } else if (sortOrder === 'name-desc') {
    filteredAssets.sort((a, b) => b.name.localeCompare(a.name));
  }

  const handleImport = async (asset: any) => {
    setImportingId(asset.id);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error("Sesi tidak valid");

      // Insert ke asset library
      const { error } = await supabase.from('assets').insert({
        user_id: session.user.id,
        workspace_id: activeWorkspace?.id ?? null,
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
    <div className="relative pb-10">
      {/* Ambient blur biru & kuning - nempel di background halaman, bukan di dalam kotak */}
      <div className="absolute inset-0 -z-10 overflow-hidden pointer-events-none">
        {/* biru: mulai di bawah judul, biar teks judul tetap putih bersih */}
        <div className="absolute top-[160px] left-0 w-[450px] h-[450px] bg-blue-200 rounded-full blur-[140px] opacity-40" />
        {/* kuning: ditaruh jauh di bawah supaya baru kelihatan pas discroll, dan dibikin lebih soft/tipis */}
        <div className="absolute top-[950px] left-0 w-[450px] h-[450px] bg-yellow-200 rounded-full blur-[160px] opacity-25" />
      </div>

      <div className="relative space-y-10">
        
        {/* Hero Banner */}
        <div className="bg-white rounded-[32px] p-8 md:p-12 flex flex-col md:flex-row items-center justify-between relative overflow-hidden border border-gray-100 shadow-[0_8px_30px_rgb(0,0,0,0.04)]">
          <div className="max-w-xl relative z-10 mb-8 md:mb-0">
            <div className="inline-block bg-[#E8F2F9] text-pln-blue font-bold text-[10px] px-3 py-1 rounded-full uppercase tracking-widest mb-6">
              MARKETPLACE ALPHA
            </div>
            <h1 className="text-4xl md:text-5xl font-black text-gray-900 leading-[1.1] mb-5 tracking-tight">
              Bring your stories to <br/> life with <span className="text-[#008080]">3D Assets</span>
            </h1>
            <p className="text-gray-500 text-sm md:text-base mb-8 leading-relaxed max-w-md">
              Discover thousands of high-fidelity, AR-ready assets optimized for mobile and web performance. From futuristic robotics to organic character models.
            </p>
            <div className="flex items-center gap-4">
              <button 
                onClick={() => document.getElementById('trending-section')?.scrollIntoView({ behavior: 'smooth' })}
                className="bg-pln-blue hover:bg-pln-blue-dark text-white px-6 py-2.5 rounded-xl font-bold text-sm transition-colors shadow-sm"
              >
                Browse All
              </button>
              <button 
                onClick={() => alert('Fitur Submit Asset akan segera hadir!')}
                className="border-2 border-pln-blue text-pln-blue hover:bg-blue-50 px-6 py-2.5 rounded-xl font-bold text-sm transition-colors"
              >
                Submit Asset
              </button>
            </div>
          </div>
          
          <div className="w-full md:w-1/2 h-[250px] md:h-[320px] relative rounded-2xl overflow-hidden shadow-inner bg-gray-50/50">
            {/* Soft edge blur effect */}
            <div className="absolute inset-0 ring-1 ring-inset ring-black/5 z-10 rounded-2xl" />
            <img 
              src="https://images.unsplash.com/photo-1485827404703-89b55fcc595e?q=80&w=800&auto=format&fit=crop" 
              alt="Hero 3D" 
              className="w-full h-full object-cover opacity-90 scale-105"
            />
            <div className="absolute inset-0 bg-gradient-to-r from-white via-transparent to-transparent z-10" />
            <div className="absolute inset-0 bg-gradient-to-t from-white/40 to-transparent z-10" />
          </div>
        </div>

        {/* Section Header */}
        <div id="trending-section" className="flex items-center justify-between">
          <h2 className="text-[22px] font-extrabold text-gray-900 tracking-tight">Trending Assets</h2>
          <div className="flex items-center gap-2 relative">
            
            {/* Filter Button */}
            <button 
              onClick={() => { setShowFilterMenu(!showFilterMenu); setShowSortMenu(false); }}
              className={`p-2.5 bg-white border border-gray-200 rounded-full transition-colors shadow-sm ${activeFilter !== 'all' ? 'text-pln-blue border-pln-blue bg-blue-50' : 'text-gray-600 hover:bg-gray-50'}`}
            >
              <Filter size={16} />
            </button>

            {/* Filter Dropdown */}
            {showFilterMenu && (
              <div className="absolute right-12 top-12 w-48 bg-white border border-gray-100 rounded-2xl shadow-xl z-50 py-2">
                <div className="px-4 py-2 border-b border-gray-50 mb-1">
                  <p className="text-xs font-bold text-gray-500 uppercase">Filter Kategori</p>
                </div>
                {categories.map(cat => (
                  <button 
                    key={cat}
                    onClick={() => { setActiveFilter(cat); setShowFilterMenu(false); }}
                    className={`w-full text-left px-4 py-2 text-sm hover:bg-gray-50 transition-colors ${activeFilter === cat ? 'text-pln-blue font-bold bg-blue-50/50' : 'text-gray-700'}`}
                  >
                    {cat === 'all' ? 'Semua Kategori' : cat}
                  </button>
                ))}
              </div>
            )}

            {/* Sort Button */}
            <button 
              onClick={() => { setShowSortMenu(!showSortMenu); setShowFilterMenu(false); }}
              className={`p-2.5 bg-white border border-gray-200 rounded-full transition-colors shadow-sm ${sortOrder !== 'default' ? 'text-pln-blue border-pln-blue bg-blue-50' : 'text-gray-600 hover:bg-gray-50'}`}
            >
              <SlidersHorizontal size={16} />
            </button>

            {/* Sort Dropdown */}
            {showSortMenu && (
              <div className="absolute right-0 top-12 w-48 bg-white border border-gray-100 rounded-2xl shadow-xl z-50 py-2">
                <div className="px-4 py-2 border-b border-gray-50 mb-1">
                  <p className="text-xs font-bold text-gray-500 uppercase">Urutkan</p>
                </div>
                <button onClick={() => { setSortOrder('default'); setShowSortMenu(false); }} className={`w-full text-left px-4 py-2 text-sm hover:bg-gray-50 ${sortOrder === 'default' ? 'text-pln-blue font-bold' : 'text-gray-700'}`}>Default</button>
                <button onClick={() => { setSortOrder('name-asc'); setShowSortMenu(false); }} className={`w-full text-left px-4 py-2 text-sm hover:bg-gray-50 ${sortOrder === 'name-asc' ? 'text-pln-blue font-bold' : 'text-gray-700'}`}>Nama (A-Z)</button>
                <button onClick={() => { setSortOrder('name-desc'); setShowSortMenu(false); }} className={`w-full text-left px-4 py-2 text-sm hover:bg-gray-50 ${sortOrder === 'name-desc' ? 'text-pln-blue font-bold' : 'text-gray-700'}`}>Nama (Z-A)</button>
              </div>
            )}

          </div>
        </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {filteredAssets.map((asset) => {
          const isImporting = importingId === asset.id;
          const isImported = importedIds.includes(asset.id);

          return (
            <div 
              key={asset.id} 
              className="bg-white border border-gray-100 rounded-3xl p-3 shadow-sm hover:shadow-lg hover:-translate-y-1 transition-all duration-300 flex flex-col group relative"
              onMouseEnter={() => setHoveredId(asset.id)}
              onMouseLeave={() => setHoveredId(null)}
            >
              <div className="h-44 bg-gray-50 rounded-2xl mb-4 relative overflow-hidden flex items-center justify-center">
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
                    <div className="w-full h-full relative p-2">
                      <img 
                        src={asset.cover} 
                        alt={asset.name} 
                        className="w-full h-full object-cover rounded-xl transition-transform duration-700 group-hover:scale-110"
                      />
                    </div>
                  )}
                </div>
                
                {/* NEW Badge like Figma */}
                <div className="absolute top-3 right-3 bg-white px-2 py-0.5 rounded text-[9px] font-bold text-teal-600 uppercase tracking-widest shadow-sm">
                  NEW
                </div>
              </div>
              
              <div className="px-2 flex flex-col flex-1 pb-1">
                <h3 className="font-bold text-gray-900 text-lg leading-tight mb-1 truncate">{asset.name}</h3>
                <p className="text-[11px] text-gray-500 mb-5 leading-tight font-medium opacity-80">
                  {asset.category} • {asset.size} <br/> format .glb
                </p>
                
                <div className="mt-auto">
                  <button
                    onClick={() => handleImport(asset)}
                    disabled={isImporting || isImported}
                    className={`w-full py-2.5 rounded-xl font-bold text-[13px] flex items-center justify-center gap-2 transition-all duration-300 ${
                      isImported 
                        ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' 
                        : 'bg-pln-blue text-white hover:bg-pln-blue-dark shadow-[0_4px_14px_0_rgba(0,92,154,0.25)] hover:shadow-[0_6px_20px_rgba(0,92,154,0.23)] border border-transparent'
                    } disabled:opacity-70`}
                  >
                    {isImporting ? (
                      <Loader2 className="animate-spin" size={16} />
                    ) : isImported ? (
                      <CheckCircle2 size={16} />
                    ) : (
                      <DownloadCloud size={16} />
                    )}
                    {isImporting ? 'Saving...' : isImported ? 'Saved' : 'Save'}
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
      
      {filteredAssets.length === 0 && (
        <div className="flex flex-col items-center justify-center p-10 text-gray-500 bg-white/50 rounded-2xl border border-dashed border-gray-300">
          <Store size={48} className="mb-4 text-gray-300" />
          <p className="font-bold">Tidak ada aset yang cocok</p>
          <p className="text-sm">Coba kata kunci pencarian yang lain.</p>
        </div>
      )}

      </div>
    </div>
  );
}