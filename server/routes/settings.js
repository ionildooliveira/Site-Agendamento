const express = require('express');
const router = express.Router();
const { getDB } = require('../database/db');
const { authenticateAdmin } = require('../middleware/auth');

// GET /api/settings
router.get('/', async (req, res) => {
  const supabase = getDB();
  const { data: settings } = await supabase.from('settings').select('*').eq('id', 1).single();
  
  if (!settings) return res.status(404).json({ error: 'Configurações não encontradas' });
  
  res.json({
    ...settings,
    working_hours: typeof settings.working_hours === 'string' ? JSON.parse(settings.working_hours) : settings.working_hours,
  });
});

// PUT /api/settings (admin)
router.put('/', authenticateAdmin, async (req, res) => {
  const { working_hours, slot_interval } = req.body;
  const supabase = getDB();
  
  await supabase.from('settings')
    .update({ 
      working_hours: working_hours, // Supabase handles JSONB
      slot_interval: slot_interval || 30 
    })
    .eq('id', 1);
    
  res.json({ success: true });
});

// GET /api/settings/salon-data
router.get('/salon-data', async (req, res) => {
  const supabase = getDB();
  const { data } = await supabase.from('settings').select('working_hours').eq('id', 2).single();
  
  if (!data) return res.json({});
  
  const salonData = typeof data.working_hours === 'string' ? JSON.parse(data.working_hours) : data.working_hours;
  res.json(salonData || {});
});

// PUT /api/settings/salon-data (admin)
router.put('/salon-data', authenticateAdmin, async (req, res) => {
  const { salonData } = req.body;
  const supabase = getDB();
  
  await supabase.from('settings').upsert({ 
    id: 2, 
    working_hours: salonData, 
    slot_interval: 30 
  });
    
  res.json({ success: true });
});


// GET /api/settings/blocked-dates
router.get('/blocked-dates', async (req, res) => {
  const supabase = getDB();
  const { professionalId } = req.query;
  
  let query = supabase.from('blocked_dates').select('*');
  
  if (professionalId) {
    query = query.or(`professional_id.is.null,professional_id.eq.${professionalId}`);
  }
  
  const { data: blocked_dates } = await query.order('date', { ascending: true });
  res.json(blocked_dates || []);
});

// POST /api/settings/blocked-dates (admin)
router.post('/blocked-dates', authenticateAdmin, async (req, res) => {
  const { date, reason, professionalId } = req.body;
  if (!date) return res.status(400).json({ error: 'Data é obrigatória' });
  
  const supabase = getDB();
  const { data: result } = await supabase.from('blocked_dates')
    .insert({
      date,
      reason: reason || null,
      professional_id: professionalId || null
    })
    .select().single();
    
  res.status(201).json(result);
});

// DELETE /api/settings/blocked-dates/:id (admin)
router.delete('/blocked-dates/:id', authenticateAdmin, async (req, res) => {
  const supabase = getDB();
  await supabase.from('blocked_dates').delete().eq('id', req.params.id);
  res.json({ success: true });
});

module.exports = router;
