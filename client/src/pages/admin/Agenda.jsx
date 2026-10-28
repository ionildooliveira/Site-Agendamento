import { useState, useEffect } from 'react';
import { adminAPI, bookingsAPI, professionalsAPI } from '../../services/api';
import { toast } from 'react-hot-toast';
import { 
  FaCalendarAlt, FaChevronLeft, FaChevronRight, FaTrashAlt, 
  FaUserTie, FaPhoneAlt, FaEnvelope, FaSpinner, FaExclamationTriangle, FaTimes
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

  // Deletion modal state
  const [bookingToDelete, setBookingToDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);

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
  const fetchAgenda = async (silent = false) => {
    try {
      if (!silent) setLoading(true);
      const res = await adminAPI.getSchedule(view, currentDate);
      setBookings(res.bookings || []);
      setStartDateStr(res.startDate || '');
      setEndDateStr(res.endDate || '');
    } catch (err) {
      console.error(err);
      if (!silent) toast.error('Erro ao buscar a agenda');
    } finally {
      if (!silent) setLoading(false);
    }
  };

  useEffect(() => {
    fetchAgenda();

    // Auto-atualização (Polling a cada 15 segundos)
    const interval = setInterval(() => {
      fetchAgenda(true);
    }, 15000);

    return () => clearInterval(interval);
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

  const handleConfirmDelete = async () => {
    if (!bookingToDelete) return;

    try {
      setDeleting(true);
      await bookingsAPI.delete(bookingToDelete.id);
      toast.success('Agendamento excluído com sucesso');
      setBookingToDelete(null);
      await fetchAgenda();
    } catch (err) {
      console.error('Erro ao excluir agendamento:', err);
      const msg = err.response?.data?.error || 'Erro ao cancelar agendamento';
      toast.error(msg);
    } finally {
      setDeleting(false);
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
    : bookings.filter(b => b.professional_id?.toString() === selectedProFilter);

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
              className={`px-4 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                view === v.id 
                  ? 'text-white shadow-xs' 
                  : 'text-gray-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
              style={view === v.id ? { background: 'var(--theme-gradient)' } : {}}
            >
              {v.label}
            </button>
          ))}
        </div>
      </div>

      {/* Date Navigator Controls & Filters */}
      <div className="card p-4 flex flex-col sm:flex-row justify-between items-center gap-4 border border-slate-200/80 shadow-xs">
        <div className="flex items-center gap-3">
          <button 
            onClick={() => handleNavigate('prev')}
            className="p-2 rounded-lg border border-slate-200 hover:bg-slate-100 text-gray-600 transition-colors cursor-pointer"
          >
            <FaChevronLeft />
          </button>
          <span className="font-heading font-bold text-slate-800 text-lg select-none min-w-[150px] text-center">
            {getHeaderDateLabel()}
          </span>
          <button 
            onClick={() => handleNavigate('next')}
            className="p-2 rounded-lg border border-slate-200 hover:bg-slate-100 text-gray-600 transition-colors cursor-pointer"
          >
            <FaChevronRight />
          </button>
          <button 
            onClick={() => setCurrentDate(new Date().toISOString().split('T')[0])}
            className="text-xs font-semibold px-3 py-1.5 rounded-lg hover:shadow-xs cursor-pointer transition-colors"
            style={{
              backgroundColor: 'var(--theme-primary-light, #f1f5f9)',
              color: 'var(--theme-primary, #059669)',
            }}
          >
            Hoje
          </button>
        </div>

        {/* Filters */}
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <label className="text-xs font-bold text-slate-700 whitespace-nowrap flex items-center gap-1">
            <FaUserTie /> Filtrar Profissional:
          </label>
          <select 
            value={selectedProFilter}
            onChange={(e) => setSelectedProFilter(e.target.value)}
            className="input text-xs py-1.5 w-full sm:w-48 cursor-pointer"
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
        <div className="card p-12 text-center flex flex-col items-center justify-center gap-4 min-h-[300px] border border-slate-200/80">
          <FaSpinner className="text-3xl animate-spin" style={{ color: 'var(--theme-primary)' }} />
          <p className="text-sm text-gray-500 font-semibold">Buscando agendamentos...</p>
        </div>
      ) : (
        /* Agenda Table / List */
        <div className="card p-6 min-h-[350px] border border-slate-200/80 shadow-xs">
          {filteredBookings.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-gray-400">
              <FaCalendarAlt className="text-5xl text-slate-300 mb-3" />
              <h3 className="text-lg font-bold text-slate-800 mb-1">Nenhum compromisso</h3>
              <p className="text-sm">Não há nenhum agendamento registrado para este período.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-100 text-xs text-gray-400 font-semibold uppercase">
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
                    <tr key={b.id} className="border-b border-slate-100 hover:bg-slate-50 transition-colors">
                      <td className="py-3">
                        <div className="flex flex-col">
                          <span className="font-semibold" style={{ color: 'var(--theme-primary)' }}>{b.start_time} - {b.end_time}</span>
                          <span className="text-[10px] text-gray-400">{b.booking_date.split('-').reverse().join('/')}</span>
                        </div>
                      </td>
                      <td className="py-3">
                        <div className="flex flex-col">
                          <span className="font-semibold text-gray-900">{b.client_name || 'Cliente'}</span>
                          {b.client_phone && (
                            <span className="text-[10px] text-gray-400 flex items-center gap-1">
                              <FaPhoneAlt className="text-[8px]" /> {b.client_phone}
                            </span>
                          )}
                          {b.client_email && (
                            <span className="text-[10px] text-gray-400 flex items-center gap-1">
                              <FaEnvelope className="text-[8px]" /> {b.client_email}
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="py-3">
                        <div className="flex flex-col">
                          <span className="font-bold text-gray-800">{b.service_name}</span>
                          <span className="text-[10px] text-gray-400">
                            {b.service_category ? `${b.service_category} • ` : ''}{b.duration_minutes} min
                          </span>
                        </div>
                      </td>
                      <td className="py-3 font-semibold text-gray-700">{b.professional_name}</td>
                      <td className="py-3 text-xs text-gray-500 max-w-xs truncate" title={b.notes}>
                        {b.notes || <span className="text-gray-300 italic">Nenhuma</span>}
                      </td>
                      <td className="py-3 text-right font-bold text-gray-900">
                        R$ {Number(b.service_price || 0).toFixed(2)}
                      </td>
                      <td className="py-3 text-center">
                        <button 
                          type="button"
                          onClick={() => setBookingToDelete(b)}
                          className="p-2 text-red-500 hover:bg-red-50 rounded-lg hover:text-red-700 transition-colors cursor-pointer"
                          title="Cancelar e Excluir Agendamento"
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

      {/* Modal de Confirmação de Exclusão */}
      {bookingToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs animate-fade-in">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 animate-scale-up">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-xl bg-red-100 text-red-600 flex items-center justify-center shrink-0 text-xl">
                <FaExclamationTriangle />
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-bold text-slate-900">Cancelar Agendamento?</h3>
                <p className="text-xs text-slate-500 mt-1">
                  Tem certeza que deseja cancelar e excluir este agendamento? O horário será liberado imediatamente para novos clientes.
                </p>

                <div className="mt-4 p-3.5 bg-slate-50 rounded-xl border border-slate-200/80 text-xs space-y-2">
                  <div className="flex justify-between">
                    <span className="text-slate-500 font-medium">Cliente:</span>
                    <span className="font-bold text-slate-800">{bookingToDelete.client_name || 'Cliente'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500 font-medium">Serviço:</span>
                    <span className="font-semibold text-slate-800">{bookingToDelete.service_name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500 font-medium">Profissional:</span>
                    <span className="font-semibold text-slate-800">{bookingToDelete.professional_name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500 font-medium">Data & Horário:</span>
                    <span className="font-bold" style={{ color: 'var(--theme-primary, #059669)' }}>
                      {bookingToDelete.booking_date?.split('-').reverse().join('/')} às {bookingToDelete.start_time}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-6 flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
              <button
                type="button"
                disabled={deleting}
                onClick={() => setBookingToDelete(null)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
              >
                Voltar
              </button>
              <button
                type="button"
                disabled={deleting}
                onClick={handleConfirmDelete}
                className="px-4 py-2 text-xs font-bold text-white bg-red-600 hover:bg-red-700 rounded-xl shadow-xs transition-colors flex items-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {deleting ? (
                  <>
                    <FaSpinner className="animate-spin text-xs" /> Excluindo...
                  </>
                ) : (
                  <>
                    <FaTrashAlt className="text-xs" /> Sim, Cancelar Agendamento
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
