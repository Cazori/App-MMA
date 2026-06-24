import React, { useState, useCallback } from 'react';
import Cropper from 'react-easy-crop';
import type { Area } from 'react-easy-crop';
import { ZoomIn, ZoomOut, Check } from 'lucide-react';

interface ImageCropperProps {
  image: string;
  onCropComplete: (croppedBlob: Blob) => void;
  onCancel: () => void;
}

const createImage = (url: string): Promise<HTMLImageElement> =>
  new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = url;
  });

const getCroppedBlob = async (imageSrc: string, pixelCrop: Area): Promise<Blob> => {
  const image = await createImage(imageSrc);
  const canvas = document.createElement('canvas');
  canvas.width = pixelCrop.width;
  canvas.height = pixelCrop.height;
  const ctx = canvas.getContext('2d')!;
  ctx.drawImage(
    image,
    pixelCrop.x, pixelCrop.y, pixelCrop.width, pixelCrop.height,
    0, 0, pixelCrop.width, pixelCrop.height,
  );
  return new Promise((resolve) => {
    canvas.toBlob((blob) => resolve(blob!), 'image/jpeg', 0.9);
  });
};

export const ImageCropper: React.FC<ImageCropperProps> = ({ image, onCropComplete, onCancel }) => {
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null);
  const [saving, setSaving] = useState(false);

  const onCropChange = useCallback((location: { x: number; y: number }) => {
    setCrop(location);
  }, []);

  const onZoomChange = useCallback((z: number) => {
    setZoom(z);
  }, []);

  const onCropAreaComplete = useCallback((_: Area, croppedPixels: Area) => {
    setCroppedAreaPixels(croppedPixels);
  }, []);

  const handleSave = async () => {
    if (!croppedAreaPixels) return;
    setSaving(true);
    try {
      const blob = await getCroppedBlob(image, croppedAreaPixels);
      onCropComplete(blob);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 9999,
      display: 'flex', flexDirection: 'column',
      background: 'rgba(0,0,0,0.95)', backdropFilter: 'blur(4px)',
    }}>
      <div style={{
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        padding: '16px 20px', flexShrink: 0,
      }}>
        <button onClick={onCancel} style={{ background: 'none', border: 'none', color: '#fff', cursor: 'pointer', fontSize: '0.9rem' }}>
          Cancelar
        </button>
        <span style={{ color: '#fff', fontWeight: 600, fontSize: '0.95rem' }}>Ajustar foto</span>
        <button
          onClick={handleSave}
          disabled={saving}
          style={{
            background: 'var(--accent-orange)', border: 'none', color: '#fff',
            padding: '8px 16px', borderRadius: '8px', cursor: 'pointer',
            fontWeight: 600, fontSize: '0.85rem', opacity: saving ? 0.6 : 1,
            display: 'flex', alignItems: 'center', gap: '6px',
          }}
        >
          <Check size={16} />
          {saving ? 'Guardando...' : 'Aplicar'}
        </button>
      </div>

      <div style={{ flexGrow: 1, position: 'relative' }}>
        <Cropper
          image={image}
          crop={crop}
          zoom={zoom}
          aspect={1}
          cropShape="round"
          showGrid={false}
          onCropChange={onCropChange}
          onZoomChange={onZoomChange}
          onCropComplete={onCropAreaComplete}
        />
      </div>

      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '20px',
        padding: '16px 20px', flexShrink: 0,
      }}>
        <button onClick={() => setZoom((z) => Math.max(1, z - 0.1))} style={{ background: 'none', border: 'none', color: '#fff', cursor: 'pointer' }}>
          <ZoomOut size={24} />
        </button>
        <input
          type="range"
          min={1}
          max={3}
          step={0.01}
          value={zoom}
          onChange={(e) => setZoom(Number(e.target.value))}
          style={{ width: '200px', accentColor: 'var(--accent-orange)' }}
        />
        <button onClick={() => setZoom((z) => Math.min(3, z + 0.1))} style={{ background: 'none', border: 'none', color: '#fff', cursor: 'pointer' }}>
          <ZoomIn size={24} />
        </button>
      </div>
    </div>
  );
};
