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

async function init() {
  console.log('Inserting default settings...');
  const { error: settingsError } = await supabase
    .from('settings')
    .upsert([
      {
        id: 1,
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
  if (settingsError) console.error('Error inserting settings:', settingsError);

  console.log('Inserting admin user...');
  const salt = await bcrypt.genSalt(10);
  const passwordHash = await bcrypt.hash('admin123', salt);
  
  const { error: adminError } = await supabase
    .from('admin_users')
    .upsert([
      {
        id: 1, // Optional: Upsert logic relies on PK or Unique
        name: 'Admin',
        email: 'admin@studiobeauty.com',
        password_hash: passwordHash
      }
    ], { onConflict: 'email' });
  
  if (adminError) console.error('Error inserting admin:', adminError);

  console.log('Database initialization script completed.');
}

init();
