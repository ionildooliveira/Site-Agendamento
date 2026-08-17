import { useState, useEffect } from 'react';
import { adminAPI } from '../../services/api';
import { toast } from 'react-hot-toast';
import { FaCalendarCheck, FaCalendarDay, FaCoins, FaUserFriends, 
  FaRegClock, FaChevronRight, FaStar 
} from 'react-icons/fa';
import { Link, useParams } from 'react-router-dom';
import { getSalonSettings } from '../../services/salonSettings';

export default function AdminDashboard() {
  const { companySlug } = useParams();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState({
    kpi: {
      totalBookings: 0,
      todayBookings: 0,
      monthBookings: 0,
      monthRevenue: 0,
      recurringClients: 0
    },
    topServices: [],
    todaySchedule: [],
    upcomingBookings: []
  });
  const [salon, setSalon] = useState(getSalonSettings());
  
  const currentDate = new Date();
  const [selectedMonth, setSelectedMonth] = useState(currentDate.getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(currentDate.getFullYear());

  useEffect(() => {
    const updateSalon = () => setSalon(getSalonSettings());
    window.addEventListener('salonSettingsUpdated', updateSalon);
    return () => window.removeEventListener('salonSettingsUpdated', updateSalon);
  }, []);

  useEffect(() => {
    async function loadDashboard(silent = false) {
      try {
        if (!silent) setLoading(true);
        const res = await adminAPI.getDashboard(selectedMonth, selectedYear);
        setData(res);
      } catch (err) {
        console.error(err);
        if (!silent) toast.error('Erro ao carregar os dados do painel');
      } finally {
        if (!silent) setLoading(false);
      }
    }
    loadDashboard();

    // Auto-atualização (Polling a cada 15 segundos)
    const interval = setInterval(() => {
      loadDashboard(true);
    }, 15000);

    return () => clearInterval(interval);
  }, [selectedMonth, selectedYear]);

  if (loading) {
    return (
      <div className="flex flex-col gap-6 animate-pulse-soft">
        <div className="h-8 w-48 bg-gray-200 rounded-lg mb-6"></div>
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
          {[1, 2, 3, 4, 5].map(i => (
            <div key={i} className="h-28 bg-gray-200 rounded-2xl"></div>
          ))}
        </div>
        <div className="grid lg:grid-cols-3 gap-6 mt-6">
          <div className="lg:col-span-2 h-96 bg-gray-200 rounded-2xl"></div>
          <div className="h-96 bg-gray-200 rounded-2xl"></div>
        </div>
      </div>
    );
  }

  const { kpi, topServices, todaySchedule, upcomingBookings } = data;

  const kpis = [
    { label: 'Total Geral', val: kpi.totalBookings, desc: 'Agendamentos totais', icon: <FaCalendarCheck />, color: 'text-indigo-600 bg-indigo-50 border-indigo-100' },
    { label: 'Hoje', val: kpi.todayBookings, desc: 'Agendamentos hoje', icon: <FaCalendarDay />, color: 'text-rose-dark bg-blush border-rose-light/20' },
    { label: 'Agendamentos Mês', val: kpi.monthBookings, desc: 'Mês selecionado', icon: <FaRegClock />, color: 'text-amber-600 bg-amber-50 border-amber-100' },
    { label: 'Faturamento Mês', val: `R$ ${Number(kpi.monthRevenue).toFixed(2)}`, desc: 'Mês selecionado', icon: <FaCoins />, color: 'text-green-600 bg-green-50 border-green-100' },
    { label: 'Clientes Recorrentes', val: kpi.recurringClients, desc: 'Fidelizados (2+ vezes)', icon: <FaUserFriends />, color: 'text-gold-dark bg-gold-light/20 border-gold-light/20' },
  ];

  return (
    <div className="animate-fade-in flex flex-col gap-6">
      
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-heading font-bold text-gray-900">Dashboard</h1>
          <p className="text-xs text-gray-500">Métricas gerais e agenda do {salon.name || 'Studio Beauty'}.</p>
        </div>
        
        {/* Filtros de Mês/Ano */}
        <div className="flex items-center gap-2 bg-white p-2 rounded-xl border border-gray-200 shadow-sm">
          <select 
            value={selectedMonth} 
            onChange={(e) => setSelectedMonth(Number(e.target.value))}
            className="border-none bg-transparent text-sm font-semibold text-gray-700 focus:ring-0 cursor-pointer"
          >
            {Array.from({length: 12}, (_, i) => i + 1).map(m => (
              <option key={m} value={m}>
                {new Date(2000, m - 1, 1).toLocaleString('pt-BR', { month: 'long' }).replace(/^\w/, c => c.toUpperCase())}
              </option>
            ))}
          </select>
          <div className="w-px h-4 bg-gray-300"></div>
          <select 
            value={selectedYear} 
            onChange={(e) => setSelectedYear(Number(e.target.value))}
            className="border-none bg-transparent text-sm font-semibold text-gray-700 focus:ring-0 cursor-pointer"
          >
            {Array.from({length: 10}, (_, i) => new Date().getFullYear() - 2 + i).map(y => (
              <option key={y} value={y}>{y}</option>
            ))}
          </select>
        </div>
      </div>

      {/* KPI Section */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        {kpis.map((k, i) => (
          <div key={i} className="card p-5 bg-white border border-rose-light/10 flex items-start justify-between">
            <div className="flex flex-col gap-1">
              <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">{k.label}</span>
              <span className="text-xl md:text-2xl font-bold text-gray-800 tracking-tight">{k.val}</span>
              <span className="text-[10px] text-gray-400 mt-1">{k.desc}</span>
            </div>
            <div className={`p-3 rounded-xl border text-lg ${k.color}`}>
              {k.icon}
            </div>
          </div>
        ))}
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        
        {/* Today's Agenda list */}
        <div className="lg:col-span-2 flex flex-col gap-4">
          <div className="flex justify-between items-center">
            <h2 className="text-lg font-bold text-mink flex items-center gap-2">
              <FaCalendarDay className="text-rose-dark" /> Agenda de Hoje ({todaySchedule.length})
            </h2>
            <Link to={`/${companySlug}/admin/agenda`} className="text-xs text-rose-dark font-bold hover:underline flex items-center gap-1">
              Ver agenda completa <FaChevronRight />
            </Link>
          </div>

          <div className="card p-4 flex flex-col gap-3 min-h-[300px]">
            {todaySchedule.length === 0 ? (
              <div className="flex-grow flex flex-col items-center justify-center py-12 text-gray-400">
                <FaCalendarCheck className="text-4xl text-rose-light mb-2 animate-pulse-soft" />
                <p className="text-sm">Sem agendamentos confirmados para hoje.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-rose-light/10 text-xs text-gray-400 font-semibold uppercase">
                      <th className="py-2">Hora</th>
                      <th className="py-2">Cliente</th>
                      <th className="py-2">Serviço</th>
                      <th className="py-2">Profissional</th>
                      <th className="py-2 text-right">Preço</th>
                    </tr>
                  </thead>
                  <tbody className="text-sm">
                    {todaySchedule.map((b) => (
                      <tr key={b.id} className="border-b border-rose-light/10 hover:bg-rose-light/5">
                        <td className="py-3 font-semibold text-rose-dark">{b.start_time}</td>
                        <td className="py-3">
                          <div>
                            <p className="font-semibold text-gray-800">{b.client_name}</p>
                            <p className="text-[10px] text-gray-400">{b.client_phone}</p>
                          </div>
                        </td>
                        <td className="py-3 text-gray-700">{b.service_name}</td>
                        <td className="py-3 text-gray-600">{b.professional_name}</td>
                        <td className="py-3 text-right font-bold text-gray-900">R$ {b.service_price.toFixed(2)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        {/* Top Services Stats */}
        <div className="flex flex-col gap-4">
          <h2 className="text-lg font-bold text-mink flex items-center gap-2">
            <FaStar className="text-gold" /> Serviços Mais Procurados
          </h2>
          <div className="card p-5 flex flex-col gap-4 min-h-[300px]">
            {topServices.length === 0 ? (
              <div className="flex-grow flex items-center justify-center text-gray-400 py-12 text-sm">
                Nenhum dado registrado.
              </div>
            ) : (
              topServices.map((s, idx) => {
                const maxCount = topServices[0]?.count || 1;
                const percentage = (s.count / maxCount) * 100;
                return (
                  <div key={idx} className="flex flex-col gap-1.5">
                    <div className="flex justify-between items-center text-xs">
                      <span className="font-bold text-gray-800">{s.name}</span>
                      <span className="text-gray-500 font-semibold">{s.count} agendamentos</span>
                    </div>
                    <div className="w-full h-2.5 bg-gray-100 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-gradient-rose-gold rounded-full"
                        style={{ width: `${percentage}%` }}
                      ></div>
                    </div>
                    <div className="text-right text-[10px] text-gray-400 font-medium">
                      Total gerado: R$ {s.revenue.toFixed(2)}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>

      {/* Upcoming bookings next 7 days */}
      <div className="flex flex-col gap-4">
        <h2 className="text-lg font-bold text-mink">Próximos Compromissos (7 Dias)</h2>
        <div className="card p-6">
          {upcomingBookings.length === 0 ? (
            <p className="text-gray-400 text-sm text-center py-6">Nenhum agendamento futuro agendado.</p>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {upcomingBookings.map((b) => (
                <div key={b.id} className="p-4 rounded-xl border border-rose-light/10 bg-cream/40 flex flex-col gap-2">
                  <div className="flex justify-between items-center">
                    <span className="text-xs font-semibold text-rose-dark uppercase">{b.booking_date.split('-').reverse().join('/')}</span>
                    <span className="text-xs font-bold bg-white px-2 py-0.5 rounded border text-gray-700">{b.start_time}</span>
                  </div>
                  <h4 className="font-bold text-gray-900">{b.service_name}</h4>
                  <div className="text-xs text-gray-500 flex flex-col gap-0.5">
                    <p>Cliente: <strong>{b.client_name}</strong></p>
                    <p>Profissional: <strong>{b.professional_name}</strong></p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

    </div>
  );
}
