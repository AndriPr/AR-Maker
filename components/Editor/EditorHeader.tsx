import Link from 'next/link';
import { ArrowLeft, Layers, Loader2, Save, QrCode, Play, Rocket, Settings } from 'lucide-react';

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
  return (
    <header className="absolute top-0 left-0 right-0 bg-[#1a1b1e] border-b border-[#2b2d31] flex items-center justify-between px-4 shrink-0 z-50 h-14 shadow-md">
      <div className="flex items-center gap-4">
        <Link href="/" className="text-gray-400 hover:text-white transition-colors bg-[#2b2d31] hover:bg-[#36393f] p-1.5 rounded-md">
          <ArrowLeft size={18} />
        </Link>
        
        <button 
          onClick={() => setLeftPanelOpen(!isLeftPanelOpen)} 
          className="md:hidden p-1.5 text-gray-400 hover:text-white bg-[#2b2d31] rounded-md transition-colors"
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
      
      <div className="flex items-center gap-2">
        {/* Undo/Redo */}
        <div className="hidden sm:flex bg-[#2b2d31] rounded-md overflow-hidden border border-[#36393f]">
          <button onClick={() => undo()} className="p-1.5 text-gray-400 hover:text-white hover:bg-[#36393f] transition-colors" title="Undo"><ArrowLeft size={16} /></button>
          <div className="w-px bg-[#36393f]"></div>
          <button onClick={() => redo()} className="p-1.5 text-gray-400 hover:text-white hover:bg-[#36393f] transition-colors" title="Redo"><ArrowLeft size={16} className="rotate-180" /></button>
        </div>
        
        <div className="hidden sm:block h-6 w-px bg-[#36393f] mx-2"></div>

        <button onClick={() => handleSave(false)} disabled={saving} className="flex items-center justify-center px-3 py-1.5 text-xs font-bold text-gray-300 hover:text-white hover:bg-[#2b2d31] border border-transparent hover:border-[#36393f] rounded-md transition-all disabled:opacity-50">
          {saving ? <Loader2 size={14} className="animate-spin sm:mr-2" /> : <Save size={14} className="sm:mr-2" />}
          <span className="hidden sm:inline">Save</span>
        </button>
        
        <button onClick={handlePreview} disabled={saving} className="hidden sm:flex items-center px-3 py-1.5 text-xs font-bold text-gray-300 hover:text-white bg-indigo-500/20 hover:bg-indigo-500/30 border border-indigo-500/30 rounded-md transition-all">
          <QrCode size={14} className="mr-2 text-indigo-400" />
          <span>Scan Preview</span>
        </button>
        
        <button onClick={() => setIsSimulating(true)} className="flex items-center px-4 py-1.5 text-xs font-bold text-white bg-green-500 hover:bg-green-600 rounded-md shadow-sm transition-all">
          <Play size={14} className="mr-2" />
          <span>Simulate AR</span>
        </button>

        <button onClick={handlePublish} disabled={saving || publishProgress !== null || activeRole === 'viewer'} className={`flex items-center px-4 py-1.5 text-xs font-bold text-white rounded-md shadow-sm transition-all disabled:opacity-50 ${(activeRole === 'editor') ? 'bg-orange-500 hover:bg-orange-600' : 'bg-pln-blue hover:bg-pln-blue-dark'}`}>
          {saving ? <Loader2 size={14} className="animate-spin mr-2" /> : <Rocket size={14} className="mr-2" />}
          <span>{(activeRole === 'editor') ? 'Request Publish' : 'Publish'}</span>
        </button>

        <button 
          onClick={() => setRightPanelOpen(!isRightPanelOpen)} 
          className="p-1.5 text-gray-400 hover:text-white bg-[#2b2d31] rounded-md transition-colors ml-1 hidden sm:block"
          title="Toggle Properties"
        >
          <Settings size={18} />
        </button>
        
        <button 
          onClick={() => setRightPanelOpen(!isRightPanelOpen)} 
          className="sm:hidden p-1.5 text-gray-400 hover:text-white bg-[#2b2d31] rounded-md transition-colors ml-1"
        >
          <Settings size={18} />
        </button>
      </div>
    </header>
  );
}
