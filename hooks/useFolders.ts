"use client";

import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useWorkspace } from '@/components/providers/WorkspaceProvider';

export type Folder = {
  id: string;
  name: string;
  parent_id: string | null;
  workspace_id: string | null;
  user_id: string;
  created_at: string;
};

export type FolderNode = Folder & { depth: number };

export function buildFolderTree(folders: Folder[], parentId: string | null = null, depth = 0): FolderNode[] {
  return folders
    .filter((f) => f.parent_id === parentId)
    .flatMap((f) => [{ ...f, depth }, ...buildFolderTree(folders, f.id, depth + 1)]);
}

export function useFolders() {
  const { activeWorkspace, isLoading } = useWorkspace();

  return useQuery({
    queryKey: ['folders', activeWorkspace?.id ?? 'personal'],
    queryFn: async (): Promise<Folder[]> => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return [];

      let query = supabase.from('folders').select('*').order('created_at', { ascending: true });
      if (activeWorkspace) {
        query = query.eq('workspace_id', activeWorkspace.id);
      } else {
        query = query.is('workspace_id', null).eq('user_id', session.user.id);
      }

      const { data } = await query;
      return (data as Folder[]) || [];
    },
    enabled: !isLoading,
  });
}
