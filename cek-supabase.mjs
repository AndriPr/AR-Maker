import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  NEXT_PUBLIC_SUPABASE_URL=https://shpwfpquxbqzrekoknjj.supabase.co,
  NEXT_PUBLIC_SUPABASE_ANON_KEY=sb_publishable_uQF_B2hVDqraeIjVDJufQA_YliBLebS


async function cekTabel(nama) {
  const { error } = await supabase.from(nama).select('id').limit(1);
  if (error && error.code === '42P01') {
    console.log(`❌ Tabel "${nama}" BELUM ADA`);
  } else if (error) {
    console.log(`⚠️  Tabel "${nama}" kemungkinan ADA, tapi ada error lain: ${error.message}`);
  } else {
    console.log(`✅ Tabel "${nama}" SUDAH ADA`);
  }
}

async function cekBucket(nama) {
  const { error } = await supabase.storage.from(nama).list();
  if (error && /not found/i.test(error.message)) {
    console.log(`❌ Bucket "${nama}" BELUM ADA`);
  } else if (error) {
    console.log(`⚠️  Bucket "${nama}" kemungkinan ADA, tapi ada error lain: ${error.message}`);
  } else {
    console.log(`✅ Bucket "${nama}" SUDAH ADA`);
  }
}

await cekTabel('ar_projects');
await cekTabel('assets');
await cekBucket('assets');