const express = require('express');
const router = express.Router();
const { getDB } = require('../database/db');
const { authenticateAdmin } = require('../middleware/auth');

// GET /api/services
router.get('/', async (req, res) => {
  const supabase = getDB();
  const { active } = req.query;
  
  let query = supabase.from('services').select('*');
  if (active !== 'all') {
    query = query.eq('active', true);
  }
  
  const { data: services } = await query
    .order('category', { ascending: true })
    .order('name', { ascending: true });
    
  res.json(services || []);
});

// POST /api/services (admin)
router.post('/', authenticateAdmin, async (req, res) => {
  const { name, description, price, duration_minutes, category } = req.body;
  if (!name || !price || !duration_minutes) {
    return res.status(400).json({ error: 'Nome, preço e duração são obrigatórios' });
  }
  
  const supabase = getDB();
  const { data: result } = await supabase.from('services')
    .insert({
      name,
      description: description || null,
      price,
      duration_minutes,
      category: category || null
    })
    .select().single();
    
  res.status(201).json(result);
});

// PUT /api/services/:id (admin)
router.put('/:id', authenticateAdmin, async (req, res) => {
  const { name, description, price, duration_minutes, category, active } = req.body;
  const supabase = getDB();
  
  const { data: svc } = await supabase.from('services').select('*').eq('id', req.params.id).single();
  if (!svc) return res.status(404).json({ error: 'Serviço não encontrado' });

  const updatePayload = {
    name: name ?? svc.name,
    description: description ?? svc.description,
    price: price ?? svc.price,
    duration_minutes: duration_minutes ?? svc.duration_minutes,
    category: category ?? svc.category,
    active: active !== undefined ? active : svc.active
  };

  const { data: updated } = await supabase.from('services')
    .update(updatePayload)
    .eq('id', req.params.id)
    .select().single();

  res.json(updated);
});

// DELETE /api/services/:id (admin) — soft delete
router.delete('/:id', authenticateAdmin, async (req, res) => {
  const supabase = getDB();
  await supabase.from('services').update({ active: false }).eq('id', req.params.id);
  res.json({ success: true });
});

module.exports = router;
