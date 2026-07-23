const { createClient } = require('@supabase/supabase-js');

// Configurações do Supabase serão lidas do .env
const supabaseUrl = process.env.SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_KEY || '';

let supabase;

function getDB() {
  if (!supabaseUrl || !supabaseKey) {
    console.error('⚠️ SUPABASE_URL ou SUPABASE_KEY não configuradas no .env');
    // Para evitar que a API crashe imediatamente se o .env não estiver pronto
    // Retornamos um mock do supabase se necessário, ou apenas deixamos instanciar com erro
  }
  
  if (!supabase && supabaseUrl && supabaseKey) {
    supabase = createClient(supabaseUrl, supabaseKey);
  }
  return supabase;
}

module.exports = { getDB };
