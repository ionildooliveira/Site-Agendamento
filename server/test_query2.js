require('dotenv').config();
const { getDB } = require('./database/db');

async function runTest() {
  const supabase = getDB();
  const reqTenantId = '11111111-1111-1111-1111-111111111111';
  
  // Just query one booking to check the time format
  const { data: b } = await supabase.from('bookings').select('*').limit(1);
  console.log('Sample booking:', b);

  const startTime = '09:00';
  const endTime = '11:00';

  const { data: conflicts, error: err2 } = await supabase.from('bookings')
    .select('id, start_time, end_time')
    .lt('start_time', endTime)
    .gt('end_time', startTime);

  console.log('Conflicts with 09:00-11:00:', conflicts);
  console.log('Error 2:', err2);
}

runTest();
