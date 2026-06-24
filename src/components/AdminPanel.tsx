import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { ShieldCheck, LogOut, X, Key, Loader2 } from 'lucide-react';
import gladiadorLogo from '../assets/Logos/logosinfondo.png';
import { useFocusTrap } from '../hooks/useFocusTrap';

interface AdminPanelProps {
  onClose: () => void;
}

export const AdminPanel: React.FC<AdminPanelProps> = ({ onClose }) => {
  const { isEditor, user, signIn, logout, adminKeyLogin } = useAuth();
  const [keyValue, setKeyValue] = useState('');
  const [keyError, setKeyError] = useState(false);
  const [signingIn, setSigningIn] = useState(false);
  const [signInError, setSignInError] = useState('');

  const handleKeySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const valid = adminKeyLogin(keyValue);
    if (valid) {
      setKeyError(false);
      setKeyValue('');
      onClose();
    } else {
      setKeyError(true);
    }
  };

  const handleGoogleSignIn = async () => {
    setSigningIn(true);
    setSignInError('');
    try {
      await signIn();
      onClose();
    } catch {
      setSignInError('No se pudo iniciar sesión. Intentá de nuevo.');
    } finally {
      setSigningIn(false);
    }
  };

  const handleLogout = () => {
    logout();
    onClose();
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'rgba(0,0,0,0.7)',
        backdropFilter: 'blur(4px)',
        padding: '24px',
      }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div ref={useFocusTrap(true)} className="glass-panel" style={{
        padding: '40px',
        borderRadius: '24px',
        maxWidth: '400px',
        width: '100%',
        position: 'relative',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '24px',
      }}>
        <button
          onClick={onClose}
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
          <X size={20} />
        </button>

        <img src={gladiadorLogo} alt="" style={{ width: '64px', height: '64px', objectFit: 'contain' }} />

        {isEditor ? (
          <>
            <div style={{ textAlign: 'center' }}>
              <ShieldCheck size={28} style={{ color: 'var(--accent-gold)', marginBottom: '8px' }} />
              <h2 style={{ color: '#fff', fontSize: '1.2rem' }}>Modo Editor Activado</h2>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginTop: '4px' }}>
                {user ? `Sesión: ${user.displayName || user.email}` : 'Clave de administrador'}
              </p>
            </div>
            <button onClick={handleLogout} className="btn btn-danger" style={{ width: '100%' }}>
              <LogOut size={16} />
              Cerrar sesión de editor
            </button>
          </>
        ) : (
          <>
            <h2 style={{ color: '#fff', fontSize: '1.3rem', textAlign: 'center' }}>
              Acceso de Editor
            </h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', textAlign: 'center' }}>
              Iniciá sesión o ingresá la clave para editar peleadores y datos
            </p>

            <button
              onClick={handleGoogleSignIn}
              disabled={signingIn}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '12px',
                width: '100%',
                padding: '14px 24px',
                borderRadius: '12px',
                border: '1px solid rgba(255,255,255,0.1)',
                background: 'rgba(255,255,255,0.04)',
                color: '#fff',
                fontSize: '0.95rem',
                fontWeight: 600,
                cursor: signingIn ? 'not-allowed' : 'pointer',
                opacity: signingIn ? 0.6 : 1,
              }}
            >
              {signingIn ? (
                <Loader2 size={20} className="animate-spin" />
              ) : (
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/>
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                </svg>
              )}
              Continuar con Google
            </button>
            {signInError && (
              <p style={{ color: 'var(--color-danger)', fontSize: '0.78rem', textAlign: 'center', width: '100%' }}>
                {signInError}
              </p>
            )}

            <div style={{
              width: '100%',
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              color: 'var(--text-muted)',
              fontSize: '0.8rem',
            }}>
              <div style={{ flexGrow: 1, height: '1px', background: 'var(--border-color)' }} />
              <span>o</span>
              <div style={{ flexGrow: 1, height: '1px', background: 'var(--border-color)' }} />
            </div>

            <form onSubmit={handleKeySubmit} style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div className="form-group" style={{ margin: 0 }}>
                <label className="form-label">Clave de administrador</label>
                <div style={{ position: 'relative' }}>
                  <Key size={16} style={{
                    position: 'absolute',
                    left: '12px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    color: 'var(--text-muted)',
                  }} />
                  <input
                    type="password"
                    value={keyValue}
                    onChange={(e) => { setKeyValue(e.target.value); setKeyError(false); }}
                    placeholder="Ingresá la clave"
                    className="form-input"
                    style={{ paddingLeft: '36px' }}
                  />
                </div>
                {keyError && (
                  <p style={{ color: 'var(--color-danger)', fontSize: '0.78rem', marginTop: '4px' }}>
                    Clave incorrecta
                  </p>
                )}
              </div>
              <button type="submit" className="btn btn-primary" style={{ width: '100%' }}>
                <ShieldCheck size={16} />
                Ingresar como editor
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  );
};
