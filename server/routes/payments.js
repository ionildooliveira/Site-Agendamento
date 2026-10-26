const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { getDB } = require('../database/db');
const { JWT_SECRET, JWT_EXPIRES, authenticateAdmin } = require('../middleware/auth');
const {
  isMercadoPagoConfigured,
  createPixPayment,
  createCardPayment,
  getPaymentStatus,
} = require('../utils/mercadopago');

// Armazena sessões pendentes de registro enquanto o PIX ou pagamento é processado
// chave: paymentId -> { userData, salonData, paymentData, status, createdAt, result }
const pendingRegistrations = new Map();

// Limpeza periódica de sessões pendentes com mais de 2 horas
setInterval(() => {
  const now = Date.now();
  for (const [key, item] of pendingRegistrations.entries()) {
    if (now - item.createdAt > 2 * 60 * 60 * 1000) {
      pendingRegistrations.delete(key);
    }
  }
}, 30 * 60 * 1000);

/**
 * Função utilitária que provisiona empresa, admin_user, settings e assinatura no Supabase
 */
async function provisionSalonAndUser({ userData, salonData, paymentData, paymentId }) {
  const supabase = getDB();
  const cleanSlug = salonData.slug.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
  const planPrice = Number(process.env.PLAN_MONTHLY_PRICE || 49.90);
  const planName = process.env.PLAN_NAME || 'Plano Profissional';

  // 1. Criar Empresa
  const { data: company, error: companyError } = await supabase
    .from('companies')
    .insert([{ name: salonData.name, slug: cleanSlug, is_active: true }])
    .select()
    .single();

  if (companyError) {
    if (companyError.code === '23505') {
      throw new Error('Esse link/slug já está em uso por outro salão.');
    }
    throw new Error('Erro ao criar empresa: ' + companyError.message);
  }

  // 2. Criar Usuário Administrador
  const salt = await bcrypt.genSalt(10);
  const passwordHash = await bcrypt.hash(userData.password, salt);

  const { data: adminUser, error: adminError } = await supabase
    .from('admin_users')
    .insert([
      {
        name: userData.name,
        email: userData.email.toLowerCase().trim(),
        password_hash: passwordHash,
        company_id: company.id,
      },
    ])
    .select('id, name, email, company_id')
    .single();

  if (adminError) {
    console.error('Erro ao cadastrar admin_user:', adminError);
  }

  // 3. Criar Configurações e Salvar Dados do Salão e Assinatura
  const nextBillingDate = new Date();
  nextBillingDate.setDate(nextBillingDate.getDate() + 30);

  const settingsPayload = {
    id: Date.now(),
    company_id: company.id,
    slot_interval: 30,
    salon_data: {
      name: salonData.name,
      slogan: salonData.slogan || 'Elegância, cuidado & sofisticação para sua beleza',
      description:
        salonData.description ||
        'Um espaço premium dedicado ao autocuidado e bem-estar. Oferecemos tratamentos de ponta com profissionais altamente especializados.',
      address: salonData.address || '',
      cityState: salonData.cityState || '',
      cep: salonData.cep || '',
      whatsapp: salonData.whatsapp || userData.phone || '',
      email: userData.email.toLowerCase().trim(),
      workingHoursText: salonData.workingHoursText || 'Segunda a Sexta: 09h às 19h | Sábado: 09h às 17h',
      heroImage:
        salonData.heroImage ||
        'https://images.unsplash.com/photo-1560066984-138dadb4c035?auto=format&fit=crop&w=1920&q=80',
      subscription: {
        status: 'active',
        plan: planName,
        amount: planPrice,
        billing_cycle: 'monthly',
        auto_recurring: true,
        payment_method: paymentData.method,
        mp_payment_id: String(paymentId),
        payment_date: new Date().toISOString(),
        next_billing_date: nextBillingDate.toISOString(),
      },
    },
    working_hours: salonData.workingHours || {
      0: null,
      1: { open: '09:00', close: '19:00' },
      2: { open: '09:00', close: '19:00' },
      3: { open: '09:00', close: '19:00' },
      4: { open: '09:00', close: '19:00' },
      5: { open: '09:00', close: '19:00' },
      6: { open: '09:00', close: '17:00' },
    },
  };

  const { error: settingsError } = await supabase.from('settings').insert([settingsPayload]);
  if (settingsError) {
    console.error('Erro ao salvar settings padrão:', settingsError.message);
  }

  // 4. Salvar na tabela subscriptions (se existir no banco)
  try {
    await supabase.from('subscriptions').insert([
      {
        company_id: company.id,
        user_email: userData.email.toLowerCase().trim(),
        user_name: userData.name,
        user_cpf: userData.cpf || '',
        user_phone: userData.phone || '',
        plan_name: planName,
        amount: planPrice,
        billing_cycle: 'monthly',
        payment_method: paymentData.method,
        payment_status: 'approved',
        auto_recurring: true,
        mp_payment_id: String(paymentId),
        current_period_start: new Date().toISOString(),
        current_period_end: nextBillingDate.toISOString(),
      },
    ]);
  } catch (subErr) {
    // Tolerante caso o script SQL de assinaturas ainda não tenha sido rodado
    console.log('Tabela subscriptions não encontrada ou ignorada:', subErr.message);
  }

  // 5. Gerar Token JWT de autenticação imediata
  const token = jwt.sign(
    {
      id: adminUser?.id || company.id,
      email: userData.email.toLowerCase().trim(),
      name: userData.name,
      company_id: company.id,
    },
    JWT_SECRET,
    { expiresIn: JWT_EXPIRES }
  );

  return {
    company,
    adminUser: {
      id: adminUser?.id || company.id,
      name: userData.name,
      email: userData.email.toLowerCase().trim(),
      company_id: company.id,
      company_slug: company.slug,
    },
    token,
  };
}

// ─── ROTA 1: Obter Configurações Públicas de Pagamento ─────────────────────────
router.get('/config', (req, res) => {
  res.json({
    isConfigured: isMercadoPagoConfigured(),
    publicKey: process.env.MERCADO_PAGO_PUBLIC_KEY || '',
    planPrice: Number(process.env.PLAN_MONTHLY_PRICE || 49.90),
    planName: process.env.PLAN_NAME || 'Plano Profissional',
    autoRecurring: true,
    isLocalDev: process.env.NODE_ENV !== 'production',
  });
});

// ─── ROTA 2: Processar Pagamento (Cartão, Débito ou PIX) ──────────────────────
router.post('/process', async (req, res) => {
  try {
    const { userData, salonData, paymentData } = req.body;

    if (!userData || !salonData || !paymentData) {
      return res.status(400).json({ error: 'Dados incompletos para processamento.' });
    }

    if (!userData.name || !userData.email || !userData.password) {
      return res.status(400).json({ error: 'Nome, e-mail e senha são obrigatórios.' });
    }

    if (!salonData.name || !salonData.slug) {
      return res.status(400).json({ error: 'Nome e link (slug) do salão são obrigatórios.' });
    }

    const cleanSlug = salonData.slug.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
    const supabase = getDB();

    // 1. Verificar se slug já existe
    const { data: existingCompany } = await supabase
      .from('companies')
      .select('id, name')
      .eq('slug', cleanSlug)
      .single();

    if (existingCompany) {
      return res.status(400).json({
        error: `O link "${cleanSlug}" já está em uso por outro salão. Por favor, escolha outro link.`,
      });
    }

    // 2. Verificar se o e-mail de admin já existe
    const { data: existingAdmin } = await supabase
      .from('admin_users')
      .select('id')
      .eq('email', userData.email.toLowerCase().trim())
      .single();

    if (existingAdmin) {
      return res.status(400).json({
        error: 'Este e-mail já possui uma conta cadastrada. Faça login ou use outro e-mail.',
      });
    }

    const planPrice = Number(process.env.PLAN_MONTHLY_PRICE || 49.90);
    const planName = process.env.PLAN_NAME || 'Plano Profissional';

    // ── Processamento PIX ─────────────────────────────────────────────────────
    if (paymentData.method === 'pix') {
      const pixResult = await createPixPayment({
        amount: planPrice,
        description: `Assinatura ${planName} - Salão ${salonData.name}`,
        payer: {
          email: userData.email,
          name: userData.name,
          cpf: userData.cpf,
        },
        metadata: {
          salon_slug: cleanSlug,
          salon_name: salonData.name,
        },
      });

      // Salva dados na sessão pendente aguardando confirmação do PIX
      pendingRegistrations.set(String(pixResult.id), {
        userData,
        salonData: { ...salonData, slug: cleanSlug },
        paymentData,
        paymentId: pixResult.id,
        status: 'pending',
        createdAt: Date.now(),
      });

      return res.json({
        status: 'pending',
        paymentId: pixResult.id,
        qr_code: pixResult.qr_code,
        qr_code_base64: pixResult.qr_code_base64,
        ticket_url: pixResult.ticket_url,
        isSimulated: pixResult.isSimulated,
        message: 'Código PIX gerado com sucesso. Aguardando pagamento...',
      });
    }

    // ── Processamento Cartão de Crédito ou Débito (Cobrança Automática) ───────
    const isDebit = paymentData.method === 'debit_card';
    const cardResult = await createCardPayment({
      amount: planPrice,
      description: `Assinatura Recorrente ${planName} - Salão ${salonData.name}`,
      token: paymentData.cardToken || paymentData.token,
      card: paymentData.card,
      paymentMethodId: paymentData.paymentMethodId || (isDebit ? 'debit_card' : 'credit_card'),
      installments: 1,
      payer: {
        email: userData.email,
        name: userData.name,
        cpf: userData.cpf,
      },
      autoRecurring: true,
      isDebit,
      metadata: {
        salon_slug: cleanSlug,
        salon_name: salonData.name,
      },
    });

    if (cardResult.status === 'approved' || cardResult.isSimulated) {
      // Provisiona imediatamente o salão e usuário
      const provisionData = await provisionSalonAndUser({
        userData,
        salonData: { ...salonData, slug: cleanSlug },
        paymentData: { ...paymentData, autoRecurring: true },
        paymentId: cardResult.id,
      });

      return res.json({
        status: 'approved',
        paymentId: cardResult.id,
        isSimulated: cardResult.isSimulated,
        message: 'Pagamento aprovado e salão criado com sucesso!',
        ...provisionData,
      });
    } else {
      return res.status(400).json({
        status: cardResult.status,
        error:
          cardResult.status_detail === 'cc_rejected_insufficient_amount'
            ? 'Saldo insuficiente no cartão.'
            : 'O pagamento não foi autorizado pelo banco emissor. Verifique os dados do cartão e tente novamente.',
      });
    }
  } catch (error) {
    console.error('Erro ao processar pagamento:', error);
    res.status(500).json({ error: error.message || 'Erro interno ao processar pagamento.' });
  }
});

// ─── ROTA 3: Consultar Status do Pagamento (Polling do PIX) ───────────────────
router.get('/status/:paymentId', async (req, res) => {
  try {
    const { paymentId } = req.params;
    const session = pendingRegistrations.get(String(paymentId));

    if (!session) {
      return res.status(404).json({ error: 'Sessão de pagamento não encontrada ou expirada.' });
    }

    // Se já foi provisionado anteriormente nessa mesma sessão
    if (session.status === 'approved' && session.provisionResult) {
      return res.json({
        status: 'approved',
        ...session.provisionResult,
      });
    }

    // Consulta se no Mercado Pago já foi aprovado
    const mpStatus = await getPaymentStatus(paymentId);
    if (mpStatus && mpStatus.status === 'approved') {
      session.status = 'approved';
      const provisionResult = await provisionSalonAndUser({
        userData: session.userData,
        salonData: session.salonData,
        paymentData: session.paymentData,
        paymentId,
      });
      session.provisionResult = provisionResult;

      return res.json({
        status: 'approved',
        ...provisionResult,
      });
    }

    return res.json({ status: session.status || 'pending' });
  } catch (error) {
    console.error('Erro ao consultar status:', error);
    res.status(500).json({ error: 'Erro ao consultar status do pagamento.' });
  }
});

// ─── ROTA 4: Simulação de Aprovação para Ambiente Local ────────────────────────
router.post('/simulate-approval', async (req, res) => {
  try {
    const { paymentId } = req.body;
    const session = pendingRegistrations.get(String(paymentId));

    if (!session) {
      return res.status(404).json({ error: 'Sessão de pagamento não encontrada.' });
    }

    if (session.status === 'approved' && session.provisionResult) {
      return res.json({
        status: 'approved',
        message: 'Pagamento já havia sido aprovado.',
        ...session.provisionResult,
      });
    }

    session.status = 'approved';
    const provisionResult = await provisionSalonAndUser({
      userData: session.userData,
      salonData: session.salonData,
      paymentData: session.paymentData,
      paymentId: paymentId || 'sim_' + Date.now(),
    });
    session.provisionResult = provisionResult;

    return res.json({
      status: 'approved',
      message: 'Pagamento simulado aprovado com sucesso em ambiente local!',
      ...provisionResult,
    });
  } catch (error) {
    console.error('Erro ao simular aprovação:', error);
    res.status(500).json({ error: error.message || 'Erro ao simular aprovação.' });
  }
});

// ─── ROTA 5: Webhook Oficial do Mercado Pago ──────────────────────────────────
router.post('/webhook', async (req, res) => {
  try {
    const { type, data } = req.body;
    console.log(`🔔 Webhook Mercado Pago recebido [${type}]:`, data?.id);

    if (type === 'payment' && data?.id) {
      const mpStatus = await getPaymentStatus(data.id);
      if (mpStatus && mpStatus.status === 'approved') {
        const session = pendingRegistrations.get(String(data.id));
        if (session && session.status !== 'approved') {
          session.status = 'approved';
          session.provisionResult = await provisionSalonAndUser({
            userData: session.userData,
            salonData: session.salonData,
            paymentData: session.paymentData,
            paymentId: data.id,
          });
        }
      }
    }

    res.status(200).send('OK');
  } catch (error) {
    console.error('Erro no processamento do webhook:', error);
    res.status(500).send('Error');
  }
});

// ─── ROTA 6: Obter Detalhes da Assinatura do Salão (Autenticado) ───────────────
router.get('/subscription', authenticateAdmin, async (req, res) => {
  try {
    const companyId = req.admin.company_id;
    const supabase = getDB();

    // Consulta settings para pegar dados da assinatura salvos em salon_data
    const { data: settings } = await supabase
      .from('settings')
      .select('salon_data')
      .eq('company_id', companyId)
      .single();

    const subscription = settings?.salon_data?.subscription || {
      status: 'active',
      plan: process.env.PLAN_NAME || 'Plano Profissional',
      amount: Number(process.env.PLAN_MONTHLY_PRICE || 49.90),
      billing_cycle: 'monthly',
      auto_recurring: true,
      payment_method: 'credit_card',
    };

    res.json(subscription);
  } catch (error) {
    console.error('Erro ao buscar assinatura:', error);
    res.status(500).json({ error: 'Erro ao buscar dados da assinatura.' });
  }
});

// ─── ROTA 7: Cancelar Assinatura do Salão (Autenticado) ──────────────────────
router.post('/subscription/cancel', authenticateAdmin, async (req, res) => {
  try {
    const companyId = req.admin.company_id;
    const { reason } = req.body;
    const supabase = getDB();

    // 1. Obter settings atuais
    const { data: settings } = await supabase
      .from('settings')
      .select('id, salon_data')
      .eq('company_id', companyId)
      .single();

    const currentSub = settings?.salon_data?.subscription || {};
    const updatedSub = {
      ...currentSub,
      status: 'cancelled',
      auto_recurring: false,
      cancelled_at: new Date().toISOString(),
      cancellation_reason: reason || 'Solicitado pelo administrador do salão',
    };

    const updatedSalonData = {
      ...(settings?.salon_data || {}),
      subscription: updatedSub,
    };

    // 2. Atualizar settings
    await supabase
      .from('settings')
      .update({ salon_data: updatedSalonData })
      .eq('company_id', companyId);

    // 3. Atualizar tabela subscriptions se existir
    try {
      await supabase
        .from('subscriptions')
        .update({
          payment_status: 'cancelled',
          auto_recurring: false,
          updated_at: new Date().toISOString(),
        })
        .eq('company_id', companyId);
    } catch (dbErr) {
      console.warn('Tabela subscriptions não atualizada:', dbErr.message);
    }

    return res.json({
      success: true,
      status: 'cancelled',
      message: 'Assinatura cancelada com sucesso. O salão permanecerá ativo até o fim do período já pago.',
      subscription: updatedSub,
    });
  } catch (error) {
    console.error('Erro ao cancelar assinatura:', error);
    res.status(500).json({ error: 'Erro ao processar o cancelamento da assinatura.' });
  }
});

// ─── ROTA 8: Reativar Assinatura do Salão (Autenticado) ─────────────────────
router.post('/subscription/reactivate', authenticateAdmin, async (req, res) => {
  try {
    const companyId = req.admin.company_id;
    const supabase = getDB();

    const { data: settings } = await supabase
      .from('settings')
      .select('id, salon_data')
      .eq('company_id', companyId)
      .single();

    const currentSub = settings?.salon_data?.subscription || {};
    const updatedSub = {
      ...currentSub,
      status: 'active',
      auto_recurring: true,
      reactivated_at: new Date().toISOString(),
      cancelled_at: null,
      cancellation_reason: null,
    };

    const updatedSalonData = {
      ...(settings?.salon_data || {}),
      subscription: updatedSub,
    };

    await supabase
      .from('settings')
      .update({ salon_data: updatedSalonData })
      .eq('company_id', companyId);

    try {
      await supabase
        .from('subscriptions')
        .update({
          payment_status: 'approved',
          auto_recurring: true,
          updated_at: new Date().toISOString(),
        })
        .eq('company_id', companyId);
    } catch (dbErr) {
      console.warn('Tabela subscriptions não atualizada:', dbErr.message);
    }

    return res.json({
      success: true,
      status: 'active',
      message: 'Renovação automática reativada com sucesso!',
      subscription: updatedSub,
    });
  } catch (error) {
    console.error('Erro ao reativar assinatura:', error);
    res.status(500).json({ error: 'Erro ao reativar renovação automática.' });
  }
});

module.exports = router;

