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

  const [isRecovering, setIsRecovering] = useState(false);
  const [recoveryEmail, setRecoveryEmail] = useState('');

  useEffect(() => {
    // Clear any existing session to force login when visiting the login page
    localStorage.removeItem(`studio_beauty_token_${companySlug}`);
    localStorage.removeItem(`studio_beauty_admin_${companySlug}`);

    const updateSalon = () => setSalon(getSalonSettings());
    window.addEventListener('salonSettingsUpdated', updateSalon);
    return () => window.removeEventListener('salonSettingsUpdated', updateSalon);
  }, [companySlug, navigate]);

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
      navigate(`/${companySlug}/admin/painel`);
    } catch (err) {
      console.error(err);
      const errMsg = err.response?.data?.error || 'Erro ao realizar login. Verifique suas credenciais.';
      toast.error(errMsg);
    } finally {
      setLoading(false);
    }
  };

  const handleRecover = async (e) => {
    e.preventDefault();
    if (!recoveryEmail) {
      toast.error('Preencha o e-mail');
      return;
    }

    try {
      setLoading(true);
      const res = await authAPI.recoverPassword(recoveryEmail);
      toast.success(res.message || 'Instruções enviadas para seu e-mail.');
      setIsRecovering(false);
      setRecoveryEmail('');
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.error || 'Erro ao solicitar recuperação.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4 relative overflow-hidden">
      
      {/* Background blobs for premium styling */}
      <div 
        className="absolute top-[-10%] left-[-10%] w-96 h-96 rounded-full blur-[120px] opacity-20 pointer-events-none"
        style={{ backgroundColor: 'var(--theme-primary, #059669)' }}
      ></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-96 h-96 rounded-full bg-slate-300/40 blur-[120px] pointer-events-none"></div>

      <div className="w-full max-w-md relative z-10 animate-fade-in">
        
        {/* Back Link */}
        <Link to={`/${companySlug || ''}`} className="inline-flex items-center gap-2 text-slate-500 hover:text-slate-800 text-xs font-bold uppercase tracking-wider mb-8 transition-colors">
          <FaChevronLeft className="text-xs" /> Voltar para o Agendamento
        </Link>

        {/* Card */}
        <div className="card-glass p-8 md:p-10 shadow-glass border border-slate-200/80 bg-white/90 relative rounded-3xl">
          
          {!isRecovering ? (
            <>
              <div className="text-center mb-8 animate-fade-in">
                <h1 className="text-3xl font-heading font-bold text-gray-900 mb-2">Acesso Administrativo</h1>
                <p className="text-xs text-gray-500 max-w-xs mx-auto leading-relaxed">Faça login para gerenciar a agenda, profissionais e serviços do {salon.name || 'I.O.S AgendeJá'}.</p>
              </div>

              <form onSubmit={handleLogin} className="flex flex-col gap-5 animate-fade-in">
                <div>
                  <label className="label">E-mail</label>
                  <div className="relative">
                    <input 
                      type="email" 
                      required
                      placeholder="Seu e-mail"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="input !pl-11 text-xs"
                      disabled={loading}
                    />
                    <FaEnvelope className="absolute left-4 top-4 text-xs" style={{ color: 'var(--theme-primary)' }} />
                  </div>
                </div>

                <div>
                  <div className="flex justify-between items-center mb-1">
                    <label className="label mb-0">Senha</label>
                    <button 
                      type="button" 
                      onClick={() => setIsRecovering(true)}
                      className="text-[10px] font-semibold transition-colors cursor-pointer"
                      style={{ color: 'var(--theme-primary)' }}
                    >
                      Esqueceu a senha?
                    </button>
                  </div>
                  <div className="relative">
                    <input 
                      type="password" 
                      required
                      placeholder="Sua senha"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="input !pl-11 text-xs"
                      disabled={loading}
                    />
                    <FaLock className="absolute left-4 top-4 text-xs" style={{ color: 'var(--theme-primary)' }} />
                  </div>
                </div>

                <button 
                  type="submit" 
                  className="btn-primary w-full py-3.5 mt-3 text-xs uppercase tracking-wider font-semibold cursor-pointer"
                  disabled={loading}
                >
                  {loading ? (
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  ) : (
                    'Entrar no Painel'
                  )}
                </button>

                <div className="text-center pt-2 border-t border-gray-100">
                  <span className="text-[11px] text-gray-500">Quer cadastrar sua própria empresa? </span>
                  <Link to="/cadastro" className="text-[11px] hover:underline font-bold" style={{ color: 'var(--theme-primary)' }}>
                    Criar conta agora
                  </Link>
                </div>
              </form>
            </>
          ) : (
            <>
              <div className="text-center mb-8 animate-fade-in">
                <h1 className="text-3xl font-heading font-bold text-gray-900 mb-2">Recuperar Senha</h1>
                <p className="text-xs text-gray-500 max-w-xs mx-auto leading-relaxed">
                  Informe o e-mail cadastrado. Se ele existir na base de dados, enviaremos instruções.
                </p>
              </div>

              <form onSubmit={handleRecover} className="flex flex-col gap-5 animate-fade-in">
                <div>
                  <label className="label">E-mail</label>
                  <div className="relative">
                    <input 
                      type="email" 
                      required
                      placeholder="E-mail cadastrado"
                      value={recoveryEmail}
                      onChange={(e) => setRecoveryEmail(e.target.value)}
                      className="input !pl-11 text-xs"
                      disabled={loading}
                    />
                    <FaEnvelope className="absolute left-4 top-4 text-xs" style={{ color: 'var(--theme-primary)' }} />
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
                    'Enviar Instruções'
                  )}
                </button>

                <button
                  type="button"
                  onClick={() => setIsRecovering(false)}
                  className="text-xs text-mink hover:text-primary font-semibold mt-2 transition-colors"
                  disabled={loading}
                >
                  Voltar para o Login
                </button>
              </form>
            </>
          )}

        </div>
      </div>
    </div>
  );
}
