import { useState, useEffect } from 'react';
import { Link, useParams } from 'react-router-dom';
import { FaWhatsapp, FaMapMarkerAlt, FaClock, FaEnvelope, FaCut, FaHeart } from 'react-icons/fa';
import { getSalonSettings } from '../services/salonSettings';

export default function PublicFooter() {
  const [salon, setSalon] = useState(getSalonSettings());
  const { companySlug } = useParams();

  useEffect(() => {
    const updateSalon = () => {
      setSalon(getSalonSettings());
    };
    window.addEventListener('salonSettingsUpdated', updateSalon);
    return () => window.removeEventListener('salonSettingsUpdated', updateSalon);
  }, []);

  const cleanPhone = (salon.whatsapp || '5511999998888').replace(/\D/g, '');
  const message = encodeURIComponent(`Olá! Gostaria de saber mais sobre os serviços do ${salon.name}.`);
  const whatsappUrl = `https://wa.me/${cleanPhone}?text=${message}`;

  // Format phone for display
  const formatPhoneDisplay = (phoneStr) => {
    if (!phoneStr) return '(11) 99999-8888';
    const cleaned = phoneStr.replace(/\D/g, '');
    if (cleaned.length === 13 && cleaned.startsWith('55')) {
      const ddd = cleaned.substring(2, 4);
      const first = cleaned.substring(4, 9);
      const second = cleaned.substring(9, 13);
      return `(${ddd}) ${first}-${second}`;
    }
    return phoneStr;
  };

  return (
    <footer className="bg-[#1C1619] text-gray-300 pt-16 pb-12 border-t border-gray-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-10 mb-12">
          {/* Col 1 - About */}
          <div className="md:col-span-1 space-y-4">
            <div className="flex items-center gap-2.5">
              <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-[#E8A5C8] to-[#D47FA6] flex items-center justify-center text-white shadow">
                <FaCut className="text-lg" />
              </div>
              <span className="text-xl font-bold text-white">{salon.name}</span>
            </div>
            <p className="text-sm text-gray-400 leading-relaxed">
              {salon.slogan}
            </p>
            <p className="text-xs text-gray-500">
              Agendamento autônomo 24 horas por dia, 7 dias por semana para você brilhar.
            </p>
          </div>

          {/* Col 2 - Quick Links */}
          <div>
            <h4 className="text-white font-semibold mb-4 text-sm uppercase tracking-wider">Navegação</h4>
            <ul className="space-y-2.5 text-sm">
              <li>
                <Link to={`/${companySlug}`} className="text-gray-400 hover:text-[#E8A5C8] transition">Início</Link>
              </li>
              <li>
                <Link to={`/${companySlug}/servicos`} className="text-gray-400 hover:text-[#E8A5C8] transition">Nossos Serviços</Link>
              </li>
              <li>
                <Link to={`/${companySlug}/agendar`} className="text-gray-400 hover:text-[#E8A5C8] transition">Agendar Online (24h)</Link>
              </li>
              <li>
                <Link to={`/${companySlug}/meus-agendamentos`} className="text-gray-400 hover:text-[#E8A5C8] transition">Meus Agendamentos</Link>
              </li>
              <li>
                <Link to={`/${companySlug}/admin/login`} className="text-gray-400 hover:text-[#E8A5C8] transition">Área Administrativa</Link>
              </li>
            </ul>
          </div>

          {/* Col 3 - Contact & WhatsApp Link */}
          <div>
            <h4 className="text-white font-semibold mb-4 text-sm uppercase tracking-wider">Contato Oficial</h4>
            <ul className="space-y-3 text-sm">
              <li className="flex items-start gap-3">
                <FaWhatsapp className="text-[#25D366] text-lg shrink-0 mt-0.5" />
                <div>
                  <span className="block text-xs text-gray-400">Telefone & WhatsApp:</span>
                  <a
                    href={whatsappUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-white hover:text-[#25D366] font-medium underline decoration-dotted transition"
                  >
                    {formatPhoneDisplay(salon.whatsapp)}
                  </a>
                </div>
              </li>
              <li className="flex items-start gap-3">
                <FaEnvelope className="text-[#D47FA6] text-sm shrink-0 mt-1" />
                <div>
                  <span className="block text-xs text-gray-400">E-mail:</span>
                  <span className="text-gray-300">{salon.email}</span>
                </div>
              </li>
              <li className="flex items-start gap-3">
                <FaMapMarkerAlt className="text-[#E8A5C8] text-sm shrink-0 mt-1" />
                <div>
                  <span className="block text-xs text-gray-400">Endereço:</span>
                  <span className="text-gray-300 block">{salon.address}</span>
                  <span className="text-gray-400 text-xs">{salon.cityState}</span>
                </div>
              </li>
            </ul>
          </div>

          {/* Col 4 - Working Hours */}
          <div>
            <h4 className="text-white font-semibold mb-4 text-sm uppercase tracking-wider">Horários</h4>
            <div className="flex items-start gap-3 text-sm">
              <FaClock className="text-[#E8A5C8] text-sm shrink-0 mt-1" />
              <div className="space-y-1 text-gray-300 text-xs">
                {salon.workingHoursText ? (
                  salon.workingHoursText.split('|').map((part, idx) => (
                    <p key={idx} className="leading-relaxed">{part.trim()}</p>
                  ))
                ) : (
                  <>
                    <p>Segunda a Sexta: 09:00 - 19:00</p>
                    <p>Sábado: 09:00 - 17:00</p>
                    <p>Domingo: Fechado</p>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="pt-8 border-t border-gray-800 flex flex-col sm:flex-row items-center justify-between text-xs text-gray-500 gap-4 text-center sm:text-left">
          <p>© {new Date().getFullYear()} {salon.name}. Todos os direitos reservados.</p>
          <p className="sm:text-right leading-relaxed">
            <span>Desenvolvido com </span>
            <FaHeart className="text-[#D47FA6] inline-block -mt-1 mx-0.5" />
            <span> para salões de beleza de alta performance</span>
          </p>
        </div>
      </div>
    </footer>
  );
}
