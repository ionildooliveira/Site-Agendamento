require('dotenv').config({ path: require('path').join(__dirname, '.env') });
const { getDB } = require('./database/db');

const supabase = getDB();

async function populateData() {
  const salonData = {
    name: 'Studio Beauty (Teste Sincronizado)',
    slogan: 'Elegância, cuidado & sofisticação para sua beleza',
    description: 'O Studio Beauty é um espaço premium...',
    cep: '01310-200',
    address: 'Av. Paulista, 1500 - Bela Vista',
    cityState: 'São Paulo - SP',
    whatsapp: '5511999998888',
    email: 'contato@studiobeauty.com.br',
    workingHoursText: 'Seg a Sex: 09h às 19h | Sáb: 09h às 17h',
    heroImage: 'https://images.unsplash.com/photo-1560066984-138dadb4c035?auto=format&fit=crop&w=1920&q=80'
  };

  const { error } = await supabase.from('settings').upsert({ 
    id: 2, 
    working_hours: salonData, 
    slot_interval: 30 
  });
  if (error) {
    console.error('Erro ao atualizar DB:', error);
  } else {
    console.log('Banco de dados atualizado com os dados de teste com sucesso!');
  }
}
populateData();
