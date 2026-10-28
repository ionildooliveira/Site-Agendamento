import { useState, useEffect, useRef } from 'react';
import { useNavigate, Link, useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { toast } from 'react-hot-toast';
import {
  FaUser, FaEnvelope, FaLock, FaPhone, FaIdCard, FaStore,
  FaLink, FaMapMarkerAlt, FaCreditCard, FaQrcode, FaCheckCircle,
  FaArrowRight, FaArrowLeft, FaCopy, FaExternalLinkAlt, FaClock,
  FaShieldAlt, FaMagic, FaSpinner, FaEye, FaEyeSlash
} from 'react-icons/fa';
import { paymentsAPI, companiesAPI } from '../services/api';
import { NICHES, getNicheData, DEFAULT_NICHE } from '../constants/niches';

export default function OnboardingWizard() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const initialNicheKey = searchParams.get('nicho') || searchParams.get('niche') || DEFAULT_NICHE;
  const [selectedNiche, setSelectedNiche] = useState(initialNicheKey);
  const currentNiche = getNicheData(selectedNiche);

  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [mpConfig, setMpConfig] = useState({
    isConfigured: false,
    planPrice: 69.90,
    planName: 'Plano Profissional',
    autoRecurring: true,
  });

  // Step 1: User Data
  const [userData, setUserData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    phone: '',
    cpf: '',
  });
  const [showPassword, setShowPassword] = useState(false);

  // Step 2: Salon / Business Data
  const [salonData, setSalonData] = useState({
    name: '',
    slug: '',
    niche: initialNicheKey,
    slogan: currentNiche.defaultSlogan,
    description: currentNiche.defaultDescription,
    cep: '',
    address: '',
    cityState: '',
    whatsapp: '',
    heroImage: currentNiche.heroImage,
  });
  const [slugStatus, setSlugStatus] = useState({ checking: false, available: null, message: '' });
  const slugCheckTimeout = useRef(null);

  const handleNicheChange = (newNicheId) => {
    const nicheObj = getNicheData(newNicheId);
    setSelectedNiche(newNicheId);
    setSearchParams({ nicho: newNicheId }, { replace: true });
    setSalonData(prev => ({
      ...prev,
      niche: newNicheId,
      slogan: nicheObj.defaultSlogan,
      description: nicheObj.defaultDescription,
      heroImage: nicheObj.heroImage,
    }));
  };

  useEffect(() => {
    document.title = `${currentNiche.saasBrand} • ${currentNiche.saasSubtitle}`;
  }, [currentNiche]);

  // Step 3: Payment
  const [paymentMethod, setPaymentMethod] = useState('credit_card'); // 'credit_card', 'debit_card', 'pix'
  const [cardData, setCardData] = useState({
    number: '',
    name: '',
    expiry: '',
    cvv: '',
  });
  const [pixData, setPixData] = useState(null);
  const [pixPolling, setPixPolling] = useState(false);
  const pollingInterval = useRef(null);

  // Step 4: Success & Provisioned Result
  const [provisionResult, setProvisionResult] = useState(null);

  // Load payment config on mount
  useEffect(() => {
    async function loadConfig() {
      try {
        const config = await paymentsAPI.getConfig();
        if (config && typeof config === 'object') {
          setMpConfig(prev => ({ ...prev, ...config }));
        }
      } catch (err) {
        console.warn('Erro ao carregar configurações de pagamento:', err);
      }
    }
    loadConfig();
  }, []);

  // Formatters with null-safety
  const formatPhone = (val) => {
    if (!val) return '';
    const raw = String(val).replace(/\D/g, '').slice(0, 11);
    if (raw.length <= 10) {
      return raw.replace(/(\d{2})(\d{4})(\d{0,4})/, '($1) $2-$3').replace(/-$/, '');
    }
    return raw.replace(/(\d{2})(\d{5})(\d{0,4})/, '($1) $2-$3').replace(/-$/, '');
  };

  const formatCpf = (val) => {
    if (!val) return '';
    const raw = String(val).replace(/\D/g, '').slice(0, 14);
    if (raw.length <= 11) {
      return raw.replace(/(\d{3})(\d{3})(\d{3})(\d{0,2})/, '$1.$2.$3-$4').replace(/-$/, '').replace(/\.$/, '');
    }
    return raw.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{0,2})/, '$1.$2.$3/$4-$5').replace(/-$/, '');
  };

  const formatCardNumber = (val) => {
    if (!val) return '';
    const raw = String(val).replace(/\D/g, '').slice(0, 16);
    return raw.replace(/(\d{4})(?=\d)/g, '$1 ');
  };

  const formatCardExpiry = (val) => {
    if (!val) return '';
    const raw = String(val).replace(/\D/g, '').slice(0, 4);
    if (raw.length <= 2) return raw;
    return `${raw.slice(0, 2)}/${raw.slice(2, 4)}`;
  };

  // Algoritmo de Luhn (ISO/IEC 7812) para validar número do cartão
  const validateCardNumber = (num) => {
    if (!num) return false;
    const clean = String(num).replace(/\D/g, '');
    if (clean.length < 13 || clean.length > 19) return false;
    if (/^(\d)\1+$/.test(clean)) return false; // descarta repetidos como 1111111111111111

    let sum = 0;
    let shouldDouble = false;
    for (let i = clean.length - 1; i >= 0; i--) {
      let digit = parseInt(clean.charAt(i), 10);
      if (shouldDouble) {
        digit *= 2;
        if (digit > 9) digit -= 9;
      }
      sum += digit;
      shouldDouble = !shouldDouble;
    }
    return sum % 10 === 0;
  };

  // Validação de expiração do cartão (formato MM/AA ou MM/AAAA, não vencido)
  const validateCardExpiry = (expiry) => {
    if (!expiry || !/^\d{2}\/\d{2,4}$/.test(expiry.trim())) return false;
    const [monthStr, yearStr] = expiry.trim().split('/');
    const month = parseInt(monthStr, 10);
    let year = parseInt(yearStr, 10);
    if (month < 1 || month > 12) return false;
    if (year < 100) year += 2000;

    const now = new Date();
    const curYear = now.getFullYear();
    const curMonth = now.getMonth() + 1;
    if (year < curYear) return false;
    if (year === curYear && month < curMonth) return false;
    if (year > curYear + 25) return false;
    return true;
  };

  // Validação de CVV
  const validateCardCVV = (cvv) => {
    if (!cvv) return false;
    const clean = String(cvv).replace(/\D/g, '');
    return clean.length >= 3 && clean.length <= 4;
  };

  // Identificação da bandeira
  const getCardBrand = (num) => {
    if (!num) return '';
    const clean = String(num).replace(/\D/g, '');
    if (/^4/.test(clean)) return 'Visa';
    if (/^(5[1-5]|222[1-9]|22[3-9]|2[3-6]|27[0-1]|2720)/.test(clean)) return 'Mastercard';
    if (/^(4011|4389|4514|4576|5041|5066|5090|6277|6362|6500|6504|6505|6507|6509|6516|6550)/.test(clean)) return 'Elo';
    if (/^3[47]/.test(clean)) return 'American Express';
    if (/^(606282|3841)/.test(clean)) return 'Hipercard';
    return '';
  };

  // Auto-generate slug when name changes
  const handleSalonNameChange = (e) => {
    const nameVal = e.target.value;
    const generatedSlug = nameVal
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');

    setSalonData(prev => ({
      ...prev,
      name: nameVal,
      slug: prev.slugModifiedByUser ? prev.slug : generatedSlug
    }));

    if (!salonData.slugModifiedByUser) {
      checkSlugAvailability(generatedSlug);
    }
  };

  const handleSlugChange = (e) => {
    const rawVal = e.target.value;
    const cleanSlug = rawVal
      .toLowerCase()
      .replace(/[^a-z0-9-]+/g, '')
      .replace(/^-+|-+$/g, '');

    setSalonData(prev => ({
      ...prev,
      slug: cleanSlug,
      slugModifiedByUser: true
    }));

    checkSlugAvailability(cleanSlug);
  };

  // Debounced slug check
  const checkSlugAvailability = (slugToCheck) => {
    if (!slugToCheck || slugToCheck.length < 3) {
      setSlugStatus({ checking: false, available: null, message: '' });
      return;
    }

    setSlugStatus({ checking: true, available: null, message: 'Verificando...' });

    if (slugCheckTimeout.current) {
      clearTimeout(slugCheckTimeout.current);
    }

    slugCheckTimeout.current = setTimeout(async () => {
      try {
        const res = await companiesAPI.checkSlug(slugToCheck);
        setSlugStatus({
          checking: false,
          available: res.available,
          message: res.message || (res.available ? 'Link disponível!' : 'Link já em uso')
        });
      } catch (err) {
        setSlugStatus({ checking: false, available: null, message: '' });
      }
    }, 400);
  };

  // Auto-fill address via CEP
  const handleCepBlur = async () => {
    const cleanCep = (salonData.cep || '').replace(/\D/g, '');
    if (cleanCep.length === 8) {
      try {
        const res = await fetch(`https://viacep.com.br/ws/${cleanCep}/json/`);
        const data = await res.json();
        if (!data.erro) {
          setSalonData(prev => ({
            ...prev,
            address: `${data.logradouro || ''}, ${data.bairro || ''}`.trim().replace(/^,\s*/, ''),
            cityState: `${data.localidade || ''} - ${data.uf || ''}`.trim()
          }));
          toast.success('Endereço preenchido automaticamente via CEP!');
        }
      } catch (err) {
        console.warn('Erro ao consultar CEP:', err);
      }
    }
  };

  // Step 1 Validation -> Next Step
  const handleNextFromStep1 = (e) => {
    e.preventDefault();
    if (!userData.name.trim()) return toast.error('Informe seu nome completo.');
    if (!userData.email.trim() || !userData.email.includes('@')) return toast.error('Informe um e-mail válido.');
    if (!userData.phone.trim()) return toast.error('Informe seu telefone/WhatsApp.');
    if (!userData.cpf.trim() || userData.cpf.replace(/\D/g, '').length < 11) {
      return toast.error('Informe um CPF ou CNPJ válido.');
    }
    if (userData.password.length < 6) return toast.error('A senha deve ter pelo menos 6 caracteres.');
    if (userData.password !== userData.confirmPassword) return toast.error('As senhas digitadas não coincidem.');

    setCurrentStep(2);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Step 2 Validation -> Next Step
  const handleNextFromStep2 = (e) => {
    e.preventDefault();
    if (!salonData.name.trim()) return toast.error(`Informe o nome d${currentNiche.entityResponsavel}.`);
    if (!salonData.slug.trim()) return toast.error(`Informe o link personalizado d${currentNiche.entityResponsavel}.`);
    if (slugStatus.available === false) return toast.error('O link informado já está em uso. Escolha outro link.');

    setCurrentStep(3);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Step 3 Payment Processing
  const handleProcessPayment = async (e) => {
    if (e) e.preventDefault();

    if (paymentMethod === 'credit_card' || paymentMethod === 'debit_card') {
      const cleanNum = (cardData.number || '').replace(/\D/g, '');
      if (!cleanNum || cleanNum.length < 13) {
        return toast.error('Informe o número do cartão.');
      }
      if (!validateCardNumber(cleanNum)) {
        return toast.error('Número de cartão inválido. Verifique os dígitos digitados.');
      }
      if (!cardData.name.trim() || cardData.name.trim().length < 3) {
        return toast.error('Informe o nome impresso no cartão completo.');
      }
      if (!validateCardExpiry(cardData.expiry)) {
        return toast.error('Data de validade inválida ou cartão expirado. Formato MM/AA.');
      }
      if (!validateCardCVV(cardData.cvv)) {
        return toast.error('Código CVV inválido (deve conter 3 ou 4 dígitos).');
      }
    }

    try {
      setLoading(true);
      const payload = {
        userData,
        salonData: {
          ...salonData,
          niche: selectedNiche,
          badge: currentNiche.badge,
        },
        paymentData: {
          method: paymentMethod,
          autoRecurring: true,
          card: {
            cardNumber: (cardData.number || '').replace(/\D/g, ''),
            cardholderName: cardData.name,
            cardExpiration: cardData.expiry,
            securityCode: cardData.cvv,
          },
        },
      };

      const res = await paymentsAPI.process(payload);

      if (paymentMethod === 'pix' && res.status === 'pending') {
        setPixData(res);
        startPixPolling(res.paymentId);
        toast.success('Chave PIX gerada com sucesso! Conclua o pagamento pelo seu banco.');
      } else if (res.status === 'approved') {
        handlePaymentSuccess(res);
      }
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.error || 'Erro ao processar pagamento. Verifique seus dados.');
    } finally {
      setLoading(false);
    }
  };

  // PIX Polling
  const startPixPolling = (paymentId) => {
    setPixPolling(true);
    if (pollingInterval.current) clearInterval(pollingInterval.current);

    pollingInterval.current = setInterval(async () => {
      try {
        const statusRes = await paymentsAPI.getStatus(paymentId);
        if (statusRes.status === 'approved') {
          clearInterval(pollingInterval.current);
          setPixPolling(false);
          handlePaymentSuccess(statusRes);
        }
      } catch (err) {
        console.warn('Polling error:', err);
      }
    }, 3000);
  };

  // Simulação de Aprovação para Ambiente Local
  const handleSimulateLocalApproval = async () => {
    if (!pixData?.paymentId) return;
    try {
      setLoading(true);
      const res = await paymentsAPI.simulateApproval(pixData.paymentId);
      if (res.status === 'approved') {
        if (pollingInterval.current) clearInterval(pollingInterval.current);
        setPixPolling(false);
        handlePaymentSuccess(res);
      }
    } catch (err) {
      toast.error(err.response?.data?.error || 'Erro ao simular aprovação.');
    } finally {
      setLoading(false);
    }
  };

  // Payment Success Handler
  const handlePaymentSuccess = (res) => {
    if (res.token && res.company) {
      localStorage.setItem(`studio_beauty_token_${res.company.slug}`, res.token);
      localStorage.setItem(`studio_beauty_admin_${res.company.slug}`, JSON.stringify(res.adminUser));
      localStorage.setItem('studio_beauty_admin', JSON.stringify(res.adminUser));
    }
    setProvisionResult(res);
    setCurrentStep(4);
    toast.success(`🎉 Parabéns! ${currentNiche.label} ativada com sucesso!`);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  useEffect(() => {
    return () => {
      if (pollingInterval.current) clearInterval(pollingInterval.current);
      if (slugCheckTimeout.current) clearTimeout(slugCheckTimeout.current);
    };
  }, []);

  const handleCopyPix = () => {
    if (pixData?.qr_code) {
      navigator.clipboard.writeText(pixData.qr_code);
      toast.success('Código PIX Copia e Cola copiado para a área de transferência!');
    }
  };

  const planDisplayPrice = Number(mpConfig?.planPrice || 69.90).toFixed(2).replace('.', ',');
  const planDisplayName = mpConfig?.planName || 'Plano Profissional';

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans text-gray-900 transition-colors duration-300">
      {/* Top Header Dinâmico de acordo com a seleção */}
      <header className="bg-white/95 backdrop-blur-md border-b border-gray-200 sticky top-0 z-40">
        <div className="max-w-5xl mx-auto px-4 h-16 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2.5">
            <div className={`w-9 h-9 rounded-xl bg-gradient-to-tr ${currentNiche.theme.primaryGradient} flex items-center justify-center text-white shadow-sm text-base`}>
              <span>{currentNiche.icon}</span>
            </div>
            <div>
              <span className="font-heading font-bold text-lg text-gray-900 tracking-tight block">
                {currentNiche.saasBrand}
              </span>
              <span className="text-[10px] uppercase font-bold text-gray-500 tracking-widest block -mt-1">
                {currentNiche.saasSubtitle}
              </span>
            </div>
          </Link>

          <div className="flex items-center gap-4 text-xs font-medium">
            <span className="hidden sm:inline text-gray-500">
              Já tem {currentNiche.entityName} cadastrada?
            </span>
            <Link
              to="/login"
              className="px-3.5 py-1.5 rounded-full border border-gray-300 text-gray-700 hover:bg-gray-100 transition-colors"
            >
              Fazer Login
            </Link>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 max-w-4xl mx-auto w-full px-4 py-8 md:py-12">
        {/* Progress Stepper Dinâmico */}
        <div className="mb-8 md:mb-12">
          <div className="flex items-center justify-between max-w-2xl mx-auto relative">
            {/* Progress line */}
            <div className="absolute top-1/2 left-0 right-0 -translate-y-1/2 h-1 bg-gray-200 z-0">
              <div
                className="h-full transition-all duration-500"
                style={{
                  width: `${((currentStep - 1) / 3) * 100}%`,
                  backgroundColor: currentNiche.theme.stepperColor || '#18181B'
                }}
              />
            </div>

            {/* Step circles */}
            {[
              { num: 1, title: 'Seus Dados', icon: FaUser },
              { num: 2, title: currentNiche.entityTitle, icon: FaStore },
              { num: 3, title: 'Pagamento', icon: FaCreditCard },
              { num: 4, title: 'Ativação', icon: FaCheckCircle },
            ].map(step => (
              <div key={step.num} className="relative z-10 flex flex-col items-center">
                <div
                  className={`w-10 h-10 md:w-12 md:h-12 rounded-full flex items-center justify-center text-sm md:text-base font-bold transition-all shadow-sm ${
                    currentStep === step.num
                      ? `${currentNiche.theme.stepActiveClass} scale-110`
                      : currentStep > step.num
                      ? 'bg-emerald-500 text-white'
                      : 'bg-white text-gray-400 border-2 border-gray-200'
                  }`}
                >
                  <step.icon />
                </div>
                <span className={`text-[11px] md:text-xs font-semibold mt-2 transition-colors ${
                  currentStep === step.num ? 'text-gray-900 font-bold' : 'text-gray-500'
                }`}>
                  {step.title}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Wizard Card Neutro e Elegante */}
        <div className="bg-white rounded-3xl shadow-xl border border-gray-200/90 p-6 sm:p-8 md:p-10 relative overflow-hidden">
          {/* ═══════════════════════════════════════════════════════════════════ */}
          {/* ETAPA 1: DADOS DO DONO / TITULAR                                   */}
          {/* ═══════════════════════════════════════════════════════════════════ */}
          {currentStep === 1 && (
            <motion.div
              key="step1"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.25 }}
            >
              <div className="mb-8">
                <span className={`text-xs font-bold uppercase tracking-wider px-3 py-1 rounded-full border ${currentNiche.theme.badgeClass}`}>
                  Passo 1 de 3 • {currentNiche.label}
                </span>
                <h2 className="text-2xl sm:text-3xl font-heading font-bold text-gray-900 mt-2">
                  Cadastre Seus Dados Pessoais
                </h2>
                <p className="text-sm text-gray-500 mt-1">
                  Estes serão os dados de acesso do administrador responsável {currentNiche.entityResponsavel}.
                </p>
              </div>

              {/* Seletor de Segmento no Passo 1 */}
              <div className="p-3.5 rounded-2xl bg-gray-50 border border-gray-200 mb-6">
                <div className="flex items-center justify-between mb-2">
                  <label className="text-[11px] font-bold text-gray-700 uppercase tracking-wider">
                    Segmento do Estabelecimento:
                  </label>
                  <span className="text-[11px] text-gray-500 hidden sm:inline">
                    Altera o tema e o slogan acima
                  </span>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {Object.values(NICHES).map((n) => {
                    const isSelected = selectedNiche === n.id;
                    return (
                      <button
                        key={n.id}
                        type="button"
                        onClick={() => handleNicheChange(n.id)}
                        className={`p-2.5 rounded-xl border text-xs font-bold flex items-center justify-center gap-1.5 transition-all ${
                          isSelected
                            ? 'bg-gray-900 text-white border-gray-900 shadow-sm scale-[1.02]'
                            : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-100'
                        }`}
                      >
                        <span className="text-base">{n.icon}</span>
                        <span>{n.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              <form onSubmit={handleNextFromStep1} className="space-y-5">
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1.5">Nome Completo *</label>
                  <div className="relative">
                    <FaUser className="absolute left-4 top-3.5 text-gray-400 text-sm" />
                    <input
                      type="text"
                      required
                      placeholder={currentNiche.personPlaceholder}
                      value={userData.name}
                      onChange={(e) => setUserData({ ...userData, name: e.target.value })}
                      className={`w-full pl-11 pr-4 py-3 rounded-xl border border-gray-300 text-sm transition ${currentNiche.theme.focusBorder}`}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1.5">E-mail de Acesso (Login) *</label>
                    <div className="relative">
                      <FaEnvelope className="absolute left-4 top-3.5 text-gray-400 text-sm" />
                      <input
                        type="email"
                        required
                        placeholder={currentNiche.emailPlaceholder}
                        value={userData.email}
                        onChange={(e) => setUserData({ ...userData, email: e.target.value })}
                        className={`w-full pl-11 pr-4 py-3 rounded-xl border border-gray-300 text-sm transition ${currentNiche.theme.focusBorder}`}
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1.5">WhatsApp / Celular *</label>
                    <div className="relative">
                      <FaPhone className="absolute left-4 top-3.5 text-gray-400 text-sm" />
                      <input
                        type="text"
                        required
                        placeholder="(11) 99999-8888"
                        value={userData.phone}
                        onChange={(e) => setUserData({ ...userData, phone: formatPhone(e.target.value) })}
                        className={`w-full pl-11 pr-4 py-3 rounded-xl border border-gray-300 text-sm transition ${currentNiche.theme.focusBorder}`}
                      />
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1.5">CPF ou CNPJ (Obrigatório para emissão Mercado Pago) *</label>
                  <div className="relative">
                    <FaIdCard className="absolute left-4 top-3.5 text-gray-400 text-sm" />
                    <input
                      type="text"
                      required
                      placeholder="000.000.000-00"
                      value={userData.cpf}
                      onChange={(e) => setUserData({ ...userData, cpf: formatCpf(e.target.value) })}
                      className={`w-full pl-11 pr-4 py-3 rounded-xl border border-gray-300 text-sm transition ${currentNiche.theme.focusBorder}`}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1.5">Senha de Acesso *</label>
                    <div className="relative">
                      <FaLock className="absolute left-4 top-3.5 text-gray-400 text-sm" />
                      <input
                        type={showPassword ? 'text' : 'password'}
                        required
                        minLength="6"
                        placeholder="Mínimo 6 caracteres"
                        value={userData.password}
                        onChange={(e) => setUserData({ ...userData, password: e.target.value })}
                        className={`w-full pl-11 pr-11 py-3 rounded-xl border border-gray-300 text-sm transition ${currentNiche.theme.focusBorder}`}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-4 top-3.5 text-gray-400 hover:text-gray-600"
                      >
                        {showPassword ? <FaEyeSlash /> : <FaEye />}
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1.5">Confirmar Senha *</label>
                    <div className="relative">
                      <FaLock className="absolute left-4 top-3.5 text-gray-400 text-sm" />
                      <input
                        type={showPassword ? 'text' : 'password'}
                        required
                        minLength="6"
                        placeholder="Repita sua senha"
                        value={userData.confirmPassword}
                        onChange={(e) => setUserData({ ...userData, confirmPassword: e.target.value })}
                        className={`w-full pl-11 pr-4 py-3 rounded-xl border border-gray-300 text-sm transition ${currentNiche.theme.focusBorder}`}
                      />
                    </div>
                  </div>
                </div>

                <div className="pt-6 border-t border-gray-100 flex justify-end">
                  <button
                    type="submit"
                    className={`inline-flex items-center gap-2 px-8 py-3.5 rounded-full ${currentNiche.theme.buttonClass} text-white font-semibold text-sm shadow-md hover:scale-105 transition-all`}
                  >
                    <span>Avançar: Dados {currentNiche.entityResponsavel}</span>
                    <FaArrowRight className="text-xs" />
                  </button>
                </div>
              </form>
            </motion.div>
          )}

          {/* ═══════════════════════════════════════════════════════════════════ */}
          {/* ETAPA 2: DADOS DO ESTABELECIMENTO                                   */}
          {/* ═══════════════════════════════════════════════════════════════════ */}
          {currentStep === 2 && (
            <motion.div
              key="step2"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.25 }}
            >
              <div className="mb-8">
                <span className={`text-xs font-bold uppercase tracking-wider px-3 py-1 rounded-full border ${currentNiche.theme.badgeClass}`}>
                  Passo 2 de 3
                </span>
                <h2 className="text-2xl sm:text-3xl font-heading font-bold text-gray-900 mt-2">
                  Cadastre os Dados d{currentNiche.entityResponsavel}
                </h2>
                <p className="text-sm text-gray-500 mt-1">
                  Estas informações serão exibidas na sua página pública de agendamento exclusiva.
                </p>
              </div>

              <form onSubmit={handleNextFromStep2} className="space-y-5">
                {/* Segmento do Estabelecimento */}
                <div className="p-4 rounded-2xl bg-gray-50 border border-gray-200">
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">
                    Segmento Selecionado:
                  </label>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    {Object.values(NICHES).map((n) => {
                      const isSelected = selectedNiche === n.id;
                      return (
                        <button
                          key={n.id}
                          type="button"
                          onClick={() => handleNicheChange(n.id)}
                          className={`p-2.5 rounded-xl border text-xs font-bold flex items-center justify-center gap-2 transition-all ${
                            isSelected
                              ? 'bg-gray-900 text-white border-gray-900 shadow-md scale-[1.02]'
                              : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-100'
                          }`}
                        >
                          <span className="text-base">{n.icon}</span>
                          <span>{n.label}</span>
                        </button>
                      );
                    })}
                  </div>
                  <p className="text-[11px] text-gray-500 mt-2">
                    ✨ Textos, slogan e foto de capa foram adaptados para <strong>{currentNiche.label}</strong>.
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1.5">
                      Nome d{currentNiche.entityResponsavel} *
                    </label>
                    <div className="relative">
                      <FaStore className="absolute left-4 top-3.5 text-gray-400 text-sm" />
                      <input
                        type="text"
                        required
                        placeholder={`Ex: ${currentNiche.placeholderName}`}
                        value={salonData.name}
                        onChange={handleSalonNameChange}
                        className={`w-full pl-11 pr-4 py-3 rounded-xl border border-gray-300 text-sm transition ${currentNiche.theme.focusBorder}`}
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1.5">
                      Link Exclusivo (Slug) *
                    </label>
                    <div className="relative">
                      <FaLink className="absolute left-4 top-3.5 text-gray-400 text-sm" />
                      <input
                        type="text"
                        required
                        placeholder="nome-do-negocio"
                        value={salonData.slug}
                        onChange={handleSlugChange}
                        className={`w-full pl-11 pr-4 py-3 rounded-xl border text-sm font-mono focus:outline-none ${
                          slugStatus.available === true
                            ? 'border-emerald-500 bg-emerald-50/20'
                            : slugStatus.available === false
                            ? 'border-red-500 bg-red-50/20'
                            : 'border-gray-300 focus:border-gray-900'
                        }`}
                      />
                    </div>
                    <div className="mt-1 flex items-center justify-between text-[11px]">
                      <span className="text-gray-500">
                        <span>Seu link será: </span>
                        <strong className="text-gray-900 font-mono">/{salonData.slug || 'seu-link'}</strong>
                      </span>
                      {slugStatus.checking && (
                        <span key="checking" className="text-gray-400 flex items-center gap-1">
                          <FaSpinner className="animate-spin text-xs" />
                          <span>Verificando...</span>
                        </span>
                      )}
                      {!slugStatus.checking && slugStatus.available === true && (
                        <span key="avail" className="text-emerald-600 font-bold flex items-center gap-1">
                          <FaCheckCircle />
                          <span>Link disponível</span>
                        </span>
                      )}
                      {!slugStatus.checking && slugStatus.available === false && (
                        <span key="unavail" className="text-red-500 font-bold">
                          Link já utilizado
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1.5">Slogan / Frase de Destaque</label>
                  <input
                    type="text"
                    placeholder={`Ex: ${currentNiche.defaultSlogan}`}
                    value={salonData.slogan}
                    onChange={(e) => setSalonData({ ...salonData, slogan: e.target.value })}
                    className={`w-full px-4 py-3 rounded-xl border border-gray-300 text-sm transition ${currentNiche.theme.focusBorder}`}
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1.5">CEP (Auto-busca)</label>
                    <input
                      type="text"
                      placeholder="Ex: 01310-200"
                      value={salonData.cep}
                      onChange={(e) => setSalonData({ ...salonData, cep: e.target.value })}
                      onBlur={handleCepBlur}
                      className={`w-full px-4 py-3 rounded-xl border border-gray-300 text-sm transition ${currentNiche.theme.focusBorder}`}
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block text-xs font-bold text-gray-700 mb-1.5">Cidade - Estado</label>
                    <input
                      type="text"
                      placeholder="Ex: São Paulo - SP"
                      value={salonData.cityState}
                      onChange={(e) => setSalonData({ ...salonData, cityState: e.target.value })}
                      className={`w-full px-4 py-3 rounded-xl border border-gray-300 text-sm transition ${currentNiche.theme.focusBorder}`}
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1.5">Endereço Completo</label>
                  <div className="relative">
                    <FaMapMarkerAlt className="absolute left-4 top-3.5 text-gray-400 text-sm" />
                    <input
                      type="text"
                      placeholder="Ex: Av. Principal, 120 - Centro"
                      value={salonData.address}
                      onChange={(e) => setSalonData({ ...salonData, address: e.target.value })}
                      className={`w-full pl-11 pr-4 py-3 rounded-xl border border-gray-300 text-sm transition ${currentNiche.theme.focusBorder}`}
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1.5">
                    WhatsApp de Atendimento {currentNiche.entityResponsavel}
                  </label>
                  <div className="relative">
                    <FaPhone className="absolute left-4 top-3.5 text-gray-400 text-sm" />
                    <input
                      type="text"
                      placeholder="(11) 99999-8888"
                      value={salonData.whatsapp}
                      onChange={(e) => setSalonData({ ...salonData, whatsapp: formatPhone(e.target.value) })}
                      className={`w-full pl-11 pr-4 py-3 rounded-xl border border-gray-300 text-sm transition ${currentNiche.theme.focusBorder}`}
                    />
                  </div>
                </div>

                <div className="pt-6 border-t border-gray-100 flex items-center justify-between">
                  <button
                    type="button"
                    onClick={() => setCurrentStep(1)}
                    className="inline-flex items-center gap-2 px-6 py-3 rounded-full border border-gray-300 text-gray-600 hover:bg-gray-50 text-sm font-semibold transition"
                  >
                    <FaArrowLeft className="text-xs" />
                    <span>Voltar</span>
                  </button>

                  <button
                    type="submit"
                    className={`inline-flex items-center gap-2 px-8 py-3.5 rounded-full ${currentNiche.theme.buttonClass} text-white font-semibold text-sm shadow-md hover:scale-105 transition-all`}
                  >
                    <span>Avançar: Pagamento</span>
                    <FaArrowRight className="text-xs" />
                  </button>
                </div>
              </form>
            </motion.div>
          )}

          {/* ═══════════════════════════════════════════════════════════════════ */}
          {/* ETAPA 3: MEIO DE PAGAMENTO MERCADO PAGO COM COBRANÇA AUTOMÁTICA    */}
          {/* ═══════════════════════════════════════════════════════════════════ */}
          {currentStep === 3 && (
            <motion.div
              key="step3"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.25 }}
            >
              <div className="mb-6">
                <span className={`text-xs font-bold uppercase tracking-wider px-3 py-1 rounded-full border ${currentNiche.theme.badgeClass}`}>
                  Passo 3 de 3 • Mercado Pago
                </span>
                <h2 className="text-2xl sm:text-3xl font-heading font-bold text-gray-900 mt-2">
                  Escolha a Forma de Pagamento
                </h2>
                <p className="text-sm text-gray-500 mt-1">
                  Cobranças automáticas seguras e processadas através do <strong>Mercado Pago</strong>.
                </p>
              </div>

              {/* Plan Summary Card Neutro */}
              <div className="p-5 rounded-2xl bg-gray-50 border border-gray-200 mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <span className="text-[11px] font-bold uppercase tracking-wider text-gray-500">
                    Assinatura Recorrente • {currentNiche.label}
                  </span>
                  <h3 className="text-xl font-bold text-gray-900">{planDisplayName}</h3>
                  <p className="text-xs text-gray-600 mt-0.5">
                    Acesso completo ao sistema de agendamentos, equipe ilimitada e link próprio.
                  </p>
                </div>
                <div className="text-left sm:text-right shrink-0">
                  <span className="text-xs text-gray-500 block">Mensalidade</span>
                  <span className="text-2xl font-extrabold text-gray-900">
                    R$ {planDisplayPrice}
                  </span>
                  <span className="text-[11px] text-emerald-600 font-semibold block mt-0.5 flex items-center gap-1 sm:justify-end">
                    <FaShieldAlt /> Cobrança Automática
                  </span>
                </div>
              </div>

              {/* Payment Method Selector Tabs */}
              <div className="grid grid-cols-3 gap-2.5 mb-6">
                <button
                  type="button"
                  onClick={() => { setPaymentMethod('credit_card'); setPixData(null); }}
                  className={`p-3.5 rounded-2xl border text-center transition flex flex-col items-center gap-1.5 ${
                    paymentMethod === 'credit_card'
                      ? 'border-gray-900 bg-gray-50 ring-2 ring-gray-900'
                      : 'border-gray-200 hover:border-gray-300 bg-white'
                  }`}
                >
                  <FaCreditCard className={`text-xl ${paymentMethod === 'credit_card' ? 'text-gray-900' : 'text-gray-400'}`} />
                  <span className="text-xs font-bold text-gray-900">Cartão de Crédito</span>
                  <span className="text-[10px] text-gray-500">Recorrente Mensal</span>
                </button>

                <button
                  type="button"
                  onClick={() => { setPaymentMethod('debit_card'); setPixData(null); }}
                  className={`p-3.5 rounded-2xl border text-center transition flex flex-col items-center gap-1.5 ${
                    paymentMethod === 'debit_card'
                      ? 'border-gray-900 bg-gray-50 ring-2 ring-gray-900'
                      : 'border-gray-200 hover:border-gray-300 bg-white'
                  }`}
                >
                  <FaCreditCard className={`text-xl ${paymentMethod === 'debit_card' ? 'text-gray-900' : 'text-gray-400'}`} />
                  <span className="text-xs font-bold text-gray-900">Cartão de Débito</span>
                  <span className="text-[10px] text-gray-500">À Vista</span>
                </button>

                <button
                  type="button"
                  onClick={() => { setPaymentMethod('pix'); }}
                  className={`p-3.5 rounded-2xl border text-center transition flex flex-col items-center gap-1.5 ${
                    paymentMethod === 'pix'
                      ? 'border-gray-900 bg-gray-50 ring-2 ring-gray-900'
                      : 'border-gray-200 hover:border-gray-300 bg-white'
                  }`}
                >
                  <FaQrcode className={`text-xl ${paymentMethod === 'pix' ? 'text-gray-900' : 'text-gray-400'}`} />
                  <span className="text-xs font-bold text-gray-900">PIX</span>
                  <span className="text-[10px] text-emerald-600 font-semibold">Instantâneo</span>
                </button>
              </div>

              {/* FORM: Cartão de Crédito ou Débito */}
              {(paymentMethod === 'credit_card' || paymentMethod === 'debit_card') && (
                <form onSubmit={handleProcessPayment} className="space-y-4">
                  <div className="p-4 rounded-xl bg-gray-50 border border-gray-200 text-xs text-gray-600 flex items-center gap-2.5">
                    <FaShieldAlt className="text-emerald-600 text-base shrink-0" />
                    <span>
                      {paymentMethod === 'credit_card'
                        ? 'A cobrança será renovada automaticamente todo mês via Mercado Pago. Você pode cancelar a qualquer momento sem custos adicionais.'
                        : 'Pagamento seguro processado instantaneamente através do Mercado Pago.'}
                    </span>
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <label className="block text-xs font-bold text-gray-700">Número do Cartão *</label>
                      {getCardBrand(cardData.number) && (
                        <span className="text-[11px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                          {getCardBrand(cardData.number)}
                        </span>
                      )}
                    </div>
                    <div className="relative">
                      <FaCreditCard className="absolute left-4 top-3.5 text-gray-400 text-sm" />
                      <input
                        type="text"
                        required
                        placeholder="0000 0000 0000 0000"
                        value={cardData.number}
                        onChange={(e) => setCardData({ ...cardData, number: formatCardNumber(e.target.value) })}
                        className={`w-full pl-11 pr-4 py-3 rounded-xl border border-gray-300 text-sm font-mono transition ${currentNiche.theme.focusBorder}`}
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1.5">Nome Impresso no Cartão *</label>
                    <input
                      type="text"
                      required
                      placeholder="Como está gravado no cartão"
                      value={cardData.name}
                      onChange={(e) => setCardData({ ...cardData, name: e.target.value.toUpperCase() })}
                      className={`w-full px-4 py-3 rounded-xl border border-gray-300 text-sm uppercase transition ${currentNiche.theme.focusBorder}`}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-gray-700 mb-1.5">Validade *</label>
                      <input
                        type="text"
                        required
                        placeholder="MM/AA"
                        value={cardData.expiry}
                        onChange={(e) => setCardData({ ...cardData, expiry: formatCardExpiry(e.target.value) })}
                        className={`w-full px-4 py-3 rounded-xl border border-gray-300 text-sm font-mono transition ${currentNiche.theme.focusBorder}`}
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-gray-700 mb-1.5">Código CVV *</label>
                      <input
                        type="password"
                        required
                        maxLength="4"
                        placeholder="123"
                        value={cardData.cvv}
                        onChange={(e) => setCardData({ ...cardData, cvv: e.target.value.replace(/\D/g, '') })}
                        className={`w-full px-4 py-3 rounded-xl border border-gray-300 text-sm font-mono transition ${currentNiche.theme.focusBorder}`}
                      />
                    </div>
                  </div>

                  <div className="pt-6 border-t border-gray-100 flex items-center justify-between">
                    <button
                      type="button"
                      onClick={() => setCurrentStep(2)}
                      className="inline-flex items-center gap-2 px-6 py-3 rounded-full border border-gray-300 text-gray-600 hover:bg-gray-50 text-sm font-semibold transition"
                    >
                      <FaArrowLeft className="text-xs" />
                      <span>Voltar</span>
                    </button>

                    <button
                      type="submit"
                      disabled={loading}
                      className={`inline-flex items-center gap-2 px-8 py-3.5 rounded-full ${currentNiche.theme.buttonClass} text-white font-semibold text-sm shadow-md hover:scale-105 transition-all disabled:opacity-50`}
                    >
                      {loading ? (
                        <>
                          <FaSpinner className="animate-spin text-sm" />
                          <span>Processando Mercado Pago...</span>
                        </>
                      ) : (
                        <>
                          <span>Pagar R$ {planDisplayPrice} e Ativar {currentNiche.label}</span>
                          <FaArrowRight className="text-xs" />
                        </>
                      )}
                    </button>
                  </div>
                </form>
              )}

              {/* ABA: PIX (Cobrança Automática & Ativação Instantânea) */}
              {paymentMethod === 'pix' && (
                <div className="space-y-6">
                  {!pixData ? (
                    <div className="text-center py-8 px-4 rounded-2xl bg-gray-50 border border-gray-200">
                      <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center text-3xl mx-auto mb-4">
                        <FaQrcode />
                      </div>
                      <h4 className="text-lg font-bold text-gray-900">Gerar Cobrança PIX</h4>
                      <p className="text-xs text-gray-500 max-w-sm mx-auto mt-1 mb-6">
                        Clique no botão abaixo para gerar o QR Code oficial do Mercado Pago e pagar instantaneamente pelo app do seu banco.
                      </p>
                      <button
                        type="button"
                        onClick={() => handleProcessPayment()}
                        disabled={loading}
                        className="inline-flex items-center gap-2 px-8 py-3.5 rounded-full bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-sm shadow-md transition disabled:opacity-50"
                      >
                        {loading ? (
                          <>
                            <FaSpinner className="animate-spin text-sm" />
                            <span>Gerando Chave PIX...</span>
                          </>
                        ) : (
                          <>
                            <FaQrcode />
                            <span>Gerar Chave e QR Code PIX (R$ {planDisplayPrice})</span>
                          </>
                        )}
                      </button>
                    </div>
                  ) : (
                    <div className="p-6 rounded-2xl bg-gray-50 border border-gray-200 flex flex-col items-center text-center animate-fadeIn">
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-700 mb-4">
                        <FaClock /> Aguardando Pagamento
                      </span>

                      {/* QR Code Image */}
                      <div className="p-3 bg-white rounded-2xl shadow-sm border border-gray-200 mb-4">
                        {pixData.qr_code_base64 ? (
                          <img
                            src={`data:image/png;base64,${pixData.qr_code_base64}`}
                            alt="QR Code PIX Mercado Pago"
                            className="w-56 h-56 object-contain"
                          />
                        ) : (
                          <img
                            src={pixData.ticket_url || `https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(pixData.qr_code)}`}
                            alt="QR Code PIX"
                            className="w-56 h-56 object-contain"
                          />
                        )}
                      </div>

                      <p className="text-xs text-gray-600 font-medium mb-3">
                        Abra o app do seu banco e escaneie o QR Code acima, ou utilize o código Copia e Cola:
                      </p>

                      {/* Pix Copia e Cola */}
                      <div className="w-full max-w-md flex items-center gap-2 bg-white p-2 rounded-xl border border-gray-300 mb-4">
                        <input
                          type="text"
                          readOnly
                          value={pixData.qr_code || ''}
                          className="w-full text-xs font-mono text-gray-600 bg-transparent outline-none truncate px-2"
                        />
                        <button
                          type="button"
                          onClick={handleCopyPix}
                          className="shrink-0 px-3 py-2 bg-gray-900 hover:bg-black text-white text-xs font-bold rounded-lg flex items-center gap-1.5 transition"
                        >
                          <FaCopy /> Copiar
                        </button>
                      </div>

                      {/* Radar de Detecção Automática */}
                      <div className="flex items-center gap-2 text-xs text-gray-500 mb-4">
                        <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping" />
                        <span>Identificação automática ativa. Assim que pagar, {currentNiche.entityName} será liberada na hora!</span>
                      </div>

                      {/* Ambiente Local: Botão de Teste */}
                      <div className="mt-4 pt-4 border-t border-gray-200 w-full max-w-md">
                        <p className="text-[11px] text-gray-400 mb-2">Ambiente de Testes Local (Desenvolvimento):</p>
                        <button
                          type="button"
                          onClick={handleSimulateLocalApproval}
                          disabled={loading}
                          className="w-full py-2.5 px-4 rounded-xl border border-dashed border-gray-300 bg-white text-gray-700 hover:bg-gray-100 text-xs font-bold transition flex items-center justify-center gap-2"
                        >
                          <FaMagic /> Simular Aprovação de Pagamento Imediata
                        </button>
                      </div>
                    </div>
                  )}

                  <div className="pt-4 border-t border-gray-100 flex justify-between">
                    <button
                      type="button"
                      onClick={() => { setPixData(null); setCurrentStep(2); }}
                      className="inline-flex items-center gap-2 px-6 py-3 rounded-full border border-gray-300 text-gray-600 hover:bg-gray-50 text-sm font-semibold transition"
                    >
                      <FaArrowLeft className="text-xs" />
                      <span>Voltar</span>
                    </button>
                  </div>
                </div>
              )}
            </motion.div>
          )}

          {/* ═══════════════════════════════════════════════════════════════════ */}
          {/* ETAPA 4: SUCESSO & ATIVAÇÃO CONCLUÍDA                               */}
          {/* ═══════════════════════════════════════════════════════════════════ */}
          {currentStep === 4 && provisionResult && (
            <motion.div
              key="step4"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.3 }}
              className="text-center py-6"
            >
              <div className="w-20 h-20 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center text-4xl mx-auto mb-6 shadow-sm">
                <FaCheckCircle />
              </div>

              <h2 className="text-3xl font-heading font-bold text-gray-900">
                Parabéns, {provisionResult.adminUser?.name?.split(' ')[0]}!
              </h2>
              <p className="text-base text-gray-600 mt-2 max-w-lg mx-auto">
                {currentNiche.label} <strong>{provisionResult.company?.name}</strong> foi criada e sua assinatura foi ativada com sucesso pelo Mercado Pago!
              </p>

              {/* Cards de Acesso */}
              <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-2xl mx-auto text-left">
                {/* Link Público */}
                <div className="p-5 rounded-2xl bg-gray-50 border border-gray-200">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-gray-500 block mb-1">
                    Link Público para Clientes
                  </span>
                  <p className="text-xs font-mono text-gray-900 font-bold truncate">
                    {typeof window !== 'undefined' ? window.location.origin : ''}/{provisionResult.company?.slug}
                  </p>
                  <p className="text-[11px] text-gray-500 mt-1 mb-3">
                    Envie este link para seus clientes agendarem horários online 24h.
                  </p>
                  <a
                    href={`/${provisionResult.company?.slug}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 text-xs text-gray-900 font-bold hover:underline"
                  >
                    <span>Abrir Site d{currentNiche.entityResponsavel}</span>
                    <FaExternalLinkAlt className="text-[10px]" />
                  </a>
                </div>

                {/* Painel Administrativo */}
                <div className="p-5 rounded-2xl bg-gray-50 border border-gray-200">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-gray-500 block mb-1">
                    Acesso Administrativo
                  </span>
                  <p className="text-xs font-mono text-gray-900 font-bold truncate">
                    {typeof window !== 'undefined' ? window.location.origin : ''}/{provisionResult.company?.slug}/admin
                  </p>
                  <p className="text-[11px] text-gray-500 mt-1 mb-3">
                    Gerencie sua agenda, equipe e serviços cadastrados.
                  </p>
                  <span className="inline-flex items-center gap-1.5 text-xs text-emerald-600 font-bold">
                    <FaShieldAlt /> Login já conectado
                  </span>
                </div>
              </div>

              {/* CTA Principal */}
              <div className="mt-10">
                <button
                  onClick={() => navigate(`/${provisionResult.company?.slug}/admin/painel`)}
                  className={`inline-flex items-center gap-3 px-10 py-4 rounded-full ${currentNiche.theme.buttonClass} text-white font-bold text-base shadow-xl hover:scale-105 transition-all`}
                >
                  <span>Acessar Meu Painel Administrativo Agora</span>
                  <FaArrowRight className="text-sm" />
                </button>
              </div>
            </motion.div>
          )}
        </div>
      </main>
    </div>
  );
}
