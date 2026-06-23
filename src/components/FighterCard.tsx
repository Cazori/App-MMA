import type { Fighter, Disciplines } from '../types/mma';
import { BeltVisual } from './BeltVisual';
import { Trophy } from 'lucide-react';

interface FighterCardProps {
  fighter: Fighter;
  onSelect: (id: string) => void;
}

const ACTIVE_DISCIPLINES: { key: keyof Disciplines; label: string }[] = [
  { key: 'bjj', label: 'BJJ' },
  { key: 'kickboxing', label: 'Kick' },
  { key: 'muaythai', label: 'Muay' },
];

export const FighterCard: React.FC<FighterCardProps> = ({ fighter, onSelect }) => {
  return (
    <div
      onClick={() => onSelect(fighter.id)}
      className="glass-card"
      style={{
        padding: '20px',
        cursor: 'pointer',
        display: 'flex',
        flexDirection: 'column',
        gap: '12px',
      }}
    >
      {/* Photo + Name Row */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
        <img
          src={fighter.photoUrl}
          alt={fighter.name}
          style={{
            width: '56px',
            height: '56px',
            borderRadius: '50%',
            objectFit: 'cover',
            border: '2px solid var(--accent-orange)',
          }}
          onError={(e) => {
            (e.target as HTMLImageElement).src = `https://api.dicebear.com/7.x/bottts/svg?seed=${fighter.name}`;
          }}
        />
        <div style={{ flexGrow: 1, overflow: 'hidden' }}>
          <h4 style={{ fontSize: '0.9rem', color: '#fff', fontWeight: 700, whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden' }}>
            {fighter.name}
          </h4>
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginTop: '2px' }}>
            <Trophy size={12} style={{ color: 'var(--accent-gold)' }} />
            <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', fontWeight: 600 }}>
              {fighter.primaryStyle}
            </span>
          </div>
        </div>
      </div>

      {/* Active Disciplines Tags */}
      <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
        {ACTIVE_DISCIPLINES.map((disc) => {
          const data = fighter.disciplines[disc.key];
          if (!data.active) return null;
          return (
            <div
              key={disc.key}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                padding: '3px 10px',
                borderRadius: '999px',
                fontSize: '0.65rem',
                fontWeight: 700,
                textTransform: 'uppercase',
                background: 'rgba(255,255,255,0.04)',
                border: '1px solid rgba(255,255,255,0.08)',
                color: 'var(--text-secondary)',
              }}
            >
              <BeltVisual discipline={disc.key} rank={data.rank} size={20} />
              <span>{disc.label}</span>
            </div>
          );
        })}
        {!fighter.disciplines.bjj.active && !fighter.disciplines.kickboxing.active && !fighter.disciplines.muaythai.active && (
          <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>
            Sin disciplinas activas
          </span>
        )}
      </div>
    </div>
  );
};
