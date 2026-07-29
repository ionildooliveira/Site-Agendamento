const express = require('express');
const router = express.Router();
const { v4: uuidv4 } = require('uuid');
const jwt = require('jsonwebtoken');
const { getDB } = require('../database/db');
const { authenticateAdmin, JWT_SECRET } = require('../middleware/auth');
const { setTenantId } = require('../middleware/tenant');

// Helper: HH:MM → minutes
function toMin(t) {
  const [h, m] = t.split(':').map(Number);
  return h * 60 + m;
}
// minutes → HH:MM
function toTime(m) {
  return `${Math.floor(m / 60).toString().padStart(2, '0')}:${(m % 60).toString().padStart(2, '0')}`;
}

const BOOKING_SELECT = `*, clients(*), professionals(*), services(*)`;

// ── POST /api/bookings  (public) ──────────────────────────────────────────────
router.post('/', setTenantId, async (req, res) => {
  try {
    const { clientName, clientPhone, clientEmail, serviceId, professionalId, date, startTime, notes } = req.body;

  if (!clientName || !clientPhone || !clientEmail || !serviceId || !professionalId || !date || !startTime) {
    return res.status(400).json({ error: 'Todos os campos obrigatórios devem ser preenchidos' });
  }

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(clientEmail)) {
    return res.status(400).json({ error: 'E-mail inválido' });
  }

  const supabase = getDB();

  // Block past datetime
  const [y, mo, d] = date.split('-').map(Number);
  const [h, mi] = startTime.split(':').map(Number);
  if (new Date(y, mo - 1, d, h, mi) <= new Date()) {
    return res.status(400).json({ error: 'Não é possível agendar para datas ou horários passados' });
  }

  // Get service
  const { data: service } = await supabase.from('services').select('*').eq('id', serviceId).eq('active', true).eq('company_id', req.tenantId).single();
  if (!service) return res.status(404).json({ error: 'Serviço não encontrado' });

  // Get professional
  const { data: professional } = await supabase.from('professionals').select('*').eq('id', professionalId).eq('active', true).eq('company_id', req.tenantId).single();
  if (!professional) return res.status(404).json({ error: 'Profissional não encontrada' });

  // Calculate end time
  const startMin = toMin(startTime);
  const endMin   = startMin + service.duration_minutes;
  const endTime  = toTime(endMin);

  // Check working hours
  const { data: settings } = await supabase.from('settings').select('*').eq('company_id', req.tenantId).single();
  let hours = {};
  if (settings && settings.working_hours) {
    hours = typeof settings.working_hours === 'string'
      ? JSON.parse(settings.working_hours)
      : settings.working_hours;
  }
  const dayKey = new Date(date + 'T00:00:00').getDay().toString();
  const dayHours = hours[dayKey];

  if (!dayHours) {
    return res.status(409).json({ error: 'O salão não funciona neste dia da semana' });
  }
  if (startMin < toMin(dayHours.open) || endMin > toMin(dayHours.close)) {
    return res.status(409).json({ error: `Horário fora do expediente (${dayHours.open}–${dayHours.close})` });
  }

  // Check blocked dates
  const { data: blocked } = await supabase.from('blocked_dates')
    .select('reason')
    .eq('date', date)
    .eq('company_id', req.tenantId)
    .or(`professional_id.is.null,professional_id.eq.${professionalId}`);

  if (blocked && blocked.length > 0) return res.status(409).json({ error: blocked[0].reason || 'Esta data está bloqueada' });

  // ─── ANTI-DUPLICATE CHECK ─────────────────────────────────────────────────
  const { data: conflicts } = await supabase.from('bookings')
    .select('id')
    .eq('professional_id', professionalId)
    .eq('booking_date', date)
    .eq('company_id', req.tenantId)
    .neq('status', 'cancelled')
    .lt('start_time', endTime)
    .gt('end_time', startTime);

  if (conflicts && conflicts.length > 0) {
    return res.status(409).json({
      error: 'Horário indisponível. Por favor, selecione outro horário.',
      code: 'TIME_CONFLICT',
    });
  }

  // Find or create client
  let { data: client } = await supabase.from('clients').select('*').ilike('email', clientEmail.trim()).eq('company_id', req.tenantId).single();
  
  if (!client) {
    const { data: newClient, error: insertError } = await supabase.from('clients')
      .insert({ name: clientName.trim(), phone: clientPhone.trim(), email: clientEmail.toLowerCase().trim(), company_id: req.tenantId })
      .select().single();
      
    if (insertError || !newClient) {
      console.error('Error inserting client:', insertError);
      return res.status(400).json({ error: 'Erro ao registrar cliente. Este e-mail já pode estar em uso por outra conta.' });
    }
    client = newClient;
  } else {
    await supabase.from('clients').update({ name: clientName.trim(), phone: clientPhone.trim() }).eq('id', client.id);
  }

  // Create booking
  const cancelToken = uuidv4();
  const { data: bookingResult, error: insertError } = await supabase.from('bookings')
    .insert({
      client_id: client.id,
      professional_id: professionalId,
      service_id: serviceId,
      booking_date: date,
      start_time: startTime,
      end_time: endTime,
      notes: notes || null,
      cancel_token: cancelToken,
      status: 'confirmed',
      company_id: req.tenantId
    })
    .select(BOOKING_SELECT)
    .single();

  if (insertError || !bookingResult) {
    return res.status(500).json({ error: 'Erro ao criar agendamento' });
  }

  // Format to match frontend expectations
  const booking = {
    ...bookingResult,
    client_name: bookingResult.clients?.name,
    client_phone: bookingResult.clients?.phone,
    client_email: bookingResult.clients?.email,
    professional_name: bookingResult.professionals?.name,
    professional_role: bookingResult.professionals?.role,
    service_name: bookingResult.services?.name,
    service_price: bookingResult.services?.price,
    duration_minutes: bookingResult.services?.duration_minutes
  };

    res.status(201).json({
      success: true,
      booking,
      cancelToken,
      message: `✅ Agendamento confirmado! ${service.name} com ${professional.name} em ${date} às ${startTime}.`,
    });
  } catch (error) {
    console.error('Error creating booking:', error);
    res.status(500).json({ error: 'Erro interno ao processar o agendamento' });
  }
});

// ── GET /api/bookings  (admin) ────────────────────────────────────────────────
router.get('/', authenticateAdmin, setTenantId, async (req, res) => {
  const supabase = getDB();
  const { date, status, professionalId, startDate, endDate } = req.query;

  let query = supabase.from('bookings').select(BOOKING_SELECT).eq('company_id', req.tenantId);

  if (date) query = query.eq('booking_date', date);
  if (startDate) query = query.gte('booking_date', startDate);
  if (endDate) query = query.lte('booking_date', endDate);
  if (status) query = query.eq('status', status);
  if (professionalId) query = query.eq('professional_id', professionalId);

  query = query.order('booking_date', { ascending: false }).order('start_time', { ascending: true });

  const { data: bookings } = await query;

  const formattedBookings = (bookings || []).map(b => ({
    ...b,
    client_name: b.clients?.name,
    client_phone: b.clients?.phone,
    client_email: b.clients?.email,
    professional_name: b.professionals?.name,
    professional_role: b.professionals?.role,
    service_name: b.services?.name,
    service_price: b.services?.price,
    duration_minutes: b.services?.duration_minutes
  }));

  res.json(formattedBookings);
});

// ── GET /api/bookings/client  (client lookup by email) ────────────────────────
router.get('/client', setTenantId, async (req, res) => {
  const { email } = req.query;
  if (!email) return res.status(400).json({ error: 'Email é obrigatório' });

  const supabase = getDB();
  
  // Find client first
  const { data: client } = await supabase.from('clients').select('id').ilike('email', email.trim()).eq('company_id', req.tenantId).single();
  if (!client) return res.json([]);

  const { data: bookings } = await supabase.from('bookings')
    .select(BOOKING_SELECT)
    .eq('client_id', client.id)
    .eq('company_id', req.tenantId)
    .order('booking_date', { ascending: false })
    .order('start_time', { ascending: false });

  const formattedBookings = (bookings || []).map(b => ({
    ...b,
    client_name: b.clients?.name,
    client_phone: b.clients?.phone,
    client_email: b.clients?.email,
    professional_name: b.professionals?.name,
    professional_role: b.professionals?.role,
    service_name: b.services?.name,
    service_price: b.services?.price,
    duration_minutes: b.services?.duration_minutes
  }));

  res.json(formattedBookings);
});

const updateBookingHandler = async (req, res) => {
  const { id } = req.params;
  const { status, date, startTime, professionalId, serviceId, cancelToken } = req.body;
  const authHeader = req.headers['authorization'];

  const supabase = getDB();
  const { data: booking } = await supabase.from('bookings').select('*').eq('id', id).eq('company_id', req.tenantId).single();
  if (!booking) return res.status(404).json({ error: 'Agendamento não encontrado' });

  // Authorization check
  let authorized = false;
  if (cancelToken && cancelToken === booking.cancel_token) {
    authorized = true;
  } else if (authHeader) {
    try { jwt.verify(authHeader.split(' ')[1], JWT_SECRET); authorized = true; } catch {}
  }
  if (!authorized) return res.status(403).json({ error: 'Não autorizado' });

  let updatePayload = {};

  // Rescheduling
  if (date && startTime) {
    const svcId = serviceId || booking.service_id;
    const proId = professionalId || booking.professional_id;
    const { data: svc } = await supabase.from('services').select('*').eq('id', svcId).eq('company_id', req.tenantId).single();
    
    const newStart = toMin(startTime);
    const newEnd   = newStart + svc.duration_minutes;
    const newEndTime = toTime(newEnd);

    // Block past
    const [y, mo, d] = date.split('-').map(Number);
    const [h, mi] = startTime.split(':').map(Number);
    if (new Date(y, mo - 1, d, h, mi) <= new Date()) {
      return res.status(400).json({ error: 'Não é possível reagendar para datas passadas' });
    }

    // Conflict check
    const { data: conflicts } = await supabase.from('bookings')
      .select('id')
      .eq('professional_id', proId)
      .eq('booking_date', date)
      .eq('company_id', req.tenantId)
      .neq('status', 'cancelled')
      .neq('id', id)
      .lt('start_time', newEndTime)
      .gt('end_time', startTime);

    if (conflicts && conflicts.length > 0) {
      return res.status(409).json({ error: 'Horário indisponível. Por favor, selecione outro horário.' });
    }

    updatePayload = {
      ...updatePayload,
      booking_date: date,
      start_time: startTime,
      end_time: newEndTime,
      professional_id: proId,
      service_id: svcId,
      status: 'confirmed'
    };
  }

  if (status) {
    updatePayload.status = status;
  }

  if (Object.keys(updatePayload).length > 0) {
    await supabase.from('bookings').update(updatePayload).eq('id', id);
  }

  const { data: updated } = await supabase.from('bookings').select(BOOKING_SELECT).eq('id', id).single();
  const formattedUpdated = {
    ...updated,
    client_name: updated.clients?.name,
    client_phone: updated.clients?.phone,
    client_email: updated.clients?.email,
    professional_name: updated.professionals?.name,
    professional_role: updated.professionals?.role,
    service_name: updated.services?.name,
    service_price: updated.services?.price,
    duration_minutes: updated.services?.duration_minutes
  };

  res.json({ success: true, booking: formattedUpdated });
};

router.put('/:id', setTenantId, updateBookingHandler);
router.patch('/:id', setTenantId, updateBookingHandler);

// ── DELETE /api/bookings/:id  (admin) — Hard Delete ─────────────────────────
router.delete('/:id', authenticateAdmin, setTenantId, async (req, res) => {
  const supabase = getDB();
  await supabase.from('bookings').delete().eq('id', req.params.id).eq('company_id', req.tenantId);
  res.json({ success: true });
});

module.exports = router;
