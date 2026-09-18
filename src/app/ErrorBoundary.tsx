import { Component, type ErrorInfo, type ReactNode } from 'react';

interface Props {
  children?: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export class GlobalErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error:', error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex flex-col items-center justify-center p-6 text-center">
          <h2 className="text-xl text-destructive mb-2">Qualcosa è andato storto.</h2>
          <p className="text-muted-foreground mb-6">
            L'applicazione ha riscontrato un errore inaspettato.
          </p>
          <button
            className="bg-ink text-surface px-4 py-2 rounded-xl font-medium"
            onClick={() => window.location.reload()}
          >
            Ricarica
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
