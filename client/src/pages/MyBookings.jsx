import { useState, useEffect } from 'react';
import { Link, useParams } from 'react-router-dom';
import { bookingsAPI, availabilityAPI, testimonialsAPI } from '../services/api';
import { toast } from 'react-hot-toast';
import { 
  FaCalendarAlt, FaClock, FaEnvelope, FaSearch, 
  FaCalendarTimes, FaHistory, FaStar
} from 'react-icons/fa';
import PublicNavbar from '../components/PublicNavbar';
import PublicFooter from '../components/PublicFooter';
import FloatingWhatsAppButton from '../components/FloatingWhatsAppButton';

export default function MyBookings() {
  const { companySlug } = useParams();
  const [email, setEmail] = useState('');
  const [searched, setSearched] = useState(false);
  const [loading, setLoading] = useState(false);
  const [bookings, setBookings] = useState([]);

  // Rescheduling states
  const [rescheduleBooking, setRescheduleBooking] = useState(null);
  const [newDate, setNewDate] = useState('');
  const [slots, setSlots] = useState([]);
  const [selectedTime, setSelectedTime] = useState('');
  const [availabilityMsg, setAvailabilityMsg] = useState('');

  // Review states
  const [reviewBooking, setReviewBooking] = useState(null);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!email) return;

    try {
      setLoading(true);
      const res = await bookingsAPI.getByEmail(email);
      setBookings(res);
      setSearched(true);
      toast.success(`${res.length} agendamentos encontrados`);
    } catch (err) {
      console.error(err);
      toast.error('Erro ao buscar agendamentos');
    } finally {
      setLoading(false);
    }
  };

  const handleCancelBooking = async (booking) => {
    const confirmCancel = window.confirm(
      `Deseja realmente cancelar seu agendamento de ${booking.service_name} em ${booking.booking_date.split('-').reverse().join('/')} às ${booking.start_time}?`
    );
    if (!confirmCancel) return;

    try {
      setLoading(true);
      const res = await bookingsAPI.update(booking.id, {
        status: 'cancelled',
        cancelToken: booking.cancel_token
      });
      if (res.success) {
        toast.success('Agendamento cancelado com sucesso.');
        // Refresh bookings
        const updated = await bookingsAPI.getByEmail(email);
        setBookings(updated);
      }
    } catch (err) {
      console.error(err);
      const errMsg = err.response?.data?.error || 'Erro ao cancelar agendamento';
      toast.error(errMsg);
    } finally {
      setLoading(false);
    }
  };

  // Reschedule loading availability
  useEffect(() => {
    if (rescheduleBooking && newDate) {
      async function loadAvailability() {
        try {
          setLoading(true);
          setSelectedTime('');
          const res = await availabilityAPI.get(
            rescheduleBooking.professional_id,
            newDate,
            rescheduleBooking.service_id
          );
          setSlots(res.slots || []);
          setAvailabilityMsg(res.message || '');
        } catch (err) {
          console.error(err);
          toast.error('Erro ao carregar disponibilidade para reagendamento');
        } finally {
          setLoading(false);
        }
      }
      loadAvailability();
    }
  }, [rescheduleBooking, newDate]);

  const handleOpenReschedule = (booking) => {
    setRescheduleBooking(booking);
    // Set tomorrow as default date
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    setNewDate(tomorrow.toISOString().split('T')[0]);
    setSelectedTime('');
  };

  const handleConfirmReschedule = async () => {
    if (!newDate || !selectedTime) {
      toast.error('Selecione uma data e um horário');
      return;
    }

    try {
      setLoading(true);
      const res = await bookingsAPI.update(rescheduleBooking.id, {
        date: newDate,
        startTime: selectedTime,
        cancelToken: rescheduleBooking.cancel_token
      });

      if (res.success) {
        toast.success('Reagendamento confirmado com sucesso!');
        setRescheduleBooking(null);
        // Refresh bookings
        const updated = await bookingsAPI.getByEmail(email);
        setBookings(updated);
      }
    } catch (err) {
      console.error(err);
      const errMsg = err.response?.data?.error || 'Erro ao reagendar';
      toast.error(errMsg);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitReview = async (e) => {
    e.preventDefault();
    if (!comment) {
      toast.error('Por favor, escreva um depoimento.');
      return;
    }
    
    try {
      setLoading(true);
      await testimonialsAPI.create({
        bookingId: reviewBooking.id,
        clientId: reviewBooking.client_id, // Need to make sure client_id is in the booking object
        rating,
        comment
      });
      
      toast.success('Depoimento enviado com sucesso! Será analisado pela equipe.');
      setReviewBooking(null);
      setRating(5);
      setComment('');
      
      // Atualizar lista para esconder o botão imediatamente
      const updated = await bookingsAPI.getByEmail(email);
      setBookings(updated || []);
    } catch (err) {
      console.error(err);
      toast.error('Erro ao enviar depoimento.');
    } finally {
      setLoading(false);
    }
  };

  const getTodayString = () => {
    return new Date().toISOString().split('T')[0];
  };

  return (
    <div className="min-h-screen flex flex-col justify-between bg-[#FFF8FA] font-sans text-[#4A323D]">
      <PublicNavbar />

      {/* Content */}
      <main className="flex-grow max-w-4xl w-full mx-auto px-6 py-32">
        <div className="text-center mb-12 animate-fade-in">
          <h1 className="section-title">Meus Agendamentos</h1>
          <p className="section-subtitle">Consulte o status, reagende ou cancele seus compromissos informando seu e-mail cadastrado.</p>
          <div className="h-[2px] w-16 bg-gradient-rose-gold mx-auto mt-4"></div>
        </div>

        {/* LOADING OVERLAY */}
        {loading && (
          <div className="fixed inset-0 bg-white/60 backdrop-blur-sm z-50 flex items-center justify-center">
            <div className="flex flex-col items-center gap-3">
              <div className="w-10 h-10 border-4 border-rose border-t-transparent rounded-full animate-spin"></div>
              <p className="text-xs text-mink font-bold uppercase tracking-wider">Carregando...</p>
            </div>
          </div>
        )}

        {/* Search Bar */}
        <div className="card p-8 max-w-lg mx-auto mb-12 animate-fade-in bg-white/80 backdrop-blur-md">
          <form onSubmit={handleSearch} className="flex flex-col sm:flex-row gap-4 items-end">
            <div className="flex-grow w-full">
              <label className="label">E-mail Cadastrado</label>
              <div className="relative">
                <input 
                  type="email" 
                  required
                  placeholder="seuemail@exemplo.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="input pl-11 text-xs"
                />
                <FaEnvelope className="absolute left-4 top-4 text-rose-dark text-xs" />
              </div>
            </div>
            <button type="submit" className="btn-primary w-full sm:w-auto h-fit text-xs py-3 px-6">
              Buscar <FaSearch />
            </button>
          </form>
        </div>

        {/* Search Results */}
        {searched && (
          <div className="animate-slide-up">
            {bookings.length === 0 ? (
              <div className="text-center py-16 card p-8 max-w-lg mx-auto bg-white/80 backdrop-blur-md">
                <FaCalendarTimes className="text-5xl text-rose-dark/30 mx-auto mb-4 animate-float" />
                <h3 className="text-lg font-bold text-mink mb-1">Nenhum agendamento ativo</h3>
                <p className="text-xs text-gray-500 leading-relaxed">Não encontramos agendamentos para o e-mail <strong>{email}</strong>.</p>
                <Link to={`/${companySlug}`} className="btn-primary mt-6 inline-flex text-xs py-2.5 px-6">
                  Agendar um Horário
                </Link>
              </div>
            ) : (
              <div className="flex flex-col gap-5">
                <h2 className="text-base font-bold text-mink flex items-center gap-2.5 mb-2 uppercase tracking-wider text-[11px]">
                  <FaHistory className="text-rose-dark" /> Histórico de Agendamentos
                </h2>
                
                {bookings.map((booking) => {
                  const isCancelled = booking.status === 'cancelled';
                  const bookingDate = new Date(booking.booking_date + 'T' + booking.start_time);
                  const isPast = bookingDate <= new Date();

                  return (
                    <div 
                      key={booking.id} 
                      className={`card p-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-6 bg-white/80 backdrop-blur-md ${
                        isCancelled ? 'opacity-60 border-l-4 border-gray-300' : 'border-l-4 border-gold'
                      }`}
                    >
                      <div className="flex-grow">
                        <div className="flex items-center gap-2.5 mb-2.5">
                          <span className={`badge ${
                            isCancelled 
                              ? 'badge-gray' 
                              : isPast 
                              ? 'badge-rose' 
                              : 'badge-gold'
                          }`}>
                            {isCancelled ? 'Cancelado' : isPast ? 'Realizado' : 'Confirmado'}
                          </span>
                          <span className="font-mono text-[10px] text-gray-400 font-semibold bg-gray-55 px-2 py-0.5 rounded border border-gray-100/10">ID: #{booking.id}</span>
                        </div>
                        <h3 className="text-lg font-bold text-gray-900">{booking.service_name}</h3>
                        <p className="text-xs text-rose-dark font-semibold mb-3">Profissional: {booking.professional_name}</p>
                        
                        <div className="flex flex-wrap gap-5 text-xs text-gray-600 font-medium">
                          <span className="flex items-center gap-1.5">
                            <FaCalendarAlt className="text-rose-dark" /> {booking.booking_date.split('-').reverse().join('/')}
                          </span>
                          <span className="flex items-center gap-1.5">
                            <FaClock className="text-rose-dark" /> {booking.start_time} às {booking.end_time}
                          </span>
                          <span className="font-extrabold text-gray-800">
                            R$ {booking.service_price.toFixed(2)}
                          </span>
                        </div>
                      </div>

                      {/* Client actions */}
                      {!isCancelled && !isPast && (
                        <div className="flex gap-2.5 w-full md:w-auto mt-2 md:mt-0">
                          <button 
                            onClick={() => handleOpenReschedule(booking)}
                            className="btn-outline text-xs px-5 py-2.5 flex-1 md:flex-none justify-center cursor-pointer"
                          >
                            Reagendar
                          </button>
                          <button 
                            onClick={() => handleCancelBooking(booking)}
                            className="btn-ghost border border-red-100 text-red-500 hover:bg-red-50 hover:text-red-700 text-xs px-5 py-2.5 rounded-full flex-1 md:flex-none justify-center cursor-pointer"
                          >
                            Cancelar
                          </button>
                        </div>
                      )}
                      
                      {/* Client actions (Past) */}
                      {isPast && !(booking.testimonials && booking.testimonials.length > 0) && (
                        <div className="flex gap-2.5 w-full md:w-auto mt-2 md:mt-0">
                          <button 
                            onClick={() => setReviewBooking(booking)}
                            className="btn-outline border-[#D47FA6] text-[#D47FA6] hover:bg-[#D47FA6] hover:text-white text-xs px-5 py-2.5 rounded-full flex-1 md:flex-none justify-center cursor-pointer"
                          >
                            Deixar Depoimento
                          </button>
                        </div>
                      )}
                      {isPast && booking.testimonials && booking.testimonials.length > 0 && (
                        <div className="flex gap-2.5 w-full md:w-auto mt-2 md:mt-0">
                           <span className="text-xs text-green-600 font-medium bg-green-50 px-4 py-2 rounded-full flex-1 md:flex-none text-center">
                             Depoimento Enviado
                           </span>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* RESCHEDULE MODAL */}
        {rescheduleBooking && (
          <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-3xl shadow-glass border border-rose-light/20 max-w-xl w-full p-8 animate-fade-in">
              <div className="flex justify-between items-center border-b border-rose-light/20 pb-4 mb-5">
                <h3 className="text-lg font-heading font-bold text-gray-900">Reagendar Atendimento</h3>
                <button 
                  onClick={() => setRescheduleBooking(null)}
                  className="text-gray-400 hover:text-gray-600 text-xl font-bold cursor-pointer"
                >
                  &times;
                </button>
              </div>

              <div className="mb-6 bg-blush/35 p-5 rounded-2xl text-xs text-mink border border-rose-light/20 shadow-sm relative overflow-hidden">
                <p className="font-bold text-[10px] text-rose-dark uppercase tracking-wider mb-2">Detalhes Atuais</p>
                <p className="font-medium">Serviço: <span className="text-gray-900 font-semibold">{rescheduleBooking.service_name}</span></p>
                <p className="font-medium mt-0.5">Profissional: <span className="text-gray-900 font-semibold">{rescheduleBooking.professional_name}</span></p>
                <p className="font-medium mt-0.5">Horário Atual: <span className="text-gray-900 font-semibold">{rescheduleBooking.booking_date.split('-').reverse().join('/')} às {rescheduleBooking.start_time}</span></p>
              </div>

              <div className="grid sm:grid-cols-2 gap-4 mb-6">
                <div>
                  <label className="label">Nova Data</label>
                  <input 
                    type="date"
                    min={getTodayString()}
                    value={newDate}
                    onChange={(e) => setNewDate(e.target.value)}
                    className="input text-xs"
                  />
                </div>
                <div>
                  <label className="label">Novo Horário</label>
                  {slots.length > 0 ? (
                    <select 
                      value={selectedTime}
                      onChange={(e) => setSelectedTime(e.target.value)}
                      className="input text-xs"
                    >
                      <option value="">Selecione...</option>
                      {slots.filter(s => s.available).map((s, idx) => (
                        <option key={idx} value={s.time}>{s.time}</option>
                      ))}
                    </select>
                  ) : (
                    <div className="text-xs text-gray-500 py-3.5 pl-3 bg-gray-50/50 border rounded-xl">
                      {availabilityMsg || 'Selecione uma data válida'}
                    </div>
                  )}
                </div>
              </div>

              <div className="flex justify-end gap-3 mt-8">
                <button 
                  type="button" 
                  onClick={() => setRescheduleBooking(null)}
                  className="btn-outline text-xs px-5 py-2.5 cursor-pointer"
                >
                  Cancelar
                </button>
                <button 
                  type="button"
                  onClick={handleConfirmReschedule}
                  disabled={!selectedTime}
                  className={`btn-primary text-xs px-6 py-2.5 cursor-pointer ${!selectedTime ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  Confirmar Reagendamento
                </button>
              </div>
            </div>
          </div>
        )}

        {/* REVIEW MODAL */}
        {reviewBooking && (
          <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-3xl shadow-glass border border-rose-light/20 max-w-xl w-full p-8 animate-fade-in">
              <div className="flex justify-between items-center border-b border-rose-light/20 pb-4 mb-5">
                <h3 className="text-lg font-heading font-bold text-gray-900">Avaliar Atendimento</h3>
                <button 
                  onClick={() => setReviewBooking(null)}
                  className="text-gray-400 hover:text-gray-600 text-xl font-bold cursor-pointer"
                >
                  &times;
                </button>
              </div>

              <div className="mb-6 bg-blush/35 p-5 rounded-2xl text-xs text-mink border border-rose-light/20 shadow-sm relative overflow-hidden">
                <p className="font-bold text-[10px] text-rose-dark uppercase tracking-wider mb-2">Detalhes do Serviço</p>
                <p className="font-medium">Serviço: <span className="text-gray-900 font-semibold">{reviewBooking.service_name}</span></p>
                <p className="font-medium mt-0.5">Profissional: <span className="text-gray-900 font-semibold">{reviewBooking.professional_name}</span></p>
              </div>

              <form onSubmit={handleSubmitReview}>
                <div className="mb-4">
                  <label className="label mb-2 block">Sua Avaliação</label>
                  <div className="flex gap-2">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <FaStar 
                        key={star} 
                        className={`text-2xl cursor-pointer transition-colors ${star <= rating ? 'text-amber-400' : 'text-gray-200'}`}
                        onClick={() => setRating(star)}
                      />
                    ))}
                  </div>
                </div>

                <div className="mb-6">
                  <label className="label">Seu Depoimento</label>
                  <textarea 
                    rows="4"
                    className="input text-xs resize-none"
                    placeholder="Conte-nos como foi sua experiência..."
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    required
                  ></textarea>
                </div>

                <div className="flex justify-end gap-3 mt-8">
                  <button 
                    type="button" 
                    onClick={() => setReviewBooking(null)}
                    className="btn-outline text-xs px-5 py-2.5 cursor-pointer"
                  >
                    Cancelar
                  </button>
                  <button 
                    type="submit"
                    className="btn-primary text-xs px-6 py-2.5 cursor-pointer"
                  >
                    Enviar Depoimento
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </main>

      <FloatingWhatsAppButton />
      <PublicFooter />
    </div>
  );
}
