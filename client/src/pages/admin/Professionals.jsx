import { useState, useEffect } from 'react';
import { professionalsAPI } from '../../services/api';
import { toast } from 'react-hot-toast';
import { FaPlus, FaEdit, FaTrash } from 'react-icons/fa';

export default function AdminProfessionals() {
  const [professionals, setProfessionals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingPro, setEditingPro] = useState(null);

  // Form states
  const [name, setName] = useState('');
  const [role, setRole] = useState('');
  const [specialtiesText, setSpecialtiesText] = useState('');
  const [active, setActive] = useState(1);

  const fetchProfessionals = async () => {
    try {
      setLoading(true);
      const res = await professionalsAPI.getAll('all');
      setProfessionals(res);
    } catch (err) {
      console.error(err);
      toast.error('Erro ao carregar profissionais');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    async function loadPros() {
      try {
        const res = await professionalsAPI.getAll('all');
        setProfessionals(res);
      } catch (err) {
        console.error(err);
        toast.error('Erro ao carregar profissionais');
      } finally {
        setLoading(false);
      }
    }
    loadPros();
  }, []);

  const handleOpenModal = (pro = null) => {
    if (pro) {
      setEditingPro(pro);
      setName(pro.name);
      setRole(pro.role);
      
      let specs;
      try {
        specs = JSON.parse(pro.specialties || '[]');
      } catch {
        specs = [];
      }
      setSpecialtiesText(specs.join(', '));
      setActive(pro.active ? 1 : 0);
    } else {
      setEditingPro(null);
      setName('');
      setRole('');
      setSpecialtiesText('');
      setActive(1);
    }
    setModalOpen(true);
  };

  const handleCloseModal = () => {
    setModalOpen(false);
    setEditingPro(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name || !role) {
      toast.error('Preencha os campos obrigatórios');
      return;
    }

    const specialties = specialtiesText
      .split(',')
      .map(s => s.trim())
      .filter(s => s.length > 0);

    const proData = {
      name,
      role,
      specialties,
      active
    };

    try {
      setLoading(true);
      if (editingPro) {
        await professionalsAPI.update(editingPro.id, proData);
        toast.success('Profissional atualizado com sucesso!');
      } else {
        await professionalsAPI.create(proData);
        toast.success('Profissional cadastrado com sucesso!');
      }
      handleCloseModal();
      await fetchProfessionals();
    } catch (err) {
      console.error(err);
      toast.error('Erro ao salvar o profissional');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    const confirmDelete = window.confirm('Deseja realmente desativar este profissional?');
    if (!confirmDelete) return;

    try {
      setLoading(true);
      await professionalsAPI.delete(id);
      toast.success('Profissional desativado');
      await fetchProfessionals();
    } catch (err) {
      console.error(err);
      toast.error('Erro ao desativar o profissional');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="animate-fade-in flex flex-col gap-6">
      
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-heading font-bold text-gray-900">Profissionais</h1>
          <p className="text-xs text-gray-500">Gerencie a equipe de colaboradores e suas respectivas especialidades.</p>
        </div>
        <button 
          onClick={() => handleOpenModal()} 
          className="btn-primary py-2 px-4 text-xs"
        >
          Novo Profissional <FaPlus />
        </button>
      </div>

      {/* Professionals List */}
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {loading && professionals.length === 0 ? (
          <div className="col-span-full text-center py-12">Carregando profissionais...</div>
        ) : professionals.length === 0 ? (
          <div className="col-span-full text-center py-12 text-gray-400">Nenhum profissional cadastrado.</div>
        ) : (
          professionals.map((p) => {
            let specialties;
            try {
              specialties = JSON.parse(p.specialties || '[]');
            } catch {
              specialties = [];
            }

            return (
              <div 
                key={p.id} 
                className={`card p-6 flex flex-col gap-4 border border-slate-200/80 relative shadow-xs ${
                  !p.active ? 'opacity-60 bg-gray-50/50' : 'bg-white'
                }`}
              >
                <div className="flex justify-between items-start">
                  <div className="flex items-center gap-4">
                    <div 
                      className="w-16 h-16 rounded-full p-0.5 shadow-xs flex items-center justify-center overflow-hidden font-heading text-2xl font-bold bg-white"
                      style={{ background: 'var(--theme-gradient)' }}
                    >
                      {p.photo_url ? (
                        <img src={p.photo_url} alt={p.name} className="w-full h-full object-cover rounded-full" />
                      ) : (
                        <div className="w-full h-full bg-white rounded-full flex items-center justify-center" style={{ color: 'var(--theme-primary)' }}>
                          {p.name.charAt(0).toUpperCase()}
                        </div>
                      )}
                    </div>
                    <div>
                      <h3 className="font-bold text-gray-900 text-lg flex items-center gap-1.5">
                        {p.name}
                      </h3>
                      <p className="text-xs font-semibold" style={{ color: 'var(--theme-primary)' }}>{p.role}</p>
                    </div>
                  </div>
                  <span className={`badge ${p.active ? 'badge-green' : 'badge-red'}`}>
                    {p.active ? 'Ativo' : 'Inativo'}
                  </span>
                </div>

                <div className="flex flex-col gap-2">
                  <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Especialidades</span>
                  <div className="flex flex-wrap gap-1">
                    {specialties.length > 0 ? (
                      specialties.map((spec, i) => (
                        <span 
                          key={i} 
                          className="text-[10px] px-2 py-0.5 rounded-full font-medium"
                          style={{
                            backgroundColor: 'var(--theme-primary-light, #f1f5f9)',
                            color: 'var(--theme-primary, #059669)',
                          }}
                        >
                          {spec}
                        </span>
                      ))
                    ) : (
                      <span className="text-xs text-gray-400 italic">Nenhuma especialidade cadastrada</span>
                    )}
                  </div>
                </div>

                <div className="flex justify-end gap-2 border-t border-slate-100 pt-4 mt-auto">
                  <button 
                    onClick={() => handleOpenModal(p)}
                    className="btn-outline text-xs px-3 py-1.5 flex items-center gap-1 cursor-pointer"
                  >
                    <FaEdit /> Editar
                  </button>
                  {p.active && (
                    <button 
                      onClick={() => handleDelete(p.id)}
                      className="text-xs font-semibold border border-red-200 text-red-500 hover:bg-red-50 px-3 py-1.5 rounded-full flex items-center gap-1 cursor-pointer"
                    >
                      <FaTrash /> Desativar
                    </button>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* PROFESSIONAL MODAL */}
      {modalOpen && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <form onSubmit={handleSubmit} className="bg-white rounded-3xl shadow-glass border border-slate-200 max-w-lg w-full p-6 animate-scale-up flex flex-col gap-4">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <h3 className="text-lg font-bold text-slate-800 font-heading">
                {editingPro ? 'Editar Profissional' : 'Novo Profissional'}
              </h3>
              <button 
                type="button"
                onClick={handleCloseModal}
                className="text-gray-400 hover:text-gray-600 text-xl font-bold cursor-pointer"
              >
                &times;
              </button>
            </div>

            <div>
              <label className="label">Nome Completo *</label>
              <input 
                type="text" 
                required
                placeholder="Ex: Ana Paula"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="input"
              />
            </div>

            <div>
              <label className="label">Cargo / Especialidade Principal *</label>
              <input 
                type="text" 
                required
                placeholder="Ex: Cabeleireira & Colorista"
                value={role}
                onChange={(e) => setRole(e.target.value)}
                className="input"
              />
            </div>

            <div>
              <label className="label">Especialidades (separadas por vírgula)</label>
              <input 
                type="text" 
                placeholder="Ex: Corte Feminino, Coloração, Escova"
                value={specialtiesText}
                onChange={(e) => setSpecialtiesText(e.target.value)}
                className="input"
              />
              <span className="text-[10px] text-gray-400">Escreva as especialidades separando-as por vírgulas.</span>
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
