const express = require('express');
const router = express.Router();
const { getDB } = require('../database/db');
const { authenticateAdmin } = require('../middleware/auth');
const { setTenantId } = require('../middleware/tenant');

// GET /api/settings
router.get('/', setTenantId, async (req, res) => {
  const supabase = getDB();
  const { data: settings } = await supabase.from('settings').select('*').eq('company_id', req.tenantId).single();
  
  if (!settings) {
    return res.json({
      working_hours: {
        "0": null,
        "1": { "open": "09:00", "close": "19:00" },
        "2": { "open": "09:00", "close": "19:00" },
        "3": { "open": "09:00", "close": "19:00" },
        "4": { "open": "09:00", "close": "19:00" },
        "5": { "open": "09:00", "close": "19:00" },
        "6": { "open": "09:00", "close": "17:00" }
      },
      slot_interval: 30
    });
  }
  
  res.json({
    ...settings,
    working_hours: typeof settings.working_hours === 'string' ? JSON.parse(settings.working_hours) : settings.working_hours,
  });
});

// PUT /api/settings (admin)
router.put('/', authenticateAdmin, setTenantId, async (req, res) => {
  const { working_hours, slot_interval } = req.body;
  const supabase = getDB();
  
  const { data: existing } = await supabase.from('settings').select('id').eq('company_id', req.tenantId).single();
  
  if (existing) {
    await supabase.from('settings')
      .update({ 
        working_hours: working_hours, // Supabase handles JSONB
        slot_interval: slot_interval || 30 
      })
      .eq('company_id', req.tenantId);
  } else {
    await supabase.from('settings')
      .insert({
        id: Date.now(),
        company_id: req.tenantId,
        working_hours: working_hours,
        slot_interval: slot_interval || 30
      });
  }
    
  res.json({ success: true });
});

// GET /api/settings/salon-data
router.get('/salon-data', setTenantId, async (req, res) => {
  const supabase = getDB();
  const { data } = await supabase.from('settings').select('salon_data').eq('company_id', req.tenantId).single();
  
  if (!data || !data.salon_data) return res.json({});
  
  const salonData = typeof data.salon_data === 'string' ? JSON.parse(data.salon_data) : data.salon_data;
  res.json(salonData || {});
});

// PUT /api/settings/salon-data (admin)
router.put('/salon-data', authenticateAdmin, setTenantId, async (req, res) => {
  const { salonData } = req.body;
  const supabase = getDB();
  
  const { data: existing } = await supabase.from('settings').select('id').eq('company_id', req.tenantId).single();
  
  if (existing) {
    await supabase.from('settings')
      .update({ salon_data: salonData })
      .eq('company_id', req.tenantId);
  } else {
    await supabase.from('settings')
      .insert({
        id: Date.now(),
        company_id: req.tenantId,
        salon_data: salonData
      });
  }
    
  res.json({ success: true });
});


// GET /api/settings/blocked-dates
router.get('/blocked-dates', setTenantId, async (req, res) => {
  const supabase = getDB();
  const { professionalId } = req.query;
  
  let query = supabase.from('blocked_dates').select('*').eq('company_id', req.tenantId);
  
  if (professionalId) {
    query = query.or(`professional_id.is.null,professional_id.eq.${professionalId}`);
  }
  
  const { data: blocked_dates } = await query.order('date', { ascending: true });
  res.json(blocked_dates || []);
});

// POST /api/settings/blocked-dates (admin)
router.post('/blocked-dates', authenticateAdmin, setTenantId, async (req, res) => {
  const { date, reason, professionalId } = req.body;
  if (!date) return res.status(400).json({ error: 'Data é obrigatória' });
  
  const supabase = getDB();
  const { data: result } = await supabase.from('blocked_dates')
    .insert({
      date,
      reason: reason || null,
      professional_id: professionalId || null,
      company_id: req.tenantId
    })
    .select().single();
    
  res.status(201).json(result);
});

// DELETE /api/settings/blocked-dates/:id (admin)
router.delete('/blocked-dates/:id', authenticateAdmin, setTenantId, async (req, res) => {
  const supabase = getDB();
  await supabase.from('blocked_dates').delete().eq('id', req.params.id).eq('company_id', req.tenantId);
  res.json({ success: true });
});

module.exports = router;
