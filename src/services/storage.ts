import { collection, doc, setDoc, deleteDoc, getDocs, query, orderBy, onSnapshot } from 'firebase/firestore';
import type { Unsubscribe } from 'firebase/firestore';
import { db } from './firebase';
import type { Fighter } from '../types/mma';

const FIGHTERS_COLLECTION = 'fighters';

const MOCK_FIGHTERS: Fighter[] = [
  {
    id: '1',
    name: 'Santiago "El Tiburón" Méndez',
    photoUrl: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=300&h=300&fit=crop&crop=faces',
    primaryStyle: 'Grappling',
    role: 'peleador',
    record: '14-2',
    physicalMetrics: {
      height: 175, weight: 70, restingHR: 62, activeHR: 148, recoveryRate: 38,
    },
    disciplines: {
      bjj: { rank: 'Cinturón Morado', style: 'Especialista en Guardia Abierta (De la Riva)', active: true, notes: 'Excelente flexibilidad y control de cadera. Enfocado en transiciones rápidas.' },
      kickboxing: { rank: 'Cinturón Azul', style: 'Kickboxer Técnico', active: true, notes: 'Buen juego de pies, usa el kickboxing para acortar distancia e ir al clinch.' },
      muaythai: { rank: 'Grado 4 (Mongkhon Verde)', style: 'Krem (Defensivo)', active: false, notes: 'Baja frecuencia de entrenamiento en este apartado.' },
    },
    sparrings: [
      { id: 's1', title: 'Sparring de Gi con Cinturón Negro - Pasaje y Raspadas', url: 'https://www.youtube.com/embed/dQw4w9WgXcQ', date: '2026-06-15', notes: 'Se logró barrer dos veces usando media guardia profunda. Hay que ajustar la defensa de la espalda.' },
      { id: 's2', title: 'Drills de Llave de Brazo (Armbar) desde Guardia Cerrada', url: 'https://www.youtube.com/embed/dQw4w9WgXcQ', date: '2026-06-10', notes: 'Trabajando en el rompimiento de postura y la velocidad del giro de cadera.' },
    ],
  },
  {
    id: '2',
    name: 'Valentina "La Leona" Rojas',
    photoUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=300&h=300&fit=crop&crop=faces',
    primaryStyle: 'Striking',
    role: 'peleador',
    record: '8-1',
    physicalMetrics: {
      height: 168, weight: 60, restingHR: 58, activeHR: 155, recoveryRate: 42,
    },
    disciplines: {
      bjj: { rank: 'Cinturón Azul', style: 'Grappler Defensivo', active: true, notes: 'Enfocada en defensas de derribos y escapes rápidos hacia la guardia.' },
      kickboxing: { rank: 'Cinturón Negro (1er Dan)', style: 'Volume Striker / Outfighter', active: true, notes: 'Excelente volumen de golpes y velocidad. Frecuente uso de patadas medias y frontales.' },
      muaythai: { rank: 'Grado 8 (Mongkhon Amarillo y Blanco)', style: 'Muay Femur (Técnico)', active: true, notes: 'Manejo fluido de distancias largas, buen timing con los codos.' },
    },
    sparrings: [
      { id: 's3', title: 'Sparring de Striking de alta intensidad - Prep. Campeonato', url: 'https://www.youtube.com/embed/dQw4w9WgXcQ', date: '2026-06-18', notes: 'Buen movimiento lateral. Se debe subir más la mano derecha al lanzar la patada circular izquierda.' },
    ],
  },
  {
    id: '3',
    name: 'Mateo "Kru" Restrepo',
    photoUrl: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=300&h=300&fit=crop&crop=faces',
    primaryStyle: 'Mixto',
    role: 'peleador',
    coachRole: 'maestro',
    record: '11-3',
    physicalMetrics: {
      height: 182, weight: 84, restingHR: 65, activeHR: 160, recoveryRate: 32,
    },
    disciplines: {
      bjj: { rank: 'Cinturón Blanco (4 Grados)', style: 'Presionador', active: true, notes: 'Usa su peso para controlar desde la media guardia y buscar llaves de presión.' },
      kickboxing: { rank: 'Cinturón Marrón', style: 'Striker de Presión', active: false, notes: 'Transicionó casi por completo al Muay Thai competitivo.' },
      muaythai: { rank: 'Kru / Mongkhon Rojo y Blanco (Instructor)', style: 'Muay Khao / Clincheador', active: true, notes: 'Especialista en clinch, rodillazos y proyecciones. Fuerte golpeo en corta distancia.' },
    },
    sparrings: [
      { id: 's4', title: 'Sparring de Clinch de Muay Thai y Proyecciones', url: 'https://www.youtube.com/embed/dQw4w9WgXcQ', date: '2026-06-12', notes: 'Dominio de la nuca (plum) y barridos eficientes. Ajustar la base al recibir rodillazos cruzados.' },
      { id: 's5', title: 'Entrenamiento técnico de esquiva de patadas y barridos (Sweeps)', url: 'https://www.youtube.com/embed/dQw4w9WgXcQ', date: '2026-06-08', notes: 'Práctica de timming para atrapar patadas medias y contraatacar con barrido bajo.' },
    ],
  },
];

export const subscribeFighters = (onData: (fighters: Fighter[]) => void, onError?: (err: Error) => void): Unsubscribe => {
  const q = query(collection(db, FIGHTERS_COLLECTION), orderBy('name'));
  return onSnapshot(q,
    (snapshot) => {
      if (snapshot.empty) {
        seedFighters()
          .then(async () => {
            const q2 = query(collection(db, FIGHTERS_COLLECTION), orderBy('name'));
            const snap2 = await getDocs(q2);
            const list = snap2.docs.map(d => ({ id: d.id, ...d.data() } as Fighter));
            onData(list);
          })
          .catch((err) => {
            console.error('seed/refetch error:', err);
            onError?.(err);
          });
        return;
      }
      const list = snapshot.docs.map(d => ({ id: d.id, ...d.data() } as Fighter));
      onData(list);
    },
    (err) => {
      console.error('Firestore subscribe error:', err);
      onError?.(err);
    }
  );
};

export const saveFighter = async (fighter: Fighter): Promise<void> => {
  const { id, ...data } = fighter;
  await setDoc(doc(db, FIGHTERS_COLLECTION, id), data);
};

export const deleteFighter = async (id: string): Promise<void> => {
  await deleteDoc(doc(db, FIGHTERS_COLLECTION, id));
};
const seedFighters = async (): Promise<void> => {
  const existing = await getDocs(collection(db, FIGHTERS_COLLECTION));
  if (!existing.empty) return;
  for (const f of MOCK_FIGHTERS) {
    const { id, ...data } = f;
    await setDoc(doc(db, FIGHTERS_COLLECTION, id), data);
  }
};

export const calculateBMI = (weight: number, height: number): number => {
  if (height <= 0) return 0;
  const heightInMeters = height / 100;
  return Number((weight / (heightInMeters * heightInMeters)).toFixed(1));
};

export const getBMICategory = (bmi: number): { label: string; color: string } => {
  if (bmi < 18.5) return { label: 'Bajo Peso', color: '#60a5fa' };
  if (bmi < 25) return { label: 'Normal / Atlético', color: '#10b981' };
  if (bmi < 30) return { label: 'Sobrepeso (Músculo/Grasa)', color: '#f59e0b' };
  return { label: 'Obesidad / Peso Elevado', color: '#ef4444' };
};