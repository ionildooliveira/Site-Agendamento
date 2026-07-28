const express = require('express');
const router = express.Router();
const { getDB } = require('../database/db');

// Get company details by slug for public facing pages
router.get('/:slug', async (req, res) => {
  const { slug } = req.params;
  const supabase = getDB();

  const { data: company, error } = await supabase
    .from('companies')
    .select('id, name, slug')
    .eq('slug', slug)
    .single();

  if (error || !company) {
    return res.status(404).json({ error: 'Empresa não encontrada.' });
  }

  res.json(company);
});

module.exports = router;
