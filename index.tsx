
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';

class ErrorBoundary extends React.Component<{ children: React.ReactNode }, { hasError: boolean; error: Error | null }> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error("App Crash caught by ErrorBoundary:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="h-screen w-screen flex flex-col items-center justify-center p-6 bg-slate-50 text-center font-sans overflow-hidden">
          <div className="bg-white p-8 rounded-[2.5rem] shadow-2xl border border-slate-100 max-w-md w-full space-y-6 animate-fade-in">
            <div className="w-20 h-20 bg-red-50 text-red-500 rounded-3xl flex items-center justify-center mx-auto shadow-sm">
              <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/><path d="M12 9v4"/><path d="M12 17h.01"/></svg>
            </div>
            
            <div className="space-y-2">
              <h1 className="text-2xl font-black text-slate-800 tracking-tight">Ops! Errore critico</h1>
              <p className="text-slate-500 text-sm font-medium leading-relaxed">
                BuonApp ha riscontrato un problema imprevisto. Prova a ricaricare o a ripristinare i dati di fabbrica.
              </p>
            </div>

            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 text-left overflow-auto max-h-32 custom-scrollbar">
              <code className="text-[10px] text-red-600 font-mono break-all leading-tight">
                {this.state.error?.name}: {this.state.error?.message}
              </code>
            </div>

            <div className="flex flex-col gap-3">
              <button 
                onClick={() => window.location.reload()} 
                className="w-full py-4 bg-emerald-500 text-white rounded-2xl font-black shadow-lg shadow-emerald-200 active:scale-95 transition-all"
              >
                Riprova
              </button>
              <button 
                onClick={() => { 
                  if(confirm("Sei sicuro? Questo cancellerà il tuo frigo e le tue ricette personalizzate.")) {
                    localStorage.removeItem('buonapp_state'); 
                    window.location.reload(); 
                  }
                }} 
                className="w-full py-4 bg-slate-100 text-slate-600 rounded-2xl font-black active:scale-95 transition-all border border-slate-200"
              >
                Ripristina App (Reset Dati)
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </React.StrictMode>
);
