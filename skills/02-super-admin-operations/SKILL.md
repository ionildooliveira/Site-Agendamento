---
name: super-admin-operations
description: Operações administrativas globais da plataforma SaaS, autenticação via senha mestra, provisionamento de empresas, controle de licenças e cascata de exclusão.
---

# Super Admin Operations Skill

Esta skill descreve o funcionamento do módulo de Super Administrador, responsável pelo gerenciamento de planos, provisionamento de novos lojistas e governança da plataforma.

## 1. Autenticação do Super Admin

Diferente dos lojistas (que usam JWT e tabela `admin_users`), o Super Admin utiliza uma chave de proteção baseada na variável de ambiente `SUPER_ADMIN_PASSWORD`:

- **Header HTTP:** `X-Super-Admin-Password: <senha>`
- **Middleware:** `authenticateSuperAdmin` em `server/routes/companies.js`

```javascript
const authenticateSuperAdmin = (req, res, next) => {
  const password = req.headers['x-super-admin-password'];
  if (!password || password !== process.env.SUPER_ADMIN_PASSWORD) {
    return res.status(401).json({ error: 'Acesso negado. Senha do Super Admin inválida.' });
  }
  next();
};
```

---

## 2. Fluxo de Provisionamento de Nova Empresa (`/api/companies/create`)

Ao cadastrar um novo cliente SaaS pelo painel (`/super-admin/dashboard`) ou pelo script CLI (`create_company.js`), o sistema executa três passos atômicos:

1. **Criação da Empresa:**
   - Insere na tabela `companies` com `name` e `slug` único (ex: "Studio Bella", slug: "studio-bella").
2. **Criação do Usuário Administrador Inicial:**
   - Gera hash bcrypt (10 rounds) da senha informada.
   - Insere na tabela `admin_users` vinculando ao `company.id`.
3. **Bootstrap das Configurações Padrão:**
   - Insere na tabela `settings` com expediente padrão (Seg-Sex: 09h às 19h, Sáb: 09h às 17h, Dom: Fechado).
   - Intervalo padrão de agendamento de 30 minutos.
   - Configurações de identidade visual inicial em `salon_data` (slogan, endereço, hero image).

### Exemplo via Terminal (Script CLI):
```bash
cd server
node create_company.js "Barbearia Vip" "barbearia-vip" "admin@barbeariavip.com" "SenhaForte123@"
```

---

## 3. Endpoints da API do Super Admin

| Método | Endpoint | Proteção | Descrição |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/companies/verify-super-admin` | Super Admin Password | Valida se a senha digitada no frontend é válida |
| `GET` | `/api/companies` | Super Admin Password | Lista todas as empresas com status e data de criação |
| `POST` | `/api/companies/create` | Super Admin Password | Provisiona nova empresa, administrador e settings |
| `PUT` | `/api/companies/:id` | Super Admin Password | Edita nome e slug de uma empresa existente |
| `PATCH` | `/api/companies/:id/status` | Super Admin Password | Alterna status de ativação (`is_active: true/false`) |
| `DELETE` | `/api/companies/:id` | Super Admin Password | Exclui permanentemente a empresa e dados em cascata |

---

## 4. Bloqueio e Exclusão com Cascata (CASCADE)

- **Bloqueio (`is_active = false`):**
  Desativa temporariamente o tenant sem apagar os dados históricos. Clientes finais recebem mensagem de indisponibilidade e o lojista não consegue logar.
- **Exclusão Definitiva (`DELETE`):**
  Graças às constraints de chave estrangeira com `ON DELETE CASCADE` (migração `05_company_management.sql`), ao deletar uma empresa da tabela `companies`, o banco de dados deleta automaticamente:
  - Usuários administradores (`admin_users`)
  - Clientes cadastrados (`clients`)
  - Profissionais (`professionals`)
  - Catálogo de serviços (`services`)
  - Histórico de agendamentos (`bookings`)
  - Configurações e horários (`settings`)
  - Datas bloqueadas (`blocked_dates`)
  - Depoimentos vinculados (`testimonials`)
