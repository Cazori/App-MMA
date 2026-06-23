import { useState, useCallback, useEffect } from 'react';
import type { Fighter } from './types/mma';
import type { PageKey } from './components/Topbar';
import { subscribeFighters, saveFighter, deleteFighter } from './services/storage';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { LoginPage } from './components/LoginPage';
import { Topbar } from './components/Topbar';
import { Dashboard } from './components/Dashboard';
import { FighterList } from './components/FighterList';
import { FighterProfile } from './components/FighterProfile';
import { FighterForm } from './components/FighterForm';
import { SubClubs } from './components/SubClubs';
import { ClubInfoPage } from './components/ClubInfo';
import { Tutorials } from './components/Tutorials';
import { Shop } from './components/Shop';
import { Shield, Menu, Loader2 } from 'lucide-react';

const AppContent: React.FC = () => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg-primary)' }}>
        <Loader2 size={40} className="animate-spin" style={{ color: 'var(--accent-orange)' }} />
      </div>
    );
  }

  if (!user) return <LoginPage />;

  return <AuthenticatedApp />;
};

const AuthenticatedApp: React.FC = () => {
  const [currentPage, setCurrentPage] = useState<PageKey>('dashboard');
  const [fighters, setFighters] = useState<Fighter[]>([]);
  const [fightersLoading, setFightersLoading] = useState(true);
  const [selectedFighterId, setSelectedFighterId] = useState<string>('');
  const [showForm, setShowForm] = useState(false);
  const [editingFighter, setEditingFighter] = useState<Fighter | null>(null);
  const [sidebarVisible, setSidebarVisible] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => setFightersLoading(false), 8000);

    const unsub = subscribeFighters(
      (list) => {
        clearTimeout(timer);
        setFighters(list);
        setFightersLoading(false);
      },
      () => {
        clearTimeout(timer);
        setFightersLoading(false);
      }
    );
    return () => { unsub(); clearTimeout(timer); };
  }, []);

  useEffect(() => {
    if (!selectedFighterId && fighters.length > 0) {
      setSelectedFighterId(fighters[0].id);
    }
  }, [fighters, selectedFighterId]);

  const selectedFighter = fighters.find((f) => f.id === selectedFighterId) || null;

  const handleNavigate = useCallback((page: PageKey) => {
    setCurrentPage(page);
  }, []);

  const handleSelectFighter = useCallback((id: string) => {
    setSelectedFighterId(id);
    setCurrentPage('fighters');
    setSidebarVisible(false);
  }, []);

  const handleSaveFighter = useCallback(async (fighter: Fighter) => {
    await saveFighter(fighter);
    setSelectedFighterId(fighter.id);
    setShowForm(false);
    setEditingFighter(null);
  }, []);

  const handleDeleteFighter = useCallback(async (id: string) => {
    if (!window.confirm('¿Seguro que querés eliminar este peleador?')) return;
    await deleteFighter(id);
    if (selectedFighterId === id) {
      setSelectedFighterId('');
    }
  }, [selectedFighterId]);

  const handleOpenAddModal = useCallback(() => {
    setEditingFighter(null);
    setShowForm(true);
  }, []);

  const handleEditFighter = useCallback((fighter: Fighter) => {
    setEditingFighter(fighter);
    setShowForm(true);
  }, []);

  const handleCloseForm = useCallback(() => {
    setShowForm(false);
    setEditingFighter(null);
  }, []);

  if (fightersLoading) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
        <Topbar currentPage={currentPage} onNavigate={handleNavigate} />
        <div style={{ flexGrow: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Loader2 size={40} className="animate-spin" style={{ color: 'var(--accent-orange)' }} />
        </div>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <Topbar currentPage={currentPage} onNavigate={handleNavigate} />

      {currentPage === 'dashboard' && (
        <main className="main-content" style={{ height: 'auto' }}>
          <Dashboard onSelectFighter={handleSelectFighter} onNavigate={handleNavigate} />
        </main>
      )}

      {currentPage === 'fighters' && (
        <div className="app-container" style={{ flexGrow: 1 }}>
          <div className="mobile-header">
            <button
              onClick={() => setSidebarVisible((v) => !v)}
              style={{ background: 'none', border: 'none', color: '#fff', cursor: 'pointer' }}
            >
              <Menu size={24} />
            </button>
            <span className="mobile-logo-text">
              Guerr<span className="mobile-logo-accent">eros</span>
            </span>
            <Shield size={20} style={{ color: 'var(--accent-orange)' }} />
          </div>
          <aside className={`sidebar${sidebarVisible ? '' : ' hidden-mobile'}`}>
            <FighterList
              fighters={fighters}
              selectedFighterId={selectedFighterId}
              onSelectFighter={handleSelectFighter}
              onOpenAddModal={handleOpenAddModal}
            />
          </aside>
          <main className="main-content">
            {selectedFighter ? (
              <FighterProfile
                fighter={selectedFighter}
                onEditFighter={handleEditFighter}
                onDeleteFighter={handleDeleteFighter}
              />
            ) : (
              <div style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                height: '100%',
                color: 'var(--text-muted)',
                textAlign: 'center',
                gap: '16px',
              }}>
                <Shield size={64} style={{ opacity: 0.3 }} />
                <h2 style={{ color: 'var(--text-secondary)', fontSize: '1.5rem' }}>
                  No hay peleadores registrados
                </h2>
                <p>Usá el botón "Registrar Peleador" en la barra lateral para comenzar.</p>
              </div>
            )}
          </main>
        </div>
      )}

      {currentPage === 'tutorials' && (
        <main className="main-content" style={{ height: 'auto' }}>
          <Tutorials />
        </main>
      )}

      {currentPage === 'alianzas' && (
        <main className="main-content" style={{ height: 'auto' }}>
          <SubClubs />
        </main>
      )}

      {currentPage === 'shop' && (
        <main className="main-content" style={{ height: 'auto' }}>
          <Shop />
        </main>
      )}

      {currentPage === 'clubinfo' && (
        <main className="main-content" style={{ height: 'auto' }}>
          <ClubInfoPage fightersCount={fighters.length} coachesCount={fighters.filter(f => f.coachRole === 'monitor' || f.coachRole === 'maestro').length} />
        </main>
      )}

      {showForm && (
        <FighterForm
          fighter={editingFighter}
          onSave={handleSaveFighter}
          onClose={handleCloseForm}
        />
      )}
    </div>
  );
};

export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}
