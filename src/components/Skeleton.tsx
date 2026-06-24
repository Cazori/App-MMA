import React from 'react';

interface SkeletonProps {
  width?: string;
  height?: string;
  borderRadius?: string;
  count?: number;
  style?: React.CSSProperties;
}

export const Skeleton: React.FC<SkeletonProps> = ({
  width = '100%',
  height = '20px',
  borderRadius = '8px',
  count = 1,
  style,
}) => {
  const baseStyle: React.CSSProperties = {
    width,
    height,
    borderRadius,
    background: 'linear-gradient(90deg, rgba(255,255,255,0.03) 25%, rgba(255,255,255,0.08) 50%, rgba(255,255,255,0.03) 75%)',
    backgroundSize: '200% 100%',
    animation: 'shimmer 1.5s infinite',
    ...style,
  };

  return (
    <>
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} style={baseStyle} />
      ))}
    </>
  );
};

export const PageSkeleton: React.FC = () => (
  <div style={{
    flexGrow: 1,
    display: 'flex',
    flexDirection: 'column',
    gap: '20px',
    padding: '30px',
  }}>
    <Skeleton width="200px" height="28px" />
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px' }}>
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} style={{
          padding: '20px',
          borderRadius: '16px',
          background: 'rgba(255,255,255,0.02)',
          display: 'flex',
          flexDirection: 'column',
          gap: '12px',
        }}>
          <Skeleton width="100%" height="160px" borderRadius="12px" />
          <Skeleton width="80%" height="16px" />
          <Skeleton width="60%" height="14px" />
        </div>
      ))}
    </div>
  </div>
);
