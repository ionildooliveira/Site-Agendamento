import { useState, useEffect } from 'react';
import { Link, useLocation, useParams } from 'react-router-dom';
import { FaCalendarAlt, FaLock, FaBars, FaTimes } from 'react-icons/fa';
import { getSalonSettings } from '../services/salonSettings';
import { getNicheData } from '../constants/niches';

export default function PublicNavbar() {
  const [salon, setSalon] = useState(getSalonSettings());
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const location = useLocation();
  const { companySlug } = useParams();

  const nicheKey = salon.niche || 
    (/barbearia|barber/i.test(salon.name || '') ? 'barbearia' : 
     /estetica|spa|clinica/i.test(salon.name || '') ? 'estetica' : 
     /esmalte|unha|nail/i.test(salon.name || '') ? 'esmalteria' : 'salao');
  const nicheConfig = getNicheData(nicheKey);
  const theme = nicheConfig.theme;

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 15);
    };
    const updateSalon = () => {
      setSalon(getSalonSettings());
    };
    window.addEventListener('scroll', handleScroll);
    window.addEventListener('salonSettingsUpdated', updateSalon);
    return () => {
      window.removeEventListener('scroll', handleScroll);
      window.removeEventListener('salonSettingsUpdated', updateSalon);
    };
  }, []);

  const navLinks = [
    { name: 'Início', path: `/${companySlug}` },
    { name: 'Serviços', path: `/${companySlug}/servicos` },
    { name: 'Agendar Horário', path: `/${companySlug}/agendar` },
    { name: 'Meus Agendamentos', path: `/${companySlug}/meus-agendamentos` },
  ];

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-40 transition-all duration-300 ${
        scrolled
          ? (theme.isDark ? 'bg-[#18181B]/95 backdrop-blur-md shadow-sm py-3.5 border-b border-zinc-800' : 'bg-white/95 backdrop-blur-md shadow-sm py-3.5 border-b ' + theme.navbarBorder)
          : (theme.isDark ? 'bg-[#121214]/80 backdrop-blur-sm py-4' : 'bg-white/80 backdrop-blur-sm py-4')
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between">
        {/* Logo */}
        <Link to={`/${companySlug}`} className="flex items-center gap-2.5 group">
          <div className={`w-10 h-10 rounded-full ${theme.navbarIconBg} flex items-center justify-center text-white shadow-md group-hover:scale-105 transition-transform text-lg`}>
            <span>{nicheConfig.icon}</span>
          </div>
          <div>
            <span className={`text-xl font-bold bg-gradient-to-r ${theme.navbarLogoText} bg-clip-text text-transparent block leading-tight`}>
              {salon.name}
            </span>
            <span className="text-[10px] text-gray-400 tracking-wider uppercase font-medium">
              Agendamento Online
            </span>
          </div>
        </Link>

        {/* Desktop Menu */}
        <nav className="hidden md:flex items-center gap-1 lg:gap-2">
          {navLinks.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                  isActive
                    ? theme.navbarActiveItem
                    : (theme.isDark ? 'text-zinc-300 hover:bg-zinc-800' : 'text-gray-700 hover:bg-gray-50')
                }`}
              >
                {item.name}
              </Link>
            );
          })}
        </nav>

        {/* Action Buttons */}
        <div className="hidden md:flex items-center gap-3">
          <Link
            to={`/${companySlug}/admin`}
            className={`text-xs font-medium text-gray-400 hover:${theme.accentText} flex items-center gap-1.5 px-3 py-2 rounded-lg hover:bg-black/5 transition`}
            title="Acesso Administrativo"
          >
            <FaLock className="text-xs" />
            <span>Admin</span>
          </Link>

          <Link
            to={`/${companySlug}/agendar`}
            className={`inline-flex items-center gap-2 px-5 py-2.5 rounded-full ${theme.buttonClass} text-white font-medium text-sm shadow-md transition-all transform hover:-translate-y-0.5`}
          >
            <FaCalendarAlt className="text-xs" />
            <span>Agendar Agora</span>
          </Link>
        </div>

        {/* Mobile menu toggle */}
        <button
          onClick={() => setMenuOpen(!menuOpen)}
          className={`md:hidden p-2 rounded-lg transition ${theme.isDark ? 'text-zinc-200 hover:bg-zinc-800' : 'text-gray-700 hover:bg-gray-100'}`}
          aria-label="Abrir menu"
        >
          {menuOpen ? <FaTimes className="text-xl" /> : <FaBars className="text-xl" />}
        </button>
      </div>

      {/* Mobile Drawer */}
      {menuOpen && (
        <div className={`md:hidden ${theme.isDark ? 'bg-[#18181B] border-zinc-800 text-zinc-100' : 'bg-white border-gray-100'} border-b shadow-lg px-4 pt-3 pb-5 space-y-2 animate-fadeIn`}>
          {navLinks.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                onClick={() => setMenuOpen(false)}
                className={`block px-4 py-2.5 rounded-xl text-sm font-medium ${
                  isActive ? theme.navbarActiveItem : (theme.isDark ? 'text-zinc-300' : 'text-gray-700')
                }`}
              >
                {item.name}
              </Link>
            );
          })}
          <div className="pt-3 border-t border-gray-200/20 flex flex-col gap-2">
            <Link
              to={`/${companySlug}/agendar`}
              onClick={() => setMenuOpen(false)}
              className={`w-full text-center py-3 rounded-xl ${theme.buttonClass} text-white font-medium text-sm shadow`}
            >
              Agendar Horário
            </Link>
            <Link
              to={`/${companySlug}/admin`}
              onClick={() => setMenuOpen(false)}
              className={`w-full text-center py-2 text-xs text-gray-400 hover:${theme.accentText}`}
            >
              Acesso ao Painel Administrativo
            </Link>
          </div>
        </div>
      )}
    </header>
  );
}
