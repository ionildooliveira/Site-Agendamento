const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { getDB } = require('../database/db');
const { JWT_SECRET, JWT_EXPIRES, authenticateAdmin } = require('../middleware/auth');
const { sendRecoveryEmail } = require('../utils/email');

const loginHandler = async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: 'Email e senha são obrigatórios' });
  }

  const supabase = getDB();
  const { data: admin, error } = await supabase
    .from('admin_users')
    .select('*, companies(is_active)')
    .eq('email', email.toLowerCase().trim())
    .single();

  if (error || !admin || !bcrypt.compareSync(password, admin.password_hash)) {
    return res.status(401).json({ error: 'E-mail ou senha incorretos' });
  }

  const requestedTenantId = req.headers['x-tenant-id'];
  if (requestedTenantId && String(admin.company_id) !== String(requestedTenantId)) {
    return res.status(403).json({ error: 'Este usuário não pertence a esta empresa.' });
  }

  // Check if company is active
  if (admin.companies && admin.companies.is_active === false) {
    return res.status(403).json({ error: 'Acesso negado. Esta empresa está temporariamente bloqueada.' });
  }

  const token = jwt.sign(
    { id: admin.id, email: admin.email, name: admin.name, company_id: admin.company_id },
    JWT_SECRET,
    { expiresIn: JWT_EXPIRES }
  );

  res.json({
    token,
    admin: { id: admin.id, name: admin.name, email: admin.email, company_id: admin.company_id },
  });
};

const updateCredentialsHandler = async (req, res) => {
  const { currentPassword, newEmail, newPassword } = req.body;
  const adminId = req.admin.id;

  if (!currentPassword) {
    return res.status(400).json({ error: 'A senha atual é obrigatória para realizar alterações.' });
  }

  const supabase = getDB();
  
  // Find current admin to check password
  const { data: admin, error: findError } = await supabase
    .from('admin_users')
    .select('*')
    .eq('id', adminId)
    .single();

  if (findError || !admin || !bcrypt.compareSync(currentPassword, admin.password_hash)) {
    return res.status(401).json({ error: 'Senha atual incorreta.' });
  }

  const updatePayload = {};

  if (newEmail) {
    // Check if new email is already in use by another admin
    if (newEmail.toLowerCase().trim() !== admin.email) {
      const { data: existingAdmin } = await supabase
        .from('admin_users')
        .select('id')
        .eq('email', newEmail.toLowerCase().trim())
        .single();
      
      if (existingAdmin) {
        return res.status(409).json({ error: 'Este e-mail já está em uso.' });
      }
      updatePayload.email = newEmail.toLowerCase().trim();
    }
  }

  if (newPassword) {
    if (newPassword.length < 6) {
      return res.status(400).json({ error: 'A nova senha deve ter pelo menos 6 caracteres.' });
    }
    const salt = await bcrypt.genSalt(10);
    updatePayload.password_hash = await bcrypt.hash(newPassword, salt);
  }

  if (Object.keys(updatePayload).length > 0) {
    const { error: updateError } = await supabase
      .from('admin_users')
      .update(updatePayload)
      .eq('id', adminId);

    if (updateError) {
      return res.status(500).json({ error: 'Erro ao atualizar credenciais.' });
    }
  }

  res.json({ success: true, message: 'Credenciais atualizadas com sucesso. Por favor, faça login novamente.' });
};

const recoverPasswordHandler = async (req, res) => {
  const { email } = req.body;
  const tenantId = req.headers['x-tenant-id'];

  if (!email) {
    return res.status(400).json({ error: 'Email é obrigatório' });
  }

  const supabase = getDB();
  let query = supabase.from('admin_users').select('*').eq('email', email.toLowerCase().trim());
  
  if (tenantId) {
    query = query.eq('company_id', tenantId);
  }
  
  const { data: admin, error } = await query.single();

  if (error || !admin) {
    return res.status(404).json({ error: 'E-mail não encontrado em nossa base de dados.' });
  }

  const token = jwt.sign(
    { reset_password_admin_id: admin.id },
    JWT_SECRET,
    { expiresIn: '15m' }
  );

  const clientUrl = process.env.CLIENT_URL || 'http://localhost:5173';
  const resetLink = `${clientUrl}/admin/reset-password?token=${token}`;

  // Envia o e-mail real
  const emailSent = await sendRecoveryEmail(admin.email, resetLink);

  if (!emailSent) {
    return res.status(500).json({ error: 'Erro ao tentar enviar o e-mail de recuperação. Tente novamente mais tarde.' });
  }

  res.json({ message: 'Se o e-mail existir em nossa base, um link de recuperação será enviado.' });
};

const resetPasswordHandler = async (req, res) => {
  const { token, newPassword } = req.body;
  
  if (!token || !newPassword) {
    return res.status(400).json({ error: 'Token e nova senha são obrigatórios' });
  }

  if (newPassword.length < 6) {
    return res.status(400).json({ error: 'A nova senha deve ter pelo menos 6 caracteres.' });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    const adminId = decoded.reset_password_admin_id;

    if (!adminId) {
      return res.status(400).json({ error: 'Token inválido' });
    }

    const salt = await bcrypt.genSalt(10);
    const password_hash = await bcrypt.hash(newPassword, salt);

    const supabase = getDB();
    const { error: updateError } = await supabase
      .from('admin_users')
      .update({ password_hash })
      .eq('id', adminId);

    if (updateError) {
      return res.status(500).json({ error: 'Erro ao atualizar a senha no banco de dados.' });
    }

    res.json({ success: true, message: 'Senha redefinida com sucesso!' });
  } catch (err) {
    return res.status(400).json({ error: 'Token inválido ou expirado. Solicite a recuperação novamente.' });
  }
};

router.post('/login', loginHandler);
router.post('/admin/login', loginHandler);
router.post('/admin/recover-password', recoverPasswordHandler);
router.post('/admin/reset-password', resetPasswordHandler);
router.put('/admin/credentials', authenticateAdmin, updateCredentialsHandler);

module.exports = router;
