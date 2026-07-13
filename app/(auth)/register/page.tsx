"use client";

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { Mail, Lock, User, ArrowRight, Loader2 } from 'lucide-react';
import { supabase } from '@/lib/supabase';

export default function RegisterPage() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: name,
          }
        }
      });

      if (error) throw error;
      
      // Usually requires email confirmation, but for MVP we might just redirect or auto-login
      if (data.user) {
        alert("Pendaftaran berhasil! Silakan login.");
        router.push('/login');
      }
    } catch (err: any) {
      setError(err.message || 'Terjadi kesalahan saat pendaftaran.');
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
      setError(err.message || `Gagal mendaftar dengan ${provider}`);
      setLoading(false);
    }
  };

  return (
    <div>
      <h2 className="text-xl font-bold text-gray-900 mb-6 text-center">Buat Akun Baru</h2>
      
      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-600 text-sm rounded-xl">
          {error}
        </div>
      )}
      
      <form className="space-y-5" onSubmit={handleRegister}>
        <div>
          <label className="block text-sm font-bold text-gray-700 mb-2" htmlFor="name">
            Nama Lengkap
          </label>
          <div className="relative">
            <User className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <input
              id="name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="John Doe"
              className="w-full bg-gray-50 border border-gray-200 rounded-xl py-3 pl-10 pr-4 text-sm focus:ring-2 focus:ring-pln-blue outline-none transition-shadow"
              required
            />
          </div>
        </div>

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
              placeholder="Minimal 8 karakter"
              className="w-full bg-gray-50 border border-gray-200 rounded-xl py-3 pl-10 pr-4 text-sm focus:ring-2 focus:ring-pln-blue outline-none transition-shadow"
              required
              minLength={8}
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full flex justify-center items-center gap-2 bg-pln-yellow hover:bg-pln-yellow-hover text-gray-900 font-bold py-3 px-4 rounded-xl transition-colors mt-6 disabled:opacity-50"
        >
          {loading ? <Loader2 className="animate-spin" size={18} /> : (
            <>
              Daftar Sekarang
              <ArrowRight size={18} />
            </>
          )}
        </button>
      </form>

      <div className="mt-6 flex items-center justify-between">
        <hr className="w-full border-gray-200" />
        <span className="p-2 text-xs text-gray-400 font-bold w-full text-center">ATAU DAFTAR DENGAN</span>
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
        Sudah punya akun?{' '}
        <Link href="/login" className="font-bold text-pln-blue hover:text-pln-blue-dark">
          Masuk di sini
        </Link>
      </div>
    </div>
  );
}
