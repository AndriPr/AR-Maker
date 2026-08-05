import { createClient } from '@supabase/supabase-js';

let cached: ReturnType<typeof createClient> | null = null;

// Lazily constructed so route modules don't crash during Next.js's build-time
// page-data collection if SUPABASE_SERVICE_ROLE_KEY isn't present yet.
export function getSupabaseAdmin() {
  if (!cached) {
    cached = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );
  }
  return cached;
}
