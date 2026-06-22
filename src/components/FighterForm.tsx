import React, { useState, useEffect } from 'react';
import type { Fighter } from '../types/mma';
import { Shield, X } from 'lucide-react';

interface FighterFormProps {
  fighter?: Fighter | null;
  onSave: (fighter: Fighter) => void;
  onClose: () => void;
}

export const FighterForm: React.FC<FighterFormProps> = ({
  fighter,
  onSave,
  onClose,
}) => {
  // Form fields
  const [name, setName] = useState('');
  const [photoUrl, setPhotoUrl] = useState('');
  const [primaryStyle, setPrimaryStyle] = useState('All-rounder');
  const [subClub, setSubClub] = useState('Gator Grip (BJJ)');
  
  // Physical Metrics
  const [height, setHeight] = useState(175);
  const [weight, setWeight] = useState(70);
  const [heartRate, setHeartRate] = useState(65);

  // BJJ Discipline
  const [bjjActive, setBjjActive] = useState(true);
  const [bjjRank, setBjjRank] = useState('Cinturón Blanco');
  const [bjjStyle, setBjjStyle] = useState('Grappler');
  const [bjjNotes, setBjjNotes] = useState('');

  // Kickboxing Discipline
  const [kickActive, setKickActive] = useState(false);
  const [kickRank, setKickRank] = useState('Cinturón Blanco');
  const [kickStyle, setKickStyle] = useState('Striker');
  const [kickNotes, setKickNotes] = useState('');

  // Muay Thai Discipline
  const [mtActive, setMtActive] = useState(false);
  const [mtRank, setMtRank] = useState('Mongkhon Blanco (Grado 1)');
  const [mtStyle, setMtStyle] = useState('Muay Khao');
  const [mtNotes, setMtNotes] = useState('');

  useEffect(() => {
    if (fighter) {
      setName(fighter.name);
      setPhotoUrl(fighter.photoUrl);
      setPrimaryStyle(fighter.primaryStyle);
      setSubClub(fighter.subClub);
      
      setHeight(fighter.physicalMetrics.height);
      setWeight(fighter.physicalMetrics.weight);
      setHeartRate(fighter.physicalMetrics.heartRate);

      setBjjActive(fighter.disciplines.bjj.active);
      setBjjRank(fighter.disciplines.bjj.rank);
      setBjjStyle(fighter.disciplines.bjj.style);
      setBjjNotes(fighter.disciplines.bjj.notes || '');

      setKickActive(fighter.disciplines.kickboxing.active);
      setKickRank(fighter.disciplines.kickboxing.rank);
      setKickStyle(fighter.disciplines.kickboxing.style);
      setKickNotes(fighter.disciplines.kickboxing.notes || '');

      setMtActive(fighter.disciplines.muaythai.active);
      setMtRank(fighter.disciplines.muaythai.rank);
      setMtStyle(fighter.disciplines.muaythai.style);
      setMtNotes(fighter.disciplines.muaythai.notes || '');
    } else {
      // Default placeholder photo URL
      setPhotoUrl('https://images.unsplash.com/photo-1517841905240-472988babdf9?w=300&h=300&fit=crop&crop=faces');
    }
  }, [fighter]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!name) return;

    const savedFighter: Fighter = {
      id: fighter?.id || `f-${Date.now()}`,
      name,
      photoUrl: photoUrl || 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=300&h=300&fit=crop&crop=faces',
      primaryStyle,
      mainClub: 'Guerreros de Dios',
      subClub,
      physicalMetrics: {
        height: Number(height),
        weight: Number(weight),
        heartRate: Number(heartRate),
      },
      disciplines: {
        bjj: {
          rank: bjjRank,
          style: bjjStyle,
          active: bjjActive,
          notes: bjjNotes,
        },
        kickboxing: {
          rank: kickRank,
          style: kickStyle,
          active: kickActive,
          notes: kickNotes,
        },
        muaythai: {
          rank: mtRank,
          style: mtStyle,
          active: mtActive,
          notes: mtNotes,
        },
      },
      sparrings: fighter?.sparrings || [],
    };

    onSave(savedFighter);
  };

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.85)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 100,
      padding: '20px',
      backdropFilter: 'blur(5px)',
    }}>
      <div 
        className="glass-panel" 
        style={{
          width: '100%',
          maxWidth: '750px',
          maxHeight: '90vh',
          borderRadius: '24px',
          overflowY: 'auto',
          display: 'flex',
          flexDirection: 'column',
          position: 'relative',
        }}
      >
        {/* Header */}
        <div style={{
          padding: '24px 30px',
          borderBottom: '1px solid var(--border-color)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          position: 'sticky',
          top: 0,
          background: 'var(--bg-secondary)',
          zIndex: 10,
        }}>
          <h2 style={{ fontSize: '1.4rem', color: '#fff', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Shield size={22} style={{ color: 'var(--accent-red)' }} />
            <span>{fighter ? 'Editar Perfil de Peleador' : 'Registrar Nuevo Peleador'}</span>
          </h2>
          <button 
            onClick={onClose} 
            style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', display: 'flex', alignItems: 'center' }}
            title="Cerrar modal"
          >
            <X size={24} />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} style={{ padding: '30px', display: 'flex', flexDirection: 'column', gap: '24px' }}>
          
          {/* Section 1: Datos Básicos */}
          <div>
            <h3 style={{ fontSize: '1rem', textTransform: 'uppercase', color: 'var(--accent-red)', letterSpacing: '0.05em', marginBottom: '16px' }}>
              Datos Básicos
            </h3>
            
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px' }}>
              <div className="form-group">
                <label className="form-label">Nombre Completo y Apodo</label>
                <input 
                  type="text" 
                  value={name} 
                  onChange={(e) => setName(e.target.value)} 
                  placeholder="Ej: Santiago 'El Tiburón' Méndez" 
                  required
                  className="form-input"
                />
              </div>

              <div className="form-group">
                <label className="form-label">URL de Foto de Perfil</label>
                <input 
                  type="text" 
                  value={photoUrl} 
                  onChange={(e) => setPhotoUrl(e.target.value)} 
                  placeholder="Ej: https://unsplash.com/..." 
                  className="form-input"
                />
              </div>

              <div className="form-group">
                <label className="form-label">Estilo Principal de Pelea</label>
                <select 
                  value={primaryStyle} 
                  onChange={(e) => setPrimaryStyle(e.target.value)}
                  className="form-input"
                >
                  <option value="All-rounder">All-rounder (Completo)</option>
                  <option value="Grappler">Grappler (Jiu-Jitsu / Lucha)</option>
                  <option value="Striker">Striker (Kickboxing / Muay Thai)</option>
                  <option value="Wrestler">Wrestler (Luchador)</option>
                  <option value="Muay Khao">Muay Khao (Clinch / Rodillas)</option>
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Club de la Alianza</label>
                <select 
                  value={subClub} 
                  onChange={(e) => setSubClub(e.target.value)}
                  className="form-input"
                >
                  <option value="Gator Grip (BJJ)">Gator Grip (BJJ)</option>
                  <option value="Asociación Colombiana de Kick Boxing">Asociación Colombiana de Kick Boxing</option>
                  <option value="American Confederation (Muay Thai)">American Confederation (Muay Thai)</option>
                </select>
              </div>
            </div>
          </div>

          {/* Section 2: Datos Físicos */}
          <div>
            <h3 style={{ fontSize: '1rem', textTransform: 'uppercase', color: 'var(--accent-red)', letterSpacing: '0.05em', marginBottom: '16px', borderTop: '1px solid var(--border-color)', paddingTop: '20px' }}>
              Métricas Físicas Iniciales
            </h3>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px' }}>
              <div className="form-group">
                <label className="form-label">Altura (cm)</label>
                <input 
                  type="number" 
                  value={height} 
                  onChange={(e) => setHeight(Number(e.target.value))} 
                  required
                  min="50"
                  max="250"
                  className="form-input"
                />
              </div>
              <div className="form-group">
                <label className="form-label">Peso (kg)</label>
                <input 
                  type="number" 
                  value={weight} 
                  onChange={(e) => setWeight(Number(e.target.value))} 
                  required
                  min="20"
                  max="200"
                  className="form-input"
                />
              </div>
              <div className="form-group">
                <label className="form-label">Pulsaciones (BPM)</label>
                <input 
                  type="number" 
                  value={heartRate} 
                  onChange={(e) => setHeartRate(Number(e.target.value))} 
                  required
                  min="30"
                  max="220"
                  className="form-input"
                />
              </div>
            </div>
          </div>

          {/* Section 3: Disciplinas */}
          <div>
            <h3 style={{ fontSize: '1rem', textTransform: 'uppercase', color: 'var(--accent-red)', letterSpacing: '0.05em', marginBottom: '16px', borderTop: '1px solid var(--border-color)', paddingTop: '20px' }}>
              Ficha por Disciplinas
            </h3>

            {/* BJJ Config */}
            <div className="glass-card" style={{ padding: '20px', marginBottom: '16px', borderLeft: '4px solid var(--accent-bjj)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
                <input 
                  type="checkbox" 
                  id="bjjActive"
                  checked={bjjActive}
                  onChange={(e) => setBjjActive(e.target.checked)}
                  style={{ width: '18px', height: '18px', accentColor: 'var(--accent-bjj)' }}
                />
                <label htmlFor="bjjActive" style={{ fontWeight: 'bold', color: '#fff', fontSize: '0.95rem', cursor: 'pointer' }}>
                  Jiu-Jitsu Brasileño (BJJ / Gator Grip)
                </label>
              </div>

              {bjjActive && (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div className="form-group">
                    <label className="form-label">Cinturón / Rango</label>
                    <select value={bjjRank} onChange={e => setBjjRank(e.target.value)} className="form-input">
                      <option value="Cinturón Blanco">Cinturón Blanco</option>
                      <option value="Cinturón Azul">Cinturón Azul</option>
                      <option value="Cinturón Morado">Cinturón Morado</option>
                      <option value="Cinturón Marrón">Cinturón Marrón</option>
                      <option value="Cinturón Negro">Cinturón Negro</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Estilo / Guardia preferida</label>
                    <input 
                      type="text" 
                      value={bjjStyle} 
                      onChange={e => setBjjStyle(e.target.value)} 
                      placeholder="Ej: Guardero / Pasador de presión"
                      className="form-input"
                    />
                  </div>
                  <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                    <label className="form-label">Notas de desempeño BJJ</label>
                    <textarea 
                      rows={2}
                      value={bjjNotes} 
                      onChange={e => setBjjNotes(e.target.value)} 
                      placeholder="Ej: Excelente movilidad. Trabajar en pasajes de media guardia."
                      className="form-input"
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Kickboxing Config */}
            <div className="glass-card" style={{ padding: '20px', marginBottom: '16px', borderLeft: '4px solid var(--accent-red)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
                <input 
                  type="checkbox" 
                  id="kickActive"
                  checked={kickActive}
                  onChange={(e) => setKickActive(e.target.checked)}
                  style={{ width: '18px', height: '18px', accentColor: 'var(--accent-red)' }}
                />
                <label htmlFor="kickActive" style={{ fontWeight: 'bold', color: '#fff', fontSize: '0.95rem', cursor: 'pointer' }}>
                  Kick Boxing (Asociación Colombiana)
                </label>
              </div>

              {kickActive && (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div className="form-group">
                    <label className="form-label">Cinturón / Rango</label>
                    <select value={kickRank} onChange={e => setKickRank(e.target.value)} className="form-input">
                      <option value="Cinturón Blanco">Cinturón Blanco</option>
                      <option value="Cinturón Amarillo">Cinturón Amarillo</option>
                      <option value="Cinturón Naranja">Cinturón Naranja</option>
                      <option value="Cinturón Verde">Cinturón Verde</option>
                      <option value="Cinturón Azul">Cinturón Azul</option>
                      <option value="Cinturón Marrón">Cinturón Marrón</option>
                      <option value="Cinturón Negro">Cinturón Negro (1er Dan+)</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Estilo de Striking</label>
                    <input 
                      type="text" 
                      value={kickStyle} 
                      onChange={e => setKickStyle(e.target.value)} 
                      placeholder="Ej: Outfighter / Volume puncher"
                      className="form-input"
                    />
                  </div>
                  <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                    <label className="form-label">Notas de desempeño Kick Boxing</label>
                    <textarea 
                      rows={2}
                      value={kickNotes} 
                      onChange={e => setKickNotes(e.target.value)} 
                      placeholder="Ej: Buena velocidad en combos. Falta bloquear low kicks."
                      className="form-input"
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Muay Thai Config */}
            <div className="glass-card" style={{ padding: '20px', borderLeft: '4px solid var(--accent-muaythai)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
                <input 
                  type="checkbox" 
                  id="mtActive"
                  checked={mtActive}
                  onChange={(e) => setMtActive(e.target.checked)}
                  style={{ width: '18px', height: '18px', accentColor: 'var(--accent-muaythai)' }}
                />
                <label htmlFor="mtActive" style={{ fontWeight: 'bold', color: '#fff', fontSize: '0.95rem', cursor: 'pointer' }}>
                  Muay Thai (American Confederation)
                </label>
              </div>

              {mtActive && (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div className="form-group">
                    <label className="form-label">Grado / Mongkhon</label>
                    <select value={mtRank} onChange={e => setMtRank(e.target.value)} className="form-input">
                      <option value="Grado 1 (White Mongkhon)">Grado 1 (Blanco)</option>
                      <option value="Grado 4 (Green Mongkhon)">Grado 4 (Verde)</option>
                      <option value="Grado 8 (Yellow/White Mongkhon)">Grado 8 (Auxiliar - Amarillo/Blanco)</option>
                      <option value="Grado 12 (Red Mongkhon)">Grado 12 (Kru - Rojo)</option>
                      <option value="Kru / Mongkhon Rojo y Blanco (Instructor)">Kru / Mongkhon Rojo y Blanco</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Estilo (Femur/Khao/Dumat)</label>
                    <input 
                      type="text" 
                      value={mtStyle} 
                      onChange={e => setMtStyle(e.target.value)} 
                      placeholder="Ej: Muay Khao (Clinch / Rodillazos)"
                      className="form-input"
                    />
                  </div>
                  <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                    <label className="form-label">Notas de desempeño Muay Thai</label>
                    <textarea 
                      rows={2}
                      value={mtNotes} 
                      onChange={e => setMtNotes(e.target.value)} 
                      placeholder="Ej: Clinch fuerte. Trabajar en barridos y codazos de corta distancia."
                      className="form-input"
                    />
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Action Buttons */}
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', borderTop: '1px solid var(--border-color)', paddingTop: '20px', marginTop: '10px' }}>
            <button type="button" onClick={onClose} className="btn btn-secondary">
              Cancelar
            </button>
            <button type="submit" className="btn btn-primary">
              Guardar Cambios
            </button>
          </div>

        </form>
      </div>
    </div>
  );
};
