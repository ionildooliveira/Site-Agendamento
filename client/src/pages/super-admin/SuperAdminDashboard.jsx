import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaBuilding, FaLink, FaEnvelope, FaLock, FaCheckCircle, FaSignOutAlt, FaPlus } from 'react-icons/fa';
import { superAdminAPI } from '../../services/api';

export default function SuperAdminDashboard() {
  const navigate = useNavigate();
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  const [formData, setFormData] = useState({
    companyName: '',
    companySlug: '',
    adminEmail: '',
    adminPassword: '',
  });

  useEffect(() => {
    const savedPassword = sessionStorage.getItem('superAdminPassword');
    if (!savedPassword) {
      navigate('/super-admin/login');
    } else {
      setPassword(savedPassword);
    }
  }, [navigate]);

  const handleLogout = () => {
    sessionStorage.removeItem('superAdminPassword');
    navigate('/super-admin/login');
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
        // Invalid super admin password
        setTimeout(() => handleLogout(), 2000);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
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

      {/* Main Content */}
      <main className="flex-1 max-w-4xl mx-auto w-full px-4 py-8">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 md:p-8">
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
              <FaPlus className="text-[#4A323D]" />
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

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Company Name */}
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
                    className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#4A323D] outline-none"
                    placeholder="Ex: Studio Beauty Elegance"
                  />
                </div>
              </div>

              {/* Company Slug */}
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
                {/* Admin Email */}
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
                      className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#4A323D] outline-none"
                      placeholder="admin@salao.com"
                    />
                  </div>
                </div>

                {/* Admin Password */}
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
      </main>
    </div>
  );
}
