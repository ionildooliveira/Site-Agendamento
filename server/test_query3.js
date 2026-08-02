require('dotenv').config();
const { getDB } = require('./database/db');

async function runTest() {
  const supabase = getDB();
  const reqTenantId = '11111111-1111-1111-1111-111111111111';
  
  // 1. Fetch a professional
  const { data: pros } = await supabase.from('professionals').select('*').limit(1);
  const pro = pros[0];

  // 2. Fetch two different services
  const { data: services } = await supabase.from('services').select('*').limit(2);
  const service1 = services[0];
  const service2 = services[1];

  // 3. Create a mock client
  const { data: client } = await supabase.from('clients').select('*').limit(1);

  const date = '2026-08-03';
  const startTime = '09:00';
  const endTime1 = '10:00'; // assume 60 mins
  const endTime2 = '11:00'; // assume 120 mins

  console.log('--- Inserting Booking 1 ---');
  const { data: b1, error: e1 } = await supabase.from('bookings').insert({
    client_id: client[0].id,
    professional_id: pro.id,
    service_id: service1.id,
    booking_date: date,
    start_time: startTime,
    end_time: endTime1,
    status: 'confirmed',
    company_id: reqTenantId
  }).select();
  console.log('B1:', b1, 'Err1:', e1);

  console.log('\n--- Checking Conflicts for Booking 2 ---');
  const { data: conflicts } = await supabase.from('bookings')
    .select('id, start_time, end_time, service_id, status')
    .eq('professional_id', pro.id)
    .eq('booking_date', date)
    .eq('company_id', reqTenantId)
    .neq('status', 'cancelled')
    .lt('start_time', endTime2)
    .gt('end_time', startTime);

  console.log('Conflicts found:', conflicts);

  if (!conflicts || conflicts.length === 0) {
    console.log('NO CONFLICT DETECTED! IT WOULD ALLOW DOUBLE BOOKING!');
  } else {
    console.log('CONFLICT DETECTED! DOUBLE BOOKING PREVENTED!');
  }

  // Cleanup
  if (b1 && b1.length) {
    await supabase.from('bookings').delete().eq('id', b1[0].id);
  }
}

runTest();
