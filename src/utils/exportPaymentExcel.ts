import ExcelJS from 'exceljs';
import type { Fighter, Payment } from '../types/mma';
import { formatPeriod } from './payments';

const HEADER_COLOR = 'EA580C';
const HEADER_TEXT = 'FFFFFF';
const BORDER_COLOR = '333333';
const ALT_ROW = '1A1A2E';
const BASE_ROW = '16213E';

const border = {
  top: { style: 'thin' as const, color: { argb: BORDER_COLOR } },
  left: { style: 'thin' as const, color: { argb: BORDER_COLOR } },
  bottom: { style: 'thin' as const, color: { argb: BORDER_COLOR } },
  right: { style: 'thin' as const, color: { argb: BORDER_COLOR } },
};

const headerCell = (cell: ExcelJS.Cell, label: string) => {
  cell.value = label;
  cell.font = { bold: true, color: { argb: HEADER_TEXT }, size: 11, name: 'Inter' };
  cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: HEADER_COLOR } };
  cell.alignment = { vertical: 'middle', horizontal: 'center' };
  cell.border = border;
};

const dataCell = (cell: ExcelJS.Cell, value: string | number | null, isAlt: boolean) => {
  cell.value = value ?? '—';
  cell.font = { color: { argb: 'CCCCCC' }, size: 10, name: 'Inter' };
  cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: isAlt ? ALT_ROW : BASE_ROW } };
  cell.alignment = { vertical: 'middle', horizontal: value !== null && !isNaN(Number(value)) ? 'center' : 'left' };
  cell.border = border;
};

const methodLabel: Record<string, string> = {
  cash: 'Efectivo',
  transfer: 'Transferencia',
  nequi: 'Nequi',
  daviplata: 'Daviplata',
};

/**
 * Export payment records for a given period to .xlsx.
 * Uses lazy import pattern — call only when user triggers export.
 */
export const exportPaymentsToExcel = async (
  payments: Payment[],
  fighters: Fighter[],
  period: string
): Promise<void> => {
  if (payments.length === 0) {
    throw new Error('No hay pagos registrados en este período');
  }

  const fighterMap = new Map(fighters.map((f) => [f.id, f]));
  const wb = new ExcelJS.Workbook();
  wb.creator = 'Guerreros MMA App';
  wb.created = new Date();

  const periodLabel = formatPeriod(period);
  const [year, month] = period.split('-');

  // ── Sheet: Pagos ────────────────────────────────────────────────────
  const ws = wb.addWorksheet('Pagos', {
    pageSetup: { orientation: 'landscape', fitToPage: true },
  });

  // Title row
  ws.mergeCells(1, 1, 1, 9);
  const titleCell = ws.getCell('A1');
  titleCell.value = `Pagos — ${periodLabel}`;
  titleCell.font = { bold: true, size: 14, color: { argb: HEADER_TEXT }, name: 'Inter' };
  titleCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: HEADER_COLOR } };
  titleCell.alignment = { vertical: 'middle', horizontal: 'center' };
  titleCell.border = border;

  // Column headers
  const columns = [
    { header: 'Luchador', width: 32 },
    { header: 'Teléfono', width: 18 },
    { header: 'Monto', width: 14 },
    { header: 'Método de Pago', width: 20 },
    { header: 'Estado', width: 14 },
    { header: 'Período', width: 14 },
    { header: 'Fecha de Pago', width: 16 },
    { header: 'Fecha de Cancelación', width: 18 },
    { header: 'Notas', width: 28 },
  ];

  ws.columns = columns.map((c) => ({ width: c.width }));

  columns.forEach((c, i) => {
    headerCell(ws.getCell(2, i + 1), c.header);
  });

  // Data rows — sort by fighter name
  const sortedPayments = [...payments].sort((a, b) => {
    const nameA = fighterMap.get(a.fighterId)?.name || '';
    const nameB = fighterMap.get(b.fighterId)?.name || '';
    return nameA.localeCompare(nameB);
  });

  sortedPayments.forEach((p, idx) => {
    const r = 3 + idx;
    const isAlt = idx % 2 === 0;
    const fighter = fighterMap.get(p.fighterId);

    dataCell(ws.getCell(r, 1), fighter?.name || '—', isAlt);
    dataCell(ws.getCell(r, 2), fighter?.socialMedia?.instagram || '—', isAlt);
    // Amount as number (integer, no decimals)
    const amountCell = ws.getCell(r, 3);
    dataCell(amountCell, p.amount, isAlt);
    amountCell.numFmt = '#,##0';
    dataCell(ws.getCell(r, 4), methodLabel[p.method] || p.method, isAlt);
    dataCell(ws.getCell(r, 5), p.status === 'paid' ? 'Pagado' : 'Cancelado', isAlt);
    dataCell(ws.getCell(r, 6), periodLabel, isAlt);
    // Payment date
    const payDateCell = ws.getCell(r, 7);
    dataCell(payDateCell, p.paidAt.slice(0, 10), isAlt);
    // Cancelled date
    if (p.cancelledAt) {
      const cancelDateCell = ws.getCell(r, 8);
      dataCell(cancelDateCell, p.cancelledAt.slice(0, 10), isAlt);
    } else {
      dataCell(ws.getCell(r, 8), null, isAlt);
    }
    dataCell(ws.getCell(r, 9), p.notes || null, isAlt);
  });

  // Generate and download
  const buffer = await wb.xlsx.writeBuffer();
  const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `pagos_${year}_${month}.xlsx`;
  a.click();
  URL.revokeObjectURL(url);
};
