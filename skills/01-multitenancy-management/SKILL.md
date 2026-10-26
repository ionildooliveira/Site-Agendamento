---
name: multitenancy-management
description: Gestão da arquitetura multi-empresa (SaaS), roteamento por slug, isolamento de dados no backend via header X-Tenant-Id e controle de bloqueio de tenants.
---

# Multi-Tenancy Management Skill

Esta skill define a arquitetura, regras de isolamento e fluxos operacionais para o modelo multi-tenant (SaaS) da plataforma de agendamento.

## 1. Visão Geral da Arquitetura

O sistema adota uma abordagem **Multi-Tenant com Banco de Dados Compartilhado e Isolamento por Linha (Row-Level Multi-Tenancy)**.
Todas as empresas compartilham as mesmas tabelas no PostgreSQL/Supabase, e cada registro possui obrigatoriamente a coluna `company_id` (chave estrangeira para `companies.id`).

```
   URL do Navegador: https://meusalao.com.br/studio-beauty/agendar
                                │
                                ▼
                       TenantLayout (React)
           1. Extrai ":companySlug" da rota ("studio-beauty")
           2. Consulta GET /api/companies/studio-beauty
           3. Guarda company.id em memória
           4. Injeta "X-Tenant-Id: <UUID>" em todas as requisições Axios
                                │
                                ▼
                      Express API (Backend)
           1. Middleware setTenantId lê o header "X-Tenant-Id"
           2. Anexa req.tenantId = headerValue
           3. Para rotas autenticadas, usa req.admin.company_id do JWT
                                │
                                ▼
                     Supabase Query (PostgreSQL)
           supabase.from('bookings').select(...).eq('company_id', req.tenantId)
```

---

## 2. Componentes e Implementação

### 2.1. Frontend: Resolução de Tenant e Interceptor Axios

O componente `TenantLayout.jsx` envolve todas as rotas públicas e administrativas do lojista:

```jsx
// client/src/components/TenantLayout.jsx
export default function TenantLayout() {
  const { companySlug } = useParams();
  const [loading, setLoading] = useState(true);
  const [isBlocked, setIsBlocked] = useState(false);

  useEffect(() => {
    async function fetchTenant() {
      try {
        setLoading(true);
        const company = await companiesAPI.getBySlug(companySlug);
        setTenantId(company.id, companySlug);
        await syncSalonSettings();
        document.title = company.name;
      } catch (error) {
        if (error.response?.status === 403 || error.response?.data?.blocked) {
          setIsBlocked(true);
        } else {
          toast.error('Empresa não encontrada.');
          navigate('/');
        }
      } finally {
        setLoading(false);
      }
    }
    fetchTenant();
  }, [companySlug]);

  if (isBlocked) return <BlockedCompany />;
  return <Outlet />;
}
```

O cliente Axios em `client/src/services/api.js` intercepta todas as requisições para anexar o identificador do tenant:

```javascript
api.interceptors.request.use((config) => {
  let tenantId = currentTenantId;
  if (!tenantId) {
    const adminData = localStorage.getItem('studio_beauty_admin');
    if (adminData) {
      try {
        const admin = JSON.parse(adminData);
        if (admin.company_id) tenantId = admin.company_id;
      } catch (e) {}
    }
  }

  if (tenantId) {
    config.headers['X-Tenant-Id'] = tenantId;
  }
  return config;
});
```

### 2.2. Backend: Middleware de Isolamento (`setTenantId`)

Localizado em `server/middleware/tenant.js`:

```javascript
function setTenantId(req, res, next) {
  // 1. Se autenticado como administrador, prioriza a empresa vinculada ao token JWT
  if (req.admin && req.admin.company_id) {
    req.tenantId = req.admin.company_id;
    return next();
  }

  // 2. Para rotas públicas (clientes), exige o header X-Tenant-Id
  const tenantIdHeader = req.headers['x-tenant-id'];
  if (tenantIdHeader) {
    req.tenantId = tenantIdHeader;
    return next();
  }

  return res.status(400).json({
    error: 'Identificação da empresa (Tenant ID) não fornecida na requisição.'
  });
}
```

---

## 3. Regras de Negócio e Segurança

1. **Nunca Confiar em IDs no Corpo da Requisição:** O `company_id` nunca deve ser lido do `req.body` em rotas do lojista. Deve vir sempre de `req.tenantId` (definido pelo middleware).
2. **Validação de Empresa Bloqueada:**
   - No login do administrador: se `admin.companies.is_active === false`, o login é rejeitado com status `403` ("Acesso negado. Esta empresa está temporariamente bloqueada.").
   - No acesso público pelo slug: se `company.is_active === false`, retorna status `403` e renderiza a tela amigável de bloqueio (`BlockedCompany.jsx`).
3. **Isolamento de Credenciais:** Dois lojistas podem ter administradores ou clientes com o mesmo e-mail em empresas distintas, pois a unicidade de e-mail de clientes é restrita por `UNIQUE(email, company_id)`.

---

## 4. Checklist para Criação de Novos Endpoints Multi-Tenant

- [ ] Incluir o middleware `setTenantId` na rota do Express.
- [ ] Filtrar todas as consultas SQL com `.eq('company_id', req.tenantId)`.
- [ ] No caso de inserção (`insert`), injetar explicitamente `company_id: req.tenantId`.
- [ ] No caso de atualização (`update`) ou exclusão (`delete`), garantir as cláusulas `.eq('id', id).eq('company_id', req.tenantId)`.
