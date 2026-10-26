---
name: availability-calculation
description: Algoritmo de cálculo dinâmico de disponibilidade e geração de slots de tempo por profissional, considerando duração do serviço, expediente e bloqueios.
---

# Availability Calculation Skill

Esta skill descreve o algoritmo responsável por determinar quais horários estão livres para reserva em qualquer data selecionada.

## 1. Endpoint de Disponibilidade

- **Rota:** `GET /api/availability`
- **Parâmetros:**
  - `professionalId` (obrigatório): ID do profissional escolhido.
  - `date` (obrigatório): Data no formato `YYYY-MM-DD`.
  - `serviceId` (obrigatório): ID do serviço (utilizado para saber a duração).
- **Header:** `X-Tenant-Id` (injetado automaticamente pelo frontend).

---

## 2. Passo a Passo do Algoritmo

### Passo 1: Validação de Passado (Fuso Horário de Brasília)
Converte o timestamp atual para `America/Sao_Paulo` e compara com o início da data solicitada (`T00:00:00`). Se a data solicitada for no passado, retorna imediatamente `slots: []`.

### Passo 2: Verificação do Dia da Semana
Extrai o índice do dia da semana (0 = Domingo, 1 = Segunda ... 6 = Sábado) e lê o objeto JSONB `settings.working_hours`. Se o dia estiver nulo ou sem `open` / `close`, retorna que o salão está fechado.

### Passo 3: Verificação de Datas Bloqueadas
Consulta a tabela `blocked_dates` buscando registros onde:
`date == data_solicitada` AND (`professional_id IS NULL` OR `professional_id == proId`).
Se houver bloqueio (ex: feriado ou folga médica), retorna `slots: []` com a justificativa cadastrada.

### Passo 4: Geração Contínua de Horários (Grid Base)
O intervalo entre os slots é calculado dinamicamente com base na duração do serviço (`service.duration_minutes`):

```javascript
const openMin = toMin(dayHours.open);   // ex: 09:00 -> 540 min
const closeMin = toMin(dayHours.close); // ex: 19:00 -> 1140 min
const duration = service.duration_minutes; // ex: 45 min

const allSlots = [];
for (let t = openMin; t + duration <= closeMin; t += duration) {
  const h = Math.floor(t / 60).toString().padStart(2, '0');
  const m = (t % 60).toString().padStart(2, '0');
  allSlots.push(`${h}:${m}`);
}
```

### Passo 5: Detecção de Ocupação e Buffer para o Dia de Hoje
Consulta os agendamentos confirmados do profissional na data:
- Se a data for **hoje**, horários com menos de 30 minutos de antecedência (`nowMin + 30`) são marcados como `available: false`.
- Para cada slot, se houver sobreposição com qualquer intervalo ocupado:
  `slotStart < range.end && (slotStart + duration) > range.start`
  o slot é marcado como `available: false`.

---

## 3. Estrutura de Retorno

```json
{
  "slots": [
    { "time": "09:00", "available": true },
    { "time": "09:45", "available": false },
    { "time": "10:30", "available": true },
    { "time": "11:15", "available": true }
  ],
  "date": "2026-10-28",
  "workingHours": { "open": "09:00", "close": "19:00" },
  "serviceDuration": 45,
  "totalSlots": 12,
  "availableCount": 11
}
```
