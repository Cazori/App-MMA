import { createContext, useContext, useState, useCallback, type ReactNode } from 'react';
import { AlertTriangle, X } from 'lucide-react';
import { useFocusTrap } from '../hooks/useFocusTrap';

interface ConfirmOptions {
  title?: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  danger?: boolean;
}

interface ConfirmContextValue {
  confirm: (opts: ConfirmOptions) => Promise<boolean>;
}

const ConfirmContext = createContext<ConfirmContextValue | null>(null);

export const ConfirmProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [state, setState] = useState<{
    opts: ConfirmOptions;
    resolve: (v: boolean) => void;
  } | null>(null);

  const confirm = useCallback((opts: ConfirmOptions): Promise<boolean> => {
    return new Promise((resolve) => {
      setState({ opts, resolve });
    });
  }, []);

  const handleClose = useCallback((result: boolean) => {
    if (state) {
      state.resolve(result);
      setState(null);
    }
  }, [state]);

  return (
    <ConfirmContext.Provider value={{ confirm }}>
      {children}
      {state && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 9999,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'rgba(0,0,0,0.7)',
            backdropFilter: 'blur(4px)',
            padding: '24px',
          }}
          onClick={(e) => { if (e.target === e.currentTarget) handleClose(false); }}
        >
          <div
            ref={useFocusTrap(!!state)}
            className="glass-panel"
            role="dialog"
            aria-modal="true"
            style={{
              padding: '32px',
              borderRadius: '24px',
              maxWidth: '400px',
              width: '100%',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '20px',
              textAlign: 'center',
            }}
          >
            <div style={{
              width: '48px',
              height: '48px',
              borderRadius: '50%',
              background: state.opts.danger ? 'rgba(239,68,68,0.15)' : 'rgba(234,179,8,0.15)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}>
              <AlertTriangle size={24} style={{ color: state.opts.danger ? 'var(--color-danger)' : 'var(--color-warning)' }} />
            </div>

            <div>
              <h3 style={{ color: '#fff', fontSize: '1.1rem', marginBottom: '8px' }}>
                {state.opts.title || '¿Estás seguro?'}
              </h3>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', lineHeight: 1.5 }}>
                {state.opts.message}
              </p>
            </div>

            <div style={{ display: 'flex', gap: '12px', width: '100%' }}>
              <button
                onClick={() => handleClose(false)}
                className="btn"
                style={{
                  flex: 1,
                  padding: '12px',
                  borderRadius: '12px',
                  border: '1px solid var(--border-color)',
                  background: 'transparent',
                  color: 'var(--text-secondary)',
                  cursor: 'pointer',
                  fontSize: '0.9rem',
                  fontWeight: 600,
                }}
              >
                {state.opts.cancelLabel || 'Cancelar'}
              </button>
              <button
                onClick={() => handleClose(true)}
                className={`btn ${state.opts.danger ? 'btn-danger' : 'btn-primary'}`}
                style={{
                  flex: 1,
                  padding: '12px',
                  borderRadius: '12px',
                  cursor: 'pointer',
                  fontSize: '0.9rem',
                  fontWeight: 600,
                }}
              >
                {state.opts.confirmLabel || 'Sí, confirmar'}
              </button>
            </div>

            <button
              onClick={() => handleClose(false)}
              aria-label="Cerrar"
              style={{
                position: 'absolute',
                top: '16px',
                right: '16px',
                background: 'none',
                border: 'none',
                color: 'var(--text-muted)',
                cursor: 'pointer',
                padding: '4px',
              }}
            >
              <X size={18} />
            </button>
          </div>
        </div>
      )}
    </ConfirmContext.Provider>
  );
};

export const useConfirm = (): ConfirmContextValue => {
  const ctx = useContext(ConfirmContext);
  if (!ctx) throw new Error('useConfirm debe usarse dentro de un ConfirmProvider');
  return ctx;
};
