const { createClient } = require('@supabase/supabase-js');
const supabaseUrl = 'https://zxewxdtpazjutwfxpams.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inp4ZXd4ZHRwYXpqdXR3ZnhwYW1zIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4NDgyNTc4MCwiZXhwIjoyMTAwNDAxNzgwfQ.eXQ3o1S02_9Y7RWtGGU8iKq2C2A-DQ_PQjJAanvDy2g';
const supabase = createClient(supabaseUrl, supabaseKey);

async function fixSexta() {
  const { data } = await supabase.from('settings').select('working_hours').eq('id', 2).single();
  if (data && data.working_hours) {
    let salonData = typeof data.working_hours === 'string' ? JSON.parse(data.working_hours) : data.working_hours;
    if (salonData.workingHoursText && salonData.workingHoursText.includes('Sexo')) {
      salonData.workingHoursText = salonData.workingHoursText.replace(/Sexo/g, 'Sexta');
      const { error } = await supabase.from('settings').update({ working_hours: salonData }).eq('id', 2);
      if (!error) console.log('Fixed in database!');
    } else {
      console.log('No "Sexo" found in database, might be using local storage or fallback.');
    }
  }
}
fixSexta();
