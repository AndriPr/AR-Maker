"use client";

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { use } from 'react';

export default function ARViewer({ params }: { params: Promise<{ id: string }> }) {
  const unwrappedParams = use(params);
  const router = useRouter();

  useEffect(() => {
    // Redirect langsung ke canvas untuk menghindari masalah Iframe pada WebXR Viewer di iOS
    router.replace(`/ar-canvas/${unwrappedParams.id}`);
  }, [unwrappedParams.id, router]);

  return (
    <div className="h-screen w-screen flex flex-col items-center justify-center bg-gray-900 text-white">
      <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mb-4"></div>
      <p>Mengalihkan ke AR Canvas murni...</p>
    </div>
  );
}
