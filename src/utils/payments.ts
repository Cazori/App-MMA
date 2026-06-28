import type { Fighter, Payment } from '../types/mma';

/**
 * Computes the payment status for a fighter in a given period.
 * Returns 'paid' if a non-cancelled payment exists,
 * 'overdue' if no payment exists and the due date has passed,
 * 'pending' if no payment exists and the due date hasn't passed yet.
 */
export function computePaymentStatus(
  fighter: Fighter,
  payments: Payment[],
  period: string,
  dueDay: number
): 'paid' | 'pending' | 'overdue' | 'cancelled' {
  const fighterPayments = payments.filter(
    (p) => p.fighterId === fighter.id && p.period === period
  );

  if (fighterPayments.length === 0) {
    // No payment recorded — determine overdue vs pending
    const [year, month] = period.split('-').map(Number);
    const dueDate = new Date(year, month - 1, dueDay); // month is 0-indexed
    const today = new Date();
    // Compare dates by stripping time
    const dueTime = new Date(dueDate.getFullYear(), dueDate.getMonth(), dueDate.getDate()).getTime();
    const todayTime = new Date(today.getFullYear(), today.getMonth(), today.getDate()).getTime();

    return dueTime < todayTime ? 'overdue' : 'pending';
  }

  const activePayment = fighterPayments.find((p) => p.status !== 'cancelled');
  if (activePayment) return 'paid';

  // All payments for this fighter+period are cancelled
  const cancelledPayment = fighterPayments.find((p) => p.status === 'cancelled');
  if (cancelledPayment) return 'cancelled';

  return 'pending';
}

/**
 * Generate a WhatsApp reminder message for a fighter.
 */
export function generateReminder(
  fighterName: string,
  amount: number,
  period: string,
  dueDate: string
): string {
  // Format period from "2026-06" to "Junio 2026"
  const [year, month] = period.split('-').map(Number);
  const monthNames = [
    'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
    'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre',
  ];
  const periodLabel = `${monthNames[month - 1]} ${year}`;

  return `Hola ${fighterName}, te recuerdo que el pago de ${periodLabel} por $${amount.toLocaleString('es-CO')} COP vence el ${dueDate}. Por favor ponte al día. ¡Gracias!`;
}

/**
 * Format period string for display.
 * "2026-06" → "Junio 2026"
 */
export function formatPeriod(period: string): string {
  const [year, month] = period.split('-').map(Number);
  const monthNames = [
    'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
    'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre',
  ];
  return `${monthNames[month - 1]} ${year}`;
}

/**
 * Get the current period string in YYYY-MM format.
 */
export function getCurrentPeriod(): string {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  return `${y}-${m}`;
}

/**
 * Generate an array of month periods for selectors.
 * Returns periods from 6 months ago to 6 months ahead.
 */
export function getPeriodRange(monthsBack = 6, monthsAhead = 6): string[] {
  const now = new Date();
  const periods: string[] = [];
  for (let i = -monthsBack; i <= monthsAhead; i++) {
    const d = new Date(now.getFullYear(), now.getMonth() + i, 1);
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    periods.push(`${y}-${m}`);
  }
  return periods;
}

/**
 * Compute payment counts for the dashboard widget.
 */
export function computePaymentCounts(
  fighters: Fighter[],
  payments: Payment[],
  period: string,
  dueDay: number
): { paid: number; pending: number; overdue: number; cancelled: number } {
  let paid = 0;
  let pending = 0;
  let overdue = 0;
  let cancelled = 0;

  for (const fighter of fighters) {
    const status = computePaymentStatus(fighter, payments, period, dueDay);
    if (status === 'paid') paid++;
    else if (status === 'pending') pending++;
    else if (status === 'overdue') overdue++;
    else if (status === 'cancelled') cancelled++;
  }

  return { paid, pending, overdue, cancelled };
}

/**
 * Copy text to clipboard with fallback for insecure contexts.
 */
export async function copyToClipboard(text: string): Promise<boolean> {
  if (navigator.clipboard && navigator.clipboard.writeText) {
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch {
      return fallbackCopy(text);
    }
  }
  return fallbackCopy(text);
}

function fallbackCopy(text: string): boolean {
  try {
    const textarea = document.createElement('textarea');
    textarea.value = text;
    textarea.style.position = 'fixed';
    textarea.style.opacity = '0';
    document.body.appendChild(textarea);
    textarea.select();
    document.execCommand('copy');
    document.body.removeChild(textarea);
    return true;
  } catch {
    return false;
  }
}
