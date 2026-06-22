import type { Fighter } from '../types/mma';

const STORAGE_KEY = 'mma_fighters_data';

const MOCK_FIGHTERS: Fighter[] = [
  {
    id: '1',
    name: 'Santiago "El Tiburón" Méndez',
    photoUrl: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=300&h=300&fit=crop&crop=faces',
    primaryStyle: 'Grappler',
    mainClub: 'Guerreros de Dios',
    subClub: 'Gator Grip (BJJ)',
    physicalMetrics: {
      height: 175,
      weight: 70,
      heartRate: 62,
    },
    disciplines: {
      bjj: {
        rank: 'Cinturón Morado',
        style: 'Especialista en Guardia Abierta (De la Riva)',
        active: true,
        notes: 'Excelente flexibilidad y control de cadera. Enfocado en transiciones rápidas.',
      },
      kickboxing: {
        rank: 'Cinturón Azul',
        style: 'Kickboxer Técnico',
        active: true,
        notes: 'Buen juego de pies, usa el kickboxing para acortar distancia e ir al clinch.',
      },
      muaythai: {
        rank: 'Grado 4 (Mongkhon Verde)',
        style: 'Krem (Defensivo)',
        active: false,
        notes: 'Baja frecuencia de entrenamiento en este apartado.',
      },
    },
    sparrings: [
      {
        id: 's1',
        title: 'Sparring de Gi con Cinturón Negro - Pasaje y Raspadas',
        url: 'https://www.youtube.com/embed/dQw4w9WgXcQ', // Mock video url
        date: '2026-06-15',
        notes: 'Se logró barrer dos veces usando media guardia profunda. Hay que ajustar la defensa de la espalda.',
      },
      {
        id: 's2',
        title: 'Drills de Llave de Brazo (Armbar) desde Guardia Cerrada',
        url: 'https://www.youtube.com/embed/dQw4w9WgXcQ',
        date: '2026-06-10',
        notes: 'Trabajando en el rompimiento de postura y la velocidad del giro de cadera.',
      },
    ],
  },
  {
    id: '2',
    name: 'Valentina "La Leona" Rojas',
    photoUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=300&h=300&fit=crop&crop=faces',
    primaryStyle: 'Striker',
    mainClub: 'Guerreros de Dios',
    subClub: 'Asociación Colombiana de Kick Boxing',
    physicalMetrics: {
      height: 168,
      weight: 60,
      heartRate: 58,
    },
    disciplines: {
      bjj: {
        rank: 'Cinturón Azul',
        style: 'Grappler Defensivo',
        active: true,
        notes: 'Enfocada en defensas de derribos y escapes rápidos hacia la guardia.',
      },
      kickboxing: {
        rank: 'Cinturón Negro (1er Dan)',
        style: 'Volume Striker / Outfighter',
        active: true,
        notes: 'Excelente volumen de golpes y velocidad. Frecuente uso de patadas medias y frontales.',
      },
      muaythai: {
        rank: 'Grado 8 (Mongkhon Amarillo y Blanco)',
        style: 'Muay Femur (Técnico)',
        active: true,
        notes: 'Manejo fluido de distancias largas, buen timing con los codos.',
      },
    },
    sparrings: [
      {
        id: 's3',
        title: 'Sparring de Striking de alta intensidad - Prep. Campeonato',
        url: 'https://www.youtube.com/embed/dQw4w9WgXcQ',
        date: '2026-06-18',
        notes: 'Buen movimiento lateral. Se debe subir más la mano derecha al lanzar la patada circular izquierda.',
      },
    ],
  },
  {
    id: '3',
    name: 'Mateo "Kru" Restrepo',
    photoUrl: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=300&h=300&fit=crop&crop=faces',
    primaryStyle: 'Muay Khao (Clinch)',
    mainClub: 'Guerreros de Dios',
    subClub: 'American Confederation (Muay Thai)',
    physicalMetrics: {
      height: 182,
      weight: 84,
      heartRate: 65,
    },
    disciplines: {
      bjj: {
        rank: 'Cinturón Blanco (4 Grados)',
        style: 'Presionador',
        active: true,
        notes: 'Usa su peso para controlar desde la media guardia y buscar llaves de presión.',
      },
      kickboxing: {
        rank: 'Cinturón Marrón',
        style: 'Striker de Presión',
        active: false,
        notes: 'Transicionó casi por completo al Muay Thai competitivo.',
      },
      muaythai: {
        rank: 'Kru / Mongkhon Rojo y Blanco (Instructor)',
        style: 'Muay Khao / Clincheador',
        active: true,
        notes: 'Especialista en clinch, rodillazos y proyecciones. Fuerte golpeo en corta distancia.',
      },
    },
    sparrings: [
      {
        id: 's4',
        title: 'Sparring de Clinch de Muay Thai y Proyecciones',
        url: 'https://www.youtube.com/embed/dQw4w9WgXcQ',
        date: '2026-06-12',
        notes: 'Dominio de la nuca (plum) y barridos eficientes. Ajustar la base al recibir rodillazos cruzados.',
      },
      {
        id: 's5',
        title: 'Entrenamiento técnico de esquiva de patadas y barridos (Sweeps)',
        url: 'https://www.youtube.com/embed/dQw4w9WgXcQ',
        date: '2026-06-08',
        notes: 'Práctica de timming para atrapar patadas medias y contraatacar con barrido bajo.',
      },
    ],
  },
];

export const getFighters = (): Fighter[] => {
  const data = localStorage.getItem(STORAGE_KEY);
  if (!data) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(MOCK_FIGHTERS));
    return MOCK_FIGHTERS;
  }
  try {
    return JSON.parse(data);
  } catch (error) {
    console.error('Error parsing fighters data from localStorage', error);
    return MOCK_FIGHTERS;
  }
};

export const saveFighter = (fighter: Fighter): Fighter[] => {
  const fighters = getFighters();
  const index = fighters.findIndex((f) => f.id === fighter.id);
  
  if (index >= 0) {
    fighters[index] = fighter;
  } else {
    fighters.push(fighter);
  }
  
  localStorage.setItem(STORAGE_KEY, JSON.stringify(fighters));
  return fighters;
};

export const deleteFighter = (id: string): Fighter[] => {
  const fighters = getFighters();
  const updated = fighters.filter((f) => f.id !== id);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  return updated;
};

export const calculateBMI = (weight: number, height: number): number => {
  if (height <= 0) return 0;
  const heightInMeters = height / 100;
  return Number((weight / (heightInMeters * heightInMeters)).toFixed(1));
};

export const getBMICategory = (bmi: number): { label: string; color: string } => {
  if (bmi < 18.5) return { label: 'Bajo Peso', color: '#60a5fa' }; // Blue
  if (bmi < 25) return { label: 'Normal / Atlético', color: '#10b981' }; // Green
  if (bmi < 30) return { label: 'Sobrepeso (Músculo/Grasa)', color: '#f59e0b' }; // Amber
  return { label: 'Obesidad / Peso Elevado', color: '#ef4444' }; // Red
};
export { MOCK_FIGHTERS };
