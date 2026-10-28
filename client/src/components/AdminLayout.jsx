import { useEffect, useState } from 'react';
import { Outlet, Link, useNavigate, useLocation, Navigate, useParams } from 'react-router-dom';
import { getSalonSettings } from '../services/salonSettings';
import { getNicheConfig } from '../constants/niches';
import { 
  FaChartPie, FaCalendarAlt, FaCut, FaUsers, 
  FaCog, FaSignOutAlt, FaBars, FaTimes, FaUserTie, FaStar, FaImage, FaClock
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
  const nicheConfig = getNicheConfig(salon?.niche || 'salao');

  useEffect(() => {
    const updateSalon = () => setSalon(getSalonSettings());
    window.addEventListener('salonSettingsUpdated', updateSalon);
    return () => window.removeEventListener('salonSettingsUpdated', updateSalon);
  }, []);

  const token = localStorage.getItem(`studio_beauty_token_${companySlug}`);
  if (!token) {
    return <Navigate to={`/${companySlug}/admin`} replace />;
  }

  const handleLogout = () => {
    localStorage.removeItem(`studio_beauty_token_${companySlug}`);
    localStorage.removeItem(`studio_beauty_admin_${companySlug}`);
    navigate(`/${companySlug}/admin`);
  };

  const navItems = [
    { label: 'Dashboard', path: `/${companySlug}/admin/painel`, icon: <FaChartPie /> },
    { label: 'Agenda', path: `/${companySlug}/admin/painel/agenda`, icon: <FaCalendarAlt /> },
    { label: 'Monitor de Vagas', path: `/${companySlug}/admin/painel/vagas`, icon: <FaClock /> },
    { label: 'Serviços', path: `/${companySlug}/admin/painel/servicos`, icon: <FaCut /> },
    { label: 'Profissionais', path: `/${companySlug}/admin/painel/profissionais`, icon: <FaUserTie /> },
    { label: 'Clientes', path: `/${companySlug}/admin/painel/clientes`, icon: <FaUsers /> },
    { label: 'Depoimentos', path: `/${companySlug}/admin/painel/depoimentos`, icon: <FaStar /> },
    { label: 'Galeria', path: `/${companySlug}/admin/painel/galeria`, icon: <FaImage /> },
    { label: 'Configurações', path: `/${companySlug}/admin/painel/configuracoes`, icon: <FaCog /> },
  ];

  const isActive = (path) => {
    if (path === `/${companySlug}/admin/painel`) {
      return location.pathname === `/${companySlug}/admin/painel` || location.pathname === `/${companySlug}/admin/painel/`;
    }
    return location.pathname.startsWith(path);
  };

  return (
    <div className="min-h-screen bg-slate-50/70 flex flex-col md:flex-row text-slate-800">
      
      {/* Mobile Header */}
      <header className="md:hidden bg-white/95 border-b border-slate-200 backdrop-blur-md px-6 py-4 flex justify-between items-center z-40 sticky top-0 shadow-sm">
        <div className="flex items-center gap-2">
          <span className="text-xl">{nicheConfig.icon}</span>
          <span className="text-lg font-bold font-heading text-slate-900 truncate max-w-[200px]">{salon.name || 'I.O.S AgendeJá'}</span>
        </div>
        <button 
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="text-slate-600 p-2 text-xl"
        >
          {mobileMenuOpen ? <FaTimes /> : <FaBars />}
        </button>
      </header>

      {/* Sidebar Navigation */}
      <aside className={`
        fixed md:sticky top-[53px] md:top-0 left-0 bottom-0 z-30
        w-64 bg-white/95 backdrop-blur-lg border-r border-slate-200 px-5 py-8 flex flex-col justify-between
        transform md:transform-none transition-transform duration-300 shadow-sm
        ${mobileMenuOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
      `}>
        <div className="flex flex-col gap-8">
          {/* Logo & Segment Badge */}
          <div className="hidden md:block px-3">
            <div className="flex items-center gap-2.5">
              <span className="text-2xl p-1.5 rounded-xl bg-slate-100 border border-slate-200 shadow-xs leading-none">
                {nicheConfig.icon}
              </span>
              <div className="overflow-hidden">
                <span className="text-xl font-bold font-heading block tracking-wide text-slate-900 truncate">
                  {salon.name || 'I.O.S AgendeJá'}
                </span>
                <span 
                  className="text-[10px] font-bold tracking-wider uppercase inline-block px-2 py-0.5 rounded-full mt-0.5 border"
                  style={{
                    backgroundColor: `${nicheConfig.theme.primaryColor}12`,
                    color: nicheConfig.theme.primaryColor,
                    borderColor: `${nicheConfig.theme.primaryColor}30`,
                  }}
                >
                  {nicheConfig.name}
                </span>
              </div>
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="flex flex-col gap-1.5">
            {navItems.map((item) => (
              <Link 
                key={item.path}
                to={item.path}
                onClick={() => setMobileMenuOpen(false)}
                className={`sidebar-link ${isActive(item.path) ? 'active' : ''}`}
              >
                <span className="text-base">{item.icon}</span>
                <span className="text-xs font-semibold tracking-wide">{item.label}</span>
              </Link>
            ))}
          </nav>
        </div>

        {/* Footer Sidebar (User Info & Logout) */}
        <div className="border-t border-slate-200 pt-5 flex flex-col gap-4">
          <div className="flex items-center gap-3.5 px-2">
            <div 
              className="w-9 h-9 rounded-full p-0.5 flex items-center justify-center font-bold text-sm shadow-xs"
              style={{ background: 'var(--theme-gradient)' }}
            >
              <div className="w-full h-full bg-white rounded-full flex items-center justify-center" style={{ color: nicheConfig.theme.primaryColor }}>
                {adminName.charAt(0).toUpperCase()}
              </div>
            </div>
            <div className="overflow-hidden">
              <p className="text-xs font-bold text-slate-900 truncate leading-none mb-1">{adminName}</p>
              <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider">Administrador</span>
            </div>
          </div>

          <button 
            onClick={handleLogout}
            className="flex items-center gap-3 w-full px-4 py-2.5 text-xs font-bold text-red-500 uppercase tracking-wider rounded-xl hover:bg-red-50 transition-colors cursor-pointer"
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
