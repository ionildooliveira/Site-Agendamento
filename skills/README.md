# Catálogo de Skills - Plataforma de Agendamento SaaS Multi-Tenant

Este repositório contém a documentação técnica formal e as **Skills Especializadas** da plataforma de agendamento online (**Studio Beauty** / Sistema SaaS Multi-Tenant).

Cada pasta neste diretório representa uma **Skill no padrão Antigravity / AI Agent**, contendo instruções operacionais (`SKILL.md`), especificações de banco de dados, assinaturas de endpoints de API, algoritmos de negócio e melhores práticas.

---

## 📁 Índice de Skills

| # | Skill | Descrição Principal |
| :- | :--- | :--- |
| **01** | [`multitenancy-management`](./01-multitenancy-management/SKILL.md) | Gestão multi-tenant, resolução por slug, injeção de `X-Tenant-Id` e isolamento. |
| **02** | [`super-admin-operations`](./02-super-admin-operations/SKILL.md) | Painel Super Admin, provisionamento de empresas, controle de licenças e cascata. |
| **03** | [`booking-engine-and-scheduling`](./03-booking-engine-and-scheduling/SKILL.md) | Motor de agendamentos, anti-duplicação, UUID cancel token e upsert de clientes. |
| **04** | [`availability-calculation`](./04-availability-calculation/SKILL.md) | Cálculo de slots livres/ocupados, timezone SP, bloqueios e buffer de tempo. |
| **05** | [`tenant-admin-portal`](./05-tenant-admin-portal/SKILL.md) | Painel do salão: KPIs de faturamento, agenda (dia/semana/mês) e monitor de vagas. |
| **06** | [`services-and-professionals`](./06-services-and-professionals/SKILL.md) | Catálogo de serviços, preços, durações e profissionais com especialidades. |
| **07** | [`client-self-service-portal`](./07-client-self-service-portal/SKILL.md) | Landing page, Wizard de agendamento em passos e portal Meus Agendamentos. |
| **08** | [`reviews-and-testimonials`](./08-reviews-and-testimonials/SKILL.md) | Avaliações de 1 a 5 estrelas, moderação pelo lojista e cálculo de média. |
| **09** | [`gallery-and-media-storage`](./09-gallery-and-media-storage/SKILL.md) | Upload em memória (Multer) para Supabase Storage isolado por tenant e limpeza. |
| **10** | [`security-auth-and-notifications`](./10-security-auth-and-notifications/SKILL.md) | Autenticação JWT, bcrypt, troca de senha e recuperação por e-mail (Nodemailer). |
| **11** | [`database-and-migrations`](./11-database-and-migrations/SKILL.md) | DDL completo do PostgreSQL/Supabase, migrações 01 a 07 e regras de CASCADE. |
| **12** | [`mercadopago-payments-and-onboarding`](./12-mercadopago-payments-and-onboarding/SKILL.md) | Mercado Pago SDK v2, Cartão Recorrente, Débito, PIX e Onboarding Multi-Etapas. |
| **13** | [`frontend-stability-and-dom-resilience`](./13-frontend-stability-and-dom-resilience/SKILL.md) | Prevenção de tela branca no React 19, proteção contra tradutores e ErrorBoundary. |
| **14** | [`subscription-lifecycle-and-access-control`](./14-subscription-lifecycle-and-access-control/SKILL.md) | Ciclo de vida de assinaturas, bloqueio automático por vencimento e monitoramento. |
| **15** | [`production-deployment-and-ci-cd`](./15-production-deployment-and-ci-cd/SKILL.md) | Procedimento de deploy em produção, pipeline CI/CD GitHub/Vercel e checklist. |
| **16** | [`pricing-plans-and-grandfathering`](./16-pricing-plans-and-grandfathering/SKILL.md) | Estratégia de precificação, proteção de preço antigo (Grandfathering) e reajustes. |

---

## 🛠️ Como Utilizar estas Skills

### 1. No Google Antigravity IDE
Você pode copiar as pastas desejadas para:
- **Global:** `C:\Users\<seu-usuario>\.gemini\config\skills\<nome-da-skill>`
- **Por Projeto:** `<raiz-do-projeto>\.agents\skills\<nome-da-skill>`

### 2. Para Equipes de Desenvolvimento
Use estas documentações como a **Fonte da Verdade (Source of Truth)** do sistema, facilitando onboarding de novos desenvolvedores, refatorações, criação de testes e integração com novas APIs.

---

## 📖 Leitura Complementar
Para conferir o raio-x detalhado de arquitetura, fluxo de dados e oportunidades de melhoria, leia:
👉 [ANALISE_COMPLETA_DO_SISTEMA.md](./ANALISE_COMPLETA_DO_SISTEMA.md)
