import type { DisciplineKey } from '../types/mma';
import { getBeltColor, getBeltLabel } from '../utils/belts';

interface BeltVisualProps {
  discipline: DisciplineKey;
  rank: string;
  size?: number;
}

export const BeltVisual: React.FC<BeltVisualProps> = ({ discipline, rank, size = 28 }) => {
  const color = getBeltColor(discipline, rank);
  const label = getBeltLabel(rank);

  if (discipline === 'muaythai') {
    const stripeColor = rank.includes('Rojo') ? '#dc2626' : rank.includes('Amarillo') ? '#eab308' : color;
    return (
      <svg width={size} height={size * 0.6} viewBox="0 0 40 24" style={{ display: 'block' }}>
        <rect x="0" y="4" width="40" height="16" rx="3" fill={color} stroke={stripeColor} strokeWidth="1.5" />
        <line x1="20" y1="4" x2="20" y2="20" stroke={stripeColor} strokeWidth="2.5" />
        <title>{rank}</title>
      </svg>
    );
  }

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
      <svg width={size} height={size * 0.45} viewBox="0 0 40 18" style={{ display: 'block' }}>
        <rect x="0" y="2" width="40" height="14" rx="2" fill={color} stroke="rgba(255,255,255,0.15)" strokeWidth="0.5" />
        <title>{rank}</title>
      </svg>
      <span style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase' }}>
        {label}
      </span>
    </div>
  );
};
