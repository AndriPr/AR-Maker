"use client";

import { useEffect } from "react";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("APP ERROR BOUNDARY CAUGHT:", error);
  }, [error]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-8 bg-gray-50 text-center">
      <div className="bg-white p-8 rounded-2xl shadow-sm border border-red-100 max-w-2xl w-full">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Error Caught</h2>
        <div className="bg-red-50 text-red-700 p-4 rounded-xl text-left overflow-auto mb-6 text-sm font-mono whitespace-pre-wrap">
          {error.name}: {error.message}
          {"\n\n"}
          {error.stack}
        </div>
        <button
          onClick={() => reset()}
          className="bg-blue-600 text-white px-6 py-3 rounded-xl font-bold"
        >
          Try again
        </button>
      </div>
    </div>
  );
}
