import { createBrowserClient } from '@supabase/ssr';

// Pastikan nilai URL dan Key diambil dari .env.local
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

// Instance Supabase Client tunggal untuk seluruh aplikasi (Client-Side)
export const supabase = createBrowserClient(supabaseUrl, supabaseAnonKey);
