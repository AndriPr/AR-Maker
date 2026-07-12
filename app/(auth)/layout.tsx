import { Zap } from 'lucide-react';

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-6 sm:py-12 px-4 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md flex flex-col items-center">
        <div className="bg-pln-yellow p-2 sm:p-3 rounded-xl mb-4 shadow-sm">
          <Zap size={32} className="text-white fill-current" />
        </div>
        <h2 className="text-center text-2xl sm:text-3xl font-extrabold text-pln-blue-dark">
          AR<span className="text-pln-blue font-light">Maker</span>
        </h2>
      </div>

      <div className="mt-6 sm:mt-8 sm:mx-auto sm:w-full sm:max-w-md w-full">
        <div className="bg-white py-6 sm:py-8 px-4 shadow-lg sm:shadow-xl rounded-2xl sm:rounded-3xl sm:px-10 border border-gray-100">
          {children}
        </div>
      </div>
    </div>
  );
}
