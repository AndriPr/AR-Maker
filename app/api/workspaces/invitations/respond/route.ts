import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { invitation_id, user_id, action } = body;

    if (!invitation_id || !user_id || !action || !['accept', 'reject'].includes(action)) {
      return NextResponse.json({ error: 'Invalid parameters' }, { status: 400 });
    }

    // Fetch the invitation
    const { data: invite, error: inviteError } = await supabaseAdmin
      .from('workspace_invitations')
      .select('*')
      .eq('id', invitation_id)
      .eq('status', 'pending')
      .single();

    if (inviteError || !invite) {
      return NextResponse.json({ error: 'Invitation not found or already processed' }, { status: 404 });
    }

    if (action === 'accept') {
      // 1. Add user to workspace_members
      const { error: memberError } = await supabaseAdmin
        .from('workspace_members')
        .insert({
          workspace_id: invite.workspace_id,
          user_id: user_id,
          role: invite.role
        });
        
      if (memberError && memberError.code !== '23505') { // Ignore if somehow already member
        throw memberError;
      }

      // 2. Update invitation status
      await supabaseAdmin
        .from('workspace_invitations')
        .update({ status: 'accepted' })
        .eq('id', invitation_id);

      // Log audit action
      await supabaseAdmin.from('audit_logs').insert({
        workspace_id: invite.workspace_id,
        user_id: user_id,
        action: 'ACCEPT_INVITATION',
        resource_name: invite.email
      });

    } else if (action === 'reject') {
      // Update invitation status
      await supabaseAdmin
        .from('workspace_invitations')
        .update({ status: 'rejected' })
        .eq('id', invitation_id);
    }

    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
