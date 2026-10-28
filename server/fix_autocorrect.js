require('dotenv').config({ path: require('path').join(__dirname, '.env') });
const { getDB } = require('./database/db');

const supabase = getDB();

async function fixAutocorrect() {
  const { data } = await supabase.from('settings').select('working_hours').eq('id', 2).single();
  if (data && data.working_hours) {
    let salonData = typeof data.working_hours === 'string' ? JSON.parse(data.working_hours) : data.working_hours;
    if (salonData.workingHoursText) {
      console.log('Current Text:', salonData.workingHoursText);
      
      let newText = salonData.workingHoursText;
      newText = newText.replace(/Segmento/gi, 'Segunda');
      newText = newText.replace(/Sexo/gi, 'Sexta');
      newText = newText.replace(/Sex/gi, 'Sexta'); // Just in case
      newText = newText.replace(/Sextaa/gi, 'Sexta'); // Fix accidental double 'a'
      newText = newText.replace(/Seg/gi, 'Segunda'); // Just in case
      newText = newText.replace(/Segundaunda/gi, 'Segunda');
      
      salonData.workingHoursText = newText;
      console.log('Fixed Text:', salonData.workingHoursText);

      const { error } = await supabase.from('settings').update({ working_hours: salonData }).eq('id', 2);
      if (!error) console.log('Fixed in database successfully!');
      else console.error('Error updating DB:', error);
    } else {
      console.log('No workingHoursText found in database.');
    }
  }
}
fixAutocorrect();
