import { collection, doc, setDoc, deleteDoc, getDocs, query, orderBy, onSnapshot, Timestamp, where } from 'firebase/firestore';
import type { Unsubscribe } from 'firebase/firestore';
import { db } from './firebase';
import type { Fighter, MetricSnapshot, Payment, FollowUp, PaymentConfig, PaymentEdit } from '../types/mma';

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

const toFighter = (id: string, data: Record<string, unknown>): Fighter => ({
  id,
  name: (data.name as string) || '',
  photoUrl: (data.photoUrl as string) || 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=300&h=300&fit=crop&crop=faces',
  primaryStyle: (data.primaryStyle as Fighter['primaryStyle']) || 'Mixto',
  role: (data.role as Fighter['role']) || 'atleta',
  coachRole: (data.coachRole as Fighter['coachRole']),
  record: (data.record as string) || '',
  physicalMetrics: {
    height: ((data.physicalMetrics as Record<string, unknown>)?.height as number) || 175,
    weight: ((data.physicalMetrics as Record<string, unknown>)?.weight as number) || 70,
    restingHR: ((data.physicalMetrics as Record<string, unknown>)?.restingHR as number) || 65,
    activeHR: ((data.physicalMetrics as Record<string, unknown>)?.activeHR as number) || 140,
    recoveryRate: ((data.physicalMetrics as Record<string, unknown>)?.recoveryRate as number) || 30,
  },
  disciplines: {
    bjj: { rank: '', style: '', active: false, notes: '' },
    kickboxing: { rank: '', style: '', active: false, notes: '' },
    muaythai: { rank: '', style: '', active: false, notes: '' },
    ...(data.disciplines as Record<string, unknown> || {}),
  },
  customMetrics: (data.customMetrics as Fighter['customMetrics']) || [],
  metricSnapshots: (data.metricSnapshots as Fighter['metricSnapshots']) || [],
  sparrings: (data.sparrings as Fighter['sparrings']) || [],
  socialMedia: data.socialMedia as Fighter['socialMedia'],
  createdAt: data.createdAt as string,
  updatedAt: data.updatedAt as string,
});

export const subscribeFighters = (onData: (fighters: Fighter[]) => void, onError?: (err: Error) => void): Unsubscribe => {
  const q = query(collection(db, FIGHTERS_COLLECTION), orderBy('name'));
  return onSnapshot(q,
    (snapshot) => {
      if (snapshot.empty) {
        seedFighters()
          .then(async () => {
            const q2 = query(collection(db, FIGHTERS_COLLECTION), orderBy('name'));
            const snap2 = await getDocs(q2);
            const list = snap2.docs.map(d => toFighter(d.id, d.data() as Record<string, unknown>));
            onData(list);
          })
          .catch((err) => {
            console.error('seed/refetch error:', err);
            onError?.(err);
          });
        return;
      }
      const list = snapshot.docs.map(d => toFighter(d.id, d.data() as Record<string, unknown>));
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
  const now = new Date().toISOString();
  const payload = { ...data, updatedAt: now };
  if (!fighter.createdAt) {
    payload.createdAt = now;
  } else {
    payload.createdAt = fighter.createdAt;
  }
  await setDoc(doc(db, FIGHTERS_COLLECTION, id), payload, { merge: true });
};

const snapshotFromDiff = (oldFighter: Fighter | null, newFighter: Fighter): MetricSnapshot | null => {
  const oldM = oldFighter?.physicalMetrics;
  const newM = newFighter.physicalMetrics;
  const snapshot: MetricSnapshot = { date: new Date().toISOString().slice(0, 10) };
  let changed = false;

  if (oldM?.weight !== newM.weight) { snapshot.weight = newM.weight; changed = true; }
  if (oldM?.height !== newM.height) { snapshot.height = newM.height; changed = true; }
  if (oldM?.restingHR !== newM.restingHR) { snapshot.restingHR = newM.restingHR; changed = true; }
  if (oldM?.activeHR !== newM.activeHR) { snapshot.activeHR = newM.activeHR; changed = true; }
  if (oldM?.recoveryRate !== newM.recoveryRate) { snapshot.recoveryRate = newM.recoveryRate; changed = true; }

  // Custom metrics: capture all visible values for reference
  const visibleOld = (oldFighter?.customMetrics || []).filter(m => m.visible).map(m => ({ label: m.label, value: m.value }));
  const visibleNew = (newFighter.customMetrics || []).filter(m => m.visible).map(m => ({ label: m.label, value: m.value }));
  if (JSON.stringify(visibleOld) !== JSON.stringify(visibleNew)) {
    snapshot.customMetrics = visibleNew;
    changed = true;
  }

  return changed ? snapshot : null;
};

export const saveFighterWithSnapshot = async (oldFighter: Fighter | null, newFighter: Fighter, note?: string): Promise<void> => {
  const snapshot = snapshotFromDiff(oldFighter, newFighter);
  if (snapshot) {
    if (note) snapshot.note = note;
    const snapshots = [...(newFighter.metricSnapshots || []), snapshot].slice(-50); // keep last 50
    newFighter = { ...newFighter, metricSnapshots: snapshots };
  }
  await saveFighter(newFighter);
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

// ─── Payments CRUD ───────────────────────────────────────────────────────────

const PAYMENTS_COLLECTION = 'payments';

const toPayment = (id: string, data: Record<string, unknown>): Payment => ({
  id,
  fighterId: (data.fighterId as string) || '',
  period: (data.period as string) || '',
  amount: (data.amount as number) || 0,
  method: (data.method as Payment['method']) || 'cash',
  status: (data.status as Payment['status']) || 'paid',
  notes: (data.notes as string) || undefined,
  paidAt: ((data.paidAt as Timestamp)?.toDate?.()?.toISOString?.()) || (data.paidAt as string) || new Date().toISOString(),
  cancelledAt: (data.cancelledAt as Timestamp)?.toDate?.()?.toISOString?.() || (data.cancelledAt as string) || undefined,
  cancelledBy: (data.cancelledBy as string) || undefined,
  createdAt: ((data.createdAt as Timestamp)?.toDate?.()?.toISOString?.()) || (data.createdAt as string) || new Date().toISOString(),
  updatedAt: ((data.updatedAt as Timestamp)?.toDate?.()?.toISOString?.()) || (data.updatedAt as string) || new Date().toISOString(),
  history: (data.history as Payment['history']) || undefined,
});

export const subscribePayments = (
  onData: (payments: Payment[]) => void,
  onError?: (err: Error) => void
): Unsubscribe => {
  const q = query(
    collection(db, PAYMENTS_COLLECTION),
    orderBy('period', 'desc'),
    orderBy('fighterId')
  );
  return onSnapshot(q,
    (snapshot) => {
      const list = snapshot.docs.map(d => toPayment(d.id, d.data() as Record<string, unknown>));
      onData(list);
    },
    (err) => {
      console.error('Payments subscribe error:', err);
      onError?.(err);
    }
  );
};

export const subscribePaymentsByPeriod = (
  period: string,
  onData: (payments: Payment[]) => void,
  onError?: (err: Error) => void
): Unsubscribe => {
  const q = query(
    collection(db, PAYMENTS_COLLECTION),
    where('period', '==', period)
  );
  return onSnapshot(q,
    (snapshot) => {
      const list = snapshot.docs.map(d => toPayment(d.id, d.data() as Record<string, unknown>));
      onData(list);
    },
    (err) => {
      console.error('Payments by period subscribe error:', err);
      onError?.(err);
    }
  );
};

export const savePayment = async (payment: Payment): Promise<void> => {
  const { id, history, ...data } = payment;
  const payload: Record<string, unknown> = {
    ...data,
    paidAt: Timestamp.fromDate(new Date(data.paidAt)),
    createdAt: data.createdAt ? Timestamp.fromDate(new Date(data.createdAt)) : Timestamp.now(),
    updatedAt: Timestamp.now(),
  };
  if (history && history.length > 0) {
    payload.history = history;
  }
  if (data.cancelledAt) {
    payload.cancelledAt = Timestamp.fromDate(new Date(data.cancelledAt));
  }
  await setDoc(doc(db, PAYMENTS_COLLECTION, id), payload, { merge: true });
};

export const updatePayment = async (
  id: string,
  updates: Partial<Payment>,
  editEntry?: PaymentEdit
): Promise<void> => {
  const docRef = doc(db, PAYMENTS_COLLECTION, id);
  const payload: Record<string, unknown> = {
    ...updates,
    updatedAt: Timestamp.now(),
  };
  // Convert Timestamp fields
  if (updates.paidAt) payload.paidAt = Timestamp.fromDate(new Date(updates.paidAt));
  if (updates.cancelledAt) payload.cancelledAt = Timestamp.fromDate(new Date(updates.cancelledAt));
  // Handle history push
  if (editEntry) {
    const existingDoc = await getDocs(query(collection(db, PAYMENTS_COLLECTION), where('__name__', '==', id)));
    if (!existingDoc.empty) {
      const currentHistory = (existingDoc.docs[0].data().history as Payment['history']) || [];
      payload.history = [...currentHistory, editEntry].slice(-20);
    } else {
      payload.history = [editEntry];
    }
  }
  await setDoc(docRef, payload, { merge: true });
};

export const cancelPayment = async (id: string, cancelledBy: string): Promise<void> => {
  const docRef = doc(db, PAYMENTS_COLLECTION, id);
  await setDoc(docRef, {
    status: 'cancelled',
    cancelledAt: Timestamp.now(),
    cancelledBy,
    updatedAt: Timestamp.now(),
  }, { merge: true });
};

export const deletePayment = async (id: string): Promise<void> => {
  await deleteDoc(doc(db, PAYMENTS_COLLECTION, id));
};

export const saveFollowUp = async (paymentId: string, followUp: FollowUp): Promise<void> => {
  const now = Timestamp.now();
  const payload: Record<string, unknown> = {
    status: followUp.status,
    updatedAt: now,
  };
  if (followUp.note) payload.note = followUp.note;
  if (followUp.contactedAt) payload.contactedAt = Timestamp.fromDate(new Date(followUp.contactedAt));

  const followUpId = followUp.id || `fu-${Date.now()}`;
  await setDoc(doc(db, PAYMENTS_COLLECTION, paymentId, 'followUp', followUpId), payload, { merge: true });
};

export const subscribeFollowUp = (
  paymentId: string,
  onData: (followUps: FollowUp[]) => void,
  onError?: (err: Error) => void
): Unsubscribe => {
  const q = query(
    collection(db, PAYMENTS_COLLECTION, paymentId, 'followUp'),
    orderBy('updatedAt', 'desc')
  );
  return onSnapshot(q,
    (snapshot) => {
      const list = snapshot.docs.map(d => {
        const data = d.data() as Record<string, unknown>;
        return {
          id: d.id,
          status: (data.status as FollowUp['status']) || 'pending-contact',
          note: (data.note as string) || undefined,
          contactedAt: (data.contactedAt as Timestamp)?.toDate?.()?.toISOString?.() || undefined,
          updatedAt: (data.updatedAt as Timestamp)?.toDate?.()?.toISOString?.() || new Date().toISOString(),
        } as FollowUp;
      });
      onData(list);
    },
    (err) => {
      console.error('FollowUp subscribe error:', err);
      onError?.(err);
    }
  );
};

// ─── Payment Config ──────────────────────────────────────────────────────────

export const subscribePaymentConfig = (
  onData: (config: PaymentConfig) => void,
  onError?: (err: Error) => void
): Unsubscribe => {
  const docRef = doc(db, 'config', 'payments');
  return onSnapshot(docRef,
    (snap) => {
      if (snap.exists()) {
        const data = snap.data() as Record<string, unknown>;
        onData({
          dueDay: (data.dueDay as number) || 10,
          defaultAmount: (data.defaultAmount as number) || 15000,
        });
      } else {
        onData({ dueDay: 10, defaultAmount: 15000 });
      }
    },
    (err) => {
      console.error('PaymentConfig subscribe error:', err);
      onError?.(err);
    }
  );
};

export const savePaymentConfig = async (config: PaymentConfig): Promise<void> => {
  await setDoc(doc(db, 'config', 'payments'), {
    ...config,
    lastUpdated: Timestamp.now(),
  }, { merge: true });
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