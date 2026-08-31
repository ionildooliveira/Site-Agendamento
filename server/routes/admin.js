const express = require('express');
const router = express.Router();
const { getDB } = require('../database/db');
const { authenticateAdmin } = require('../middleware/auth');
const { setTenantId } = require('../middleware/tenant');

// GET /api/admin/dashboard
router.get('/dashboard', authenticateAdmin, setTenantId, async (req, res) => {
  const supabase = getDB();

  const today = new Date().toISOString().split('T')[0];
  const dateObj = new Date();
  
  const year = req.query.year ? parseInt(req.query.year) : dateObj.getFullYear();
  const month = req.query.month ? parseInt(req.query.month) - 1 : dateObj.getMonth();

  const startOfMonth = new Date(year, month, 1).toISOString().split('T')[0];
  const endOfMonth = new Date(year, month + 1, 0).toISOString().split('T')[0];

  try {
    // Upcoming bookings (next 7 days) date
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + 7);
    const futureDateStr = futureDate.toISOString().split('T')[0];

    // Execute all queries concurrently to improve performance
    const [
      totalBookingsResult,
      todayBookingsResult,
      monthBookingsResult,
      monthBookingsDataResult,
      allBookingsResult,
      todayScheduleResult,
      upcomingBookingsResult
    ] = await Promise.all([
      // Total bookings (all time)
      supabase.from('bookings').select('*', { count: 'exact', head: true }).eq('company_id', req.tenantId).neq('status', 'cancelled'),
      // Today's bookings
      supabase.from('bookings').select('*', { count: 'exact', head: true }).eq('booking_date', today).eq('company_id', req.tenantId).neq('status', 'cancelled'),
      // This month's bookings
      supabase.from('bookings').select('*', { count: 'exact', head: true }).gte('booking_date', startOfMonth).lte('booking_date', endOfMonth).eq('company_id', req.tenantId).neq('status', 'cancelled'),
      // Fetch this month's bookings for revenue and top services
      supabase.from('bookings').select('service_id, services(name, price)').gte('booking_date', startOfMonth).lte('booking_date', endOfMonth).eq('company_id', req.tenantId).neq('status', 'cancelled'),
      // Recurring clients
      supabase.from('bookings').select('client_id').eq('company_id', req.tenantId).neq('status', 'cancelled'),
      // Today's schedule
      supabase.from('bookings')
        .select(`
          *,
          clients (name, phone),
          professionals (name),
          services (name, duration_minutes, price)
        `)
        .eq('booking_date', today).eq('company_id', req.tenantId).neq('status', 'cancelled')
        .order('start_time', { ascending: true }),
      // Upcoming bookings (next 7 days)
      supabase.from('bookings')
        .select(`
          *,
          clients (name),
          professionals (name),
          services (name)
        `)
        .gte('booking_date', today).lte('booking_date', futureDateStr).eq('company_id', req.tenantId).neq('status', 'cancelled')
        .order('booking_date', { ascending: true })
        .order('start_time', { ascending: true })
        .limit(20)
    ]);

    const totalBookings = totalBookingsResult.count;
    const todayBookings = todayBookingsResult.count;
    const monthBookings = monthBookingsResult.count;
    const monthBookingsData = monthBookingsDataResult.data;
    const allBookings = allBookingsResult.data;
    const todaySchedule = todayScheduleResult.data;
    const upcomingBookings = upcomingBookingsResult.data;

    let monthRevenue = 0;
    const serviceStats = {};

    (monthBookingsData || []).forEach(b => {
      if (b.services) {
        monthRevenue += Number(b.services.price);
        if (!serviceStats[b.service_id]) {
          serviceStats[b.service_id] = { name: b.services.name, count: 0, revenue: 0 };
        }
        serviceStats[b.service_id].count++;
        serviceStats[b.service_id].revenue += Number(b.services.price);
      }
    });

    const topServices = Object.values(serviceStats)
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    const clientCounts = {};
    (allBookings || []).forEach(b => {
      clientCounts[b.client_id] = (clientCounts[b.client_id] || 0) + 1;
    });
    const recurringClients = Object.values(clientCounts).filter(c => c >= 2).length;

    // Format todaySchedule to match frontend expectations
    const formattedTodaySchedule = (todaySchedule || []).map(b => ({
      ...b,
      client_name: b.clients?.name,
      client_phone: b.clients?.phone,
      professional_name: b.professionals?.name,
      service_name: b.services?.name,
      duration_minutes: b.services?.duration_minutes,
      service_price: b.services?.price
    }));

    const formattedUpcoming = (upcomingBookings || []).map(b => ({
      ...b,
      client_name: b.clients?.name,
      professional_name: b.professionals?.name,
      service_name: b.services?.name
    }));

    res.json({
      kpi: {
        totalBookings: totalBookings || 0,
        todayBookings: todayBookings || 0,
        monthBookings: monthBookings || 0,
        monthRevenue,
        recurringClients,
      },
      topServices,
      todaySchedule: formattedTodaySchedule,
      upcomingBookings: formattedUpcoming,
    });
  } catch (error) {
    console.error('Error fetching admin dashboard:', error);
    res.status(500).json({ error: 'Erro ao buscar dados do dashboard' });
  }
});

// GET /api/admin/schedule?view=day|week|month&date=YYYY-MM-DD
router.get('/schedule', authenticateAdmin, setTenantId, async (req, res) => {
  const supabase = getDB();
  const { view = 'day', date } = req.query;
  const baseDate = date || new Date().toISOString().split('T')[0];

  let startDate, endDate;
  const d = new Date(baseDate + 'T00:00:00');

  if (view === 'day') {
    startDate = endDate = baseDate;
  } else if (view === 'week') {
    const day = d.getDay();
    const monday = new Date(d); monday.setDate(d.getDate() - (day === 0 ? 6 : day - 1));
    const sunday = new Date(monday); sunday.setDate(monday.getDate() + 6);
    startDate = monday.toISOString().split('T')[0];
    endDate   = sunday.toISOString().split('T')[0];
  } else { // month
    startDate = `${baseDate.slice(0, 7)}-01`;
    const lastDay = new Date(d.getFullYear(), d.getMonth() + 1, 0);
    endDate = lastDay.toISOString().split('T')[0];
  }

  const { data: bookings } = await supabase
    .from('bookings')
    .select(`
      *,
      clients (name, phone, email),
      professionals (name),
      services (name, price, duration_minutes, category)
    `)
    .gte('booking_date', startDate).lte('booking_date', endDate).eq('company_id', req.tenantId).neq('status', 'cancelled')
    .order('booking_date', { ascending: true })
    .order('start_time', { ascending: true });

  const formattedBookings = (bookings || []).map(b => ({
    ...b,
    client_name: b.clients?.name,
    client_phone: b.clients?.phone,
    client_email: b.clients?.email,
    professional_name: b.professionals?.name,
    service_name: b.services?.name,
    service_price: b.services?.price,
    duration_minutes: b.services?.duration_minutes,
    service_category: b.services?.category
  }));

  res.json({ view, startDate, endDate, bookings: formattedBookings });
});

// GET /api/admin/clients
router.get('/clients', authenticateAdmin, setTenantId, async (req, res) => {
  const supabase = getDB();
  
  const { data: clients } = await supabase.from('clients').select('*').eq('company_id', req.tenantId).order('name', { ascending: true });
  const { data: bookings } = await supabase.from('bookings').select('client_id, booking_date').eq('company_id', req.tenantId).neq('status', 'cancelled');
  
  const bookingStats = {};
  (bookings || []).forEach(b => {
    if (!bookingStats[b.client_id]) {
      bookingStats[b.client_id] = { count: 0, last: b.booking_date };
    }
    bookingStats[b.client_id].count++;
    if (b.booking_date > bookingStats[b.client_id].last) {
      bookingStats[b.client_id].last = b.booking_date;
    }
  });

  const formattedClients = (clients || []).map(c => ({
    ...c,
    total_bookings: bookingStats[c.id]?.count || 0,
    last_booking: bookingStats[c.id]?.last || null
  }));

  res.json(formattedClients);
});

// Helper: HH:MM -> minutes
function toMin(t) {
  if (!t) return 0;
  const [h, m] = t.split(':').map(Number);
  return h * 60 + m;
}

// GET /api/admin/availability-monitor
router.get('/availability-monitor', authenticateAdmin, setTenantId, async (req, res) => {
  try {
    const supabase = getDB();
    const date = req.query.date || new Date().toISOString().split('T')[0];

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const reqDate = new Date(date + 'T00:00:00');
    
    const dayOfWeek = reqDate.getDay().toString();

    // Saloon working hours
    const { data: settings } = await supabase.from('settings').select('working_hours').eq('company_id', req.tenantId).single();
    let workingHours = {};
    if (settings && settings.working_hours) {
      workingHours = typeof settings.working_hours === 'string' ? JSON.parse(settings.working_hours) : settings.working_hours;
    }
    const dayHours = workingHours[dayOfWeek];

    if (!dayHours || typeof dayHours !== 'object' || !dayHours.open || !dayHours.close) {
      return res.json({ date, closed: true, message: 'Salão fechado neste dia.' });
    }

    const slotInterval = 30; // 30-min blocks

    // Professionals
    const { data: professionals } = await supabase.from('professionals').select('id, name, working_hours').eq('company_id', req.tenantId).eq('active', true).order('name', { ascending: true });

    // Blocked dates
    const { data: blockedDates } = await supabase.from('blocked_dates').select('professional_id').eq('date', date).eq('company_id', req.tenantId);

    // Bookings
    const { data: bookings } = await supabase.from('bookings').select('professional_id, start_time, end_time').eq('booking_date', date).eq('company_id', req.tenantId).neq('status', 'cancelled');

    const isToday = reqDate.toDateString() === today.toDateString();
    const now = new Date();
    const nowMin = now.getHours() * 60 + now.getMinutes(); 

    const result = (professionals || []).map(pro => {
      const isProBlocked = blockedDates?.some(b => !b.professional_id || b.professional_id === pro.id);
      
      let proWorkingHours = dayHours;
      if (pro.working_hours) {
        const pWh = typeof pro.working_hours === 'string' ? JSON.parse(pro.working_hours) : pro.working_hours;
        if (pWh[dayOfWeek]) {
          proWorkingHours = pWh[dayOfWeek];
        }
      }

      if (isProBlocked || !proWorkingHours || !proWorkingHours.open || !proWorkingHours.close) {
        return { professional: { id: pro.id, name: pro.name }, totalSlots: 0, availableSlots: 0, slots: [] };
      }

      const pOpenMin = toMin(proWorkingHours.open);
      const pCloseMin = toMin(proWorkingHours.close);

      const proBookings = bookings?.filter(b => b.professional_id === pro.id) || [];
      const occupiedRanges = proBookings.map(b => ({
        start: toMin(b.start_time),
        end: toMin(b.end_time)
      }));

      const proSlots = [];
      for (let t = pOpenMin; t + slotInterval <= pCloseMin; t += slotInterval) {
        const h = Math.floor(t / 60).toString().padStart(2, '0');
        const m = (t % 60).toString().padStart(2, '0');
        const time = `${h}:${m}`;
        
        let available = true;
        
        if (isToday && t <= nowMin) {
          available = false;
        } else {
          const hasConflict = occupiedRanges.some(r => t < r.end && (t + slotInterval) > r.start);
          if (hasConflict) available = false;
        }

        proSlots.push({ time, available });
      }

      return {
        professional: { id: pro.id, name: pro.name },
        totalSlots: proSlots.length,
        availableSlots: proSlots.filter(s => s.available).length,
        slots: proSlots
      };
    });

    res.json({ date, closed: false, professionals: result });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Erro interno ao buscar monitor de vagas' });
  }
});

module.exports = router;
