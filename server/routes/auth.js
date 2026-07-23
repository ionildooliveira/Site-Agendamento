const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { getDB } = require('../database/db');
const { JWT_SECRET, JWT_EXPIRES, authenticateAdmin } = require('../middleware/auth');

const loginHandler = async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: 'Email e senha são obrigatórios' });
  }

  const supabase = getDB();
  const { data: admin, error } = await supabase
    .from('admin_users')
    .select('*')
    .eq('email', email.toLowerCase().trim())
    .single();

  if (error || !admin || !bcrypt.compareSync(password, admin.password_hash)) {
    return res.status(401).json({ error: 'E-mail ou senha incorretos' });
  }

  const token = jwt.sign(
    { id: admin.id, email: admin.email, name: admin.name },
    JWT_SECRET,
    { expiresIn: JWT_EXPIRES }
  );

  res.json({
    token,
    admin: { id: admin.id, name: admin.name, email: admin.email },
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

router.post('/login', loginHandler);
router.post('/admin/login', loginHandler);
router.put('/admin/credentials', authenticateAdmin, updateCredentialsHandler);

module.exports = router;
