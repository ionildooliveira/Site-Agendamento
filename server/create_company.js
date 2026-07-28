require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');
const bcrypt = require('bcryptjs');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing SUPABASE_URL or SUPABASE_KEY in .env');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function createCompany() {
  const args = process.argv.slice(2);
  if (args.length < 4) {
    console.log('Uso: node create_company.js <Nome da Empresa> <slug-da-empresa> <email-admin> <senha-admin>');
    process.exit(1);
  }

  const [companyName, companySlug, adminEmail, adminPassword] = args;

  // 1. Inserir empresa
  const { data: company, error: companyError } = await supabase
    .from('companies')
    .insert([{ name: companyName, slug: companySlug }])
    .select()
    .single();

  if (companyError) {
    console.error('Erro ao criar empresa:', companyError.message);
    process.exit(1);
  }
  
  console.log(`✅ Empresa ${companyName} criada com ID: ${company.id}`);

  // 2. Inserir Admin
  const salt = await bcrypt.genSalt(10);
  const passwordHash = await bcrypt.hash(adminPassword, salt);
  
  const { error: adminError } = await supabase
    .from('admin_users')
    .insert([
      {
        name: `Admin - ${companyName}`,
        email: adminEmail,
        password_hash: passwordHash,
        company_id: company.id
      }
    ]);
  
  if (adminError) {
    console.error('Erro ao criar usuário admin:', adminError.message);
  } else {
    console.log(`✅ Usuário admin ${adminEmail} criado.`);
  }

  // 3. Configurações padrão
  const { error: settingsError } = await supabase
    .from('settings')
    .insert([
      {
        company_id: company.id,
        slot_interval: 30,
        working_hours: {
          "0": null,
          "1": { "open": "09:00", "close": "19:00" },
          "2": { "open": "09:00", "close": "19:00" },
          "3": { "open": "09:00", "close": "19:00" },
          "4": { "open": "09:00", "close": "19:00" },
          "5": { "open": "09:00", "close": "19:00" },
          "6": { "open": "09:00", "close": "17:00" }
        }
      }
    ]);

  if (settingsError) {
    console.error('Erro ao criar configurações padrão:', settingsError.message);
  } else {
    console.log('✅ Configurações padrão criadas.');
  }

  console.log('Feito!');
}

createCompany();
