import { redirect } from 'next/navigation';

export default async function ARViewer({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  redirect(`/api/ar/${encodeURIComponent(id)}`);
}
