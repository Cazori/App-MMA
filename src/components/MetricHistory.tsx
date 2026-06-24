import React, { useState, useMemo } from 'react';
import type { MetricSnapshot } from '../types/mma';
import { History, Plus, X, TrendingUp, TrendingDown, Calendar } from 'lucide-react';

interface MetricHistoryProps {
  snapshots: MetricSnapshot[];
  onAddSnapshot: (snapshot: MetricSnapshot) => void;
  isEditor: boolean;
}

const periodOptions = [
  { label: '1 semana', days: 7 },
  { label: '1 mes', days: 30 },
  { label: '3 meses', days: 90 },
] as const;

const deltaColor = (cur: number, prev: number, field: string): { color: string; icon: React.ReactNode } => {
  const diff = cur - prev;
  if (diff === 0) return { color: 'var(--text-muted)', icon: <span style={{ width: 12 }} /> };
  const better = ['restingHR', 'activeHR', 'recoveryRate'].includes(field) ? diff < 0 : diff > 0;
  return {
    color: better ? 'var(--color-success)' : 'var(--color-danger)',
    icon: diff > 0 ? <TrendingUp size={14} /> : <TrendingDown size={14} />,
  };
};

const snapValue = (s: MetricSnapshot, field: string): number | undefined => {
  if (field === 'weight') return s.weight;
  if (field === 'height') return s.height;
  if (field === 'restingHR') return s.restingHR;
  if (field === 'activeHR') return s.activeHR;
  if (field === 'recoveryRate') return s.recoveryRate;
  return undefined;
};

const snapUnit = (field: string): string => {
  if (field === 'weight') return ' kg';
  if (field === 'height') return ' cm';
  return '';
};

const metricsConfig: { key: string; label: string }[] = [
  { key: 'weight', label: 'Peso' },
  { key: 'height', label: 'Altura' },
  { key: 'restingHR', label: 'FC Reposo' },
  { key: 'activeHR', label: 'FC Actividad' },
  { key: 'recoveryRate', label: 'Recuperación' },
];

export const MetricHistory: React.FC<MetricHistoryProps> = ({ snapshots, onAddSnapshot, isEditor }) => {
  const [showForm, setShowForm] = useState(false);
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [weight, setWeight] = useState('');
  const [height, setHeight] = useState('');
  const [restingHR, setRestingHR] = useState('');
  const [activeHR, setActiveHR] = useState('');
  const [recoveryRate, setRecoveryRate] = useState('');
  const [note, setNote] = useState('');
  const [periodIdx, setPeriodIdx] = useState(1); // default 1 mes
  const [customDate, setCustomDate] = useState('');

  const sorted = useMemo(() => [...snapshots].sort((a, b) => b.date.localeCompare(a.date)), [snapshots]);

  const latest = sorted[0];

  const periodDate = useMemo(() => {
    if (customDate) return customDate;
    const d = new Date();
    d.setDate(d.getDate() - periodOptions[periodIdx].days);
    return d.toISOString().slice(0, 10);
  }, [periodIdx, customDate]);

  // Find the closest snapshot on or before periodDate
  const previous = useMemo(() => {
    if (!sorted.length) return null;
    for (const s of sorted) {
      if (s.date <= periodDate) return s;
    }
    return sorted[sorted.length - 1];
  }, [periodDate, sorted]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const snapshot: MetricSnapshot = { date };
    if (weight) snapshot.weight = Number(weight);
    if (height) snapshot.height = Number(height);
    if (restingHR) snapshot.restingHR = Number(restingHR);
    if (activeHR) snapshot.activeHR = Number(activeHR);
    if (recoveryRate) snapshot.recoveryRate = Number(recoveryRate);
    if (note) snapshot.note = note;
    onAddSnapshot(snapshot);
    setWeight('');
    setHeight('');
    setRestingHR('');
    setActiveHR('');
    setRecoveryRate('');
    setNote('');
    setShowForm(false);
  };

  return (
    <div className="glass-panel" style={{ padding: '24px', borderRadius: '20px' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border-color)', paddingBottom: '12px', marginBottom: '16px' }}>
        <h3 style={{ fontSize: '1.1rem', color: '#fff', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <History size={18} style={{ color: 'var(--accent-orange)' }} />
          Historial de Métricas
        </h3>
        {isEditor && (
          <button onClick={() => setShowForm(!showForm)} className="btn btn-secondary" style={{ padding: '8px 14px', fontSize: '0.8rem' }}>
            {showForm ? <X size={14} /> : <Plus size={14} />}
            {showForm ? ' Cancelar' : ' Registrar'}
          </button>
        )}
      </div>

      {/* Manual recording form */}
      {isEditor && showForm && (
        <form onSubmit={handleSubmit} style={{ marginBottom: '20px', padding: '16px', background: 'rgba(255,255,255,0.02)', borderRadius: '14px', border: '1px solid var(--border-color)' }}>
          <p style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', marginBottom: '12px', fontWeight: 600 }}>Registrar medición manual</p>
          <div style={{ display: 'flex', gap: '8px', marginBottom: '12px', flexWrap: 'wrap', alignItems: 'flex-end' }}>
            <div style={{ flex: '1 1 140px' }}>
              <label style={{ fontSize: '0.65rem', color: 'var(--text-muted)', display: 'block', marginBottom: '2px' }}>Fecha</label>
              <input type="date" value={date} onChange={e => setDate(e.target.value)} className="form-input" style={{ fontSize: '0.78rem', width: '100%' }} />
            </div>
            <div style={{ flex: '0 1 80px' }}>
              <label style={{ fontSize: '0.65rem', color: 'var(--text-muted)', display: 'block', marginBottom: '2px' }}>Peso kg</label>
              <input type="number" step="0.1" value={weight} onChange={e => setWeight(e.target.value)} placeholder="—" className="form-input" style={{ fontSize: '0.78rem', width: '100%' }} />
            </div>
            <div style={{ flex: '0 1 80px' }}>
              <label style={{ fontSize: '0.65rem', color: 'var(--text-muted)', display: 'block', marginBottom: '2px' }}>Altura cm</label>
              <input type="number" step="0.1" value={height} onChange={e => setHeight(e.target.value)} placeholder="—" className="form-input" style={{ fontSize: '0.78rem', width: '100%' }} />
            </div>
            <div style={{ flex: '0 1 80px' }}>
              <label style={{ fontSize: '0.65rem', color: 'var(--text-muted)', display: 'block', marginBottom: '2px' }}>FC Reposo</label>
              <input type="number" value={restingHR} onChange={e => setRestingHR(e.target.value)} placeholder="—" className="form-input" style={{ fontSize: '0.78rem', width: '100%' }} />
            </div>
            <div style={{ flex: '0 1 80px' }}>
              <label style={{ fontSize: '0.65rem', color: 'var(--text-muted)', display: 'block', marginBottom: '2px' }}>FC Actividad</label>
              <input type="number" value={activeHR} onChange={e => setActiveHR(e.target.value)} placeholder="—" className="form-input" style={{ fontSize: '0.78rem', width: '100%' }} />
            </div>
            <div style={{ flex: '0 1 90px' }}>
              <label style={{ fontSize: '0.65rem', color: 'var(--text-muted)', display: 'block', marginBottom: '2px' }}>Recuperación</label>
              <input type="number" value={recoveryRate} onChange={e => setRecoveryRate(e.target.value)} placeholder="—" className="form-input" style={{ fontSize: '0.78rem', width: '100%' }} />
            </div>
          </div>
          <div style={{ display: 'flex', gap: '8px' }}>
            <input type="text" value={note} onChange={e => setNote(e.target.value)} placeholder="Nota opcional (ej: pesaje pre-pelea)" className="form-input" style={{ fontSize: '0.78rem', flex: 1 }} />
            <button type="submit" className="btn btn-primary" style={{ padding: '8px 16px', fontSize: '0.78rem', flexShrink: 0 }}>
              Guardar
            </button>
          </div>
        </form>
      )}

      {/* Comparison section */}
      {sorted.length >= 2 && (
        <>
          {/* Period selector */}
          <div style={{ display: 'flex', gap: '6px', marginBottom: '16px', flexWrap: 'wrap', alignItems: 'center' }}>
            <span style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', marginRight: '4px' }}>Comparar vs</span>
            {periodOptions.map((opt, i) => (
              <button
                key={opt.label}
                onClick={() => { setPeriodIdx(i); setCustomDate(''); }}
                style={{
                  padding: '4px 12px', fontSize: '0.75rem', borderRadius: '8px', border: '1px solid',
                  borderColor: periodIdx === i && !customDate ? 'var(--accent-orange)' : 'var(--border-color)',
                  background: periodIdx === i && !customDate ? 'rgba(234,88,12,0.1)' : 'transparent',
                  color: periodIdx === i && !customDate ? 'var(--accent-orange)' : 'var(--text-secondary)',
                  cursor: 'pointer', fontWeight: 600,
                }}
              >
                {opt.label}
              </button>
            ))}
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              <input
                type="date"
                value={customDate}
                onChange={e => setCustomDate(e.target.value)}
                className="form-input"
                style={{
                  fontSize: '0.7rem', padding: '4px 8px', width: '130px',
                  borderColor: customDate ? 'var(--accent-orange)' : 'var(--border-color)',
                }}
                placeholder="Fecha exacta"
              />
              {customDate && (
                <button onClick={() => setCustomDate('')} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: '2px' }}>
                  <X size={12} />
                </button>
              )}
            </div>
          </div>

          {/* Comparison cards */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '10px', marginBottom: '20px' }}>
            {metricsConfig.map(({ key, label }) => {
              const cur = latest ? snapValue(latest, key) : undefined;
              const prev = previous ? snapValue(previous, key) : undefined;
              if (cur === undefined && prev === undefined) return null;
              const unit = snapUnit(key);
              const delta = cur !== undefined && prev !== undefined ? cur - prev : null;

              return (
                <div key={key} style={{
                  background: delta !== null && delta !== 0 ? 'rgba(255,255,255,0.02)' : 'transparent',
                  padding: '12px 10px', borderRadius: '12px',
                  border: delta !== null && delta !== 0 ? `1px solid ${deltaColor(cur!, prev!, key).color}` : '1px solid rgba(255,255,255,0.04)',
                }}>
                  <p style={{ fontSize: '0.6rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700, letterSpacing: '0.05em', marginBottom: '6px' }}>{label}</p>
                  {cur !== undefined ? (
                    <div style={{ display: 'flex', alignItems: 'baseline', gap: '4px' }}>
                      <span style={{ fontSize: '1.2rem', fontWeight: 800, color: '#fff' }}>{cur}{unit}</span>
                    </div>
                  ) : (
                    <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontStyle: 'italic' }}>Sin datos</span>
                  )}
                  {prev !== undefined && cur !== undefined && (
                    <div style={{ marginTop: '4px', fontSize: '0.7rem', color: 'var(--text-secondary)' }}>
                      <span>Antes: {prev}{unit}</span>
                    </div>
                  )}
                  {delta !== null && delta !== 0 && (
                    <div style={{ marginTop: '4px', display: 'flex', alignItems: 'center', gap: '3px', fontSize: '0.75rem', fontWeight: 700, color: deltaColor(cur!, prev!, key).color }}>
                      {deltaColor(cur!, prev!, key).icon}
                      <span>{delta > 0 ? '+' : ''}{delta}{unit}</span>
                    </div>
                  )}
                  {cur !== undefined && prev === undefined && (
                    <p style={{ marginTop: '4px', fontSize: '0.65rem', color: 'var(--text-muted)', fontStyle: 'italic' }}>Primer registro</p>
                  )}
                </div>
              );
            })}
          </div>

          {/* Divider */}
          <div style={{ height: '1px', background: 'var(--border-color)', marginBottom: '16px' }} />
        </>
      )}

      {!sorted.length && (
        <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', textAlign: 'center', padding: '24px 0' }}>
          Todavía no hay registros. Los cambios en métricas se guardan automáticamente.
        </p>
      )}

      {/* Full history table */}
      {sorted.length > 0 && (
        <>
          <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '8px' }}>Todos los registros</p>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.78rem' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border-color)' }}>
                  <th style={{ padding: '6px 10px', textAlign: 'left', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase', fontSize: '0.65rem', letterSpacing: '0.05em' }}>Fecha</th>
                  <th style={{ padding: '6px 10px', textAlign: 'right', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase', fontSize: '0.65rem', letterSpacing: '0.05em' }}>Peso</th>
                  <th style={{ padding: '6px 10px', textAlign: 'right', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase', fontSize: '0.65rem', letterSpacing: '0.05em' }}>Altura</th>
                  <th style={{ padding: '6px 10px', textAlign: 'right', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase', fontSize: '0.65rem', letterSpacing: '0.05em' }}>FC Reposo</th>
                  <th style={{ padding: '6px 10px', textAlign: 'right', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase', fontSize: '0.65rem', letterSpacing: '0.05em' }}>FC Act</th>
                  <th style={{ padding: '6px 10px', textAlign: 'right', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase', fontSize: '0.65rem', letterSpacing: '0.05em' }}>Recup</th>
                  <th style={{ padding: '6px 10px', textAlign: 'left', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase', fontSize: '0.65rem', letterSpacing: '0.05em' }}>Nota</th>
                </tr>
              </thead>
              <tbody>
                {sorted.map((s, idx) => {
                  const prevRow = sorted[idx + 1];
                  const rowBg = idx % 2 === 0 ? 'rgba(255,255,255,0.01)' : 'transparent';
                  return (
                    <tr key={`${s.date}-${idx}`} style={{ borderBottom: '1px solid rgba(255,255,255,0.03)', background: rowBg }}>
                      <td style={{ padding: '8px 10px', whiteSpace: 'nowrap', color: '#fff', fontWeight: 700 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                          <Calendar size={11} style={{ color: 'var(--text-muted)' }} />
                          {new Date(s.date + 'T00:00:00').toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit', year: '2-digit' })}
                        </div>
                      </td>
                      {['weight', 'height', 'restingHR', 'activeHR', 'recoveryRate'].map(field => {
                        const val = snapValue(s, field);
                        const pVal = prevRow ? snapValue(prevRow, field) : undefined;
                        const dc = val !== undefined && pVal !== undefined ? deltaColor(val, pVal, field) : null;
                        const unit = snapUnit(field);
                        return (
                          <td key={field} style={{ padding: '8px 10px', textAlign: 'right', whiteSpace: 'nowrap' }}>
                            {val !== undefined ? (
                              <span style={{ display: 'inline-flex', alignItems: 'center', gap: '3px', color: '#fff', fontWeight: 600 }}>
                                {val}{unit}
                                {dc && <span style={{ color: dc.color, display: 'inline-flex', alignItems: 'center' }}>{dc.icon}</span>}
                              </span>
                            ) : <span style={{ color: 'var(--text-muted)' }}>—</span>}
                          </td>
                        );
                      })}
                      <td style={{ padding: '8px 10px', color: 'var(--text-secondary)', maxWidth: '180px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontStyle: s.note ? 'normal' : 'italic' }}>
                        {s.note || '—'}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            {sorted.length >= 50 && (
              <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textAlign: 'center', marginTop: '12px' }}>
                Máximo 50 registros alcanzado. Los más antiguos se descartan automáticamente.
              </p>
            )}
          </div>
        </>
      )}
    </div>
  );
};
