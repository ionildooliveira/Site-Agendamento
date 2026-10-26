---
name: booking-engine-and-scheduling
description: Motor central de agendamentos, pipeline de validação, prevenção contra horários duplicados, persistência com UUID cancel token e upsert de clientes.
---

# Booking Engine & Scheduling Skill

Esta skill detalha a mecânica central de criação, reagendamento, cancelamento e auditoria de reservas na plataforma.

## 1. Pipeline de Criação de Agendamento (`POST /api/bookings`)

O processo de agendamento segue uma sequência estrita de verificações de consistência e concorrência:

```
[Cliente envia agendamento]
         │
         ▼
[1. Validação de Campos & Regex de E-mail]
         │
         ▼
[2. Validação Temporal: Impede datas/horas passadas (Fuso Brasília)]
         │
         ▼
[3. Busca Serviço e Profissional no Tenant (ativos)]
         │
         ▼
[4. Cálculo do Horário Final: endTime = startTime + duration_minutes]
         │
         ▼
[5. Validação com Expediente do Dia (working_hours) e Datas Bloqueadas]
         │
         ▼
[6. Detecção Anti-Conflito Concorrente no Banco de Dados]
    (start_time < endTime) AND (end_time > startTime) AND (status != 'cancelled')
         │
         ▼
[7. Upsert de Cliente (busca por e-mail no tenant ou cria novo)]
         │
         ▼
[8. Inserção do Booking com UUID cancel_token]
         │
         ▼
[9. Retorno com dados formatados e mensagem de sucesso]
```

---

## 2. Detecção de Conflitos de Horário (Anti-Collision Algorithm)

Para garantir que nenhum profissional tenha dois agendamentos simultâneos ou sobrepostos, o backend executa uma consulta com operadores de intervalo temporal:

```javascript
const { data: conflicts } = await supabase
  .from('bookings')
  .select('id')
  .eq('professional_id', professionalId)
  .eq('booking_date', date)
  .eq('company_id', req.tenantId)
  .neq('status', 'cancelled')
  .lt('start_time', endTime)
  .gt('end_time', startTime);

if (conflicts && conflicts.length > 0) {
  return res.status(409).json({
    error: 'Horário indisponível. Por favor, selecione outro horário.',
    code: 'TIME_CONFLICT',
  });
}
```

---

## 3. Gestão de Clientes e Upsert Inteligente

Os clientes não precisam criar senha para agendar. O sistema realiza um upsert transparente:
1. Pesquisa cliente por e-mail case-insensitive no escopo da empresa (`company_id`).
2. Se já existe, atualiza nome e telefone mais recentes.
3. Se não existe, cria um novo registro na tabela `clients`.

---

## 4. Token de Cancelamento Seguro (`cancel_token`)

Cada agendamento recebe um `cancel_token` UUID v4 gerado no momento da criação:
- Permite que o cliente cancele ou reagende seu compromisso de forma segura através do link direto enviado ou consultando seu e-mail no portal `/meus-agendamentos`.
- O lojista também pode cancelar ou editar horários usando seu token JWT autenticado.

---

## 5. Estrutura do Objeto de Agendamento

```json
{
  "id": 142,
  "client_id": 85,
  "professional_id": 3,
  "service_id": 12,
  "booking_date": "2026-10-28",
  "start_time": "14:00",
  "end_time": "14:45",
  "status": "confirmed",
  "notes": "Prefiro corte desfiado",
  "cancel_token": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
  "client_name": "Mariana Silva",
  "client_phone": "(11) 98765-4321",
  "client_email": "mariana@exemplo.com",
  "professional_name": "Juliana Costa",
  "service_name": "Corte Feminino & Escova",
  "service_price": 120.00,
  "duration_minutes": 45
}
```
