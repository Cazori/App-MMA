import type { Payment, ProgramConfig } from '../types/mma';

// ─── Date Helpers ──────────────────────────────────────────────────────

/**
 * Add N months to a date, handling year boundaries and leap year edge cases.
 * If the resulting day exceeds the month's max days, it clamps to the last day.
 * e.g. Jan 31 + 1 month → Feb 28 (or 29 in leap year)
 */
export function addMonths(date: Date, n: number): Date {
  const result = new Date(date);
  const totalMonths = result.getFullYear() * 12 + result.getMonth() + n;
  const targetYear = Math.floor(totalMonths / 12);
  const targetMonth = totalMonths % 12;
  // Compute max day from TARGET month, then clamp before setting
  const maxDay = new Date(targetYear, targetMonth + 1, 0).getDate();
  const clampedDay = Math.min(result.getDate(), maxDay);
  result.setFullYear(targetYear, targetMonth, clampedDay);
  return result;
}

// ─── Program Auto-Detection ───────────────────────────────────────────

export interface ProgramResult {
  programId: 'daily' | 'three-day';
  monthsPaid: number;
}

/**
 * Given an amount and program list, detect which program(s) it matches.
 * Returns the selected program + monthsPaid, or null if no exact match.
 * Multiple matches → pick the highest monthly price (daily > three-day).
 */
export function computeProgram(
  amount: number,
  programs: ProgramConfig[]
): ProgramResult | null {
  if (amount <= 0 || programs.length === 0) return null;

  const candidates: ProgramResult[] = [];

  for (const prog of programs) {
    if (amount % prog.monthlyPrice === 0) {
      candidates.push({
        programId: prog.id,
        monthsPaid: amount / prog.monthlyPrice,
      });
    }
  }

  if (candidates.length === 0) return null;

  // Multiple matches → pick highest monthly price
  if (candidates.length > 1) {
    const prices = new Map(programs.map(p => [p.id, p.monthlyPrice]));
    candidates.sort((a, b) => (prices.get(b.programId) ?? 0) - (prices.get(a.programId) ?? 0));
  }

  return candidates[0];
}

// ─── Coverage Computation ─────────────────────────────────────────────

export interface CoverageResult {
  coverageStart: string;  // ISO date
  coverageEnd: string;    // ISO date
}

/**
 * Compute coverage dates for a new payment given existing ones.
 *
 * Stacking: if paidAt < max existing coverageEnd → start at maxEnd
 * Gap: if paidAt >= max existing coverageEnd (or no existing) → start at paidAt
 *
 * Only non-cancelled payments with coverageEnd are considered.
 */
export function computeCoverage(
  existingPayments: Payment[],
  _programId: 'daily' | 'three-day',
  monthsPaid: number,
  paidAt: string,
  _programs: ProgramConfig[]
): CoverageResult {
  // Filter to valid coverage payments (non-cancelled, has coverageEnd)
  const validExisting = existingPayments.filter(
    p => p.status !== 'cancelled' && p.coverageEnd != null
  );

  const paidDate = new Date(paidAt);

  if (validExisting.length > 0) {
    // Find max coverageEnd
    let maxEnd = new Date(0);
    for (const p of validExisting) {
      const end = new Date(p.coverageEnd!);
      if (end > maxEnd) maxEnd = end;
    }

    if (paidDate < maxEnd) {
      // Stacking: start at maxEnd
      const coverageStart = maxEnd;
      const coverageEnd = addMonths(coverageStart, monthsPaid);
      return {
        coverageStart: coverageStart.toISOString(),
        coverageEnd: coverageEnd.toISOString(),
      };
    }
  }

  // Gap or first payment: start at paidAt
  const coverageStart = paidDate;
  const coverageEnd = addMonths(coverageStart, monthsPaid);
  return {
    coverageStart: coverageStart.toISOString(),
    coverageEnd: coverageEnd.toISOString(),
  };
}

// ─── Membership Status ────────────────────────────────────────────────

export type MembershipStatus = 'active' | 'expired' | 'pending';

/**
 * Determine a fighter's membership status as of a reference date.
 *
 * active  → at least one non-cancelled payment with coverageEnd >= referenceDate
 * expired → all payments have coverageEnd < referenceDate, but at least one payment exists
 * pending → no payments with coverage fields
 */
export function computeMembershipStatus(
  fighterPayments: Payment[],
  referenceDate?: string
): MembershipStatus {
  const ref = referenceDate ? new Date(referenceDate) : new Date();

  // Only consider non-cancelled payments with coverage fields
  const withCoverage = fighterPayments.filter(
    p => p.status !== 'cancelled' && p.coverageEnd != null
  );

  if (withCoverage.length === 0) return 'pending';

  const hasActive = withCoverage.some(p => new Date(p.coverageEnd!) >= ref);
  return hasActive ? 'active' : 'expired';
}

// ─── Legacy Helpers (kept for backward compat) ────────────────────────

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
 * Generate a WhatsApp reminder message referencing coverage expiry.
 */
export function generateReminder(
  fighterName: string,
  amount: number,
  programName: string,
  coverageEnd?: string
): string {
  let msg = `Hola ${fighterName}, `;
  if (coverageEnd) {
    const endDate = new Date(coverageEnd).toLocaleDateString('es-AR');
    msg += `su membresía venció el ${endDate}. `;
  } else {
    msg += `tiene un pago pendiente. `;
  }
  msg += `El valor es $${amount.toLocaleString('es-CO')} COP`;
  if (programName) msg += ` (${programName})`;
  msg += `. ¡Póngase al día!`;
  return msg;
}

// ─── Clipboard ────────────────────────────────────────────────────────

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
