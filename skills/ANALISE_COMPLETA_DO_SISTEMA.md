# Relatório Técnico de Análise Completa - Sistema de Agendamento Multi-Tenant

**Data da Análise:** 25 de Outubro de 2026  
**Projeto:** Site Agendamento / Studio Beauty SaaS Multi-Tenant  
**Ambiente:** Node.js + Express (Backend) | React 19 + Vite + TailwindCSS 4 (Frontend) | Supabase PostgreSQL + Storage (Banco de Dados e Mídia)  

---

## 1. Visão Geral da Arquitetura

O sistema é uma plataforma **SaaS Multi-Tenant** desenvolvida para salões de beleza, barbearias, clínicas de estética e prestadores de serviços de autocuidado. A aplicação permite que múltiplas empresas atuem de forma totalmente isolada sob links personalizados (`/:companySlug`), ao mesmo tempo em que disponibiliza um painel central de **Super Admin** para gerenciamento de clientes SaaS.

```
                      ┌────────────────────────────────────────┐
                      │              SUPER ADMIN               │
                      │  - Provisionamento de Empresas         │
                      │  - Ativação / Bloqueio de Assinaturas  │
                      └──────────────────┬─────────────────────┘
                                         │
        ┌────────────────────────────────┴────────────────────────────────┐
        │                                                                 │
        ▼                                                                 ▼
┌─────────────────────────────────┐                     ┌─────────────────────────────────┐
│     TENANT 1: studio-beauty     │                     │     TENANT 2: barbearia-vip     │
├─────────────────────────────────┤                     ├─────────────────────────────────┤
│ • Landing Page personalizada    │                     │ • Landing Page personalizada    │
│ • Wizard de Agendamento         │                     │ • Wizard de Agendamento         │
│ • Portal do Cliente             │                     │ • Portal do Cliente             │
│ • Painel Admin da Loja          │                     │ • Painel Admin da Loja          │
└────────────────┬────────────────┘                     └────────────────┬────────────────┘
                 │                                                       │
                 └───────────────────────────────┬───────────────────────┘
                                                 │
                                                 ▼
                               ┌───────────────────────────────────┐
                               │       BACKEND API (EXPRESS)       │
                               │  - Middleware de Tenant           │
                               │  - Motor de Disponibilidade       │
                               │  - Auth JWT + Recuperação Senha   │
                               │  - Supabase Storage + Multer      │
                               └─────────────────┬─────────────────┘
                                                 │
                                                 ▼
                               ┌───────────────────────────────────┐
                               │        SUPABASE POSTGRESQL        │
                               │  - Relacionamentos ON DELETE      │
                               │    CASCADE isolados por tenantId  │
                               │  - Configurações JSONB            │
                               └───────────────────────────────────┘
```

---

## 2. Tecnologias Utilizadas

### 2.1. Backend (`/server`)
- **Runtime:** Node.js
- **Framework Web:** Express.js (`^4.18.2`)
- **Banco de Dados & Storage:** `@supabase/supabase-js` (`^2.110.8`) conectando a PostgreSQL em nuvem
- **Criptografia & Sessão:** `bcryptjs` (`^2.4.3`) com salting de 10 rounds e `jsonwebtoken` (`^9.0.2`) com expiração de 24h
- **Manipulação de Arquivos & Uploads:** `multer` (`^2.2.0`) com `memoryStorage`
- **Envio de E-mails Transacionais:** `nodemailer` (`^9.0.5`) integrado a SMTP
- **Identificadores Únicos:** `uuid` v4 para geração de tokens de cancelamento de agendamentos

### 2.2. Frontend (`/client`)
- **Framework:** React 19 (`^19.2.6`)
- **Bundler:** Vite (`^8.0.12`)
- **Roteamento:** React Router DOM v7 (`^7.16.0`)
- **Estilização:** TailwindCSS v4 (`^4.3.0`) com `@tailwindcss/vite`
- **Animações:** Framer Motion (`^12.40.0`)
- **Notificações:** React Hot Toast (`^2.6.0`)
- **Ícones:** React Icons (`^5.6.0`)
- **Cliente HTTP:** Axios (`^1.17.0`) com interceptores de injeção automática de `Authorization: Bearer <token>` e `X-Tenant-Id: <uuid>`

---

## 3. Modelo de Dados e Estrutura Relacional

O banco de dados PostgreSQL no Supabase é composto por tabelas relacionais primárias, todas vinculadas a uma empresa (`company_id`):

| Tabela | Chave Primária | Relações Chave | Função Principal |
| :--- | :--- | :--- | :--- |
| `companies` | `id` (UUID) | Raiz do Multi-Tenant | Armazena dados da empresa, slug único na URL e flag `is_active` |
| `admin_users` | `id` (BIGINT) | `company_id` -> `companies(id)` | Administradores com acesso ao painel do tenant |
| `clients` | `id` (BIGINT) | `company_id` -> `companies(id)` | Clientes cadastrados, com `UNIQUE(email, company_id)` |
| `professionals`| `id` (BIGINT) | `company_id` -> `companies(id)` | Profissionais do salão, especialidades (JSONB), status ativo |
| `services` | `id` (BIGINT) | `company_id` -> `companies(id)` | Serviços prestados, preço, categoria e duração em minutos |
| `bookings` | `id` (BIGINT) | `client_id`, `professional_id`, `service_id`, `company_id` | Agendamentos confirmados/cancelados com intervalo de horários |
| `settings` | `id` (BIGINT) | `company_id` -> `companies(id)` | Horários de funcionamento (JSONB), intervalo de slot e dados do salão |
| `blocked_dates`| `id` (BIGINT) | `company_id`, `professional_id` | Bloqueios de calendário gerais ou específicos por profissional |
| `testimonials` | `id` (BIGINT) | `client_id`, `booking_id`, `company_id` | Depoimentos e notas de 1 a 5 estrelas com workflow de moderação |
| `gallery_images`| `id` (BIGINT) | `company_id` (TEXT/UUID) | Imagens do portfólio salvas no Supabase Storage |

### Integridade Referencial
Com a migração `05_company_management.sql`, todas as tabelas filhas utilizam `ON DELETE CASCADE` apontando para `companies(id)`. Ao excluir uma empresa no Super Admin, todos os registros relacionados (usuários, clientes, serviços, profissionais, horários e depoimentos) são removidos atomicamente, evitando dados órfãos.

---

## 4. Análise dos Principais Fluxos do Sistema

### 4.1. Mecanismo de Multi-Tenancy e Resolução de Contexto
- **Identificação do Tenant:** O frontend extrai o `companySlug` a partir da rota `/:companySlug/...` via `TenantLayout.jsx`.
- **Validação de Empresa Ativa:** Faz uma requisição `GET /api/companies/:slug`. Se a empresa estiver bloqueada (`is_active === false`), o sistema renderiza automaticamente o componente `BlockedCompany.jsx`.
- **Injeção de Cabeçalhos:** O Axios armazena o `company.id` na memória e nos interceptors adiciona o header `X-Tenant-Id`.
- **Segurança no Backend:** O middleware `setTenantId` garante que qualquer requisição pública contenha o `X-Tenant-Id` ou use o `req.admin.company_id` caso a requisição venha autenticada com token JWT.

### 4.2. Algoritmo de Cálculo de Disponibilidade (`/api/availability`)
O motor de disponibilidade é um dos componentes mais críticos do sistema:
1. **Bloqueio de Passado:** Compara com o horário oficial de Brasília (`America/Sao_Paulo`). Datas anteriores à atual são rejeitadas de imediato.
2. **Dia da Semana:** Identifica o dia (0 = Domingo ... 6 = Sábado) e lê os horários de abertura e fechamento definidos em `settings.working_hours`.
3. **Bloqueios Específicos:** Consulta a tabela `blocked_dates` para checar se a data foi travada para o profissional ou para todo o salão.
4. **Geração Dinâmica de Slots:** O intervalo entre horários é calculado dinamicamente com base na duração do serviço escolhido (`service.duration_minutes`).
5. **Detecção de Conflitos (Collision Detection):** Busca agendamentos existentes que não estejam cancelados e aplica a regra de sobreposição temporal:
   slotStart < booking.end E slotEnd > booking.start
6. **Buffer para o Dia Atual:** Se a data selecionada for a data corrente, aplica um buffer de 30 minutos em relação ao horário atual para evitar agendamentos em cima da hora.

### 4.3. Pipeline de Agendamento (`/api/bookings`)
1. **Validação:** Checa integridade de e-mail, nomes e campos obrigatórios.
2. **Anti-Duplicação em Dupla Camada:** Realiza uma checagem de concorrência antes de salvar para evitar que dois clientes reservem o mesmo slot simultaneamente.
3. **Upsert Inteligente de Clientes:** Procura o cliente pelo e-mail dentro do tenant. Se existir, atualiza nome e telefone; caso contrário, insere um novo cliente.
4. **Token de Cancelamento UUID:** Gera um `cancel_token` (UUID v4) seguro que permite ao cliente cancelar ou reagendar sem necessidade de login com senha.

### 4.4. Painel de Controle e Monitoramento do Lojista
- **Dashboard com KPIs:** Apresenta faturamento do mês, contagem de agendamentos, clientes recorrentes e ranking dos serviços mais rentáveis.
- **Agenda Multivisualização:** Alternância entre Dia, Semana e Mês, com navegação fluida e polling automático a cada 15 segundos para manter a tela sempre sincronizada com novos agendamentos.
- **Monitor de Vagas em Tempo Real:** Visualização gráfica da ocupação e horários livres por profissional.

### 4.5. Armazenamento de Arquivos e Portfólio
- Imagens da galeria e fotos de capa são enviadas via formulário `multipart/form-data`.
- O Multer processa os bytes em memória (`memoryStorage`), ideal para ambientes serverless (Vercel).
- Os arquivos são enviados para o bucket `gallery` do Supabase sob o caminho `${tenantId}/${fileName}`.
- Ao excluir uma imagem no painel, a rota deleta tanto o arquivo físico no Storage quanto o registro no PostgreSQL.

---

## 5. Pontos Fortes e Destaques de Qualidade

1. **Separação Rigorosa de Responsabilidades:** O backend é desacoplado, limpo e estruturado por módulos de rotas lógicas.
2. **Multi-Tenancy Robusto:** Isolamento de tenants eficiente com chave estrangeira e validação de middleware tanto por token JWT quanto por header HTTP.
3. **Experiência do Usuário (UX) Premium:** Interface moderna com Framer Motion, microinterações, Toaster elegante, design responsivo e botão flutuante de WhatsApp.
4. **Resiliência e Polling Inteligente:** Atualização em segundo plano das agendas e do monitor de vagas sem travar a interface.
5. **Recuperação de Senha Segura:** Tokens JWT assinados com tempo de expiração curto (15 minutos) e envio de link direto com slug da empresa.

---

## 6. Oportunidades de Evolução e Recomendações

1. **Row Level Security (RLS) no Supabase:** As políticas estão comentadas no script SQL porque o backend Node.js utiliza a chave privilegiada (`service_role`). Recomenda-se habilitar RLS caso endpoints diretos do cliente ao Supabase sejam criados no futuro.
2. **Notificações Automáticas via WhatsApp:** O botão de WhatsApp atual abre um link de conversa. Pode-se integrar futuramente uma API como Z-API ou Evolution API para disparo automático de confirmação e lembretes 2 horas antes do agendamento.
3. **Gateways de Pagamento & Cobrança Recorrente:** ✅ **Implementado via Mercado Pago SDK v2** (Cartão de Crédito recorrente, Cartão de Débito, PIX instantâneo e auto-provisionamento de assinaturas via Onboarding Multi-Etapas).
