import React from 'react';
import { FaStoreSlash } from 'react-icons/fa';

function BlockedCompany() {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-3xl shadow-xl overflow-hidden p-8 text-center">
        <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6 text-gray-400">
          <FaStoreSlash className="text-4xl" />
        </div>
        <h1 className="text-2xl font-bold text-gray-800 mb-4">
          Página Temporariamente Indisponível
        </h1>
        <p className="text-gray-600 mb-8">
          Esta página de agendamento não está acessível no momento. Por favor, entre em contato diretamente com o salão para mais informações.
        </p>
      </div>
    </div>
  );
}

export default BlockedCompany;
