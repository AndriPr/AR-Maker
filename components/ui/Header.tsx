"use client";

import { Bell, Menu, X, Check, Moon, Sun, Search, User as UserIcon, Shield, Key, Settings2, LogOut, ChevronRight, Building2, UserCircle } from 'lucide-react';
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useTheme } from 'next-themes';
import { useWorkspace } from '@/components/providers/WorkspaceProvider';
import { useRouter, usePathname } from 'next/navigation';
import { useDashboardStore } from '@/lib/dashboardStore';

export default function Header({ onMenuClick }: { onMenuClick?: () => void }) {
  const [isNotifOpen, setIsNotifOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [activeMenu, setActiveMenu] = useState<'main' | 'personal' | 'security' | 'preferences'>('main');
  const [notifications, setNotifications] = useState<any[]>([]);
  const [user, setUser] = useState<any>(null);
  const [profileName, setProfileName] = useState("User");
  const [tempName, setTempName] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const { activeWorkspace, activeRole } = useWorkspace();
  const router = useRouter();
  const pathname = usePathname();
  const searchQuery = useDashboardStore((s) => s.searchQuery);
  const setSearchQuery = useDashboardStore((s) => s.setSearchQuery);

  useEffect(() => {
    setMounted(true);
    fetchUserAndNotifs();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_IN' || event === 'SIGNED_OUT') {
        if (event === 'SIGNED_OUT') {
          setUser(null);
          setProfileName("User");
          setNotifications([]);
        } else {
          fetchUserAndNotifs();
        }
      }
    });

    return () => {
      subscription.unsubscribe();
    };
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
    setIsSaving(true);
    const { data, error } = await supabase.auth.updateUser({
      data: { display_name: tempName }
    });
    
    if (!error) {
      setProfileName(tempName);
      setActiveMenu('main');
    } else {
      alert("Gagal menyimpan profil: " + error.message);
    }
    setIsSaving(false);
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
    <header className="flex items-center justify-between gap-4 bg-gray-50/80 backdrop-blur-md px-4 sm:px-8 py-4 mb-2 sm:mb-4 sticky top-0 z-30">
      <div className="flex items-center flex-1 gap-2 sm:gap-4 max-w-2xl">
        <button 
          onClick={onMenuClick}
          className="md:hidden p-2 text-gray-500 hover:bg-gray-100 rounded-xl transition-colors"
        >
          <Menu size={24} />
        </button>
          <div className="relative w-full max-w-sm">
            <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search ..."
              className="w-full bg-gray-200/70 focus:bg-white rounded-full pl-11 pr-4 py-2.5 text-sm text-gray-800 placeholder:text-gray-500 outline-none focus:ring-2 focus:ring-pln-blue/20 transition-colors"
            />
          </div>
      </div>
      
      <div className="flex items-center gap-1 sm:gap-3">
        
        <div className="relative">
          <button 
            onClick={() => { setIsNotifOpen(!isNotifOpen); setIsProfileOpen(false); }}
            className={`relative p-2 rounded-full transition-colors hidden sm:block ${isNotifOpen ? 'bg-pln-blue text-white shadow-md shadow-blue-500/20' : 'text-gray-500 hover:bg-gray-50 dark:hover:bg-gray-800'}`}
          >
            <Bell size={20} />
            {unreadCount > 0 && (
              <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full border-2 border-white dark:border-gray-800"></span>
            )}
          </button>

        {isNotifOpen && (
          <div className="absolute top-full right-0 mt-3 w-80 bg-white border border-gray-100 rounded-2xl shadow-xl z-50 overflow-hidden transform origin-top-right transition-all">
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
        </div>
        
        {mounted && (
          <button
            onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
            className="p-2 rounded-full text-gray-500 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors hidden sm:block"
          >
            {theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
          </button>
        )}

        <div className="relative">
          <div 
            onClick={() => { setIsProfileOpen(!isProfileOpen); setIsNotifOpen(false); }}
            className="cursor-pointer"
            title={`${profileName} · ${displayRole}`}
          >
            <div className={`w-9 h-9 rounded-full border-[1.5px] border-pln-blue text-pln-blue flex items-center justify-center font-semibold text-xs shrink-0 transition-colors ${isProfileOpen ? 'bg-blue-50' : 'bg-white hover:bg-blue-50'}`}>
              {profileName.substring(0,2).toUpperCase()}
            </div>
          </div>

          {isProfileOpen && (
            <div className="absolute top-full right-0 mt-3 w-80 bg-white border border-gray-100 rounded-2xl shadow-2xl shadow-gray-200/50 z-50 overflow-hidden flex flex-col transform origin-top-right transition-all">
              
              {activeMenu === 'main' && (
                <>
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
                    <button onClick={() => { setIsProfileOpen(false); router.push('/account'); }} className="w-full flex items-center justify-between p-3 rounded-xl hover:bg-gray-50 text-left transition-colors group">
                      <div className="flex items-center gap-3">
                        <div className="bg-gray-100 p-2 rounded-lg group-hover:bg-white transition-colors">
                          <UserCircle size={18} className="text-gray-600" />
                        </div>
                        <div>
                          <p className="text-sm font-bold text-gray-900">Account Settings</p>
                          <p className="text-[11px] text-gray-500">Manage profile, security & preferences</p>
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
                </>
              )}

              {activeMenu === 'personal' && (
                <div className="p-4 flex flex-col h-full">
                  <div className="flex items-center gap-3 mb-6">
                    <button onClick={() => setActiveMenu('main')} className="p-1 hover:bg-gray-100 rounded-md text-gray-500">
                      <ChevronRight size={18} className="rotate-180" />
                    </button>
                    <h3 className="font-bold text-gray-900">Personal Information</h3>
                  </div>
                  
                  <div className="space-y-4 flex-1">
                    <div>
                      <label className="text-xs font-semibold text-gray-500 mb-1 block">Email Akun</label>
                      <input 
                        type="email" 
                        value={user?.email || ''} 
                        disabled 
                        className="w-full bg-gray-100 border border-gray-200 rounded-xl px-4 py-2.5 text-sm text-gray-500 cursor-not-allowed"
                      />
                      <p className="text-[10px] text-gray-400 mt-1">Email tidak dapat diubah (Terikat SSO/Auth).</p>
                    </div>
                    
                    <div>
                      <label className="text-xs font-semibold text-gray-500 mb-1 block">Nama Tampilan</label>
                      <input 
                        type="text" 
                        value={tempName}
                        onChange={(e) => setTempName(e.target.value)}
                        className="w-full bg-white border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-pln-blue focus:border-pln-blue outline-none transition-all"
                        placeholder="Masukkan nama lengkap Anda..."
                      />
                    </div>
                  </div>
                  
                  <div className="mt-6 pt-4 border-t border-gray-100 flex gap-2">
                    <button onClick={() => setActiveMenu('main')} className="flex-1 py-2.5 bg-gray-50 hover:bg-gray-100 border border-gray-200 rounded-xl text-sm font-bold text-gray-600 transition-colors">
                      Batal
                    </button>
                    <button onClick={handleSaveProfile} disabled={isSaving || !tempName.trim()} className="flex-1 py-2.5 bg-gray-900 hover:bg-black rounded-xl text-sm font-bold text-white transition-colors disabled:opacity-50">
                      {isSaving ? 'Menyimpan...' : 'Simpan'}
                    </button>
                  </div>
                </div>
              )}
              
              {activeMenu === 'security' && (
                <div className="p-4 flex flex-col h-full">
                  <div className="flex items-center gap-3 mb-6">
                    <button onClick={() => setActiveMenu('main')} className="p-1 hover:bg-gray-100 rounded-md text-gray-500">
                      <ChevronRight size={18} className="rotate-180" />
                    </button>
                    <h3 className="font-bold text-gray-900">Security & Password</h3>
                  </div>
                  <div className="text-center py-6">
                    <Shield size={32} className="mx-auto text-gray-300 mb-3" />
                    <p className="text-sm text-gray-500">Untuk mengganti password, silakan gunakan fitur Lupa Password di halaman Login.</p>
                  </div>
                </div>
              )}
              
              {activeMenu === 'preferences' && (
                <div className="p-4 flex flex-col h-full">
                  <div className="flex items-center gap-3 mb-6">
                    <button onClick={() => setActiveMenu('main')} className="p-1 hover:bg-gray-100 rounded-md text-gray-500">
                      <ChevronRight size={18} className="rotate-180" />
                    </button>
                    <h3 className="font-bold text-gray-900">Preferences</h3>
                  </div>
                  <div className="space-y-4 flex-1">
                    <div className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                      <div className="flex items-center gap-3">
                        <Sun size={18} className="text-gray-500" />
                        <span className="text-sm font-medium text-gray-700">Light Mode</span>
                      </div>
                      <div className="w-10 h-6 bg-pln-blue rounded-full relative shadow-inner cursor-pointer" onClick={() => setTheme('light')}>
                        <div className="absolute left-1 top-1 w-4 h-4 bg-white rounded-full transition-transform"></div>
                      </div>
                    </div>
                    <div className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                      <div className="flex items-center gap-3">
                        <Moon size={18} className="text-gray-500" />
                        <span className="text-sm font-medium text-gray-700">Dark Mode</span>
                      </div>
                      <div className="w-10 h-6 bg-gray-300 rounded-full relative shadow-inner cursor-pointer" onClick={() => setTheme('dark')}>
                        <div className="absolute right-1 top-1 w-4 h-4 bg-white rounded-full transition-transform"></div>
                      </div>
                    </div>
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
