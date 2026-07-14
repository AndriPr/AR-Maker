"use client";

import { useEffect, useState } from "react";
import { useWorkspace } from "@/components/providers/WorkspaceProvider";
import { Mail, CheckCircle, XCircle, Info } from "lucide-react";

export default function WorkspaceBanner() {
  const { user } = useWorkspace();
  const [invitations, setInvitations] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user?.email) {
      fetchUserInvitations();
    }
  }, [user]);

  const fetchUserInvitations = async () => {
    try {
      const res = await fetch(`/api/workspaces/invitations?email=${user.email}`);
      const data = await res.json();
      if (data.invitations) {
        setInvitations(data.invitations);
      }
    } catch (err) {
      console.error("Error fetching invitations:", err);
    }
  };

  const handleRespond = async (invitationId: string, action: 'accept' | 'reject') => {
    setLoading(true);
    try {
      const res = await fetch('/api/workspaces/invitations/respond', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          invitation_id: invitationId,
          user_id: user?.id,
          action
        })
      });

      if (!res.ok) throw new Error("Gagal merespons undangan");

      // Remove from list
      setInvitations(prev => prev.filter(i => i.id !== invitationId));

      if (action === 'accept') {
        alert("Undangan diterima! Silakan muat ulang halaman atau cek pengaturan Workspace Anda.");
        // We could theoretically force a page reload here to update the workspaces list
        window.location.reload();
      }
    } catch (err: any) {
      alert(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (invitations.length === 0) return null;

  return (
    <div className="flex flex-col w-full z-50">
      {invitations.map(invite => (
        <div key={invite.id} className="bg-pln-blue text-white px-4 py-3 flex flex-col sm:flex-row items-center justify-between shadow-md">
          <div className="flex items-center gap-3 mb-3 sm:mb-0">
            <Info size={20} className="text-pln-yellow shrink-0" />
            <p className="text-sm font-medium">
              Anda diundang untuk bergabung ke Workspace <span className="font-bold text-pln-yellow">"{invite.workspaces?.name}"</span> sebagai <span className="uppercase font-bold">{invite.role}</span>.
            </p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button 
              onClick={() => handleRespond(invite.id, 'reject')}
              disabled={loading}
              className="px-4 py-1.5 rounded-lg text-xs font-bold bg-white/10 hover:bg-white/20 text-white transition-colors flex items-center gap-1.5 disabled:opacity-50"
            >
              <XCircle size={14} /> Tolak
            </button>
            <button 
              onClick={() => handleRespond(invite.id, 'accept')}
              disabled={loading}
              className="px-4 py-1.5 rounded-lg text-xs font-bold bg-pln-yellow hover:bg-yellow-400 text-pln-blue transition-colors flex items-center gap-1.5 shadow-sm disabled:opacity-50"
            >
              <CheckCircle size={14} /> Terima
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}
