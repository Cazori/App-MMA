import React, { useState } from 'react';
import type { MetricSnapshot } from '../types/mma';
import { History, Plus, X, TrendingUp, TrendingDown, Calendar } from 'lucide-react';

interface MetricHistoryProps {
  snapshots: MetricSnapshot[];
  onAddSnapshot: (snapshot: MetricSnapshot) => void;
  isEditor: boolean;
}

const deltaIcon = (cur: number | undefined, prev: number | undefined, field: string): { icon: React.ReactNode; color: string } | null => {
  if (cur === undefined || prev === undefined || cur === prev) return null;
  const diff = cur - prev;
  const better = ['restingHR', 'activeHR', 'recoveryRate'].includes(field) ? diff < 0 : diff > 0;
  const color = better ? 'var(--color-success)' : 'var(--color-danger)';
  const icon = diff > 0 ? <TrendingUp size={12} /> : <TrendingDown size={12} />;
  return { icon, color };
};

export const MetricHistory: React.FC<MetricHistoryProps> = ({ snapshots, onAddSnapshot, isEditor }) => {
  const [showForm, setShowForm] = useState(false);
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [weight, setWeight] = useState('');
  const [height, setHeight] = useState('');
  const [restingHR, setRestingHR] = useState('');
  const [activeHR, setActiveHR] = useState('');
  const [recoveryRate, setRecoveryRate] = useState('');
  const [note, setNote] = useState('');

  const sorted = [...snapshots].sort((a, b) => b.date.localeCompare(a.date));

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
          <div style={{ display: 'flex', gap: '8px', marginBottom: '12px' }}>
            <input type="text" value={note} onChange={e => setNote(e.target.value)} placeholder="Nota opcional (ej: pesaje pre-pelea)" className="form-input" style={{ fontSize: '0.78rem', flex: 1 }} />
            <button type="submit" className="btn btn-primary" style={{ padding: '8px 16px', fontSize: '0.78rem', flexShrink: 0 }}>
              Guardar
            </button>
          </div>
        </form>
      )}

      {sorted.length === 0 ? (
        <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', textAlign: 'center', padding: '24px 0' }}>
          Todavía no hay registros. Los cambios en métricas se guardan automáticamente.
        </p>
      ) : (
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
                const prev = sorted[idx + 1];
                const rowBg = idx % 2 === 0 ? 'rgba(255,255,255,0.01)' : 'transparent';
                return (
                  <tr key={`${s.date}-${idx}`} style={{ borderBottom: '1px solid rgba(255,255,255,0.03)', background: rowBg }}>
                    <td style={{ padding: '8px 10px', whiteSpace: 'nowrap', color: '#fff', fontWeight: 700 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <Calendar size={11} style={{ color: 'var(--text-muted)' }} />
                        {new Date(s.date + 'T00:00:00').toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit', year: '2-digit' })}
                      </div>
                    </td>
                    <td style={{ padding: '8px 10px', textAlign: 'right', whiteSpace: 'nowrap' }}>
                      {s.weight !== undefined ? (
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '3px', color: '#fff', fontWeight: 600 }}>
                          {s.weight} kg
                          {(() => {
                            if (!prev?.weight) return null;
                            const d = deltaIcon(s.weight, prev.weight, 'weight');
                            return d ? <span style={{ color: d.color, display: 'inline-flex', alignItems: 'center' }}>{d.icon}</span> : null;
                          })()}
                        </span>
                      ) : <span style={{ color: 'var(--text-muted)' }}>—</span>}
                    </td>
                    <td style={{ padding: '8px 10px', textAlign: 'right', whiteSpace: 'nowrap' }}>
                      {s.height !== undefined ? (
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '3px', color: '#fff', fontWeight: 600 }}>
                          {s.height} cm
                          {(() => {
                            if (!prev?.height) return null;
                            const d = deltaIcon(s.height, prev.height, 'height');
                            return d ? <span style={{ color: d.color, display: 'inline-flex', alignItems: 'center' }}>{d.icon}</span> : null;
                          })()}
                        </span>
                      ) : <span style={{ color: 'var(--text-muted)' }}>—</span>}
                    </td>
                    <td style={{ padding: '8px 10px', textAlign: 'right', whiteSpace: 'nowrap' }}>
                      {s.restingHR !== undefined ? (
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '3px', color: '#fff', fontWeight: 600 }}>
                          {s.restingHR}
                          {(() => {
                            if (!prev?.restingHR) return null;
                            const d = deltaIcon(s.restingHR, prev.restingHR, 'restingHR');
                            return d ? <span style={{ color: d.color, display: 'inline-flex', alignItems: 'center' }}>{d.icon}</span> : null;
                          })()}
                        </span>
                      ) : <span style={{ color: 'var(--text-muted)' }}>—</span>}
                    </td>
                    <td style={{ padding: '8px 10px', textAlign: 'right', whiteSpace: 'nowrap' }}>
                      {s.activeHR !== undefined ? (
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '3px', color: '#fff', fontWeight: 600 }}>
                          {s.activeHR}
                          {(() => {
                            if (!prev?.activeHR) return null;
                            const d = deltaIcon(s.activeHR, prev.activeHR, 'activeHR');
                            return d ? <span style={{ color: d.color, display: 'inline-flex', alignItems: 'center' }}>{d.icon}</span> : null;
                          })()}
                        </span>
                      ) : <span style={{ color: 'var(--text-muted)' }}>—</span>}
                    </td>
                    <td style={{ padding: '8px 10px', textAlign: 'right', whiteSpace: 'nowrap' }}>
                      {s.recoveryRate !== undefined ? (
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '3px', color: '#fff', fontWeight: 600 }}>
                          {s.recoveryRate}
                          {(() => {
                            if (!prev?.recoveryRate) return null;
                            const d = deltaIcon(s.recoveryRate, prev.recoveryRate, 'recoveryRate');
                            return d ? <span style={{ color: d.color, display: 'inline-flex', alignItems: 'center' }}>{d.icon}</span> : null;
                          })()}
                        </span>
                      ) : <span style={{ color: 'var(--text-muted)' }}>—</span>}
                    </td>
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
      )}
    </div>
  );
};
