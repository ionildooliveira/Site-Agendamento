import { useState, useEffect } from 'react';
import { adminAPI } from '../../services/api';
import { toast } from 'react-hot-toast';
import { FaPhoneAlt, FaEnvelope, FaCalendarCheck } from 'react-icons/fa';

export default function AdminClients() {
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchClients() {
      try {
        setLoading(true);
        const res = await adminAPI.getClients();
        setClients(res);
      } catch (err) {
        console.error(err);
        toast.error('Erro ao carregar lista de clientes');
      } finally {
        setLoading(false);
      }
    }
    fetchClients();
  }, []);

  return (
    <div className="animate-fade-in flex flex-col gap-6">
      
      {/* Header */}
      <div>
        <h1 className="text-3xl font-heading font-bold text-gray-900">Clientes</h1>
        <p className="text-xs text-gray-500">Histórico de clientes cadastrados no sistema através de agendamentos.</p>
      </div>

      {/* Clients Table */}
      <div className="card p-6">
        {loading ? (
          <div className="text-center py-12">Carregando dados dos clientes...</div>
        ) : clients.length === 0 ? (
          <div className="text-center py-12 text-gray-400">Nenhum cliente cadastrado ainda.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-rose-light/10 text-xs text-gray-400 font-semibold uppercase">
                  <th className="py-2.5">Nome</th>
                  <th className="py-2.5">Telefone</th>
                  <th className="py-2.5">E-mail</th>
                  <th className="py-2.5 text-center">Agendamentos Totais</th>
                  <th className="py-2.5 text-right">Última Visita</th>
                </tr>
              </thead>
              <tbody className="text-sm">
                {clients.map((c) => (
                  <tr key={c.id} className="border-b border-rose-light/10 hover:bg-rose-light/5">
                    <td className="py-3 font-bold text-gray-900">{c.name}</td>
                    <td className="py-3 text-gray-600">
                      <span className="flex items-center gap-1.5"><FaPhoneAlt className="text-rose-dark text-xs" /> {c.phone}</span>
                    </td>
                    <td className="py-3 text-gray-600">
                      <span className="flex items-center gap-1.5"><FaEnvelope className="text-rose-dark text-xs" /> {c.email}</span>
                    </td>
                    <td className="py-3 text-center">
                      <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold bg-gold-light/20 text-gold-dark border border-gold-light/15">
                        <FaCalendarCheck /> {c.total_bookings}
                      </span>
                    </td>
                    <td className="py-3 text-right text-gray-700 font-medium">
                      {c.last_booking 
                        ? c.last_booking.split('-').reverse().join('/') 
                        : <span className="text-gray-300 italic">Sem histórico</span>
                      }
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

    </div>
  );
}
