import React, { useState } from 'react';
import type { Fighter, SparringVideo, CustomMetric } from '../types/mma';
import { calculateBMI, getBMICategory } from '../services/storage';
import { Heart, Scale, Ruler, Video, Trash2, Edit, Plus, Calendar, AlertCircle, Award, Eye, EyeOff, Activity, Gauge, Settings } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useConfirm } from '../contexts/ConfirmContext';
import { BeltVisual } from './BeltVisual';
import bjjLogo from '../assets/Logos/BJJ.png';
import kickLogo from '../assets/Logos/Kick boxing.png';
import thaiLogo from '../assets/Logos/Muay thai.png';
interface FighterProfileProps {
  fighter: Fighter;
  onEditFighter: (fighter: Fighter) => void;
  onDeleteFighter: (id: string) => void;
}

export const FighterProfile: React.FC<FighterProfileProps> = ({
  fighter,
  onEditFighter,
  onDeleteFighter,
}) => {
  const { isEditor } = useAuth();
  const { confirm } = useConfirm();
  const [activeTab, setActiveTab] = useState<'bjj' | 'kickboxing' | 'muaythai'>('bjj');
  
  const [showMetricsManager, setShowMetricsManager] = useState(false);
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
                <button onClick={() => setShowMetricsManager(!showMetricsManager)} style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', padding: '4px' }} title="Administrar estadísticas">
                  <Settings size={18} />
                </button>
              )}
            </div>

            {/* Standard metrics grid */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(100px, 1fr))', gap: '10px' }}>
              <div style={{ background: 'var(--bg-input)', padding: '12px', borderRadius: '14px', textAlign: 'center', border: '1px solid rgba(255,255,255,0.02)' }}>
                <Ruler size={18} style={{ color: 'var(--text-secondary)', marginBottom: '6px' }} />
                <p style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', textTransform: 'uppercase', fontWeight: 'bold' }}>Altura</p>
                <p style={{ fontSize: '1.1rem', fontWeight: '800', color: '#fff', marginTop: '4px' }}>{fighter.physicalMetrics.height} <span style={{ fontSize: '0.7rem', fontWeight: '500', color: 'var(--text-secondary)' }}>cm</span></p>
              </div>
              <div style={{ background: 'var(--bg-input)', padding: '12px', borderRadius: '14px', textAlign: 'center', border: '1px solid rgba(255,255,255,0.02)' }}>
                <Scale size={18} style={{ color: 'var(--text-secondary)', marginBottom: '6px' }} />
                <p style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', textTransform: 'uppercase', fontWeight: 'bold' }}>Peso</p>
                <p style={{ fontSize: '1.1rem', fontWeight: '800', color: '#fff', marginTop: '4px' }}>{fighter.physicalMetrics.weight} <span style={{ fontSize: '0.7rem', fontWeight: '500', color: 'var(--text-secondary)' }}>kg</span></p>
              </div>
              <div style={{ background: 'var(--bg-input)', padding: '12px', borderRadius: '14px', textAlign: 'center', border: '1px solid rgba(255,255,255,0.02)' }}>
                <Heart size={18} style={{ color: '#ef4444', marginBottom: '6px' }} />
                <p style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', textTransform: 'uppercase', fontWeight: 'bold' }}>FC Reposo</p>
                <p style={{ fontSize: '1.1rem', fontWeight: '800', color: '#fff', marginTop: '4px' }}>{fighter.physicalMetrics.restingHR} <span style={{ fontSize: '0.65rem', fontWeight: '500', color: 'var(--text-secondary)' }}>BPM</span></p>
              </div>
              {fighter.physicalMetrics.activeHR && (
                <div style={{ background: 'var(--bg-input)', padding: '12px', borderRadius: '14px', textAlign: 'center', border: '1px solid rgba(255,255,255,0.02)' }}>
                  <Heart size={18} style={{ color: 'var(--accent-orange)', marginBottom: '6px' }} />
                  <p style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', textTransform: 'uppercase', fontWeight: 'bold' }}>FC Actividad</p>
                  <p style={{ fontSize: '1.1rem', fontWeight: '800', color: '#fff', marginTop: '4px' }}>{fighter.physicalMetrics.activeHR} <span style={{ fontSize: '0.65rem', fontWeight: '500', color: 'var(--text-secondary)' }}>BPM</span></p>
                </div>
              )}
              {fighter.physicalMetrics.recoveryRate && (
                <div style={{ background: 'var(--bg-input)', padding: '12px', borderRadius: '14px', textAlign: 'center', border: '1px solid rgba(255,255,255,0.02)' }}>
                  <Gauge size={18} style={{ color: '#10b981', marginBottom: '6px' }} />
                  <p style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', textTransform: 'uppercase', fontWeight: 'bold' }}>Recuperación</p>
                  <p style={{ fontSize: '1.1rem', fontWeight: '800', color: '#fff', marginTop: '4px' }}>{fighter.physicalMetrics.recoveryRate} <span style={{ fontSize: '0.65rem', fontWeight: '500', color: 'var(--text-secondary)' }}>BPM</span></p>
                </div>
              )}
            </div>

            {/* Custom metrics */}
            {localCustomMetrics.filter(m => m.visible).length > 0 && (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(100px, 1fr))', gap: '10px', marginTop: '10px' }}>
                {localCustomMetrics.filter(m => m.visible).map(m => (
                  <div key={m.id} style={{ background: 'var(--bg-input)', padding: '12px', borderRadius: '14px', textAlign: 'center', border: '1px solid rgba(255,255,255,0.02)' }}>
                    <p style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', textTransform: 'uppercase', fontWeight: 'bold' }}>{m.label}</p>
                    <p style={{ fontSize: '1.1rem', fontWeight: '800', color: '#fff', marginTop: '4px' }}>{m.value}</p>
                  </div>
                ))}
              </div>
            )}

            {/* Metrics manager (editor only) */}
            {showMetricsManager && isEditor && (
              <div style={{ marginTop: '16px', padding: '16px', background: 'rgba(255,255,255,0.02)', borderRadius: '14px', border: '1px solid var(--border-color)' }}>
                <div style={{ display: 'flex', gap: '8px', marginBottom: '12px' }}>
                  <input value={newMetricLabel} onChange={e => setNewMetricLabel(e.target.value)} placeholder="Etiqueta (ej: Envergadura)" className="form-input" style={{ fontSize: '0.8rem', flex: 1 }} />
                  <input value={newMetricValue} onChange={e => setNewMetricValue(e.target.value)} placeholder="Valor (ej: 185 cm)" className="form-input" style={{ fontSize: '0.8rem', flex: 1 }} />
                  <button
                    onClick={() => {
                      if (!newMetricLabel || !newMetricValue) return;
                      const metric: CustomMetric = { id: `m-${Date.now()}`, label: newMetricLabel, value: newMetricValue, visible: true };
                      const updated: Fighter = { ...fighter, customMetrics: [...localCustomMetrics, metric] };
                      onEditFighter(updated);
                      setNewMetricLabel('');
                      setNewMetricValue('');
                    }}
                    className="btn btn-primary"
                    style={{ padding: '8px 12px', fontSize: '0.8rem', flexShrink: 0 }}
                    disabled={!newMetricLabel || !newMetricValue}
                  >
                    <Plus size={14} /> Agregar
                  </button>
                </div>
                {localCustomMetrics.length > 0 && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    {localCustomMetrics.map(m => (
                      <div key={m.id} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '6px 10px', background: 'var(--bg-input)', borderRadius: '8px', fontSize: '0.8rem' }}>
                        <span style={{ flex: 1, color: '#fff' }}>{m.label}: {m.value}</span>
                        <button onClick={() => {
                          const updated: Fighter = { ...fighter, customMetrics: localCustomMetrics.map(cm => cm.id === m.id ? { ...cm, visible: !cm.visible } : cm) };
                          onEditFighter(updated);
                        }} style={{ background: 'none', border: 'none', color: m.visible ? 'var(--accent-orange)' : 'var(--text-muted)', cursor: 'pointer', padding: '2px' }} title={m.visible ? 'Ocultar' : 'Mostrar'}>
                          {m.visible ? <Eye size={14} /> : <EyeOff size={14} />}
                        </button>
                        <button onClick={() => {
                          const updated: Fighter = { ...fighter, customMetrics: localCustomMetrics.filter(cm => cm.id !== m.id) };
                          onEditFighter(updated);
                        }} style={{ background: 'none', border: 'none', color: 'var(--color-danger)', cursor: 'pointer', padding: '2px' }} title="Eliminar">
                          <Trash2 size={14} />
                        </button>
                      </div>
                    ))}
                  </div>
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
