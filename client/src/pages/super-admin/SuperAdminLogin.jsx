import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaLock, FaChevronRight } from 'react-icons/fa';

export default function SuperAdminLogin() {
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleLogin = (e) => {
    e.preventDefault();
    if (!password) {
      setError('Por favor, insira a senha mestra.');
      return;
    }
    
    // We just save the password in sessionStorage and proceed to the dashboard.
    // The actual validation will happen when they try to create a company.
    sessionStorage.setItem('superAdminPassword', password);
    navigate('/super-admin/dashboard');
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <div className="bg-white p-8 rounded-2xl shadow-xl w-full max-w-md border border-gray-100">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-[#4A323D] rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
            <FaLock className="text-white text-2xl" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Painel Mestre</h1>
          <p className="text-gray-500">Acesso exclusivo do dono da plataforma</p>
        </div>

        {error && (
          <div className="bg-red-50 text-red-600 p-4 rounded-xl text-sm mb-6 text-center font-medium border border-red-100">
            {error}
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-6">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Senha Mestra
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <FaLock className="text-gray-400" />
              </div>
              <input
                type="password"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  setError('');
                }}
                className="w-full pl-11 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#4A323D] focus:border-[#4A323D] outline-none transition-all"
                placeholder="••••••••"
                required
              />
            </div>
          </div>

          <button
            type="submit"
            className="w-full bg-[#4A323D] text-white py-3.5 rounded-xl font-semibold hover:bg-[#3A2630] transition-colors flex items-center justify-center gap-2 group"
          >
            Acessar Painel
            <FaChevronRight className="text-sm group-hover:translate-x-1 transition-transform" />
          </button>
        </form>
      </div>
    </div>
  );
}
