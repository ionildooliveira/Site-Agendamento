// Salon Settings Manager stored in localStorage
const STORAGE_KEY = 'studio_beauty_salon_settings';

const defaultSettings = {
  name: 'Studio Beauty',
  slogan: 'Elegância, cuidado & sofisticação para sua beleza',
  description: 'O Studio Beauty é um espaço premium dedicado ao autocuidado e bem-estar. Oferecemos tratamentos de ponta para cabelos, unhas e estética com profissionais altamente especializados.',
  address: 'Av. Paulista, 1500 - Bela Vista',
  cityState: 'São Paulo - SP',
  whatsapp: '5511999998888',
  email: 'contato@studiobeauty.com.br',
  workingHoursText: 'Seg a Sex: 09h às 19h | Sáb: 09h às 17h',
  heroImage: 'https://images.unsplash.com/photo-1560066984-138dadb4c035?auto=format&fit=crop&w=1920&q=80',
};

export function getSalonSettings() {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      return { ...defaultSettings, ...JSON.parse(stored) };
    }
  } catch (err) {
    console.error('Error reading salon settings from localStorage', err);
  }
  return defaultSettings;
}

export function saveSalonSettings(settings) {
  try {
    const current = getSalonSettings();
    const updated = { ...current, ...settings };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    window.dispatchEvent(new Event('salonSettingsUpdated'));
    return updated;
  } catch (err) {
    console.error('Error saving salon settings to localStorage', err);
    throw err;
  }
}

export function generateWorkingHoursText(workingHours) {
  if (!workingHours || typeof workingHours !== 'object') return '';

  const weekdaysOrder = ['1', '2', '3', '4', '5', '6', '0'];
  const dayShortNames = {
    '1': 'Seg',
    '2': 'Ter',
    '3': 'Qua',
    '4': 'Qui',
    '5': 'Sex',
    '6': 'Sáb',
    '0': 'Dom'
  };

  const formatTime = (timeStr) => {
    if (!timeStr) return '';
    const [h, m] = timeStr.split(':');
    if (!h) return timeStr;
    return m && m !== '00' ? `${h}h${m}` : `${h}h`;
  };

  const groups = [];
  let currentGroup = null;

  for (const key of weekdaysOrder) {
    const day = workingHours[key];
    const isOpen = day && day.open && day.close;
    const timeStr = isOpen ? `${formatTime(day.open)} às ${formatTime(day.close)}` : 'Fechado';

    if (currentGroup && currentGroup.timeStr === timeStr) {
      currentGroup.days.push(key);
    } else {
      if (currentGroup) groups.push(currentGroup);
      currentGroup = { timeStr, days: [key] };
    }
  }
  if (currentGroup) groups.push(currentGroup);

  const openGroups = groups.filter(g => g.timeStr !== 'Fechado');
  if (openGroups.length === 0) return 'Fechado';

  return openGroups.map(g => {
    const firstDay = dayShortNames[g.days[0]];
    const lastDay = dayShortNames[g.days[g.days.length - 1]];
    const label = g.days.length > 1 ? `${firstDay} a ${lastDay}` : firstDay;
    return `${label}: ${g.timeStr}`;
  }).join(' | ');
}

