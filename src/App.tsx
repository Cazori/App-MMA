import { useState, useCallback, useEffect } from 'react';
import type { Fighter } from './types/mma';
import { getFighters, saveFighter, deleteFighter } from './services/storage';
import { FighterList } from './components/FighterList';
import { FighterProfile } from './components/FighterProfile';
import { FighterForm } from './components/FighterForm';
import { Menu, Shield } from 'lucide-react';

export default function App() {
  const [fighters, setFighters] = useState<Fighter[]>(() => getFighters());
  const [selectedFighterId, setSelectedFighterId] = useState<string>('');
  const [showForm, setShowForm] = useState(false);
  const [editingFighter, setEditingFighter] = useState<Fighter | null>(null);
  const [sidebarVisible, setSidebarVisible] = useState(true);

  useEffect(() => {
    if (!selectedFighterId && fighters.length > 0) {
      setSelectedFighterId(fighters[0].id);
    }
  }, [fighters, selectedFighterId]);

  const selectedFighter = fighters.find((f) => f.id === selectedFighterId) || null;

  const handleSaveFighter = useCallback((fighter: Fighter) => {
    const updated = saveFighter(fighter);
    setFighters(updated);
    setSelectedFighterId(fighter.id);
    setShowForm(false);
    setEditingFighter(null);
  }, []);

  const handleDeleteFighter = useCallback((id: string) => {
    if (!window.confirm('¿Seguro que querés eliminar este peleador?')) return;
    const updated = deleteFighter(id);
    setFighters(updated);
    if (selectedFighterId === id) {
      setSelectedFighterId(updated.length > 0 ? updated[0].id : '');
    }
  }, [selectedFighterId]);

  const handleSelectFighter = useCallback((id: string) => {
    setSelectedFighterId(id);
    setSidebarVisible(false);
  }, []);

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

  return (
    <div className="app-container">
      {/* Mobile Header */}
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
        <Shield size={20} style={{ color: 'var(--accent-red)' }} />
      </div>

      {/* Sidebar */}
      <aside className={`sidebar${sidebarVisible ? '' : ' hidden-mobile'}`}>
        <FighterList
          fighters={fighters}
          selectedFighterId={selectedFighterId}
          onSelectFighter={handleSelectFighter}
          onOpenAddModal={handleOpenAddModal}
        />
      </aside>

      {/* Main Content */}
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

      {/* Fighter Form Modal */}
      {showForm && (
        <FighterForm
          fighter={editingFighter}
          onSave={handleSaveFighter}
          onClose={handleCloseForm}
        />
      )}
    </div>
  );
}
