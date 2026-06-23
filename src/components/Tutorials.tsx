import { useState } from 'react';
import { TUTORIALS } from '../services/clubData';
import { TutorialCard } from './TutorialCard';
import type { DisciplineKey } from '../types/mma';

const FILTERS: { key: DisciplineKey | 'all'; label: string }[] = [
  { key: 'all', label: 'Todos' },
  { key: 'bjj', label: 'BJJ' },
  { key: 'kickboxing', label: 'Kickboxing' },
  { key: 'muaythai', label: 'Muay Thai' },
];

export const Tutorials: React.FC = () => {
  const [filter, setFilter] = useState<DisciplineKey | 'all'>('all');

  const filtered = filter === 'all'
    ? TUTORIALS
    : TUTORIALS.filter((t) => t.discipline === filter);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '28px' }}>
      <div>
        <h1 style={{ fontSize: '1.8rem', color: '#fff', fontWeight: 800, letterSpacing: '-0.02em' }}>
          Tutoriales
        </h1>
        <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', marginTop: '4px' }}>
          Videos técnicos organizados por disciplina
        </p>
      </div>

      {/* Filter Tabs */}
      <div style={{ display: 'flex', gap: '8px' }}>
        {FILTERS.map((f) => (
          <button
            key={f.key}
            onClick={() => setFilter(f.key)}
            className={filter === f.key ? 'btn btn-primary' : 'btn btn-secondary'}
            style={{ padding: '8px 18px', fontSize: '0.8rem' }}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Tutorial Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '20px' }}>
        {filtered.map((t) => (
          <TutorialCard key={t.id} tutorial={t} />
        ))}
      </div>

      {filtered.length === 0 && (
        <p style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '40px 0' }}>
          No hay tutoriales para esta disciplina.
        </p>
      )}
    </div>
  );
};
