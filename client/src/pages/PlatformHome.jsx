import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  FaCalendarAlt, FaCreditCard, FaStore, FaClock, FaCheckCircle,
  FaArrowRight, FaShieldAlt, FaMagic, FaGem, FaWhatsapp,
  FaUsers, FaStar, FaMobileAlt
} from 'react-icons/fa';

export default function PlatformHome() {
  const navigate = useNavigate();
  const [salonSlugInput, setSalonSlugInput] = useState('');

  const handleAccessExisting = (e) => {
    e.preventDefault();
    const clean = salonSlugInput.toLowerCase().trim().replace(/[^a-z0-9-]/g, '');
    if (clean) {
      navigate(`/${clean}`);
    }
  };

  return (
    <div className="min-h-screen bg-[#FFF8FA] font-sans text-[#4A323D] flex flex-col">
      {/* Navbar */}
      <header className="bg-white/90 backdrop-blur-md border-b border-[#F5D8E3] sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-[#D47FA6] to-[#E8A5C8] flex items-center justify-center text-white shadow-md">
              <FaMagic className="text-lg" />
            </div>
            <div>
              <span className="font-heading font-bold text-xl text-[#4A323D] tracking-tight block">Studio Beauty</span>
              <span className="text-[10px] uppercase font-bold text-[#D47FA6] tracking-widest block -mt-1">Plataforma SaaS para Salões</span>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <a
              href="#login-existente"
              className="text-xs font-semibold text-gray-600 hover:text-[#D47FA6] transition-colors hidden sm:inline"
            >
              Já tenho salão
            </a>

            <Link
              to="/cadastro"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-gradient-to-r from-[#D47FA6] to-[#E8A5C8] text-white text-xs font-bold shadow-md hover:shadow-lg hover:scale-105 transition-all"
            >
              <span>Cadastrar Meu Salão</span>
              <FaArrowRight className="text-[10px]" />
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative pt-16 pb-20 lg:pt-24 lg:pb-32 overflow-hidden">
        {/* Ambient Glows */}
        <div className="absolute top-10 left-1/2 -translate-x-1/2 w-[600px] h-[350px] bg-gradient-to-tr from-[#F5D8E3]/60 via-[#FFF0F5]/40 to-transparent blur-3xl pointer-events-none rounded-full" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center">
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#FDF2F7] border border-[#F5D8E3] text-[#D47FA6] text-xs font-bold uppercase tracking-wider mb-6"
          >
            <FaGem />
            <span>Sistema Completo de Agendamento & Gestão</span>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="text-4xl sm:text-5xl lg:text-6xl font-heading font-extrabold text-[#4A323D] tracking-tight max-w-4xl mx-auto leading-tight"
          >
            Seu Salão Aberto para Agendamentos{' '}
            <span className="bg-gradient-to-r from-[#D47FA6] via-[#B86289] to-[#6B4E5A] bg-clip-text text-transparent">
              24 Horas por Dia
            </span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="mt-6 text-base sm:text-lg text-gray-600 max-w-2xl mx-auto leading-relaxed"
          >
            Crie seu site exclusivo com link personalizado, aceite pagamentos e assinaturas automáticas via <strong>Mercado Pago</strong> (Cartão de Crédito, Débito e PIX) e encante suas clientes.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="mt-10 flex flex-wrap items-center justify-center gap-4"
          >
            <Link
              to="/cadastro"
              className="inline-flex items-center gap-3 px-8 py-4 rounded-full bg-gradient-to-r from-[#D47FA6] to-[#E8A5C8] text-white font-bold text-base shadow-xl hover:shadow-2xl hover:scale-105 transition-all"
            >
              <span>Cadastrar Meu Salão Agora</span>
              <FaArrowRight className="text-sm" />
            </Link>

            <a
              href="#como-funciona"
              className="inline-flex items-center gap-2 px-7 py-4 rounded-full bg-white border border-[#F5D8E3] text-[#4A323D] font-semibold text-base hover:bg-gray-50 shadow-sm transition"
            >
              <span>Conhecer Recursos</span>
            </a>
          </motion.div>

          {/* Badges Bar */}
          <div className="mt-14 pt-8 border-t border-[#F5D8E3]/60 max-w-3xl mx-auto grid grid-cols-2 sm:grid-cols-4 gap-6 text-center">
            <div>
              <p className="text-xl sm:text-2xl font-bold text-[#6B4E5A]">24h / 7 dias</p>
              <p className="text-xs text-gray-500 mt-0.5">Agendamento Online</p>
            </div>
            <div>
              <p className="text-xl sm:text-2xl font-bold text-[#6B4E5A]">Mercado Pago</p>
              <p className="text-xs text-gray-500 mt-0.5">Cobrança Automática</p>
            </div>
            <div>
              <p className="text-xl sm:text-2xl font-bold text-[#6B4E5A]">Link Próprio</p>
              <p className="text-xs text-gray-500 mt-0.5">Para seu Salão</p>
            </div>
            <div>
              <p className="text-xl sm:text-2xl font-bold text-[#6B4E5A]">100% Mobile</p>
              <p className="text-xs text-gray-500 mt-0.5">Funciona em Qualquer Aparelho</p>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="como-funciona" className="py-20 bg-white border-y border-[#F5D8E3]/60">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <span className="text-xs font-bold uppercase tracking-wider text-[#D47FA6] bg-[#FDF2F7] px-3 py-1 rounded-full">
              Recursos de Alto Nível
            </span>
            <h2 className="text-3xl sm:text-4xl font-heading font-bold text-[#4A323D] mt-3">
              Tudo o que seu salão precisa para crescer
            </h2>
            <p className="text-gray-600 mt-2 text-sm sm:text-base">
              Desenvolvido especialmente para salões de beleza, barbearias, spas e clínicas de estética.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Feature 1 */}
            <div className="p-8 rounded-3xl bg-[#FFFBFD] border border-[#F5D8E3]/60 hover:border-[#D47FA6] shadow-sm hover:shadow-lg transition-all group">
              <div className="w-12 h-12 rounded-2xl bg-[#FDF2F7] text-[#D47FA6] flex items-center justify-center text-2xl mb-6 group-hover:scale-110 transition-transform">
                <FaCalendarAlt />
              </div>
              <h3 className="text-xl font-bold text-[#4A323D] mb-2">Agendamento Inteligente</h3>
              <p className="text-sm text-gray-600 leading-relaxed">
                Suas clientes escolhem o serviço, a especialista favorita e o horário ideal sem você precisar trocar mensagens manuais o dia inteiro.
              </p>
            </div>

            {/* Feature 2 */}
            <div className="p-8 rounded-3xl bg-[#FFFBFD] border border-[#F5D8E3]/60 hover:border-[#D47FA6] shadow-sm hover:shadow-lg transition-all group">
              <div className="w-12 h-12 rounded-2xl bg-[#FDF2F7] text-[#D47FA6] flex items-center justify-center text-2xl mb-6 group-hover:scale-110 transition-transform">
                <FaCreditCard />
              </div>
              <h3 className="text-xl font-bold text-[#4A323D] mb-2">Mercado Pago Integrado</h3>
              <p className="text-sm text-gray-600 leading-relaxed">
                Cobranças automáticas seguras via Cartão de Crédito com recorrência mensal, Cartão de Débito e PIX instantâneo.
              </p>
            </div>

            {/* Feature 3 */}
            <div className="p-8 rounded-3xl bg-[#FFFBFD] border border-[#F5D8E3]/60 hover:border-[#D47FA6] shadow-sm hover:shadow-lg transition-all group">
              <div className="w-12 h-12 rounded-2xl bg-[#FDF2F7] text-[#D47FA6] flex items-center justify-center text-2xl mb-6 group-hover:scale-110 transition-transform">
                <FaStore />
              </div>
              <h3 className="text-xl font-bold text-[#4A323D] mb-2">Site e Link Personalizado</h3>
              <p className="text-sm text-gray-600 leading-relaxed">
                Cada salão recebe seu próprio site completo com fotos, depoimentos de clientes reais, mapa de localização e botão de WhatsApp direto.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section className="py-20 bg-gradient-to-b from-[#FFF8FA] to-white">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <span className="text-xs font-bold uppercase tracking-wider text-[#D47FA6] bg-[#FDF2F7] px-3 py-1 rounded-full">
            Plano Simples e Transparente
          </span>
          <h2 className="text-3xl sm:text-4xl font-heading font-bold text-[#4A323D] mt-3">
            Comece Hoje Mesmo
          </h2>
          <p className="text-gray-600 mt-2 text-sm sm:text-base">
            Sem fidelidade. Cobrança automática mensal com cancelamento a qualquer momento.
          </p>

          <div className="mt-12 bg-white rounded-3xl shadow-xl border-2 border-[#D47FA6] p-8 sm:p-10 max-w-lg mx-auto text-left relative overflow-hidden">
            <div className="absolute top-0 right-0 bg-gradient-to-l from-[#D47FA6] to-[#E8A5C8] text-white text-[11px] font-bold uppercase py-1.5 px-6 rounded-bl-xl tracking-wider">
              Mais Popular
            </div>

            <h3 className="text-2xl font-bold text-[#4A323D]">Plano Profissional</h3>
            <p className="text-xs text-gray-500 mt-1">Gestão completa e ilimitada para o seu salão</p>

            <div className="my-6">
              <span className="text-4xl sm:text-5xl font-extrabold text-[#6B4E5A]">R$ 49,90</span>
              <span className="text-sm text-gray-500 font-medium ml-2">/ mês</span>
            </div>

            <ul className="space-y-3.5 mb-8 text-sm text-gray-700">
              {[
                'Agendamento online 24h por dia',
                'Site exclusivo com seu próprio link (/seu-salao)',
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
              to="/cadastro"
              className="w-full inline-flex items-center justify-center gap-2 py-4 rounded-full bg-gradient-to-r from-[#D47FA6] to-[#E8A5C8] text-white font-bold text-base shadow-lg hover:shadow-xl hover:scale-[1.02] transition-all text-center"
            >
              <span>Cadastrar Meu Salão e Começar</span>
              <FaArrowRight className="text-sm" />
            </Link>

            <p className="text-center text-[11px] text-gray-400 mt-3 flex items-center justify-center gap-1">
              <FaShieldAlt /> Pagamento 100% seguro com Mercado Pago
            </p>
          </div>
        </div>
      </section>

      {/* Access Existing Salon Box */}
      <section id="login-existente" className="py-16 bg-white border-t border-[#F5D8E3]/60">
        <div className="max-w-xl mx-auto px-4 text-center">
          <h3 className="text-xl font-bold text-[#4A323D] mb-2">Já possui um salão cadastrado?</h3>
          <p className="text-xs text-gray-500 mb-6">
            Digite o link do seu salão abaixo para acessar o painel de administração ou sua página pública:
          </p>

          <form onSubmit={handleAccessExisting} className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <span className="absolute left-4 top-3.5 text-xs text-gray-400 font-mono">/</span>
              <input
                type="text"
                required
                placeholder="nome-do-seu-salao"
                value={salonSlugInput}
                onChange={(e) => setSalonSlugInput(e.target.value)}
                className="w-full pl-8 pr-4 py-3 rounded-xl border border-gray-300 text-sm font-mono focus:outline-none focus:border-[#D47FA6]"
              />
            </div>
            <button
              type="submit"
              className="px-6 py-3 rounded-xl bg-[#4A323D] hover:bg-[#3A2630] text-white text-xs font-bold transition"
            >
              Acessar Salão
            </button>
          </form>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-[#4A323D] text-white py-10 mt-auto">
        <div className="max-w-7xl mx-auto px-4 text-center text-xs text-gray-300 space-y-2">
          <p className="font-heading font-bold text-sm text-white">Studio Beauty • Plataforma SaaS de Agendamentos</p>
          <p>Processamento bancário e cobranças automáticas via Mercado Pago.</p>
          <p className="text-gray-400 pt-2">© {new Date().getFullYear()} Studio Beauty. Todos os direitos reservados.</p>
        </div>
      </footer>
    </div>
  );
}
