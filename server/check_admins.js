require('dotenv').config();
const { getDB } = require('./database/db');

async function run() {
  const supabase = getDB();
  const { data, error } = await supabase.from('admin_users').select('*');
  console.log("Admins:", JSON.stringify(data, null, 2));
  console.log("Error:", error);
}

run();
