const express = require('express');
const router = express.Router();
const { getDB } = require('../database/db');
const { authenticateAdmin } = require('../middleware/auth');
const { setTenantId } = require('../middleware/tenant');

// GET /api/clients (protected)
router.get('/', authenticateAdmin, setTenantId, async (req, res) => {
  const supabase = getDB();
  const { search } = req.query;
  
  let query = supabase.from('clients').select('*').eq('company_id', req.tenantId);
  if (search) {
    query = query.or(`name.ilike.%${search}%,phone.ilike.%${search}%,email.ilike.%${search}%`);
  }
  
  const { data: clients } = await query.order('name', { ascending: true });
  const { data: bookings } = await supabase.from('bookings').select('client_id, booking_date').eq('company_id', req.tenantId).neq('status', 'cancelled');
  
  const bookingStats = {};
  (bookings || []).forEach(b => {
    if (!bookingStats[b.client_id]) {
      bookingStats[b.client_id] = { count: 0, last: b.booking_date };
    }
    bookingStats[b.client_id].count++;
    if (b.booking_date > bookingStats[b.client_id].last) {
      bookingStats[b.client_id].last = b.booking_date;
    }
  });

  const formattedClients = (clients || []).map(c => ({
    ...c,
    total_bookings: bookingStats[c.id]?.count || 0,
    last_booking: bookingStats[c.id]?.last || null
  }));

  res.json(formattedClients);
});

// POST /api/clients (public or admin) - creates or finds client
router.post('/', setTenantId, async (req, res) => {
  const { name, phone, email } = req.body;
  if (!name || !phone || !email) {
    return res.status(400).json({ error: 'Nome, telefone e email são obrigatórios' });
  }
  const supabase = getDB();
  
  const { data: existing } = await supabase.from('clients')
    .select('*').ilike('email', email.trim()).eq('company_id', req.tenantId).single();
    
  if (existing) {
    // Update name and phone if needed
    const { data: updated } = await supabase.from('clients')
      .update({ name, phone })
      .eq('id', existing.id)
      .select().single();
    return res.json(updated);
  }
  
  const { data: created } = await supabase.from('clients')
    .insert({ name, phone, email: email.toLowerCase().trim(), company_id: req.tenantId })
    .select().single();
    
  res.status(201).json(created);
});

module.exports = router;
