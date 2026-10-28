---
name: client-self-service-portal
description: Experiência pública do cliente final, Landing Page dinâmica, Wizard de agendamento em passos com Framer Motion e portal de autoatendimento para remarcações e cancelamentos.
---

# Client Self-Service Portal Skill

Esta skill descreve as interfaces públicas dedicadas aos clientes finais do salão.

## 1. Landing Page Dinâmica (`LandingPage.jsx`)

A porta de entrada do tenant exibe a identidade personalizada da empresa:
- **Estilização Dinâmica por Nicho:** As cores primárias, secundárias, gradientes e badges adaptam-se automaticamente ao segmento da empresa (`barbearia`, `salao`, `esmalteria`, `estetica`), consumindo os tokens definidos na Skill 17.
- **Hero Section:** Imagem de fundo customizada configurada pelo lojista, slogan, badge de nicho e botões de chamada para ação ("Agendar Horário" e "Ver Serviços").
- **Média de Avaliações:** Exibição da nota calculada com base nos depoimentos aprovados.
- **Carrossel de Serviços em Destaque:** Exibição de cards interativos com preço e tempo estimado com cores harmonizadas com o segmento.
- **Portfólio & Galeria:** Grid de fotos de alta resolução salvas no Supabase Storage.
- **Localização com Google Maps Embutido:** Mapa gerado dinamicamente a partir do endereço cadastrado.
- **Botão Flutuante de WhatsApp:** Inicia conversa direta no WhatsApp da empresa com mensagem contextualizada pré-preenchida.

---

## 2. Wizard de Agendamento em 4 Etapas (`BookingWizard.jsx`)

O fluxo de reserva foi construído com animações suaves via **Framer Motion**:

```
[Etapa 1: Selecionar Serviço]
- Filtro por categorias ("Cabelo", "Barba", etc.)
- Barra de busca textual por nome
         │
         ▼
[Etapa 2: Escolher Profissional, Data e Horário]
- Card do profissional com avatar e especialidades
- Calendário reativo para escolha do dia
- Grade de horários calculada em tempo real pelo motor de disponibilidade
         │
         ▼
[Etapa 3: Dados do Cliente]
- Nome completo, telefone WhatsApp e e-mail
- Campo para observações e preferências especiais
         │
         ▼
[Etapa 4: Confirmação e Comprovante]
- Exibição do resumo completo com valor, profissional, dia e horário
- Botão para adicionar ao Google Agenda / Compartilhar
- Código / Token de cancelamento para autoatendimento
```

---

## 3. Portal "Meus Agendamentos" (`MyBookings.jsx`)

Permite ao cliente consultar seu histórico sem necessidade de login com senha:
1. O cliente informa seu e-mail cadastrado.
2. A API busca todos os agendamentos vinculados ao cliente naquela empresa (`GET /api/bookings/client?email=...`).
3. **Ações Disponíveis:**
   - **Cancelar:** Cancela o agendamento de forma imediata utilizando o `cancel_token`.
   - **Reagendar:** Abre modal para seleção de nova data e horário compatível com o profissional e serviço.
   - **Avaliar Atendimento:** Permite deixar uma avaliação de 1 a 5 estrelas e comentário pós-serviço.
