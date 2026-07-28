import { useState, useEffect } from 'react';
import { useLocation, Link, useParams } from 'react-router-dom';
import { servicesAPI, professionalsAPI, availabilityAPI, bookingsAPI } from '../services/api';
import { getSalonSettings } from '../services/salonSettings';
import { toast } from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FaCut, FaUser, FaCalendarAlt, FaClock, FaCheckCircle,
  FaArrowRight, FaArrowLeft,
  FaWhatsapp, FaSearch, FaInfoCircle
} from 'react-icons/fa';
import PublicNavbar from '../components/PublicNavbar';
import PublicFooter from '../components/PublicFooter';
import FloatingWhatsAppButton from '../components/FloatingWhatsAppButton';

export default function BookingWizard() {
  const location = useLocation();
  const { companySlug } = useParams();

  const [salon, setSalon] = useState(getSalonSettings());
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const updateSalon = () => setSalon(getSalonSettings());
    window.addEventListener('salonSettingsUpdated', updateSalon);
    return () => window.removeEventListener('salonSettingsUpdated', updateSalon);
  }, []);

  // Data lists
  const [services, setServices] = useState([]);
  const [professionals, setProfessionals] = useState([]);
  const [slots, setSlots] = useState([]);
  const [availabilityMsg, setAvailabilityMsg] = useState('');

  // Selected State
  const [selectedCategory, setSelectedCategory] = useState('Todos');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedService, setSelectedService] = useState(null);
  const [selectedProfessional, setSelectedProfessional] = useState(null);
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedTime, setSelectedTime] = useState('');

  // Form State
  const [clientName, setClientName] = useState('');
  const [clientPhone, setClientPhone] = useState('');
  const [clientEmail, setClientEmail] = useState('');
  const [notes, setNotes] = useState('');

  // Result State
  const [confirmedBooking, setConfirmedBooking] = useState(null);
  const [cancelToken, setCancelToken] = useState('');

  useEffect(() => {
    const updateSalon = () => setSalon(getSalonSettings());
    window.addEventListener('salonSettingsUpdated', updateSalon);
    return () => window.removeEventListener('salonSettingsUpdated', updateSalon);
  }, []);

  // Load initial data and check query params
  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);
        const [svcs, pros] = await Promise.all([
          servicesAPI.getAll('active'),
          professionalsAPI.getAll('active')
        ]);
        const activeServices = svcs || [];
        setServices(activeServices);
        setProfessionals(pros || []);

        // Check if query param serviceId is passed
        const params = new URLSearchParams(location.search);
        const serviceIdParam = params.get('serviceId');
        if (serviceIdParam) {
          const matched = activeServices.find(s => String(s.id) === String(serviceIdParam));
          if (matched) {
            setSelectedService(matched);
            // Default date to tomorrow
            const tomorrow = new Date();
            tomorrow.setDate(tomorrow.getDate() + 1);
            setSelectedDate(tomorrow.toISOString().split('T')[0]);
            setStep(2);
          }
        }
      } catch (err) {
        console.error(err);
        toast.error('Erro ao carregar dados para agendamento');
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [location.search]);

  // Load availability slots when pro, date, and service are chosen
  useEffect(() => {
    if (selectedProfessional && selectedDate && selectedService) {
      async function fetchSlots() {
        try {
          setLoading(true);
          setSelectedTime('');
          const res = await availabilityAPI.get(
            selectedProfessional.id,
            selectedDate,
            selectedService.id
          );
          const rawSlots = Array.isArray(res?.slots) ? res.slots : [];
          const availableSlots = rawSlots
            .filter((s) => (typeof s === 'object' && s !== null ? s.available !== false : true))
            .map((s) => (typeof s === 'object' && s !== null ? s.time : s))
            .filter(Boolean);
          setSlots(availableSlots);
          setAvailabilityMsg(res?.message || '');
        } catch (err) {
          console.error(err);
          toast.error('Erro ao carregar horários disponíveis');
        } finally {
          setLoading(false);
        }
      }
      fetchSlots();
    }
  }, [selectedProfessional, selectedDate, selectedService]);

  const handleSelectService = (svc) => {
    setSelectedService(svc);
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    if (!selectedDate) {
      setSelectedDate(tomorrow.toISOString().split('T')[0]);
    }
    setStep(2);
  };

  const handleProceedToStep3 = () => {
    if (!selectedProfessional) {
      toast.error('Selecione um(a) profissional');
      return;
    }
    if (!selectedDate) {
      toast.error('Selecione uma data para o agendamento');
      return;
    }
    if (!selectedTime) {
      toast.error('Selecione um horário disponível');
      return;
    }
    setStep(3);
  };

  const handleSubmitBooking = async (e) => {
    e.preventDefault();
    if (!clientName.trim() || !clientPhone.trim() || !clientEmail.trim()) {
      toast.error('Por favor, preencha nome, telefone e e-mail');
      return;
    }

    try {
      setLoading(true);
      const res = await bookingsAPI.create({
        clientName: clientName.trim(),
        clientPhone: clientPhone.trim(),
        clientEmail: clientEmail.trim(),
        serviceId: selectedService.id,
        professionalId: selectedProfessional.id,
        date: selectedDate,
        startTime: selectedTime,
        notes: notes.trim(),
      });
      setConfirmedBooking(res.booking);
      setCancelToken(res.cancelToken || '');
      toast.success('Agendamento realizado com sucesso!');
      setStep(4);
    } catch (err) {
      console.error(err);
      const msg = err.response?.data?.error || 'Não foi possível confirmar o agendamento';
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  const cleanPhone = (salon.whatsapp || '5511999998888').replace(/\D/g, '');

  const buildWhatsappConfirmationUrl = () => {
    if (!confirmedBooking) return '#';
    const dateFormatted = confirmedBooking.booking_date ? confirmedBooking.booking_date.split('-').reverse().join('/') : '';
    const text = `Olá, ${salon.name}! Acabei de realizar o agendamento #${confirmedBooking.id} para o serviço *${confirmedBooking.service_name || ''}* com *${confirmedBooking.professional_name || ''}* no dia *${dateFormatted}* às *${confirmedBooking.start_time || ''}*.`;
    return `https://wa.me/${cleanPhone}?text=${encodeURIComponent(text)}`;
  };

  const categories = ['Todos', ...Array.from(new Set(services.map(s => s.category || 'Geral')))];

  const filteredServices = services.filter(svc => {
    const matchesCat = selectedCategory === 'Todos' || (svc.category || 'Geral') === selectedCategory;
    const matchesSearch = (svc.name || '').toLowerCase().includes((searchTerm || '').toLowerCase()) ||
      ((svc.description || '').toLowerCase().includes((searchTerm || '').toLowerCase()));
    return matchesCat && matchesSearch;
  });

  return (
    <div className="min-h-screen bg-[#FFF8FA] font-sans text-[#4A323D] flex flex-col">
      <PublicNavbar />

      {/* Header Banner */}
      <section className="pt-28 pb-10 bg-gradient-to-b from-[#FFF0F6] to-[#FFF8FA] border-b border-[#F5D8E3]">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <span className="text-xs font-semibold uppercase tracking-widest text-[#D47FA6] bg-white px-3.5 py-1.5 rounded-full shadow-sm">
            Agendamento 24h
          </span>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-[#4A323D] mt-3">
            Agendar Horário Online
          </h1>
          <p className="text-gray-600 mt-2 text-sm max-w-xl mx-auto">
            Siga as 4 etapas simples abaixo para escolher seu serviço, profissional, data, horário e confirmar em instantes.
          </p>
        </div>
      </section>

      {/* Wizard Area */}
      <section className="flex-1 py-10 pb-24">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Progress Bar (4 steps) */}
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-[#F5D8E3] mb-8">
            <div className="flex items-center justify-between relative">
              {[
                { s: 1, label: 'Etapa 1', title: 'Serviço', icon: <FaCut /> },
                { s: 2, label: 'Etapa 2', title: 'Profissional/Data', icon: <FaCalendarAlt /> },
                { s: 3, label: 'Etapa 3', title: 'Seus Dados', icon: <FaUser /> },
                { s: 4, label: 'Etapa 4', title: 'Confirmação', icon: <FaCheckCircle /> },
              ].map((item) => {
                const isActive = step === item.s;
                const isCompleted = step > item.s;
                return (
                  <div key={item.s} className="flex flex-col items-center flex-1 relative z-10">
                    <div
                      className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold transition-all duration-300 ${
                        isActive
                          ? 'bg-gradient-to-r from-[#D47FA6] to-[#E8A5C8] text-white shadow-md ring-4 ring-[#FDF2F7]'
                          : isCompleted
                          ? 'bg-[#E8A5C8] text-white'
                          : 'bg-gray-100 text-gray-400 border border-gray-200'
                      }`}
                    >
                      {isCompleted ? <FaCheckCircle /> : item.s}
                    </div>
                    <span
                      className={`text-[10px] uppercase font-semibold mt-2 tracking-wider ${
                        isActive ? 'text-[#D47FA6]' : isCompleted ? 'text-[#6B4E5A]' : 'text-gray-400'
                      }`}
                    >
                      {item.label}
                    </span>
                    <span
                      className={`text-xs font-bold ${
                        isActive ? 'text-[#4A323D]' : 'text-gray-500'
                      }`}
                    >
                      {item.title}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Main Card */}
          <div className="bg-white rounded-3xl p-6 sm:p-8 md:p-10 shadow-lg border border-[#F5D8E3] relative">
            {loading && (
              <div className="absolute inset-0 bg-white/70 backdrop-blur-sm z-30 rounded-3xl flex flex-col items-center justify-center gap-3">
                <div className="w-10 h-10 border-4 border-[#D47FA6] border-t-transparent rounded-full animate-spin" />
                <p className="text-xs font-bold uppercase tracking-wider text-[#D47FA6]">Carregando horários...</p>
              </div>
            )}

            <AnimatePresence mode="wait">
              {/* ETAPA 1: Escolha do Serviço */}
              {step === 1 && (
                <motion.div
                  key="step-1"
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -15 }}
                  className="space-y-6"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-gray-100 pb-4">
                    <div>
                      <h2 className="text-xl font-bold text-[#4A323D]">1. Escolha o Serviço Desejado</h2>
                      <p className="text-xs text-gray-500">Selecione o procedimento na lista abaixo</p>
                    </div>

                    {/* Filter Category & Search */}
                    <div className="flex items-center gap-2">
                      <div className="relative">
                        <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-xs" />
                        <input
                          type="text"
                          placeholder="Buscar..."
                          value={searchTerm}
                          onChange={(e) => setSearchTerm(e.target.value)}
                          className="pl-8 pr-3 py-1.5 text-xs rounded-full border border-gray-200 focus:outline-none focus:border-[#D47FA6]"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Category Pills */}
                  <div className="flex items-center gap-2 overflow-x-auto pb-2">
                    {categories.map((cat) => (
                      <button
                        key={cat}
                        onClick={() => setSelectedCategory(cat)}
                        className={`px-3.5 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all ${
                          selectedCategory === cat
                            ? 'bg-[#D47FA6] text-white shadow-sm'
                            : 'bg-gray-100 text-[#6B4E5A] hover:bg-gray-200'
                        }`}
                      >
                        {cat}
                      </button>
                    ))}
                  </div>

                  {/* Service list */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {filteredServices.map((svc) => (
                      <div
                        key={svc.id}
                        onClick={() => handleSelectService(svc)}
                        className={`p-5 rounded-2xl border cursor-pointer transition-all duration-200 flex flex-col justify-between ${
                          selectedService?.id === svc.id
                            ? 'border-[#D47FA6] bg-[#FFF0F6] ring-2 ring-[#D47FA6]/30 shadow-md'
                            : 'border-gray-200 bg-white hover:border-[#D47FA6] hover:shadow-sm'
                        }`}
                      >
                        <div>
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-[#FDF2F7] text-[#D47FA6]">
                              {svc.category || 'Geral'}
                            </span>
                            <span className="text-xs text-gray-500 flex items-center gap-1 font-medium">
                              <FaClock className="text-[#D47FA6]" /> {svc.duration_minutes} min
                            </span>
                          </div>
                          <h3 className="font-bold text-base text-[#4A323D]">{svc.name}</h3>
                          <p className="text-xs text-gray-500 mt-1 line-clamp-2 leading-relaxed">
                            {svc.description}
                          </p>
                        </div>

                        <div className="mt-4 pt-3 border-t border-gray-100 flex items-center justify-between">
                          <span className="text-lg font-extrabold text-[#6B4E5A]">
                            R$ {Number(svc.price || 0).toFixed(2).replace('.', ',')}
                          </span>
                          <span className="text-xs font-semibold text-[#D47FA6] flex items-center gap-1">
                            Selecionar <FaArrowRight />
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </motion.div>
              )}

              {/* ETAPA 2: Escolha do Profissional, Data e Horário */}
              {step === 2 && (
                <motion.div
                  key="step-2"
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -15 }}
                  className="space-y-8"
                >
                  <div className="flex items-center justify-between border-b border-gray-100 pb-4">
                    <div>
                      <h2 className="text-xl font-bold text-[#4A323D]">2. Profissional, Data e Horário</h2>
                      <p className="text-xs text-gray-500">
                        Serviço selecionado:{' '}
                        <span className="font-bold text-[#D47FA6]">{selectedService?.name}</span> (R${' '}
                        {Number(selectedService?.price || 0).toFixed(2).replace('.', ',')})
                      </p>
                    </div>
                    <button
                      onClick={() => setStep(1)}
                      className="text-xs text-gray-500 hover:text-[#D47FA6] flex items-center gap-1 font-medium"
                    >
                      <FaArrowLeft /> Trocar serviço
                    </button>
                  </div>

                  {/* 2A: Escolha do Profissional */}
                  <div>
                    <h3 className="text-sm font-bold text-[#4A323D] uppercase tracking-wider mb-3">
                      Selecione o(a) Profissional
                    </h3>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      {professionals.map((pro) => (
                        <div
                          key={pro.id}
                          onClick={() => setSelectedProfessional(pro)}
                          className={`p-4 rounded-2xl border cursor-pointer transition-all ${
                            selectedProfessional?.id === pro.id
                              ? 'border-[#D47FA6] bg-[#FFF0F6] ring-2 ring-[#D47FA6]/30 shadow-md'
                              : 'border-gray-200 bg-white hover:border-[#D47FA6]'
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <div className="w-12 h-12 rounded-full bg-gradient-to-tr from-[#E8A5C8] to-[#D47FA6] flex items-center justify-center text-white font-bold text-lg shrink-0">
                              {pro.name.charAt(0)}
                            </div>
                            <div>
                              <h4 className="font-bold text-sm text-[#4A323D]">{pro.name}</h4>
                              <p className="text-xs text-gray-500">{pro.role}</p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* 2B: Escolha da Data */}
                  {selectedProfessional && (
                    <div className="pt-2">
                      <h3 className="text-sm font-bold text-[#4A323D] uppercase tracking-wider mb-3">
                        Selecione a Data
                      </h3>
                      <input
                        type="date"
                        min={new Date().toISOString().split('T')[0]}
                        value={selectedDate}
                        onChange={(e) => setSelectedDate(e.target.value)}
                        className="w-full sm:w-64 px-4 py-2.5 rounded-xl border border-gray-300 text-sm font-medium focus:outline-none focus:border-[#D47FA6] bg-white shadow-sm"
                      />
                    </div>
                  )}

                  {/* 2C: Escolha do Horário */}
                  {selectedProfessional && selectedDate && (
                    <div className="pt-2">
                      <h3 className="text-sm font-bold text-[#4A323D] uppercase tracking-wider mb-3">
                        Horários Disponíveis ({slots.length})
                      </h3>
                      {slots.length === 0 ? (
                        <div className="p-6 rounded-2xl bg-[#FFF8FA] border border-[#F5D8E3] text-center">
                          <FaInfoCircle className="text-[#D47FA6] text-xl mx-auto mb-2" />
                          <p className="text-sm font-medium text-[#6B4E5A]">
                            {availabilityMsg || 'Nenhum horário disponível para esta data ou profissional.'}
                          </p>
                          <p className="text-xs text-gray-500 mt-1">Por favor, selecione outra data.</p>
                        </div>
                      ) : (
                        <div className="grid grid-cols-3 sm:grid-cols-5 md:grid-cols-6 gap-2.5">
                          {slots.map((slotItem) => {
                            const timeStr = typeof slotItem === 'object' && slotItem !== null ? slotItem.time : slotItem;
                            if (!timeStr) return null;
                            return (
                              <button
                                key={timeStr}
                                type="button"
                                onClick={() => setSelectedTime(timeStr)}
                                className={`py-2.5 px-3 rounded-xl text-xs font-bold transition-all ${
                                  selectedTime === timeStr
                                    ? 'bg-[#D47FA6] text-white shadow-md scale-105'
                                    : 'bg-gray-100 hover:bg-[#FFF0F6] hover:text-[#D47FA6] text-[#4A323D]'
                                }`}
                              >
                                {timeStr}
                              </button>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  )}

                  <div className="pt-6 border-t border-gray-100 flex items-center justify-between">
                    <button
                      type="button"
                      onClick={() => setStep(1)}
                      className="px-6 py-2.5 rounded-xl border border-gray-300 text-gray-600 font-semibold text-sm hover:bg-gray-50 transition"
                    >
                      Voltar
                    </button>
                    <button
                      type="button"
                      onClick={handleProceedToStep3}
                      disabled={!selectedProfessional || !selectedDate || !selectedTime}
                      className="inline-flex items-center gap-2 px-7 py-2.5 rounded-xl bg-gradient-to-r from-[#D47FA6] to-[#E8A5C8] text-white font-semibold text-sm shadow-md hover:shadow-lg transition disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <span>Avançar para Seus Dados</span>
                      <FaArrowRight className="text-xs" />
                    </button>
                  </div>
                </motion.div>
              )}

              {/* ETAPA 3: Dados do Cliente */}
              {step === 3 && (
                <motion.div
                  key="step-3"
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -15 }}
                  className="space-y-6"
                >
                  <div className="flex items-center justify-between border-b border-gray-100 pb-4">
                    <div>
                      <h2 className="text-xl font-bold text-[#4A323D]">3. Preencha Seus Dados</h2>
                      <p className="text-xs text-gray-500">
                        Para enviarmos a confirmação e identificarmos sua reserva
                      </p>
                    </div>
                    <button
                      onClick={() => setStep(2)}
                      className="text-xs text-gray-500 hover:text-[#D47FA6] flex items-center gap-1 font-medium"
                    >
                      <FaArrowLeft /> Alterar data/hora
                    </button>
                  </div>

                  {/* Summary bar */}
                  <div className="p-4 rounded-2xl bg-[#FFF8FA] border border-[#F5D8E3] flex flex-wrap items-center justify-between gap-4 text-xs">
                    <div>
                      <span className="text-gray-400 block">Serviço & Profissional</span>
                      <span className="font-bold text-[#4A323D]">
                        {selectedService?.name} • {selectedProfessional?.name}
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-400 block">Data & Horário</span>
                      <span className="font-bold text-[#D47FA6]">
                        {selectedDate ? selectedDate.split('-').reverse().join('/') : ''} às {selectedTime}
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-400 block">Valor</span>
                      <span className="font-bold text-[#6B4E5A]">
                        R$ {Number(selectedService?.price || 0).toFixed(2).replace('.', ',')}
                      </span>
                    </div>
                  </div>

                  <form onSubmit={handleSubmitBooking} className="space-y-4">
                    <div>
                      <label className="block text-xs font-bold text-[#4A323D] mb-1">
                        Nome Completo *
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="Ex: Maria Silva"
                        value={clientName}
                        onChange={(e) => setClientName(e.target.value)}
                        className="w-full px-4 py-3 rounded-xl border border-gray-300 text-sm focus:outline-none focus:border-[#D47FA6]"
                      />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-bold text-[#4A323D] mb-1">
                          Telefone / WhatsApp *
                        </label>
                        <input
                          type="tel"
                          required
                          placeholder="(11) 99999-8888"
                          value={clientPhone}
                          onChange={(e) => setClientPhone(e.target.value)}
                          className="w-full px-4 py-3 rounded-xl border border-gray-300 text-sm focus:outline-none focus:border-[#D47FA6]"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-[#4A323D] mb-1">
                          E-mail *
                        </label>
                        <input
                          type="email"
                          required
                          placeholder="seuemail@exemplo.com"
                          value={clientEmail}
                          onChange={(e) => setClientEmail(e.target.value)}
                          className="w-full px-4 py-3 rounded-xl border border-gray-300 text-sm focus:outline-none focus:border-[#D47FA6]"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-[#4A323D] mb-1">
                        Observações para o Salão (Opcional)
                      </label>
                      <textarea
                        rows={3}
                        placeholder="Ex: Preferência de corte, alergias a produtos, etc."
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                        className="w-full px-4 py-3 rounded-xl border border-gray-300 text-sm focus:outline-none focus:border-[#D47FA6]"
                      />
                    </div>

                    <div className="pt-6 border-t border-gray-100 flex items-center justify-between">
                      <button
                        type="button"
                        onClick={() => setStep(2)}
                        className="px-6 py-2.5 rounded-xl border border-gray-300 text-gray-600 font-semibold text-sm hover:bg-gray-50 transition"
                      >
                        Voltar
                      </button>
                      <button
                        type="submit"
                        disabled={loading}
                        className="inline-flex items-center gap-2 px-8 py-3 rounded-xl bg-gradient-to-r from-[#D47FA6] to-[#E8A5C8] text-white font-semibold text-sm shadow-lg hover:shadow-xl transition"
                      >
                        <span>Confirmar Agendamento</span>
                        <FaCheckCircle className="text-xs" />
                      </button>
                    </div>
                  </form>
                </motion.div>
              )}

              {/* ETAPA 4: Confirmação */}
              {step === 4 && confirmedBooking && (
                <motion.div
                  key="step-4"
                  initial={{ opacity: 0, scale: 0.96 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="text-center py-6 space-y-6"
                >
                  <div className="w-16 h-16 rounded-full bg-[#25D366]/10 text-[#25D366] flex items-center justify-center text-3xl mx-auto shadow-sm">
                    <FaCheckCircle />
                  </div>

                  <div>
                    <span className="text-xs font-bold px-3 py-1 rounded-full bg-[#FDF2F7] text-[#D47FA6]">
                      Agendamento Confirmado!
                    </span>
                    <h2 className="text-2xl sm:text-3xl font-extrabold text-[#4A323D] mt-2">
                      Tudo Pronto para Cuidar de Você
                    </h2>
                    <p className="text-sm text-gray-600 max-w-md mx-auto mt-1">
                      Seu horário está reservado com sucesso no {salon.name}.
                    </p>
                  </div>

                  {/* Resumo do Agendamento */}
                  <div className="max-w-md mx-auto bg-[#FFF8FA] rounded-2xl p-6 border border-[#F5D8E3] text-left space-y-3 shadow-sm">
                    <div className="flex justify-between items-center border-b border-[#F5D8E3] pb-3">
                      <span className="text-xs text-gray-500 uppercase font-semibold">Código da Reserva</span>
                      <span className="text-sm font-mono font-bold bg-white px-3 py-1 rounded-lg border border-[#F5D8E3] text-[#D47FA6]">
                        #{confirmedBooking.id}
                      </span>
                    </div>

                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500">Serviço:</span>
                      <span className="font-bold text-[#4A323D]">{confirmedBooking.service_name}</span>
                    </div>

                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500">Profissional:</span>
                      <span className="font-bold text-[#4A323D]">{confirmedBooking.professional_name}</span>
                    </div>

                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500">Data:</span>
                      <span className="font-bold text-[#4A323D]">
                        {confirmedBooking.booking_date ? confirmedBooking.booking_date.split('-').reverse().join('/') : ''}
                      </span>
                    </div>

                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500">Horário:</span>
                      <span className="font-bold text-[#D47FA6]">
                        {confirmedBooking.start_time} às {confirmedBooking.end_time}
                      </span>
                    </div>

                    <div className="flex justify-between text-base pt-3 border-t border-[#F5D8E3]">
                      <span className="font-bold text-[#4A323D]">Valor:</span>
                      <span className="font-extrabold text-[#6B4E5A]">
                        R$ {Number(confirmedBooking.service_price || 0).toFixed(2).replace('.', ',')}
                      </span>
                    </div>
                  </div>

                  {cancelToken && (
                    <div className="max-w-md mx-auto bg-gray-50 rounded-xl p-3 border border-gray-200 text-xs text-gray-500">
                      <span>Token de alteração/cancelamento: </span>
                      <span className="font-mono font-bold text-[#D47FA6]">{cancelToken}</span>
                    </div>
                  )}

                  {/* Actions required by specification */}
                  <div className="flex flex-col sm:flex-row gap-3 justify-center max-w-md mx-auto pt-2">
                    <a
                      href={buildWhatsappConfirmationUrl()}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center justify-center gap-2.5 px-6 py-3.5 rounded-xl bg-[#25D366] hover:bg-[#20bd5a] text-white font-bold text-sm shadow-md transition-all flex-1"
                    >
                      <FaWhatsapp className="text-lg" />
                      <span>Confirmar pelo WhatsApp</span>
                    </a>

                    <Link
                      to={`/${companySlug}`}
                      className="inline-flex items-center justify-center px-6 py-3.5 rounded-xl border border-[#D47FA6] text-[#D47FA6] font-semibold text-sm hover:bg-[#FFF0F6] transition-all flex-1"
                    >
                      Voltar ao Início
                    </Link>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </section>

      <FloatingWhatsAppButton />
      <PublicFooter />
    </div>
  );
}
