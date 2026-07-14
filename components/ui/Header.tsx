"use client";

import { Bell, Menu, X, Check, Moon, Sun, User as UserIcon, Shield, Key, Settings2, LogOut, ChevronRight, Building2, UserCircle } from 'lucide-react';
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useTheme } from 'next-themes';
import { useWorkspace } from '@/components/providers/WorkspaceProvider';
import { useRouter } from 'next/navigation';

export default function Header({ onMenuClick }: { onMenuClick?: () => void }) {
  const [isNotifOpen, setIsNotifOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [user, setUser] = useState<any>(null);
  const [profileName, setProfileName] = useState("Admin PLN");
  const [isEditing, setIsEditing] = useState(false);
  const [tempName, setTempName] = useState("");
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const { activeWorkspace, activeRole } = useWorkspace();
  const router = useRouter();

  useEffect(() => {
    setMounted(true);
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

  // Auto-fetch when bell is opened to get latest data
  useEffect(() => {
    if (isNotifOpen) {
      fetchUserAndNotifs();
    }
  }, [isNotifOpen]);

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

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/login');
  };

  const displayRole = activeRole === 'admin' ? 'Administrator' : activeRole === 'editor' ? 'Editor' : activeRole === 'viewer' ? 'Viewer' : 'Member';

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
      
      <div className="flex items-center gap-2 sm:gap-6">
        
        {mounted && (
          <button
            onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
            className="p-2 rounded-full text-gray-500 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors hidden sm:block"
          >
            {theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
          </button>
        )}

        <button 
          onClick={() => { setIsNotifOpen(!isNotifOpen); setIsProfileOpen(false); }}
          className={`relative p-2 rounded-full transition-colors hidden sm:block ${isNotifOpen ? 'bg-pln-blue text-white' : 'text-gray-500 hover:bg-gray-50 dark:hover:bg-gray-800'}`}
        >
          <Bell size={20} />
          {unreadCount > 0 && (
            <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full border-2 border-white dark:border-gray-800"></span>
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
              <p className="text-xs text-gray-500">{displayRole}</p>
            </div>
          </div>

          {isProfileOpen && (
            <div className="absolute top-12 right-0 w-80 bg-white border border-gray-100 rounded-2xl shadow-xl z-50 overflow-hidden flex flex-col">
              
              {/* Header Info */}
              <div className="p-5 border-b border-gray-100 bg-gray-50/50">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 rounded-full bg-gray-900 text-pln-yellow flex items-center justify-center font-bold text-xl shrink-0 shadow-md">
                    {profileName.substring(0,2).toUpperCase()}
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-900 text-lg leading-tight">{profileName}</h3>
                    <p className="text-xs text-gray-500 font-medium">{user?.email || 'user@company.com'}</p>
                    <div className="flex items-center gap-1 mt-1.5 bg-blue-50 text-pln-blue px-2 py-0.5 rounded-md w-fit">
                      <Shield size={10} />
                      <span className="text-[10px] font-bold uppercase tracking-wider">{displayRole}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Menu Items */}
              <div className="p-2 space-y-1">
                <button className="w-full flex items-center justify-between p-3 rounded-xl hover:bg-gray-50 text-left transition-colors group">
                  <div className="flex items-center gap-3">
                    <div className="bg-gray-100 p-2 rounded-lg group-hover:bg-white transition-colors">
                      <UserCircle size={18} className="text-gray-600" />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-gray-900">Personal Information</p>
                      <p className="text-[11px] text-gray-500">Ubah nama dan info kontak</p>
                    </div>
                  </div>
                  <ChevronRight size={16} className="text-gray-300 group-hover:text-gray-500" />
                </button>

                <button className="w-full flex items-center justify-between p-3 rounded-xl hover:bg-gray-50 text-left transition-colors group">
                  <div className="flex items-center gap-3">
                    <div className="bg-gray-100 p-2 rounded-lg group-hover:bg-white transition-colors">
                      <Key size={18} className="text-gray-600" />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-gray-900">Security & Password</p>
                      <p className="text-[11px] text-gray-500">Autentikasi dua faktor (2FA)</p>
                    </div>
                  </div>
                  <ChevronRight size={16} className="text-gray-300 group-hover:text-gray-500" />
                </button>

                <button className="w-full flex items-center justify-between p-3 rounded-xl hover:bg-gray-50 text-left transition-colors group">
                  <div className="flex items-center gap-3">
                    <div className="bg-gray-100 p-2 rounded-lg group-hover:bg-white transition-colors">
                      <Settings2 size={18} className="text-gray-600" />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-gray-900">Preferences</p>
                      <p className="text-[11px] text-gray-500">Tema, bahasa, dan notifikasi</p>
                    </div>
                  </div>
                  <ChevronRight size={16} className="text-gray-300 group-hover:text-gray-500" />
                </button>
              </div>

              {/* Current Workspace Context */}
              <div className="px-5 py-3 bg-gray-50 border-t border-gray-100 flex items-center justify-between">
                <div className="flex items-center gap-2 text-xs text-gray-500 font-medium">
                  <Building2 size={14} />
                  <span>{activeWorkspace?.name || 'Personal Workspace'}</span>
                </div>
              </div>

              {/* Logout Action */}
              <div className="p-2 border-t border-gray-100">
                <button 
                  onClick={handleLogout}
                  className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-red-50 text-left transition-colors group"
                >
                  <div className="bg-red-50 p-2 rounded-lg group-hover:bg-red-100 transition-colors">
                    <LogOut size={18} className="text-red-500" />
                  </div>
                  <span className="text-sm font-bold text-red-600">Log Out dari Sesi Ini</span>
                </button>
              </div>

            </div>
          )}
        </div>
      </div>
    </header>
  );
}
