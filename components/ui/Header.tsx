import { Bell, Search } from 'lucide-react';

export default function Header() {
  return (
    <header className="flex items-center justify-between bg-white px-8 py-4 mb-6 sticky top-0 z-10 border-b border-gray-50">
      <div className="flex-1 max-w-2xl">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
          <input 
            type="text" 
            placeholder="Cari modul, model, atau pengguna..." 
            className="w-full bg-gray-50 border-none rounded-full py-2.5 pl-10 pr-4 text-sm focus:ring-2 focus:ring-pln-blue outline-none"
          />
        </div>
      </div>
      
      <div className="flex items-center gap-6 ml-4">
        <button className="relative p-2 text-gray-500 hover:bg-gray-50 rounded-full transition-colors">
          <Bell size={20} />
          <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full border-2 border-white"></span>
        </button>
        
        <div className="flex items-center gap-3 border-l border-gray-100 pl-6">
          <div className="w-10 h-10 rounded-full bg-gray-900 text-pln-yellow flex items-center justify-center font-bold text-sm">
            AP
          </div>
          <div>
            <p className="text-sm font-bold text-gray-900">Admin PLN</p>
            <p className="text-xs text-gray-500">Administrator</p>
          </div>
        </div>
      </div>
    </header>
  );
}
