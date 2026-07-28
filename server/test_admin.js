const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = 'https://zxewxdtpazjutwfxpams.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inp4ZXd4ZHRwYXpqdXR3ZnhwYW1zIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4NDgyNTc4MCwiZXhwIjoyMTAwNDAxNzgwfQ.eXQ3o1S02_9Y7RWtGGU8iKq2C2A-DQ_PQjJAanvDy2g';

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function testAdminUsers() {
  const { data, error } = await supabase.from('admin_users').select('*');
  console.log("Error:", error);
  console.log("Admin Users:", data);
}

testAdminUsers();
