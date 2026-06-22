export interface PhysicalMetrics {
  height: number; // en cm, ej: 178
  weight: number; // en kg, ej: 77
  heartRate: number; // bpm promedio o actual, ej: 68
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

export interface Fighter {
  id: string;
  name: string;
  photoUrl: string; // URL de la foto del deportista
  primaryStyle: string; // Estilo general: "All-rounder", "Striker", "Grappler"
  mainClub: string; // "Guerreros de Dios"
  subClub: string; // "Gator Grip" (BJJ), "Asociación Colombiana de Kick Boxing" (Kickboxing), o "American Confederation" (Muay Thai)
  physicalMetrics: PhysicalMetrics;
  disciplines: Disciplines;
  sparrings: SparringVideo[];
}
