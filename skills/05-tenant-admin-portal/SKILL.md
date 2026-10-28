---
name: tenant-admin-portal
description: Gestão operacional do salão/clínica: dashboard analítico de KPIs financeiros, agenda interativa (dia/semana/mês) e monitor de vagas em tempo real.
---

# Tenant Admin Portal Skill

Esta skill descreve os recursos do painel administrativo do lojista (`/:companySlug/admin/painel`).

## 1. Identidade Visual e Theming Dinâmico do Painel (`AdminLayout.jsx`)
O portal administrativo herda e aplica automaticamente a identidade visual do nicho da empresa (`barbearia`, `salao`, `esmalteria`, `estetica`):
- **Cabeçalho da Sidebar:** Exibe o ícone característico (💈, 💇‍♀️, 💅, 🌿) e badge temática do segmento.
- **Navegação Ativa:** Itens ativos do menu consomem as variáveis CSS `--theme-gradient` e `--theme-shadow`.
- **Botões de Ação e Abas:** Botões primários ("Novo Serviço", "Novo Profissional", "Salvar Configurações") e abas ativas ajustam-se dinamicamente às cores do segmento cadastrado.

---

## 2. Dashboard com KPIs e Inteligência de Negócio

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

## 3. Agenda Multivisualização (`AdminAgenda.jsx`)

Oferece controle total da programação da equipe com 3 modos de visualização:
1. **Dia:** Grade horária detalhada do dia selecionado com status, cliente, telefone e serviço.
2. **Semana:** Visão consolidada de segunda-feira a domingo.
3. **Mês:** Panorama geral com contagem e distribuição dos atendimentos ao longo do mês.

**Filtro por Profissional:** Dropdown reativo para isolar a agenda de um colaborador específico ou ver todos simultaneamente.
**Exclusão e Cancelamento Resiliente:** Ação de exclusão protegida por Modal de Confirmação In-App (substituindo o frágil window.confirm do navegador). O modal exibe os dados do cliente, serviço, profissional e horário, com feedback de loading e interceptação resiliente de headers de autenticação (compatível com todos os nichos: Barbearia, Salão, Esmalteria e Estética).

---

## 4. Monitor de Vagas em Tempo Real (`AvailabilityMonitor.jsx`)

Permite à recepção e aos gerentes visualizar rapidamente a taxa de ocupação da equipe:
- Lista todos os profissionais ativos.
- Exibe barras de progresso com a porcentagem de vagas ocupadas vs livres.
- Apresenta chips coloridos com cada bloco de 30 minutos indicando visualmente disponibilidade (`verde`) ou ocupação (`cinza/vermelho`).

---

## 5. Gestão de Identidade Visual e Expediente (`AdminSettings.jsx`)

Permite ao lojista configurar:
- **Aba Empresa & WhatsApp:** Nome fantasia (fixo), segmento/nicho (somente leitura - fixo conforme plano contratado), slogan, descrição, endereço, CEP, telefone WhatsApp e foto de capa (Hero).
- **Aba Horários:** Configuração individual de abertura/fechamento para cada dia da semana (Segunda a Domingo) ou marcar dias fechados.
- **Aba Bloqueios:** Adicionar folgas, férias ou feriados gerais ou específicos por profissional.
- **Aba Acesso:** Alteração de e-mail e senha de acesso com verificação obrigatória da senha atual.
- **Aba Assinatura & Plano:** Gerenciamento da recorrência e cancelamento self-service.
