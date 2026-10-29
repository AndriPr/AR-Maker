"use client";

import { useState } from "react";
import { Camera, Moon, Sun, Shield } from "lucide-react";
import { useTheme } from "next-themes";
import { Switch } from "@/components/ui/switch"; 

export default function AccountSettingsPage() {
  const { theme, setTheme } = useTheme();
  
  const [formData, setFormData] = useState({
    fullName: "Andri Pratama",
    email: "andri@gmail.com",
    phone: "+62 8763 5673 675",
    bio: "",
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  const [toggles, setToggles] = useState({
    twoFactor: true,
    emailNotif: true,
    pushNotif: true,
    browserNotif: false,
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleToggle = (name: string) => (checked: boolean) => {
    setToggles({ ...toggles, [name]: checked });
  };

  return (
    <div className="max-w-[1000px] mx-auto pb-24">
      <div className="mb-8">
        <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">Account Settings</h1>
        <p className="text-sm text-gray-500 mt-1">Manage your personal information, security preferences, and account settings.</p>
      </div>

      <div className="space-y-6">
        
        {/* Personal Information */}
        <section className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
          <h2 className="text-lg font-bold text-gray-900 mb-6">Personal Information</h2>
          <div className="flex flex-col md:flex-row gap-8">
            <div className="flex flex-col items-center gap-3 shrink-0">
              <div className="w-24 h-24 rounded-full bg-gray-100 flex items-center justify-center border border-gray-200">
                <Camera size={24} className="text-gray-400" />
              </div>
              <button className="text-xs font-semibold text-pln-blue hover:underline">Change Photo</button>
            </div>
            
            <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-5">
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-gray-600">Full Name</label>
                <input 
                  type="text" 
                  name="fullName"
                  value={formData.fullName}
                  onChange={handleChange}
                  className="w-full bg-gray-50 border border-transparent focus:border-pln-blue/30 focus:bg-white focus:ring-2 focus:ring-pln-blue/10 rounded-xl px-4 py-2.5 text-sm text-gray-900 transition-all outline-none" 
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-gray-600">Email Address</label>
                <input 
                  type="email" 
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  className="w-full bg-gray-50 border border-transparent focus:border-pln-blue/30 focus:bg-white focus:ring-2 focus:ring-pln-blue/10 rounded-xl px-4 py-2.5 text-sm text-gray-900 transition-all outline-none" 
                />
              </div>
              <div className="space-y-1.5 md:col-span-2">
                <label className="text-xs font-medium text-gray-600">Phone Number</label>
                <input 
                  type="text" 
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  className="w-full md:w-[calc(50%-12px)] bg-gray-50 border border-transparent focus:border-pln-blue/30 focus:bg-white focus:ring-2 focus:ring-pln-blue/10 rounded-xl px-4 py-2.5 text-sm text-gray-900 transition-all outline-none" 
                />
              </div>
              <div className="space-y-1.5 md:col-span-2">
                <label className="text-xs font-medium text-gray-600">Bio</label>
                <textarea 
                  name="bio"
                  placeholder="Tell us a bit about yourself..."
                  value={formData.bio}
                  onChange={handleChange}
                  rows={3}
                  className="w-full bg-gray-50 border border-transparent focus:border-pln-blue/30 focus:bg-white focus:ring-2 focus:ring-pln-blue/10 rounded-xl px-4 py-3 text-sm text-gray-900 transition-all outline-none resize-none" 
                ></textarea>
              </div>
            </div>
          </div>
        </section>

        {/* Security & Password */}
        <section className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
          <h2 className="text-lg font-bold text-gray-900 mb-6">Security & Password</h2>
          <div className="flex flex-col md:flex-row gap-10">
            <div className="flex-1 space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-gray-600">Current Password</label>
                <input 
                  type="password" 
                  name="currentPassword"
                  placeholder="••••••••"
                  value={formData.currentPassword}
                  onChange={handleChange}
                  className="w-full bg-gray-50 border border-transparent focus:border-pln-blue/30 focus:bg-white focus:ring-2 focus:ring-pln-blue/10 rounded-xl px-4 py-2.5 text-sm text-gray-900 transition-all outline-none" 
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-gray-600">New Password</label>
                <input 
                  type="password" 
                  name="newPassword"
                  placeholder="••••••••"
                  value={formData.newPassword}
                  onChange={handleChange}
                  className="w-full bg-gray-50 border border-transparent focus:border-pln-blue/30 focus:bg-white focus:ring-2 focus:ring-pln-blue/10 rounded-xl px-4 py-2.5 text-sm text-gray-900 transition-all outline-none" 
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-gray-600">Confirm New Password</label>
                <input 
                  type="password" 
                  name="confirmPassword"
                  placeholder="••••••••"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  className="w-full bg-gray-50 border border-transparent focus:border-pln-blue/30 focus:bg-white focus:ring-2 focus:ring-pln-blue/10 rounded-xl px-4 py-2.5 text-sm text-gray-900 transition-all outline-none" 
                />
              </div>
              <div className="pt-2">
                <button className="bg-gray-100 hover:bg-gray-200 text-gray-800 text-xs font-bold py-2.5 px-5 rounded-xl transition-colors">
                  Update Password
                </button>
              </div>
            </div>
            
            <div className="flex-1 bg-gray-50/50 rounded-2xl p-6 border border-gray-100">
              <div className="flex flex-col gap-6">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <div className="w-6 h-6 rounded-full bg-blue-100 flex items-center justify-center text-pln-blue">
                      <Shield size={12} className="fill-current" />
                    </div>
                    <h3 className="text-sm font-bold text-gray-900">Two-Factor Authentication</h3>
                  </div>
                  <p className="text-xs text-gray-500 mb-4 pl-8">Add an extra layer of security to your account.</p>
                  <div className="pl-8 flex items-center gap-3">
                    <Switch checked={toggles.twoFactor} onCheckedChange={handleToggle("twoFactor")} />
                    <span className="text-xs font-semibold text-gray-700">{toggles.twoFactor ? 'Enabled' : 'Disabled'}</span>
                  </div>
                </div>
                
                <div className="w-full h-px bg-gray-200/60"></div>
                
                <div>
                  <h3 className="text-sm font-bold text-gray-900 mb-1">Recovery Options</h3>
                  <p className="text-xs text-gray-500 mb-3">Manage recovery emails and phone numbers.</p>
                  <button className="text-xs font-semibold text-pln-blue hover:underline">Manage Recovery</button>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Preferences */}
        <section className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
          <h2 className="text-lg font-bold text-gray-900 mb-6">Preferences</h2>
          <div className="flex flex-col md:flex-row gap-10">
            <div className="flex-1 space-y-6">
              <div className="space-y-3">
                <label className="text-xs font-medium text-gray-600">Appearance</label>
                <div className="flex gap-3">
                  <button 
                    onClick={() => setTheme('light')}
                    className={`flex-1 flex flex-col items-center justify-center gap-2 py-4 rounded-xl border-2 transition-all ${theme !== 'dark' ? 'border-pln-blue bg-blue-50/30 text-pln-blue' : 'border-gray-100 bg-gray-50 text-gray-500 hover:bg-gray-100'}`}
                  >
                    <Sun size={20} className={theme !== 'dark' ? 'fill-current' : ''} />
                    <span className="text-xs font-semibold">Light</span>
                  </button>
                  <button 
                    onClick={() => setTheme('dark')}
                    className={`flex-1 flex flex-col items-center justify-center gap-2 py-4 rounded-xl border-2 transition-all ${theme === 'dark' ? 'border-pln-blue bg-blue-50/30 text-pln-blue' : 'border-gray-100 bg-gray-50 text-gray-500 hover:bg-gray-100'}`}
                  >
                    <Moon size={20} className={theme === 'dark' ? 'fill-current' : ''} />
                    <span className="text-xs font-semibold">Dark</span>
                  </button>
                </div>
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-gray-600">Language & Region</label>
                <div className="relative">
                  <select className="w-full bg-gray-50 border border-transparent focus:border-pln-blue/30 focus:bg-white focus:ring-2 focus:ring-pln-blue/10 rounded-xl px-4 py-2.5 text-sm text-gray-900 transition-all outline-none appearance-none">
                    <option>English (US)</option>
                    <option>Bahasa Indonesia</option>
                  </select>
                  <div className="absolute inset-y-0 right-4 flex items-center pointer-events-none">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-gray-400"><polyline points="6 9 12 15 18 9"></polyline></svg>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="flex-1 space-y-3">
              <label className="text-xs font-medium text-gray-600">Notifications</label>
              
              <div className="bg-gray-50 rounded-xl p-4 flex items-center justify-between">
                <div>
                  <h4 className="text-xs font-bold text-gray-900">Email Notifications</h4>
                  <p className="text-[10px] text-gray-500">Updates and marketing emails</p>
                </div>
                <Switch checked={toggles.emailNotif} onCheckedChange={handleToggle("emailNotif")} />
              </div>
              
              <div className="bg-gray-50 rounded-xl p-4 flex items-center justify-between">
                <div>
                  <h4 className="text-xs font-bold text-gray-900">Push Notifications</h4>
                  <p className="text-[10px] text-gray-500">Alerts on your mobile device</p>
                </div>
                <Switch checked={toggles.pushNotif} onCheckedChange={handleToggle("pushNotif")} />
              </div>
              
              <div className="bg-gray-50 rounded-xl p-4 flex items-center justify-between opacity-70">
                <div>
                  <h4 className="text-xs font-bold text-gray-900">Browser Notifications</h4>
                  <p className="text-[10px] text-gray-500">Desktop alerts when active</p>
                </div>
                <Switch checked={toggles.browserNotif} onCheckedChange={handleToggle("browserNotif")} disabled />
              </div>
            </div>
          </div>
        </section>
      </div>

      {/* Sticky Bottom Actions */}
      <div className="fixed bottom-0 right-0 left-64 bg-white/80 backdrop-blur-md border-t border-gray-100 p-4 px-10 flex justify-end gap-3 z-40">
        <button className="px-6 py-2.5 rounded-xl text-xs font-bold text-gray-700 bg-gray-100 hover:bg-gray-200 transition-colors">
          Cancel
        </button>
        <button className="px-6 py-2.5 rounded-xl text-xs font-bold text-white bg-pln-blue hover:bg-pln-blue-dark transition-colors shadow-md shadow-blue-900/20">
          Save Changes
        </button>
      </div>
    </div>
  );
}
