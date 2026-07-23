import { useState, useEffect } from 'react';
import { adminAPI, bookingsAPI, professionalsAPI } from '../../services/api';
import { toast } from 'react-hot-toast';
import { 
  FaCalendarAlt, FaChevronLeft, FaChevronRight, FaTrashAlt, 
  FaUserTie, FaPhoneAlt, FaEnvelope, FaSpinner
} from 'react-icons/fa';

export default function AdminAgenda() {
  const [view, setView] = useState('day'); // 'day', 'week', 'month'
  const [currentDate, setCurrentDate] = useState(new Date().toISOString().split('T')[0]);
  const [loading, setLoading] = useState(true);
  
  const [bookings, setBookings] = useState([]);
  const [startDateStr, setStartDateStr] = useState('');
  const [endDateStr, setEndDateStr] = useState('');

  const [professionals, setProfessionals] = useState([]);
  const [selectedProFilter, setSelectedProFilter] = useState('all');

  // Load professionals for filter dropdown
  useEffect(() => {
    async function loadPros() {
      try {
        const pros = await professionalsAPI.getAll('all');
        setProfessionals(pros);
      } catch (err) {
        console.error(err);
      }
    }
    loadPros();
  }, []);

  // Fetch agenda bookings for manual refresh
  const fetchAgenda = async () => {
    try {
      setLoading(true);
      const res = await adminAPI.getSchedule(view, currentDate);
      setBookings(res.bookings || []);
      setStartDateStr(res.startDate || '');
      setEndDateStr(res.endDate || '');
    } catch (err) {
      console.error(err);
      toast.error('Erro ao buscar a agenda');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    async function loadSchedule() {
      try {
        const res = await adminAPI.getSchedule(view, currentDate);
        setBookings(res.bookings || []);
        setStartDateStr(res.startDate || '');
        setEndDateStr(res.endDate || '');
      } catch (err) {
        console.error(err);
        toast.error('Erro ao buscar a agenda');
      } finally {
        setLoading(false);
      }
    }
    loadSchedule();
  }, [view, currentDate]);

  // Navigate dates
  const handleNavigate = (direction) => {
    const d = new Date(currentDate + 'T00:00:00');
    const offset = direction === 'next' ? 1 : -1;

    if (view === 'day') {
      d.setDate(d.getDate() + offset);
    } else if (view === 'week') {
      d.setDate(d.getDate() + offset * 7);
    } else { // month
      d.setMonth(d.getMonth() + offset);
    }
    setCurrentDate(d.toISOString().split('T')[0]);
  };

  const handleCancelBooking = async (id) => {
    const confirmCancel = window.confirm('Deseja realmente cancelar este agendamento?');
    if (!confirmCancel) return;

    try {
      setLoading(true);
      await bookingsAPI.delete(id);
      toast.success('Agendamento cancelado');
      await fetchAgenda();
    } catch (err) {
      console.error(err);
      toast.error('Erro ao cancelar agendamento');
    } finally {
      setLoading(false);
    }
  };

  // Format date display range for the header
  const getHeaderDateLabel = () => {
    if (!startDateStr) return '';
    
    const formatDate = (str) => {
      const parts = str.split('-');
      return `${parts[2]}/${parts[1]}/${parts[0]}`;
    };

    if (view === 'day') {
      return formatDate(startDateStr);
    }
    return `${formatDate(startDateStr)} até ${formatDate(endDateStr)}`;
  };

  // Filter bookings locally by selected professional
  const filteredBookings = selectedProFilter === 'all'
    ? bookings
    : bookings.filter(b => b.professional_id.toString() === selectedProFilter);

  return (
    <div className="animate-fade-in flex flex-col gap-6">
      
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-heading font-bold text-gray-900">Agenda de Atendimentos</h1>
          <p className="text-xs text-gray-500">Gerencie a fila diária, semanal e mensal de compromissos.</p>
        </div>

        {/* View Toggle */}
        <div className="flex items-center bg-white rounded-xl border p-1 shadow-sm">
          {[
            { id: 'day', label: 'Dia' },
            { id: 'week', label: 'Semana' },
            { id: 'month', label: 'Mês' }
          ].map(v => (
            <button 
              key={v.id}
              onClick={() => { setView(v.id); setCurrentDate(new Date().toISOString().split('T')[0]); }}
              className={`px-4 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                view === v.id 
                  ? 'bg-gradient-rose-gold text-white shadow-rose' 
                  : 'text-gray-600 hover:text-rose-dark'
              }`}
            >
              {v.label}
            </button>
          ))}
        </div>
      </div>

      {/* Date Navigator Controls & Filters */}
      <div className="card p-4 flex flex-col sm:flex-row justify-between items-center gap-4">
        <div className="flex items-center gap-3">
          <button 
            onClick={() => handleNavigate('prev')}
            className="p-2 rounded-lg border hover:bg-rose-light/10 text-gray-600 transition-colors"
          >
            <FaChevronLeft />
          </button>
          <span className="font-heading font-bold text-mink text-lg select-none min-w-[150px] text-center">
            {getHeaderDateLabel()}
          </span>
          <button 
            onClick={() => handleNavigate('next')}
            className="p-2 rounded-lg border hover:bg-rose-light/10 text-gray-600 transition-colors"
          >
            <FaChevronRight />
          </button>
          <button 
            onClick={() => setCurrentDate(new Date().toISOString().split('T')[0])}
            className="text-xs font-semibold text-rose-dark bg-blush px-3 py-1.5 rounded-lg hover:shadow-sm"
          >
            Hoje
          </button>
        </div>

        {/* Filters */}
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <label className="text-xs font-bold text-mink whitespace-nowrap flex items-center gap-1">
            <FaUserTie /> Filtrar Profissional:
          </label>
          <select 
            value={selectedProFilter}
            onChange={(e) => setSelectedProFilter(e.target.value)}
            className="input text-xs py-1.5 w-full sm:w-48"
          >
            <option value="all">Todos</option>
            {professionals.map(p => (
              <option key={p.id} value={p.id}>{p.name}</option>
            ))}
          </select>
        </div>
      </div>

      {/* LOADING INDICATOR */}
      {loading ? (
        <div className="card p-12 text-center flex flex-col items-center justify-center gap-4 min-h-[300px]">
          <FaSpinner className="text-3xl text-rose-dark animate-spin" />
          <p className="text-sm text-gray-500 font-semibold">Buscando agendamentos...</p>
        </div>
      ) : (
        /* Agenda Table / List */
        <div className="card p-6 min-h-[350px]">
          {filteredBookings.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-gray-400">
              <FaCalendarAlt className="text-5xl text-rose-light mb-3" />
              <h3 className="text-lg font-bold text-mink mb-1">Nenhum compromisso</h3>
              <p className="text-sm">Não há nenhum agendamento registrado para este período.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-rose-light/10 text-xs text-gray-400 font-semibold uppercase">
                    <th className="py-2.5">Data & Hora</th>
                    <th className="py-2.5">Cliente</th>
                    <th className="py-2.5">Serviço</th>
                    <th className="py-2.5">Profissional</th>
                    <th className="py-2.5">Observações</th>
                    <th className="py-2.5 text-right">Preço</th>
                    <th className="py-2.5 text-center">Ações</th>
                  </tr>
                </thead>
                <tbody className="text-sm">
                  {filteredBookings.map((b) => (
                    <tr key={b.id} className="border-b border-rose-light/10 hover:bg-rose-light/5">
                      <td className="py-3">
                        <div className="flex flex-col">
                          <span className="font-semibold text-rose-dark">{b.start_time} - {b.end_time}</span>
                          <span className="text-[10px] text-gray-400">{b.booking_date.split('-').reverse().join('/')}</span>
                        </div>
                      </td>
                      <td className="py-3">
                        <div className="flex flex-col">
                          <span className="font-semibold text-gray-900">{b.client_name}</span>
                          <span className="text-[10px] text-gray-400 flex items-center gap-1"><FaPhoneAlt className="text-[8px]" /> {b.client_phone}</span>
                          <span className="text-[10px] text-gray-400 flex items-center gap-1"><FaEnvelope className="text-[8px]" /> {b.client_email}</span>
                        </div>
                      </td>
                      <td className="py-3">
                        <div className="flex flex-col">
                          <span className="font-bold text-gray-800">{b.service_name}</span>
                          <span className="text-[10px] text-gray-400">{b.service_category} ({b.duration_minutes} min)</span>
                        </div>
                      </td>
                      <td className="py-3 font-semibold text-gray-700">{b.professional_name}</td>
                      <td className="py-3 text-xs text-gray-500 max-w-xs truncate" title={b.notes}>
                        {b.notes || <span className="text-gray-300 italic">Nenhuma</span>}
                      </td>
                      <td className="py-3 text-right font-bold text-gray-900">R$ {b.service_price.toFixed(2)}</td>
                      <td className="py-3 text-center">
                        <button 
                          onClick={() => handleCancelBooking(b.id)}
                          className="p-2 text-red-500 hover:bg-red-50 rounded-lg hover:text-red-700 transition-colors"
                          title="Cancelar Agendamento"
                        >
                          <FaTrashAlt />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
