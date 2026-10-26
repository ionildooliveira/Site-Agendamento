const { MercadoPagoConfig, Payment, PreApproval, CardToken } = require('mercadopago');

function getMPClient() {
  const token = process.env.MERCADO_PAGO_ACCESS_TOKEN;
  if (!token || token.trim() === '' || token.includes('your_')) {
    return null;
  }
  return new MercadoPagoConfig({
    accessToken: token.trim(),
    options: { timeout: 10000 },
  });
}

function isMercadoPagoConfigured() {
  return getMPClient() !== null;
}

/**
 * Cria cobrança PIX via Mercado Pago ou gera dados simulados em ambiente local
 */
async function createPixPayment({ amount, description, payer, metadata = {} }) {
  const client = getMPClient();

  if (client) {
    try {
      const payment = new Payment(client);
      const cleanCpf = (payer.cpf || payer.identification?.number || '00000000000').replace(/\D/g, '');
      const idType = cleanCpf.length > 11 ? 'CNPJ' : 'CPF';

      const body = {
        transaction_amount: Number(amount),
        description: description || 'Assinatura Plataforma Studio Beauty',
        payment_method_id: 'pix',
        payer: {
          email: payer.email,
          first_name: payer.firstName || payer.name?.split(' ')[0] || 'Cliente',
          last_name: payer.lastName || payer.name?.split(' ').slice(1).join(' ') || 'Assinante',
          identification: {
            type: idType,
            number: cleanCpf,
          },
        },
        metadata: {
          ...metadata,
          auto_recurring: true,
        },
      };

      if (process.env.CLIENT_URL && !process.env.CLIENT_URL.includes('localhost')) {
        body.notification_url = `${process.env.CLIENT_URL}/api/payments/webhook`;
      }

      const response = await payment.create({ body });
      const txData = response.point_of_interaction?.transaction_data || {};

      return {
        id: response.id,
        status: response.status, // 'pending'
        status_detail: response.status_detail,
        qr_code: txData.qr_code,
        qr_code_base64: txData.qr_code_base64,
        ticket_url: txData.ticket_url,
        isSimulated: false,
      };
    } catch (error) {
      console.warn('⚠️ Erro ao chamar API do Mercado Pago (PIX), operando em modo fallback local:', error.message);
      // Fallback local se a chave for inválida ou ambiente de testes
    }
  }

  // Modo Local de Desenvolvimento / Simulação
  const testId = 'mp_pix_sim_' + Date.now();
  const simulatedPixCode = `00020126580014br.gov.bcb.pix0136test-${Date.now()}520400005303986540${Number(amount).toFixed(2)}5802BR5920Studio Beauty SaaS6009Sao Paulo62070503***6304ABCD`;

  return {
    id: testId,
    status: 'pending',
    status_detail: 'pending_waiting_transfer',
    qr_code: simulatedPixCode,
    qr_code_base64: null,
    ticket_url: `https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(simulatedPixCode)}`,
    isSimulated: true,
  };
}

/**
 * Cria cobrança de Cartão de Crédito ou Débito com suporte a Cobrança Automática
 */
async function createCardPayment({
  amount,
  description,
  token,
  card,
  paymentMethodId,
  installments = 1,
  payer,
  autoRecurring = true,
  isDebit = false,
  metadata = {},
}) {
  const client = getMPClient();

  if (client) {
    try {
      // Se não recebemos o token pré-gerado, mas temos os dados do cartão, geramos o CardToken oficial via SDK
      if (!token && card && card.cardNumber) {
        try {
          const cardTokenClient = new CardToken(client);
          const rawNum = String(card.cardNumber).replace(/\D/g, '');
          const [expMonth, expYearRaw] = String(card.cardExpiration || '12/28').split('/');
          const expYear = expYearRaw && expYearRaw.length === 2 ? `20${expYearRaw}` : (expYearRaw || '2028');
          const cleanCpf = (payer.cpf || payer.identification?.number || '00000000000').replace(/\D/g, '');

          const tokenRes = await cardTokenClient.create({
            body: {
              card_number: rawNum,
              expiration_month: Number(expMonth || 12),
              expiration_year: Number(expYear),
              security_code: String(card.securityCode || '123'),
              cardholder: {
                name: card.cardholderName || payer.name || 'CLIENTE TESTE',
                identification: {
                  type: cleanCpf.length > 11 ? 'CNPJ' : 'CPF',
                  number: cleanCpf.length >= 11 ? cleanCpf : '11111111111',
                },
              },
            },
          });

          if (tokenRes && tokenRes.id) {
            token = tokenRes.id;
          }

          // Detecta a bandeira do cartão se não informada
          if (!paymentMethodId || paymentMethodId === 'credit_card' || paymentMethodId === 'debit_card') {
            if (rawNum.startsWith('4')) paymentMethodId = 'visa';
            else if (rawNum.startsWith('5') || rawNum.startsWith('2')) paymentMethodId = 'master';
            else if (rawNum.startsWith('34') || rawNum.startsWith('37')) paymentMethodId = 'amex';
            else if (rawNum.startsWith('6')) paymentMethodId = 'elo';
            else paymentMethodId = 'visa';
          }
        } catch (tokenErr) {
          console.warn('⚠️ Erro ao gerar CardToken no Mercado Pago:', tokenErr.message);
        }
      }

      if (token) {
        const payment = new Payment(client);
        const cleanCpf = (payer.cpf || payer.identification?.number || '00000000000').replace(/\D/g, '');

        const body = {
          transaction_amount: Number(amount),
          token,
          description: description || `Assinatura Recorrente (${isDebit ? 'Débito' : 'Crédito'})`,
          installments: Number(installments) || 1,
          payment_method_id: paymentMethodId || 'visa',
          payer: {
            email: payer.email,
            identification: {
              type: cleanCpf.length > 11 ? 'CNPJ' : 'CPF',
              number: cleanCpf.length >= 11 ? cleanCpf : '11111111111',
            },
          },
          metadata: {
            ...metadata,
            auto_recurring: autoRecurring,
            is_debit: isDebit,
          },
        };

        const response = await payment.create({ body });
        return {
          id: response.id,
          status: response.status, // 'approved', 'in_process', 'rejected'
          status_detail: response.status_detail,
          isSimulated: false,
        };
      }
    } catch (error) {
      console.warn('⚠️ Erro ao chamar API do Mercado Pago (Cartão):', error.message);
    }
  }

  // Modo Local de Desenvolvimento / Simulação
  const testId = `mp_${isDebit ? 'debit' : 'card'}_sim_` + Date.now();
  return {
    id: testId,
    status: 'approved',
    status_detail: 'accredited',
    isSimulated: true,
  };
}

/**
 * Consulta status de um pagamento no Mercado Pago
 */
async function getPaymentStatus(paymentId) {
  const client = getMPClient();

  if (client && !String(paymentId).includes('sim_')) {
    try {
      const payment = new Payment(client);
      const res = await payment.get({ id: paymentId });
      return {
        id: res.id,
        status: res.status,
        status_detail: res.status_detail,
      };
    } catch (error) {
      console.warn('⚠️ Erro ao consultar pagamento no Mercado Pago:', error.message);
    }
  }

  return null;
}

module.exports = {
  isMercadoPagoConfigured,
  createPixPayment,
  createCardPayment,
  getPaymentStatus,
};
