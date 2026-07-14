"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { useWorkspace } from "@/components/providers/WorkspaceProvider";
import { ShieldAlert, UserPlus, Trash2, Mail } from "lucide-react";

export default function MembersPage() {
  const { activeWorkspace, user, activeRole, isLoading: workspaceLoading } = useWorkspace();
  const [members, setMembers] = useState<any[]>([]);
  const [invitations, setInvitations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState("viewer");
  const [inviting, setInviting] = useState(false);

  useEffect(() => {
    if (workspaceLoading) return;

    if (activeWorkspace) {
      fetchMembers();
    } else if (user) {
      setMembers([{
        user_id: user.id,
        role: 'admin',
        email: user.email || 'unknown@example.com',
        display_name: user.user_metadata?.display_name || user.user_metadata?.full_name || 'Unknown User'
      }]);
      setLoading(false);
    }
  }, [activeWorkspace, user, workspaceLoading]);

  const fetchMembers = async () => {
    setLoading(true);
    try {
      const [membersRes, invitesRes] = await Promise.all([
        fetch(`/api/workspace-members?workspace_id=${activeWorkspace?.id}`),
        fetch(`/api/workspaces/invitations?workspace_id=${activeWorkspace?.id}`)
      ]);
      const membersData = await membersRes.json();
      const invitesData = await invitesRes.json();

      if (membersData.members) setMembers(membersData.members);
      if (invitesData.invitations) setInvitations(invitesData.invitations);
    } catch (err) {
      console.error("Error fetching members:", err);
    }
    setLoading(false);
  };

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    setInviting(true);
    
    try {
      const res = await fetch('/api/workspaces/invitations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          workspace_id: activeWorkspace?.id,
          email: inviteEmail,
          role: inviteRole,
          invited_by: user?.id
        })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to invite user');

      alert(`Undangan berhasil dikirim ke ${inviteEmail} sebagai ${inviteRole.toUpperCase()}`);
      setInviteEmail("");
      fetchMembers(); // Refresh to show in pending invitations
    } catch (err: any) {
      alert("Gagal mengundang: " + err.message);
    } finally {
      setInviting(false);
    }
  };

  const handleRevokeInvite = async (inviteId: string) => {
    if (confirm("Cabut undangan ini?")) {
      try {
        const res = await fetch(`/api/workspaces/invitations?id=${inviteId}&workspace_id=${activeWorkspace?.id}`, {
          method: 'DELETE'
        });
        if (!res.ok) throw new Error("Gagal mencabut undangan");
        fetchMembers();
      } catch (err: any) {
        alert(err.message);
      }
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
      {activeRole === 'admin' && (
        <>
          <div className="mb-8 p-6 bg-gray-50 border border-gray-100 rounded-2xl">
            <h2 className="text-lg font-bold text-gray-900 mb-4">Undang Anggota Baru</h2>
            <form onSubmit={handleInvite} className="flex flex-col sm:flex-row gap-3">
              <div className="flex-1 relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                  <Mail size={18} />
                </div>
                <input
                  type="email"
                  required
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  placeholder="Alamat email kolega Anda..."
                  className="w-full pl-10 pr-4 py-2.5 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-pln-blue focus:border-pln-blue transition-all"
                />
              </div>
              <select
                value={inviteRole}
                onChange={(e) => setInviteRole(e.target.value)}
                className="bg-white border border-gray-200 rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-pln-blue focus:border-pln-blue font-medium text-gray-700 min-w-[160px]"
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
        </>
      )}

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
                  <th className="px-4 py-3 text-xs font-bold text-gray-500 uppercase tracking-wider w-1/2">Nama Pengguna</th>
                  <th className="px-4 py-3 text-xs font-bold text-gray-500 uppercase tracking-wider">Peran (Role)</th>
                  {activeRole === 'admin' && <th className="px-4 py-3 text-xs font-bold text-gray-500 uppercase tracking-wider text-right">Aksi</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {members.map((member) => (
                  <tr key={member.user_id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-blue-100 text-pln-blue flex items-center justify-center font-bold text-sm shrink-0">
                          {member.display_name ? member.display_name.substring(0,2).toUpperCase() : 'U'}
                        </div>
                        <div className="flex flex-col">
                          <span className="text-sm font-bold text-gray-900">
                            {member.display_name} {member.user_id === user?.id && <span className="ml-2 inline-block px-1.5 py-0.5 bg-pln-blue text-white rounded text-[10px] uppercase font-bold tracking-wider">Anda</span>}
                          </span>
                          <span className="text-xs text-gray-500">{member.email}</span>
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
                    {activeRole === 'admin' && (
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
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Pending Invitations List */}
      {activeRole === 'admin' && invitations.length > 0 && (
        <div className="pt-4">
          <h2 className="text-lg font-bold text-gray-900 mb-4">Undangan Pending</h2>
          <div className="border border-gray-200 rounded-xl overflow-hidden">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200">
                  <th className="px-4 py-3 text-xs font-bold text-gray-500 uppercase tracking-wider w-1/2">Email</th>
                  <th className="px-4 py-3 text-xs font-bold text-gray-500 uppercase tracking-wider">Peran (Role)</th>
                  <th className="px-4 py-3 text-xs font-bold text-gray-500 uppercase tracking-wider text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {invitations.map((invite) => (
                  <tr key={invite.id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-orange-100 text-orange-600 flex items-center justify-center font-bold text-sm shrink-0">
                          <Mail size={16} />
                        </div>
                        <div className="flex flex-col">
                          <span className="text-sm font-bold text-gray-900">{invite.email}</span>
                          <span className="text-xs text-orange-500">Menunggu Konfirmasi</span>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium capitalize bg-gray-100 text-gray-700`}>
                        {invite.role}
                      </span>
                    </td>
                    <td className="px-4 py-4 text-right">
                      <button 
                        onClick={() => handleRevokeInvite(invite.id)}
                        className="text-red-500 hover:text-red-700 hover:bg-red-50 p-1.5 rounded-lg transition-colors inline-flex items-center gap-1 text-xs font-medium"
                      >
                        <Trash2 size={14} /> Cabut
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
