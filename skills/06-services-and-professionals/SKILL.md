---
name: services-and-professionals
description: Gerenciamento do catálogo de serviços (preços, durações, categorias) e da equipe de profissionais (especialidades, status ativo e soft deletes).
---

# Services and Professionals Skill

Esta skill descreve o gerenciamento do catálogo de produtos/serviços e da equipe de prestadores.

## 1. Catálogo de Serviços (`/api/services`)

### 1.1. Estrutura de Dados
- `name` (TEXT, obrigatório): Nome do serviço (ex: "Corte Degradê Navalhado").
- `description` (TEXT): Detalhes do procedimento.
- `price` (NUMERIC, obrigatório): Valor cobrado (ex: 75.00).
- `duration_minutes` (INTEGER, obrigatório): Duração em minutos (ex: 30, 45, 60). Este valor rege o motor de disponibilidade.
- `category` (TEXT): Categoria para agrupamento no catálogo (ex: "Cabelo", "Barba", "Tratamentos", "Unhas").
- `active` (BOOLEAN): Status do serviço no catálogo público.

### 1.2. Padrão Soft-Delete
Quando um serviço é excluído no painel administrativo, o backend executa um **soft delete**:
```javascript
await supabase
  .from('services')
  .update({ active: false })
  .eq('id', req.params.id)
  .eq('company_id', req.tenantId);
```
Isso garante que agendamentos antigos ou relatórios de faturamento não quebrem por falta de integridade referencial.

---

## 2. Equipe de Profissionais (`/api/professionals`)

### 2.1. Estrutura de Dados
- `name` (TEXT, obrigatório): Nome completo do profissional.
- `role` (TEXT, obrigatório): Cargo ou especialidade principal (ex: "Barbeiro Master", "Colorista").
- `bio` (TEXT): Descrição sobre a experiência e trajetória.
- `photo_url` (TEXT): Foto do profissional para exibição no Wizard.
- `specialties` (JSONB): Lista de tags com especializações (ex: `["Degradê", "Barboterapia", "Pigmentação"]`).
- `active` (BOOLEAN): Flag para controle de profissionais atuantes.

### 2.2. Soft-Delete e Desativação
Profissionais desligados são marcados como `active: false`. Suas agendas passadas continuam visíveis nos relatórios históricos do lojista, mas eles deixam de aparecer como opção no Wizard de novos agendamentos do cliente.
