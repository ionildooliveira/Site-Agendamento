---
name: pricing-plans-and-grandfathering
description: Estratégia de precificação dinâmica, proteção de preço adquirido (grandfathering) para lojistas antigos, reajuste por tenant e parametrização do plano padrão SaaS.
---

# Pricing Plans, Grandfathering & Price Adjustment Strategy Skill

Esta skill documenta a arquitetura de precificação da plataforma SaaS, o princípio de **Grandfathering** (proteção do preço contratado para clientes antigos) e as regras operacionais para reajuste de mensalidades.

---

## 1. O que Acontece com os Salões Antigos ao Mudar o Preço?

Se você tem 15 salões pagando **R$ 49,90** e decide alterar o valor do plano para **R$ 79,90** (ou R$ 99,00):

### Regra Fundamental: **Os salões antigos permanecem pagando R$ 49,90!**

Isso ocorre por três motivos técnicos e regulatórios:
1. **Gravação Individual no Banco de Dados:**  
   O valor de R$ 49,90 fica gravado permanentemente no registro de cada salão (`settings.salon_data.subscription.amount` e na tabela `subscriptions.amount`). Ele não é uma consulta estática global, mas sim uma propriedade individual de cada empresa.
2. **Autorização Bancária Recorrente (Mercado Pago):**  
   Quando o cliente assinou pelo cartão de crédito, o Mercado Pago gerou uma autorização de débito recorrente (`preapproval`) atrelada especificamente ao valor acordado de R$ 49,90. Instituições bancárias não alteram débitos automáticos sem nova autorização do titular do cartão.
3. **Prática Padrão de Mercado (Grandfathering):**  
   Manter o preço dos pioneiros gera alta fidelização e evita cancelamentos em massa (*churn*).

---

## 2. Como Alterar o Preço para Novos Salões

Para atualizar o preço de entrada da plataforma para novos clientes:

1. Acesse o arquivo de configuração [`server/.env`](file:///c:/Users/ios87/OneDrive/Área%20de%20Trabalho/Site-agendamento/server/.env):
   ```env
   # Atualize para o novo valor desejado:
   PLAN_MONTHLY_PRICE=79.90
   MP_PLAN_PRICE=79.90
   ```
2. **Impacto Imediato:**
   - O site inicial (`/`), a página `/cadastro` e o assistente de contratação `/assinar` passarão a exibir **R$ 79,90**.
   - Qualquer novo salão cadastrado a partir deste instante contratará e pagará a nova mensalidade.
   - Os 15 salões antigos **não são afetados** e continuam sendo cobrados em R$ 49,90.

---

## 3. Como Reajustar ou Dar Desconto para um Salão Específico

Caso você queira conceder um desconto promocional (ex: R$ 39,90) ou atualizar o plano de um salão específico antigo:

1. Acesse o painel Super Admin em **[http://localhost:5173/super-admin/dashboard](http://localhost:5173/super-admin/dashboard)**.
2. Na tabela de empresas, localize o salão desejado e clique no botão **Editar** (`FaEdit`).
3. Altere o campo **"Valor da Mensalidade (R$)"** para a nova quantia.
4. Clique em **"Salvar Alterações"**.
   - O backend atualiza automaticamente o valor da assinatura em `settings.salon_data.subscription.amount` e na tabela `subscriptions`.
   - Na próxima fatura ou na tela do salão, o novo valor será aplicado.

---

## 4. Boas Práticas para Reajuste de Clientes Antigos

Caso decida reajustar a mensalidade de salões que já utilizam a plataforma:
- **Aviso Prévio de 30 Dias:** Envie uma notificação amigável por e-mail ou WhatsApp informando que, devido a novas funcionalidades e melhorias na infraestrutura, a mensalidade será reajustada no próximo ciclo.
- **Transparência:** O dono do salão verá o novo valor na sua aba de "Assinatura & Plano" e poderá optar por continuar com o serviço ou cancelar antes da cobrança.
