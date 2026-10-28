---
name: niche-customization-and-theming
description: Arquitetura multi-nicho e customização dinâmica de identidade visual (Barbearia, Salão, Esmalteria, Estética), injeção de CSS tokens no DOM, auto-seeding de serviços por segmento e seletor administrativo.
---

# Niche Customization & Theming Skill

Esta skill documenta a arquitetura de múltiplos segmentos (nichos de beleza e bem-estar), o motor de estilização visual reativo e a personalização dinâmica de cores, temas, badges e serviços padrão por segmento na plataforma SaaS **I.O.S AgendeJá**.

---

## 1. Visão Geral da Arquitetura Multi-Nicho

A plataforma opera sob um modelo SaaS multi-tenant que atende a quatro verticais distintas do mercado de beleza e estética:

| Chave (`niche`) | Nome do Segmento | Ícone | Slogan Padrão | Paleta Predominante |
| :--- | :--- | :---: | :--- | :--- |
| `barbearia` | Barbearia & Barber Shop | 💈 | Plataforma para Barbearias | Dark Luxury / Âmbar e Dourado (`#D97706`) |
| `salao` | Salão de Beleza | 💇‍♀️ | Plataforma para Salões | Rosé Elegance & Vinho (`#D47FA6`) |
| `esmalteria` | Esmalteria & Nails Club | 💅 | Plataforma para Esmalterias | Violet & Roxo Criativo (`#8B5CF6`) |
| `estetica` | Estética & Spa | 🌿 | Plataforma para Clínicas de Estética e Spa | Emerald, Sage & Teal Relaxante (`#059669`) |

### Neutralidade do SaaS & Experiência de Onboarding
- **Marca Neutra:** Na landing page comercial do SaaS e no fluxo de onboarding (`/cadastro`), a marca institucional é **I.O.S AgendeJá**.
- **Sincronização de Slogan:** Quando o usuário seleciona ou altera o nicho no seletor de cards, o slogan superior é reativamente atualizado em todas as etapas subsequentes do wizard de cadastro.

---

## 2. Dicionário de Tokens de Design (`client/src/constants/niches.js`)

Cada nicho exporta um objeto `theme` completo com tokens utilitários consumidos pelos componentes do cliente final:

```javascript
export const NICHES = {
  estetica: {
    id: 'estetica',
    name: 'Estética & Spa',
    icon: '🌿',
    defaultBadge: 'Clínica de Estética & Bem-Estar',
    theme: {
      isDark: false,
      primaryColor: '#059669',     // Emerald 600
      primaryDark: '#047857',      // Emerald 700
      primaryLight: '#34D399',     // Emerald 400
      pageBg: 'bg-emerald-50/30',
      pageText: 'text-stone-800',
      headingColor: 'text-emerald-950',
      badgeClass: 'bg-emerald-100 text-emerald-800 border-emerald-300',
      buttonClass: 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-500/20',
      cardBg: 'bg-white',
      cardBorder: 'border-emerald-100 hover:border-emerald-300',
      accentPrice: 'text-emerald-700',
      accentText: 'text-emerald-600',
      navbarIconBg: 'bg-emerald-100 text-emerald-700 border-emerald-200',
      navbarLogoText: 'text-emerald-900',
      footerBg: 'bg-stone-900 text-stone-300',
      footerAccent: 'text-emerald-400',
      footerBorder: 'border-emerald-900/40'
    }
  },
  barbearia: {
    // ... Tokens em tons de Âmbar/Dark Gold
  },
  salao: {
    // ... Tokens em tons de Rosé/Vinho
  },
  esmalteria: {
    // ... Tokens em tons de Violeta/Púrpura
  }
};
```

---

## 3. Injeção Dinâmica no DOM (`TenantLayout.jsx`)

Para garantir que a estilização afete tanto classes utilitárias Tailwind quanto estilos globais do CSS e componentes de terceiros, o `TenantLayout` injeta dinamicamente **CSS Custom Properties** no elemento raiz `:root` (`document.documentElement`):

```javascript
// Injeção de variáveis CSS com base no nicho ativo
const nicheKey = currentSalon?.niche || 'salao';
const nicheConfig = getNicheConfig(nicheKey);

document.documentElement.style.setProperty('--theme-primary', nicheConfig.theme.primaryColor);
document.documentElement.style.setProperty('--theme-primary-dark', nicheConfig.theme.primaryDark);
document.documentElement.style.setProperty('--theme-primary-light', nicheConfig.theme.primaryLight);
document.documentElement.style.setProperty(
  '--theme-gradient', 
  `linear-gradient(135deg, ${nicheConfig.theme.primaryColor} 0%, ${nicheConfig.theme.primaryDark} 100%)`
);
document.documentElement.style.setProperty(
  '--theme-shadow', 
  `0 8px 24px ${nicheConfig.theme.primaryColor}33`
);

// Atualização dinâmica do título da aba
document.title = `${currentSalon.name || 'Agendamento'} • ${nicheConfig.name}`;
```

### Escuta Reativa de Atualizações (`salonSettingsUpdated`)
Quando o lojista altera o nicho ou nome da empresa no painel administrativo, um evento `window.dispatchEvent(new CustomEvent('salonSettingsUpdated', ...))` é disparado, fazendo o `TenantLayout` recarregar as configurações e atualizar o tema imediatamente sem necessidade de recarregar a página (`F5`).

---

## 4. Telas e Componentes com Estilização Dinâmica

As seguintes páginas e componentes reagem aos tokens do nicho do tenant:

1. **`LandingPage.jsx`**:
   - Hero com overlay e gradientes harmonizados com o nicho.
   - Pílula de destaque (badge) e botões de chamada primários e secundários.
   - Cards de serviços em destaque com hover border e cor de preço no tom do segmento.
   - Cards de depoimentos e seção de contato / endereço.

2. **`PublicNavbar.jsx` & `PublicFooter.jsx`**:
   - Ícone temático (💈, 💇‍♀️, 💅, 🌿) no logo da empresa.
   - Cores de fundo e destaque das bordas e links ativos.
   - Botão "Agendar Horário" com classe e sombra específicas do nicho.

3. **`ServicesCatalog.jsx`**:
   - Banner de cabeçalho temático com mensagem adaptada ("Nossos Serviços de Estética", "Nossos Cortes & Cuidados", etc.).
   - Pílulas de filtro de categorias e anéis de foco na barra de pesquisa.
   - Botões "Agendar Este" adaptados à paleta.

4. **`BookingWizard.jsx`**:
   - Stepper de progresso em 4 etapas com ícones e gradiente do nicho.
   - Seleção de dia e horários com slots destacados na cor do tema.
   - Card de confirmação final com badge e botões no estilo visual do segmento.

5. **`MyBookings.jsx`**:
   - Botões de ações (Reagendar, Cancelar) utilizando as variáveis `--theme-primary`.

---

## 5. Auto-Seeding de Serviços no Onboarding (`server/routes/onboarding.js`)

Ao provisionar um novo salão via auto-cadastro ou pelo Super Admin, o sistema analisa o campo `niche` e semeia serviços padrão correspondentes:

- **`barbearia`**: Corte Degradê & Freestyle, Barba Completa com Toalha Quente, Combo Corte + Barba.
- **`estetica`**: Limpeza de Pele Profunda, Drenagem Linfática Corporal, Massagem Relaxante com Aromaterapia.
- **`esmalteria`**: Manicure & Pedicure Completa, Alongamento em Gel, Esmaltação em Gel / Nail Art.
- **`salao`**: Corte Feminino & Escova, Mechas & Morena Iluminada, Hidratação Profunda / Botox Capilar.

---

## 6. Gestão de Nicho no Painel Administrativo (`Settings.jsx`)

No portal do lojista (`/admin/configuracoes`), a aba **Identidade** inclui um seletor visual de segmento com os quatro nichos disponíveis. A alteração persiste no banco de dados Supabase na coluna `companies.niche` e atualiza instantaneamente a experiência de navegação do salão.
