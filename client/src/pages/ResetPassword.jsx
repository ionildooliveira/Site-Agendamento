import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams, Link, useParams } from 'react-router-dom';
import { authAPI } from '../services/api';
import { toast } from 'react-hot-toast';
import { FaLock, FaChevronLeft } from 'react-icons/fa';
import { getSalonSettings } from '../services/salonSettings';

export default function ResetPassword() {
  const navigate = useNavigate();
  const { companySlug } = useParams();
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [salon, setSalon] = useState(getSalonSettings());

  useEffect(() => {
    if (!token) {
      toast.error('Token inválido ou ausente.');
      navigate(`/${companySlug || ''}/admin`);
      return;
    }

    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      if (payload.exp * 1000 < Date.now()) {
        toast.error('O link de recuperação expirou. Por favor, solicite um novo.');
        navigate(`/${companySlug || ''}/admin`);
        return;
      }
    } catch (e) {
      toast.error('Token inválido.');
      navigate(`/${companySlug || ''}/admin`);
      return;
    }

    const updateSalon = () => setSalon(getSalonSettings());
    window.addEventListener('salonSettingsUpdated', updateSalon);
    return () => window.removeEventListener('salonSettingsUpdated', updateSalon);
  }, [token, navigate, companySlug]);

  const handleReset = async (e) => {
    e.preventDefault();
    if (!password || !confirmPassword) {
      toast.error('Preencha todos os campos');
      return;
    }

    if (password !== confirmPassword) {
      toast.error('As senhas não coincidem');
      return;
    }

    if (password.length < 6) {
      toast.error('A senha deve ter pelo menos 6 caracteres');
      return;
    }

    try {
      setLoading(true);
      const res = await authAPI.resetPassword(token, password);
      toast.success(res.message || 'Senha redefinida com sucesso!');
      navigate(`/${companySlug || ''}/admin`);
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.error || 'Erro ao redefinir a senha.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4 relative overflow-hidden">
      
      <div className="w-full max-w-md relative z-10 animate-fade-in">
        
        <Link to={`/${companySlug || ''}/admin`} className="inline-flex items-center gap-2 text-slate-600 hover:text-slate-900 text-xs font-bold uppercase tracking-wider mb-8 transition-colors">
          <FaChevronLeft className="text-xs" /> Voltar para o Login
        </Link>

        <div className="bg-white rounded-3xl p-8 md:p-10 shadow-xl border border-gray-200 relative">
          
          <div className="text-center mb-8 animate-fade-in">
            <h1 className="text-3xl font-heading font-bold text-gray-900 mb-2">Nova Senha</h1>
            <p className="text-xs text-gray-500 max-w-xs mx-auto leading-relaxed">
              Crie uma nova senha para acessar o painel do {salon.name || 'Agendamento'}.
            </p>
          </div>

          <form onSubmit={handleReset} className="flex flex-col gap-5 animate-fade-in">
            <div>
              <label className="label">Nova Senha</label>
              <div className="relative">
                <input 
                  type="password" 
                  required
                  placeholder="Nova senha"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="input pl-11 text-xs"
                  disabled={loading}
                />
                <FaLock className="absolute left-4 top-4 text-slate-400 text-xs" />
              </div>
            </div>

            <div>
              <label className="label">Confirmar Senha</label>
              <div className="relative">
                <input 
                  type="password" 
                  required
                  placeholder="Confirme a nova senha"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="input pl-11 text-xs"
                  disabled={loading}
                />
                <FaLock className="absolute left-4 top-4 text-slate-400 text-xs" />
              </div>
            </div>

            <button 
              type="submit" 
              className="btn-primary w-full py-3.5 mt-3 text-xs uppercase tracking-wider font-semibold"
              disabled={loading}
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mx-auto"></div>
              ) : (
                'Redefinir Senha'
              )}
            </button>
          </form>

        </div>
      </div>
    </div>
  );
}
