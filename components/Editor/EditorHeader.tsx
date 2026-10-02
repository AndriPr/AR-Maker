import Link from 'next/link';
import { ArrowLeft, Layers, Loader2, Save, QrCode, Play, Rocket, Settings, Download, Globe, Box, Magnet, Undo2, Redo2 } from 'lucide-react';
import { motion } from 'framer-motion';
import { useEditorStore } from '@/lib/store';

interface EditorHeaderProps {
  project: any;
  saving: boolean;
  lastSaved: Date | null;
  publishProgress: string | null;
  activeRole: string | null;
  isLeftPanelOpen: boolean;
  setLeftPanelOpen: (open: boolean) => void;
  isRightPanelOpen: boolean;
  setRightPanelOpen: (open: boolean) => void;
  handleSave: (silent: boolean) => void;
  handlePreview: () => void;
  handlePublish: () => void;
  undo: () => void;
  redo: () => void;
  setIsSimulating: (simulating: boolean) => void;
}

export function EditorHeader({
  project,
  saving,
  lastSaved,
  publishProgress,
  activeRole,
  isLeftPanelOpen,
  setLeftPanelOpen,
  isRightPanelOpen,
  setRightPanelOpen,
  handleSave,
  handlePreview,
  handlePublish,
  undo,
  redo,
  setIsSimulating
}: EditorHeaderProps) {
  const transformSpace = useEditorStore(state => state.transformSpace);
  const setTransformSpace = useEditorStore(state => state.setTransformSpace);
  const isSnapping = useEditorStore(state => state.isSnapping);
  const setIsSnapping = useEditorStore(state => state.setIsSnapping);
  const snapGrid = useEditorStore(state => state.snapGrid);
  const setSnapGrid = useEditorStore(state => state.setSnapGrid);

  return (
    <motion.header 
      initial={{ y: -50, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ type: 'spring', damping: 20, stiffness: 200 }}
      className="absolute top-0 left-0 right-0 bg-[#0B132B] border-b border-[#1A223A] flex items-center justify-between px-4 shrink-0 z-50 h-14 shadow-md"
    >
      <div className="flex items-center gap-4">
        <Link href="/" className="text-gray-400 hover:text-white transition-colors hover:bg-[#1A223A] p-1.5 rounded-md">
          <ArrowLeft size={18} />
        </Link>
        
        <button 
          onClick={() => setLeftPanelOpen(!isLeftPanelOpen)} 
          className="md:hidden p-1.5 text-gray-400 hover:text-white bg-[#1A223A] rounded-md transition-colors"
        >
          <Layers size={18} />
        </button>

        <div className="h-6 w-px bg-[#36393f] hidden sm:block"></div>
        <div className="hidden sm:block">
          <h1 className="text-sm font-bold text-white truncate max-w-[200px]">{project?.title || 'AR Project'}</h1>
          <p className="text-[10px] text-gray-400 flex items-center gap-1 mt-0.5">
            <span className="w-1.5 h-1.5 bg-green-500 rounded-full inline-block"></span>
            {saving ? 'Menyimpan...' : lastSaved ? 'All Changes Saved' : 'Belum disimpan'}
          </p>
        </div>
      </div>
      
      <div className="flex items-center gap-3">
        {/* Global/Local Space Toggle */}
        <div className="hidden sm:flex items-center bg-[#2b2d31] rounded-md overflow-hidden border border-[#36393f] mr-1">
          <button 
            onClick={() => setTransformSpace(transformSpace === 'world' ? 'local' : 'world')}
            className="flex items-center gap-1.5 px-2 py-1 text-[10px] font-bold text-gray-300 hover:text-white hover:bg-[#36393f] transition-colors"
            title={`Transform Space: ${transformSpace.toUpperCase()} (Shortcut: ,)`}
          >
            {transformSpace === 'world' ? <Globe size={14} className="text-blue-400" /> : <Box size={14} className="text-orange-400" />}
            {transformSpace === 'world' ? 'Global' : 'Local'}
          </button>
        </div>

        {/* Snapping Control */}
        <div className="hidden sm:flex items-center bg-[#2b2d31] rounded-md overflow-hidden border border-[#36393f]">
          <button 
            onClick={() => setIsSnapping(!isSnapping)}
            className={`p-1.5 transition-colors ${isSnapping ? 'bg-indigo-500 text-white' : 'text-gray-400 hover:text-white hover:bg-[#36393f]'}`}
            title="Toggle Snapping"
          >
            <Magnet size={14} />
          </button>
          {isSnapping && (
            <input 
              type="number"
              min="0.01"
              step="0.1"
              value={snapGrid}
              onChange={(e) => setSnapGrid(parseFloat(e.target.value) || 0.5)}
              className="w-12 bg-transparent text-[10px] font-mono text-white px-1 outline-none border-l border-[#36393f]"
              title="Snap Grid (meters)"
            />
          )}
        </div>

        <div className="hidden sm:block h-6 w-px bg-[#36393f] mx-1"></div>

        <button onClick={() => handleSave(false)} disabled={saving} className="flex items-center justify-center px-3 py-1.5 text-xs font-bold text-gray-300 hover:text-white hover:bg-[#1A223A] border border-transparent rounded-md transition-all disabled:opacity-50">
          {saving ? <Loader2 size={14} className="animate-spin sm:mr-2" /> : <Save size={14} className="sm:mr-2" />}
          <span className="hidden sm:inline">Save</span>
        </button>
        
        <button onClick={handlePreview} disabled={saving} className="hidden sm:flex items-center justify-center p-2 text-gray-400 hover:text-white bg-transparent hover:bg-[#1A223A] border border-transparent rounded-md transition-all" title="Scan Preview (QR Code)">
          <QrCode size={18} />
        </button>

        <button 
          onClick={() => window.dispatchEvent(new CustomEvent('export-glb'))} 
          className="hidden sm:flex items-center justify-center p-2 text-gray-400 hover:text-white bg-transparent hover:bg-[#1A223A] border border-transparent rounded-md transition-all"
          title="Export WebXR (.glb)"
        >
          <Download size={18} />
        </button>

        <button onClick={() => setIsSimulating(true)} className="flex items-center px-4 py-1.5 text-xs font-bold text-[#62E5FF] bg-transparent border border-[#62E5FF] hover:bg-[#62E5FF]/10 rounded-md shadow-sm transition-all ml-2">
          <Play size={14} className="mr-2" />
          <span>Simulate AR</span>
        </button>

        <button onClick={handlePublish} disabled={saving || publishProgress !== null || activeRole === 'viewer'} className={`flex items-center px-5 py-1.5 text-xs font-extrabold text-black rounded-md shadow-sm transition-all disabled:opacity-50 ${(activeRole === 'editor') ? 'bg-orange-500 hover:bg-orange-600' : 'bg-[#FFC107] hover:bg-[#FFB300]'}`}>
          {saving ? <Loader2 size={14} className="animate-spin mr-1" /> : <Rocket size={14} className="mr-1" />}
          <span>{(activeRole === 'editor') ? 'Request Publish' : 'Publish'}</span>
        </button>

        <button 
          onClick={() => setRightPanelOpen(!isRightPanelOpen)} 
          className="p-1.5 text-gray-400 hover:text-white bg-transparent hover:bg-[#1A223A] rounded-md transition-colors ml-1 hidden sm:block"
          title="Toggle Properties"
        >
          <Settings size={18} />
        </button>
        
        <button 
          onClick={() => setRightPanelOpen(!isRightPanelOpen)} 
          className="sm:hidden p-1.5 text-gray-400 hover:text-white bg-transparent hover:bg-[#1A223A] rounded-md transition-colors ml-1"
        >
          <Settings size={18} />
        </button>
      </div>
    </motion.header>
  );
}
