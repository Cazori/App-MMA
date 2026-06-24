import React, { useState, useEffect } from 'react';
import type { Fighter, PrimaryStyle, CoachRole } from '../types/mma';
import { Shield, X, Upload, Loader2 } from 'lucide-react';
import { useToast } from '../contexts/ToastContext';
import { useFocusTrap } from '../hooks/useFocusTrap';
import { compressImage } from '../utils/compressImage';
import { ImageCropper } from './ImageCropper';

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
  const { toast } = useToast();
  const [name, setName] = useState('');
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState('');
  const [showCropper, setShowCropper] = useState(false);
  const [saving, setSaving] = useState(false);
  const [primaryStyle, setPrimaryStyle] = useState<PrimaryStyle>('Mixto');
  const [role, setRole] = useState<'atleta' | 'peleador'>('atleta');
  const [coachRole, setCoachRole] = useState<CoachRole>('ninguno');

  
  // Physical Metrics
  const [height, setHeight] = useState(175);
  const [weight, setWeight] = useState(70);
  const [restingHR, setRestingHR] = useState(65);
  const [activeHR, setActiveHR] = useState(140);
  const [recoveryRate, setRecoveryRate] = useState(30);

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
      setPhotoPreview(fighter.photoUrl);
      setPrimaryStyle(fighter.primaryStyle);
      setRole(fighter.role || 'atleta');
      setCoachRole(fighter.coachRole || 'ninguno');
      
      setHeight(fighter.physicalMetrics.height);
      setWeight(fighter.physicalMetrics.weight);
      setRestingHR(fighter.physicalMetrics.restingHR);
      setActiveHR(fighter.physicalMetrics.activeHR || 140);
      setRecoveryRate(fighter.physicalMetrics.recoveryRate || 30);

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
      setPhotoPreview('https://images.unsplash.com/photo-1517841905240-472988babdf9?w=300&h=300&fit=crop&crop=faces');
    }
  }, [fighter]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setPhotoFile(file);
      setPhotoPreview(URL.createObjectURL(file));
      setShowCropper(true);
    }
  };

  const handleCropComplete = (croppedBlob: Blob) => {
    const url = URL.createObjectURL(croppedBlob);
    const croppedFile = new File([croppedBlob], photoFile?.name || 'photo.jpg', { type: 'image/jpeg' });
    setPhotoFile(croppedFile);
    setPhotoPreview(url);
    setShowCropper(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || saving) return;
    setSaving(true);

    let finalPhotoUrl = photoPreview;
    if (photoFile) {
      try {
        finalPhotoUrl = await compressImage(photoFile, 300, 0.7);
      } catch (err) {
        console.error('Error al comprimir foto:', err);
        setSaving(false);
        return;
      }
    }

    const fighterId = fighter?.id || `f-${Date.now()}`;
    const savedFighter: Fighter = {
      id: fighterId,
      name,
      photoUrl: finalPhotoUrl || 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=300&h=300&fit=crop&crop=faces',
      primaryStyle,
      role,
      ...(coachRole !== 'ninguno' && { coachRole }),
      physicalMetrics: {
        height: Number(height),
        weight: Number(weight),
        restingHR: Number(restingHR),
        activeHR: Number(activeHR),
        recoveryRate: Number(recoveryRate),
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

    try {
      await onSave(savedFighter);
      toast('success', fighter ? 'Peleador actualizado' : 'Peleador registrado');
    } catch (err) {
      console.error('Error al guardar peleador:', err);
      toast('error', 'Error al guardar. Intentá de nuevo.');
    }
    setSaving(false);
  };

  return (
    <>
      {showCropper && photoPreview && (
        <ImageCropper
          image={photoPreview}
          onCropComplete={handleCropComplete}
          onCancel={() => { setShowCropper(false); setPhotoPreview(''); setPhotoFile(null); }}
        />
      )}
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
        ref={useFocusTrap(true)}
        className="glass-panel" 
        style={{
          width: '100%',
          maxWidth: '750px',
          maxHeight: '90dvh',
          borderRadius: '24px',
          overflowY: 'auto',
          display: 'flex',
          flexDirection: 'column',
          position: 'relative',
        }}
      >
        <div style={{
          padding: '20px 24px',
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
            <Shield size={22} style={{ color: 'var(--accent-orange)' }} />
            <span>{fighter ? 'Editar Perfil de Peleador' : 'Registrar Nuevo Peleador'}</span>
          </h2>
          <button 
            onClick={onClose} 
            aria-label="Cerrar"
            style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', display: 'flex', alignItems: 'center' }}
            title="Cerrar modal"
          >
            <X size={24} />
          </button>
        </div>

        <form onSubmit={handleSubmit} style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
          
          <div>
            <h3 style={{ fontSize: '1rem', textTransform: 'uppercase', color: 'var(--accent-orange)', letterSpacing: '0.05em', marginBottom: '16px' }}>
              Datos Básicos
            </h3>
            
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
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
                <label className="form-label">Foto de Perfil</label>
                <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                  {photoPreview && (
                    <img src={photoPreview} alt="preview" style={{ width: '48px', height: '48px', borderRadius: '50%', objectFit: 'cover' }} />
                  )}
                  <label style={{
                    display: 'flex', alignItems: 'center', gap: '8px',
                    padding: '10px 16px', borderRadius: '12px',
                    border: '1px solid var(--border-color)',
                    background: 'var(--bg-input)', color: 'var(--text-secondary)',
                    cursor: 'pointer', fontSize: '0.85rem', flexGrow: 1,
                  }}>
                    <Upload size={16} />
                    {photoFile ? photoFile.name : 'Subir foto'}
                    <input type="file" accept="image/*" onChange={handleFileChange} style={{ display: 'none' }} />
                  </label>
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Estilo Principal de Pelea</label>
                <select 
                  value={primaryStyle} 
                  onChange={(e) => setPrimaryStyle(e.target.value as PrimaryStyle)}
                  className="form-input"
                >
                  <option value="Striking">Striking (Golpeo)</option>
                  <option value="Grappling">Grappling (Derribos y Llaves)</option>
                  <option value="Mixto">Mixto</option>
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Rol</label>
                <select 
                  value={role}
                  onChange={(e) => setRole(e.target.value as 'atleta' | 'peleador')}
                  className="form-input"
                >
                  <option value="atleta">Atleta</option>
                  <option value="peleador">Peleador</option>
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Rol de Enseñanza</label>
                <select
                  value={coachRole}
                  onChange={(e) => setCoachRole(e.target.value as CoachRole)}
                  className="form-input"
                >
                  <option value="ninguno">Ninguno</option>
                  <option value="monitor">Monitor</option>
                  <option value="maestro">Maestro</option>
                </select>
              </div>
            </div>
          </div>

          <div>
            <h3 style={{ fontSize: '1rem', textTransform: 'uppercase', color: 'var(--accent-orange)', letterSpacing: '0.05em', marginBottom: '16px', borderTop: '1px solid var(--border-color)', paddingTop: '20px' }}>
              Métricas Físicas
            </h3>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '12px' }}>
              <div className="form-group">
                <label className="form-label">Altura (cm)</label>
                <input type="number" value={height} onChange={(e) => setHeight(Number(e.target.value))} required min="50" max="250" className="form-input" />
              </div>
              <div className="form-group">
                <label className="form-label">Peso (kg)</label>
                <input type="number" value={weight} onChange={(e) => setWeight(Number(e.target.value))} required min="20" max="200" className="form-input" />
              </div>
              <div className="form-group">
                <label className="form-label">FC Reposo</label>
                <input type="number" value={restingHR} onChange={(e) => setRestingHR(Number(e.target.value))} required min="30" max="220" className="form-input" />
              </div>
              <div className="form-group">
                <label className="form-label">FC Actividad</label>
                <input type="number" value={activeHR} onChange={(e) => setActiveHR(Number(e.target.value))} min="30" max="250" className="form-input" />
              </div>
              <div className="form-group">
                <label className="form-label">Recuperación</label>
                <input type="number" value={recoveryRate} onChange={(e) => setRecoveryRate(Number(e.target.value))} min="0" max="100" className="form-input" />
              </div>
            </div>
          </div>

          <div>
            <h3 style={{ fontSize: '1rem', textTransform: 'uppercase', color: 'var(--accent-orange)', letterSpacing: '0.05em', marginBottom: '16px', borderTop: '1px solid var(--border-color)', paddingTop: '20px' }}>
              Ficha por Disciplinas
            </h3>

            {/* BJJ */}
            <div className="glass-card" style={{ padding: '20px', marginBottom: '16px', borderLeft: '4px solid var(--accent-bjj)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
                <input type="checkbox" id="bjjActive" checked={bjjActive} onChange={(e) => setBjjActive(e.target.checked)}
                  style={{ width: '18px', height: '18px', accentColor: 'var(--accent-bjj)' }} />
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
                    <input type="text" value={bjjStyle} onChange={e => setBjjStyle(e.target.value)} placeholder="Ej: Guardero / Pasador de presión" className="form-input" />
                  </div>
                  <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                    <label className="form-label">Notas de desempeño BJJ</label>
                    <textarea rows={2} value={bjjNotes} onChange={e => setBjjNotes(e.target.value)} placeholder="Ej: Excelente movilidad. Trabajar en pasajes de media guardia." className="form-input" />
                  </div>
                </div>
              )}
            </div>

            {/* Kickboxing */}
            <div className="glass-card" style={{ padding: '20px', marginBottom: '16px', borderLeft: '4px solid #ef4444' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
                <input type="checkbox" id="kickActive" checked={kickActive} onChange={(e) => setKickActive(e.target.checked)}
                  style={{ width: '18px', height: '18px', accentColor: '#ef4444' }} />
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
                    <input type="text" value={kickStyle} onChange={e => setKickStyle(e.target.value)} placeholder="Ej: Outfighter / Volume puncher" className="form-input" />
                  </div>
                  <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                    <label className="form-label">Notas de desempeño Kick Boxing</label>
                    <textarea rows={2} value={kickNotes} onChange={e => setKickNotes(e.target.value)} placeholder="Ej: Buena velocidad en combos. Falta bloquear low kicks." className="form-input" />
                  </div>
                </div>
              )}
            </div>

            {/* Muay Thai */}
            <div className="glass-card" style={{ padding: '20px', borderLeft: '4px solid var(--accent-muaythai)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
                <input type="checkbox" id="mtActive" checked={mtActive} onChange={(e) => setMtActive(e.target.checked)}
                  style={{ width: '18px', height: '18px', accentColor: 'var(--accent-muaythai)' }} />
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
                    <input type="text" value={mtStyle} onChange={e => setMtStyle(e.target.value)} placeholder="Ej: Muay Khao (Clinch / Rodillazos)" className="form-input" />
                  </div>
                  <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                    <label className="form-label">Notas de desempeño Muay Thai</label>
                    <textarea rows={2} value={mtNotes} onChange={e => setMtNotes(e.target.value)} placeholder="Ej: Clinch fuerte. Trabajar en barridos y codazos de corta distancia." className="form-input" />
                  </div>
                </div>
              )}
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', borderTop: '1px solid var(--border-color)', paddingTop: '20px', marginTop: '10px' }}>
            <button type="button" onClick={onClose} className="btn btn-secondary">
              Cancelar
            </button>
            <button type="submit" className="btn btn-primary" disabled={saving}>
              {saving ? <><Loader2 size={16} className="animate-spin" /> Guardando...</> : 'Guardar Cambios'}
            </button>
          </div>

        </form>
      </div>
    </div>
    </>
  );
};
