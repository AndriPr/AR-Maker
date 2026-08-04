const fs = require('fs');
let content = fs.readFileSync('backup.tsx', 'utf8');

// Update LeftPanelExpandedProps
content = content.replace(
  /leftPanelTab: 'hierarchy' \| 'library' \| 'shapes' \| 'prefabs';/g,
  "leftPanelTab: 'hierarchy' | 'library' | 'media' | 'interact' | 'prefabs';"
);

// Extract shapes section
const shapesRegex = /\{leftPanelTab === 'shapes' && \([\s\S]*?<\/>\s*\)\}/;
const shapesMatch = content.match(shapesRegex);
let shapesContent = shapesMatch ? shapesMatch[0] : '';
content = content.replace(shapesRegex, '');

// Clean up shapes content to inject inside library
shapesContent = shapesContent.replace(/\{leftPanelTab === 'shapes' && \(\s*<>\s*/, '');
shapesContent = shapesContent.replace(/\s*<\/>\s*\)\}$/, '');

// Add a title to shapesContent to match the design
shapesContent = 
            <div className="flex border-b border-[#2b2d31] bg-[#1a1b1e] mt-4">
              <button className="flex-1 py-3 text-[10px] font-bold text-white border-b-2 border-pln-blue bg-[#202227]">BASIC SHAPES</button>
            </div>
 + shapesContent;

content = content.replace(/(<\/>\s*\)\}\s*\{leftPanelTab === 'prefabs')/, shapesContent + "\n        " + "");

const extraTabs = 
        {leftPanelTab === 'media' && (
          <>
            <div className="flex border-b border-[#2b2d31] bg-[#1a1b1e]">
              <button className="flex-1 py-3 text-[10px] font-bold text-white border-b-2 border-pln-blue bg-[#202227]">MEDIA & VFX</button>
            </div>
            <div className="flex-1 overflow-y-auto custom-scrollbar p-4 space-y-3 bg-[#202227]">
              <button onClick={() => addElement({ type: 'video', name: 'Video', position: [0, 0, 0], rotation: [0, 0, 0], scale: [1, 1, 1], url: 'https://storage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4' })} className="w-full bg-[#1a1b1e] border border-[#2b2d31] p-3 rounded-lg flex items-center gap-3 hover:border-pln-blue text-left transition-colors text-gray-300 hover:text-white">
                <Video size={18} className="text-pln-blue" />
                <div>
                  <div className="text-xs font-bold">Video Player</div>
                  <div className="text-[10px] text-gray-500">Putar video MP4 di ruang 3D</div>
                </div>
              </button>

              <button onClick={() => addElement({ type: 'audio', name: 'Audio BGM', position: [0, 0, 0], rotation: [0, 0, 0], scale: [1, 1, 1], url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3' })} className="w-full bg-[#1a1b1e] border border-[#2b2d31] p-3 rounded-lg flex items-center gap-3 hover:border-pln-blue text-left transition-colors text-gray-300 hover:text-white">
                <Music size={18} className="text-[#9b59b6]" />
                <div>
                  <div className="text-xs font-bold">Audio Musik</div>
                  <div className="text-[10px] text-gray-500">Putar suara MP3/WAV latar</div>
                </div>
              </button>

              <button onClick={() => addElement({ type: 'vfx_sparkles', name: 'Efek Sparkles', position: [0, 0, 0], rotation: [0, 0, 0], scale: [1, 1, 1], sparkleColor: '#f1c40f', sparkleCount: 50, sparkleSize: 4 })} className="w-full bg-[#1a1b1e] border border-[#2b2d31] p-3 rounded-lg flex items-center gap-3 hover:border-pln-blue text-left transition-colors text-gray-300 hover:text-white">
                <Sparkles size={18} className="text-[#f1c40f]" />
                <div>
                  <div className="text-xs font-bold">Partikel VFX</div>
                  <div className="text-[10px] text-gray-500">Tambahkan efek debu bersinar</div>
                </div>
              </button>
            </div>
          </>
        )}

        {leftPanelTab === 'interact' && (
          <>
            <div className="flex border-b border-[#2b2d31] bg-[#1a1b1e]">
              <button className="flex-1 py-3 text-[10px] font-bold text-white border-b-2 border-pln-blue bg-[#202227]">INTERACTIVITY</button>
            </div>
            <div className="flex-1 overflow-y-auto custom-scrollbar p-4 space-y-3 bg-[#202227]">
              <button 
                onClick={() => {
                  const animatedModels = elements.filter(el => el.type === '3d_model' && el.availableAnimations && el.availableAnimations.length > 0);
                  const defaultTarget = animatedModels.length > 0 ? animatedModels[0].id : '';
                  const defaultAnim = animatedModels.length > 0 && animatedModels[0].availableAnimations ? animatedModels[0].availableAnimations[0] : '';
                  addElement({ 
                    type: 'ui_button', 
                    name: 'Tombol Aksi', 
                    position: [0, -1, 0], 
                    rotation: [0, 0, 0], 
                    scale: [1, 1, 1], 
                    buttonText: 'Mulai Animasi',
                    actionTargetId: defaultTarget,
                    actionAnimation: defaultAnim
                  });
                }}
                className="w-full bg-[#1a1b1e] border border-[#2b2d31] p-3 rounded-lg flex items-center gap-3 hover:border-pln-blue text-left transition-colors text-gray-300 hover:text-white"
              >
                <MousePointerClick size={18} className="text-[#2ecc71]" />
                <div>
                  <div className="text-xs font-bold">Tombol Interaktif</div>
                  <div className="text-[10px] text-gray-500">Buat UI untuk pemicu aksi</div>
                </div>
              </button>

              <button 
                onClick={() => {
                  addElement({
                    type: 'hotspot',
                    name: 'Hotspot',
                    position: [0, 0, 0],
                    rotation: [0, 0, 0],
                    scale: [1, 1, 1],
                    hotspotText: 'Penjelasan...'
                  });
                }}
                className="w-full bg-[#1a1b1e] border border-[#2b2d31] p-3 rounded-lg flex items-center gap-3 hover:border-pln-blue text-left transition-colors text-gray-300 hover:text-white"
              >
                <MapPin size={18} className="text-[#e74c3c]" />
                <div>
                  <div className="text-xs font-bold">Hotspot Label</div>
                  <div className="text-[10px] text-gray-500">Titik info melayang di objek</div>
                </div>
              </button>

              <button 
                onClick={() => {
                  addElement({ 
                    type: 'edu_panel', 
                    name: 'Edu Dashboard', 
                    position: [0, 0, 0], 
                    rotation: [0, 0, 0], 
                    scale: [1, 1, 1], 
                    panelTitle: 'NAMA KOMPONEN',
                    eduComponents: [],
                    eduMaintenanceTasks: []
                  });
                }}
                className="w-full bg-[#1a1b1e] border border-[#2b2d31] p-3 rounded-lg flex items-center gap-3 hover:border-pln-blue text-left transition-colors text-gray-300 hover:text-white"
              >
                <LayoutDashboard size={18} className="text-[#3498db]" />
                <div>
                  <div className="text-xs font-bold">Panel Edukasi</div>
                  <div className="text-[10px] text-gray-500">UI Dashboard info lengkap</div>
                </div>
              </button>
            </div>
          </>
        )}
\;

content = content.replace(/(<\/>\s*\)\}\s*\{leftPanelTab === 'prefabs')/, extraTabs + "\n        " + "");

fs.writeFileSync('components/Editor/Panels/LeftPanelExpanded.tsx', content, 'utf8');
