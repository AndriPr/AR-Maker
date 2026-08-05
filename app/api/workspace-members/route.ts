import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabaseAdmin';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  const supabaseAdmin = getSupabaseAdmin();
  const { searchParams } = new URL(request.url);
  const workspaceId = searchParams.get('workspace_id');

  if (!workspaceId) {
    return NextResponse.json({ error: 'Workspace ID required' }, { status: 400 });
  }

  const { data: members, error: membersError } = await supabaseAdmin
    .from('workspace_members')
    .select('*')
    .eq('workspace_id', workspaceId);

  if (membersError) {
    return NextResponse.json({ error: membersError.message }, { status: 500 });
  }

  const { data: authData, error: authError } = await supabaseAdmin.auth.admin.listUsers();
  
  if (authError) {
    return NextResponse.json({ error: authError.message }, { status: 500 });
  }

  const usersMap = new Map(authData.users.map(u => [u.id, u]));

  const enrichedMembers = members.map(m => {
    const user = usersMap.get(m.user_id);
    return {
      ...m,
      email: user?.email || 'unknown@example.com',
      display_name: user?.user_metadata?.display_name || 'Unknown User'
    };
  });

  return NextResponse.json({ members: enrichedMembers });
}
