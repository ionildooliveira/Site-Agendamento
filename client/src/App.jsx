import { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
// Client pages
import LandingPage from './pages/LandingPage';
import ServicesCatalog from './pages/ServicesCatalog';
import BookingWizard from './pages/BookingWizard';
import MyBookings from './pages/MyBookings';
import TenantLayout from './components/TenantLayout';

// Super Admin
import SuperAdminLogin from './pages/super-admin/SuperAdminLogin';
import SuperAdminDashboard from './pages/super-admin/SuperAdminDashboard';

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
        {/* Public Client & Admin Routes scoped by Tenant */}
        <Route path="/:companySlug" element={<TenantLayout />}>
          {/* Public Routes */}
          <Route index element={<LandingPage />} />
          <Route path="servicos" element={<ServicesCatalog />} />
          <Route path="agendar" element={<BookingWizard />} />
          <Route path="meus-agendamentos" element={<MyBookings />} />

          {/* Admin Routes */}
          <Route path="admin/login" element={<Login />} />
          <Route path="admin" element={<AdminLayout />}>
            <Route index element={<AdminDashboard />} />
            <Route path="agenda" element={<AdminAgenda />} />
            <Route path="servicos" element={<AdminServices />} />
            <Route path="profissionais" element={<AdminProfessionals />} />
            <Route path="clientes" element={<AdminClients />} />
            <Route path="configuracoes" element={<AdminSettings />} />
          </Route>
        </Route>

        {/* Super Admin Routes */}
        <Route path="/super-admin/login" element={<SuperAdminLogin />} />
        <Route path="/super-admin/dashboard" element={<SuperAdminDashboard />} />
        <Route path="/super-admin" element={<Navigate to="/super-admin/login" replace />} />

        {/* Platform Root */}
        <Route path="/" element={
          <div className="min-h-screen flex items-center justify-center bg-gray-50 flex-col gap-4 text-center p-4">
            <h1 className="text-2xl font-bold text-[#4A323D]">Plataforma de Agendamento</h1>
            <p className="text-gray-600">Por favor, acesse o link específico da sua empresa.</p>
          </div>
        } />

        {/* Catch-all Redirect */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
