"use client";

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { Mail, Lock, ArrowRight, Loader2 } from 'lucide-react';
import { supabase } from '@/lib/supabase';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;
      
      if (data.session) {
        // Redirect to dashboard on success
        router.push('/');
        router.refresh();
      }
    } catch (err: any) {
      setError(err.message || 'Email atau password salah.');
    } finally {
      setLoading(false);
    }
  const handleOAuthLogin = async (provider: 'google' | 'azure') => {
    setLoading(true);
    setError(null);
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: provider,
        options: {
          redirectTo: `${window.location.origin}/auth/callback`
        }
      });
      if (error) throw error;
    } catch (err: any) {
      setError(err.message || `Gagal login dengan ${provider}`);
      setLoading(false);
    }
  };

  return (
    <div>
      <h2 className="text-xl font-bold text-gray-900 mb-6 text-center">Masuk ke Akun Anda</h2>
      
      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-600 text-sm rounded-xl">
          {error}
        </div>
      )}

      <form className="space-y-5" onSubmit={handleLogin}>
        <div>
          <label className="block text-sm font-bold text-gray-700 mb-2" htmlFor="email">
            Alamat Email
          </label>
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="nama@email.com"
              className="w-full bg-gray-50 border border-gray-200 rounded-xl py-3 pl-10 pr-4 text-sm focus:ring-2 focus:ring-pln-blue outline-none transition-shadow"
              required
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-bold text-gray-700 mb-2" htmlFor="password">
            Kata Sandi
          </label>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full bg-gray-50 border border-gray-200 rounded-xl py-3 pl-10 pr-4 text-sm focus:ring-2 focus:ring-pln-blue outline-none transition-shadow"
              required
            />
          </div>
          <div className="flex justify-end mt-2">
            <a href="#" className="text-xs font-bold text-pln-blue hover:text-pln-blue-dark">Lupa kata sandi?</a>
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full flex justify-center items-center gap-2 bg-pln-blue hover:bg-pln-blue-dark text-white font-bold py-3 px-4 rounded-xl transition-colors mt-6 disabled:opacity-50"
        >
          {loading ? <Loader2 className="animate-spin" size={18} /> : (
            <>
              Masuk
              <ArrowRight size={18} />
            </>
          )}
        </button>
      </form>

      <div className="mt-6 flex items-center justify-between">
        <hr className="w-full border-gray-200" />
        <span className="p-2 text-xs text-gray-400 font-bold w-full text-center">ATAU LANJUTKAN DENGAN</span>
        <hr className="w-full border-gray-200" />
      </div>

      <div className="mt-6 grid grid-cols-2 gap-4">
        <button
          type="button"
          disabled={loading}
          onClick={() => handleOAuthLogin('google')}
          className="flex items-center justify-center gap-2 bg-white border border-gray-200 hover:bg-gray-50 text-gray-700 font-bold py-3 px-4 rounded-xl transition-colors disabled:opacity-50"
        >
          <img src="https://www.svgrepo.com/show/475656/google-color.svg" alt="Google" className="w-5 h-5" />
          Google
        </button>
        <button
          type="button"
          disabled={loading}
          onClick={() => handleOAuthLogin('azure')}
          className="flex items-center justify-center gap-2 bg-white border border-gray-200 hover:bg-gray-50 text-gray-700 font-bold py-3 px-4 rounded-xl transition-colors disabled:opacity-50"
        >
          <img src="https://www.svgrepo.com/show/475666/microsoft-color.svg" alt="Microsoft" className="w-5 h-5" />
          Microsoft
        </button>
      </div>

      <div className="mt-8 text-center text-sm text-gray-600">
        Belum punya akun?{' '}
        <Link href="/register" className="font-bold text-pln-blue hover:text-pln-blue-dark">
          Daftar Sekarang
        </Link>
      </div>
    </div>
  );
}
