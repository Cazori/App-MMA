import React from 'react';
import { AlertTriangle } from 'lucide-react';

interface ErrorBoundaryProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
}

export class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  state: ErrorBoundaryState = { hasError: false };

  static getDerivedStateFromError(): ErrorBoundaryState {
    return { hasError: true };
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback || (
        <div style={{
          flexGrow: 1,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '60px',
          gap: '16px',
          textAlign: 'center',
        }}>
          <AlertTriangle size={40} style={{ color: 'var(--color-warning)' }} />
          <h3 style={{ color: '#fff', fontSize: '1.1rem' }}>Algo salió mal</h3>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
            Hubo un error al cargar esta sección. Recargá la página o intentá de nuevo.
          </p>
          <button
            onClick={() => this.setState({ hasError: false })}
            className="btn btn-primary"
            style={{ padding: '10px 24px' }}
          >
            Reintentar
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}
