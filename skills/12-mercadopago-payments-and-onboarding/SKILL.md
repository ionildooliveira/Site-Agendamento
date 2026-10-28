---
name: mercadopago-payments-and-onboarding
description: Integração oficial Mercado Pago SDK v2, cobrança automática e assinaturas recorrentes (Cartão de Crédito, Débito e PIX), fluxo de Onboarding Multi-Etapas com auto-provisionamento de novos salões e credenciais administrativas.
---

# Mercado Pago Payments & Onboarding Skill

Esta skill documenta a arquitetura de monetização, fluxo de onboarding self-service de novos lojistas, auto-provisionamento de salões e processamento de pagamentos com **Mercado Pago**.

---

## 1. Visão Geral do Fluxo de Onboarding

O onboarding automatizado substitui o provisionamento manual feito pelo Super Admin, permitindo que novos donos de salão criem sua conta, registrem sua empresa e ativem sua assinatura diretamente:

```
  [ Visitante acessa /cadastro ou /assinar ]
                        │
                        ▼
  ┌────────────────────────────────────────────────────────┐
  │ Etapa 1: Dados do Titular (Admin da Loja)              │
  │ • Nome, E-mail, Celular/WhatsApp, CPF/CNPJ, Senha      │
  └────────────────────────┬───────────────────────────────┘
                           │ Validação no Frontend
                           ▼
  ┌────────────────────────────────────────────────────────┐
  │ Etapa 2: Dados do Segmento e da Empresa (Tenant)       │
  │ • Seleção de Nicho: Barbearia, Salão, Esmalteria, Spa  │
  │ • Sincronização dinâmica de Slogan e Layout            │
  │ • Nome da Empresa e Link Exclusivo (Slug) verificado   │
  │ • CEP com auto-busca via ViaCEP e WhatsApp Comercial   │
  └────────────────────────┬───────────────────────────────┘
                           │ Validação de Slug Único
                           ▼
  ┌────────────────────────────────────────────────────────┐
  │ Etapa 3: Meio de Pagamento Mercado Pago                │
  │ ├─ Cartão de Crédito: Recorrência Mensal Automática     │
  │ ├─ Cartão de Débito: À Vista                           │
  │ └─ PIX: QR Code + Copia e Cola + Polling de Detecção   │
  │    (Com simulador instantâneo para ambiente local)     │
  └────────────────────────┬───────────────────────────────┘
                           │ Pagamento Aprovado
                           ▼
  ┌────────────────────────────────────────────────────────┐
  │ Etapa 4: Auto-Provisionamento Atômico & Ativação       │
  │ 1. Criação da Empresa na tabela `companies`            │
  │ 2. Criação do Administrador (`admin_users`) com bcrypt │
  │ 3. Inicialização de `settings` e `salon_data`          │
  │ 4. Registro da assinatura na tabela `subscriptions`    │
  │ 5. Geração de JWT Token e Auto-Login no Painel         │
  └────────────────────────────────────────────────────────┘
```

---

## 2. Configurações de Ambiente (Backend `.env`)

```env
# Mercado Pago Credenciais Oficiais
MP_ACCESS_TOKEN=TEST-0000000000000000-000000-00000000000000000000000000000000-000000000
MP_PUBLIC_KEY=TEST-00000000-0000-0000-0000-000000000000
MP_WEBHOOK_SECRET=sua_chave_webhook_mp_secreta

# Configuração do Plano SaaS
MP_PLAN_PRICE=49.90
MP_PLAN_NAME=Plano Profissional
MP_AUTO_RECURRING=true
```

> **Fallback Local Seguro:** Caso `MP_ACCESS_TOKEN` não seja informado ou contenha tokens de exemplo, o backend opera em modo sandbox de desenvolvimento, gerando QR Code simulado e permitindo aprovação manual imediata pelo botão de testes.

---

## 3. Endpoints da API de Pagamentos (`/api/payments`)

| Método | Rota | Autenticação | Descrição |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/payments/config` | Pública | Retorna chave pública do MP, valor da mensalidade e status da integração. |
| `POST` | `/api/payments/process` | Pública | Processa pagamento (Cartão ou PIX) e executa o provisionamento do salão. |
| `GET` | `/api/payments/status/:paymentId` | Pública | Consulta status atual do pagamento junto ao Mercado Pago (usado no polling de PIX). |
| `POST` | `/api/payments/simulate-approval`| Dev/Local | Simula aprovação imediata de pagamento para testes sem cartão real. |
| `POST` | `/api/payments/webhook` | Mercado Pago | Webhook de notificações IPN do Mercado Pago. |
| `GET`  | `/api/payments/subscription` | JWT Admin | Consulta dados detalhados da assinatura atual do salão. |
| `POST` | `/api/payments/subscription/cancel` | JWT Admin | Cancela a renovação automática da assinatura do salão. |
| `POST` | `/api/payments/subscription/reactivate` | JWT Admin | Reativa a renovação automática da assinatura do salão. |

### Payload de Provisionamento (`POST /api/payments/process`)

```json
{
  "userData": {
    "name": "Maria Eduarda Silva",
    "email": "maria@salaobella.com",
    "phone": "(11) 98888-7777",
    "cpf": "123.456.789-00",
    "password": "senhaSegura123"
  },
  "salonData": {
    "name": "Studio Bella",
    "slug": "studio-bella",
    "slogan": "Elegância & Cuidado",
    "cep": "01310-100",
    "address": "Av. Paulista, 1000",
    "cityState": "São Paulo - SP",
    "whatsapp": "(11) 98888-7777"
  },
  "paymentData": {
    "method": "credit_card", // ou "pix", "debit_card"
    "autoRecurring": true,
    "card": {
      "cardNumber": "4532000000000000",
      "cardholderName": "MARIA E SILVA",
      "cardExpiration": "12/28",
      "securityCode": "123"
    }
  }
}
```

---

## 4. Integração Frontend (Wizard em 4 Passos)

- **Componente Principal:** [`client/src/pages/OnboardingWizard.jsx`](file:///c:/Users/ios87/OneDrive/Área%20de%20Trabalho/Site-agendamento/client/src/pages/OnboardingWizard.jsx)
- **Rotas Mapeadas:**
  - `/cadastro` (Cadastro principal)
  - `/assinar` (Assinatura de plano)
  - `/onboarding` (Fluxo guiado)
- **Recursos Inclusos:**
  - Máscaras dinâmicas de CPF/CNPJ, Telefone/WhatsApp, Número de Cartão e Validade.
  - Verificação assíncrona de slug com debounce de 400ms via `companiesAPI.checkSlug(slug)`.
  - Auto-preenchimento de endereço e cidade pelo CEP via ViaCEP.
  - QR Code nativo base64 ou fallback via API de imagem para pagamento PIX.
  - Cópia com um clique do código Copia e Cola via `navigator.clipboard`.
  - Auto-login imediato pós-aprovação salvando o token no `localStorage` por tenant: `studio_beauty_token_<slug>`.

---

## 5. Tabela de Assinaturas no Banco de Dados

Consulte o arquivo de migração [`07_create_subscriptions.sql`](file:///c:/Users/ios87/OneDrive/Área%20de%20Trabalho/Site-agendamento/07_create_subscriptions.sql) para a estrutura completa de persistência do ciclo de faturamento e histórico de pagamentos.

---

## 6. Fluxo de Cancelamento e Reativação pelo Dono do Salão (Self-Service)

O dono do salão tem total transparência e autonomia para gerenciar sua assinatura diretamente pelo painel administrativo, sem necessidade de contato com suporte:

### Como Funciona o Cancelamento:
1. **Acesso:** O administrador acessa `/:slug/admin/configuracoes` e clica na aba **"Assinatura & Plano"**.
2. **Solicitação:** Clica no botão **"Cancelar Assinatura"**, abrindo um modal de confirmação transparente.
3. **Regra de Transparência:**
   - Nenhuma cobrança futura será realizada no cartão de crédito.
   - O salão **permanece ativo e funcionando** com agendamentos online até o final do período vigente já pago (`current_period_end`).
   - O status é alterado para `cancelled` e `auto_recurring = false`.
4. **Reativação Fácil:** A qualquer momento antes ou após o término do período, o lojista pode clicar em **"Reativar Renovação Automática"** com um clique para manter o serviço contínuo.
