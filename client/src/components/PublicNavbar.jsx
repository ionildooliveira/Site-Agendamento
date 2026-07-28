import { useState, useEffect } from 'react';
import { Link, useLocation, useParams } from 'react-router-dom';
import { FaCalendarAlt, FaCut, FaLock, FaBars, FaTimes } from 'react-icons/fa';
import { getSalonSettings } from '../services/salonSettings';

export default function PublicNavbar() {
  const [salon, setSalon] = useState(getSalonSettings());
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const location = useLocation();
  const { companySlug } = useParams();

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
          ? 'bg-white/90 backdrop-blur-md shadow-sm py-3.5 border-b border-[#F5D8E3]'
          : 'bg-white/80 backdrop-blur-sm py-4'
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between">
        {/* Logo */}
        <Link to={`/${companySlug}`} className="flex items-center gap-2.5 group">
          <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-[#E8A5C8] to-[#D47FA6] flex items-center justify-center text-white shadow-md group-hover:scale-105 transition-transform">
            <FaCut className="text-lg" />
          </div>
          <div>
            <span className="text-xl font-bold bg-gradient-to-r from-[#6B4E5A] to-[#D47FA6] bg-clip-text text-transparent block leading-tight">
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
                    ? 'bg-[#FDF2F7] text-[#D47FA6] font-semibold'
                    : 'text-[#6B4E5A] hover:bg-gray-50'
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
            to="/admin/login"
            className="text-xs font-medium text-gray-500 hover:text-[#D47FA6] flex items-center gap-1.5 px-3 py-2 rounded-lg hover:bg-gray-50 transition"
            title="Acesso Administrativo"
          >
            <FaLock className="text-xs" />
            <span>Admin</span>
          </Link>

          <Link
            to={`/${companySlug}/agendar`}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-gradient-to-r from-[#D47FA6] to-[#E8A5C8] text-white font-medium text-sm shadow-md hover:shadow-lg hover:brightness-105 transition-all transform hover:-translate-y-0.5"
          >
            <FaCalendarAlt className="text-xs" />
            <span>Agendar Agora</span>
          </Link>
        </div>

        {/* Mobile menu toggle */}
        <button
          onClick={() => setMenuOpen(!menuOpen)}
          className="md:hidden p-2 text-[#6B4E5A] hover:bg-gray-100 rounded-lg transition"
          aria-label="Abrir menu"
        >
          {menuOpen ? <FaTimes className="text-xl" /> : <FaBars className="text-xl" />}
        </button>
      </div>

      {/* Mobile Drawer */}
      {menuOpen && (
        <div className="md:hidden bg-white border-b border-[#F5D8E3] shadow-lg px-4 pt-3 pb-5 space-y-2 animate-fadeIn">
          {navLinks.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                onClick={() => setMenuOpen(false)}
                className={`block px-4 py-2.5 rounded-xl text-sm font-medium ${
                  isActive ? 'bg-[#FDF2F7] text-[#D47FA6] font-semibold' : 'text-[#6B4E5A]'
                }`}
              >
                {item.name}
              </Link>
            );
          })}
          <div className="pt-3 border-t border-gray-100 flex flex-col gap-2">
            <Link
              to={`/${companySlug}/agendar`}
              onClick={() => setMenuOpen(false)}
              className="w-full text-center py-3 rounded-xl bg-gradient-to-r from-[#D47FA6] to-[#E8A5C8] text-white font-medium text-sm shadow"
            >
              Agendar Horário
            </Link>
            <Link
              to="/admin/login"
              onClick={() => setMenuOpen(false)}
              className="w-full text-center py-2 text-xs text-gray-500 hover:text-[#D47FA6]"
            >
              Acesso ao Painel Administrativo
            </Link>
          </div>
        </div>
      )}
    </header>
  );
}
