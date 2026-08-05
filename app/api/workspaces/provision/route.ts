import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabaseAdmin';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  try {
    const supabaseAdmin = getSupabaseAdmin();
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
