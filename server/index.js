require('dotenv').config();
const express = require('express');
const cors = require('cors');

// Supabase migration: removed SQLite schema/seed requires

const authRoutes = require('./routes/auth');
const servicesRoutes = require('./routes/services');
const professionalsRoutes = require('./routes/professionals');
const availabilityRoutes = require('./routes/availability');
const bookingsRoutes = require('./routes/bookings');
const clientsRoutes = require('./routes/clients');
const adminRoutes = require('./routes/admin');
const settingsRoutes = require('./routes/settings');
const companiesRoutes = require('./routes/companies');
const testimonialsRoutes = require('./routes/testimonials');
const { authenticateAdmin } = require('./middleware/auth');
const { getDB } = require('./database/db');

const app = express();
const PORT = process.env.PORT || 3001;

// ─── Middleware ───────────────────────────────────────────────────────────────
app.use(cors({
  origin: [
    process.env.CLIENT_URL || 'http://localhost:5173',
    'http://localhost:5174',
    'http://localhost:3000',
  ],
  credentials: true,
}));
app.use(express.json());

// ─── Database ─────────────────────────────────────────────────────────────────
// Supabase é inicializado sob demanda, sem necessidade de esquema/seeding síncrono aqui.

// ─── Routes ──────────────────────────────────────────────────────────────────
app.use('/api/auth', authRoutes);
app.use('/api/services', servicesRoutes);
app.use('/api/professionals', professionalsRoutes);
app.use('/api/availability', availabilityRoutes);
app.use('/api/bookings', bookingsRoutes);
app.use('/api/appointments', bookingsRoutes);
app.use('/api/clients', clientsRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/settings', settingsRoutes);
app.use('/api/companies', companiesRoutes);
app.use('/api/testimonials', testimonialsRoutes);

// Direct spec aliases
app.get('/api/dashboard', authenticateAdmin, (req, res, next) => {
  req.url = '/dashboard';
  adminRoutes(req, res, next);
});

app.get('/api/business-hours', async (req, res) => {
  const supabase = getDB();
  const { data: settings, error } = await supabase.from('settings').select('*').eq('id', 1).single();
  if (error || !settings) return res.json({});
  res.json(settings.working_hours || {});
});

app.put('/api/business-hours', authenticateAdmin, async (req, res) => {
  const { working_hours } = req.body;
  const supabase = getDB();
  const { error } = await supabase.from('settings').update({ working_hours }).eq('id', 1);
  if (error) return res.status(500).json({ error: 'Erro ao atualizar horário de funcionamento' });
  res.json({ success: true });
});

app.get('/api/blocked-dates', (req, res, next) => {
  req.url = '/blocked-dates';
  settingsRoutes(req, res, next);
});

app.post('/api/blocked-dates', authenticateAdmin, (req, res, next) => {
  req.url = '/blocked-dates';
  settingsRoutes(req, res, next);
});

app.delete('/api/blocked-dates/:id', authenticateAdmin, (req, res, next) => {
  req.url = `/blocked-dates/${req.params.id}`;
  settingsRoutes(req, res, next);
});

// ─── Health check ────────────────────────────────────────────────────────────
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', service: 'Studio Beauty API', timestamp: new Date().toISOString() });
});

// ─── 404 handler ─────────────────────────────────────────────────────────────
app.use((_req, res) => {
  res.status(404).json({ error: 'Rota não encontrada' });
});

// ─── Error handler ────────────────────────────────────────────────────────────
app.use((err, _req, res, _next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({ error: 'Erro interno do servidor' });
});

if (process.env.NODE_ENV !== 'production' && !process.env.VERCEL) {
  app.listen(PORT, () => {
    console.log(`\n🌸 Studio Beauty API`);
    console.log(`   Rodando em: http://localhost:${PORT}`);
    console.log(`   Ambiente: ${process.env.NODE_ENV || 'development'}\n`);
  });
}

module.exports = app;
