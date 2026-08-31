import { useState, useEffect } from 'react';
import { adminAPI } from '../../services/api';
import { toast } from 'react-hot-toast';
import { FaCalendarAlt, FaSpinner, FaUserTie } from 'react-icons/fa';
import { getSalonSettings } from '../../services/salonSettings';

export default function AvailabilityMonitor() {
  const [currentDate, setCurrentDate] = useState(new Date().toISOString().split('T')[0]);
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState(null);
  const [salon, setSalon] = useState(getSalonSettings());

  useEffect(() => {
    const updateSalon = () => setSalon(getSalonSettings());
    window.addEventListener('salonSettingsUpdated', updateSalon);
    return () => window.removeEventListener('salonSettingsUpdated', updateSalon);
  }, []);

  const fetchData = async (silent = false) => {
    try {
      if (!silent) setLoading(true);
      const res = await adminAPI.getAvailabilityMonitor(currentDate);
      setData(res);
    } catch (err) {
      console.error(err);
      if (!silent) toast.error('Erro ao buscar monitor de vagas');
    } finally {
      if (!silent) setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(() => {
      fetchData(true);
    }, 15000); // 15s auto-refresh
    return () => clearInterval(interval);
  }, [currentDate]);

  const handleDateChange = (e) => {
    setCurrentDate(e.target.value);
  };

  return (
    <div className="animate-fade-in flex flex-col gap-6">
      
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-heading font-bold text-gray-900">Monitor de Vagas</h1>
          <p className="text-xs text-gray-500">Acompanhamento de horários livres por profissional.</p>
        </div>
        
        {/* Date Filter */}
        <div className="flex items-center gap-2 bg-white p-2 rounded-xl border border-gray-200 shadow-sm">
          <FaCalendarAlt className="text-rose-dark text-sm ml-1" />
          <input 
            type="date" 
            value={currentDate}
            onChange={handleDateChange}
            className="input !py-1 !px-2 border-none bg-transparent shadow-none focus:ring-0 text-sm font-semibold text-gray-700 w-36"
          />
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center items-center py-20">
          <FaSpinner className="animate-spin text-4xl text-primary" />
        </div>
      ) : (
        <div className="flex flex-col gap-6">
          {data?.closed ? (
            <div className="card-glass p-8 text-center border-l-4 border-l-rose-dark">
              <h3 className="text-lg font-bold text-gray-800">O Salão está fechado nesta data.</h3>
            </div>
          ) : data?.professionals?.length === 0 ? (
            <div className="card-glass p-8 text-center text-gray-500">
              Nenhum profissional encontrado para esta data.
            </div>
          ) : (
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
              {data?.professionals.map((pro) => (
                <div key={pro.professional.id} className="card-glass p-5 border border-white/50 shadow-glass flex flex-col">
                  
                  <div className="flex justify-between items-center mb-4 border-b border-gray-100 pb-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-rose-light to-blush flex items-center justify-center text-rose-dark shadow-sm">
                        <FaUserTie className="text-lg" />
                      </div>
                      <div>
                        <h2 className="font-bold text-gray-900">{pro.professional.name}</h2>
                        <span className="text-xs text-gray-500 font-semibold">
                          {pro.availableSlots} de {pro.totalSlots} vagas livres
                        </span>
                      </div>
                    </div>
                  </div>

                  {pro.slots.length === 0 ? (
                    <div className="text-center text-sm text-gray-400 py-4 font-medium bg-gray-50 rounded-lg">
                      Não há horários disponíveis para este profissional (folga ou bloqueio).
                    </div>
                  ) : (
                    <div className="flex flex-wrap gap-2 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                      {pro.slots.map((slot, idx) => (
                        <div 
                          key={idx} 
                          className={`
                            px-3 py-1.5 rounded-md text-xs font-bold border transition-colors flex items-center justify-center min-w-[70px]
                            ${slot.available 
                              ? 'bg-green-50 text-green-700 border-green-200 shadow-sm' 
                              : 'bg-gray-100 text-gray-400 border-gray-200 line-through opacity-70'}
                          `}
                          title={slot.available ? 'Livre' : 'Ocupado / Indisponível'}
                        >
                          {slot.time}
                        </div>
                      ))}
                    </div>
                  )}

                </div>
              ))}
            </div>
          )}
        </div>
      )}
      
    </div>
  );
}
