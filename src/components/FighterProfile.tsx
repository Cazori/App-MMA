import React, { useState, useEffect, useMemo } from 'react';
import type { Fighter, SparringVideo, CustomMetric, Payment } from '../types/mma';
import type { MetricSnapshot } from '../types/mma';
import { calculateBMI, getBMICategory, subscribePaymentsByPeriod } from '../services/storage';
import { Heart, Scale, Ruler, Video, Trash2, Edit, Plus, Calendar, AlertCircle, Award, Eye, EyeOff, Activity, Gauge, Settings, History, FileSpreadsheet, DollarSign, CheckCircle, XCircle, Clock, AlertTriangle } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useConfirm } from '../contexts/ConfirmContext';
import { BeltVisual } from './BeltVisual';
import { MetricHistory } from './MetricHistory';
import { getCurrentPeriod, formatPeriod, computePaymentStatus } from '../utils/payments';
import bjjLogo from '../assets/Logos/BJJ.png';
import kickLogo from '../assets/Logos/Kick boxing.png';
import thaiLogo from '../assets/Logos/Muay thai.png';
interface FighterProfileProps {
  fighter: Fighter;
  onEditFighter: (fighter: Fighter) => void;
  onUpdateFighter: (fighter: Fighter) => Promise<void>;
  onDeleteFighter: (id: string) => void;
}

export const FighterProfile: React.FC<FighterProfileProps> = ({
  fighter,
  onEditFighter,
  onUpdateFighter,
  onDeleteFighter,
}) => {
  const { isEditor } = useAuth();
  const { confirm } = useConfirm();
  const [activeTab, setActiveTab] = useState<'bjj' | 'kickboxing' | 'muaythai'>('bjj');

  // ── Payment state ───────────────────────────────────────────────────
  const [payments, setPayments] = useState<Payment[]>([]);
  const [payPeriod, setPayPeriod] = useState(getCurrentPeriod());
  useEffect(() => {
    const unsub = subscribePaymentsByPeriod(payPeriod, (list) => {
      setPayments(list);
    });
    return unsub;
  }, [payPeriod]);

  const fighterStatus = useMemo(
    () => computePaymentStatus(fighter, payments, payPeriod, 10),
    [fighter, payments, payPeriod]
  );

  const fighterPayments = useMemo(
    () => payments.filter((p) => p.fighterId === fighter.id),
    [payments, fighter.id]
  );
  
  const [showMetricsManager, setShowMetricsManager] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [newMetricLabel, setNewMetricLabel] = useState('');
  const [newMetricValue, setNewMetricValue] = useState('');
  const localCustomMetrics = fighter.customMetrics || [];

  // Local state to add sparring videos directly in the profile
  const [showAddVideoForm, setShowAddVideoForm] = useState(false);
  const [videoTitle, setVideoTitle] = useState('');
  const [videoUrl, setVideoUrl] = useState('');
  const [videoDate, setVideoDate] = useState('');
  const [videoNotes, setVideoNotes] = useState('');

  const bmi = calculateBMI(fighter.physicalMetrics.weight, fighter.physicalMetrics.height);
  const bmiCategory = getBMICategory(bmi);

  // Determine current active sub-club logo for header
  const handleAddVideo = (e: React.FormEvent) => {
    e.preventDefault();
    if (!videoTitle || !videoDate) return;

    // Convert regular YouTube URL to embed URL if needed
    let embedUrl = videoUrl || 'https://www.youtube.com/embed/dQw4w9WgXcQ';
    if (embedUrl.includes('watch?v=')) {
      const videoId = embedUrl.split('v=')[1]?.split('&')[0];
      if (videoId) embedUrl = `https://www.youtube.com/embed/${videoId}`;
    }

    const newVideo: SparringVideo = {
      id: `v-${Date.now()}`,
      title: videoTitle,
      url: embedUrl,
      date: videoDate,
      notes: videoNotes,
    };

    const updatedFighter: Fighter = {
      ...fighter,
      sparrings: [newVideo, ...fighter.sparrings],
    };

    onSaveEdit(updatedFighter);

    // Reset local form
    setVideoTitle('');
    setVideoUrl('');
    setVideoDate('');
    setVideoNotes('');
    setShowAddVideoForm(false);
  };

  const onSaveEdit = (updated: Fighter) => {
    onEditFighter(updated);
  };

  const handleDeleteVideo = async (videoId: string) => {
    const ok = await confirm({ message: '¿Seguro que querés eliminar esta grabación de sparring?', danger: true, confirmLabel: 'Eliminar' });
    if (!ok) return;
    
    const updatedFighter: Fighter = {
      ...fighter,
      sparrings: fighter.sparrings.filter(v => v.id !== videoId),
    };
    onSaveEdit(updatedFighter);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '30px' }}>
      
      {/* Header Profile Section */}
      <div className="glass-panel" style={{ 
        padding: '24px', 
        borderRadius: '24px', 
        display: 'flex', 
        flexWrap: 'wrap', 
        gap: '20px', 
        alignItems: 'center', 
        position: 'relative',
        overflow: 'hidden'
      }}>
        {/* Glow ambient background effect */}
        <div style={{
          position: 'absolute',
          top: '-50px',
          left: '-50px',
          width: '250px',
          height: '250px',
          background: 'radial-gradient(circle, rgba(244, 63, 94, 0.15) 0%, transparent 70%)',
          zIndex: 0,
          pointerEvents: 'none'
        }}></div>

        {isEditor && (
          <div style={{ position: 'absolute', top: '20px', right: '20px', display: 'flex', gap: '8px', zIndex: 5 }}>
            <button 
              onClick={() => onEditFighter(fighter)} 
              className="btn btn-secondary" 
              style={{ padding: '8px 12px', fontSize: '0.8rem' }}
              title="Editar datos básicos y cinturones"
            >
              <Edit size={14} />
              <span>Editar</span>
            </button>
            <button 
              onClick={() => onDeleteFighter(fighter.id)} 
              className="btn btn-danger" 
              style={{ padding: '8px 12px', fontSize: '0.8rem' }}
              title="Eliminar peleador del sistema"
            >
              <Trash2 size={14} />
              <span>Eliminar</span>
            </button>
          </div>
        )}

        {/* Big Glowing Avatar */}
        <div style={{ position: 'relative', zIndex: 1 }}>
          <img
            src={fighter.photoUrl}
            alt={fighter.name}
            style={{
              width: '120px',
              height: '120px',
              borderRadius: '50%',
              objectFit: 'cover',
              border: '3px solid var(--accent-orange)',
              boxShadow: '0 0 25px rgba(244, 63, 94, 0.4)',
            }}
            onError={(e) => {
              (e.target as HTMLImageElement).src = `https://api.dicebear.com/7.x/bottts/svg?seed=${fighter.name}`;
            }}
          />
        </div>

        {/* Basic Metadata */}
        <div style={{ position: 'relative', zIndex: 1, flexGrow: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
            <h1 style={{ fontSize: '2.2rem', color: '#fff', fontWeight: '800', letterSpacing: '-0.02em' }}>{fighter.name}</h1>
            {fighter.coachRole === 'monitor' && (
              <span style={{
                display: 'inline-flex', alignItems: 'center', gap: '6px',
                fontSize: '0.78rem', fontWeight: 700, letterSpacing: '0.04em',
                padding: '6px 16px', borderRadius: '20px',
                background: 'linear-gradient(135deg, rgba(59,130,246,0.2), rgba(59,130,246,0.05))',
                border: '1px solid rgba(59,130,246,0.35)',
                color: '#60a5fa', textTransform: 'uppercase',
                boxShadow: '0 0 12px rgba(59,130,246,0.15)',
              }}>
                <Award size={14} />
                Monitor
              </span>
            )}
            {fighter.coachRole === 'maestro' && (
              <span style={{
                display: 'inline-flex', alignItems: 'center', gap: '6px',
                fontSize: '0.78rem', fontWeight: 700, letterSpacing: '0.04em',
                padding: '6px 16px', borderRadius: '20px',
                background: 'linear-gradient(135deg, rgba(251,191,36,0.2), rgba(251,191,36,0.05))',
                border: '1px solid rgba(251,191,36,0.4)',
                color: '#fbbf24', textTransform: 'uppercase',
                boxShadow: '0 0 14px rgba(251,191,36,0.2)',
              }}>
                <Award size={14} />
                Maestro
              </span>
            )}
          </div>
          <p style={{ color: 'var(--accent-orange)', fontWeight: '700', fontSize: '1.1rem', marginTop: '4px', letterSpacing: '0.02em', textTransform: 'uppercase' }}>
            Estilo: {fighter.primaryStyle}
          </p>
          
        </div>
      </div>

        {/* Grid: Physical Stats & Disciplines */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '30px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '24px' }}>
          
          {/* Physical Metrics Card */}
          <div className="glass-panel" style={{ padding: '20px', borderRadius: '20px', display: 'flex', flexDirection: 'column' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', borderBottom: '1px solid var(--border-color)', paddingBottom: '10px' }}>
              <h3 style={{ fontSize: '1.1rem', color: '#fff', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Activity size={18} style={{ color: 'var(--accent-orange)' }} />
                <span>Métricas Físicas</span>
              </h3>
              {isEditor && (
                <div style={{ display: 'flex', gap: '4px' }}>
                  <button onClick={() => setShowHistory(!showHistory)} style={{ background: 'none', border: 'none', color: showHistory ? 'var(--accent-orange)' : 'var(--text-secondary)', cursor: 'pointer', padding: '4px' }} title="Historial de métricas">
                    <History size={18} />
                  </button>
                  <button onClick={() => setShowMetricsManager(!showMetricsManager)} style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', padding: '4px' }} title="Administrar estadísticas">
                    <Settings size={18} />
                  </button>
                </div>
              )}
              <button onClick={async () => { const { exportFighterToExcel } = await import('../utils/exportExcel'); exportFighterToExcel(fighter); }} style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', padding: '4px' }} title="Exportar a Excel">
                <FileSpreadsheet size={18} />
              </button>
            </div>

            {/* Standard metrics grid */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', gap: '10px' }}>
              {[
                { icon: <Ruler size={16} style={{ color: 'var(--text-secondary)' }} />, label: 'Altura', value: `${fighter.physicalMetrics.height} cm` },
                { icon: <Scale size={16} style={{ color: 'var(--text-secondary)' }} />, label: 'Peso', value: `${fighter.physicalMetrics.weight} kg` },
                { icon: <Heart size={16} style={{ color: '#ef4444' }} />, label: 'FC Reposo', value: `${fighter.physicalMetrics.restingHR} BPM` },
                ...(fighter.physicalMetrics.activeHR ? [{ icon: <Heart size={16} style={{ color: 'var(--accent-orange)' }} />, label: 'FC Actividad', value: `${fighter.physicalMetrics.activeHR} BPM` }] : []),
                ...(fighter.physicalMetrics.recoveryRate ? [{ icon: <Gauge size={16} style={{ color: '#10b981' }} />, label: 'Recuperación', value: `${fighter.physicalMetrics.recoveryRate} BPM` }] : []),
              ].map(m => (
                <div key={m.label} style={{ background: 'var(--bg-input)', padding: '10px 8px', borderRadius: '12px', textAlign: 'center', border: '1px solid rgba(255,255,255,0.02)' }}>
                  <div style={{ marginBottom: '4px' }}>{m.icon}</div>
                  <p style={{ fontSize: '0.6rem', color: 'var(--text-secondary)', textTransform: 'uppercase', fontWeight: 'bold', letterSpacing: '0.02em' }}>{m.label}</p>
                  <p style={{ fontSize: '1rem', fontWeight: '800', color: '#fff', marginTop: '2px', whiteSpace: 'nowrap' }}>{m.value}</p>
                </div>
              ))}
            </div>

            {/* Custom metrics */}
            {localCustomMetrics.filter(m => m.visible).length > 0 && (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', gap: '10px', marginTop: '12px', paddingTop: '12px', borderTop: '1px solid rgba(255,255,255,0.04)' }}>
                {localCustomMetrics.filter(m => m.visible).map(m => (
                  <div key={m.id} style={{ background: 'rgba(251,191,36,0.03)', padding: '10px 8px', borderRadius: '12px', textAlign: 'center', border: '1px solid rgba(251,191,36,0.08)' }}>
                    <p style={{ fontSize: '0.6rem', color: 'var(--accent-gold)', textTransform: 'uppercase', fontWeight: 'bold', letterSpacing: '0.02em' }}>{m.label}</p>
                    <p style={{ fontSize: '1rem', fontWeight: '800', color: '#fff', marginTop: '2px', whiteSpace: 'nowrap' }}>{m.value}</p>
                  </div>
                ))}
              </div>
            )}

            {/* Metrics manager (editor only) */}
            {showMetricsManager && isEditor && (
              <div style={{ marginTop: '16px', padding: '16px', background: 'rgba(255,255,255,0.02)', borderRadius: '14px', border: '1px solid var(--border-color)' }}>
                <p style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', marginBottom: '12px', fontWeight: 600 }}>+ Agregar estadística personalizada</p>
                <div style={{ display: 'flex', gap: '8px', marginBottom: '12px' }}>
                  <input value={newMetricLabel} onChange={e => setNewMetricLabel(e.target.value)} placeholder="Ej: Envergadura" className="form-input" style={{ fontSize: '0.78rem', flex: 1 }} />
                  <input value={newMetricValue} onChange={e => setNewMetricValue(e.target.value)} placeholder="Ej: 185 cm" className="form-input" style={{ fontSize: '0.78rem', flex: 1 }} />
                  <button
                    onClick={() => {
                      if (!newMetricLabel || !newMetricValue) return;
                      const metric: CustomMetric = { id: `m-${Date.now()}`, label: newMetricLabel, value: newMetricValue, visible: true };
                      const updated: Fighter = { ...fighter, customMetrics: [...localCustomMetrics, metric] };
                      onUpdateFighter(updated);
                      setNewMetricLabel('');
                      setNewMetricValue('');
                    }}
                    className="btn btn-primary"
                    style={{ padding: '8px 14px', fontSize: '0.78rem', flexShrink: 0 }}
                    disabled={!newMetricLabel || !newMetricValue}
                  >
                    <Plus size={14} /> Agregar
                  </button>
                </div>
                {localCustomMetrics.length > 0 && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginBottom: '4px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Estadísticas guardadas</p>
                    {localCustomMetrics.map(m => (
                      <div key={m.id} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '6px 10px', background: 'var(--bg-input)', borderRadius: '8px', fontSize: '0.78rem' }}>
                        <span style={{ flex: 1, color: '#fff' }}><strong>{m.label}:</strong> {m.value}</span>
                        <button onClick={() => {
                          const updated: Fighter = { ...fighter, customMetrics: localCustomMetrics.map(cm => cm.id === m.id ? { ...cm, visible: !cm.visible } : cm) };
                          onUpdateFighter(updated);
                        }} style={{ background: 'none', border: 'none', color: m.visible ? 'var(--accent-orange)' : 'var(--text-muted)', cursor: 'pointer', padding: '4px', borderRadius: '6px', display: 'flex' }} title={m.visible ? 'Ocultar' : 'Mostrar'}>
                          {m.visible ? <Eye size={14} /> : <EyeOff size={14} />}
                        </button>
                        <button onClick={() => {
                          const updated: Fighter = { ...fighter, customMetrics: localCustomMetrics.filter(cm => cm.id !== m.id) };
                          onUpdateFighter(updated);
                        }} style={{ background: 'none', border: 'none', color: 'var(--color-danger)', cursor: 'pointer', padding: '4px', borderRadius: '6px', display: 'flex' }} title="Eliminar">
                          <Trash2 size={14} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
                {localCustomMetrics.length === 0 && (
                  <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textAlign: 'center', padding: '8px' }}>Todavía no hay estadísticas personalizadas</p>
                )}
              </div>
            )}

            {/* BMI */}
            <div style={{ 
              display: 'flex', alignItems: 'center', gap: '16px', 
              background: 'linear-gradient(135deg, rgba(255,255,255,0.02) 0%, rgba(255,255,255,0.01) 100%)', 
              padding: '16px', borderRadius: '14px', border: '1px solid rgba(255,255,255,0.04)',
              marginTop: '16px'
            }}>
              <div style={{ 
                background: 'var(--bg-input)', width: '60px', height: '60px', borderRadius: '12px', 
                display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', 
                border: '1px solid var(--border-color)',
                boxShadow: `0 0 10px rgba(${bmiCategory.color === '#10b981' ? '16,185,129' : '245,158,11'}, 0.15)`
              }}>
                <span style={{ fontSize: '0.65rem', color: 'var(--text-secondary)', textTransform: 'uppercase', fontWeight: 'bold' }}>IMC</span>
                <span style={{ fontSize: '1.25rem', fontWeight: '800', color: bmiCategory.color }}>{bmi}</span>
              </div>
              <div>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Composición Corporal</p>
                <h4 style={{ color: bmiCategory.color, marginTop: '2px', fontSize: '1rem', fontWeight: '800' }}>{bmiCategory.label}</h4>
              </div>
            </div>
          </div>

          {/* Disciplines Details Card */}
          <div className="glass-panel" style={{ padding: '24px', borderRadius: '20px', position: 'relative', overflow: 'hidden' }}>
            
            {/* Background Faded Logo of Selected Discipline */}
            {(() => {
              let logoSrc = bjjLogo;
              if (activeTab === 'kickboxing') logoSrc = kickLogo;
              if (activeTab === 'muaythai') logoSrc = thaiLogo;
              return (
                <img 
                  src={logoSrc} 
                  alt="" 
                  style={{
                    position: 'absolute',
                    bottom: '-20px',
                    right: '-20px',
                    width: '150px',
                    height: '150px',
                    objectFit: 'contain',
                    opacity: 0.05,
                    pointerEvents: 'none',
                    zIndex: 0
                  }}
                />
              );
            })()}

            <h3 style={{ fontSize: '1.2rem', marginBottom: '20px', borderBottom: '1px solid var(--border-color)', paddingBottom: '10px', color: '#fff', position: 'relative', zIndex: 1 }}>
              Ficha Técnica de Disciplina
            </h3>

            {/* Tabs for disciplines */}
            <div style={{ display: 'flex', borderBottom: '1px solid var(--border-color)', marginBottom: '16px', gap: '4px', position: 'relative', zIndex: 1 }}>
              {(['bjj', 'kickboxing', 'muaythai'] as const).map((tab) => {
                const isActive = activeTab === tab;
                const discData = fighter.disciplines[tab];
                let tabName = '';
                let activeColor = '';
                if (tab === 'bjj') { tabName = 'Jiu Jitsu'; activeColor = 'var(--accent-bjj)'; }
                if (tab === 'kickboxing') { tabName = 'Kick Boxing'; activeColor = '#ef4444'; }
                if (tab === 'muaythai') { tabName = 'Muay Thai'; activeColor = 'var(--accent-muaythai)'; }
                
                return (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    style={{
                      padding: '8px 14px',
                      background: 'none',
                      border: 'none',
                      borderBottom: isActive ? `3px solid ${activeColor}` : '3px solid transparent',
                      color: isActive ? '#fff' : 'var(--text-secondary)',
                      fontFamily: 'var(--font-display)',
                      fontWeight: isActive ? '800' : '500',
                      cursor: 'pointer',
                      fontSize: '0.85rem',
                      opacity: discData.active ? 1 : 0.35,
                      transition: 'all 0.2s ease',
                    }}
                  >
                    {tabName}
                  </button>
                );
              })}
            </div>

            {/* Tab Content */}
            <div style={{ minHeight: '130px', position: 'relative', zIndex: 1 }}>
              {(() => {
                const data = fighter.disciplines[activeTab];
                let accentColor = '';
                let badgeClass = '';
                let logoSrc = bjjLogo;
                if (activeTab === 'bjj') { accentColor = 'var(--accent-bjj)'; badgeClass = 'badge-bjj'; logoSrc = bjjLogo; }
                if (activeTab === 'kickboxing') { accentColor = '#ef4444'; badgeClass = 'badge-red'; logoSrc = kickLogo; }
                if (activeTab === 'muaythai') { accentColor = 'var(--accent-muaythai)'; badgeClass = 'badge-muaythai'; logoSrc = thaiLogo; }

                return (
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <img src={logoSrc} alt="discipline-logo" style={{ width: '22px', height: '22px', objectFit: 'contain' }} />
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <BeltVisual discipline={activeTab} rank={data.rank || ''} size={32} />
                          <span className={`badge ${badgeClass}`} style={{ fontSize: '0.8rem', padding: '6px 12px' }}>
                            {data.rank || 'Sin rango'}
                          </span>
                        </div>
                      </div>
                      
                      {data.active ? (
                        <span style={{ fontSize: '0.75rem', color: 'var(--color-success)', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '4px' }}>
                          <span style={{ display: 'inline-block', width: '8px', height: '8px', borderRadius: '50%', backgroundColor: 'var(--color-success)', boxShadow: '0 0 6px var(--color-success)' }}></span>
                          Activo
                        </span>
                      ) : (
                        <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '4px' }}>
                          <span style={{ display: 'inline-block', width: '8px', height: '8px', borderRadius: '50%', backgroundColor: 'var(--text-muted)' }}></span>
                          Inactivo
                        </span>
                      )}
                    </div>

                    <div style={{ margin: '14px 0' }}>
                      <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', textTransform: 'uppercase', fontWeight: 'bold' }}>Estilo de combate:</p>
                      <h4 style={{ color: '#fff', fontSize: '1rem', fontWeight: '700', marginTop: '2px' }}>
                        {data.style || 'No especificado'}
                      </h4>
                    </div>

                    {data.notes && (
                      <div style={{ 
                        marginTop: '16px', 
                        background: 'rgba(255,255,255,0.015)', 
                        padding: '12px', 
                        borderRadius: '10px', 
                        borderLeft: `3px solid ${accentColor}`, 
                        fontSize: '0.85rem', 
                        color: 'var(--text-secondary)', 
                        lineHeight: '1.4' 
                      }}>
                        {data.notes}
                      </div>
                    )}
                  </div>
                );
              })()}
            </div>
          </div>
        </div>
      </div>

      {/* Metric History (editor only) */}
      {showHistory && isEditor && (
        <MetricHistory
          snapshots={fighter.metricSnapshots || []}
          isEditor={isEditor}
          onAddSnapshot={(snapshot: MetricSnapshot) => {
            const snapshots = [...(fighter.metricSnapshots || []), snapshot].slice(-50);
            onUpdateFighter({ ...fighter, metricSnapshots: snapshots });
          }}
        />
      )}

      {/* Payment History Section */}
      <div className="glass-panel" style={{ padding: '24px', borderRadius: '24px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '10px' }}>
          <h3 style={{ fontSize: '1.2rem', color: '#fff', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <DollarSign size={20} style={{ color: 'var(--accent-orange)' }} />
            Historial de Pagos
          </h3>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            {/* Status Badge */}
            <span style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '6px 14px',
              borderRadius: '20px',
              fontSize: '0.85rem',
              fontWeight: 700,
              background: fighterStatus === 'paid' ? 'rgba(16,185,129,0.15)' :
                          fighterStatus === 'pending' ? 'rgba(234,179,8,0.15)' :
                          fighterStatus === 'overdue' ? 'rgba(239,68,68,0.15)' :
                          'rgba(255,255,255,0.05)',
              color: fighterStatus === 'paid' ? 'var(--color-success)' :
                     fighterStatus === 'pending' ? 'var(--color-warning)' :
                     fighterStatus === 'overdue' ? 'var(--color-danger)' :
                     'var(--text-muted)',
            }}>
              {fighterStatus === 'paid' && <CheckCircle size={14} />}
              {fighterStatus === 'pending' && <Clock size={14} />}
              {fighterStatus === 'overdue' && <AlertTriangle size={14} />}
              {fighterStatus === 'cancelled' && <XCircle size={14} />}
              {fighterStatus === 'paid' ? 'Al día' :
               fighterStatus === 'pending' ? 'Pendiente' :
               fighterStatus === 'overdue' ? 'Vencido' :
               'Cancelado'}
            </span>
            <select
              value={payPeriod}
              onChange={(e) => setPayPeriod(e.target.value)}
              className="form-input"
              style={{ fontSize: '0.8rem', padding: '6px 10px', width: 'auto' }}
            >
              {[getCurrentPeriod(), ...['2026-05', '2026-04', '2026-03']].map((p) => (
                <option key={p} value={p}>{formatPeriod(p)}</option>
              ))}
            </select>
          </div>
        </div>

        {fighterPayments.length === 0 ? (
          <div style={{ padding: '20px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.9rem', background: 'rgba(255,255,255,0.01)', borderRadius: '12px' }}>
            <DollarSign size={32} style={{ opacity: 0.3, marginBottom: '8px' }} />
            <p>No hay pagos registrados para {formatPeriod(payPeriod)}</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {fighterPayments.sort((a, b) => b.period.localeCompare(a.period)).map((p) => (
              <div key={p.id} className="glass-card" style={{
                padding: '14px 16px',
                borderRadius: '12px',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                flexWrap: 'wrap',
                gap: '10px',
                opacity: p.status === 'cancelled' ? 0.5 : 1,
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <span style={{
                    padding: '4px 10px',
                    borderRadius: '8px',
                    fontSize: '0.75rem',
                    fontWeight: 700,
                    background: p.status === 'paid' ? 'rgba(16,185,129,0.15)' : 'rgba(255,255,255,0.05)',
                    color: p.status === 'paid' ? 'var(--color-success)' : 'var(--text-muted)',
                  }}>
                    {formatPeriod(p.period)}
                  </span>
                  <span style={{ color: '#fff', fontWeight: 700, fontSize: '0.95rem' }}>
                    ${p.amount.toLocaleString('es-CO')}
                  </span>
                  <span style={{ color: 'var(--text-secondary)', fontSize: '0.8rem' }}>
                    {p.method === 'cash' ? 'Efectivo' :
                     p.method === 'transfer' ? 'Transferencia' :
                     p.method === 'nequi' ? 'Nequi' : 'Daviplata'}
                  </span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{
                    display: 'inline-flex', alignItems: 'center', gap: '4px',
                    padding: '3px 10px', borderRadius: '20px',
                    fontSize: '0.75rem', fontWeight: 700,
                    background: p.status === 'paid' ? 'rgba(16,185,129,0.1)' :
                                p.status === 'cancelled' ? 'rgba(255,255,255,0.05)' : 'rgba(234,179,8,0.1)',
                    color: p.status === 'paid' ? 'var(--color-success)' :
                           p.status === 'cancelled' ? 'var(--text-muted)' : 'var(--color-warning)',
                  }}>
                    {p.status === 'paid' ? <CheckCircle size={12} /> : <XCircle size={12} />}
                    {p.status === 'paid' ? 'Pagado' : 'Cancelado'}
                  </span>
                  <span style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>
                    {new Date(p.paidAt).toLocaleDateString('es-AR')}
                  </span>
                  {p.cancelledAt && (
                    <span style={{ color: 'var(--text-muted)', fontSize: '0.7rem' }}>
                      · Cancelado {new Date(p.cancelledAt).toLocaleDateString('es-AR')}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Sparring Videos Section */}
      <div className="glass-panel" style={{ padding: '30px', borderRadius: '24px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', borderBottom: '1px solid var(--border-color)', paddingBottom: '15px' }}>
          <h3 style={{ fontSize: '1.3rem', color: '#fff', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Video style={{ color: 'var(--accent-orange)' }} />
            <span>Registro Audiovisual de Sparring</span>
          </h3>
          {isEditor && (
            <button 
              onClick={() => setShowAddVideoForm(!showAddVideoForm)} 
              className="btn btn-secondary"
              style={{ padding: '8px 16px', fontSize: '0.85rem' }}
            >
              <Plus size={16} />
              Cargar Sparring
            </button>
          )}
        </div>

        {/* Add Sparring Form (Toggleable inline) */}
        {showAddVideoForm && (
          <form onSubmit={handleAddVideo} className="glass-card" style={{ padding: '20px', marginBottom: '24px', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '16px', border: '1px solid var(--accent-orange)' }}>
            <div className="form-group">
              <label className="form-label">Título del Combate / Drill</label>
              <input 
                type="text" 
                placeholder="Ej: Sparring técnico con Mateo" 
                value={videoTitle}
                onChange={e => setVideoTitle(e.target.value)}
                required
                className="form-input"
              />
            </div>
            <div className="form-group">
              <label className="form-label">Fecha del Sparring</label>
              <input 
                type="date" 
                value={videoDate}
                onChange={e => setVideoDate(e.target.value)}
                required
                className="form-input"
              />
            </div>
            <div className="form-group">
              <label className="form-label">URL del Video (Youtube o Mock)</label>
              <input 
                type="text" 
                placeholder="Ej: https://www.youtube.com/watch?v=..." 
                value={videoUrl}
                onChange={e => setVideoUrl(e.target.value)}
                className="form-input"
              />
            </div>
            <div className="form-group" style={{ gridColumn: '1 / -1' }}>
              <label className="form-label">Notas y Ajustes Técnicos a corregir</label>
              <textarea 
                rows={2}
                placeholder="Ej: Trabajar la guardia, pulir esquivas..." 
                value={videoNotes}
                onChange={e => setVideoNotes(e.target.value)}
                className="form-input"
                style={{ resize: 'vertical' }}
              />
            </div>
            <div style={{ gridColumn: '1 / -1', display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '10px' }}>
              <button type="button" onClick={() => setShowAddVideoForm(false)} className="btn btn-secondary">
                Cancelar
              </button>
              <button type="submit" className="btn btn-primary">
                Guardar Sparring
              </button>
            </div>
          </form>
        )}

        {/* Video Grid */}
        {fighter.sparrings && fighter.sparrings.length > 0 ? (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '20px' }}>
            {fighter.sparrings.map((video) => (
              <div key={video.id} className="glass-card" style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden', padding: '16px', position: 'relative' }}>
                
                {isEditor && (
                  <button 
                    onClick={() => handleDeleteVideo(video.id)} 
                    style={{ position: 'absolute', top: '24px', right: '24px', background: 'rgba(0,0,0,0.6)', border: 'none', color: 'var(--color-danger)', cursor: 'pointer', borderRadius: '50%', padding: '6px', zIndex: 5 }}
                    title="Eliminar video"
                  >
                    <Trash2 size={14} />
                  </button>
                )}

                {/* Video Player Mock/Embed */}
                <div style={{ position: 'relative', width: '100%', height: '160px', borderRadius: '10px', overflow: 'hidden', background: '#000', marginBottom: '12px' }}>
                  <iframe
                    width="100%"
                    height="100%"
                    src={video.url}
                    title={video.title}
                    frameBorder="0"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                    allowFullScreen
                    style={{ border: 'none' }}
                  ></iframe>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', flexGrow: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--text-secondary)', fontSize: '0.75rem', marginBottom: '4px' }}>
                    <Calendar size={12} />
                    <span>{video.date}</span>
                  </div>
                  <h4 style={{ fontSize: '0.95rem', color: '#fff', fontWeight: '700', lineHeight: '1.3', marginBottom: '8px' }}>
                    {video.title}
                  </h4>
                  {video.notes && (
                    <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', lineHeight: '1.4', background: 'rgba(255,255,255,0.01)', padding: '10px', borderRadius: '8px', marginTop: 'auto', borderLeft: '2px solid var(--accent-orange)' }}>
                      {video.notes}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '40px 20px', background: 'rgba(255,255,255,0.01)', borderRadius: '16px', border: '1px dashed var(--border-color)', textAlign: 'center', color: 'var(--text-muted)' }}>
            <AlertCircle size={32} style={{ marginBottom: '12px', opacity: 0.5 }} />
            <p style={{ fontSize: '0.9rem' }}>No hay grabaciones de sparring registradas para este atleta.</p>
            <p style={{ fontSize: '0.8rem', marginTop: '4px' }}>Hacé clic en "Cargar Sparring" para agregar el primer registro.</p>
          </div>
        )}
      </div>

      {(fighter.createdAt || fighter.updatedAt) && (
        <div style={{
          padding: '12px 0',
          borderTop: '1px solid var(--border-color)',
          display: 'flex',
          justifyContent: 'center',
          gap: '20px',
          fontSize: '0.7rem',
          color: 'var(--text-muted)',
        }}>
          {fighter.createdAt && (
            <span>Creado: {new Date(fighter.createdAt).toLocaleDateString('es-AR', { day: 'numeric', month: 'long', year: 'numeric' })}</span>
          )}
          {fighter.updatedAt && (
            <span>Actualizado: {new Date(fighter.updatedAt).toLocaleDateString('es-AR', { day: 'numeric', month: 'long', year: 'numeric' })}</span>
          )}
        </div>
      )}
    </div>
  );
};
