const express = require('express');
const router = express.Router();
const { getDB } = require('../database/db');
const { setTenantId } = require('../middleware/tenant');

// Helper: HH:MM → minutes
function toMin(t) {
  const [h, m] = t.split(':').map(Number);
  return h * 60 + m;
}

/**
 * GET /api/availability
 * Query params: professionalId, date (YYYY-MM-DD), serviceId
 *
 * Returns array of { time: "HH:MM", available: boolean }
 */
router.get('/', setTenantId, async (req, res) => {
  try {
    const { professionalId, date, serviceId } = req.query;

    if (!professionalId || !date || !serviceId) {
      return res.status(400).json({
        error: 'Parâmetros obrigatórios: professionalId, date, serviceId',
      });
    }

    const supabase = getDB();

    // ── 1. Block past dates ───────────────────────────────────────────────────
    const brTimeStr = new Date().toLocaleString("en-US", {timeZone: "America/Sao_Paulo"});
    const today = new Date(brTimeStr);
    today.setHours(0, 0, 0, 0);
    const reqDate = new Date(date + 'T00:00:00');
    if (reqDate < today) {
      return res.json({ slots: [], message: 'Data no passado' });
    }

    // ── 2. Get day of week (0=Sun … 6=Sat) ───────────────────────────────────
    const dayOfWeek = reqDate.getDay().toString();

    // ── 3. Get working hours ──────────────────────────────────────────────────
    const { data: settings } = await supabase.from('settings').select('*').eq('company_id', req.tenantId).single();
    
    let workingHours = {};
    if (settings && settings.working_hours) {
      workingHours = typeof settings.working_hours === 'string' 
        ? JSON.parse(settings.working_hours) 
        : settings.working_hours;
    }

    const dayHours = workingHours[dayOfWeek];

    if (!dayHours || typeof dayHours !== 'object') {
      return res.json({ slots: [], message: 'Salão fechado neste dia da semana' });
    }

    // ── 4. Check blocked dates ────────────────────────────────────────────────
    const { data: blockedDates } = await supabase.from('blocked_dates')
      .select('reason, professional_id')
      .eq('date', date)
      .eq('company_id', req.tenantId)
      .or(`professional_id.is.null,professional_id.eq.${professionalId}`);

    if (blockedDates && blockedDates.length > 0) {
      return res.json({ slots: [], message: blockedDates[0].reason || 'Data bloqueada' });
    }

    // ── 5. Get service duration ───────────────────────────────────────────────
    const { data: service } = await supabase.from('services').select('*').eq('id', serviceId).eq('company_id', req.tenantId).single();
    if (!service) return res.status(404).json({ error: 'Serviço não encontrado' });

    const duration = service.duration_minutes;
    // O intervalo entre os horários agora é dinâmico, baseado na duração do serviço
    const slotInterval = duration;
    
    if (!dayHours.open || !dayHours.close) {
      return res.json({ slots: [], message: 'Horário de funcionamento inválido para este dia' });
    }
    
    const openMin = toMin(dayHours.open);
    const closeMin = toMin(dayHours.close);

    // ── 6. Generate all time slots ────────────────────────────────────────────
    const allSlots = [];
    for (let t = openMin; t + duration <= closeMin; t += slotInterval) {
      const h = Math.floor(t / 60).toString().padStart(2, '0');
      const m = (t % 60).toString().padStart(2, '0');
      allSlots.push(`${h}:${m}`);
    }

    // ── 7. Get existing bookings for this professional/date ───────────────────
    const { data: existingBookings } = await supabase.from('bookings')
      .select('start_time, end_time')
      .eq('professional_id', professionalId)
      .eq('booking_date', date)
      .eq('company_id', req.tenantId)
      .neq('status', 'cancelled');

    const occupiedRanges = (existingBookings || []).map(b => ({
      start: toMin(b.start_time),
      end: toMin(b.end_time),
    }));

    // ── 8. Check current time for "today" filtering ───────────────────────────
    const isToday = reqDate.toDateString() === today.toDateString();
    const now = new Date(brTimeStr);
    const nowMin = now.getHours() * 60 + now.getMinutes() + 30; // add 30min buffer

    // ── 9. Mark slots as available / unavailable ──────────────────────────────
    const slots = allSlots.map(time => {
      const slotStart = toMin(time);
      const slotEnd = slotStart + duration;

      if (isToday && slotStart <= nowMin) {
        return { time, available: false };
      }

      const hasConflict = occupiedRanges.some(
        range => slotStart < range.end && slotEnd > range.start
      );

      return { time, available: !hasConflict };
    });

    res.json({
      slots,
      date,
      workingHours: dayHours,
      serviceDuration: duration,
      totalSlots: slots.length,
      availableCount: slots.filter(s => s.available).length,
    });
  } catch (error) {
    console.error('Error in availability endpoint:', error);
    res.status(500).json({ error: 'Erro interno ao carregar a disponibilidade.' });
  }
});

module.exports = router;
