import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

let currentTenantId = null;
let currentTenantSlug = null;

export const setTenantId = (id, slug) => {
  currentTenantId = id;
  currentTenantSlug = slug;
};

export const getCurrentTenantId = () => currentTenantId;
export const getCurrentTenantSlug = () => currentTenantSlug;

// Interceptor to inject JWT token and Tenant ID
api.interceptors.request.use(
  (config) => {
    let slug = currentTenantSlug;
    if (!slug) {
       // fallback if slug not set but we have admin data
       const adminData = localStorage.getItem('studio_beauty_admin');
       if (adminData) {
         try {
            const admin = JSON.parse(adminData);
            if (admin.company_slug) slug = admin.company_slug;
         } catch(e){}
       }
    }
    
    // Use the slug to get the correct token
    const token = slug ? localStorage.getItem(`studio_beauty_token_${slug}`) : null;
    
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    
    let tenantId = currentTenantId;
    if (!tenantId) {
      const adminData = localStorage.getItem('studio_beauty_admin');
      if (adminData) {
        try {
          const admin = JSON.parse(adminData);
          if (admin.company_id) {
            tenantId = admin.company_id;
          }
        } catch (e) {}
      }
    }

    if (tenantId) {
      config.headers['X-Tenant-Id'] = tenantId;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle session expiration
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && (error.response.status === 401 || error.response.status === 403)) {
      // Check if it's admin endpoint before clearing and redirecting
      if (window.location.pathname.includes('/admin')) {
        const slug = currentTenantSlug;
        if (slug) {
          localStorage.removeItem(`studio_beauty_token_${slug}`);
          localStorage.removeItem(`studio_beauty_admin_${slug}`);
          window.location.href = `/${slug}/admin`;
        }
      }
    }
    return Promise.reject(error);
  }
);

export const authAPI = {
  login: async (email, password) => {
    const response = await api.post('/auth/admin/login', { email, password });
    return response.data;
  },
  updateCredentials: async (data) => {
    const response = await api.put('/auth/admin/credentials', data);
    return response.data;
  },
  recoverPassword: async (email) => {
    const response = await api.post('/auth/admin/recover-password', { email });
    return response.data;
  },
  resetPassword: async (token, newPassword) => {
    const response = await api.post('/auth/admin/reset-password', { token, newPassword });
    return response.data;
  },
};

export const companiesAPI = {
  getBySlug: async (slug) => {
    const response = await api.get(`/companies/${slug}`);
    return response.data;
  }
};

export const servicesAPI = {
  getAll: async (active) => {
    const response = await api.get('/services', { params: { active } });
    return response.data;
  },
  create: async (data) => {
    const response = await api.post('/services', data);
    return response.data;
  },
  update: async (id, data) => {
    const response = await api.put(`/services/${id}`, data);
    return response.data;
  },
  delete: async (id) => {
    const response = await api.delete(`/services/${id}`);
    return response.data;
  },
};

export const professionalsAPI = {
  getAll: async (active) => {
    const response = await api.get('/professionals', { params: { active } });
    return response.data;
  },
  create: async (data) => {
    const response = await api.post('/professionals', data);
    return response.data;
  },
  update: async (id, data) => {
    const response = await api.put(`/professionals/${id}`, data);
    return response.data;
  },
  delete: async (id) => {
    const response = await api.delete(`/professionals/${id}`);
    return response.data;
  },
};

export const availabilityAPI = {
  get: async (professionalId, date, serviceId) => {
    const response = await api.get('/availability', {
      params: { professionalId, date, serviceId },
    });
    return response.data;
  },
};

export const bookingsAPI = {
  create: async (data) => {
    const response = await api.post('/bookings', data);
    return response.data;
  },
  getAll: async (filters = {}) => {
    const response = await api.get('/bookings', { params: filters });
    return response.data;
  },
  getByEmail: async (email) => {
    const response = await api.get('/bookings/client', { params: { email } });
    return response.data;
  },
  update: async (id, data) => {
    const response = await api.put(`/bookings/${id}`, data);
    return response.data;
  },
  delete: async (id) => {
    const response = await api.delete(`/bookings/${id}`);
    return response.data;
  },
};

export const adminAPI = {
  getDashboard: async (month, year) => {
    const response = await api.get('/admin/dashboard', { params: { month, year } });
    return response.data;
  },
  getSchedule: async (view, date) => {
    const response = await api.get('/admin/schedule', { params: { view, date } });
    return response.data;
  },
  getClients: async () => {
    const response = await api.get('/admin/clients');
    return response.data;
  },
  getAvailabilityMonitor: async (date) => {
    const response = await api.get('/admin/availability-monitor', { params: { date } });
    return response.data;
  }
};

export const settingsAPI = {
  get: async () => {
    const response = await api.get('/settings');
    return response.data;
  },
  update: async (data) => {
    const response = await api.put('/settings', data);
    return response.data;
  },
  getSalonData: async () => {
    const response = await api.get('/settings/salon-data');
    return response.data;
  },
  updateSalonData: async (salonData) => {
    const response = await api.put('/settings/salon-data', { salonData });
    return response.data;
  },
  getBlockedDates: async (professionalId) => {
    const response = await api.get('/settings/blocked-dates', { params: { professionalId } });
    return response.data;
  },
  createBlockedDate: async (data) => {
    const response = await api.post('/settings/blocked-dates', data);
    return response.data;
  },
  deleteBlockedDate: async (id) => {
    const response = await api.delete(`/settings/blocked-dates/${id}`);
    return response.data;
  },
  uploadCover: async (formData) => {
    const response = await api.post('/settings/upload-cover', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
    return response.data;
  },
};

export const clientsAPI = {
  getAll: async (search) => {
    const response = await api.get('/clients', { params: { search } });
    return response.data;
  },
  create: async (data) => {
    const response = await api.post('/clients', data);
    return response.data;
  },
};

export const superAdminAPI = {
  createCompany: async (data, password) => {
    const response = await api.post('/companies/create', data, {
      headers: { 'X-Super-Admin-Password': password }
    });
    return response;
  },
  getAllCompanies: async (password) => {
    const response = await api.get('/companies', {
      headers: { 'X-Super-Admin-Password': password }
    });
    return response.data;
  },
  updateCompany: async (id, data, password) => {
    const response = await api.put(`/companies/${id}`, data, {
      headers: { 'X-Super-Admin-Password': password }
    });
    return response.data;
  },
  updateCompanyStatus: async (id, is_active, password) => {
    const response = await api.patch(`/companies/${id}/status`, { is_active }, {
      headers: { 'X-Super-Admin-Password': password }
    });
    return response.data;
  },
  deleteCompany: async (id, password) => {
    const response = await api.delete(`/companies/${id}`, {
      headers: { 'X-Super-Admin-Password': password }
    });
    return response.data;
  }
};

export const testimonialsAPI = {
  getAll: async () => {
    const response = await api.get('/testimonials');
    return response.data;
  },
  create: async (data) => {
    const response = await api.post('/testimonials', data);
    return response.data;
  },
  getAdminAll: async () => {
    const response = await api.get('/testimonials/admin/all');
    return response.data;
  },
  updateStatus: async (id, status) => {
    const response = await api.patch(`/testimonials/${id}/status`, { status });
    return response.data;
  }
};

export const galleryAPI = {
  getAll: async () => {
    const response = await api.get('/gallery');
    return response.data;
  },
  create: async (formData) => {
    const response = await api.post('/gallery', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
    return response.data;
  },
  delete: async (id) => {
    const response = await api.delete(`/gallery/${id}`);
    return response.data;
  }
};

export default api;
