"use client";

import { useState } from "react";
import Sidebar from "@/components/ui/Sidebar";
import Header from "@/components/ui/Header";
import WorkspaceBanner from "@/components/ui/WorkspaceBanner";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen bg-gray-50 text-foreground flex relative">
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      
      {/* Mobile Overlay */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 md:hidden transition-opacity"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <div className="flex-1 md:ml-64 flex flex-col min-w-0 min-h-screen transition-all duration-300">
        <WorkspaceBanner />
        <Header onMenuClick={() => setSidebarOpen(true)} />
        <main className="p-4 sm:p-6 md:p-8 flex-1 w-full max-w-7xl mx-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
