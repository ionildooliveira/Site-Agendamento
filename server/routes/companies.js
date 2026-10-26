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

// Verify super admin password
router.post('/verify-super-admin', authenticateSuperAdmin, (req, res) => {
  res.json({ success: true, message: 'Senha válida' });
});

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
          salon_data: {
            name: companyName,
            slogan: 'Elegância, cuidado & sofisticação para sua beleza',
            description: 'Um espaço premium dedicado ao autocuidado e bem-estar. Oferecemos tratamentos de ponta com profissionais altamente especializados.',
            address: 'Av. Principal, 1000 - Centro',
            cityState: 'São Paulo - SP',
            whatsapp: '',
            email: adminEmail,
            workingHoursText: 'Seg a Sexta: 09h às 19h | Sáb: 09h às 17h',
            heroImage: 'https://images.unsplash.com/photo-1560066984-138dadb4c035?auto=format&fit=crop&w=1920&q=80',
          },
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

// Check if a company slug is available
router.get('/check-slug/:slug', async (req, res) => {
  const { slug } = req.params;
  const cleanSlug = slug.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
  
  if (!cleanSlug || cleanSlug.length < 2) {
    return res.json({ available: false, message: 'Link muito curto (mínimo 2 caracteres).' });
  }

  // Reserved keywords
  const reserved = ['admin', 'super-admin', 'api', 'cadastro', 'assinar', 'onboarding', 'login', 'servicos', 'agendar'];
  if (reserved.includes(cleanSlug)) {
    return res.json({ available: false, message: 'Este link é reservado pelo sistema.' });
  }

  const supabase = getDB();
  const { data: existing } = await supabase
    .from('companies')
    .select('id, name')
    .eq('slug', cleanSlug)
    .single();

  if (existing) {
    return res.json({ available: false, message: 'Este link já está em uso por outro salão.' });
  }

  return res.json({ available: true, slug: cleanSlug });
});

// Get company details by slug for public facing pages
router.get('/:slug', async (req, res) => {
  const { slug } = req.params;
  const supabase = getDB();

  const { data: company, error } = await supabase
    .from('companies')
    .select('id, name, slug, is_active')
    .eq('slug', slug)
    .single();

  if (error || !company) {
    return res.status(404).json({ error: 'Empresa não encontrada.' });
  }

  // 1. Verificar se a assinatura expirou automaticamente
  try {
    const { data: settings } = await supabase
      .from('settings')
      .select('salon_data')
      .eq('company_id', company.id)
      .single();

    const sub = settings?.salon_data?.subscription;
    if (sub && sub.status === 'cancelled' && sub.next_billing_date) {
      const expiry = new Date(sub.next_billing_date).getTime();
      if (Date.now() > expiry) {
        // O prazo de tolerância terminou! Bloqueia a empresa no banco
        if (company.is_active !== false) {
          await supabase.from('companies').update({ is_active: false }).eq('id', company.id);
          company.is_active = false;
        }
        return res.status(403).json({
          error: 'A assinatura deste salão expirou. Renove seu plano para reativar o acesso aos agendamentos.',
          blocked: true,
          expired: true,
          slug: company.slug
        });
      }
    }
  } catch (subCheckErr) {
    console.warn('Erro ao verificar expiração de assinatura:', subCheckErr.message);
  }

  if (company.is_active === false) {
    return res.status(403).json({
      error: 'Esta empresa está temporariamente bloqueada.',
      blocked: true,
      slug: company.slug
    });
  }

  res.json(company);
});

// GET all companies (Protected by Super Admin Password)
router.get('/', authenticateSuperAdmin, async (req, res) => {
  const supabase = getDB();
  const { data: companies, error } = await supabase
    .from('companies')
    .select('id, name, slug, created_at, is_active')
    .order('created_at', { ascending: false });

  if (error) {
    return res.status(500).json({ error: 'Erro ao buscar empresas.' });
  }

  // Buscar configurações de cada empresa para anexar o status da assinatura
  try {
    const { data: allSettings } = await supabase
      .from('settings')
      .select('company_id, salon_data');

    const settingsMap = new Map();
    (allSettings || []).forEach(s => settingsMap.set(s.company_id, s.salon_data?.subscription));

    const enrichedCompanies = (companies || []).map(comp => {
      const sub = settingsMap.get(comp.id);
      let subStatus = 'active';
      let isExpired = false;

      if (sub) {
        if (sub.status === 'cancelled') {
          const expiry = sub.next_billing_date ? new Date(sub.next_billing_date).getTime() : 0;
          if (Date.now() > expiry) {
            subStatus = 'expired';
            isExpired = true;
          } else {
            subStatus = 'cancelled_grace_period';
          }
        } else {
          subStatus = sub.status || 'active';
        }
      }

      return {
        ...comp,
        subscription: sub || null,
        subStatus,
        isExpired
      };
    });

    return res.json(enrichedCompanies);
  } catch {
    res.json(companies);
  }
});

// PUT update company (Protected)
router.put('/:id', authenticateSuperAdmin, async (req, res) => {
  const { id } = req.params;
  const { name, slug, monthlyPrice } = req.body;
  const supabase = getDB();

  if (!name || !slug) return res.status(400).json({ error: 'Nome e slug são obrigatórios.' });

  const { data, error } = await supabase
    .from('companies')
    .update({ name, slug })
    .eq('id', id)
    .select()
    .single();

  if (error) {
    if (error.code === '23505') {
      return res.status(400).json({ error: 'Esse link/slug já está em uso.' });
    }
    return res.status(500).json({ error: 'Erro ao atualizar empresa.' });
  }

  // Atualizar valor da mensalidade individual se informado
  if (monthlyPrice !== undefined && monthlyPrice !== null && !isNaN(Number(monthlyPrice))) {
    try {
      const { data: settings } = await supabase
        .from('settings')
        .select('salon_data')
        .eq('company_id', id)
        .single();

      if (settings?.salon_data) {
        const currentSub = settings.salon_data.subscription || {};
        const updatedSalonData = {
          ...settings.salon_data,
          subscription: {
            ...currentSub,
            amount: Number(monthlyPrice),
          },
        };
        await supabase
          .from('settings')
          .update({ salon_data: updatedSalonData })
          .eq('company_id', id);
      }

      await supabase
        .from('subscriptions')
        .update({ amount: Number(monthlyPrice) })
        .eq('company_id', id);
    } catch (priceErr) {
      console.warn('Erro ao atualizar preço da assinatura:', priceErr.message);
    }
  }
  
  res.json({ success: true, company: data });
});

// PATCH update company status (Protected)
router.patch('/:id/status', authenticateSuperAdmin, async (req, res) => {
  const { id } = req.params;
  const { is_active } = req.body;
  const supabase = getDB();

  const { data, error } = await supabase
    .from('companies')
    .update({ is_active })
    .eq('id', id)
    .select()
    .single();

  if (error) return res.status(500).json({ error: 'Erro ao atualizar status.' });
  res.json({ success: true, company: data });
});

// DELETE company (Protected)
router.delete('/:id', authenticateSuperAdmin, async (req, res) => {
  const { id } = req.params;
  const supabase = getDB();

  const { error } = await supabase
    .from('companies')
    .delete()
    .eq('id', id);

  if (error) return res.status(500).json({ error: 'Erro ao deletar empresa. Certifique-se de que não existem dados dependentes sem CASCADE.' });
  
  res.json({ success: true });
});

module.exports = router;
