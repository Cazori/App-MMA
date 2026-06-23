import { SUB_CLUBS, bjjLogo, kickLogo, thaiLogo } from '../services/clubData';
import { Clock } from 'lucide-react';

const LOGO_MAP: Record<string, string> = {
  bjj: bjjLogo,
  kickboxing: kickLogo,
  muaythai: thaiLogo,
};

export const SubClubs: React.FC = () => {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '28px' }}>
      <div>
        <h1 style={{ fontSize: '1.8rem', color: '#fff', fontWeight: 800, letterSpacing: '-0.02em' }}>
          Alianzas
        </h1>
        <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', marginTop: '4px' }}>
          Las disciplinas que forman nuestra alianza
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(380px, 1fr))', gap: '24px' }}>
        {SUB_CLUBS.map((sc) => {
          const logoSrc = LOGO_MAP[sc.discipline];
          return (
            <div key={sc.id} className="glass-panel" style={{
              padding: '32px',
              borderRadius: '24px',
              position: 'relative',
              overflow: 'hidden',
            }}>
              {logoSrc && (
                <img src={logoSrc} alt=""
                  style={{
                    position: 'absolute',
                    bottom: '-30px',
                    right: '-30px',
                    width: '180px',
                    height: '180px',
                    objectFit: 'contain',
                    opacity: 0.06,
                    pointerEvents: 'none',
                    zIndex: 0,
                  }}
                />
              )}
              <div style={{ position: 'relative', zIndex: 1, display: 'flex', flexDirection: 'column', gap: '14px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                  {logoSrc && (
                    <img src={logoSrc} alt={sc.name} style={{ width: '48px', height: '48px', objectFit: 'contain' }} />
                  )}
                  <h2 style={{ fontSize: '1.3rem', color: '#fff', fontWeight: 800 }}>
                    {sc.name}
                  </h2>
                </div>

                <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: '1.6' }}>
                  {sc.description}
                </p>

                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.85rem', color: sc.color, fontWeight: 600 }}>
                  <Clock size={16} />
                  {sc.schedule}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
