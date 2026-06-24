import { LayoutDashboard, Users, BookOpen, Building2, Info, ShoppingBag, LogOut, ShieldCheck, Shield, FileSpreadsheet } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import type { Fighter } from '../types/mma';
import gladiadorLogo from '../assets/Logos/logosinfondo.png';

export type PageKey = 'dashboard' | 'fighters' | 'tutorials' | 'alianzas' | 'clubinfo' | 'shop';

interface TopbarProps {
  currentPage: PageKey;
  onNavigate: (page: PageKey) => void;
  onOpenAdmin: () => void;
  fighters: Fighter[];
}

const NAV_ITEMS: { key: PageKey; label: string; icon: React.ReactNode }[] = [
  { key: 'dashboard', label: 'Dashboard', icon: <LayoutDashboard size={18} /> },
  { key: 'fighters', label: 'Atletas', icon: <Users size={18} /> },
  { key: 'tutorials', label: 'Tutoriales', icon: <BookOpen size={18} /> },
  { key: 'alianzas', label: 'Alianzas', icon: <Building2 size={18} /> },
  { key: 'shop', label: 'Tienda', icon: <ShoppingBag size={18} /> },
  { key: 'clubinfo', label: 'Info', icon: <Info size={18} /> },
];

export const Topbar: React.FC<TopbarProps> = ({ currentPage, onNavigate, onOpenAdmin, fighters }) => {
  const { user, isEditor, logout } = useAuth();

  return (
    <>
      {/* Desktop Topbar */}
      <header className="topbar-desktop">
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <img src={gladiadorLogo} alt="Guerreros de Dios" style={{ width: '36px', height: '36px', objectFit: 'contain' }} />
          <span className="topbar-brand">
            GUERREROS<span style={{ color: 'var(--accent-orange)' }}> DE DIOS</span>
          </span>
          {isEditor && (
            <span className="admin-badge">
              <ShieldCheck size={12} /> Editor
            </span>
          )}
        </div>

        <nav style={{ display: 'flex', gap: '4px' }}>
          {NAV_ITEMS.map((item) => {
            const isActive = currentPage === item.key;
            return (
              <button
                key={item.key}
                onClick={() => onNavigate(item.key)}
                className={`topbar-nav-btn${isActive ? ' active' : ''}`}
              >
                {item.icon}
                {item.label}
              </button>
            );
          })}
        </nav>

        <div className="topbar-user">
          {isEditor && (
            <button
              onClick={async () => { const { exportAllToExcel } = await import('../utils/exportExcel'); exportAllToExcel(fighters); }}
              className="topbar-logout-btn"
              style={{ color: 'var(--accent-orange)' }}
              title="Exportar todos los peleadores a Excel"
            >
              <FileSpreadsheet size={16} />
              Exportar Todo
            </button>
          )}
          <button onClick={onOpenAdmin} className="topbar-logout-btn" style={{ color: isEditor ? 'var(--accent-gold)' : 'var(--text-muted)' }}>
            <Shield size={16} />
            Admin
          </button>
          {user?.photoURL && (
            <img src={user.photoURL} alt={user.displayName || ''} className="topbar-avatar" />
          )}
          {user && (
            <span className="topbar-user-name">{user.displayName}</span>
          )}
          {user && (
            <button onClick={logout} className="topbar-logout-btn">
              <LogOut size={16} />
              Salir
            </button>
          )}
        </div>
      </header>

      {/* Slim Mobile Topbar */}
      <header className="topbar-mobile">
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <img src={gladiadorLogo} alt="" style={{ width: '28px', height: '28px', objectFit: 'contain' }} />
          <span className="topbar-brand" style={{ fontSize: '0.85rem' }}>
            GD<span style={{ color: 'var(--accent-orange)' }}> MMA</span>
          </span>
          {isEditor && (
            <span className="admin-badge" style={{ fontSize: '0.55rem', padding: '1px 6px' }}>
              Admin
            </span>
          )}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          {isEditor && (
            <button
              onClick={async () => { const { exportAllToExcel } = await import('../utils/exportExcel'); exportAllToExcel(fighters); }}
              style={{ background: 'none', border: 'none', color: 'var(--accent-orange)', cursor: 'pointer', padding: '6px' }}
              title="Exportar a Excel"
            >
              <FileSpreadsheet size={16} />
            </button>
          )}
          <button onClick={onOpenAdmin} style={{ background: 'none', border: 'none', color: isEditor ? 'var(--accent-gold)' : 'var(--text-muted)', cursor: 'pointer', padding: '6px' }}>
            <Shield size={18} />
          </button>
          {user?.photoURL && (
            <img src={user.photoURL} alt="" className="topbar-avatar" style={{ width: '26px', height: '26px' }} />
          )}
          {user && (
            <button onClick={logout} className="topbar-logout-btn" style={{ padding: '6px' }}>
              <LogOut size={16} />
            </button>
          )}
        </div>
      </header>

      {/* Mobile Bottom Nav */}
      <nav className="bottom-nav">
        {NAV_ITEMS.map((item) => {
          const isActive = currentPage === item.key;
          return (
            <button
              key={item.key}
              onClick={() => onNavigate(item.key)}
              className={`bottom-nav-btn${isActive ? ' active' : ''}`}
            >
              {item.icon}
              <span>{item.label}</span>
            </button>
          );
        })}
      </nav>
    </>
  );
};
