const express = require('express');
const router = express.Router();
const { getDB } = require('../database/db');
const { setTenantId } = require('../middleware/tenant');
const { authenticateAdmin } = require('../middleware/auth');

// Public route to get approved testimonials for a specific company
router.get('/', setTenantId, async (req, res) => {
  try {
    const supabase = getDB();
    const { data: testimonials, error } = await supabase
      .from('testimonials')
      .select(`
        id,
        rating,
        comment,
        created_at,
        client:client_id (
          name
        ),
        booking:booking_id (
          service_id
        )
      `)
      .eq('company_id', req.tenantId)
      .eq('status', 'approved')
      .order('created_at', { ascending: false });

    if (error) throw error;

    // We might need to fetch service names if we want to display them
    // For now, let's just fetch the service names if booking is joined
    if (testimonials && testimonials.length > 0) {
      const { data: services } = await supabase
        .from('services')
        .select('id, name')
        .eq('company_id', req.tenantId);
        
      const serviceMap = (services || []).reduce((acc, s) => {
        acc[s.id] = s.name;
        return acc;
      }, {});

      testimonials.forEach(t => {
        if (t.booking && t.booking.service_id) {
          t.service_name = serviceMap[t.booking.service_id];
        }
      });
    }

    res.json(testimonials || []);
  } catch (error) {
    console.error('Error fetching testimonials:', error);
    res.status(500).json({ error: 'Erro ao buscar depoimentos' });
  }
});

// Route to submit a new testimonial (status defaults to pending in DB)
router.post('/', setTenantId, async (req, res) => {
  try {
    const supabase = getDB();
    const { bookingId, clientId, rating, comment } = req.body;

    if (!rating || !comment || !clientId) {
      return res.status(400).json({ error: 'Dados incompletos para o depoimento' });
    }

    const { data, error } = await supabase
      .from('testimonials')
      .insert([{
        company_id: req.tenantId,
        client_id: clientId,
        booking_id: bookingId,
        rating,
        comment,
        status: 'pending'
      }])
      .select();

    if (error) throw error;

    res.json({ success: true, message: 'Depoimento enviado para aprovação' });
  } catch (error) {
    console.error('Error submitting testimonial:', error);
    res.status(500).json({ error: 'Erro ao enviar depoimento' });
  }
});

// ADMIN: Get all testimonials for a company
router.get('/admin/all', authenticateAdmin, async (req, res) => {
  try {
    const supabase = getDB();
    const { data: testimonials, error } = await supabase
      .from('testimonials')
      .select(`
        id,
        rating,
        comment,
        status,
        created_at,
        client:client_id (
          name
        ),
        booking:booking_id (
          service_id
        )
      `)
      .eq('company_id', req.admin.company_id)
      .order('created_at', { ascending: false });

    if (error) throw error;

    if (testimonials && testimonials.length > 0) {
      const { data: services } = await supabase
        .from('services')
        .select('id, name')
        .eq('company_id', req.admin.company_id);
        
      const serviceMap = (services || []).reduce((acc, s) => {
        acc[s.id] = s.name;
        return acc;
      }, {});

      testimonials.forEach(t => {
        if (t.booking && t.booking.service_id) {
          t.service_name = serviceMap[t.booking.service_id];
        }
      });
    }

    res.json(testimonials || []);
  } catch (error) {
    console.error('Error fetching admin testimonials:', error);
    res.status(500).json({ error: 'Erro ao buscar depoimentos' });
  }
});

// ADMIN: Update testimonial status
router.patch('/:id/status', authenticateAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!['pending', 'approved', 'rejected'].includes(status)) {
      return res.status(400).json({ error: 'Status inválido' });
    }

    const supabase = getDB();
    const { data, error } = await supabase
      .from('testimonials')
      .update({ status })
      .eq('id', id)
      .eq('company_id', req.admin.company_id)
      .select();

    if (error) throw error;
    if (!data || data.length === 0) {
      return res.status(404).json({ error: 'Depoimento não encontrado' });
    }

    res.json({ success: true, testimonial: data[0] });
  } catch (error) {
    console.error('Error updating testimonial status:', error);
    res.status(500).json({ error: 'Erro ao atualizar status do depoimento' });
  }
});

module.exports = router;
