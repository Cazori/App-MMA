import type { PageKey } from './Topbar';
import type { Fighter, Payment } from '../types/mma';
import { SUB_CLUBS, TUTORIALS, ALERTS, CLUB_INFO, bjjLogo, kickLogo, thaiLogo } from '../services/clubData';
import { FighterCard } from './FighterCard';
import { SubClubCard } from './SubClubCard';
import { TutorialCard } from './TutorialCard';
import { Calendar, Bell, MapPin, Phone, Mail, Globe, AtSign, Shield, DollarSign, Loader2 } from 'lucide-react';
import { useState, useEffect, useMemo } from 'react';
import { subscribeAllPayments } from '../services/storage';
import { computeMembershipStatus } from '../utils/payments';

interface DashboardProps {
  fighters: Fighter[];
  onSelectFighter: (id: string) => void;
  onNavigate: (page: PageKey) => void;
}

const DAY_SCHEDULE = [
  { day: 'Lunes', sessions: ['Kick Boxing - 6PM', 'Muay Thai - 7PM'] },
  { day: 'Martes', sessions: ['BJJ Gi/No-Gi - 6PM'] },
  { day: 'Miércoles', sessions: ['Kick Boxing - 6PM', 'Muay Thai - 7PM'] },
  { day: 'Jueves', sessions: ['BJJ Gi/No-Gi - 6PM'] },
  { day: 'Viernes', sessions: ['Kick Boxing - 6PM', 'Muay Thai - 7PM'] },
  { day: 'Sábado', sessions: ['Mixtas / MMA - 9AM'] },
  { day: 'Domingo', sessions: ['Descanso'] },
];

export const Dashboard: React.FC<DashboardProps> = ({ fighters, onSelectFighter, onNavigate }) => {
  // ── Payment widget state ────────────────────────────────────────────
  const [payments, setPayments] = useState<Payment[]>([]);
  const [payLoading, setPayLoading] = useState(true);
  const [payError, setPayError] = useState(false);
  const [payRetry, setPayRetry] = useState(0);

  useEffect(() => {
    setPayLoading(true);
    setPayError(false);
    const unsub = subscribeAllPayments((list) => {
      setPayments(list);
      setPayLoading(false);
    }, () => {
      setPayError(true);
      setPayLoading(false);
    });
    return unsub;
  }, [payRetry]);

  // Memoize membership counts per fighter
  const payCounts = useMemo(() => {
    let active = 0, expired = 0, pending = 0;
    for (const f of fighters) {
      const fPayments = payments.filter(
        p => p.fighterId === f.id && p.status !== 'cancelled' && p.coverageEnd != null
      );
      const status = computeMembershipStatus(fPayments);
      if (status === 'active') active++;
      else if (status === 'expired') expired++;
      else pending++;
    }
    return { active, expired, pending };
  }, [fighters, payments]);

  const hasFighters = fighters.length > 0;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
      <div>
        <h1 style={{ fontSize: '1.8rem', color: '#fff', fontWeight: 800, letterSpacing: '-0.02em' }}>
          Dashboard
        </h1>
        <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', marginTop: '4px' }}>
          Panel de control de la alianza Guerreros de Dios MMA
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '24px' }}>

        {/* Widget: Pagos — No period selector, membership status counts */}
        <div className="glass-panel" style={{ padding: '24px', borderRadius: '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <h3 style={{ fontSize: '1.1rem', color: '#fff', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '8px' }}>
              <DollarSign size={18} style={{ color: 'var(--accent-orange)' }} />
              Membresías
            </h3>
            <button
              onClick={() => onNavigate('pagos')}
              className="btn btn-secondary"
              style={{ padding: '6px 14px', fontSize: '0.75rem' }}
            >
              Ver todos
            </button>
          </div>

          {payError && (
            <button
              onClick={() => setPayRetry(c => c + 1)}
              className="btn btn-secondary"
              style={{ fontSize: '0.7rem', padding: '4px 8px', marginBottom: '12px' }}
            >
              Error al cargar. Toca para reintentar.
            </button>
          )}

          {payLoading ? (
            <div style={{ display: 'flex', justifyContent: 'center', padding: '20px' }}>
              <Loader2 size={24} className="animate-spin" style={{ color: 'var(--text-muted)' }} />
            </div>
          ) : !hasFighters ? (
            <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', textAlign: 'center', padding: '12px' }}>
              No hay luchadores registrados
            </p>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
              {[
                { label: 'Activos', value: payCounts.active, color: 'var(--color-success)', bg: 'rgba(16,185,129,0.1)' },
                { label: 'Expirados', value: payCounts.expired, color: 'var(--color-danger)', bg: 'rgba(239,68,68,0.1)' },
                { label: 'Sin membresía', value: payCounts.pending, color: 'var(--text-muted)', bg: 'rgba(255,255,255,0.03)' },
              ].map((c) => (
                <div key={c.label} style={{
                  padding: '14px 12px',
                  borderRadius: '12px',
                  background: c.bg,
                  textAlign: 'center',
                  border: `1px solid ${c.color}20`,
                }}>
                  <p style={{ fontSize: '0.65rem', color: 'var(--text-secondary)', textTransform: 'uppercase', fontWeight: 700, letterSpacing: '0.03em' }}>{c.label}</p>
                  <p style={{ fontSize: '1.4rem', fontWeight: 800, color: c.color, marginTop: '4px' }}>{c.value}</p>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Widget: Atletas */}
        <div className="glass-panel" style={{ padding: '24px', borderRadius: '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            <h3 style={{ fontSize: '1.1rem', color: '#fff', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Shield size={18} style={{ color: 'var(--accent-orange)' }} />
              Atletas
            </h3>
            <button
              onClick={() => onNavigate('fighters')}
              className="btn btn-secondary"
              style={{ padding: '6px 14px', fontSize: '0.75rem' }}
            >
              Ver todos
            </button>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '14px' }}>
            {fighters.slice(0, 4).map((f) => (
              <FighterCard key={f.id} fighter={f} onSelect={onSelectFighter} />
            ))}
          </div>
        </div>

        {/* Widget: Horario Semanal */}
        <div className="glass-panel" style={{ padding: '24px', borderRadius: '20px', gridColumn: 'span 1' }}>
          <h3 style={{ fontSize: '1.1rem', color: '#fff', fontWeight: 700, marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Calendar size={18} style={{ color: 'var(--accent-gold)' }} />
            Horario Semanal
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {DAY_SCHEDULE.map((d) => (
              <div key={d.day} style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '8px 12px',
                borderRadius: '8px',
                background: d.day === 'Domingo' ? 'rgba(255,255,255,0.02)' : 'rgba(255,255,255,0.03)',
                fontSize: '0.78rem',
              }}>
                <span style={{ color: '#fff', fontWeight: 700, minWidth: '80px' }}>{d.day}</span>
                <span style={{ color: d.sessions[0] === 'Descanso' ? 'var(--text-muted)' : 'var(--text-secondary)', textAlign: 'right' }}>
                  {d.sessions.join(' · ')}
                </span>
              </div>
            ))}
          </div>
          <div style={{ marginTop: '14px', display: 'flex', gap: '8px', alignItems: 'center', justifyContent: 'center' }}>
            <img src={kickLogo} style={{ width: '22px', height: '22px', objectFit: 'contain' }} />
            <img src={thaiLogo} style={{ width: '22px', height: '22px', objectFit: 'contain' }} />
            <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Lun-Mie-Vie</span>
            <span style={{ color: 'var(--text-muted)' }}>·</span>
            <img src={bjjLogo} style={{ width: '22px', height: '22px', objectFit: 'contain' }} />
            <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Mar-Jue</span>
            <span style={{ color: 'var(--text-muted)' }}>·</span>
            <span style={{ fontSize: '0.7rem', color: 'var(--accent-gold)', fontWeight: 700 }}>Sáb Mixtas</span>
          </div>
        </div>

        {/* Widget: Clubs */}
        <div className="glass-panel" style={{ padding: '24px', borderRadius: '20px', gridColumn: 'span 1' }}>
          <h3 style={{ fontSize: '1.1rem', color: '#fff', fontWeight: 700, marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Bell size={18} style={{ color: 'var(--accent-bjj)' }} />
            Clubs
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {SUB_CLUBS.map((sc) => (
              <SubClubCard key={sc.id} subClub={sc} />
            ))}
          </div>
        </div>

        {/* Widget: Tutorials */}
        <div className="glass-panel" style={{ padding: '24px', borderRadius: '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            <h3 style={{ fontSize: '1.1rem', color: '#fff', fontWeight: 700 }}>
              Tutoriales
            </h3>
            <button
              onClick={() => onNavigate('tutorials')}
              className="btn btn-secondary"
              style={{ padding: '6px 14px', fontSize: '0.75rem' }}
            >
              Ver todos
            </button>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '14px' }}>
            {TUTORIALS.slice(0, 3).map((t) => (
              <TutorialCard key={t.id} tutorial={t} />
            ))}
          </div>
        </div>

        {/* Widget: Club Info */}
        <div className="glass-panel" style={{ padding: '24px', borderRadius: '20px', gridColumn: 'span 1' }}>
          <h3 style={{ fontSize: '1.1rem', color: '#fff', fontWeight: 700, marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <MapPin size={18} style={{ color: 'var(--accent-orange)' }} />
            Info del Club
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <MapPin size={14} style={{ color: 'var(--accent-orange)' }} />
              {CLUB_INFO.address}, {CLUB_INFO.city}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Phone size={14} style={{ color: 'var(--accent-orange)' }} />
              {CLUB_INFO.phone[0]}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Mail size={14} style={{ color: 'var(--accent-orange)' }} />
              {CLUB_INFO.email}
            </div>
            <div style={{ display: 'flex', gap: '12px', marginTop: '8px', flexWrap: 'wrap' }}>
              <span style={{ color: 'var(--accent-gold)', display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.75rem' }}>
                <AtSign size={12} /> {CLUB_INFO.socialMedia.instagram}
              </span>
              <span style={{ color: 'var(--accent-gold)', display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.75rem' }}>
                <Globe size={12} /> {CLUB_INFO.socialMedia.facebook}
              </span>
            </div>
          </div>
        </div>

        {/* Widget: Alerts */}
        <div className="glass-panel" style={{ padding: '24px', borderRadius: '20px', gridColumn: 'span 1' }}>
          <h3 style={{ fontSize: '1.1rem', color: '#fff', fontWeight: 700, marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Bell size={18} style={{ color: 'var(--accent-gold)' }} />
            Eventos y Alertas
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {ALERTS.map((a) => {
              return (
                <div key={a.id} className="glass-card" style={{
                  padding: '14px',
                  borderLeft: `3px solid ${a.color}`,
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '4px',
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '0.85rem', color: '#fff', fontWeight: 700 }}>{a.title}</span>
                    <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: 600 }}>{a.date}</span>
                  </div>
                  <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', lineHeight: '1.3' }}>
                    {a.subtitle}
                  </p>
                </div>
              );
            })}
          </div>
        </div>

      </div>
    </div>
  );
};
