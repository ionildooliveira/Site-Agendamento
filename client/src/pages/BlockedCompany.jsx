import { FaStoreSlash, FaClock, FaCreditCard, FaLock } from 'react-icons/fa';
import { Link } from 'react-router-dom';

export default function BlockedCompany({ isExpired, companySlug }) {
  return (
    <div className="min-h-screen bg-[#FFF8FA] flex items-center justify-center p-4 font-sans text-[#4A323D]">
      <div className="max-w-md w-full bg-white rounded-3xl shadow-xl overflow-hidden p-8 text-center border border-[#F5D8E3]">
        <div className={`w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6 text-3xl shadow-sm ${
          isExpired ? 'bg-amber-100 text-amber-600' : 'bg-gray-100 text-gray-400'
        }`}>
          {isExpired ? <FaClock /> : <FaStoreSlash />}
        </div>

        <h1 className="text-2xl font-bold font-heading mb-3">
          {isExpired ? 'Assinatura do Salão Vencida' : 'Página Temporariamente Indisponível'}
        </h1>

        <p className="text-xs text-gray-500 mb-6 leading-relaxed">
          {isExpired
            ? 'O período de assinatura deste espaço encerrou. Os agendamentos online foram temporariamente pausados até a renovação do plano.'
            : 'Esta página de agendamento não está acessível no momento. Por favor, entre em contato diretamente com o salão para mais informações.'}
        </p>

        {isExpired && (
          <div className="space-y-3 pt-2">
            <Link
              to={`/${companySlug}/admin`}
              className="inline-flex items-center justify-center gap-2 w-full py-3.5 px-6 rounded-full bg-gradient-to-r from-[#D47FA6] to-[#E8A5C8] text-white font-bold text-sm shadow-md hover:shadow-lg transition hover:scale-105"
            >
              <FaCreditCard />
              <span>Sou o Dono do Salão (Renovar Agora)</span>
            </Link>
            <p className="text-[11px] text-gray-400">
              Faça login no painel para reativar seu salão instantaneamente via Mercado Pago.
            </p>
          </div>
        )}

        {!isExpired && (
          <div className="pt-2">
            <Link
              to="/"
              className="inline-flex items-center justify-center gap-2 px-6 py-2.5 rounded-full border border-gray-300 text-gray-600 text-xs font-semibold hover:bg-gray-50 transition"
            >
              Ir para a Página Inicial
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
