import Link from 'next/link';
import { LayoutDashboard, FolderOpen, BarChart3, LogOut, Zap, PlusSquare, X, Trash2, Store, Building2, ChevronsUpDown, Settings } from 'lucide-react';
import { useWorkspace } from '@/components/providers/WorkspaceProvider';
import { usePathname, useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';

export default function Sidebar({ isOpen, onClose }: { isOpen?: boolean, onClose?: () => void }) {
  const pathname = usePathname();
  const router = useRouter();
  const { workspaces, activeWorkspace, activeRole, setActiveWorkspaceId, isLoading } = useWorkspace();
  
  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/login');
  };
  
  return (
    <aside className={`w-64 h-screen bg-white border-r border-gray-100 flex flex-col fixed left-0 top-0 z-50 transform transition-transform duration-300 ease-in-out md:translate-x-0 ${isOpen ? 'translate-x-0' : '-translate-x-full'}`}>
      <div className="p-4 sm:p-6 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <div className="bg-pln-yellow p-1 rounded-md">
            <Zap size={24} className="text-white fill-current" />
          </div>
          <span className="text-xl font-bold text-pln-blue-dark">AR<span className="text-pln-blue font-light">Maker</span></span>
        </div>
        {/* Close button for mobile */}
        <button onClick={onClose} className="md:hidden p-2 text-gray-500 hover:bg-gray-100 rounded-lg transition-colors">
          <X size={20} />
        </button>
      </div>

      {/* Workspace Switcher */}
      {!isLoading && (
        <div className="px-4 sm:px-6 mb-4">
          <div className="relative group">
            <button className="w-full flex items-center justify-between gap-2 bg-gray-50 border border-gray-100 hover:border-gray-200 p-2.5 rounded-xl transition-all">
              <div className="flex items-center gap-3 overflow-hidden">
                <div className="bg-pln-blue/10 p-1.5 rounded-lg text-pln-blue shrink-0">
                  <Building2 size={16} />
                </div>
                <div className="flex flex-col items-start text-left truncate">
                  <span className="text-xs font-bold text-gray-900 truncate w-full">{activeWorkspace?.name || 'Personal Workspace'}</span>
                  <span className="text-[10px] text-gray-500 uppercase tracking-wider">{activeRole}</span>
                </div>
              </div>
              <ChevronsUpDown size={14} className="text-gray-400 shrink-0" />
            </button>
            
            <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-100 shadow-xl rounded-xl p-2 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-50 max-h-48 overflow-y-auto">
              <p className="text-[10px] font-bold text-gray-400 px-2 py-1 uppercase tracking-wider">Switch Workspace</p>
              {workspaces.map(ws => (
                <button 
                  key={ws.id}
                  onClick={() => setActiveWorkspaceId(ws.id)}
                  className={`w-full text-left px-2 py-2 text-xs rounded-lg transition-colors flex items-center gap-2 ${activeWorkspace?.id === ws.id ? 'bg-blue-50 text-pln-blue font-bold' : 'text-gray-700 hover:bg-gray-50'}`}
                >
                  <Building2 size={14} className={activeWorkspace?.id === ws.id ? 'text-pln-blue' : 'text-gray-400'} />
                  <span className="truncate">{ws.name}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
      
      <div className="px-4 sm:px-6 mb-6 mt-2">
        <Link href="/projects/new" onClick={onClose} className="w-full flex items-center justify-center gap-2 bg-pln-blue hover:bg-pln-blue-dark text-white font-bold py-3 rounded-xl transition-colors">
          <PlusSquare size={20} />
          Create New
        </Link>
      </div>
      
      <nav className="flex-1 px-4 space-y-2 overflow-y-auto">
        <Link 
          href="/" 
          onClick={onClose}
          className={`flex items-center gap-3 px-4 py-3 font-semibold rounded-xl transition-colors ${pathname === '/' ? 'bg-blue-50 text-pln-blue' : 'text-gray-500 hover:text-pln-blue hover:bg-gray-50'}`}
        >
          <LayoutDashboard size={20} />
          My Projects
        </Link>
        <Link 
          href="/assets" 
          onClick={onClose}
          className={`flex items-center gap-3 px-4 py-3 font-semibold rounded-xl transition-colors ${pathname === '/assets' ? 'bg-blue-50 text-pln-blue' : 'text-gray-500 hover:text-pln-blue hover:bg-gray-50'}`}
        >
          <FolderOpen size={20} />
          Asset Library
        </Link>
        <Link 
          href="/market" 
          onClick={onClose}
          className={`flex items-center gap-3 px-4 py-3 font-semibold rounded-xl transition-colors ${pathname === '/market' ? 'bg-purple-50 text-purple-600' : 'text-gray-500 hover:text-purple-600 hover:bg-gray-50'}`}
        >
          <Store size={20} />
          Marketplace
        </Link>
        <Link 
          href="/analytics" 
          onClick={onClose}
          className={`flex items-center gap-3 px-4 py-3 font-semibold rounded-xl transition-colors ${pathname === '/analytics' ? 'bg-blue-50 text-pln-blue' : 'text-gray-500 hover:text-pln-blue hover:bg-gray-50'}`}
        >
          <BarChart3 size={20} />
          Analytics
        </Link>
        <Link 
          href="/trash" 
          onClick={onClose}
          className={`flex items-center gap-3 px-4 py-3 font-semibold rounded-xl transition-colors ${pathname === '/trash' ? 'bg-red-50 text-red-500' : 'text-gray-500 hover:text-red-500 hover:bg-gray-50'}`}
        >
          <Trash2 size={20} />
          Tong Sampah
        </Link>
        
        {activeRole === 'admin' && (
          <Link 
            href="/settings/members" 
            onClick={onClose}
            className={`flex items-center gap-3 px-4 py-3 font-semibold rounded-xl transition-colors mt-2 ${pathname.startsWith('/settings') ? 'bg-gray-900 text-white shadow-md' : 'text-gray-500 hover:text-gray-900 hover:bg-gray-100'}`}
          >
            <Settings size={20} />
            Workspace Settings
          </Link>
        )}
      </nav>

      <div className="p-4 mt-auto border-t border-gray-50">
        <button onClick={handleLogout} className="flex items-center gap-3 px-4 py-2 w-full text-gray-500 hover:text-red-500 hover:bg-red-50 font-medium rounded-xl transition-colors">
          <LogOut size={18} />
          Log Out
        </button>
      </div>
    </aside>
  );
}
