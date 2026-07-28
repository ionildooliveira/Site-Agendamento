import { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
// Client pages
import LandingPage from './pages/LandingPage';
import ServicesCatalog from './pages/ServicesCatalog';
import BookingWizard from './pages/BookingWizard';
import MyBookings from './pages/MyBookings';
import TenantLayout from './components/TenantLayout';

// Admin pages
import Login from './pages/Login';
import AdminLayout from './components/AdminLayout';
import AdminDashboard from './pages/admin/Dashboard';
import AdminAgenda from './pages/admin/Agenda';
import AdminServices from './pages/admin/Services';
import AdminProfessionals from './pages/admin/Professionals';
import AdminClients from './pages/admin/Clients';
import AdminSettings from './pages/admin/Settings';

export default function App() {
  return (
    <BrowserRouter>
      {/* Toast notifications handler */}
      <Toaster 
        position="top-right"
        toastOptions={{
          duration: 4000,
          style: {
            background: '#FFFFFF',
            color: '#6B4E5A',
            border: '1px solid #F5D8E3',
            fontFamily: "'Inter', sans-serif",
            fontSize: '14px',
            borderRadius: '12px',
          },
        }} 
      />

      <Routes>
        {/* Public Client Routes */}
        <Route path="/:companySlug" element={<TenantLayout />}>
          <Route index element={<LandingPage />} />
          <Route path="servicos" element={<ServicesCatalog />} />
          <Route path="agendar" element={<BookingWizard />} />
          <Route path="meus-agendamentos" element={<MyBookings />} />
        </Route>

        {/* Admin Authentication routes */}
        <Route path="/login" element={<Login />} />
        <Route path="/admin/login" element={<Login />} />

        {/* Protected Admin Routes */}
        <Route path="/admin" element={<AdminLayout />}>
          <Route index element={<AdminDashboard />} />
          <Route path="dashboard" element={<Navigate to="/admin" replace />} />
          <Route path="agenda" element={<AdminAgenda />} />
          <Route path="servicos" element={<AdminServices />} />
          <Route path="profissionais" element={<AdminProfessionals />} />
          <Route path="clientes" element={<AdminClients />} />
          <Route path="configuracoes" element={<AdminSettings />} />
        </Route>

        {/* Catch-all Redirect */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
