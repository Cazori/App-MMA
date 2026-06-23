import { LayoutDashboard, Users, BookOpen, Building2, Info, ShoppingBag, LogOut, ShieldCheck } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import gladiadorLogo from '../assets/Logos/logosinfondo.png';

export type PageKey = 'dashboard' | 'fighters' | 'tutorials' | 'alianzas' | 'clubinfo' | 'shop';

interface TopbarProps {
  currentPage: PageKey;
  onNavigate: (page: PageKey) => void;
}

const NAV_ITEMS: { key: PageKey; label: string; icon: React.ReactNode }[] = [
  { key: 'dashboard', label: 'Dashboard', icon: <LayoutDashboard size={18} /> },
  { key: 'fighters', label: 'Atletas', icon: <Users size={18} /> },
  { key: 'tutorials', label: 'Tutoriales', icon: <BookOpen size={18} /> },
  { key: 'alianzas', label: 'Alianzas', icon: <Building2 size={18} /> },
  { key: 'shop', label: 'Tienda', icon: <ShoppingBag size={18} /> },
  { key: 'clubinfo', label: 'Info', icon: <Info size={18} /> },
];

export const Topbar: React.FC<TopbarProps> = ({ currentPage, onNavigate }) => {
  const { user, isAdmin, logout } = useAuth();

  return (
    <>
      {/* Desktop Topbar */}
      <header className="topbar-desktop">
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <img src={gladiadorLogo} alt="Guerreros de Dios" style={{ width: '36px', height: '36px', objectFit: 'contain' }} />
          <span className="topbar-brand">
            GUERREROS<span style={{ color: 'var(--accent-orange)' }}> DE DIOS</span>
          </span>
          {isAdmin && (
            <span className="admin-badge">
              <ShieldCheck size={12} /> Admin
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
          {user?.photoURL && (
            <img src={user.photoURL} alt={user.displayName || ''} className="topbar-avatar" />
          )}
          <span className="topbar-user-name">{user?.displayName}</span>
          <button onClick={logout} className="topbar-logout-btn">
            <LogOut size={16} />
            Salir
          </button>
        </div>
      </header>

      {/* Slim Mobile Topbar */}
      <header className="topbar-mobile">
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <img src={gladiadorLogo} alt="" style={{ width: '28px', height: '28px', objectFit: 'contain' }} />
          <span className="topbar-brand" style={{ fontSize: '0.85rem' }}>
            GD<span style={{ color: 'var(--accent-orange)' }}> MMA</span>
          </span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          {user?.photoURL && (
            <img src={user.photoURL} alt="" className="topbar-avatar" style={{ width: '26px', height: '26px' }} />
          )}
          <button onClick={logout} className="topbar-logout-btn" style={{ padding: '6px' }}>
            <LogOut size={16} />
          </button>
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
