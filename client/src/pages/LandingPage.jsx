import { useState, useEffect } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  FaCalendarAlt, FaStar, FaMapMarkerAlt, 
  FaClock, FaArrowRight, 
  FaGem, FaWhatsapp 
} from 'react-icons/fa';
import PublicNavbar from '../components/PublicNavbar';
import PublicFooter from '../components/PublicFooter';
import FloatingWhatsAppButton from '../components/FloatingWhatsAppButton';
import GallerySection from '../components/GallerySection';
import { getSalonSettings } from '../services/salonSettings';
import { servicesAPI, testimonialsAPI } from '../services/api';
import { getNicheData } from '../constants/niches';

export default function LandingPage() {
  const navigate = useNavigate();
  const { companySlug } = useParams();
  const [salon, setSalon] = useState(getSalonSettings());
  const [services, setServices] = useState([]);
  const [testimonials, setTestimonials] = useState([]);
  const [loading, setLoading] = useState(true);

  const nicheKey = salon.niche || 
    (/barbearia|barber/i.test(salon.name || '') ? 'barbearia' : 
     /estetica|spa|clinica/i.test(salon.name || '') ? 'estetica' : 
     /esmalte|unha|nail/i.test(salon.name || '') ? 'esmalteria' : 'salao');
  const nicheConfig = getNicheData(nicheKey);
  const theme = nicheConfig.theme;
  const isBarber = nicheKey === 'barbearia';

  useEffect(() => {
    const updateSalon = () => setSalon(getSalonSettings());
    window.addEventListener('salonSettingsUpdated', updateSalon);
    return () => window.removeEventListener('salonSettingsUpdated', updateSalon);
  }, []);

  useEffect(() => {
    async function fetchServices() {
      try {
        setLoading(true);
        const data = await servicesAPI.getAll('active');
        setServices(data || []);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    fetchServices();
  }, []);

  useEffect(() => {
    async function fetchTestimonials() {
      try {
        const data = await testimonialsAPI.getAll();
        setTestimonials(data || []);
      } catch (err) {
        console.error(err);
      }
    }
    fetchTestimonials();
  }, []);

  const averageRating = testimonials.length > 0 
    ? (testimonials.reduce((acc, t) => acc + Number(t.rating), 0) / testimonials.length).toFixed(1) 
    : '5.0';

  const featuredServices = services.slice(0, 6);

  const cleanPhone = (salon.whatsapp || '5511999998888').replace(/\D/g, '');
  const formatPhoneDisplay = (phoneStr) => {
    if (!phoneStr) return '(11) 99999-8888';
    const cleaned = phoneStr.replace(/\D/g, '');
    if (cleaned.length === 13 && cleaned.startsWith('55')) {
      return `(${cleaned.substring(2, 4)}) ${cleaned.substring(4, 9)}-${cleaned.substring(9, 13)}`;
    }
    return phoneStr;
  };

  const mapAddressQuery = encodeURIComponent(`${salon.address || ''}, ${salon.cityState || ''}`);
  const mapEmbedUrl = `https://www.google.com/maps?q=${mapAddressQuery}&output=embed`;

  return (
    <div className={`min-h-screen ${theme.pageBg} font-sans ${theme.pageText} flex flex-col transition-colors duration-300`}>
      <PublicNavbar />

      {/* Hero Section */}
      <section className="relative pt-28 pb-20 lg:pt-36 lg:pb-32 overflow-hidden">
        {/* Background custom hero image with overlay */}
        <div className="absolute inset-0 z-0">
          <img
            src={salon.heroImage}
            alt="Hero Background"
            className="w-full h-full object-cover object-center transform scale-105 transition-transform duration-1000"
          />
          <div className={`absolute inset-0 bg-gradient-to-r ${theme.heroOverlay} backdrop-blur-[2px]`} />
        </div>

        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl text-white space-y-6">
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/15 backdrop-blur-md border border-white/25 text-xs font-medium tracking-wide uppercase"
            >
              <span>{nicheConfig.icon}</span>
              <span>{salon.badge || nicheConfig.badge}</span>
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
              className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight leading-tight"
            >
              {isBarber ? 'O melhor estilo e cuidado para você no ' : 'Sua experiência de cuidado no '}
              <span className={`bg-gradient-to-r ${theme.heroSubtitleGradient} bg-clip-text text-transparent`}>
                {salon.name}
              </span>
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="text-lg sm:text-xl text-gray-200 leading-relaxed max-w-2xl"
            >
              {salon.slogan}. Agende online o seu horário com autonomia 24 horas por dia e viva uma experiência única.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.3 }}
              className="flex flex-wrap items-center gap-4 pt-4"
            >
              <Link
                to={`/${companySlug}/agendar`}
                className={`inline-flex items-center gap-3 px-8 py-4 rounded-full ${theme.buttonClass} text-white font-semibold text-base shadow-xl hover:shadow-2xl hover:scale-105 transition-all duration-300`}
              >
                <FaCalendarAlt />
                <span>Agendar Meu Horário Online</span>
                <FaArrowRight className="text-sm ml-1" />
              </Link>

              <Link
                to={`/${companySlug}/servicos`}
                className="inline-flex items-center gap-2 px-6 py-4 rounded-full bg-white/15 hover:bg-white/25 text-white font-medium text-base border border-white/30 backdrop-blur-md transition-all duration-300"
              >
                <span>Conhecer Serviços</span>
              </Link>
            </motion.div>

            {/* Hero Trust Badges */}
            <div className="pt-8 grid grid-cols-3 gap-6 border-t border-white/20 max-w-xl">
              <div>
                <p className="text-2xl font-bold text-white">24h</p>
                <p className="text-xs text-gray-300">Agendamento Online</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-white">{averageRating} ★</p>
                <p className="text-xs text-gray-300">{isBarber ? 'Avaliação dos Clientes' : 'Avaliação dos Clientes'}</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-white">100%</p>
                <p className="text-xs text-gray-300">Profissionais Qualificados</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Featured Services Section */}
      <section className={`py-20 ${theme.isDark ? 'bg-[#18181B]' : 'bg-white'}`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-14">
            <span className={`text-xs font-semibold uppercase tracking-widest px-3 py-1 rounded-full ${theme.badgeClass}`}>
              Catálogo em Destaque
            </span>
            <h2 className={`text-3xl sm:text-4xl font-bold ${theme.headingColor} mt-3`}>
              Serviços em Destaque
            </h2>
            <p className="text-gray-500 mt-2">
              Escolha entre nossos procedimentos exclusivos e agende seu horário com nossos especialistas em poucos cliques.
            </p>
          </div>

          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {[1, 2, 3].map((n) => (
                <div key={n} className="h-64 rounded-2xl bg-gray-100 animate-pulse" />
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {featuredServices.map((svc) => (
                <div
                  key={svc.id}
                  className={`${theme.cardBg} rounded-2xl p-6 border ${theme.cardBorder} shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col justify-between group ${theme.cardHover}`}
                >
                  <div>
                    <div className="flex items-center justify-between mb-4">
                      <span className={`text-xs font-semibold px-3 py-1 rounded-full ${theme.tagClass}`}>
                        {svc.category || 'Serviço'}
                      </span>
                      <span className="flex items-center gap-1 text-xs text-gray-500 font-medium">
                        <FaClock className={theme.clockIcon} />
                        {svc.duration_minutes} min
                      </span>
                    </div>

                    <h3 className={`text-xl font-bold ${theme.headingColor} group-hover:opacity-80 transition-colors`}>
                      {svc.name}
                    </h3>
                    <p className="text-sm text-gray-500 mt-2 line-clamp-3 leading-relaxed">
                      {svc.description || 'Atendimento profissional e personalizado para o seu bem-estar.'}
                    </p>
                  </div>

                  <div className="mt-6 pt-5 border-t border-gray-100/20 flex items-center justify-between">
                    <div>
                      <span className="text-xs text-gray-400 block">A partir de</span>
                      <span className={`text-2xl font-extrabold ${theme.accentPrice}`}>
                        R$ {Number(svc.price).toFixed(2).replace('.', ',')}
                      </span>
                    </div>

                    <button
                      onClick={() => navigate(`/${companySlug}/agendar?serviceId=${svc.id}`)}
                      className={`inline-flex items-center gap-2 px-5 py-2.5 rounded-xl ${theme.buttonClass} text-white text-sm font-semibold shadow hover:scale-105 transition-all`}
                    >
                      <span>Agendar</span>
                      <FaArrowRight className="text-xs" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          <div className="text-center mt-12">
            <Link
              to={`/${companySlug}/servicos`}
              className={`inline-flex items-center gap-2 px-8 py-3.5 rounded-full border-2 ${theme.outlineButton} font-semibold transition-all duration-300`}
            >
              <span>Ver Todos os Serviços do Catálogo</span>
              <FaArrowRight className="text-xs" />
            </Link>
          </div>
        </div>
      </section>

      {/* Gallery Section */}
      <GallerySection />

      {/* Testimonials Section */}
      {testimonials.length > 0 && (
        <section className={`py-20 ${theme.isDark ? 'bg-[#121214]' : 'bg-gradient-to-b from-white to-gray-50/50'}`}>
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <span className={`text-xs font-semibold uppercase tracking-widest ${theme.badgeClass} px-3 py-1 rounded-full`}>
              Depoimentos Reais
            </span>
            <h2 className={`text-3xl sm:text-4xl font-bold ${theme.headingColor} mt-3`}>
              O Que Nossos Clientes Dizem
            </h2>
            <p className="text-gray-500 mt-2">
              A satisfação de quem confia na nossa equipe para cuidar do seu estilo e bem-estar.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {testimonials.map((t) => (
              <div
                key={t.id}
                className={`${theme.cardBg} rounded-2xl p-7 shadow-md border ${theme.cardBorder} flex flex-col justify-between hover:-translate-y-1 transition-all duration-300`}
              >
                <div>
                  <div className="flex items-center gap-1 text-amber-400 mb-4">
                    {[...Array(t.rating)].map((_, idx) => (
                      <FaStar key={idx} />
                    ))}
                  </div>
                  <p className="text-gray-500 text-sm italic leading-relaxed">
                    "{t.comment}"
                  </p>
                </div>

                <div className="mt-6 pt-4 border-t border-gray-100/20 flex items-center gap-3">
                  <img
                    src={`https://ui-avatars.com/api/?name=${encodeURIComponent(t.client?.name || 'Cliente')}&background=${theme.primaryLight.replace('#','')}&color=${theme.primaryColor.replace('#','')}`}
                    alt={t.client?.name || 'Cliente'}
                    className="w-12 h-12 rounded-full object-cover border-2"
                    style={{ borderColor: theme.primaryColor }}
                  />
                  <div>
                    <h4 className={`font-bold text-sm ${theme.headingColor}`}>{t.client?.name || 'Cliente'}</h4>
                    <span className="text-xs text-gray-400 block">Cliente</span>
                    {t.service_name && (
                      <span className={`text-[11px] ${theme.accentText} font-medium block mt-0.5`}>
                        {t.service_name}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
      )}

      {/* Contact & Map Section */}
      <section className={`py-20 ${theme.isDark ? 'bg-[#18181B] border-zinc-800' : 'bg-white border-gray-100'} border-t`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            {/* Left Info */}
            <div className="space-y-6">
              <span className={`text-xs font-semibold uppercase tracking-widest ${theme.badgeClass} px-3 py-1 rounded-full`}>
                Onde Estamos
              </span>
              <h2 className={`text-3xl sm:text-4xl font-bold ${theme.headingColor}`}>
                Visite Nosso Espaço
              </h2>
              <p className="text-gray-500 leading-relaxed">
                Venha desfrutar do nosso ambiente planejado nos mínimos detalhes para o seu conforto e relaxamento.
              </p>

              <div className="space-y-4 pt-2">
                <div className={`flex items-start gap-4 p-4 rounded-2xl ${theme.infoCardBg}`}>
                  <div className={`p-3 rounded-xl bg-white ${theme.infoCardIcon} shadow-sm`}>
                    <FaMapMarkerAlt className="text-lg" />
                  </div>
                  <div>
                    <h4 className={`font-bold ${theme.headingColor} text-sm`}>Endereço</h4>
                    <p className="text-sm text-gray-500 mt-0.5">{salon.address}</p>
                    <p className="text-xs text-gray-400">{salon.cityState}</p>
                  </div>
                </div>

                <div className={`flex items-start gap-4 p-4 rounded-2xl ${theme.infoCardBg}`}>
                  <div className="p-3 rounded-xl bg-white text-[#25D366] shadow-sm">
                    <FaWhatsapp className="text-lg" />
                  </div>
                  <div>
                    <h4 className={`font-bold ${theme.headingColor} text-sm`}>Telefone e WhatsApp</h4>
                    <a
                      href={`https://wa.me/${cleanPhone}?text=${encodeURIComponent('Olá, gostaria de falar com a equipe.')}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={`text-sm ${theme.accentText} hover:underline font-medium mt-0.5 block`}
                    >
                      {formatPhoneDisplay(salon.whatsapp)}
                    </a>
                  </div>
                </div>

                <div className={`flex items-start gap-4 p-4 rounded-2xl ${theme.infoCardBg}`}>
                  <div className={`p-3 rounded-xl bg-white ${theme.infoCardIcon} shadow-sm`}>
                    <FaClock className="text-lg" />
                  </div>
                  <div>
                    <h4 className={`font-bold ${theme.headingColor} text-sm`}>Horário de Funcionamento</h4>
                    <p className="text-sm text-gray-500 mt-0.5">{salon.workingHoursText}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Map Visual / Interactive Embed */}
            <div className="rounded-3xl overflow-hidden shadow-2xl border-4 border-white bg-gray-100 h-96 relative">
              <iframe
                title="Localização"
                src={mapEmbedUrl}
                width="100%"
                height="100%"
                style={{ border: 0 }}
                allowFullScreen=""
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Floating WhatsApp Button */}
      <FloatingWhatsAppButton />

      <PublicFooter />
    </div>
  );
}
