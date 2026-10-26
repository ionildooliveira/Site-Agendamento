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
                onClick={() => { this.setState({ hasError: false, error: null }); }}
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
