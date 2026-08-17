import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  FaBuilding, FaLink, FaEnvelope, FaLock, 
  FaCheckCircle, FaSignOutAlt, FaPlus, FaList, 
  FaEdit, FaBan, FaTrash, FaCheck, FaExclamationTriangle 
} from 'react-icons/fa';
import { superAdminAPI } from '../../services/api';

export default function SuperAdminDashboard() {
  const navigate = useNavigate();
  const [password, setPassword] = useState('');
  const [activeTab, setActiveTab] = useState('new'); // 'new' or 'list'
  
  // Create Company State
  const [loading, setLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [formData, setFormData] = useState({
    companyName: '',
    companySlug: '',
    adminEmail: '',
    adminPassword: '',
  });

  // List Companies State
  const [companies, setCompanies] = useState([]);
  const [loadingCompanies, setLoadingCompanies] = useState(false);
  
  // Edit Modal State
  const [editingCompany, setEditingCompany] = useState(null);
  const [editFormData, setEditFormData] = useState({ name: '', slug: '' });

  useEffect(() => {
    const savedPassword = sessionStorage.getItem('superAdminPassword');
    if (!savedPassword) {
      navigate('/super-admin/login');
    } else {
      setPassword(savedPassword);
      if (activeTab === 'list') {
        fetchCompanies(savedPassword);
      }
    }
  }, [navigate, activeTab]);

  const handleLogout = () => {
    sessionStorage.removeItem('superAdminPassword');
    navigate('/super-admin/login');
  };

  const fetchCompanies = async (pwd) => {
    try {
      setLoadingCompanies(true);
      const data = await superAdminAPI.getAllCompanies(pwd || password);
      setCompanies(data);
    } catch (err) {
      console.error(err);
      if (err.response?.status === 401) {
        handleLogout();
      }
    } finally {
      setLoadingCompanies(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
      ...(name === 'companyName' && !prev.companySlug ? {
        companySlug: value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')
      } : {})
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setSuccessMsg('');
    setErrorMsg('');

    try {
      const response = await superAdminAPI.createCompany(formData, password);
      if (response.data.success) {
        setSuccessMsg(`A empresa "${response.data.company.name}" foi criada com sucesso!`);
        setFormData({
          companyName: '',
          companySlug: '',
          adminEmail: '',
          adminPassword: '',
        });
      }
    } catch (err) {
      setErrorMsg(err.response?.data?.error || 'Erro ao criar a empresa. Verifique a senha mestra ou os dados informados.');
      if (err.response?.status === 401) {
        setTimeout(() => handleLogout(), 2000);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleToggleStatus = async (company) => {
    if (window.confirm(`Deseja realmente ${company.is_active ? 'bloquear' : 'desbloquear'} a empresa ${company.name}?`)) {
      try {
        await superAdminAPI.updateCompanyStatus(company.id, !company.is_active, password);
        fetchCompanies();
      } catch (err) {
        alert('Erro ao atualizar status da empresa.');
      }
    }
  };

  const handleDelete = async (company) => {
    if (window.confirm(`ATENÇÃO! Deseja EXCLUIR DEFINITIVAMENTE a empresa ${company.name}? Todos os dados, clientes e agendamentos serão perdidos. Esta ação é irreversível.`)) {
      const confirmWord = window.prompt(`Digite "${company.slug}" para confirmar a exclusão:`);
      if (confirmWord === company.slug) {
        try {
          await superAdminAPI.deleteCompany(company.id, password);
          fetchCompanies();
          alert('Empresa excluída com sucesso.');
        } catch (err) {
          alert('Erro ao excluir empresa.');
        }
      } else if (confirmWord !== null) {
        alert('Confirmação incorreta. Exclusão cancelada.');
      }
    }
  };

  const handleSaveEdit = async () => {
    try {
      await superAdminAPI.updateCompany(editingCompany.id, editFormData, password);
      setEditingCompany(null);
      fetchCompanies();
    } catch (err) {
      alert(err.response?.data?.error || 'Erro ao atualizar empresa.');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-[#4A323D] rounded-lg flex items-center justify-center">
              <FaLock className="text-white text-sm" />
            </div>
            <h1 className="text-xl font-bold text-gray-900">Painel Mestre (SaaS)</h1>
          </div>
          <button 
            onClick={handleLogout}
            className="text-gray-500 hover:text-red-600 transition-colors flex items-center gap-2 text-sm font-medium"
          >
            <FaSignOutAlt /> Sair
          </button>
        </div>
      </header>

      {/* Tabs */}
      <div className="max-w-6xl mx-auto w-full px-4 mt-8 mb-4">
        <div className="flex gap-4 border-b border-gray-200">
          <button
            onClick={() => setActiveTab('new')}
            className={`px-6 py-3 font-medium text-sm flex items-center gap-2 border-b-2 transition-colors ${
              activeTab === 'new' 
                ? 'border-[#4A323D] text-[#4A323D]' 
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            <FaPlus /> Nova Empresa
          </button>
          <button
            onClick={() => setActiveTab('list')}
            className={`px-6 py-3 font-medium text-sm flex items-center gap-2 border-b-2 transition-colors ${
              activeTab === 'list' 
                ? 'border-[#4A323D] text-[#4A323D]' 
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            <FaList /> Empresas Cadastradas
          </button>
        </div>
      </div>

      {/* Main Content */}
      <main className="flex-1 max-w-6xl mx-auto w-full px-4 mb-8">
        {activeTab === 'new' && (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 md:p-8 max-w-4xl">
            <div className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                Cadastrar Nova Empresa
              </h2>
              <p className="text-gray-500 mt-1">Crie um novo ambiente de salão totalmente isolado para seu cliente.</p>
            </div>

            {successMsg && (
              <div className="bg-green-50 text-green-700 p-4 rounded-xl flex items-center gap-3 mb-6 border border-green-200">
                <FaCheckCircle className="text-xl shrink-0" />
                <div>
                  <p className="font-semibold">Sucesso!</p>
                  <p className="text-sm">{successMsg}</p>
                </div>
              </div>
            )}

            {errorMsg && (
              <div className="bg-red-50 text-red-600 p-4 rounded-xl text-sm mb-6 border border-red-200 font-medium">
                {errorMsg}
              </div>
            )}
            
            <form onSubmit={handleSubmit} className="space-y-6" autoComplete="off">
              <div style={{ width: 0, height: 0, overflow: 'hidden', position: 'absolute' }}>
                <input type="email" name="fake_email_autofill" tabIndex="-1" aria-hidden="true" />
                <input type="password" name="fake_password_autofill" tabIndex="-1" aria-hidden="true" />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Nome do Salão/Empresa</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <FaBuilding className="text-gray-400" />
                    </div>
                    <input
                      type="text"
                      name="companyName"
                      value={formData.companyName}
                      onChange={handleChange}
                      required
                      autoComplete="off"
                      className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#4A323D] outline-none"
                      placeholder="Ex: Studio Beauty Elegance"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Link da Empresa (Slug)</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <FaLink className="text-gray-400" />
                    </div>
                    <input
                      type="text"
                      name="companySlug"
                      value={formData.companySlug}
                      onChange={handleChange}
                      required
                      autoComplete="off"
                      className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#4A323D] outline-none"
                      placeholder="Ex: studio-beauty-elegance"
                    />
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    O link ficará: <span className="font-mono text-[#4A323D]">seudominio.com/{formData.companySlug || 'link'}</span>
                  </p>
                </div>
              </div>

              <div className="border-t border-gray-100 pt-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Acesso Administrativo do Cliente</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">E-mail do Dono</label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <FaEnvelope className="text-gray-400" />
                      </div>
                      <input
                        type="email"
                        name="adminEmail"
                        value={formData.adminEmail}
                        onChange={handleChange}
                        required
                        autoComplete="nope"
                        className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#4A323D] outline-none"
                        placeholder="admin@salao.com"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Senha do Dono</label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <FaLock className="text-gray-400" />
                      </div>
                      <input
                        type="password"
                        name="adminPassword"
                        value={formData.adminPassword}
                        onChange={handleChange}
                        required
                        minLength="6"
                        autoComplete="new-password"
                        className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#4A323D] outline-none"
                        placeholder="Mínimo 6 caracteres"
                      />
                    </div>
                  </div>
                </div>
              </div>

              <div className="pt-4">
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full md:w-auto px-8 py-3 bg-[#4A323D] text-white rounded-xl font-semibold hover:bg-[#3A2630] transition-colors disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center"
                >
                  {loading ? (
                    <span className="flex items-center gap-2">
                      <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Criando...
                    </span>
                  ) : (
                    'Cadastrar Empresa e Liberar Acesso'
                  )}
                </button>
              </div>
            </form>
          </div>
        )}

        {activeTab === 'list' && (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
            {loadingCompanies ? (
              <div className="p-12 flex justify-center">
                <div className="w-8 h-8 border-4 border-[#4A323D] border-t-transparent rounded-full animate-spin"></div>
              </div>
            ) : companies.length === 0 ? (
              <div className="p-12 text-center text-gray-500">Nenhuma empresa encontrada.</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-gray-50 border-b border-gray-200 text-gray-600 text-sm">
                      <th className="p-4 font-semibold">Nome da Empresa</th>
                      <th className="p-4 font-semibold">Link (Slug)</th>
                      <th className="p-4 font-semibold">Status</th>
                      <th className="p-4 font-semibold">Data Cadastro</th>
                      <th className="p-4 font-semibold text-right">Ações</th>
                    </tr>
                  </thead>
                  <tbody>
                    {companies.map(company => (
                      <tr key={company.id} className="border-b border-gray-100 hover:bg-gray-50/50">
                        <td className="p-4 font-medium text-gray-900">{company.name}</td>
                        <td className="p-4 font-mono text-xs text-gray-500">/{company.slug}</td>
                        <td className="p-4">
                          {company.is_active ? (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700">
                              <FaCheck /> Ativa
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-red-100 text-red-700">
                              <FaBan /> Bloqueada
                            </span>
                          )}
                        </td>
                        <td className="p-4 text-sm text-gray-500">
                          {new Date(company.created_at).toLocaleDateString('pt-BR')}
                        </td>
                        <td className="p-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => {
                                setEditingCompany(company);
                                setEditFormData({ name: company.name, slug: company.slug });
                              }}
                              className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                              title="Editar"
                            >
                              <FaEdit />
                            </button>
                            <button
                              onClick={() => handleToggleStatus(company)}
                              className={`p-2 rounded-lg transition-colors ${
                                company.is_active 
                                  ? 'text-gray-400 hover:text-orange-600 hover:bg-orange-50' 
                                  : 'text-gray-400 hover:text-green-600 hover:bg-green-50'
                              }`}
                              title={company.is_active ? "Bloquear Acesso" : "Desbloquear Acesso"}
                            >
                              {company.is_active ? <FaBan /> : <FaCheck />}
                            </button>
                            <button
                              onClick={() => handleDelete(company)}
                              className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                              title="Excluir Definitivamente"
                            >
                              <FaTrash />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </main>

      {/* Edit Modal */}
      {editingCompany && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
              <h3 className="text-lg font-bold text-gray-900">Editar Empresa</h3>
              <button 
                onClick={() => setEditingCompany(null)}
                className="text-gray-400 hover:text-gray-600"
              >
                &times;
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nome</label>
                <input
                  type="text"
                  value={editFormData.name}
                  onChange={e => setEditFormData({...editFormData, name: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#4A323D] outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Slug (Link)</label>
                <input
                  type="text"
                  value={editFormData.slug}
                  onChange={e => setEditFormData({...editFormData, slug: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#4A323D] outline-none"
                />
              </div>
            </div>
            <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 flex justify-end gap-3">
              <button
                onClick={() => setEditingCompany(null)}
                className="px-4 py-2 text-gray-600 font-medium hover:bg-gray-100 rounded-lg transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleSaveEdit}
                className="px-4 py-2 bg-[#4A323D] text-white font-medium hover:bg-[#3A2630] rounded-lg transition-colors"
              >
                Salvar Alterações
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
