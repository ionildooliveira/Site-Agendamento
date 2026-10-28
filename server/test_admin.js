require('dotenv').config({ path: require('path').join(__dirname, '.env') });
const { getDB } = require('./database/db');

const supabase = getDB();

async function testAdminUsers() {
  const { data, error } = await supabase.from('admin_users').select('*');
  console.log("Error:", error);
  console.log("Admin Users:", data);
}

testAdminUsers();
