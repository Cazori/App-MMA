import type { SubClub } from '../types/mma';
import { Clock } from 'lucide-react';
import { bjjLogo, kickLogo, thaiLogo } from '../services/clubData';

interface SubClubCardProps {
  subClub: SubClub;
}

const LOGO_MAP: Record<string, string> = {
  bjj: bjjLogo,
  kickboxing: kickLogo,
  muaythai: thaiLogo,
};

export const SubClubCard: React.FC<SubClubCardProps> = ({ subClub }) => {
  const logoSrc = LOGO_MAP[subClub.discipline];

  return (
    <div
      style={{
        padding: '20px',
        borderRadius: '16px',
        display: 'flex',
        flexDirection: 'column',
        gap: '12px',
        background: `linear-gradient(135deg, rgba(255,255,255,0.02) 0%, rgba(255,255,255,0.01) 100%)`,
        border: '1px solid rgba(255,255,255,0.04)',
        borderLeft: `4px solid ${subClub.color}`,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
        {logoSrc && (
          <img src={logoSrc} alt={subClub.name} style={{ width: '28px', height: '28px', objectFit: 'contain' }} />
        )}
        <h4 style={{ fontSize: '0.95rem', color: '#fff', fontWeight: 700 }}>
          {subClub.name}
        </h4>
      </div>
      <p style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', lineHeight: '1.5' }}>
        {subClub.description}
      </p>
      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.78rem', color: subClub.color, fontWeight: 600 }}>
        <Clock size={13} />
        {subClub.schedule}
      </div>
    </div>
  );
};
