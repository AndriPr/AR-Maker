import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabaseAdmin';

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabaseAdmin = getSupabaseAdmin();
  await supabaseAdmin.rpc('track_project_view', { pid: id } as any);
  return NextResponse.json({ ok: true });
}