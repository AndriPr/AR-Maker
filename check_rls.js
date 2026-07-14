const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({path: '.env.local'});
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
async function run() {
  const { data: d1, error: e1 } = await supabase.rpc('run_sql', { query: `SELECT relname, relrowsecurity FROM pg_class WHERE relname IN ('workspaces', 'workspace_members', 'ar_projects');` });
  console.log('RLS Status:', d1, e1);
  if (e1 && e1.message.includes('Could not find')) {
     console.log('run_sql rpc not available.');
  }
}
run();
