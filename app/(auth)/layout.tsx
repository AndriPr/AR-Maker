import Image from 'next/image';

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen relative overflow-hidden bg-gray-50 flex flex-col justify-center py-6 sm:py-12 px-4 sm:px-6 lg:px-8">
      {/* Soft gradient blobs */}
      <div className="pointer-events-none absolute -bottom-32 -left-32 w-96 h-96 bg-pln-yellow/30 rounded-full blur-3xl" />
      <div className="pointer-events-none absolute -top-40 -right-32 w-[28rem] h-[28rem] bg-pln-blue/20 rounded-full blur-3xl" />
      <div className="pointer-events-none absolute bottom-0 right-0 w-80 h-80 bg-pln-blue/10 rounded-full blur-3xl" />

      <div className="relative z-10 sm:mx-auto sm:w-full sm:max-w-md flex flex-col items-center">
        <div className="mb-4">
          <Image
            src="/Logo_PLN.png"
            alt="Logo PLN"
            width={62}
            height={85}
            priority
          />
        </div>
        <h2 className="text-center text-2xl sm:text-3xl font-extrabold text-pln-blue-dark">
          AR Maker
        </h2>
      </div>

      <div className="relative z-10 mt-6 sm:mt-8 sm:mx-auto sm:w-full sm:max-w-md w-full">
        <div className="bg-white py-6 sm:py-8 px-4 shadow-lg sm:shadow-xl rounded-2xl sm:rounded-3xl sm:px-10 border border-gray-100">
          {children}
        </div>
      </div>
    </div>
  );
}