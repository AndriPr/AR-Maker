import React, { useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Image, Box, Play, Edit3, Trash2, QrCode, Link as LinkIcon, Copy, Folder, Check, FolderInput, MoreVertical } from 'lucide-react';
import { toast } from 'sonner';

export function ProjectCard({ id, title, type, date, status, views, icon, targetImageUrl, folderName, onRename, onDuplicate, onDelete, onShowQR, isSelected, onToggleSelect, onMove, activeRole }: any) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const handleCopyLink = (e: any) => {
    e.preventDefault();
    e.stopPropagation();
    navigator.clipboard.writeText(`${window.location.origin}/ar-viewer/${id}`);
    toast.success('Link berhasil disalin!');
    setIsMenuOpen(false);
  };

  const CardInner = (
    <>
      <div 
        className="h-32 bg-gray-100 relative group-hover:bg-gray-200 transition-colors flex items-center justify-center bg-cover bg-center"
        style={targetImageUrl ? { backgroundImage: `url(${targetImageUrl})` } : {}}
      >
        {targetImageUrl && <div className="absolute inset-0 bg-black/30 group-hover:bg-black/20 transition-colors"></div>}
        
        <div className="absolute top-3 left-3 z-20">
          <div 
            onClick={(e) => { e.preventDefault(); e.stopPropagation(); onToggleSelect(); }}
            className={`w-6 h-6 rounded-lg border-2 flex items-center justify-center transition-all cursor-pointer ${isSelected ? 'bg-pln-blue border-pln-blue text-white shadow-md scale-110' : 'bg-white/90 border-gray-300 text-transparent hover:border-pln-blue opacity-0 group-hover:opacity-100 shadow-sm'}`}
          >
            <Check size={14} />
          </div>
        </div>

        <div className="absolute top-3 right-3 z-20">
          <button 
            onClick={(e) => { e.preventDefault(); e.stopPropagation(); setIsMenuOpen(!isMenuOpen); }} 
            className={`p-1.5 rounded-lg shadow-sm transition-colors ${isMenuOpen || targetImageUrl ? 'bg-white/90 text-gray-700 hover:text-pln-blue' : 'bg-white/90 text-gray-400 hover:text-pln-blue opacity-0 group-hover:opacity-100'}`}
            title="Menu Opsi"
          >
            <MoreVertical size={18} />
          </button>
        </div>
        
        {!targetImageUrl && icon}
      </div>
    
      <div className="p-5 flex flex-col flex-1">
        <div className="flex justify-between items-start mb-2">
          <h3 className="font-bold text-gray-900 line-clamp-1 pr-2">{title}</h3>
        </div>
        
        <div className="flex items-center gap-2 text-xs font-medium text-gray-500 mb-4 flex-wrap">
          <span className="flex items-center gap-1">
            {icon} {type}
          </span>
          {folderName && folderName !== 'Personal' && (
            <>
              <span className="text-gray-300">•</span>
              <span className="flex items-center gap-1 bg-gray-50 px-2 py-0.5 rounded-md line-clamp-1 border border-gray-100">
                <Folder size={10} /> {folderName}
              </span>
            </>
          )}
        </div>
        
        <div className="mt-auto flex items-center justify-between">
          <div className="flex flex-col">
            <span className={`text-xs font-bold ${status === 'Published' ? 'text-green-500' : 'text-gray-400'}`}>
              {status}
            </span>
            <span className="text-xs text-gray-400 mt-0.5">Dibuat: {date}</span>
          </div>
          {status === 'Published' && (
            <div className="flex items-center gap-1 text-xs font-bold text-gray-700 bg-gray-50 px-2 py-1 rounded-md">
              <Play size={12} className="text-pln-blue" />
              {views || 0}
            </div>
          )}
        </div>
      </div>
    </>
  );

  return (
    <motion.div 
      className="relative group"
      whileHover={{ y: -5 }}
      transition={{ type: "spring", stiffness: 300, damping: 20 }}
    >
      {activeRole === 'viewer' ? (
        <div className="bg-white border border-gray-100 rounded-3xl overflow-hidden shadow-sm hover:shadow-md transition-shadow group flex flex-col min-h-[250px] relative">
          {CardInner}
        </div>
      ) : (
        <Link href={`/projects/${id}/edit`} className="bg-white border border-gray-100 rounded-3xl overflow-hidden shadow-sm hover:shadow-md transition-shadow group flex flex-col min-h-[250px] cursor-pointer relative">
          {CardInner}
        </Link>
      )}

      {/* Dropdown Menu */}
      {isMenuOpen && (
        <div className="absolute top-12 right-3 w-48 bg-white rounded-xl shadow-xl border border-gray-100 py-2 z-30 transform origin-top-right transition-all">
          {activeRole !== 'viewer' && (
            <>
              <button
                onClick={(e) => { e.preventDefault(); e.stopPropagation(); setIsMenuOpen(false); onRename(); }}
                className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 hover:text-pln-blue flex items-center gap-2"
              >
                <Edit3 size={14} /> Ganti Nama
              </button>
              <button
                onClick={(e) => { e.preventDefault(); e.stopPropagation(); setIsMenuOpen(false); onDuplicate(); }}
                className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 hover:text-pln-blue flex items-center gap-2"
              >
                <Copy size={14} /> Gandakan Proyek
              </button>
              <button
                onClick={(e) => { e.preventDefault(); e.stopPropagation(); setIsMenuOpen(false); onMove(); }}
                className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 hover:text-pln-blue flex items-center gap-2"
              >
                <FolderInput size={14} /> Pindahkan
              </button>
            </>
          )}
          {status === 'Published' && (
            <>
              <button
                onClick={handleCopyLink}
                className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 hover:text-pln-blue flex items-center gap-2"
              >
                <LinkIcon size={14} /> Copy Share Link
              </button>
              <button
                onClick={(e) => { e.preventDefault(); e.stopPropagation(); setIsMenuOpen(false); onShowQR(); }}
                className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 hover:text-green-600 flex items-center gap-2"
              >
                <QrCode size={14} /> Tampilkan QR Code
              </button>
            </>
          )}
          {activeRole === 'admin' && (
            <>
              <div className="h-px bg-gray-100 my-1"></div>
              <button
                onClick={(e) => { e.preventDefault(); e.stopPropagation(); setIsMenuOpen(false); onDelete(); }}
                className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 flex items-center gap-2"
              >
                <Trash2 size={14} /> Hapus Proyek
              </button>
            </>
          )}
        </div>
      )}
      
      {/* Invisible overlay to close menu when clicking outside */}
      {isMenuOpen && (
        <div 
          className="fixed inset-0 z-20"
          onClick={(e) => { e.preventDefault(); e.stopPropagation(); setIsMenuOpen(false); }}
        ></div>
      )}
    </motion.div>
  );
}
