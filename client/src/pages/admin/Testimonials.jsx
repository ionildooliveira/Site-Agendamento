import { useState, useEffect } from 'react';
import { testimonialsAPI } from '../../services/api';
import { toast } from 'react-hot-toast';
import { FaStar, FaCheck, FaTimes, FaClock } from 'react-icons/fa';

export default function AdminTestimonials() {
  const [testimonials, setTestimonials] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all'); // all, pending, approved, rejected

  useEffect(() => {
    fetchTestimonials();
  }, []);

  const fetchTestimonials = async () => {
    try {
      setLoading(true);
      const data = await testimonialsAPI.getAdminAll();
      setTestimonials(data || []);
    } catch (err) {
      console.error(err);
      toast.error('Erro ao carregar depoimentos');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateStatus = async (id, status) => {
    try {
      await testimonialsAPI.updateStatus(id, status);
      toast.success('Status atualizado com sucesso!');
      
      // Update locally
      setTestimonials(testimonials.map(t => 
        t.id === id ? { ...t, status } : t
      ));
    } catch (err) {
      console.error(err);
      toast.error('Erro ao atualizar status');
    }
  };

  const filteredTestimonials = testimonials.filter(t => {
    if (filter === 'all') return true;
    return t.status === filter;
  });

  const getStatusBadge = (status) => {
    switch (status) {
      case 'approved':
        return <span className="flex items-center gap-1 text-xs font-medium bg-green-100 text-green-700 px-2 py-1 rounded-full"><FaCheck className="text-[10px]" /> Aprovado</span>;
      case 'rejected':
        return <span className="flex items-center gap-1 text-xs font-medium bg-red-100 text-red-700 px-2 py-1 rounded-full"><FaTimes className="text-[10px]" /> Rejeitado</span>;
      case 'pending':
      default:
        return <span className="flex items-center gap-1 text-xs font-medium bg-amber-100 text-amber-700 px-2 py-1 rounded-full"><FaClock className="text-[10px]" /> Pendente</span>;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-[#4A323D]">Depoimentos</h2>
          <p className="text-gray-600 mt-1">Gerencie as avaliações deixadas pelos clientes</p>
        </div>

        <div className="flex bg-white rounded-lg p-1 border border-gray-200">
          <button
            onClick={() => setFilter('all')}
            className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${filter === 'all' ? 'bg-[#FDF2F7] text-[#D47FA6]' : 'text-gray-600 hover:bg-gray-50'}`}
          >
            Todos
          </button>
          <button
            onClick={() => setFilter('pending')}
            className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${filter === 'pending' ? 'bg-[#FDF2F7] text-[#D47FA6]' : 'text-gray-600 hover:bg-gray-50'}`}
          >
            Pendentes
          </button>
          <button
            onClick={() => setFilter('approved')}
            className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${filter === 'approved' ? 'bg-[#FDF2F7] text-[#D47FA6]' : 'text-gray-600 hover:bg-gray-50'}`}
          >
            Aprovados
          </button>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-12 text-gray-500">Carregando depoimentos...</div>
      ) : filteredTestimonials.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-12 text-center">
          <p className="text-gray-500">Nenhum depoimento encontrado.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {filteredTestimonials.map((t) => (
            <div key={t.id} className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 flex flex-col justify-between">
              <div>
                <div className="flex justify-between items-start mb-4">
                  <div className="flex items-center gap-3">
                    <img
                      src={`https://ui-avatars.com/api/?name=${encodeURIComponent(t.client?.name || 'Cliente')}&background=F5D8E3&color=D47FA6`}
                      alt={t.client?.name}
                      className="w-10 h-10 rounded-full object-cover"
                    />
                    <div>
                      <h4 className="font-bold text-[#4A323D] text-sm">{t.client?.name || 'Cliente Oculto'}</h4>
                      <p className="text-xs text-gray-500">
                        {new Date(t.created_at).toLocaleDateString('pt-BR')}
                        {t.service_name && ` • ${t.service_name}`}
                      </p>
                    </div>
                  </div>
                  {getStatusBadge(t.status)}
                </div>

                <div className="flex items-center gap-1 text-amber-400 mb-3">
                  {[...Array(t.rating)].map((_, idx) => (
                    <FaStar key={idx} className="text-sm" />
                  ))}
                </div>
                
                <p className="text-gray-600 text-sm italic border-l-2 border-[#F5D8E3] pl-3 py-1">
                  "{t.comment}"
                </p>
              </div>

              <div className="mt-6 pt-4 border-t border-gray-100 flex gap-2">
                {t.status !== 'approved' && (
                  <button
                    onClick={() => handleUpdateStatus(t.id, 'approved')}
                    className="flex-1 bg-green-50 hover:bg-green-100 text-green-700 text-sm font-medium py-2 rounded-lg transition-colors flex items-center justify-center gap-2"
                  >
                    <FaCheck /> Aprovar
                  </button>
                )}
                {t.status !== 'rejected' && (
                  <button
                    onClick={() => handleUpdateStatus(t.id, 'rejected')}
                    className="flex-1 bg-red-50 hover:bg-red-100 text-red-700 text-sm font-medium py-2 rounded-lg transition-colors flex items-center justify-center gap-2"
                  >
                    <FaTimes /> Rejeitar/Ocultar
                  </button>
                )}
                {t.status !== 'pending' && (
                  <button
                    onClick={() => handleUpdateStatus(t.id, 'pending')}
                    className="flex-1 bg-gray-50 hover:bg-gray-100 text-gray-700 text-sm font-medium py-2 rounded-lg transition-colors flex items-center justify-center gap-2"
                  >
                    <FaClock /> Pendente
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
