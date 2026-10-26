---
name: production-deployment-and-ci-cd
description: Procedimento operacional padrão de deploy para produção, integração contínua (GitHub / Vercel / Render), checklist de migração no Supabase e homologação de chaves do Mercado Pago.
---

# Production Deployment & CI/CD Skill

Esta skill define o protocolo seguro para publicação da plataforma de agendamento em ambiente de produção (Live/Cloud).

---

## 1. Pré-Requisitos e Protocolo de Segurança

> [!CRITICAL]
> **Consentimento Obrigatório:** Nunca faça push para o repositório remoto ou execute deploys em produção sem o comando e consentimento explícito do usuário.

### Ambientes:
- **Repositório Git:** `https://github.com/ionildooliveira/Site-Agendamento.git` (Branch: `main`)
- **Frontend Live:** Vercel (`https://site-agendamento-7vhl.vercel.app` ou domínio customizado)
- **Banco de Dados:** Supabase PostgreSQL Cloud (`https://zxewxdtpazjutwfxpams.supabase.co`)
- **Backend API:** Servidor Node.js em nuvem (Render, Railway, VPS ou Vercel Serverless)

---

## 2. Passo a Passo do Deploy

```
  [ Consentimento do Usuário ]
               │
               ▼
  ┌────────────────────────────────────────────────────────┐
  │ 1. Execução do Script SQL no Supabase                  │
  │ • Abrir Supabase Dashboard -> SQL Editor               │
  │ • Executar: `07_create_subscriptions.sql`              │
  └────────────────────────────┬───────────────────────────┘
                               │
                               ▼
  ┌────────────────────────────────────────────────────────┐
  │ 2. Build de Validação Local                            │
  │ • `cd client && npm run build` (Garantir 0 erros)      │
  └────────────────────────────┬───────────────────────────┘
                               │
                               ▼
  ┌────────────────────────────────────────────────────────┐
  │ 3. Git Commit e Push para `main`                       │
  │ • `git add .`                                          │
  │ • `git commit -m "feat: mercadopago, onboarding..."`   │
  │ • `git push origin main`                               │
  └────────────────────────────┬───────────────────────────┘
                               │
                               ▼
  ┌────────────────────────────────────────────────────────┐
  │ 4. Build e Deploy Automático (CI/CD)                   │
  │ • A Vercel/Render detecta o push na branch main        │
  │ • Instala dependências (`mercadopago`, etc.)           │
  │ • Compila o frontend e reinicia a API Node.js          │
  └────────────────────────────┬───────────────────────────┘
                               │
                               ▼
  ┌────────────────────────────────────────────────────────┐
  │ 5. Configuração das Chaves de Produção                 │
  │ • Inserir `MERCADO_PAGO_ACCESS_TOKEN` (APP_USR-...)    │
  │ • Inserir `MERCADO_PAGO_PUBLIC_KEY` no painel cloud    │
  └────────────────────────────────────────────────────────┘
```

---

## 3. Variáveis de Ambiente Necessárias em Produção

| Variável | Descrição | Exemplo em Produção |
| :--- | :--- | :--- |
| `SUPABASE_URL` | Endpoint da instância Supabase | `https://zxewxdtpazjutwfxpams.supabase.co` |
| `SUPABASE_KEY` | Chave de serviço (`service_role`) | `eyJhbGciOi...` |
| `JWT_SECRET` | Chave de assinatura de tokens | `studio_beauty_prod_jwt_secret_...` |
| `SUPER_ADMIN_PASSWORD` | Senha mestra de acesso | Definida pelo administrador |
| `MERCADO_PAGO_ACCESS_TOKEN` | Token privado oficial de produção | `APP_USR-0000000000000000-...` |
| `MERCADO_PAGO_PUBLIC_KEY` | Chave pública do Mercado Pago | `APP_USR-00000000-0000-...` |
| `CLIENT_URL` | URL pública oficial da aplicação | `https://seusalao.com.br` |

---

## 4. Checklist Pós-Deploy (Smoke Testing)

1. Acessar a página inicial pública `/` e verificar se a Landing Page carrega.
2. Acessar `/cadastro` e validar o avanço das 3 etapas.
3. Testar a geração de cobrança PIX oficial.
4. Acessar `/super-admin/dashboard` com a senha mestra e confirmar a listagem dos salões.
5. Fazer login em um salão existente (`/:slug/admin`) e verificar a aba "Assinatura & Plano".
