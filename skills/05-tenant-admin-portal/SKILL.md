---
name: tenant-admin-portal
description: Gestão operacional do salão/clínica: dashboard analítico de KPIs financeiros, agenda interativa (dia/semana/mês) e monitor de vagas em tempo real.
---

# Tenant Admin Portal Skill

Esta skill descreve os recursos do painel administrativo do lojista (`/:companySlug/admin/painel`).

## 1. Dashboard com KPIs e Inteligência de Negócio

Localizado em `client/src/pages/admin/Dashboard.jsx` com backend em `server/routes/admin.js`:

- **Total Geral:** Contagem histórica de agendamentos concluídos ou confirmados.
- **Agendamentos de Hoje:** Quantidade de atendimentos previstos para o dia atual.
- **Atendimentos no Mês:** Filtrável por mês e ano.
- **Faturamento Estimado do Mês:** Soma dos preços dos serviços agendados no mês selecionado:
  `monthRevenue = sum(services.price)`
- **Clientes Recorrentes:** Contagem de clientes que possuem 2 ou mais agendamentos realizados.
- **Top 5 Serviços:** Ranking dos serviços com maior volume e receita gerada no mês.
- **Sincronização em Tempo Real:** Polling automático em segundo plano a cada 15 segundos.

---

## 2. Agenda Multivisualização (`AdminAgenda.jsx`)

Oferece controle total da programação da equipe com 3 modos de visualização:
1. **Dia:** Grade horária detalhada do dia selecionado com status, cliente, telefone e serviço.
2. **Semana:** Visão consolidada de segunda-feira a domingo.
3. **Mês:** Panorama geral com contagem e distribuição dos atendimentos ao longo do mês.

**Filtro por Profissional:** Dropdown reativo para isolar a agenda de um colaborador específico ou ver todos simultaneamente.

---

## 3. Monitor de Vagas em Tempo Real (`AvailabilityMonitor.jsx`)

Permite à recepção e aos gerentes visualizar rapidamente a taxa de ocupação da equipe:
- Lista todos os profissionais ativos.
- Exibe barras de progresso com a porcentagem de vagas ocupadas vs livres.
- Apresenta chips coloridos com cada bloco de 30 minutos indicando visualmente disponibilidade (`verde`) ou ocupação (`cinza/vermelho`).

---

## 4. Gestão de Identidade Visual e Expediente (`AdminSettings.jsx`)

Permite ao lojista configurar:
- **Aba Salão:** Nome fantasia, slogan, descrição, endereço, CEP, telefone WhatsApp e foto de capa (Hero).
- **Aba Horários:** Configuração individual de abertura/fechamento para cada dia da semana (Segunda a Domingo) ou marcar dias fechados.
- **Aba Bloqueios:** Adicionar folgas, férias ou feriados gerais ou específicos por profissional.
- **Aba Segurança:** Alteração de e-mail e senha de acesso com verificação obrigatória da senha atual.
