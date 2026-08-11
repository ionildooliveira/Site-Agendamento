import { useEffect, useState } from 'react';
import { Outlet, Link, useNavigate, useLocation, Navigate, useParams } from 'react-router-dom';
import { getSalonSettings } from '../services/salonSettings';
import { 
  FaChartPie, FaCalendarAlt, FaCut, FaUsers, 
  FaCog, FaSignOutAlt, FaBars, FaTimes, FaUserTie, FaStar
} from 'react-icons/fa';

export default function AdminLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const { companySlug } = useParams();
  const [adminName] = useState(() => {
    const adminData = localStorage.getItem(`studio_beauty_admin_${companySlug}`);
    if (adminData) {
      try {
        const admin = JSON.parse(adminData);
        return admin.name || 'Administrador';
      } catch (e) {
        console.error(e);
      }
    }
    return 'Administrador';
  });
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [salon, setSalon] = useState(getSalonSettings());

  useEffect(() => {
    const updateSalon = () => setSalon(getSalonSettings());
    window.addEventListener('salonSettingsUpdated', updateSalon);
    return () => window.removeEventListener('salonSettingsUpdated', updateSalon);
  }, []);

  const token = localStorage.getItem(`studio_beauty_token_${companySlug}`);
  if (!token) {
    return <Navigate to={`/${companySlug}/admin/login`} replace />;
  }

  const handleLogout = () => {
    localStorage.removeItem(`studio_beauty_token_${companySlug}`);
    localStorage.removeItem(`studio_beauty_admin_${companySlug}`);
    navigate(`/${companySlug}/admin/login`);
  };

  const navItems = [
    { label: 'Dashboard', path: `/${companySlug}/admin`, icon: <FaChartPie /> },
    { label: 'Agenda', path: `/${companySlug}/admin/agenda`, icon: <FaCalendarAlt /> },
    { label: 'Serviços', path: `/${companySlug}/admin/servicos`, icon: <FaCut /> },
    { label: 'Profissionais', path: `/${companySlug}/admin/profissionais`, icon: <FaUserTie /> },
    { label: 'Clientes', path: `/${companySlug}/admin/clientes`, icon: <FaUsers /> },
    { label: 'Depoimentos', path: `/${companySlug}/admin/depoimentos`, icon: <FaStar /> },
    { label: 'Configurações', path: `/${companySlug}/admin/configuracoes`, icon: <FaCog /> },
  ];

  const isActive = (path) => {
    if (path === `/${companySlug}/admin`) {
      return location.pathname === `/${companySlug}/admin` || location.pathname === `/${companySlug}/admin/`;
    }
    return location.pathname.startsWith(path);
  };

  return (
    <div className="min-h-screen bg-cream flex flex-col md:flex-row">
      
      {/* Mobile Header */}
      <header className="md:hidden bg-white/95 border-b border-rose-light/20 backdrop-blur-md px-6 py-4 flex justify-between items-center z-40 sticky top-0 shadow-sm">
        <span className="text-xl font-bold text-gradient font-heading">{salon.name || 'Studio Beauty'}</span>
        <button 
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="text-mink p-2 text-xl"
        >
          {mobileMenuOpen ? <FaTimes /> : <FaBars />}
        </button>
      </header>

      {/* Sidebar Navigation */}
      <aside className={`
        fixed md:sticky top-[53px] md:top-0 left-0 bottom-0 z-30
        w-64 bg-white/80 backdrop-blur-lg border-r border-rose-light/20 px-5 py-8 flex flex-col justify-between
        transform md:transform-none transition-transform duration-300
        ${mobileMenuOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
      `}>
        <div className="flex flex-col gap-10">
          {/* Logo */}
          <div className="hidden md:block px-3">
            <span className="text-2xl font-bold text-gradient font-heading block tracking-wide">{salon.name || 'Studio Beauty'}</span>
            <span className="text-[9px] text-gray-400 font-bold tracking-widest uppercase mt-1 block">Painel de Controle</span>
          </div>

          {/* Navigation Links */}
          <nav className="flex flex-col gap-2">
            {navItems.map((item) => (
              <Link 
                key={item.path}
                to={item.path}
                onClick={() => setMobileMenuOpen(false)}
                className={`sidebar-link ${isActive(item.path) ? 'active shadow-rose' : ''}`}
              >
                <span className="text-base">{item.icon}</span>
                <span className="text-xs font-semibold tracking-wide">{item.label}</span>
              </Link>
            ))}
          </nav>
        </div>

        {/* Footer Sidebar (User Info & Logout) */}
        <div className="border-t border-rose-light/15 pt-5 flex flex-col gap-4">
          <div className="flex items-center gap-3.5 px-2">
            <div className="w-9 h-9 rounded-full bg-gradient-rose-gold p-0.5 flex items-center justify-center font-bold text-rose-dark font-heading text-sm shadow-rose">
              <div className="w-full h-full bg-white rounded-full flex items-center justify-center">
                {adminName.charAt(0)}
              </div>
            </div>
            <div className="overflow-hidden">
              <p className="text-xs font-bold text-gray-900 truncate leading-none mb-1">{adminName}</p>
              <span className="text-[9px] text-gray-400 font-bold uppercase tracking-wider">Administrador</span>
            </div>
          </div>

          <button 
            onClick={handleLogout}
            className="flex items-center gap-3 w-full px-4 py-3 text-xs font-bold text-red-500 uppercase tracking-wider rounded-xl hover:bg-red-50 transition-colors cursor-pointer"
          >
            <FaSignOutAlt className="text-sm" />
            <span>Sair</span>
          </button>
        </div>
      </aside>

      {/* Main Admin Area */}
      <main className="flex-1 px-6 md:px-10 py-10 overflow-y-auto">
        <Outlet />
      </main>
    </div>
  );
}
