import { Bell, Search, Menu } from 'lucide-react';

export default function Header({ onMenuClick }: { onMenuClick?: () => void }) {
  return (
    <header className="flex items-center justify-between bg-white px-4 sm:px-8 py-4 mb-4 sm:mb-6 sticky top-0 z-10 border-b border-gray-50 shadow-sm">
      <div className="flex items-center flex-1 gap-2 sm:gap-4 max-w-2xl">
        <button 
          onClick={onMenuClick}
          className="md:hidden p-2 text-gray-500 hover:bg-gray-100 rounded-xl transition-colors"
        >
          <Menu size={24} />
        </button>
        
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
          <input 
            type="text" 
            placeholder="Cari proyek atau aset..." 
            className="w-full bg-gray-50 border-none rounded-full py-2.5 pl-10 pr-4 text-sm focus:ring-2 focus:ring-pln-blue outline-none transition-shadow"
          />
        </div>
      </div>
      
      <div className="flex items-center gap-3 sm:gap-6 ml-2 sm:ml-4">
        <button className="relative p-2 text-gray-500 hover:bg-gray-50 rounded-full transition-colors hidden sm:block">
          <Bell size={20} />
          <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full border-2 border-white"></span>
        </button>
        
        <div className="flex items-center gap-3 sm:border-l sm:border-gray-100 sm:pl-6">
          <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-gray-900 text-pln-yellow flex items-center justify-center font-bold text-xs sm:text-sm shrink-0 shadow-sm">
            AP
          </div>
          <div className="hidden sm:block">
            <p className="text-sm font-bold text-gray-900 leading-tight">Admin PLN</p>
            <p className="text-xs text-gray-500">Administrator</p>
          </div>
        </div>
      </div>
    </header>
  );
}
