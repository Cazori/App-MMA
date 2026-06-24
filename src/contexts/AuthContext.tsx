import { createContext, useContext, useEffect, useState, useCallback, type ReactNode } from 'react';
import type { User } from 'firebase/auth';
import { onAuthChange, signInWithGoogle, logout as firebaseLogout } from '../services/firebase';

interface AuthContextValue {
  user: User | null;
  loading: boolean;
  isAdmin: boolean;
  isEditor: boolean;
  signIn: () => Promise<void>;
  logout: () => Promise<void>;
  adminKeyLogin: (key: string) => boolean;
  adminKeyLogout: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

const ADMIN_EMAIL = 'juan939srz@gmail.com';
const ADMIN_KEY = import.meta.env.VITE_ADMIN_KEY;

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [adminKeyAuthenticated, setAdminKeyAuthenticated] = useState(() => {
    return localStorage.getItem('adminKeyAuth') === 'true';
  });

  useEffect(() => {
    const unsub = onAuthChange((firebaseUser) => {
      setUser(firebaseUser);
      setLoading(false);
    });
    return unsub;
  }, []);

  const signIn = useCallback(async () => {
    await signInWithGoogle();
  }, []);

  const logout = useCallback(async () => {
    try {
      await firebaseLogout();
    } catch (err) {
      console.error('Error al cerrar sesión:', err);
    }
    setAdminKeyAuthenticated(false);
    localStorage.removeItem('adminKeyAuth');
  }, []);

  const adminKeyLogin = useCallback((key: string): boolean => {
    if (!ADMIN_KEY) return false;
    const valid = key === ADMIN_KEY;
    if (valid) {
      setAdminKeyAuthenticated(true);
      localStorage.setItem('adminKeyAuth', 'true');
    }
    return valid;
  }, []);

  const adminKeyLogout = useCallback(() => {
    setAdminKeyAuthenticated(false);
    localStorage.removeItem('adminKeyAuth');
  }, []);

  const isAdmin = user?.email === ADMIN_EMAIL;
  const isEditor = isAdmin || adminKeyAuthenticated;

  return (
    <AuthContext.Provider value={{ user, loading, isAdmin, isEditor, signIn, logout, adminKeyLogin, adminKeyLogout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextValue => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth debe usarse dentro de un AuthProvider');
  return ctx;
};
