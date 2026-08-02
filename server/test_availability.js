require('dotenv').config({path: './.env'});
const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);

function toMin(t) {
  const [h, m] = t.split(':').map(Number);
  return h * 60 + m;
}

async function runTest() {
  const reqTenantId = '11111111-1111-1111-1111-111111111111';
  const professionalId = 1;
  const date = '2026-08-03';
  
  // existing booking at 10:00 for 60m
  const occupiedRanges = [
    { start: 600, end: 660 } // 10:00 to 11:00
  ];
  
  const openMin = toMin('09:00');
  const closeMin = toMin('19:00');
  const duration = 60; // 60 min service
  const slotInterval = 30;

  const allSlots = [];
  for (let t = openMin; t + duration <= closeMin; t += slotInterval) {
    const h = Math.floor(t / 60).toString().padStart(2, '0');
    const m = (t % 60).toString().padStart(2, '0');
    allSlots.push(`${h}:${m}`);
  }

  const slots = allSlots.map(time => {
    const slotStart = toMin(time);
    const slotEnd = slotStart + duration;

    const hasConflict = occupiedRanges.some(
      range => slotStart < range.end && slotEnd > range.start
    );

    return { time, available: !hasConflict };
  });

  console.log('Slots:', slots);
}

runTest();
