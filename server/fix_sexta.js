require('dotenv').config({ path: require('path').join(__dirname, '.env') });
const { getDB } = require('./database/db');

const supabase = getDB();

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
