import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FaCalendarAlt, FaCreditCard, FaStore, FaClock, FaCheckCircle,
  FaArrowRight, FaShieldAlt, FaMagic, FaGem, FaWhatsapp,
  FaUsers, FaStar, FaMobileAlt, FaCheck, FaCut
} from 'react-icons/fa';
import { paymentsAPI } from '../services/api';
import { NICHES, DEFAULT_NICHE, getNicheData } from '../constants/niches';

export default function PlatformHome() {
  const navigate = useNavigate();
  const [salonSlugInput, setSalonSlugInput] = useState('');
  const [planPrice, setPlanPrice] = useState('69,90');
  const [selectedNiche, setSelectedNiche] = useState(DEFAULT_NICHE);

  const currentNiche = getNicheData(selectedNiche);

  useEffect(() => {
    paymentsAPI.getConfig().then(cfg => {
      if (cfg && cfg.planPrice) {
        setPlanPrice(Number(cfg.planPrice).toFixed(2).replace('.', ','));
      }
    }).catch(() => {});
  }, []);

  useEffect(() => {
    document.title = `${currentNiche.saasBrand} • ${currentNiche.saasSubtitle}`;
  }, [currentNiche]);

  const handleAccessExisting = (e) => {
    e.preventDefault();
    const clean = salonSlugInput.toLowerCase().trim().replace(/[^a-z0-9-]/g, '');
    if (clean) {
      navigate(`/${clean}`);
    }
  };

  return (
    <div className="min-h-screen bg-[#FFF8FA] font-sans text-[#4A323D] flex flex-col transition-colors duration-500">
      {/* Navbar */}
      <header className="bg-white/90 backdrop-blur-md border-b border-gray-200/80 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-2xl bg-gradient-to-tr ${currentNiche.theme.primaryGradient} flex items-center justify-center text-white shadow-md transition-all duration-500 text-lg`}>
              <span>{currentNiche.icon}</span>
            </div>
            <div>
              <span className="font-heading font-bold text-xl text-gray-900 tracking-tight block">
                {currentNiche.saasBrand}
              </span>
              <span className="text-[10px] uppercase font-bold text-gray-500 tracking-widest block -mt-1">
                {currentNiche.saasSubtitle}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <a
              href="#login-existente"
              className="text-xs font-semibold text-gray-600 hover:text-gray-900 transition-colors hidden sm:inline"
            >
              Já sou cliente
            </a>

            <Link
              to={`/cadastro?nicho=${selectedNiche}`}
              className={`inline-flex items-center gap-2 px-5 py-2.5 rounded-full ${currentNiche.theme.buttonClass} text-xs font-bold shadow-md hover:shadow-lg hover:scale-105 transition-all`}
            >
              <span>{currentNiche.ctaText}</span>
              <FaArrowRight className="text-[10px]" />
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative pt-12 pb-20 lg:pt-16 lg:pb-28 overflow-hidden">
        {/* Ambient Glows */}
        <div className={`absolute top-10 left-1/2 -translate-x-1/2 w-[700px] h-[400px] bg-gradient-to-tr ${currentNiche.theme.accentGlow} blur-3xl pointer-events-none rounded-full transition-all duration-700`} />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center">
          
          {/* Niche Selector Pills (Interatividade Principal) */}
          <div className="inline-block mb-8">
            <p className="text-[11px] font-bold uppercase tracking-wider text-gray-500 mb-2.5">
              🎯 Escolha seu segmento para ver o site personalizado:
            </p>
            <div className="inline-flex p-1.5 rounded-2xl bg-white border border-gray-200/90 shadow-sm gap-1.5 flex-wrap justify-center">
              {Object.values(NICHES).map((niche) => {
                const isSelected = selectedNiche === niche.id;
                return (
                  <button
                    key={niche.id}
                    type="button"
                    onClick={() => setSelectedNiche(niche.id)}
                    className={`flex items-center gap-2 px-4 sm:px-5 py-2 sm:py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all duration-300 ${
                      isSelected
                        ? niche.theme.activeTabClass
                        : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                    }`}
                  >
                    <span className="text-base">{niche.icon}</span>
                    <span>{niche.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          <AnimatePresence mode="wait">
            <motion.div
              key={selectedNiche}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.35 }}
              className="space-y-6"
            >
              {/* Niche Badge */}
              <div className="flex justify-center">
                <span className={`inline-flex items-center gap-2 px-4 py-1.5 rounded-full border text-xs font-bold uppercase tracking-wider ${currentNiche.theme.badgeClass}`}>
                  <span>{currentNiche.icon}</span>
                  <span>{currentNiche.badge}</span>
                </span>
              </div>

              {/* Dynamic Title */}
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-heading font-extrabold text-gray-900 tracking-tight max-w-4xl mx-auto leading-tight">
                {currentNiche.heroTitle}{' '}
                <span className={`bg-gradient-to-r ${currentNiche.theme.primaryGradient} bg-clip-text text-transparent`}>
                  {currentNiche.heroHighlight}
                </span>
              </h1>

              {/* Dynamic Description */}
              <p className="text-base sm:text-lg text-gray-600 max-w-2xl mx-auto leading-relaxed">
                {currentNiche.heroDescription}
              </p>

              {/* CTAs */}
              <div className="pt-2 flex flex-wrap items-center justify-center gap-4">
                <Link
                  to={`/cadastro?nicho=${selectedNiche}`}
                  className={`inline-flex items-center gap-3 px-8 py-4 rounded-full ${currentNiche.theme.buttonClass} text-white font-bold text-base shadow-xl hover:shadow-2xl hover:scale-105 transition-all`}
                >
                  <span>{currentNiche.ctaText}</span>
                  <FaArrowRight className="text-sm" />
                </Link>

                <a
                  href="#preview-demonstracao"
                  className="inline-flex items-center gap-2 px-7 py-4 rounded-full bg-white border border-gray-200 text-gray-800 font-semibold text-base hover:bg-gray-50 shadow-sm transition"
                >
                  <span>Ver Demonstração do Site</span>
                </a>
              </div>
            </motion.div>
          </AnimatePresence>

          {/* Badges Bar */}
          <div className="mt-14 pt-8 border-t border-gray-200/80 max-w-3xl mx-auto grid grid-cols-2 sm:grid-cols-4 gap-6 text-center">
            <div>
              <p className="text-xl sm:text-2xl font-bold text-gray-800">24h / 7 dias</p>
              <p className="text-xs text-gray-500 mt-0.5">Agendamento Online</p>
            </div>
            <div>
              <p className="text-xl sm:text-2xl font-bold text-gray-800">Mercado Pago</p>
              <p className="text-xs text-gray-500 mt-0.5">Cartão & PIX Oficial</p>
            </div>
            <div>
              <p className="text-xl sm:text-2xl font-bold text-gray-800">Link Próprio</p>
              <p className="text-xs text-gray-500 mt-0.5">Exclusivo para você</p>
            </div>
            <div>
              <p className="text-xl sm:text-2xl font-bold text-gray-800">Zero Comissões</p>
              <p className="text-xs text-gray-500 mt-0.5">Lucro 100% seu</p>
            </div>
          </div>
        </div>
      </section>

      {/* Live Preview Section (Demonstração Visual do Nicho Escolhido) */}
      <section id="preview-demonstracao" className="py-16 bg-gradient-to-b from-white to-gray-50 border-y border-gray-200">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-10">
            <span className="text-xs font-bold uppercase tracking-wider text-gray-500 bg-gray-100 px-3 py-1 rounded-full">
              Demonstração ao Vivo
            </span>
            <h2 className="text-2xl sm:text-3xl font-heading font-bold text-gray-900 mt-2">
              Veja como ficará a página pública do seu negócio
            </h2>
            <p className="text-sm text-gray-600 mt-1">
              Ao contratar no segmento <strong>{currentNiche.label}</strong>, o sistema é configurado automaticamente com a identidade visual adequada:
            </p>
          </div>

          {/* Interactive Mockup Container */}
          <div className="bg-white rounded-3xl shadow-2xl border border-gray-200 overflow-hidden max-w-4xl mx-auto">
            {/* Browser Mockup Bar */}
            <div className="bg-gray-900 px-4 py-3 flex items-center justify-between border-b border-gray-800">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-red-500/80" />
                <div className="w-3 h-3 rounded-full bg-yellow-500/80" />
                <div className="w-3 h-3 rounded-full bg-green-500/80" />
              </div>
              <div className="bg-gray-800 text-gray-300 font-mono text-xs px-4 py-1 rounded-full flex items-center gap-2">
                <span className="text-emerald-400">🔒</span>
                <span>https://seusite.com/{selectedNiche === 'barbearia' ? 'barbearia-vintage' : 'seu-estabelecimento'}</span>
              </div>
              <span className="text-[10px] uppercase font-bold text-gray-400 hidden sm:inline">
                {currentNiche.label}
              </span>
            </div>

            {/* Inner Mockup Content */}
            <div className={`p-6 sm:p-10 ${currentNiche.theme.isDark ? 'bg-[#18181B] text-white' : 'bg-[#FFFBFD] text-gray-900'} transition-colors duration-500`}>
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
                {/* Left: Info */}
                <div className="lg:col-span-7 space-y-4 text-left">
                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold border backdrop-blur-md">
                    <span>{currentNiche.icon}</span>
                    <span>{currentNiche.badge}</span>
                  </div>

                  <h3 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
                    {currentNiche.placeholderName}
                  </h3>

                  <p className={`text-sm leading-relaxed ${currentNiche.theme.isDark ? 'text-gray-300' : 'text-gray-600'}`}>
                    {currentNiche.defaultDescription}
                  </p>

                  <div className="pt-2">
                    <p className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-2">
                      Serviços Populares já configurados:
                    </p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                      {currentNiche.servicesSample.map((srv, idx) => (
                        <div
                          key={idx}
                          className={`p-3 rounded-xl border flex items-center justify-between text-xs ${
                            currentNiche.theme.isDark
                              ? 'bg-zinc-800/80 border-zinc-700 text-gray-200'
                              : 'bg-white border-gray-200 text-gray-800'
                          }`}
                        >
                          <div>
                            <span className="font-semibold block">{srv.name}</span>
                            <span className="text-[10px] text-gray-400">{srv.duration}</span>
                          </div>
                          <span className="font-bold text-emerald-500">{srv.price}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="pt-3 flex items-center gap-3">
                    <Link
                      to={`/cadastro?nicho=${selectedNiche}`}
                      className={`inline-flex items-center gap-2 px-6 py-2.5 rounded-xl ${currentNiche.theme.buttonClass} text-xs font-bold text-white shadow-md hover:scale-105 transition-all`}
                    >
                      <span>Quero este modelo</span>
                      <FaArrowRight className="text-[10px]" />
                    </Link>
                    <span className="text-xs text-gray-400 flex items-center gap-1">
                      <FaCheck className="text-emerald-500" /> Pré-configurado para seu nicho
                    </span>
                  </div>
                </div>

                {/* Right: Image Frame */}
                <div className="lg:col-span-5">
                  <div className="relative rounded-2xl overflow-hidden shadow-xl aspect-4/3 border-2 border-gray-700/30 group">
                    <img
                      src={currentNiche.heroImage}
                      alt={currentNiche.label}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent flex items-end p-4">
                      <div>
                        <span className="text-white text-xs font-bold block">
                          Visual Moderno & Responsivo
                        </span>
                        <span className="text-gray-300 text-[11px]">
                          Adaptado perfeitamente para celular e computador
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="como-funciona" className="py-20 bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <span className="text-xs font-bold uppercase tracking-wider text-gray-700 bg-gray-100 px-3 py-1 rounded-full">
              Recursos de Alto Nível
            </span>
            <h2 className="text-3xl sm:text-4xl font-heading font-bold text-gray-900 mt-3">
              Tudo o que seu negócio precisa para crescer
            </h2>
            <p className="text-gray-600 mt-2 text-sm sm:text-base">
              Desenvolvido especialmente para barbearias, salões de beleza, esmalterias e clínicas de estética.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Feature 1 */}
            <div className="p-8 rounded-3xl bg-gray-50/70 border border-gray-200 hover:border-gray-400 shadow-sm hover:shadow-lg transition-all group">
              <div className="w-12 h-12 rounded-2xl bg-white border border-gray-200 text-gray-800 flex items-center justify-center text-2xl mb-6 group-hover:scale-110 transition-transform shadow-sm">
                <FaCalendarAlt />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">Agendamento Inteligente</h3>
              <p className="text-sm text-gray-600 leading-relaxed">
                Seus clientes escolhem o serviço, o profissional preferido e o horário ideal sem você precisar responder mensagens o dia inteiro.
              </p>
            </div>

            {/* Feature 2 */}
            <div className="p-8 rounded-3xl bg-gray-50/70 border border-gray-200 hover:border-gray-400 shadow-sm hover:shadow-lg transition-all group">
              <div className="w-12 h-12 rounded-2xl bg-white border border-gray-200 text-gray-800 flex items-center justify-center text-2xl mb-6 group-hover:scale-110 transition-transform shadow-sm">
                <FaCreditCard />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">Mercado Pago Integrado</h3>
              <p className="text-sm text-gray-600 leading-relaxed">
                Cobranças automáticas seguras via Cartão de Crédito com recorrência mensal, Cartão de Débito e PIX instantâneo.
              </p>
            </div>

            {/* Feature 3 */}
            <div className="p-8 rounded-3xl bg-gray-50/70 border border-gray-200 hover:border-gray-400 shadow-sm hover:shadow-lg transition-all group">
              <div className="w-12 h-12 rounded-2xl bg-white border border-gray-200 text-gray-800 flex items-center justify-center text-2xl mb-6 group-hover:scale-110 transition-transform shadow-sm">
                <FaStore />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">Site e Link Personalizado</h3>
              <p className="text-sm text-gray-600 leading-relaxed">
                Cada empresa recebe seu próprio site completo com fotos, depoimentos de clientes reais, mapa e botão de WhatsApp direto.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section className="py-20 bg-gradient-to-b from-gray-50 to-white">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <span className="text-xs font-bold uppercase tracking-wider text-gray-700 bg-gray-100 px-3 py-1 rounded-full">
            Plano Simples e Transparente
          </span>
          <h2 className="text-3xl sm:text-4xl font-heading font-bold text-gray-900 mt-3">
            Comece Hoje Mesmo no Segmento {currentNiche.label}
          </h2>
          <p className="text-gray-600 mt-2 text-sm sm:text-base">
            Sem fidelidade. Cobrança mensal via Mercado Pago com cancelamento a qualquer momento.
          </p>

          <div className="mt-12 bg-white rounded-3xl shadow-xl border-2 border-gray-900 p-8 sm:p-10 max-w-lg mx-auto text-left relative overflow-hidden">
            <div className={`absolute top-0 right-0 bg-gradient-to-l ${currentNiche.theme.primaryGradient} text-white text-[11px] font-bold uppercase py-1.5 px-6 rounded-bl-xl tracking-wider`}>
              {currentNiche.label}
            </div>

            <h3 className="text-2xl font-bold text-gray-900">Plano Profissional</h3>
            <p className="text-xs text-gray-500 mt-1">Gestão completa e ilimitada para o seu negócio</p>

            <div className="my-6">
              <span className="text-4xl sm:text-5xl font-extrabold text-gray-900">R$ {planPrice}</span>
              <span className="text-sm text-gray-500 font-medium ml-2">/ mês</span>
            </div>

            <ul className="space-y-3.5 mb-8 text-sm text-gray-700">
              {[
                `Tema e textos adaptados para ${currentNiche.label}`,
                'Agendamento online 24h por dia',
                'Site exclusivo com seu próprio link (/sua-empresa)',
                'Profissionais e serviços ilimitados',
                'Galeria de fotos dos trabalhos',
                'Depoimentos e avaliações de clientes',
                'Cobrança automática via Mercado Pago',
                'Cancelamento facilitado a qualquer momento'
              ].map((item, idx) => (
                <li key={idx} className="flex items-center gap-3">
                  <FaCheckCircle className="text-emerald-500 shrink-0" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>

            <Link
              to={`/cadastro?nicho=${selectedNiche}`}
              className={`w-full inline-flex items-center justify-center gap-2 py-4 rounded-full ${currentNiche.theme.buttonClass} text-white font-bold text-base shadow-lg hover:shadow-xl hover:scale-[1.02] transition-all text-center`}
            >
              <span>{currentNiche.ctaText} e Começar</span>
              <FaArrowRight className="text-sm" />
            </Link>

            <p className="text-center text-[11px] text-gray-400 mt-3 flex items-center justify-center gap-1">
              <FaShieldAlt /> Pagamento 100% seguro com Mercado Pago
            </p>
          </div>
        </div>
      </section>

      {/* Access Existing Salon Box */}
      <section id="login-existente" className="py-16 bg-white border-t border-gray-200">
        <div className="max-w-xl mx-auto px-4 text-center">
          <h3 className="text-xl font-bold text-gray-900 mb-2">Já possui um estabelecimento cadastrado?</h3>
          <p className="text-xs text-gray-500 mb-6">
            Digite o link da sua empresa abaixo para acessar o painel de administração ou sua página pública:
          </p>

          <form onSubmit={handleAccessExisting} className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <span className="absolute left-4 top-3.5 text-xs text-gray-400 font-mono">/</span>
              <input
                type="text"
                required
                placeholder="nome-do-seu-negocio"
                value={salonSlugInput}
                onChange={(e) => setSalonSlugInput(e.target.value)}
                className="w-full pl-8 pr-4 py-3 rounded-xl border border-gray-300 text-sm font-mono focus:outline-none focus:border-gray-900"
              />
            </div>
            <button
              type="submit"
              className="px-6 py-3 rounded-xl bg-gray-900 hover:bg-black text-white text-xs font-bold transition"
            >
              Acessar Empresa
            </button>
          </form>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-10 mt-auto">
        <div className="max-w-7xl mx-auto px-4 text-center text-xs text-gray-300 space-y-2">
          <p className="font-heading font-bold text-sm text-white">I.O.S AgendeJá • Plataforma Multitenant de Agendamentos</p>
          <p>Barbearias, Salões de Beleza, Esmalterias e Clínicas de Estética.</p>
          <p className="text-gray-400 pt-2">© {new Date().getFullYear()} I.O.S AgendeJá. Todos os direitos reservados.</p>
        </div>
      </footer>
    </div>
  );
}
