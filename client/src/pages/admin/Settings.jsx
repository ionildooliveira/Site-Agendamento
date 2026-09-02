import { useState, useEffect } from 'react';
import { settingsAPI, professionalsAPI, authAPI } from '../../services/api';
import { getSalonSettings, saveSalonSettings, generateWorkingHoursText } from '../../services/salonSettings';
import { toast } from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';
import {
  FaClock, FaCalendarMinus, FaTrash, FaSave, FaPlusCircle,
  FaPowerOff, FaStore, FaWhatsapp, FaImage, FaLock
} from 'react-icons/fa';

export default function AdminSettings() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('salon');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingCover, setUploadingCover] = useState(false);

  // Tab 1: Salon Identity Settings (localStorage backed + reactive)
  const [salonData, setSalonData] = useState(getSalonSettings());

  // Tab 2: Working Hours
  const [workingHours, setWorkingHours] = useState({});
  const [slotInterval, setSlotInterval] = useState(30);

  // Tab 3: Blocked Dates
  const [blockedDates, setBlockedDates] = useState([]);
  const [professionals, setProfessionals] = useState([]);
  const [blockDate, setBlockDate] = useState('');
  const [blockReason, setBlockReason] = useState('');
  const [blockProId, setBlockProId] = useState('');

  // Tab 4: Security (Credentials)
  const [currentPassword, setCurrentPassword] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const weekdays = [
    { key: '1', label: 'Segunda-feira' },
    { key: '2', label: 'Terça-feira' },
    { key: '3', label: 'Quarta-feira' },
    { key: '4', label: 'Quinta-feira' },
    { key: '5', label: 'Sexta-feira' },
    { key: '6', label: 'Sábado' },
    { key: '0', label: 'Domingo' }
  ];

  const loadSettingsAndBlockedDates = async () => {
    try {
      setLoading(true);
      const [sets, blocks, pros] = await Promise.all([
        settingsAPI.get(),
        settingsAPI.getBlockedDates(),
        professionalsAPI.getAll('all')
      ]);
      setWorkingHours(sets.working_hours || {});
      setSlotInterval(sets.slot_interval || 30);
      setBlockedDates(blocks || []);
      setProfessionals(pros || []);
    } catch (err) {
      console.error(err);
      toast.error('Erro ao carregar configurações');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    async function initSettings() {
      try {
        const [sets, blocks, pros] = await Promise.all([
          settingsAPI.get(),
          settingsAPI.getBlockedDates(),
          professionalsAPI.getAll('all')
        ]);
        setWorkingHours(sets.working_hours || {});
        setSlotInterval(sets.slot_interval || 30);
        setBlockedDates(blocks || []);
        setProfessionals(pros || []);
      } catch (err) {
        console.error(err);
        toast.error('Erro ao carregar configurações');
      } finally {
        setLoading(false);
      }
    }
    initSettings();
  }, []);

  useEffect(() => {
    const updateSalon = () => {
      setSalonData(getSalonSettings());
    };
    window.addEventListener('salonSettingsUpdated', updateSalon);
    return () => {
      window.removeEventListener('salonSettingsUpdated', updateSalon);
    };
  }, []);

  // Save Salon Identity (Tab 1)
  const handleSaveSalonIdentity = async (e) => {
    e.preventDefault();
    try {
      setSaving(true);
      await saveSalonSettings(salonData);
      toast.success('Configurações do Salão e WhatsApp salvas com sucesso!');
    } catch {
      toast.error('Erro ao salvar dados do salão');
    } finally {
      setSaving(false);
    }
  };

  const handleCoverUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    try {
      setUploadingCover(true);
      const formData = new FormData();
      formData.append('image', file);

      const res = await settingsAPI.uploadCover(formData);
      if (res.url) {
        setSalonData(prev => ({ ...prev, heroImage: res.url }));
        toast.success('Imagem de capa enviada com sucesso! Não esqueça de salvar as configurações.');
      }
    } catch (error) {
      console.error(error);
      toast.error('Erro ao enviar imagem de capa.');
    } finally {
      setUploadingCover(false);
    }
  };

  const handleCepBlur = async () => {
    const cep = salonData.cep?.replace(/\D/g, '');
    if (cep?.length === 8) {
      try {
        const res = await fetch(`https://viacep.com.br/ws/${cep}/json/`);
        const data = await res.json();
        if (!data.erro) {
          setSalonData(prev => ({
            ...prev,
            address: `${data.logradouro},  - ${data.bairro}`,
            cityState: `${data.localidade} - ${data.uf}`
          }));
          toast.success('Endereço preenchido pelo CEP!');
        } else {
          toast.error('CEP não encontrado.');
        }
      } catch (err) {
        console.error(err);
        toast.error('Erro ao buscar o CEP.');
      }
    }
  };

  // Save Working Hours (Tab 2)
  const handleWorkingHourChange = (dayKey, field, value) => {
    setWorkingHours(prev => {
      const currentDay = prev[dayKey];
      if (!currentDay) {
        return {
          ...prev,
          [dayKey]: { open: '09:00', close: '18:00', [field]: value }
        };
      }
      return {
        ...prev,
        [dayKey]: { ...currentDay, [field]: value }
      };
    });
  };

  const handleToggleDay = (dayKey) => {
    setWorkingHours(prev => {
      const currentDay = prev[dayKey];
      if (currentDay) {
        return { ...prev, [dayKey]: null };
      } else {
        return { ...prev, [dayKey]: { open: '09:00', close: '19:00' } };
      }
    });
  };

  const handleSaveWorkingHours = async (e) => {
    e.preventDefault();
    try {
      setSaving(true);
      await settingsAPI.update({
        working_hours: workingHours,
        slot_interval: parseInt(slotInterval)
      });

      const formattedHoursText = generateWorkingHoursText(workingHours);
      if (formattedHoursText) {
        await saveSalonSettings({ workingHoursText: formattedHoursText });
        setSalonData(prev => ({ ...prev, workingHoursText: formattedHoursText }));
      }

      toast.success('Configurações de horários e texto de funcionamento salvos com sucesso!');
      await loadSettingsAndBlockedDates();
    } catch (err) {
      console.error(err);
      toast.error('Erro ao salvar horários de funcionamento');
    } finally {
      setSaving(false);
    }
  };

  // Blocked Dates (Tab 3)
  const handleAddBlockedDate = async (e) => {
    e.preventDefault();
    if (!blockDate) {
      toast.error('Selecione uma data');
      return;
    }

    try {
      setLoading(true);
      await settingsAPI.createBlockedDate({
        date: blockDate,
        reason: blockReason,
        professionalId: blockProId ? parseInt(blockProId) : null
      });
      toast.success('Data bloqueada com sucesso!');
      setBlockDate('');
      setBlockReason('');
      setBlockProId('');
      await loadSettingsAndBlockedDates();
    } catch (err) {
      console.error(err);
      toast.error('Erro ao bloquear data');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteBlockedDate = async (id) => {
    if (!window.confirm('Deseja realmente liberar esta data?')) return;
    try {
      setLoading(true);
      await settingsAPI.deleteBlockedDate(id);
      toast.success('Data liberada com sucesso!');
      await loadSettingsAndBlockedDates();
    } catch (err) {
      console.error(err);
      toast.error('Erro ao liberar data');
    } finally {
      setLoading(false);
    }
  };

  // Security (Tab 4)
  const handleUpdateCredentials = async (e) => {
    e.preventDefault();
    if (!currentPassword) {
      toast.error('A senha atual é obrigatória.');
      return;
    }
    if (newPassword && newPassword !== confirmPassword) {
      toast.error('A nova senha e a confirmação não coincidem.');
      return;
    }
    
    try {
      setSaving(true);
      await authAPI.updateCredentials({
        currentPassword,
        newEmail: newEmail || undefined,
        newPassword: newPassword || undefined
      });
      toast.success('Credenciais atualizadas com sucesso! Faça login novamente.');
      // Clear session and redirect to login
      localStorage.removeItem('studio_beauty_token');
      localStorage.removeItem('studio_beauty_admin');
      navigate('/login');
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.error || 'Erro ao atualizar credenciais.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6 font-sans text-[#4A323D]">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-[#4A323D]">Configurações do Sistema</h1>
        <p className="text-xs text-gray-500">
          Gerencie a identidade do salão, número de WhatsApp, grade de horários e datas bloqueadas.
        </p>
      </div>

      {/* Navigation Tabs */}
      <div className="flex items-center gap-2 border-b border-gray-200 pb-2">
        <button
          onClick={() => setActiveTab('salon')}
          className={`px-4 py-2.5 rounded-xl text-xs font-bold transition flex items-center gap-2 ${
            activeTab === 'salon'
              ? 'bg-[#D47FA6] text-white shadow-sm'
              : 'bg-white text-gray-600 hover:bg-gray-100'
          }`}
        >
          <FaStore />
          <span>Salão & WhatsApp</span>
        </button>

        <button
          onClick={() => setActiveTab('hours')}
          className={`px-4 py-2.5 rounded-xl text-xs font-bold transition flex items-center gap-2 ${
            activeTab === 'hours'
              ? 'bg-[#D47FA6] text-white shadow-sm'
              : 'bg-white text-gray-600 hover:bg-gray-100'
          }`}
        >
          <FaClock />
          <span>Horários & Intervalos</span>
        </button>

        <button
          onClick={() => setActiveTab('blocked')}
          className={`px-4 py-2.5 rounded-xl text-xs font-bold transition flex items-center gap-2 ${
            activeTab === 'blocked'
              ? 'bg-[#D47FA6] text-white shadow-sm'
              : 'bg-white text-gray-600 hover:bg-gray-100'
          }`}
        >
          <FaCalendarMinus />
          <span>Datas Bloqueadas</span>
        </button>

        <button
          onClick={() => setActiveTab('security')}
          className={`px-4 py-2.5 rounded-xl text-xs font-bold transition flex items-center gap-2 ${
            activeTab === 'security'
              ? 'bg-[#D47FA6] text-white shadow-sm'
              : 'bg-white text-gray-600 hover:bg-gray-100'
          }`}
        >
          <FaLock />
          <span>Acesso</span>
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center items-center h-64">
          <FaClock className="animate-spin text-4xl text-[#D47FA6]" />
        </div>
      ) : (
        <>
          {/* Tab 1: Salão & WhatsApp */}
          {activeTab === 'salon' && (
        <form onSubmit={handleSaveSalonIdentity} className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200 space-y-5 max-w-3xl">
          <div className="border-b border-gray-100 pb-3">
            <h2 className="text-base font-bold text-[#4A323D]">Identidade e WhatsApp de Atendimento</h2>
            <p className="text-xs text-gray-500">
              Estas informações são refletidas no rodapé, cabeçalho e botão de WhatsApp do site público.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-[#4A323D] mb-1">Nome do Salão</label>
              <input
                type="text"
                required
                disabled
                value={salonData.name}
                onChange={(e) => setSalonData({ ...salonData, name: e.target.value })}
                className="w-full px-3.5 py-2 text-sm rounded-xl border border-gray-300 focus:outline-none focus:border-[#D47FA6] disabled:bg-gray-100 disabled:text-gray-500 disabled:cursor-not-allowed"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-[#4A323D] mb-1">Slogan / Subtítulo</label>
              <input
                type="text"
                required
                value={salonData.slogan}
                onChange={(e) => setSalonData({ ...salonData, slogan: e.target.value })}
                className="w-full px-3.5 py-2 text-sm rounded-xl border border-gray-300 focus:outline-none focus:border-[#D47FA6]"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-[#4A323D] mb-1 flex items-center gap-1.5">
                <FaWhatsapp className="text-[#25D366]" /> Número de WhatsApp (c/ DDD)
              </label>
              <input
                type="text"
                required
                placeholder="5511999998888"
                value={salonData.whatsapp}
                onChange={(e) => setSalonData({ ...salonData, whatsapp: e.target.value })}
                className="w-full px-3.5 py-2 text-sm rounded-xl border border-gray-300 focus:outline-none focus:border-[#D47FA6]"
              />
              <span className="text-[11px] text-gray-400">Ex: 5511999998888 (com 55 + DDD + número)</span>
            </div>

            <div>
              <label className="block text-xs font-bold text-[#4A323D] mb-1">E-mail de Contato</label>
              <input
                type="email"
                required
                disabled
                value={salonData.email}
                onChange={(e) => setSalonData({ ...salonData, email: e.target.value })}
                className="w-full px-3.5 py-2 text-sm rounded-xl border border-gray-300 focus:outline-none focus:border-[#D47FA6] disabled:bg-gray-100 disabled:text-gray-500 disabled:cursor-not-allowed"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-bold text-[#4A323D] mb-1">CEP</label>
              <input
                type="text"
                placeholder="Ex: 01310-200"
                value={salonData.cep || ''}
                onChange={(e) => setSalonData({ ...salonData, cep: e.target.value })}
                onBlur={handleCepBlur}
                className="w-full px-3.5 py-2 text-sm rounded-xl border border-gray-300 focus:outline-none focus:border-[#D47FA6]"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-bold text-[#4A323D] mb-1">Cidade - Estado</label>
              <input
                type="text"
                required
                value={salonData.cityState}
                onChange={(e) => setSalonData({ ...salonData, cityState: e.target.value })}
                className="w-full px-3.5 py-2 text-sm rounded-xl border border-gray-300 focus:outline-none focus:border-[#D47FA6]"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-[#4A323D] mb-1">Endereço</label>
            <input
              type="text"
              required
              value={salonData.address}
              onChange={(e) => setSalonData({ ...salonData, address: e.target.value })}
              className="w-full px-3.5 py-2 text-sm rounded-xl border border-gray-300 focus:outline-none focus:border-[#D47FA6]"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-[#4A323D] mb-2 flex items-center gap-1.5">
              <FaImage className="text-[#D47FA6]" /> Imagem de Capa (Visível em Celular, Tablet e PC)
            </label>
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
              {salonData.heroImage && (
                <div className="shrink-0">
                  <img
                    src={salonData.heroImage}
                    alt="Capa Atual"
                    className="w-24 h-24 sm:w-32 sm:h-32 object-cover rounded-xl border border-gray-300 shadow-sm"
                  />
                </div>
              )}
              <div className="flex-1 space-y-3 w-full">
                <div>
                  <label className="block text-[11px] text-gray-500 mb-1">
                    Fazer upload de nova imagem:
                  </label>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleCoverUpload}
                    disabled={uploadingCover}
                    className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-xs file:font-semibold file:bg-[#FDF2F7] file:text-[#D47FA6] hover:file:bg-[#F5D8E3] transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                  />
                  {uploadingCover && <p className="text-xs text-[#D47FA6] mt-1">Enviando...</p>}
                </div>
                
                <div>
                  <label className="block text-[11px] text-gray-500 mb-1">
                    Ou URL da Imagem (Avançado):
                  </label>
                  <input
                    type="text"
                    required
                    value={salonData.heroImage || ''}
                    onChange={(e) => setSalonData({ ...salonData, heroImage: e.target.value })}
                    className="w-full px-3.5 py-2 text-sm rounded-xl border border-gray-300 focus:outline-none focus:border-[#D47FA6]"
                    placeholder="https://..."
                  />
                </div>
              </div>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-[#4A323D] mb-1">
              Resumo de Horários no Rodapé
            </label>
            <input
              type="text"
              required
              disabled
              value={salonData.workingHoursText}
              onChange={(e) => setSalonData({ ...salonData, workingHoursText: e.target.value })}
              className="w-full px-3.5 py-2 text-sm rounded-xl border border-gray-300 focus:outline-none focus:border-[#D47FA6] disabled:bg-gray-100 disabled:text-gray-500 disabled:cursor-not-allowed"
            />
          </div>

          <div className="pt-4 border-t border-gray-100 flex justify-end">
            <button
              type="submit"
              className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-gradient-to-r from-[#D47FA6] to-[#E8A5C8] text-white font-semibold text-sm shadow hover:shadow-md transition"
            >
              <FaSave />
              <span>Salvar Configurações do Salão</span>
            </button>
          </div>
        </form>
      )}

      {/* Tab 2: Horários de Funcionamento */}
      {activeTab === 'hours' && (
        <form onSubmit={handleSaveWorkingHours} className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200 space-y-6 max-w-3xl">
          <div className="border-b border-gray-100 pb-3">
            <h2 className="text-base font-bold text-[#4A323D]">Grade Semanal de Funcionamento</h2>
            <p className="text-xs text-gray-500">
              Defina os dias de atendimento e horário inicial/final para agendamentos na plataforma.
            </p>
          </div>

          <div className="space-y-3">
            {weekdays.map(({ key, label }) => {
              const dayConfig = workingHours[key];
              const isClosed = !dayConfig;

              return (
                <div key={key} className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 rounded-xl bg-gray-50/70 border border-gray-200/60">
                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={() => handleToggleDay(key)}
                      className={`w-10 h-6 rounded-full p-0.5 transition-colors duration-200 focus:outline-none ${
                        isClosed ? 'bg-gray-300' : 'bg-[#D47FA6]'
                      }`}
                    >
                      <div className={`w-5 h-5 rounded-full bg-white transition-transform duration-200 transform ${
                        isClosed ? 'translate-x-0' : 'translate-x-4'
                      }`} />
                    </button>
                    <span className="font-semibold text-sm text-[#4A323D] w-32">{label}</span>
                  </div>

                  {!isClosed ? (
                    <div className="flex items-center gap-2 text-xs">
                      <input
                        type="time"
                        required
                        value={dayConfig.open}
                        onChange={(e) => handleWorkingHourChange(key, 'open', e.target.value)}
                        className="px-2.5 py-1.5 rounded-lg border border-gray-300 text-xs bg-white"
                      />
                      <span className="text-gray-400">até</span>
                      <input
                        type="time"
                        required
                        value={dayConfig.close}
                        onChange={(e) => handleWorkingHourChange(key, 'close', e.target.value)}
                        className="px-2.5 py-1.5 rounded-lg border border-gray-300 text-xs bg-white"
                      />
                    </div>
                  ) : (
                    <span className="text-xs text-red-500 font-bold flex items-center gap-1">
                      <FaPowerOff /> Fechado (Folga)
                    </span>
                  )}
                </div>
              );
            })}
          </div>

          <div className="border-t border-gray-100 pt-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <label className="text-xs font-bold text-[#4A323D]">Intervalo entre horários (min):</label>
              <select
                value={slotInterval}
                onChange={(e) => setSlotInterval(e.target.value)}
                className="px-3 py-1.5 rounded-lg border border-gray-300 text-xs bg-white font-medium"
              >
                <option value={15}>15 minutos</option>
                <option value={30}>30 minutos</option>
                <option value={45}>45 minutos</option>
                <option value={60}>60 minutos</option>
              </select>
            </div>

            <button
              type="submit"
              disabled={saving}
              className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-gradient-to-r from-[#D47FA6] to-[#E8A5C8] text-white font-semibold text-sm shadow hover:shadow-md transition"
            >
              <FaSave />
              <span>{saving ? 'Salvando...' : 'Salvar Grade de Horários'}</span>
            </button>
          </div>
        </form>
      )}

      {/* Tab 3: Datas Bloqueadas */}
      {activeTab === 'blocked' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 max-w-5xl">
          {/* Add form */}
          <form onSubmit={handleAddBlockedDate} className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200 space-y-4 h-fit">
            <h3 className="text-base font-bold text-[#4A323D] border-b border-gray-100 pb-3 flex items-center gap-2">
              <FaPlusCircle className="text-[#D47FA6]" /> Bloquear Nova Data
            </h3>

            <div>
              <label className="block text-xs font-bold text-[#4A323D] mb-1">Data *</label>
              <input
                type="date"
                required
                value={blockDate}
                onChange={(e) => setBlockDate(e.target.value)}
                className="w-full px-3.5 py-2 text-sm rounded-xl border border-gray-300 focus:outline-none focus:border-[#D47FA6]"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-[#4A323D] mb-1">Motivo (Feriado, Evento, etc.)</label>
              <input
                type="text"
                placeholder="Ex: Feriado Nacional / Manutenção"
                value={blockReason}
                onChange={(e) => setBlockReason(e.target.value)}
                className="w-full px-3.5 py-2 text-sm rounded-xl border border-gray-300 focus:outline-none focus:border-[#D47FA6]"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-[#4A323D] mb-1">Profissional Específico (Opcional)</label>
              <select
                value={blockProId}
                onChange={(e) => setBlockProId(e.target.value)}
                className="w-full px-3.5 py-2 text-sm rounded-xl border border-gray-300 bg-white"
              >
                <option value="">Todo o salão (Geral)</option>
                {professionals.map((pro) => (
                  <option key={pro.id} value={pro.id}>{pro.name}</option>
                ))}
              </select>
            </div>

            <button
              type="submit"
              className="w-full py-2.5 rounded-xl bg-gradient-to-r from-[#D47FA6] to-[#E8A5C8] text-white font-semibold text-sm shadow hover:shadow-md transition"
            >
              Adicionar Bloqueio
            </button>
          </form>

          {/* List blocked dates */}
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200 space-y-4">
            <h3 className="text-base font-bold text-[#4A323D] border-b border-gray-100 pb-3 flex items-center justify-between">
              <span>Datas Bloqueadas Cadastradas</span>
              <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-gray-100 text-[#4A323D]">
                {blockedDates.length}
              </span>
            </h3>

            {blockedDates.length === 0 ? (
              <p className="text-xs text-gray-400 text-center py-6">Nenhuma data bloqueada cadastrada.</p>
            ) : (
              <div className="space-y-2.5 max-h-96 overflow-y-auto pr-1">
                {blockedDates.map((block) => (
                  <div key={block.id} className="p-3.5 rounded-xl border border-gray-200 flex items-center justify-between text-xs">
                    <div>
                      <span className="font-bold text-sm text-[#4A323D] block">
                        {block.blocked_date.split('-').reverse().join('/')}
                      </span>
                      <span className="text-gray-500">{block.reason || 'Bloqueio administrativo'}</span>
                      <span className="block text-[11px] text-[#D47FA6] font-medium mt-0.5">
                        {block.professional_name ? `Especialista: ${block.professional_name}` : 'Salão Inteiro'}
                      </span>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleDeleteBlockedDate(block.id)}
                      className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition"
                      title="Liberar data"
                    >
                      <FaTrash />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Tab 4: Segurança / Acesso */}
      {activeTab === 'security' && (
        <form onSubmit={handleUpdateCredentials} className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200 space-y-6 max-w-2xl">
          <div className="border-b border-gray-100 pb-3">
            <h2 className="text-base font-bold text-[#4A323D]">Configurações de Acesso</h2>
            <p className="text-xs text-gray-500">
              Altere o seu e-mail de acesso ou senha do painel administrativo.
            </p>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-[#4A323D] mb-1">Senha Atual *</label>
              <input
                type="password"
                required
                placeholder="Obrigatório para realizar alterações"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                className="w-full px-3.5 py-2 text-sm rounded-xl border border-gray-300 focus:outline-none focus:border-[#D47FA6]"
              />
            </div>

            <div className="pt-4 border-t border-gray-100">
              <label className="block text-xs font-bold text-[#4A323D] mb-1">Novo E-mail</label>
              <input
                type="email"
                placeholder="Deixe em branco para não alterar"
                value={newEmail}
                onChange={(e) => setNewEmail(e.target.value)}
                className="w-full px-3.5 py-2 text-sm rounded-xl border border-gray-300 focus:outline-none focus:border-[#D47FA6]"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-[#4A323D] mb-1">Nova Senha</label>
              <input
                type="password"
                placeholder="Deixe em branco para não alterar"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="w-full px-3.5 py-2 text-sm rounded-xl border border-gray-300 focus:outline-none focus:border-[#D47FA6]"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-[#4A323D] mb-1">Confirmar Nova Senha</label>
              <input
                type="password"
                placeholder="Repita a nova senha"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full px-3.5 py-2 text-sm rounded-xl border border-gray-300 focus:outline-none focus:border-[#D47FA6]"
              />
            </div>
          </div>

          <div className="pt-4 border-t border-gray-100 flex justify-end">
            <button
              type="submit"
              disabled={saving}
              className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-gradient-to-r from-[#D47FA6] to-[#E8A5C8] text-white font-semibold text-sm shadow hover:shadow-md transition"
            >
              <FaSave />
              <span>{saving ? 'Salvando...' : 'Salvar e Fazer Login Novamente'}</span>
            </button>
          </div>
        </form>
      )}
        </>
      )}
    </div>
  );
}
