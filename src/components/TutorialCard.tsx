import type { Tutorial } from '../types/mma';
import { Play, Clock } from 'lucide-react';

interface TutorialCardProps {
  tutorial: Tutorial;
}

export const TutorialCard: React.FC<TutorialCardProps> = ({ tutorial }) => {
  return (
    <a
      href={tutorial.videoUrl}
      target="_blank"
      rel="noopener noreferrer"
      className="glass-card"
      style={{
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        textDecoration: 'none',
        cursor: 'pointer',
      }}
    >
      {/* Thumbnail with Play Overlay */}
      <div style={{ position: 'relative', width: '100%', height: '150px', overflow: 'hidden', background: '#000' }}>
        <img
          src={tutorial.thumbnailUrl}
          alt={tutorial.title}
          style={{ width: '100%', height: '100%', objectFit: 'cover', opacity: 0.8 }}
          onError={(e) => {
            (e.target as HTMLImageElement).src = `https://placehold.co/400x250/1a1a2e/666?text=${encodeURIComponent(tutorial.title.slice(0, 20))}`;
          }}
        />
        <div style={{
          position: 'absolute',
          inset: 0,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'rgba(0,0,0,0.3)',
          transition: 'background 0.2s',
        }}
          className="tutorial-play-overlay"
        >
          <div style={{
            width: '48px',
            height: '48px',
            borderRadius: '50%',
            background: 'rgba(244, 63, 94, 0.9)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}>
            <Play size={22} fill="white" color="white" />
          </div>
        </div>
        {/* Duration Badge */}
        <span style={{
          position: 'absolute',
          bottom: '8px',
          right: '8px',
          background: 'rgba(0,0,0,0.75)',
          color: '#fff',
          fontSize: '0.7rem',
          fontWeight: 700,
          padding: '3px 8px',
          borderRadius: '6px',
          display: 'flex',
          alignItems: 'center',
          gap: '4px',
        }}>
          <Clock size={10} />
          {tutorial.duration}
        </span>
      </div>

      {/* Info */}
      <div style={{ padding: '14px 16px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
        <h4 style={{ fontSize: '0.85rem', color: '#fff', fontWeight: 700, lineHeight: '1.3' }}>
          {tutorial.title}
        </h4>
        <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', lineHeight: '1.4', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
          {tutorial.description}
        </p>
      </div>
    </a>
  );
};
