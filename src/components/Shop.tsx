import { SHOP_ITEMS } from '../services/clubData';
import { ShoppingBag, Tag } from 'lucide-react';

const CATEGORIES = [
  { key: 'uniformes', label: 'Uniformes', color: 'var(--accent-orange)' },
  { key: 'equipo', label: 'Equipo', color: 'var(--accent-bjj)' },
  { key: 'accesorios', label: 'Accesorios', color: 'var(--accent-muaythai)' },
  { key: 'nutricion', label: 'Nutrición', color: 'var(--accent-gold)' },
];

export const Shop: React.FC = () => {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '28px' }}>
      <div>
        <h1 style={{ fontSize: '1.8rem', color: '#fff', fontWeight: 800, letterSpacing: '-0.02em', display: 'flex', alignItems: 'center', gap: '10px' }}>
          <ShoppingBag size={28} style={{ color: 'var(--accent-orange)' }} />
          Tienda del Club
        </h1>
        <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', marginTop: '4px' }}>
          Equipamiento, uniformes y accesorios oficiales de Guerreros de Dios
        </p>
      </div>

      {/* Category Legend */}
      <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
        {CATEGORIES.map((cat) => (
          <div key={cat.key} style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
            <span style={{ width: '10px', height: '10px', borderRadius: '50%', background: cat.color }} />
            {cat.label}
          </div>
        ))}
      </div>

      {/* Items Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '20px' }}>
        {SHOP_ITEMS.map((item) => {
          const cat = CATEGORIES.find((c) => c.key === item.category);
          return (
            <div key={item.id} className="glass-card" style={{
              padding: '20px',
              display: 'flex',
              flexDirection: 'column',
              gap: '14px',
              borderTop: `3px solid ${cat?.color || 'var(--border-color)'}`,
            }}>
              <img
                src={item.image}
                alt={item.name}
                style={{ width: '100%', height: '160px', objectFit: 'cover', borderRadius: '10px' }}
                onError={(e) => {
                  (e.target as HTMLImageElement).src = 'https://placehold.co/300x300/1a1a2e/666?text=Producto';
                }}
              />
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <h4 style={{ fontSize: '0.9rem', color: '#fff', fontWeight: 700, flexGrow: 1 }}>
                  {item.name}
                </h4>
                <span style={{ fontSize: '0.8rem', color: 'var(--accent-gold)', fontWeight: 800, whiteSpace: 'nowrap', marginLeft: '8px' }}>
                  {item.price}
                </span>
              </div>
              <p style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', lineHeight: '1.5' }}>
                {item.description}
              </p>
              <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.7rem', color: cat?.color || 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase' }}>
                <Tag size={12} />
                {cat?.label || item.category}
              </div>
            </div>
          );
        })}
      </div>

      {SHOP_ITEMS.length === 0 && (
        <p style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '40px' }}>
          Próximamente más productos disponibles.
        </p>
      )}
    </div>
  );
};
