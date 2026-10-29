"use client";

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { Mail, Lock, User, ArrowRight, Loader2 } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';

const registerSchema = z.object({
  name: z.string().min(2, { message: "Nama minimal 2 karakter" }),
  email: z.string().email({ message: "Format email tidak valid" }),
  password: z.string().min(6, { message: "Kata sandi minimal 6 karakter" }),
});

type RegisterFormValues = z.infer<typeof registerSchema>;

export default function RegisterPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      name: "",
      email: "",
      password: "",
    },
  });

  const onSubmit = async (data: RegisterFormValues) => {
    setLoading(true);
    setError(null);

    try {
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: data.email,
        password: data.password,
        options: {
          data: {
            full_name: data.name,
          }
        }
      });

      if (authError) throw authError;
      
      if (authData.user) {
        toast.success("Pendaftaran berhasil! Silakan login.");
        router.push('/login');
      }
    } catch (err: any) {
      setError(err.message || 'Terjadi kesalahan saat pendaftaran.');
    } finally {
      setLoading(false);
    }
  };

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
      
      <form className="space-y-5" onSubmit={handleSubmit(onSubmit)}>
        <div className="space-y-2">
          <Label htmlFor="name" className="font-bold text-gray-700">Nama Lengkap</Label>
          <div className="relative">
            <User className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <Input
              id="name"
              type="text"
              placeholder="John Doe"
              className={`pl-10 ${errors.name ? 'border-red-500 focus-visible:ring-red-500' : ''}`}
              {...register("name")}
            />
          </div>
          {errors.name && <p className="text-red-500 text-xs font-medium mt-1">{errors.name.message}</p>}
        </div>

        <div className="space-y-2">
          <Label htmlFor="email" className="font-bold text-gray-700">Alamat Email</Label>
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <Input
              id="email"
              type="email"
              placeholder="nama@email.com"
              className={`pl-10 ${errors.email ? 'border-red-500 focus-visible:ring-red-500' : ''}`}
              {...register("email")}
            />
          </div>
          {errors.email && <p className="text-red-500 text-xs font-medium mt-1">{errors.email.message}</p>}
        </div>

        <div className="space-y-2">
          <Label htmlFor="password" className="font-bold text-gray-700">Kata Sandi</Label>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <Input
              id="password"
              type="password"
              placeholder="••••••••"
              className={`pl-10 ${errors.password ? 'border-red-500 focus-visible:ring-red-500' : ''}`}
              {...register("password")}
            />
          </div>
          {errors.password && <p className="text-red-500 text-xs font-medium mt-1">{errors.password.message}</p>}
        </div>

        <div className="pt-2">
          <button 
            type="submit" 
            disabled={loading}
            className="w-full bg-pln-blue hover:bg-pln-blue-dark text-white font-bold py-3 rounded-xl transition-all shadow-md hover:shadow-lg disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2 group"
          >
            {loading ? (
              <><Loader2 size={18} className="animate-spin" /> Mendaftarkan...</>
            ) : (
              <>Daftar <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" /></>
            )}
          </button>
        </div>
      </form>

      {/* Pendaftaran Google/Microsoft disembunyikan: provider belum diaktifkan di Supabase.
          Aktifkan dulu di Supabase (Authentication > Providers), lalu tampilkan lagi
          tombol yang memanggil handleOAuthLogin('google') / handleOAuthLogin('azure'). */}

      <p className="mt-8 text-center text-sm text-gray-600">
        Sudah punya akun?{' '}
        <Link href="/login" className="font-bold text-pln-blue hover:text-pln-blue-dark transition-colors">
          Masuk di sini
        </Link>
      </p>
    </div>
  );
}