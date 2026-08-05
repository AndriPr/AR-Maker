import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';

// Service-role client: provisioning writes workspace_members rows the caller
// doesn't own yet, which RLS would otherwise block. Server-only.
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(request: Request) {
  try {
    const { userId } = await request.json();
    if (!userId) return NextResponse.json({ error: 'User ID required' }, { status: 400 });

    // 1. Create Workspace
    const { data: workspace, error: wsError } = await supabaseAdmin
      .from('workspaces')
      .insert({ name: 'Personal Workspace' })
      .select('id')
      .single();

    if (wsError) throw wsError;

    // 2. Add User to Workspace
    const { error: memberError } = await supabaseAdmin
      .from('workspace_members')
      .insert({
        workspace_id: workspace.id,
        user_id: userId,
        role: 'admin'
      });

    if (memberError) throw memberError;

    return NextResponse.json({ success: true, workspaceId: workspace.id });
  } catch (error: any) {
    console.error("Provisioning error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
