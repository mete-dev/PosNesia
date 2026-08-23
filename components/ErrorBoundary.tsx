import React, { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
  children?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught React Error:', error, errorInfo);
  }

  public handleReload = () => {
    this.setState({ hasError: false, error: null });
    window.location.reload();
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-slate-900 text-white flex flex-col items-center justify-center p-6 text-center font-sans">
          <div className="w-16 h-16 bg-rose-500/20 text-rose-500 rounded-2xl flex items-center justify-center text-3xl font-black mb-4">
            ⚠️
          </div>
          <h1 className="text-2xl font-black mb-2">Terjadi Kesalahan Tampilan (Runtime Error)</h1>
          <p className="text-sm text-slate-400 max-w-md mb-4">
            Aplikasi mengalami kesalahan sistem yang tidak terduga saat memuat komponen ini:
          </p>
          <div className="bg-slate-950 border border-slate-800 p-4 rounded-xl font-mono text-xs text-rose-400 max-w-lg overflow-x-auto mb-6 text-left w-full">
            {this.state.error?.toString() || 'Unknown Error'}
          </div>
          <button
            onClick={this.handleReload}
            className="bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs px-5 py-2.5 rounded-xl shadow-lg transition-all cursor-pointer"
          >
            🔄 Muat Ulang Halaman
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
