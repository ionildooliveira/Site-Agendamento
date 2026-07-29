require('dotenv').config();
const { getDB } = require('./database/db');
const bcrypt = require('bcryptjs');

async function run() {
  const supabase = getDB();
  const salt = await bcrypt.genSalt(10);
  const hash = await bcrypt.hash('Soifdx29@', salt);
  
  const { data, error } = await supabase
    .from('admin_users')
    .update({ password_hash: hash })
    .eq('email', 'admin@renovacao.com');
    
  console.log("Update Error:", error);
  console.log("Updated!");
}

run();
