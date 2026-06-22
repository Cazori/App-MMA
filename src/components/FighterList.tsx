import React, { useState } from 'react';
import type { Fighter } from '../types/mma';
import { Search, UserPlus, Trophy } from 'lucide-react';

// Import gym logos
import mainLogo from '../assets/Logos/CLUB GUERREREOS DE DIOS.png';
import bjjLogo from '../assets/Logos/BJJ.png';
import kickLogo from '../assets/Logos/Kick boxing.png';
import thaiLogo from '../assets/Logos/Muay thai.png';

interface FighterListProps {
  fighters: Fighter[];
  selectedFighterId: string;
  onSelectFighter: (id: string) => void;
  onOpenAddModal: () => void;
}

export const FighterList: React.FC<FighterListProps> = ({
  fighters,
  selectedFighterId,
  onSelectFighter,
  onOpenAddModal,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterDiscipline, setFilterDiscipline] = useState<'all' | 'bjj' | 'kickboxing' | 'muaythai'>('all');

  const filteredFighters = fighters.filter((fighter) => {
    const matchesSearch = fighter.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      fighter.primaryStyle.toLowerCase().includes(searchTerm.toLowerCase());
    
    if (filterDiscipline === 'all') return matchesSearch;
    return matchesSearch && fighter.disciplines[filterDiscipline].active;
  });

  return (
    <div className="sidebar-inner" style={{ display: 'flex', flexDirection: 'column', height: '100%', padding: '24px 16px' }}>
      
      {/* Gym Branding with Shield logo */}
      <div style={{ marginBottom: '24px', textAlign: 'center', borderBottom: '1px solid var(--border-color)', paddingBottom: '20px' }}>
        <div style={{ position: 'relative', display: 'inline-block', marginBottom: '12px' }}>
          <div style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            width: '86px',
            height: '86px',
            background: 'radial-gradient(circle, rgba(244,63,94,0.2) 0%, transparent 70%)',
            zIndex: 1,
            pointerEvents: 'none'
          }}></div>
          <img 
            src={mainLogo} 
            alt="Guerreros de Dios" 
            style={{ 
              width: '80px', 
              height: '80px', 
              objectFit: 'contain',
              position: 'relative',
              zIndex: 2,
              filter: 'drop-shadow(0 0 8px rgba(244, 63, 94, 0.35))'
            }} 
          />
        </div>
        <h2 style={{ fontSize: '1.25rem', textTransform: 'uppercase', letterSpacing: '0.08em', color: '#fff', fontWeight: '800' }}>
          Guerreros de Dios
        </h2>
        <p style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.2em', marginTop: '4px', fontWeight: '600' }}>
          Alianza de Combate
        </p>
        
        {/* Sub-clubs interactive quick info */}
        <div style={{ display: 'flex', justifyContent: 'center', gap: '8px', marginTop: '16px' }}>
          <img 
            src={bjjLogo} 
            alt="Gator Grip (BJJ)" 
            title="Gator Grip (BJJ)" 
            style={{ width: '28px', height: '28px', objectFit: 'contain', borderRadius: '50%', background: 'rgba(255,255,255,0.03)', padding: '2px', border: '1px solid rgba(167, 139, 250, 0.2)' }} 
          />
          <img 
            src={kickLogo} 
            alt="ACKB (Kickboxing)" 
            title="Asociación Colombiana de Kick Boxing" 
            style={{ width: '28px', height: '28px', objectFit: 'contain', borderRadius: '50%', background: 'rgba(255,255,255,0.03)', padding: '2px', border: '1px solid rgba(244, 63, 94, 0.2)' }} 
          />
          <img 
            src={thaiLogo} 
            alt="Am. Conf. (Muay Thai)" 
            title="American Confederation (Muay Thai)" 
            style={{ width: '28px', height: '28px', objectFit: 'contain', borderRadius: '50%', background: 'rgba(255,255,255,0.03)', padding: '2px', border: '1px solid rgba(56, 189, 248, 0.2)' }} 
          />
        </div>
      </div>

      {/* Register Fighter Button */}
      <button 
        className="btn btn-primary" 
        onClick={onOpenAddModal}
        style={{ width: '100%', marginBottom: '20px', padding: '12px' }}
      >
        <UserPlus size={18} />
        Registrar Peleador
      </button>

      {/* Search Input */}
      <div style={{ position: 'relative', marginBottom: '16px' }}>
        <Search size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)' }} />
        <input
          type="text"
          placeholder="Buscar peleador..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="form-input"
          style={{ paddingLeft: '38px', fontSize: '0.85rem' }}
        />
      </div>

      {/* Filter Tabs */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '4px', marginBottom: '20px', background: 'var(--bg-input)', padding: '3px', borderRadius: '8px' }}>
        <button
          onClick={() => setFilterDiscipline('all')}
          style={{
            background: filterDiscipline === 'all' ? 'rgba(255,255,255,0.06)' : 'transparent',
            border: 'none',
            color: filterDiscipline === 'all' ? '#fff' : 'var(--text-secondary)',
            fontSize: '0.7rem',
            padding: '8px 2px',
            borderRadius: '6px',
            cursor: 'pointer',
            fontWeight: filterDiscipline === 'all' ? 'bold' : 'normal',
          }}
        >
          Todos
        </button>
        <button
          onClick={() => setFilterDiscipline('bjj')}
          style={{
            background: filterDiscipline === 'bjj' ? 'rgba(167, 139, 250, 0.15)' : 'transparent',
            border: 'none',
            color: filterDiscipline === 'bjj' ? 'var(--accent-bjj)' : 'var(--text-secondary)',
            fontSize: '0.7rem',
            padding: '8px 2px',
            borderRadius: '6px',
            cursor: 'pointer',
            fontWeight: filterDiscipline === 'bjj' ? 'bold' : 'normal',
          }}
        >
          BJJ
        </button>
        <button
          onClick={() => setFilterDiscipline('kickboxing')}
          style={{
            background: filterDiscipline === 'kickboxing' ? 'rgba(244, 63, 94, 0.15)' : 'transparent',
            border: 'none',
            color: filterDiscipline === 'kickboxing' ? 'var(--accent-red)' : 'var(--text-secondary)',
            fontSize: '0.7rem',
            padding: '8px 2px',
            borderRadius: '6px',
            cursor: 'pointer',
            fontWeight: filterDiscipline === 'kickboxing' ? 'bold' : 'normal',
          }}
        >
          Kick
        </button>
        <button
          onClick={() => setFilterDiscipline('muaythai')}
          style={{
            background: filterDiscipline === 'muaythai' ? 'rgba(56, 189, 248, 0.15)' : 'transparent',
            border: 'none',
            color: filterDiscipline === 'muaythai' ? 'var(--accent-muaythai)' : 'var(--text-secondary)',
            fontSize: '0.7rem',
            padding: '8px 2px',
            borderRadius: '6px',
            cursor: 'pointer',
            fontWeight: filterDiscipline === 'muaythai' ? 'bold' : 'normal',
          }}
        >
          Muay
        </button>
      </div>

      {/* Fighters List */}
      <div style={{ flexGrow: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '10px' }}>
        {filteredFighters.length > 0 ? (
          filteredFighters.map((fighter) => {
            const isSelected = fighter.id === selectedFighterId;
            return (
              <div
                key={fighter.id}
                onClick={() => onSelectFighter(fighter.id)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  padding: '12px',
                  borderRadius: '16px',
                  cursor: 'pointer',
                  background: isSelected 
                    ? 'linear-gradient(135deg, rgba(244, 63, 94, 0.15) 0%, rgba(217, 119, 6, 0.05) 100%)' 
                    : 'rgba(255, 255, 255, 0.01)',
                  border: isSelected 
                    ? '1px solid rgba(244, 63, 94, 0.35)' 
                    : '1px solid rgba(255, 255, 255, 0.03)',
                  boxShadow: isSelected ? '0 4px 15px rgba(244, 63, 94, 0.1)' : 'none',
                  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                }}
                className="fighter-item-hover"
              >
                {/* Photo */}
                <div style={{ position: 'relative' }}>
                  <img
                    src={fighter.photoUrl}
                    alt={fighter.name}
                    style={{
                      width: '44px',
                      height: '44px',
                      borderRadius: '50%',
                      objectFit: 'cover',
                      border: isSelected ? '2px solid var(--accent-red)' : '1px solid rgba(255,255,255,0.1)',
                      transition: 'all 0.3s ease',
                    }}
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = `https://api.dicebear.com/7.x/bottts/svg?seed=${fighter.name}`;
                    }}
                  />
                  {/* Status Indicator */}
                  <span style={{
                    position: 'absolute',
                    bottom: '0',
                    right: '0',
                    width: '10px',
                    height: '10px',
                    borderRadius: '50%',
                    backgroundColor: 'var(--color-success)',
                    border: '2px solid var(--bg-secondary)'
                  }}></span>
                </div>
                
                {/* Info */}
                <div style={{ flexGrow: 1, overflow: 'hidden' }}>
                  <h4 style={{ 
                    fontSize: '0.9rem', 
                    color: isSelected ? '#fff' : 'var(--text-primary)', 
                    whiteSpace: 'nowrap', 
                    textOverflow: 'ellipsis', 
                    overflow: 'hidden', 
                    fontWeight: isSelected ? '800' : '600',
                    letterSpacing: '-0.01em'
                  }}>
                    {fighter.name}
                  </h4>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '2px' }}>
                    <span style={{ 
                      fontSize: '0.75rem', 
                      color: isSelected ? 'rgba(255,255,255,0.7)' : 'var(--text-secondary)',
                      fontWeight: '500'
                    }}>
                      {fighter.primaryStyle}
                    </span>
                  </div>
                </div>

                {/* Performance indicator icon/dot */}
                <div style={{ display: 'flex', alignItems: 'center' }}>
                  <Trophy size={14} style={{ color: isSelected ? 'var(--accent-gold)' : 'rgba(255,255,255,0.15)', filter: isSelected ? 'drop-shadow(0 0 4px rgba(251, 191, 36, 0.5))' : 'none' }} />
                </div>
              </div>
            );
          })
        ) : (
          <div style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '30px 0', fontSize: '0.85rem' }}>
            No se encontraron peleadores
          </div>
        )}
      </div>
    </div>
  );
};
