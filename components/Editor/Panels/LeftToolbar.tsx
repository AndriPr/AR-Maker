import { 
  FolderOpen, Box, LayoutTemplate, Type, 
  Wrench, Clock, MousePointerClick, Video, Music, 
  Sparkles, LayoutDashboard, MapPin, Square, Film
} from 'lucide-react';
import { SceneElement, useEditorStore } from '@/lib/store';

interface LeftToolbarProps {
  isLeftPanelOpen: boolean;
  setLeftPanelOpen: (open: boolean) => void;
  leftPanelTab: 'hierarchy' | 'library' | 'media' | 'interact' | 'prefabs';
  setLeftPanelTab: (tab: 'hierarchy' | 'library' | 'media' | 'interact' | 'prefabs') => void;
  setShowLogicEditor: (show: boolean) => void;
  addElement: (element: Omit<SceneElement, 'id'>) => void;
  elements: SceneElement[];
}

export function LeftToolbar({
  isLeftPanelOpen,
  setLeftPanelOpen,
  leftPanelTab,
  setLeftPanelTab,
  setShowLogicEditor,
  addElement,
  elements
}: LeftToolbarProps) {
  const showTimeline = useEditorStore(state => state.showTimeline);
  const setShowTimeline = useEditorStore(state => state.setShowTimeline);

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
    <aside className="hidden md:flex pointer-events-auto absolute top-14 bottom-0 left-0 z-30 w-12 bg-[#1a1b1e] border-r border-[#2b2d31] flex-col items-center py-4 gap-4 shadow-xl overflow-y-auto custom-scrollbar">
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

      <button 
        onClick={() => {
          if (isLeftPanelOpen && leftPanelTab === 'media') setLeftPanelOpen(false);
          else { setLeftPanelOpen(true); setLeftPanelTab('media'); }
        }}
        className={`p-2 rounded-lg transition-colors ${isLeftPanelOpen && leftPanelTab === 'media' ? 'bg-pln-blue/20 text-pln-blue' : 'text-gray-400 hover:text-white hover:bg-[#2b2d31]'}`}
        title="Media & VFX"
      >
        <Film size={18} />
      </button>

      <button 
        onClick={() => {
          if (isLeftPanelOpen && leftPanelTab === 'interact') setLeftPanelOpen(false);
          else { setLeftPanelOpen(true); setLeftPanelTab('interact'); }
        }}
        className={`p-2 rounded-lg transition-colors ${isLeftPanelOpen && leftPanelTab === 'interact' ? 'bg-pln-blue/20 text-pln-blue' : 'text-gray-400 hover:text-white hover:bg-[#2b2d31]'}`}
        title="Interactivity"
      >
        <MousePointerClick size={18} />
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