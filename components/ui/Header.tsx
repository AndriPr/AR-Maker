"use client";

import { Bell, Menu, X, Check, CheckCircle2 } from 'lucide-react';
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';

export default function Header({ onMenuClick }: { onMenuClick?: () => void }) {
  const [isNotifOpen, setIsNotifOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [user, setUser] = useState<any>(null);
  const [profileName, setProfileName] = useState("Admin PLN");
  const [isEditing, setIsEditing] = useState(false);
  const [tempName, setTempName] = useState("");

  useEffect(() => {
    fetchUserAndNotifs();
  }, []);

  const fetchUserAndNotifs = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (session?.user) {
      setUser(session.user);
      if (session.user.user_metadata?.display_name) {
        setProfileName(session.user.user_metadata.display_name);
      }
      
      // Load notifs without crashing if table doesn't exist yet
      const { data: notifs, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', session.user.id)
        .order('created_at', { ascending: false })
        .limit(10);
        
      if (notifs && !error) setNotifications(notifs);
    }
  };

  const handleSaveProfile = async () => {
    if (!tempName.trim()) return;
    setProfileName(tempName);
    setIsEditing(false);
    setIsProfileOpen(false);
    await supabase.auth.updateUser({
      data: { display_name: tempName }
    });
  };

  const handleReadNotif = async (id: string) => {
    setNotifications(notifications.map(n => n.id === id ? { ...n, is_read: true } : n));
    await supabase.from('notifications').update({ is_read: true }).eq('id', id);
  };

  const unreadCount = notifications.filter(n => !n.is_read).length;
  return (
    <header className="flex items-center justify-between bg-white px-4 sm:px-8 py-4 mb-4 sm:mb-6 sticky top-0 z-10 border-b border-gray-50 shadow-sm">
      <div className="flex items-center flex-1 gap-2 sm:gap-4 max-w-2xl">
        <button 
          onClick={onMenuClick}
          className="md:hidden p-2 text-gray-500 hover:bg-gray-100 rounded-xl transition-colors"
        >
          <Menu size={24} />
        </button>
        {/* Global search removed as requested */}
      </div>
      
      <div className="flex items-center gap-3 sm:gap-6 ml-2 sm:ml-4 relative">
        <button 
          onClick={() => { setIsNotifOpen(!isNotifOpen); setIsProfileOpen(false); }}
          className={`relative p-2 rounded-full transition-colors hidden sm:block ${isNotifOpen ? 'bg-pln-blue text-white' : 'text-gray-500 hover:bg-gray-50'}`}
        >
          <Bell size={20} />
          {unreadCount > 0 && (
            <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full border-2 border-white"></span>
          )}
        </button>

        {isNotifOpen && (
          <div className="absolute top-12 right-10 sm:right-40 w-80 bg-white border border-gray-100 rounded-2xl shadow-xl z-50 overflow-hidden">
            <div className="p-4 border-b border-gray-50 bg-gray-50 flex justify-between items-center">
              <h3 className="font-bold text-gray-900">Notifikasi</h3>
            </div>
            <div className="max-h-80 overflow-y-auto p-2">
              {notifications.length === 0 ? (
                <div className="p-4 text-center text-sm text-gray-500">Belum ada notifikasi</div>
              ) : (
                notifications.map((n) => (
                  <div 
                    key={n.id} 
                    onClick={() => handleReadNotif(n.id)}
                    className={`p-3 mb-1 rounded-xl cursor-pointer transition-colors flex gap-3 items-start ${n.is_read ? 'bg-white hover:bg-gray-50' : 'bg-blue-50/50 hover:bg-blue-50'}`}
                  >
                    <div className="mt-0.5"><Bell size={16} className={n.is_read ? 'text-gray-400' : 'text-pln-blue'} /></div>
                    <div className="flex-1">
                      <h4 className={`text-sm ${n.is_read ? 'text-gray-700' : 'text-gray-900 font-bold'}`}>{n.title}</h4>
                      <p className="text-xs text-gray-500 mt-0.5">{n.message}</p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}
        
        <div className="relative">
          <div 
            onClick={() => { setIsProfileOpen(!isProfileOpen); setIsNotifOpen(false); }}
            className="flex items-center gap-3 sm:border-l sm:border-gray-100 sm:pl-6 cursor-pointer group"
          >
            <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-gray-900 group-hover:bg-pln-blue transition-colors text-pln-yellow flex items-center justify-center font-bold text-xs sm:text-sm shrink-0 shadow-sm">
              {profileName.substring(0,2).toUpperCase()}
            </div>
            <div className="hidden sm:block">
              <p className="text-sm font-bold text-gray-900 leading-tight">{profileName}</p>
              <p className="text-xs text-gray-500">Administrator</p>
            </div>
          </div>

          {isProfileOpen && (
            <div className="absolute top-12 right-0 w-64 bg-white border border-gray-100 rounded-2xl shadow-xl z-50 overflow-hidden p-4">
              <h3 className="font-bold text-gray-900 mb-4 text-sm">Edit Profil</h3>
              
              {!isEditing ? (
                <div className="space-y-4">
                  <div>
                    <p className="text-xs text-gray-500 mb-1">Nama Tampilan</p>
                    <p className="text-sm font-semibold">{profileName}</p>
                  </div>
                  <button 
                    onClick={() => { setIsEditing(true); setTempName(profileName); }}
                    className="w-full py-2 bg-gray-100 hover:bg-gray-200 rounded-xl text-sm font-bold text-gray-700 transition-colors"
                  >
                    Ubah Nama
                  </button>
                </div>
              ) : (
                <div className="space-y-3">
                  <div>
                    <label className="text-xs text-gray-500 mb-1 block">Nama Baru</label>
                    <input 
                      type="text" 
                      value={tempName}
                      onChange={(e) => setTempName(e.target.value)}
                      className="w-full bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-pln-blue outline-none"
                    />
                  </div>
                  <div className="flex gap-2">
                    <button 
                      onClick={() => setIsEditing(false)}
                      className="flex-1 py-2 bg-gray-100 hover:bg-gray-200 rounded-xl text-sm font-bold text-gray-600 flex items-center justify-center"
                    >
                      Batal
                    </button>
                    <button 
                      onClick={handleSaveProfile}
                      className="flex-1 py-2 bg-pln-blue hover:bg-pln-blue-dark rounded-xl text-sm font-bold text-white flex items-center justify-center gap-1"
                    >
                      <Check size={14} /> Simpan
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
