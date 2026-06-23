import { CLUB_INFO, SUB_CLUBS, bjjLogo, kickLogo, thaiLogo } from '../services/clubData';
import { Shield, MapPin, Phone, Calendar, Globe, Users, Award, Target, Eye, Clock } from 'lucide-react';

const LOGO_MAP: Record<string, string> = {
  bjj: bjjLogo,
  kickboxing: kickLogo,
  muaythai: thaiLogo,
};

const SOCIAL_LINKS = [
  { label: 'Asociación Colombiana de Kick Boxing', url: 'https://www.instagram.com/asociaciondekickboxingcolombia/' },
  { label: 'Guerreros de Dios Oficial', url: 'https://www.instagram.com/guerrerosdedios.oficial/' },
  { label: 'Brazilian Jiu-Jitsu Cali', url: 'https://www.instagram.com/brazilianjiujitsucali/' },
];

interface ClubInfoPageProps {
  fightersCount?: number;
  coachesCount?: number;
}

export const ClubInfoPage: React.FC<ClubInfoPageProps> = ({ fightersCount = 0, coachesCount = 0 }) => {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '28px' }}>
      <div>
        <h1 style={{ fontSize: '1.8rem', color: '#fff', fontWeight: 800, letterSpacing: '-0.02em' }}>
          Información del Club
        </h1>
        <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', marginTop: '4px' }}>
          {CLUB_INFO.name} — {CLUB_INFO.tagline}
        </p>
      </div>

      <div className="glass-panel" style={{ padding: '32px', borderRadius: '24px', display: 'flex', flexDirection: 'column', gap: '24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px', borderBottom: '1px solid var(--border-color)', paddingBottom: '20px' }}>
          <Shield size={48} style={{ color: 'var(--accent-orange)' }} />
          <div>
            <h2 style={{ fontSize: '1.5rem', color: '#fff', fontWeight: 800 }}>
              {CLUB_INFO.name.toUpperCase()}
            </h2>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
              {CLUB_INFO.tagline}
            </p>
          </div>
        </div>

        {/* Stats row */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', gap: '12px' }}>
          <div className="glass-card" style={{ padding: '16px', textAlign: 'center' }}>
            <Users size={20} style={{ color: 'var(--accent-bjj)', marginBottom: '4px' }} />
            <p style={{ fontSize: '1.3rem', fontWeight: 800, color: '#fff' }}>{fightersCount}</p>
            <p style={{ fontSize: '0.65rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700 }}>Miembros</p>
          </div>
          <div className="glass-card" style={{ padding: '16px', textAlign: 'center' }}>
            <Award size={20} style={{ color: 'var(--accent-gold)', marginBottom: '4px' }} />
            <p style={{ fontSize: '1.3rem', fontWeight: 800, color: '#fff' }}>{fightersCount}</p>
            <p style={{ fontSize: '0.65rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700 }}>Peleadores</p>
          </div>
          <div className="glass-card" style={{ padding: '16px', textAlign: 'center' }}>
            <Shield size={20} style={{ color: 'var(--accent-orange)', marginBottom: '4px' }} />
            <p style={{ fontSize: '1.3rem', fontWeight: 800, color: '#fff' }}>{coachesCount}</p>
            <p style={{ fontSize: '0.65rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700 }}>Coaches</p>
          </div>
          <div className="glass-card" style={{ padding: '16px', textAlign: 'center' }}>
            <Calendar size={20} style={{ color: 'var(--accent-muaythai)', marginBottom: '4px' }} />
            <p style={{ fontSize: '1.3rem', fontWeight: 800, color: '#fff' }}>{CLUB_INFO.foundedYear}</p>
            <p style={{ fontSize: '0.65rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700 }}>Fundación</p>
          </div>
        </div>

        {/* Mission & Vision */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
          <div style={{ padding: '20px', background: 'rgba(255,255,255,0.02)', borderRadius: '14px', border: '1px solid var(--border-color)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px', color: 'var(--accent-bjj)' }}>
              <Target size={18} />
              <span style={{ fontWeight: 700, textTransform: 'uppercase', fontSize: '0.8rem' }}>Misión</span>
            </div>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: '1.5' }}>{CLUB_INFO.mission}</p>
          </div>
          <div style={{ padding: '20px', background: 'rgba(255,255,255,0.02)', borderRadius: '14px', border: '1px solid var(--border-color)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px', color: 'var(--accent-gold)' }}>
              <Eye size={18} />
              <span style={{ fontWeight: 700, textTransform: 'uppercase', fontSize: '0.8rem' }}>Visión</span>
            </div>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: '1.5' }}>{CLUB_INFO.vision}</p>
          </div>
        </div>

        {/* Contact Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '20px' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <h4 style={{ fontSize: '0.85rem', color: '#fff', fontWeight: 700, marginBottom: '4px', textTransform: 'uppercase' }}>
              Contacto
            </h4>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
              <MapPin size={16} style={{ color: 'var(--accent-orange)' }} />
              <span>Calle 13 #23A90, Santiago de Cali, Colombia</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
              <Phone size={16} style={{ color: 'var(--accent-orange)' }} />
              <span>+57 312 8160660</span>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <h4 style={{ fontSize: '0.85rem', color: '#fff', fontWeight: 700, marginBottom: '4px', textTransform: 'uppercase' }}>
              Redes Sociales
            </h4>
            {SOCIAL_LINKS.map((link, i) => (
              <a key={i} href={link.url} target="_blank" rel="noopener noreferrer"
                style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '0.85rem', color: 'var(--text-secondary)', textDecoration: 'none' }}>
                <Globe size={16} style={{ color: 'var(--accent-gold)' }} />
                {link.label}
              </a>
            ))}
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <h4 style={{ fontSize: '0.85rem', color: '#fff', fontWeight: 700, marginBottom: '4px', textTransform: 'uppercase' }}>
              Logros
            </h4>
            {CLUB_INFO.achievements.map((a, i) => (
              <p key={i} style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Award size={14} style={{ color: 'var(--accent-gold)' }} />
                {a}
              </p>
            ))}
          </div>
        </div>
      </div>

      {/* Sub-clubs Section */}
      <h3 style={{ fontSize: '1.2rem', color: '#fff', fontWeight: 700, marginTop: '8px' }}>
        Nuestras Alianzas
      </h3>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '20px' }}>
        {SUB_CLUBS.map((sc) => {
          const logoSrc = LOGO_MAP[sc.discipline];
          return (
            <div key={sc.id} className="glass-card" style={{
              padding: '20px',
              borderLeft: `3px solid ${sc.color}`,
              display: 'flex',
              flexDirection: 'column',
              gap: '10px',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                {logoSrc && (
                  <img src={logoSrc} alt={sc.name} style={{ width: '32px', height: '32px', objectFit: 'contain' }} />
                )}
                <h4 style={{ fontSize: '0.95rem', color: '#fff', fontWeight: 700 }}>
                  {sc.name}
                </h4>
              </div>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', lineHeight: '1.5' }}>
                {sc.description}
              </p>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.8rem', color: sc.color, fontWeight: 600 }}>
                <Clock size={14} />
                {sc.schedule}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
