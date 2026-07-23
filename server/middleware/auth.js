const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'studio_beauty_super_secret_key_2024_change_in_production';
const JWT_EXPIRES = '24h';

function authenticateAdmin(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Token de acesso necessário' });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.admin = decoded;
    next();
  } catch {
    return res.status(403).json({ error: 'Token inválido ou expirado. Faça login novamente.' });
  }
}

module.exports = { authenticateAdmin, JWT_SECRET, JWT_EXPIRES };
