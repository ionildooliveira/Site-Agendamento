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
import { getSalonSettings } from '../services/salonSettings';
import { servicesAPI, testimonialsAPI } from '../services/api';

export default function LandingPage() {
  const navigate = useNavigate();
  const { companySlug } = useParams();
  const [salon, setSalon] = useState(getSalonSettings());
  const [services, setServices] = useState([]);
  const [testimonials, setTestimonials] = useState([]);
  const [loading, setLoading] = useState(true);

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
    <div className="min-h-screen bg-[#FFF8FA] font-sans text-[#4A323D] flex flex-col">
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
          <div className="absolute inset-0 bg-gradient-to-r from-[#2B1B22]/90 via-[#4A2D3A]/80 to-[#D47FA6]/60 backdrop-blur-[2px]" />
        </div>

        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl text-white space-y-6">
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/15 backdrop-blur-md border border-white/25 text-xs font-medium tracking-wide uppercase"
            >
              <FaGem className="text-[#F5D8E3]" />
              <span>Salão de Beleza & Estética Premium</span>
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
              className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight leading-tight"
            >
              Sua beleza merece o cuidado do{' '}
              <span className="bg-gradient-to-r from-[#FADCE6] via-white to-[#E8A5C8] bg-clip-text text-transparent">
                {salon.name}
              </span>
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="text-lg sm:text-xl text-gray-200 leading-relaxed max-w-2xl"
            >
              {salon.slogan}. Agende online o seu horário com autonomia 24 horas por dia e viva uma experiência única de autocuidado.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.3 }}
              className="flex flex-wrap items-center gap-4 pt-4"
            >
              <Link
                to={`/${companySlug}/agendar`}
                className="inline-flex items-center gap-3 px-8 py-4 rounded-full bg-gradient-to-r from-[#D47FA6] to-[#E8A5C8] text-white font-semibold text-base shadow-xl hover:shadow-2xl hover:scale-105 transition-all duration-300"
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
                <p className="text-xs text-gray-300">Avaliação das Clientes</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-white">100%</p>
                <p className="text-xs text-gray-300">Especialistas Qualificadas</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Featured Services Section */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-14">
            <span className="text-xs font-semibold uppercase tracking-widest text-[#D47FA6] bg-[#FDF2F7] px-3 py-1 rounded-full">
              Catálogo em Destaque
            </span>
            <h2 className="text-3xl sm:text-4xl font-bold text-[#4A323D] mt-3">
              Serviços em Destaque
            </h2>
            <p className="text-gray-600 mt-2">
              Escolha entre nossos tratamentos exclusivos e agende seu horário com nossas especialistas em poucos cliques.
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
                  className="bg-[#FFFBFD] rounded-2xl p-6 border border-[#F5D8E3]/60 hover:border-[#D47FA6] shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col justify-between group"
                >
                  <div>
                    <div className="flex items-center justify-between mb-4">
                      <span className="text-xs font-semibold px-3 py-1 rounded-full bg-[#FDF2F7] text-[#D47FA6]">
                        {svc.category || 'Serviço'}
                      </span>
                      <span className="flex items-center gap-1 text-xs text-gray-500 font-medium">
                        <FaClock className="text-[#D47FA6]" />
                        {svc.duration_minutes} min
                      </span>
                    </div>

                    <h3 className="text-xl font-bold text-[#4A323D] group-hover:text-[#D47FA6] transition-colors">
                      {svc.name}
                    </h3>
                    <p className="text-sm text-gray-600 mt-2 line-clamp-3 leading-relaxed">
                      {svc.description || 'Atendimento profissional e personalizado para o seu bem-estar.'}
                    </p>
                  </div>

                  <div className="mt-6 pt-5 border-t border-[#F5D8E3]/40 flex items-center justify-between">
                    <div>
                      <span className="text-xs text-gray-400 block">A partir de</span>
                      <span className="text-2xl font-extrabold text-[#6B4E5A]">
                        R$ {Number(svc.price).toFixed(2).replace('.', ',')}
                      </span>
                    </div>

                    <button
                      onClick={() => navigate(`/${companySlug}/agendar?serviceId=${svc.id}`)}
                      className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#D47FA6] to-[#E8A5C8] text-white text-sm font-semibold shadow hover:shadow-md hover:scale-105 transition-all"
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
              className="inline-flex items-center gap-2 px-8 py-3.5 rounded-full border-2 border-[#D47FA6] text-[#D47FA6] font-semibold hover:bg-[#D47FA6] hover:text-white transition-all duration-300"
            >
              <span>Ver Todos os Serviços do Catálogo</span>
              <FaArrowRight className="text-xs" />
            </Link>
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      {testimonials.length > 0 && (
        <section className="py-20 bg-gradient-to-b from-[#FFF8FA] to-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <span className="text-xs font-semibold uppercase tracking-widest text-[#D47FA6] bg-[#FDF2F7] px-3 py-1 rounded-full">
              Depoimentos Reais
            </span>
            <h2 className="text-3xl sm:text-4xl font-bold text-[#4A323D] mt-3">
              O Que Nossas Clientes Dizem
            </h2>
            <p className="text-gray-600 mt-2">
              A satisfação de quem confia na nossa equipe para cuidar da sua beleza.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {testimonials.map((t) => (
              <div
                key={t.id}
                className="bg-white rounded-2xl p-7 shadow-md border border-[#F5D8E3]/50 flex flex-col justify-between hover:-translate-y-1 transition-all duration-300"
              >
                <div>
                  <div className="flex items-center gap-1 text-amber-400 mb-4">
                    {[...Array(t.rating)].map((_, idx) => (
                      <FaStar key={idx} />
                    ))}
                  </div>
                  <p className="text-gray-600 text-sm italic leading-relaxed">
                    "{t.comment}"
                  </p>
                </div>

                <div className="mt-6 pt-4 border-t border-gray-100 flex items-center gap-3">
                  <img
                    src={`https://ui-avatars.com/api/?name=${encodeURIComponent(t.client?.name || 'Cliente')}&background=F5D8E3&color=D47FA6`}
                    alt={t.client?.name || 'Cliente'}
                    className="w-12 h-12 rounded-full object-cover border-2 border-[#D47FA6]"
                  />
                  <div>
                    <h4 className="font-bold text-sm text-[#4A323D]">{t.client?.name || 'Cliente'}</h4>
                    <span className="text-xs text-gray-500 block">Cliente</span>
                    {t.service_name && (
                      <span className="text-[11px] text-[#D47FA6] font-medium block mt-0.5">
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
      <section className="py-20 bg-white border-t border-[#F5D8E3]/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            {/* Left Info */}
            <div className="space-y-6">
              <span className="text-xs font-semibold uppercase tracking-widest text-[#D47FA6] bg-[#FDF2F7] px-3 py-1 rounded-full">
                Onde Estamos
              </span>
              <h2 className="text-3xl sm:text-4xl font-bold text-[#4A323D]">
                Visite Nosso Espaço
              </h2>
              <p className="text-gray-600 leading-relaxed">
                Venha desfrutar do nosso ambiente planejado nos mínimos detalhes para o seu conforto e relaxamento.
              </p>

              <div className="space-y-4 pt-2">
                <div className="flex items-start gap-4 p-4 rounded-2xl bg-[#FFF8FA] border border-[#F5D8E3]">
                  <div className="p-3 rounded-xl bg-white text-[#D47FA6] shadow-sm">
                    <FaMapMarkerAlt className="text-lg" />
                  </div>
                  <div>
                    <h4 className="font-bold text-[#4A323D] text-sm">Endereço</h4>
                    <p className="text-sm text-gray-600 mt-0.5">{salon.address}</p>
                    <p className="text-xs text-gray-500">{salon.cityState}</p>
                  </div>
                </div>

                <div className="flex items-start gap-4 p-4 rounded-2xl bg-[#FFF8FA] border border-[#F5D8E3]">
                  <div className="p-3 rounded-xl bg-white text-[#25D366] shadow-sm">
                    <FaWhatsapp className="text-lg" />
                  </div>
                  <div>
                    <h4 className="font-bold text-[#4A323D] text-sm">Telefone e WhatsApp</h4>
                    <a
                      href={`https://wa.me/${cleanPhone}?text=${encodeURIComponent('Olá, gostaria de falar com o salão.')}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-[#D47FA6] hover:underline font-medium mt-0.5 block"
                    >
                      {formatPhoneDisplay(salon.whatsapp)}
                    </a>
                  </div>
                </div>

                <div className="flex items-start gap-4 p-4 rounded-2xl bg-[#FFF8FA] border border-[#F5D8E3]">
                  <div className="p-3 rounded-xl bg-white text-[#E8A5C8] shadow-sm">
                    <FaClock className="text-lg" />
                  </div>
                  <div>
                    <h4 className="font-bold text-[#4A323D] text-sm">Horário de Funcionamento</h4>
                    <p className="text-sm text-gray-600 mt-0.5">{salon.workingHoursText}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Map Visual / Interactive Embed */}
            <div className="rounded-3xl overflow-hidden shadow-2xl border-4 border-white bg-gray-100 h-96 relative">
              <iframe
                title="Localização do Salão"
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
