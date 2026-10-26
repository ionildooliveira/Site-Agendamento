---
name: frontend-stability-and-dom-resilience
description: Diretrizes de estabilidade visual e resiliência de DOM no React 19, prevenção contra tela branca causada por extensões de tradução do navegador (NotFoundError removeChild), blindagem com notranslate e ErrorBoundary.
---

# Frontend Stability & DOM Resilience Skill

Esta skill documenta os padrões arquiteturais de proteção e tratamento de erros no frontend React 19, garantindo que o sistema nunca exiba telas brancas inesperadas aos usuários decorrentes de mutações de extensões, tradutores automáticos do navegador ou falhas de reconciliação de DOM.

---

## 1. Problema Identificado: O Bug de Remoção de Nós do Tradutor

### Diagnóstico Técnico
Ao acessar aplicações React em navegadores configurados em Português quando a página possui `<html lang="en">` (ou textos mistos), ferramentas como Google Tradutor ou Microsoft Edge Tradutor injetam automaticamente elementos `<font>` ao redor dos nós de texto (`TextNode`).

Quando o React 19 executa uma re-renderização condicional ou desmonta um componente (ex: debounce de verificação de link ou avanço de etapa no assistente), a árvore interna do React (`Fiber`) tenta remover o nó original por meio da API nativa `parent.removeChild(childNode)`.

Como o tradutor alterou o pai do nó de texto para uma tag `<font>`, o navegador lança a exceção crítica:
```
NotFoundError: Failed to execute 'removeChild' on 'Node': The node to be removed is not a child of this node.
  at removeChild (react-dom-client.development.js)
  at commitDeletionEffectsOnFiber (react-dom-client.development.js)
```
Sem tratamento, essa exceção desmonta toda a árvore de componentes, resultando em uma tela em branco completa.

---

## 2. Camadas de Proteção Arquitetural

### Camada 1: Imunidade a Tradutores no HTML Raiz (`index.html`)

O HTML base deve declarar explicitamente o idioma padrão do sistema e instruir os motores de tradução dos navegadores a não alterarem a estrutura do DOM:

```html
<!doctype html>
<html lang="pt-BR" class="notranslate" translate="no">
  <head>
    <meta charset="UTF-8" />
    <meta name="google" content="notranslate" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Studio Beauty - Plataforma de Agendamento</title>
  </head>
  <body class="notranslate">
    <div id="root"></div>
    <script type="module" src="/src/main.jsx"></script>
  </body>
</html>
```

### Camada 2: Encapsulamento Estável de Textos Dinâmicos

Evite nós de texto nus diretamente em expressões condicionais ternárias ou operadores `&&`. Envolva textos dinâmicos em elementos HTML com chaves (`key`) exclusivas:

```jsx
// ❌ INSEGURO (Propício a colapso de nós de texto em tradutores)
<div className="status">
  {checking && "Verificando..."}
  {!checking && available && "Disponível"}
  {!checking && !available && "Indisponível"}
</div>

// ✅ SEGURO (Nós isolados e com identidade fixa no Fiber)
<div className="status">
  {checking && (
    <span key="checking" className="text-gray-400">Verificando...</span>
  )}
  {!checking && available && (
    <span key="available" className="text-emerald-600">Disponível</span>
  )}
  {!checking && !available && (
    <span key="unavailable" className="text-red-500">Indisponível</span>
  )}
</div>
```

### Camada 3: Componente ErrorBoundary Global e Modular

Toda a aplicação deve ser envolvida por um **Error Boundary** de classe em [`client/src/main.jsx`](file:///c:/Users/ios87/OneDrive/Área%20de%20Trabalho/Site-agendamento/client/src/main.jsx), interceptando exceções no ciclo de vida do React antes que resultem em tela branca.

#### Implementação de Referência: [`client/src/components/ErrorBoundary.jsx`](file:///c:/Users/ios87/OneDrive/Área%20de%20Trabalho/Site-agendamento/client/src/components/ErrorBoundary.jsx)

```jsx
import React from 'react';

export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('ErrorBoundary capturou um erro:', error, errorInfo);
  }

  handleReload = () => {
    this.setState({ hasError: false, error: null });
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-[#FFF8FA] p-4 text-[#4A323D]">
          <div className="max-w-md w-full bg-white rounded-3xl p-8 shadow-xl border border-[#F5D8E3] text-center">
            <div className="w-16 h-16 bg-red-100 text-red-600 rounded-full flex items-center justify-center text-2xl mx-auto mb-4">
              ⚠️
            </div>
            <h2 className="text-xl font-bold font-heading mb-2">Ops! Ocorreu uma instabilidade na tela</h2>
            <p className="text-xs text-gray-500 mb-6 leading-relaxed">
              Detectamos uma alteração inesperada nos elementos visuais do navegador.
            </p>
            <div className="flex gap-3 justify-center">
              <button
                onClick={this.handleReload}
                className="px-6 py-2.5 rounded-full bg-[#D47FA6] hover:bg-[#b86289] text-white text-xs font-bold transition shadow"
              >
                Recarregar Página
              </button>
              <button
                onClick={() => this.setState({ hasError: false, error: null })}
                className="px-6 py-2.5 rounded-full border border-gray-300 text-gray-600 hover:bg-gray-50 text-xs font-bold transition"
              >
                Tentar Continuar
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
```

### Camada 4: Transição Segura com Framer Motion

Em assistentes multi-etapas (`OnboardingWizard`, `BookingWizard`), evite o uso concorrente de `<AnimatePresence mode="wait">` caso ocorram validações de estado assíncronas concorrentes durante a digitação. Prefira montagem direta com animações baseadas em chave única:

```jsx
{currentStep === 1 && (
  <motion.div
    key="step1"
    initial={{ opacity: 0, y: 10 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.25 }}
  >
    {/* Formulário do Passo 1 */}
  </motion.div>
)}
```
