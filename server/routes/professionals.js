const express = require('express');
const router = express.Router();
const { getDB } = require('../database/db');
const { authenticateAdmin } = require('../middleware/auth');
const { setTenantId } = require('../middleware/tenant');

// GET /api/professionals
router.get('/', setTenantId, async (req, res) => {
  const supabase = getDB();
  const { active } = req.query;
  
  let query = supabase.from('professionals').select('*').eq('company_id', req.tenantId);
  if (active !== 'all') {
    query = query.eq('active', true);
  }
  
  const { data: professionals } = await query.order('name', { ascending: true });
  
  // Format jsonb specialties back to array if needed
  const formatted = (professionals || []).map(p => ({
    ...p,
    specialties: typeof p.specialties === 'string' ? JSON.parse(p.specialties) : (p.specialties || [])
  }));
  
  res.json(formatted);
});

// POST /api/professionals (admin)
router.post('/', authenticateAdmin, setTenantId, async (req, res) => {
  const { name, role, specialties } = req.body;
  if (!name || !role) return res.status(400).json({ error: 'Nome e cargo são obrigatórios' });
  
  const supabase = getDB();
  const { data: result } = await supabase.from('professionals')
    .insert({ name, role, specialties: specialties || [], company_id: req.tenantId })
    .select().single();
    
  res.status(201).json(result);
});

// PUT /api/professionals/:id (admin)
router.put('/:id', authenticateAdmin, setTenantId, async (req, res) => {
  const { name, role, specialties, active } = req.body;
  const supabase = getDB();
  
  const { data: pro } = await supabase.from('professionals').select('*').eq('id', req.params.id).eq('company_id', req.tenantId).single();
  if (!pro) return res.status(404).json({ error: 'Profissional não encontrado' });

  const updatePayload = {
    name: name ?? pro.name,
    role: role ?? pro.role,
    specialties: specialties !== undefined ? specialties : pro.specialties,
    active: active !== undefined ? active : pro.active
  };

  const { data: updated } = await supabase.from('professionals')
    .update(updatePayload)
    .eq('id', req.params.id)
    .eq('company_id', req.tenantId)
    .select().single();

  res.json(updated);
});

// DELETE /api/professionals/:id (admin) — soft delete
router.delete('/:id', authenticateAdmin, setTenantId, async (req, res) => {
  const supabase = getDB();
  await supabase.from('professionals').update({ active: false }).eq('id', req.params.id).eq('company_id', req.tenantId);
  res.json({ success: true });
});

module.exports = router;
