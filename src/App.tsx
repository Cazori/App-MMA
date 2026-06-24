import { useState, useCallback, useEffect, lazy, Suspense, useMemo } from 'react';
import type { Fighter } from './types/mma';
import type { PageKey } from './components/Topbar';
import { subscribeFighters, saveFighterWithSnapshot, deleteFighter } from './services/storage';
import { AuthProvider } from './contexts/AuthContext';
import { ToastProvider } from './contexts/ToastContext';
import { ConfirmProvider } from './contexts/ConfirmContext';
import { Topbar } from './components/Topbar';
import { FighterList } from './components/FighterList';
import { FighterProfile } from './components/FighterProfile';
import { FighterForm } from './components/FighterForm';
import { AdminPanel } from './components/AdminPanel';
import { useToast } from './contexts/ToastContext';
import { useConfirm } from './contexts/ConfirmContext';
import { Shield, Menu, Loader2 } from 'lucide-react';
import { ErrorBoundary } from './components/ErrorBoundary';
import { PageSkeleton } from './components/Skeleton';

const Dashboard = lazy(() => import('./components/Dashboard').then(m => ({ default: m.Dashboard })));
const SubClubs = lazy(() => import('./components/SubClubs').then(m => ({ default: m.SubClubs })));
const ClubInfoPage = lazy(() => import('./components/ClubInfo').then(m => ({ default: m.ClubInfoPage })));
const Tutorials = lazy(() => import('./components/Tutorials').then(m => ({ default: m.Tutorials })));
const Shop = lazy(() => import('./components/Shop').then(m => ({ default: m.Shop })));

type LoadState = 'loading' | 'ready';

const AppContent: React.FC = () => {
  const { toast } = useToast();
  const { confirm } = useConfirm();
  const [currentPage, setCurrentPage] = useState<PageKey>('dashboard');
  const [fighters, setFighters] = useState<Fighter[]>([]);
  const [loadState, setLoadState] = useState<LoadState>('loading');
  const [selectedFighterId, setSelectedFighterId] = useState<string>('');
  const [showForm, setShowForm] = useState(false);
  const [editingFighter, setEditingFighter] = useState<Fighter | null>(null);
  const [sidebarVisible, setSidebarVisible] = useState(true);
  const [showAdminPanel, setShowAdminPanel] = useState(false);

  useEffect(() => {
    const unsub = subscribeFighters(
      (list) => {
        setFighters(list);
        setLoadState('ready');
      },
      () => {
        setLoadState('ready');
      }
    );
    return unsub;
  }, []);

  useEffect(() => {
    if (!selectedFighterId && fighters.length > 0) {
      setSelectedFighterId(fighters[0].id);
    }
  }, [fighters, selectedFighterId]);

  const selectedFighter = useMemo(
    () => fighters.find((f) => f.id === selectedFighterId) || null,
    [fighters, selectedFighterId]
  );

  const handleNavigate = useCallback((page: PageKey) => {
    setCurrentPage(page);
  }, []);

  const handleSelectFighter = useCallback((id: string) => {
    setSelectedFighterId(id);
    setCurrentPage('fighters');
    setSidebarVisible(false);
  }, []);

  const handleSaveFighter = useCallback(async (fighter: Fighter) => {
    await saveFighterWithSnapshot(editingFighter, fighter);
    setSelectedFighterId(fighter.id);
    setShowForm(false);
    setEditingFighter(null);
  }, [editingFighter]);

  const handleDeleteFighter = useCallback(async (id: string) => {
    const ok = await confirm({ message: '¿Seguro que querés eliminar este peleador?', danger: true, confirmLabel: 'Eliminar' });
    if (!ok) return;
    try {
      await deleteFighter(id);
      toast('success', 'Peleador eliminado');
      if (selectedFighterId === id) {
        setSelectedFighterId('');
      }
    } catch {
      toast('error', 'Error al eliminar. Intentá de nuevo.');
    }
  }, [selectedFighterId, toast, confirm]);

  const handleOpenAddModal = useCallback(() => {
    setEditingFighter(null);
    setShowForm(true);
  }, []);

  const handleEditFighter = useCallback((fighter: Fighter) => {
    setEditingFighter(fighter);
    setShowForm(true);
  }, []);

  const handleUpdateFighter = useCallback(async (fighter: Fighter) => {
    const old = fighters.find(f => f.id === fighter.id) || null;
    await saveFighterWithSnapshot(old, fighter);
  }, [fighters]);

  const handleCloseForm = useCallback(() => {
    setShowForm(false);
    setEditingFighter(null);
  }, []);

  if (loadState === 'loading') {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
        <Topbar currentPage={currentPage} onNavigate={handleNavigate} fighters={fighters} onOpenAdmin={() => setShowAdminPanel(true)} />
        <div style={{ flexGrow: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Loader2 size={40} className="animate-spin" style={{ color: 'var(--accent-orange)' }} />
        </div>
        {showAdminPanel && <AdminPanel onClose={() => setShowAdminPanel(false)} />}
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <Topbar currentPage={currentPage} onNavigate={handleNavigate} fighters={fighters} onOpenAdmin={() => setShowAdminPanel(true)} />

      <Suspense fallback={<PageSkeleton />}>
        {currentPage === 'dashboard' && (
          <main className="main-content" style={{ height: 'auto' }}>
            <ErrorBoundary><Dashboard fighters={fighters} onSelectFighter={handleSelectFighter} onNavigate={handleNavigate} /></ErrorBoundary>
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
                <ErrorBoundary>
                  <FighterProfile
                    fighter={selectedFighter}
                    onEditFighter={handleEditFighter}
                    onUpdateFighter={handleUpdateFighter}
                    onDeleteFighter={handleDeleteFighter}
                  />
                </ErrorBoundary>
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
            <ErrorBoundary><Tutorials /></ErrorBoundary>
          </main>
        )}

        {currentPage === 'alianzas' && (
          <main className="main-content" style={{ height: 'auto' }}>
            <ErrorBoundary><SubClubs /></ErrorBoundary>
          </main>
        )}

        {currentPage === 'shop' && (
          <main className="main-content" style={{ height: 'auto' }}>
            <ErrorBoundary><Shop /></ErrorBoundary>
          </main>
        )}

        {currentPage === 'clubinfo' && (
          <main className="main-content" style={{ height: 'auto' }}>
            <ErrorBoundary><ClubInfoPage fightersCount={fighters.length} coachesCount={fighters.filter(f => f.coachRole === 'monitor' || f.coachRole === 'maestro').length} /></ErrorBoundary>
          </main>
        )}
      </Suspense>

      {showForm && (
        <FighterForm
          fighter={editingFighter}
          onSave={handleSaveFighter}
          onClose={handleCloseForm}
        />
      )}

      {showAdminPanel && <AdminPanel onClose={() => setShowAdminPanel(false)} />}
    </div>
  );
};

export default function App() {
  return (
    <AuthProvider>
      <ToastProvider>
        <ConfirmProvider>
          <AppContent />
        </ConfirmProvider>
      </ToastProvider>
    </AuthProvider>
  );
}
