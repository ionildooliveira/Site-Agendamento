const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = 'https://zxewxdtpazjutwfxpams.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inp4ZXd4ZHRwYXpqdXR3ZnhwYW1zIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4NDgyNTc4MCwiZXhwIjoyMTAwNDAxNzgwfQ.eXQ3o1S02_9Y7RWtGGU8iKq2C2A-DQ_PQjJAanvDy2g';

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function testDashboard() {
  const today = new Date().toISOString().split('T')[0];
  const dateObj = new Date();
  const startOfMonth = new Date(dateObj.getFullYear(), dateObj.getMonth(), 1).toISOString().split('T')[0];
  const endOfMonth = new Date(dateObj.getFullYear(), dateObj.getMonth() + 1, 0).toISOString().split('T')[0];

  try {
    const { count: totalBookings, error: err1 } = await supabase
      .from('bookings').select('*', { count: 'exact', head: true }).neq('status', 'cancelled');
    if (err1) throw err1;

    const { count: todayBookings, error: err2 } = await supabase
      .from('bookings').select('*', { count: 'exact', head: true })
      .eq('booking_date', today).neq('status', 'cancelled');
    if (err2) throw err2;

    const { count: monthBookings, error: err3 } = await supabase
      .from('bookings').select('*', { count: 'exact', head: true })
      .gte('booking_date', startOfMonth).lte('booking_date', endOfMonth).neq('status', 'cancelled');
    if (err3) throw err3;

    const { data: monthBookingsData, error: err4 } = await supabase
      .from('bookings')
      .select('service_id, services(name, price)')
      .gte('booking_date', startOfMonth).lte('booking_date', endOfMonth).neq('status', 'cancelled');
    if (err4) throw err4;

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

    const { data: allBookings, error: err5 } = await supabase
      .from('bookings').select('client_id').neq('status', 'cancelled');
    if (err5) throw err5;
    
    const clientCounts = {};
    (allBookings || []).forEach(b => {
      clientCounts[b.client_id] = (clientCounts[b.client_id] || 0) + 1;
    });
    const recurringClients = Object.values(clientCounts).filter(c => c >= 2).length;

    const { data: todaySchedule, error: err6 } = await supabase
      .from('bookings')
      .select(`
        *,
        clients (name, phone),
        professionals (name),
        services (name, duration_minutes, price)
      `)
      .eq('booking_date', today).neq('status', 'cancelled')
      .order('start_time', { ascending: true });
    if (err6) throw err6;

    const formattedTodaySchedule = (todaySchedule || []).map(b => ({
      ...b,
      client_name: b.clients?.name,
      client_phone: b.clients?.phone,
      professional_name: b.professionals?.name,
      service_name: b.services?.name,
      duration_minutes: b.services?.duration_minutes,
      service_price: b.services?.price
    }));

    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + 7);
    const futureDateStr = futureDate.toISOString().split('T')[0];

    const { data: upcomingBookings, error: err7 } = await supabase
      .from('bookings')
      .select(`
        *,
        clients (name),
        professionals (name),
        services (name)
      `)
      .gte('booking_date', today).lte('booking_date', futureDateStr).neq('status', 'cancelled')
      .order('booking_date', { ascending: true })
      .order('start_time', { ascending: true })
      .limit(20);
    if (err7) throw err7;

    const formattedUpcoming = (upcomingBookings || []).map(b => ({
      ...b,
      client_name: b.clients?.name,
      professional_name: b.professionals?.name,
      service_name: b.services?.name
    }));

    console.log("Success! Data:");
    console.log(JSON.stringify({
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
    }, null, 2));
  } catch (error) {
    console.error('Error fetching admin dashboard:', error);
  }
}

testDashboard();
