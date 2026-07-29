import { useState, useEffect } from 'react';
import { useNavigate, Link, useParams } from 'react-router-dom';
import { authAPI } from '../services/api';
import { toast } from 'react-hot-toast';
import { FaLock, FaEnvelope, FaChevronLeft } from 'react-icons/fa';
import { getSalonSettings } from '../services/salonSettings';

export default function Login() {
  const navigate = useNavigate();
  const { companySlug } = useParams();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [salon, setSalon] = useState(getSalonSettings());

  useEffect(() => {
    const updateSalon = () => setSalon(getSalonSettings());
    window.addEventListener('salonSettingsUpdated', updateSalon);
    return () => window.removeEventListener('salonSettingsUpdated', updateSalon);
  }, []);

  const handleLogin = async (e) => {
    e.preventDefault();
    if (!email || !password) {
      toast.error('Preencha todos os campos');
      return;
    }

    try {
      setLoading(true);
      const res = await authAPI.login(email, password);
      
      // Save token and admin info per company
      localStorage.setItem(`studio_beauty_token_${companySlug}`, res.token);
      localStorage.setItem(`studio_beauty_admin_${companySlug}`, JSON.stringify(res.admin));
      
      toast.success(`Bem-vindo(a), ${res.admin.name}!`);
      navigate(`/${companySlug}/admin`);
    } catch (err) {
      console.error(err);
      const errMsg = err.response?.data?.error || 'Erro ao realizar login. Verifique suas credenciais.';
      toast.error(errMsg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-cream to-blush flex items-center justify-center p-4 relative overflow-hidden">
      
      {/* Background blobs for premium styling */}
      <div className="absolute top-[-10%] left-[-10%] w-96 h-96 rounded-full bg-rose/15 blur-[120px]"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-96 h-96 rounded-full bg-gold/10 blur-[120px]"></div>

      <div className="w-full max-w-md relative z-10 animate-fade-in">
        
        {/* Back Link */}
        <Link to="/" className="inline-flex items-center gap-2 text-mink/70 hover:text-rose-dark text-xs font-bold uppercase tracking-wider mb-8 transition-colors">
          <FaChevronLeft className="text-xs" /> Voltar para o Agendamento
        </Link>

        {/* Card */}
        <div className="card-glass p-8 md:p-10 shadow-glass border border-white/50 bg-white/75">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-heading font-bold text-gray-900 mb-2">Acesso Administrativo</h1>
            <p className="text-xs text-gray-500 max-w-xs mx-auto leading-relaxed">Faça login para gerenciar a agenda, profissionais e serviços do {salon.name || 'Studio Beauty'}.</p>
          </div>

          <form onSubmit={handleLogin} className="flex flex-col gap-5">
            <div>
              <label className="label">E-mail</label>
              <div className="relative">
                <input 
                  type="email" 
                  required
                  placeholder="Seu e-mail"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="input pl-11 text-xs"
                  disabled={loading}
                />
                <FaEnvelope className="absolute left-4 top-4 text-rose-dark text-xs" />
              </div>
            </div>

            <div>
              <label className="label">Senha</label>
              <div className="relative">
                <input 
                  type="password" 
                  required
                  placeholder="Sua senha"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="input pl-11 text-xs"
                  disabled={loading}
                />
                <FaLock className="absolute left-4 top-4 text-rose-dark text-xs" />
              </div>
            </div>

            <button 
              type="submit" 
              className="btn-primary w-full py-3.5 mt-3 text-xs uppercase tracking-wider font-semibold"
              disabled={loading}
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              ) : (
                'Entrar no Painel'
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
