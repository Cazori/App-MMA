export interface PhysicalMetrics {
  height: number; // en cm, ej: 178
  weight: number; // en kg, ej: 77
  restingHR: number; // bpm en reposo, ej: 62
  activeHR?: number; // bpm durante actividad/esfuerzo, ej: 145
  recoveryRate?: number; // recuperación (caída bpm tras 1 min), ej: 35
}

export interface SparringVideo {
  id: string;
  title: string;
  url: string; // url del video (Youtube o mock)
  date: string; // fecha del sparring
  notes?: string;
}

export interface DisciplineData {
  rank: string; // Cinturón en BJJ, cinturón en Kickboxing, Kru/Mongkhon en Muay Thai
  style: string; // Estilo específico (ej: Guardero, Presionador, Muay Khao)
  active: boolean; // Si practica activamente esta disciplina
  notes?: string;
}

export interface Disciplines {
  bjj: DisciplineData;
  kickboxing: DisciplineData;
  muaythai: DisciplineData;
}

export type PrimaryStyle = 'Striking' | 'Grappling' | 'Mixto';

export type CoachRole = 'ninguno' | 'monitor' | 'maestro';

export interface Fighter {
  id: string;
  name: string;
  photoUrl: string;
  createdAt?: string;
  updatedAt?: string;
  primaryStyle: PrimaryStyle;
  role?: 'atleta' | 'peleador';
  coachRole?: CoachRole;
  record?: string;
  physicalMetrics: PhysicalMetrics;
  disciplines: Disciplines;
  sparrings: SparringVideo[];
  socialMedia?: {
    instagram?: string;
    facebook?: string;
    youtube?: string;
    twitter?: string;
  };
}

// ─── Club & Sub-clubs ─────────────────────────────────────────────────────────

export type DisciplineKey = 'bjj' | 'kickboxing' | 'muaythai' | 'mma';

export interface SubClub {
  id: string;
  name: string;
  discipline: DisciplineKey;
  description: string;
  schedule: string;
  color: string;
}

export interface ClubInfo {
  name: string;
  tagline: string;
  foundedYear: number;
  foundedBy: string;
  mission: string;
  vision: string;
  address: string;
  city: string;
  country: string;
  phone: string[];
  email: string;
  website?: string;
  socialMedia: {
    instagram: string;
    facebook: string;
    youtube?: string;
    tiktok?: string;
  };
  totalMembers: number;
  totalFighters: number;
  totalCoaches: number;
  achievements: string[];
}

// ─── Tutorials ────────────────────────────────────────────────────────────────

export interface Tutorial {
  id: string;
  title: string;
  discipline: DisciplineKey;
  duration: string;     // ej: "8:32"
  thumbnailUrl: string;
  videoUrl: string;
  instructor: string;
  description: string;
  level: 'Principiante' | 'Intermedio' | 'Avanzado';
  tags: string[];
  date: string;
  views: number;
}

// ─── Schedule / Sessions ──────────────────────────────────────────────────────

export interface ScheduleSession {
  id: string;
  name: string;
  discipline: DisciplineKey;
  time: string;       // ej: "06:00 PM"
  location: string;   // ej: "Mat 1", "Ring", "Cage"
  coach: string;
  equipment?: string; // ej: "KB Gloves", "Gi"
  level: string;
}

// ─── Shop / Tienda ────────────────────────────────────────────────────────────

export interface ShopItem {
  id: string;
  name: string;
  description: string;
  price: string;
  image: string;
  category: 'uniformes' | 'equipo' | 'accesorios' | 'nutricion';
}

// ─── Alerts / Events ─────────────────────────────────────────────────────────

export type AlertType = 'event' | 'seminar' | 'shop' | 'warning' | 'info';

export interface ClubAlert {
  id: string;
  title: string;
  subtitle: string;
  type: AlertType;
  date?: string;
  color: string;      // CSS color del borde del alert
}
