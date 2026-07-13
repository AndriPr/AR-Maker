import Link from 'next/link';
import { LayoutDashboard, FolderOpen, BarChart3, LogOut, Zap, PlusSquare, X, Trash2 } from 'lucide-react';
import { usePathname } from 'next/navigation';

export default function Sidebar({ isOpen, onClose }: { isOpen?: boolean, onClose?: () => void }) {
  const pathname = usePathname();
  
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
      </nav>

      <div className="p-4 mt-auto border-t border-gray-50">
        <button className="flex items-center gap-3 px-4 py-2 w-full text-gray-500 hover:text-red-500 hover:bg-red-50 font-medium rounded-xl transition-colors">
          <LogOut size={18} />
          Log Out
        </button>
      </div>
    </aside>
  );
}
