import { useState, useEffect } from 'react';
import { servicesAPI } from '../../services/api';
import { toast } from 'react-hot-toast';
import { FaPlus, FaEdit, FaTrash, FaCoins, FaClock } from 'react-icons/fa';

export default function AdminServices() {
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingService, setEditingService] = useState(null);

  // Form states
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('');
  const [duration, setDuration] = useState('');
  const [category, setCategory] = useState('');
  const [active, setActive] = useState(1);

  const fetchServices = async () => {
    try {
      setLoading(true);
      const res = await servicesAPI.getAll('all');
      setServices(res);
    } catch (err) {
      console.error(err);
      toast.error('Erro ao carregar serviços');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    async function loadServices() {
      try {
        const res = await servicesAPI.getAll('all');
        setServices(res);
      } catch (err) {
        console.error(err);
        toast.error('Erro ao carregar serviços');
      } finally {
        setLoading(false);
      }
    }
    loadServices();
  }, []);

  const handleOpenModal = (service = null) => {
    if (service) {
      setEditingService(service);
      setName(service.name);
      setDescription(service.description || '');
      setPrice(service.price.toString());
      setDuration(service.duration_minutes.toString());
      setCategory(service.category || '');
      setActive(service.active);
    } else {
      setEditingService(null);
      setName('');
      setDescription('');
      setPrice('');
      setDuration('');
      setCategory('');
      setActive(1);
    }
    setModalOpen(true);
  };

  const handleCloseModal = () => {
    setModalOpen(false);
    setEditingService(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name || !price || !duration) {
      toast.error('Preencha os campos obrigatórios');
      return;
    }

    const serviceData = {
      name,
      description,
      price: parseFloat(price),
      duration_minutes: parseInt(duration),
      category,
      active
    };

    try {
      setLoading(true);
      if (editingService) {
        await servicesAPI.update(editingService.id, serviceData);
        toast.success('Serviço atualizado com sucesso!');
      } else {
        await servicesAPI.create(serviceData);
        toast.success('Serviço criado com sucesso!');
      }
      handleCloseModal();
      await fetchServices();
    } catch (err) {
      console.error(err);
      toast.error('Erro ao salvar o serviço');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    const confirmDelete = window.confirm('Deseja realmente desativar este serviço?');
    if (!confirmDelete) return;

    try {
      setLoading(true);
      await servicesAPI.delete(id);
      toast.success('Serviço desativado');
      await fetchServices();
    } catch (err) {
      console.error(err);
      toast.error('Erro ao desativar o serviço');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="animate-fade-in flex flex-col gap-6">
      
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-heading font-bold text-gray-900">Serviços</h1>
          <p className="text-xs text-gray-500">Configure o catálogo de procedimentos oferecidos pelo salão.</p>
        </div>
        <button 
          onClick={() => handleOpenModal()} 
          className="btn-primary py-2 px-4 text-xs"
        >
          Novo Serviço <FaPlus />
        </button>
      </div>

      {/* Services Table */}
      <div className="card p-6">
        {loading && services.length === 0 ? (
          <div className="text-center py-12">Carregando serviços...</div>
        ) : services.length === 0 ? (
          <div className="text-center py-12 text-gray-400">Nenhum serviço cadastrado.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-rose-light/10 text-xs text-gray-400 font-semibold uppercase">
                  <th className="py-2.5">Nome</th>
                  <th className="py-2.5">Categoria</th>
                  <th className="py-2.5"><FaClock className="inline mr-1" /> Duração</th>
                  <th className="py-2.5"><FaCoins className="inline mr-1" /> Preço</th>
                  <th className="py-2.5 text-center">Status</th>
                  <th className="py-2.5 text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="text-sm">
                {services.map((s) => (
                  <tr key={s.id} className={`border-b border-rose-light/10 hover:bg-rose-light/5 ${s.active === 0 ? 'opacity-50' : ''}`}>
                    <td className="py-3">
                      <div>
                        <p className="font-bold text-gray-900">{s.name}</p>
                        <p className="text-xs text-gray-500 max-w-md truncate">{s.description || 'Sem descrição'}</p>
                      </div>
                    </td>
                    <td className="py-3">
                      <span className="badge-rose">{s.category || 'Outros'}</span>
                    </td>
                    <td className="py-3 font-medium text-gray-700">{s.duration_minutes} min</td>
                    <td className="py-3 font-bold text-gray-900">R$ {s.price.toFixed(2)}</td>
                    <td className="py-3 text-center">
                      <span className={`badge ${s.active === 1 ? 'badge-green' : 'badge-red'}`}>
                        {s.active === 1 ? 'Ativo' : 'Inativo'}
                      </span>
                    </td>
                    <td className="py-3 text-right">
                      <div className="flex justify-end gap-1">
                        <button 
                          onClick={() => handleOpenModal(s)}
                          className="p-2 text-gold-dark hover:bg-gold-light/10 rounded-lg"
                          title="Editar"
                        >
                          <FaEdit />
                        </button>
                        {s.active === 1 && (
                          <button 
                            onClick={() => handleDelete(s.id)}
                            className="p-2 text-red-500 hover:bg-red-50 rounded-lg"
                            title="Desativar"
                          >
                            <FaTrash />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* SERVICE MODAL */}
      {modalOpen && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <form onSubmit={handleSubmit} className="bg-white rounded-3xl shadow-glass border border-rose-light/20 max-w-lg w-full p-6 animate-scale-up flex flex-col gap-4">
            <div className="flex justify-between items-center border-b border-rose-light/20 pb-3">
              <h3 className="text-lg font-bold text-mink font-heading">
                {editingService ? 'Editar Serviço' : 'Novo Serviço'}
              </h3>
              <button 
                type="button"
                onClick={handleCloseModal}
                className="text-gray-400 hover:text-gray-600 text-xl font-bold"
              >
                &times;
              </button>
            </div>

            <div>
              <label className="label">Nome do Serviço *</label>
              <input 
                type="text" 
                required
                placeholder="Ex: Corte de Cabelo Feminino"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="input"
              />
            </div>

            <div>
              <label className="label">Descrição (opcional)</label>
              <textarea 
                rows="2"
                placeholder="Descreva brevemente o serviço..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="input resize-none"
              ></textarea>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="label">Preço (R$) *</label>
                <input 
                  type="number" 
                  step="0.01"
                  required
                  placeholder="80.00"
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  className="input"
                />
              </div>
              <div>
                <label className="label">Duração (minutos) *</label>
                <input 
                  type="number" 
                  required
                  placeholder="60"
                  value={duration}
                  onChange={(e) => setDuration(e.target.value)}
                  className="input"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="label">Categoria</label>
                <input 
                  type="text" 
                  placeholder="Ex: Cabelo, Unhas"
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="input"
                />
              </div>
              <div>
                <label className="label">Status</label>
                <select 
                  value={active} 
                  onChange={(e) => setActive(parseInt(e.target.value))}
                  className="input"
                >
                  <option value={1}>Ativo</option>
                  <option value={0}>Inativo</option>
                </select>
              </div>
            </div>

            <div className="flex justify-end gap-2 mt-4">
              <button 
                type="button" 
                onClick={handleCloseModal} 
                className="btn-outline text-xs px-4 py-2"
              >
                Cancelar
              </button>
              <button 
                type="submit" 
                className="btn-primary text-xs px-4 py-2"
                disabled={loading}
              >
                Salvar
              </button>
            </div>
          </form>
        </div>
      )}

    </div>
  );
}
