const { createClient } = require('@supabase/supabase-js');

let supabase;

function getDB() {
  const supabaseUrl = process.env.SUPABASE_URL || '';
  const supabaseKey = process.env.SUPABASE_KEY || '';

  if (!supabaseUrl || !supabaseKey) {
    console.error('⚠️ SUPABASE_URL ou SUPABASE_KEY não configuradas no .env');
  }
  
  if (!supabase && supabaseUrl && supabaseKey) {
    supabase = createClient(supabaseUrl, supabaseKey);
  }
  return supabase;
}

module.exports = { getDB };
