"use client";

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { Mail, Lock, ArrowRight, Loader2, Eye, EyeOff } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

const loginSchema = z.object({
  email: z.string().email({ message: "Format email tidak valid" }),
  password: z.string().min(6, { message: "Kata sandi minimal 6 karakter" }),
});

type LoginFormValues = z.infer<typeof loginSchema>;

export default function LoginPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const onSubmit = async (data: LoginFormValues) => {
    setLoading(true);
    setError(null);

    try {
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email: data.email,
        password: data.password,
      });

      if (authError) throw authError;

      if (authData.session) {
        router.push('/');
        router.refresh();
      }
    } catch (err: any) {
      setError(err.message || 'Email atau password salah.');
    } finally {
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

      <form className="space-y-5" onSubmit={handleSubmit(onSubmit)}>
        <div className="space-y-2">
          <Label htmlFor="email" className="font-bold text-gray-700">Email</Label>
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
          <div className="flex items-center justify-between">
            <Label htmlFor="password" className="font-bold text-gray-700">Kata Sandi</Label>
            <Link href="/forgot-password" className="text-xs font-bold text-pln-blue hover:text-pln-blue-dark transition-colors">
              Lupa sandi?
            </Link>
          </div>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <Input
              id="password"
              type={showPassword ? "text" : "password"}
              placeholder="••••••••"
              className={`pl-10 pr-10 ${errors.password ? 'border-red-500 focus-visible:ring-red-500' : ''}`}
              {...register("password")}
            />
            <button
              type="button"
              onClick={() => setShowPassword((prev) => !prev)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              tabIndex={-1}
            >
              {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>
          {errors.password && <p className="text-red-500 text-xs font-medium mt-1">{errors.password.message}</p>}
        </div>

        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={rememberMe}
            onChange={(e) => setRememberMe(e.target.checked)}
            className="w-4 h-4 text-pln-blue border-gray-300 rounded focus:ring-pln-blue"
          />
          <span className="text-xs text-gray-600">Ingat saya di perangkat ini</span>
        </label>

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-pln-blue hover:bg-pln-blue-dark text-amber-400 font-bold py-3 rounded-xl transition-all shadow-md hover:shadow-lg disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2 group"
        >
          {loading ? (
            <><Loader2 size={18} className="animate-spin" /> Memproses...</>
          ) : (
            <>Masuk Sekarang <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" /></>
          )}
        </button>
      </form>

      <p className="mt-8 text-center text-sm text-gray-600">
        Belum punya akun?{' '}
        <Link href="/register" className="font-bold text-pln-blue hover:text-pln-blue-dark transition-colors">
          Daftar Gratis
        </Link>
      </p>
    </div>
  );
}