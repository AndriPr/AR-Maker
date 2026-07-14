import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY! // Uses service_role payload implicitly based on .env
);

// GET: Fetch pending invitations
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const workspaceId = searchParams.get('workspace_id');
    const email = searchParams.get('email');

    if (workspaceId) {
      // Fetch invitations for a specific workspace (Admin view)
      const { data, error } = await supabaseAdmin
        .from('workspace_invitations')
        .select('*')
        .eq('workspace_id', workspaceId)
        .eq('status', 'pending');
        
      if (error) throw error;
      return NextResponse.json({ invitations: data });
    } else if (email) {
      // Fetch invitations for a specific email (User view across all workspaces)
      const { data, error } = await supabaseAdmin
        .from('workspace_invitations')
        .select(`
          id,
          workspace_id,
          role,
          invited_by,
          created_at,
          workspaces ( name, logo_url )
        `)
        .eq('email', email)
        .eq('status', 'pending');
        
      if (error) throw error;
      return NextResponse.json({ invitations: data });
    } else {
      return NextResponse.json({ error: 'Missing workspace_id or email parameter' }, { status: 400 });
    }
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// POST: Create a new invitation
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { workspace_id, email, role, invited_by } = body;

    if (!workspace_id || !email || !role || !invited_by) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Check if the user is already a member
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.listUsers();
    if (authError) throw authError;

    const existingUser = authData.users.find(u => u.email === email);
    if (existingUser) {
      const { data: memberData } = await supabaseAdmin
        .from('workspace_members')
        .select('user_id')
        .eq('workspace_id', workspace_id)
        .eq('user_id', existingUser.id)
        .single();

      if (memberData) {
        return NextResponse.json({ error: 'User is already a member of this workspace' }, { status: 400 });
      }
    }

    // Check if an invitation is already pending
    const { data: existingInvite } = await supabaseAdmin
      .from('workspace_invitations')
      .select('id')
      .eq('workspace_id', workspace_id)
      .eq('email', email)
      .eq('status', 'pending')
      .single();

    if (existingInvite) {
      return NextResponse.json({ error: 'An invitation is already pending for this email' }, { status: 400 });
    }

    // Create the invitation
    const { data, error } = await supabaseAdmin
      .from('workspace_invitations')
      .insert({
        workspace_id,
        email,
        role,
        invited_by,
        status: 'pending'
      })
      .select()
      .single();

    if (error) {
      // Handle unique constraint violation just in case
      if (error.code === '23505') {
        return NextResponse.json({ error: 'Invitation already exists.' }, { status: 400 });
      }
      throw error;
    }

    // Log the audit action
    await supabaseAdmin.from('audit_logs').insert({
      workspace_id,
      user_id: invited_by,
      action: 'INVITE_MEMBER',
      resource_name: email,
      details: { role, invitation_id: data.id }
    });

    return NextResponse.json({ invitation: data });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// DELETE: Revoke an invitation
export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    const workspaceId = searchParams.get('workspace_id');

    if (!id || !workspaceId) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const { error } = await supabaseAdmin
      .from('workspace_invitations')
      .delete()
      .eq('id', id)
      .eq('workspace_id', workspaceId);

    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
