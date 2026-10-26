---
name: subscription-lifecycle-and-access-control
description: Ciclo de vida completo de assinaturas, controle de acesso e bloqueio automático pós-cancelamento/expiração, fluxo de renovação self-service e monitoramento no painel Super Admin.
---

# Subscription Lifecycle & Access Control Skill

Esta skill documenta o ciclo de vida completo de assinaturas da plataforma SaaS, as regras de controle de acesso, bloqueio automático de inadimplentes e o mecanismo de renovação e governança.

---

## 1. Como Saber se o Mercado Pago está Realmente Funcionando

A integração com o Mercado Pago possui dois modos operacionais bem definidos:

### A. Modo Simulação / Sandbox Local (Sem Chaves Reais)
- Ocorre quando `MERCADO_PAGO_ACCESS_TOKEN` não está configurado no arquivo `.env`.
- Os IDs de pagamento gerados começam com o prefixo `mp_pix_sim_` ou `mp_card_sim_`.
- Permite testar o fluxo de ponta a ponta sem transações financeiras reais.

### B. Modo Oficial (Produção ou Teste Real do Mercado Pago)
1. **Credenciais Oficiais:**
   - Obtenha as credenciais no portal oficial [Mercado Pago Developers](https://www.mercadopago.com.br/developers):
     - `MERCADO_PAGO_ACCESS_TOKEN`: Inicia com `TEST-...` (modo sandbox de testes reais) ou `APP_USR-...` (produção).
     - `MERCADO_PAGO_PUBLIC_KEY`: Chave pública para o frontend.
   - Insira essas chaves no arquivo [`server/.env`](file:///c:/Users/ios87/OneDrive/Área%20de%20Trabalho/Site-agendamento/server/.env).
2. **Confirmação em Tempo Real:**
   - Cada transação gera um **Payment ID numérico oficial** retornado diretamente pela API do Mercado Pago (ex: `1238947291`).
   - Você pode abrir sua conta ou aplicativo do Mercado Pago e verificar a transação listada imediatamente na aba **"Atividades"**.
   - O webhook oficial (`/api/payments/webhook`) recebe notificações instantâneas do Mercado Pago quando qualquer PIX ou fatura de cartão for aprovada.

---

## 2. O Que Acontece Quando o Cliente Cancela a Assinatura?

Quando o dono do salão cancela sua assinatura no painel ([`client/src/pages/admin/Settings.jsx`](file:///c:/Users/ios87/OneDrive/Área%20de%20Trabalho/Site-agendamento/client/src/pages/admin/Settings.jsx)):

```
  [ Dono clica em "Cancelar Assinatura" ]
                   │
                   ▼
  1. A renovação automática no cartão é desativada (`auto_recurring: false`).
  2. O status é marcado como `cancelled`.
  3. A data `next_billing_date` define o fim do ciclo pago (Grace Period).
                   │
                   ▼
  ┌─────────────────────────────────────────────────────────────┐
  │ Durante o Período Pago Restante (Ex: faltam 15 dias)       │
  │ • O salão continua funcionando normalmente.                 │
  │ • Clientes conseguem agendar horários.                      │
  │ • No painel exibe aviso: "Cancelamento Agendado".           │
  └──────────────────────────────┬──────────────────────────────┘
                                 │
                   Data Limite Atingida (Vencimento)
                                 │
                                 ▼
  ┌─────────────────────────────────────────────────────────────┐
  │ Bloqueio Automático pelo Backend (`GET /:slug`)             │
  │ • O backend identifica que `Date.now() > next_billing_date`.│
  │ • Atualiza automaticamente `companies.is_active = false`.   │
  │ • A página pública passa a exibir tela de Bloqueio.        │
  │ • Clientes NÃO conseguem mais agendar horários.             │
  │ • No Super Admin o status muda para "🔴 Expirada".          │
  └─────────────────────────────────────────────────────────────┘
```

---

## 3. Como o Cliente Renova Quando o Tempo Acaba?

O lojista não perde seus dados cadastrais (clientes, histórico, catálogo e equipe continuam salvos no banco de dados):

1. **Acesso:**
   - Ao acessar seu link (`/:slug`), ele vê a tela [`BlockedCompany.jsx`](file:///c:/Users/ios87/OneDrive/Área%20de%20Trabalho/Site-agendamento/client/src/pages/BlockedCompany.jsx) com o botão **"Sou o Dono do Salão (Renovar Agora)"**.
   - Ao fazer login no painel administrativo (`/:slug/admin/configuracoes`), acessa a aba **"Assinatura & Plano"**.
2. **Reativação:**
   - Se ainda estiver no período de carência: clica em **"Reativar Renovação Automática"**.
   - Se o plano já tiver vencido: escolhe a forma de pagamento (PIX ou Cartão de Crédito) e efetua a renovação mensal.
3. **Desbloqueio Imediato:**
   - Assim que o pagamento é aprovado, `companies.is_active` retorna para `true`.
   - O novo ciclo de 30 dias é registrado em `next_billing_date`.
   - A página de agendamentos online volta a ficar disponível instantaneamente para os clientes.

---

## 4. Monitoramento pelo Super Admin

No painel mestre de Super Admin ([`client/src/pages/super-admin/SuperAdminDashboard.jsx`](file:///c:/Users/ios87/OneDrive/Área%20de%20Trabalho/Site-agendamento/client/src/pages/super-admin/SuperAdminDashboard.jsx)), o dono da plataforma tem uma visão consolidada de todas as empresas cadastradas:

| Status Visual | Significado | Ação Recomendada |
| :--- | :--- | :--- |
| `🟢 R$ 49,90 / mês` | Assinatura ativa com renovação automática ligada. | Nenhuma ação necessária. |
| `🟡 Cancelado (Ativo até DD/MM)` | O salão solicitou cancelamento, mas ainda está dentro do período já pago. | Oportunidade de retenção comercial. |
| `🔴 Expirada / Bloqueada` | O período pago encerrou e o acesso foi bloqueado automaticamente. | Aguardar renovação pelo lojista ou reativar manualmente. |
