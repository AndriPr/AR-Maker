import Link from 'next/link';
import { LayoutDashboard, FolderOpen, BarChart3, LogOut, Zap, PlusSquare } from 'lucide-react';

export default function Sidebar() {
  return (
    <aside className="w-64 h-screen bg-white border-r border-gray-100 flex flex-col fixed left-0 top-0">
      <div className="p-6 flex items-center gap-2">
        <div className="bg-pln-yellow p-1 rounded-md">
          <Zap size={24} className="text-white fill-current" />
        </div>
        <span className="text-xl font-bold text-pln-blue-dark">AR<span className="text-pln-blue font-light">Maker</span></span>
      </div>
      
      <div className="px-6 mb-6 mt-2">
        <button className="w-full flex items-center justify-center gap-2 bg-pln-blue hover:bg-pln-blue-dark text-white font-bold py-3 rounded-xl transition-colors">
          <PlusSquare size={20} />
          Create New
        </button>
      </div>
      
      <nav className="flex-1 px-4 space-y-2">
        <Link href="/" className="flex items-center gap-3 px-4 py-3 bg-blue-50 text-pln-blue font-semibold rounded-xl">
          <LayoutDashboard size={20} />
          My Projects
        </Link>
        <Link href="/assets" className="flex items-center gap-3 px-4 py-3 text-gray-500 hover:text-pln-blue hover:bg-gray-50 font-medium rounded-xl transition-colors">
          <FolderOpen size={20} />
          Asset Library
        </Link>
        <Link href="/analytics" className="flex items-center gap-3 px-4 py-3 text-gray-500 hover:text-pln-blue hover:bg-gray-50 font-medium rounded-xl transition-colors">
          <BarChart3 size={20} />
          Analytics
        </Link>
      </nav>

      <div className="p-4 mt-auto border-t border-gray-50">
        <div className="px-4 py-3 mb-2 flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-pln-yellow flex items-center justify-center text-xs font-bold">
            U
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-bold text-gray-900 truncate">User Account</p>
            <p className="text-xs text-gray-500 truncate">Free Plan</p>
          </div>
        </div>
        <button className="flex items-center gap-3 px-4 py-2 w-full text-gray-500 hover:text-red-500 hover:bg-red-50 font-medium rounded-xl transition-colors">
          <LogOut size={18} />
          Log Out
        </button>
      </div>
    </aside>
  );
}
