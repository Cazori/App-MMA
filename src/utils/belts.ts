import type { DisciplineKey } from '../types/mma';

export const BELT_COLORS: Record<string, string> = {
  // BJJ
  'Cinturón Blanco': '#f5f5f5',
  'Cinturón Azul': '#1d4ed8',
  'Cinturón Morado': '#7c3aed',
  'Cinturón Marrón': '#92400e',
  'Cinturón Negro': '#111111',

  // Kickboxing
  'Cinturón Amarillo': '#eab308',
  'Cinturón Naranja': '#f97316',
  'Cinturón Verde': '#16a34a',

  // Muay Thai - Mongkhon
  'Grado 1 (White Mongkhon)': '#f5f5f5',
  'Grado 4 (Green Mongkhon)': '#16a34a',
  'Grado 8 (Yellow/White Mongkhon)': '#eab308',
  'Grado 12 (Red Mongkhon)': '#dc2626',
  'Kru / Mongkhon Rojo y Blanco (Instructor)': '#dc2626',
};

export function getBeltColor(discipline: DisciplineKey, rank: string): string {
  if (discipline === 'muaythai') {
    return BELT_COLORS[rank] || '#f5f5f5';
  }
  return BELT_COLORS[rank] || '#f5f5f5';
}

export function getBeltLabel(rank: string): string {
  if (rank.includes('Mongkhon') || rank.includes('Kru')) return 'Mongkhon';
  return rank.replace('Cinturón ', '');
}
