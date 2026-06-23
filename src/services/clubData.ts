import type { SubClub, ClubInfo, Tutorial, ScheduleSession, ClubAlert, ShopItem } from '../types/mma';
import bjjLogo from '../assets/Logos/BJJ.png';
import kickLogo from '../assets/Logos/Kick boxing.png';
import thaiLogo from '../assets/Logos/Muay thai.png';

export const SUB_CLUBS: SubClub[] = [
  {
    id: 'bjj',
    name: 'Gator Grip (BJJ)',
    discipline: 'bjj',
    description: 'Escuela de Jiu-Jitsu Brasileño con linaje Gracie. Especialistas en guardia abierta, barridos y finalizaciones. Gi y No-Gi.',
    schedule: 'Mar y Jue — 18:00 a 20:00',
    color: 'var(--accent-bjj)',
  },
  {
    id: 'kickboxing',
    name: 'Asociación Colombiana de Kick Boxing',
    discipline: 'kickboxing',
    description: 'Kickboxing técnico con énfasis en volumen de golpes, juego de pies y defensa personal. Preparación para competencias WAKO.',
    schedule: 'Lun, Mié y Vie — 06:00 PM a 08:00 PM',
    color: '#ef4444',
  },
  {
    id: 'muaythai',
    name: 'American Confederation (Muay Thai)',
    discipline: 'muaythai',
    description: 'Muay Thai tradicional con enfoque en clinch, rodillazos, codazos y sparring controlado. Preparación para estadio y circuito profesional.',
    schedule: 'Lun, Mié y Vie — 07:00 PM a 09:00 PM',
    color: 'var(--accent-muaythai)',
  },
];

export const CLUB_INFO: ClubInfo = {
  name: 'Guerreros de Dios MMA',
  tagline: 'Alianza de Artes Marciales Mixtas',
  foundedYear: 2018,
  foundedBy: 'Prof. Carlos Méndez y Sifu Andrés Rojas',
  mission: 'Formar atletas completos a través de la disciplina, el respeto y la excelencia técnica en todas las artes marciales.',
  vision: 'Ser la alianza de MMA más prestigiosa de Colombia, produciendo campeones nacionales e internacionales.',
  address: 'Calle 13 #23A90',
  city: 'Santiago de Cali',
  country: 'Colombia',
  phone: ['+57 312 8160660'],
  email: 'contacto@guerrerosdedios.com',
  website: 'https://guerrerosdedios.com',
  socialMedia: {
    instagram: 'asociaciondekickboxingcolombia',
    facebook: 'guerrerosdedios.oficial',
    youtube: 'brazilianjiujitsucali',
    tiktok: '',
  },
  totalMembers: 12,
  totalFighters: 0,
  totalCoaches: 6,
  achievements: [
    'Campeón Nacional de Clubes 2025',
    'Mejor Alianza Deportiva 2024',
    '5 títulos nacionales en Kickboxing',
    '3 cinturones nacionales de BJJ',
  ],
};

export const TUTORIALS: Tutorial[] = [
  {
    id: 't1',
    title: 'Armbar desde Guardia Cerrada',
    description: 'Técnica paso a paso para finalizar con llave de brazo desde la guardia cerrada en BJJ.',
    thumbnailUrl: 'https://images.unsplash.com/photo-1555597673-b21d5c935c9c?w=400&h=250&fit=crop',
    videoUrl: 'https://www.youtube.com/embed/dQw4w9WgXcQ',
    discipline: 'bjj',
    duration: '12:30',
    instructor: 'Prof. Gator',
    level: 'Intermedio',
    tags: ['guardia', 'finalización', 'brazo'],
    date: '2026-05-10',
    views: 1250,
  },
  {
    id: 't2',
    title: 'Combo de 3 Golpes + Low Kick',
    description: 'Combinación básica de jab-cross-low kick para control de distancia en Kickboxing.',
    thumbnailUrl: 'https://images.unsplash.com/photo-1549719386-74dfcbf7dbed?w=400&h=250&fit=crop',
    videoUrl: 'https://www.youtube.com/embed/dQw4w9WgXcQ',
    discipline: 'kickboxing',
    duration: '8:15',
    instructor: 'Sifu Rojas',
    level: 'Principiante',
    tags: ['golpeo', 'combinaciones', 'piernas'],
    date: '2026-05-08',
    views: 980,
  },
  {
    id: 't3',
    title: 'Clincheo Muay Thai: Plum y Rodillazos',
    description: 'Control de la nuca (plum), desbalanceo y rodillazos en corta distancia al cuerpo.',
    thumbnailUrl: 'https://images.unsplash.com/photo-1599058917212-d750089bc07e?w=400&h=250&fit=crop',
    videoUrl: 'https://www.youtube.com/embed/dQw4w9WgXcQ',
    discipline: 'muaythai',
    duration: '15:45',
    instructor: 'Kru Restrepo',
    level: 'Avanzado',
    tags: ['clinch', 'rodilla', 'corta distancia'],
    date: '2026-05-05',
    views: 2100,
  },
  {
    id: 't4',
    title: 'Drill de Pases de Guardia para Principiantes',
    description: 'Tres pases de guardia esenciales para el practicante de BJJ nivel blanco/azul.',
    thumbnailUrl: 'https://images.unsplash.com/photo-1583473848882-f9a5bc7e6e3c?w=400&h=250&fit=crop',
    videoUrl: 'https://www.youtube.com/embed/dQw4w9WgXcQ',
    discipline: 'bjj',
    duration: '10:00',
    instructor: 'Prof. Gator',
    level: 'Principiante',
    tags: ['pases', 'guardia', 'posición'],
    date: '2026-04-28',
    views: 750,
  },
];

export const SCHEDULE: ScheduleSession[] = [
  {
    id: 's1',
    name: 'Kick Boxing',
    discipline: 'kickboxing',
    time: '06:00 PM',
    location: 'Ring',
    coach: 'Sifu Andrés Rojas',
    level: 'Todos los niveles',
  },
  {
    id: 's2',
    name: 'Muay Thai',
    discipline: 'muaythai',
    time: '07:00 PM',
    location: 'Mat 2',
    coach: 'Kru Mateo Restrepo',
    level: 'Todos los niveles',
  },
  {
    id: 's3',
    name: 'BJJ Gi/No-Gi',
    discipline: 'bjj',
    time: '06:00 PM',
    location: 'Mat 1',
    coach: 'Prof. Carlos Méndez',
    level: 'Todos los niveles',
  },
  {
    id: 's4',
    name: 'Mixtas / MMA',
    discipline: 'mma',
    time: '09:00 AM',
    location: 'Mat 1 + Ring',
    coach: 'Staff',
    level: 'Intermedio/Avanzado',
  },
];

export const ALERTS: ClubAlert[] = [
  {
    id: 'a1',
    title: 'Campeonato Sur americano de kick boxing',
    subtitle: 'Bolivia — 10 de Julio',
    type: 'event',
    date: '10 Jul',
    color: 'var(--accent-orange)',
  },
];

export const SHOP_ITEMS: ShopItem[] = [
  {
    id: 'shop1',
    name: 'Rashguard Guerreros de Dios',
    description: 'Rashguard de compresión con logo del club. Tejido dry-fit, costuras planas. Ideal para BJJ y entrenamiento.',
    price: '$85.000 COP',
    image: 'https://images.unsplash.com/photo-1576566540129-4b3d0e6c7d96?w=300&h=300&fit=crop',
    category: 'uniformes',
  },
  {
    id: 'shop2',
    name: 'Short de MMA',
    description: 'Short oficial del club con cintura elástica y forro interno. Resistente para sparring y competencia.',
    price: '$65.000 COP',
    image: 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=300&h=300&fit=crop',
    category: 'uniformes',
  },
  {
    id: 'shop3',
    name: 'Vendas de Boxeo',
    description: 'Vendas elásticas de 4.5m con cierre de velcro. Protección para manos en Kickboxing y Muay Thai.',
    price: '$25.000 COP',
    image: 'https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?w=300&h=300&fit=crop',
    category: 'equipo',
  },
  {
    id: 'shop4',
    name: 'Botella Térmica',
    description: 'Botella de acero inoxidable 750ml con logo grabado del club. Mantiene la temperatura por 12h.',
    price: '$45.000 COP',
    image: 'https://images.unsplash.com/photo-1602143407151-7111542de6e8?w=300&h=300&fit=crop',
    category: 'accesorios',
  },
];

export { bjjLogo, kickLogo, thaiLogo };
