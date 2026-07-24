import { 
  FolderOpen, Box, Shapes, LayoutTemplate, Type, 
  Wrench, Clock, MousePointerClick, Video, Music, 
  Sparkles, LayoutDashboard, MapPin, Square 
} from 'lucide-react';
import { SceneElement } from '@/lib/store';

interface LeftToolbarProps {
  isLeftPanelOpen: boolean;
  setLeftPanelOpen: (open: boolean) => void;
  leftPanelTab: 'hierarchy' | 'library' | 'shapes' | 'prefabs';
  setLeftPanelTab: (tab: 'hierarchy' | 'library' | 'shapes' | 'prefabs') => void;
  showTimeline: boolean;
  setShowTimeline: (show: boolean) => void;
  setShowLogicEditor: (show: boolean) => void;
  addElement: (element: Omit<SceneElement, 'id'>) => void;
  elements: SceneElement[];
}

export function LeftToolbar({
  isLeftPanelOpen,
  setLeftPanelOpen,
  leftPanelTab,
  setLeftPanelTab,
  showTimeline,
  setShowTimeline,
  setShowLogicEditor,
  addElement,
  elements
}: LeftToolbarProps) {

  const handleAddText = () => {
    addElement({
      type: '3d_text',
      name: 'Text 3D',
      position: [0, 0, 0],
      rotation: [0, 0, 0],
      scale: [1, 1, 1],
      content: 'Hello AR',
      color: '#ffffff',
      is3D: true,
      fontFamily: 'Roboto',
      textEffect: 'none'
    });
  };

  return (
    <aside className="pointer-events-auto absolute top-14 bottom-0 left-0 z-30 w-12 bg-[#1a1b1e] border-r border-[#2b2d31] flex flex-col items-center py-4 gap-4 shadow-xl overflow-y-auto custom-scrollbar">
      <button 
        onClick={() => {
          if (isLeftPanelOpen && leftPanelTab === 'hierarchy') setLeftPanelOpen(false);
          else { setLeftPanelOpen(true); setLeftPanelTab('hierarchy'); }
        }}
        className={`p-2 rounded-lg transition-colors ${isLeftPanelOpen && leftPanelTab === 'hierarchy' ? 'bg-pln-blue/20 text-pln-blue' : 'text-gray-400 hover:text-white hover:bg-[#2b2d31]'}`}
        title="Scene Hierarchy"
      >
        <FolderOpen size={18} />
      </button>
      
      <div className="w-6 h-px bg-[#2b2d31]"></div>
      
      <button 
        onClick={() => {
          if (isLeftPanelOpen && leftPanelTab === 'library') setLeftPanelOpen(false);
          else { setLeftPanelOpen(true); setLeftPanelTab('library'); }
        }}
        className={`p-2 rounded-lg transition-colors ${isLeftPanelOpen && leftPanelTab === 'library' ? 'bg-pln-blue/20 text-pln-blue' : 'text-gray-400 hover:text-white hover:bg-[#2b2d31]'}`}
        title="Asset Library"
      >
        <Box size={18} />
      </button>
      
      <div className="w-6 h-px bg-[#2b2d31]"></div>
      
      <button 
        onClick={() => {
          if (isLeftPanelOpen && leftPanelTab === 'shapes') setLeftPanelOpen(false);
          else { setLeftPanelOpen(true); setLeftPanelTab('shapes'); }
        }}
        className={`p-2 rounded-lg transition-colors ${isLeftPanelOpen && leftPanelTab === 'shapes' ? 'bg-pln-blue/20 text-pln-blue' : 'text-gray-400 hover:text-white hover:bg-[#2b2d31]'}`}
        title="Basic Shapes"
      >
        <Shapes size={18} />
      </button>
      
      <div className="w-6 h-px bg-[#2b2d31]"></div>
      
      <button 
        onClick={() => {
          if (isLeftPanelOpen && leftPanelTab === 'prefabs') setLeftPanelOpen(false);
          else { setLeftPanelOpen(true); setLeftPanelTab('prefabs'); }
        }}
        className={`p-2 rounded-lg transition-colors ${isLeftPanelOpen && leftPanelTab === 'prefabs' ? 'bg-pln-blue/20 text-pln-blue' : 'text-gray-400 hover:text-white hover:bg-[#2b2d31]'}`}
        title="Templates (Prefabs)"
      >
        <LayoutTemplate size={18} />
      </button>

      <div className="w-6 h-px bg-[#2b2d31]"></div>

      <button onClick={handleAddText} className="p-2 text-gray-400 hover:text-white hover:bg-[#2b2d31] rounded-lg transition-colors" title="Add Text">
        <Type size={18} />
      </button>
      
      <button 
        onClick={() => setShowLogicEditor(true)} 
        className="p-2 text-orange-400 hover:text-white hover:bg-orange-500/20 bg-orange-500/10 rounded-lg border border-orange-500/30 transition-colors" 
        title="Open Visual Scripting (Logic Nodes)"
      >
        <Wrench size={18} />
      </button>
      
      <button 
        onClick={() => setShowTimeline(!showTimeline)} 
        className={`p-2 rounded-lg transition-colors border ${showTimeline ? 'text-pln-blue bg-pln-blue/20 border-pln-blue/30' : 'text-gray-400 hover:text-white hover:bg-[#2b2d31] border-transparent'}`} 
        title="Toggle Timeline Animation"
      >
        <Clock size={18} />
      </button>
      
      <div className="w-6 h-px bg-[#2b2d31]"></div>
      
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
        className="p-2 text-gray-400 hover:text-white hover:bg-[#2b2d31] rounded-lg transition-colors" 
        title="Add Interactive Button"
      >
        <MousePointerClick size={18} />
      </button>
      
      <div className="w-6 h-px bg-[#2b2d31]"></div>
      
      <button onClick={() => addElement({ type: 'video', name: 'Video Layar', position: [0, 0, 0], rotation: [0, 0, 0], scale: [1, 1, 1], url: 'https://storage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4' })} className="p-2 text-gray-400 hover:text-white hover:bg-[#2b2d31] rounded-lg transition-colors" title="Add Video">
        <Video size={18} />
      </button>
      
      <button onClick={() => addElement({ type: 'audio', name: 'Audio BGM', position: [0, 0, 0], rotation: [0, 0, 0], scale: [1, 1, 1], url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3' })} className="p-2 text-gray-400 hover:text-white hover:bg-[#2b2d31] rounded-lg transition-colors" title="Add Audio">
        <Music size={18} />
      </button>
      
      <button onClick={() => addElement({ type: 'vfx_sparkles', name: 'Efek Sparkles', position: [0, 0, 0], rotation: [0, 0, 0], scale: [1, 1, 1], sparkleColor: '#f1c40f', sparkleCount: 50, sparkleSize: 4 })} className="p-2 text-gray-400 hover:text-white hover:bg-[#2b2d31] rounded-lg transition-colors" title="Add Particle VFX">
        <Sparkles size={18} />
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
        className="p-2 text-gray-400 hover:text-white hover:bg-[#2b2d31] rounded-lg transition-colors" 
        title="Add UI Dashboard (Edu Panel)"
      >
        <LayoutDashboard size={18} />
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
        className="p-2 text-gray-400 hover:text-white hover:bg-[#2b2d31] rounded-lg transition-colors" 
        title="Add Hotspot Penjelasan"
      >
        <MapPin size={18} />
      </button>

      <div className="w-6 h-px bg-[#2b2d31]"></div>
      
      <button 
        onClick={() => {
          addElement({
            type: 'occluder_plane',
            name: 'Occluder Plane',
            position: [0, 0, 0],
            rotation: [0, 0, 0],
            scale: [1, 1, 1]
          });
        }} 
        className="p-2 text-gray-400 hover:text-[#ff00ff] hover:bg-[#2b2d31] rounded-lg transition-colors" 
        title="Add Occluder Plane (Depth Masking)"
      >
        <Square size={18} />
      </button>

      <button 
        onClick={() => {
          addElement({
            type: 'occluder_cube',
            name: 'Occluder Cube',
            position: [0, 0, 0],
            rotation: [0, 0, 0],
            scale: [1, 1, 1]
          });
        }} 
        className="p-2 text-gray-400 hover:text-[#ff00ff] hover:bg-[#2b2d31] rounded-lg transition-colors" 
        title="Add Occluder Cube (Depth Masking)"
      >
        <Box size={18} />
      </button>

    </aside>
  );
}
