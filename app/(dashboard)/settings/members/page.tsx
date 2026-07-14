"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { useWorkspace } from "@/components/providers/WorkspaceProvider";
import { ShieldAlert, UserPlus, Trash2, Mail } from "lucide-react";

export default function MembersPage() {
  const { activeWorkspace, user } = useWorkspace();
  const [members, setMembers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState("viewer");
  const [inviting, setInviting] = useState(false);

  useEffect(() => {
    if (activeWorkspace) {
      fetchMembers();
    }
  }, [activeWorkspace]);

  const fetchMembers = async () => {
    setLoading(true);
    // As we don't have a direct users table accessible to public, we fetch from workspace_members
    // In a real app with proper admin API, you'd join with auth.users.
    // For this prototype, we'll just display user_id and role.
    const { data, error } = await supabase
      .from('workspace_members')
      .select('*')
      .eq('workspace_id', activeWorkspace?.id);
      
    if (data) setMembers(data);
    setLoading(false);
  };

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    setInviting(true);
    
    try {
      // In a real app, this would trigger an Edge Function to invite a user via Email using Supabase Admin API.
      // For this prototype, we'll simulate inviting by just showing a success alert.
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Simulate Audit Log
      await supabase.from('audit_logs').insert({
        workspace_id: activeWorkspace?.id,
        user_id: user?.id,
        action: 'INVITE_MEMBER',
        resource_name: inviteEmail,
        details: { role: inviteRole }
      });
      
      alert(`Undangan berhasil dikirim ke ${inviteEmail} sebagai ${inviteRole.toUpperCase()}`);
      setInviteEmail("");
    } catch (err: any) {
      alert("Gagal mengundang: " + err.message);
    } finally {
      setInviting(false);
    }
  };

  const handleRemove = async (memberId: string) => {
    if (memberId === user?.id) {
      alert("Anda tidak bisa menghapus diri Anda sendiri dari Workspace.");
      return;
    }
    
    if (confirm("Apakah Anda yakin ingin menghapus anggota ini dari Workspace?")) {
      const { error } = await supabase
        .from('workspace_members')
        .delete()
        .eq('workspace_id', activeWorkspace?.id)
        .eq('user_id', memberId);
        
      if (!error) {
        // Simulate Audit Log
        await supabase.from('audit_logs').insert({
          workspace_id: activeWorkspace?.id,
          user_id: user?.id,
          action: 'REMOVE_MEMBER',
          resource_name: memberId
        });
        
        fetchMembers();
      }
    }
  };

  return (
    <div className="space-y-8">
      {/* Invite Section */}
      <div>
        <h2 className="text-lg font-bold text-gray-900 mb-4">Undang Anggota Baru</h2>
        <form onSubmit={handleInvite} className="flex flex-col sm:flex-row gap-3">
          <div className="flex-1 relative">
            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <input 
              type="email" 
              required
              value={inviteEmail}
              onChange={e => setInviteEmail(e.target.value)}
              placeholder="Alamat email kolega Anda..." 
              className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:border-pln-blue focus:ring-1 focus:ring-pln-blue text-sm"
            />
          </div>
          <select 
            value={inviteRole}
            onChange={e => setInviteRole(e.target.value)}
            className="w-full sm:w-48 px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:border-pln-blue text-sm"
          >
            <option value="viewer">Viewer (Hanya Lihat)</option>
            <option value="editor">Editor (Bisa Edit)</option>
            <option value="admin">Admin (Akses Penuh)</option>
          </select>
          <button 
            type="submit"
            disabled={inviting}
            className="bg-gray-900 hover:bg-black text-white px-6 py-2.5 rounded-xl font-bold text-sm flex items-center justify-center gap-2 disabled:opacity-50 transition-colors"
          >
            {inviting ? "Mengundang..." : <><UserPlus size={18} /> Undang</>}
          </button>
        </form>
      </div>

      <div className="h-px w-full bg-gray-100"></div>

      {/* Members List */}
      <div>
        <h2 className="text-lg font-bold text-gray-900 mb-4">Daftar Anggota Tim</h2>
        
        {loading ? (
          <div className="text-sm text-gray-500">Memuat anggota...</div>
        ) : (
          <div className="border border-gray-200 rounded-xl overflow-hidden">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200">
                  <th className="px-4 py-3 text-xs font-bold text-gray-500 uppercase tracking-wider w-1/2">User ID</th>
                  <th className="px-4 py-3 text-xs font-bold text-gray-500 uppercase tracking-wider">Peran (Role)</th>
                  <th className="px-4 py-3 text-xs font-bold text-gray-500 uppercase tracking-wider text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {members.map((member) => (
                  <tr key={member.user_id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-blue-100 text-pln-blue flex items-center justify-center font-bold text-xs shrink-0">
                          {member.user_id === user?.id ? 'ME' : 'U'}
                        </div>
                        <div className="flex flex-col">
                          <span className="text-sm font-bold text-gray-900 font-mono">
                            {member.user_id.substring(0, 8)}...{member.user_id.substring(member.user_id.length - 4)}
                          </span>
                          {member.user_id === user?.id && <span className="text-[10px] text-pln-blue font-bold uppercase">Anda</span>}
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium capitalize ${
                        member.role === 'admin' ? 'bg-purple-100 text-purple-700' :
                        member.role === 'editor' ? 'bg-blue-100 text-blue-700' :
                        'bg-gray-100 text-gray-700'
                      }`}>
                        {member.role === 'admin' && <ShieldAlert size={12} className="mr-1" />}
                        {member.role}
                      </span>
                    </td>
                    <td className="px-4 py-4 text-right">
                      {member.user_id !== user?.id && (
                        <button 
                          onClick={() => handleRemove(member.user_id)}
                          className="text-red-500 hover:text-red-700 hover:bg-red-50 p-1.5 rounded-lg transition-colors inline-flex items-center gap-1 text-xs font-medium"
                        >
                          <Trash2 size={14} /> Hapus
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
