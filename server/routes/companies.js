const express = require('express');
const router = express.Router();
const { getDB } = require('../database/db');
const bcrypt = require('bcryptjs');

// Middleware to protect super admin routes
const authenticateSuperAdmin = (req, res, next) => {
  const password = req.headers['x-super-admin-password'];
  if (!password || password !== process.env.SUPER_ADMIN_PASSWORD) {
    return res.status(401).json({ error: 'Acesso negado. Senha do Super Admin inválida.' });
  }
  next();
};

// Create a new company (Protected by Super Admin Password)
router.post('/create', authenticateSuperAdmin, async (req, res) => {
  const { companyName, companySlug, adminEmail, adminPassword } = req.body;
  const supabase = getDB();

  if (!companyName || !companySlug || !adminEmail || !adminPassword) {
    return res.status(400).json({ error: 'Todos os campos são obrigatórios.' });
  }

  try {
    // 1. Insert company
    const { data: company, error: companyError } = await supabase
      .from('companies')
      .insert([{ name: companyName, slug: companySlug }])
      .select()
      .single();

    if (companyError) {
      if (companyError.code === '23505') {
        return res.status(400).json({ error: 'Esse link/slug ou nome já está em uso.' });
      }
      return res.status(500).json({ error: 'Erro ao criar empresa: ' + companyError.message });
    }

    // 2. Insert admin
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(adminPassword, salt);
    
    const { error: adminError } = await supabase
      .from('admin_users')
      .insert([
        {
          name: `Admin - ${companyName}`,
          email: adminEmail,
          password_hash: passwordHash,
          company_id: company.id
        }
      ]);
    
    if (adminError) {
      console.error('Erro ao criar usuário admin:', adminError.message);
      // Rollback is manual here if needed, but for simplicity we continue
    }

    // 3. Default settings
    const newSettingsId = Date.now();
    const { error: settingsError } = await supabase
      .from('settings')
      .insert([
        {
          id: newSettingsId,
          company_id: company.id,
          slot_interval: 30,
          working_hours: {
            "0": null,
            "1": { "open": "09:00", "close": "19:00" },
            "2": { "open": "09:00", "close": "19:00" },
            "3": { "open": "09:00", "close": "19:00" },
            "4": { "open": "09:00", "close": "19:00" },
            "5": { "open": "09:00", "close": "19:00" },
            "6": { "open": "09:00", "close": "17:00" }
          }
        }
      ]);

    if (settingsError) {
      console.error('Erro ao criar configurações padrão:', settingsError.message);
    }

    res.json({ success: true, message: 'Empresa criada com sucesso!', company });

  } catch (error) {
    console.error('Erro geral ao criar empresa:', error);
    res.status(500).json({ error: 'Erro interno no servidor.' });
  }
});

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
