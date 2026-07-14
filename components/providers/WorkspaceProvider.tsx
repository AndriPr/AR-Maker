"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";

export type Workspace = {
  id: string;
  name: string;
  logo_url: string | null;
  custom_domain: string | null;
};

type WorkspaceContextType = {
  workspaces: Workspace[];
  activeWorkspace: Workspace | null;
  activeRole: 'admin' | 'editor' | 'viewer' | null;
  user: any | null;
  setActiveWorkspaceId: (id: string) => void;
  isLoading: boolean;
};

const WorkspaceContext = createContext<WorkspaceContextType>({
  workspaces: [],
  activeWorkspace: null,
  activeRole: null,
  user: null,
  setActiveWorkspaceId: () => {},
  isLoading: true,
});

export const useWorkspace = () => useContext(WorkspaceContext);

export function WorkspaceProvider({ children }: { children: React.ReactNode }) {
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [activeWorkspaceId, setActiveWorkspaceId] = useState<string | null>(null);
  const [activeRole, setActiveRole] = useState<'admin' | 'editor' | 'viewer' | null>(null);
  const [user, setUser] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchWorkspaces();
  }, []);

  const fetchWorkspaces = async () => {
    const { data: sessionData } = await supabase.auth.getSession();
    const currentUser = sessionData?.session?.user;
    
    if (!currentUser) {
      setIsLoading(false);
      return;
    }
    setUser(currentUser);

    // Fetch workspaces using the API route to bypass RLS issues
    try {
      const res = await fetch(`/api/workspaces?user_id=${currentUser.id}`);
      if (!res.ok) throw new Error('Failed to fetch workspaces');
      
      const { workspaces: data } = await res.json();

      if (data && data.length > 0) {
        const formattedWorkspaces = data.map((item: any) => ({
          id: item.workspaces.id,
          name: item.workspaces.name,
          logo_url: item.workspaces.logo_url,
          custom_domain: item.workspaces.custom_domain,
          role: item.role
        }));

        setWorkspaces(formattedWorkspaces);

        // Load saved active workspace from localStorage or default to first one
        const savedWorkspaceId = localStorage.getItem('activeWorkspaceId');
        const found = formattedWorkspaces.find((w: any) => w.id === savedWorkspaceId);
        
        if (found) {
          setActiveWorkspaceId(found.id);
          setActiveRole(found.role);
        } else {
          setActiveWorkspaceId(formattedWorkspaces[0].id);
          setActiveRole(formattedWorkspaces[0].role);
          localStorage.setItem('activeWorkspaceId', formattedWorkspaces[0].id);
        }
      }
    } catch (error) {
      console.error("Error fetching workspaces:", error);
    }
    
    setIsLoading(false);


  };

  // When activeWorkspaceId changes, update role and localStorage
  useEffect(() => {
    if (activeWorkspaceId && workspaces.length > 0) {
      const found = workspaces.find(w => w.id === activeWorkspaceId);
      if (found) {
        setActiveRole((found as any).role);
        localStorage.setItem('activeWorkspaceId', activeWorkspaceId);
      }
    }
  }, [activeWorkspaceId, workspaces]);

  const activeWorkspace = workspaces.find(w => w.id === activeWorkspaceId) || null;

  return (
    <WorkspaceContext.Provider value={{ 
      workspaces, 
      activeWorkspace, 
      activeRole, 
      user,
      setActiveWorkspaceId,
      isLoading
    }}>
      {children}
    </WorkspaceContext.Provider>
  );
}
