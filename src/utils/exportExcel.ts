import ExcelJS from 'exceljs';
import type { Fighter } from '../types/mma';

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

const labelCell = (cell: ExcelJS.Cell, label: string, isAlt: boolean) => {
  cell.value = label;
  cell.font = { bold: true, color: { argb: 'FFFFFF' }, size: 10, name: 'Inter' };
  cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: isAlt ? ALT_ROW : BASE_ROW } };
  cell.alignment = { vertical: 'middle' };
  cell.border = border;
};

export const exportFighterToExcel = async (fighter: Fighter) => {
  const wb = new ExcelJS.Workbook();
  wb.creator = 'Guerreros MMA App';
  wb.created = new Date();

  // ── Sheet 1: Ficha del peleador ──────────────────────────────────
  const ws1 = wb.addWorksheet('Ficha del Peleador', {
    pageSetup: { orientation: 'portrait', fitToPage: true },
  });

  ws1.columns = [
    { header: 'Campo', key: 'campo', width: 24 },
    { header: 'Valor', key: 'valor', width: 48 },
  ];

  // Title row
  ws1.mergeCells('A1:B1');
  const titleCell = ws1.getCell('A1');
  titleCell.value = fighter.name;
  titleCell.font = { bold: true, size: 16, color: { argb: HEADER_TEXT }, name: 'Inter' };
  titleCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: HEADER_COLOR } };
  titleCell.alignment = { vertical: 'middle', horizontal: 'center' };
  titleCell.border = border;

  // Headers
  headerCell(ws1.getCell('A2'), 'Campo');
  headerCell(ws1.getCell('B2'), 'Valor');

  const fields: [string, string][] = [
    ['Nombre', fighter.name],
    ['Estilo Principal', fighter.primaryStyle],
    ['Rol', fighter.role || '—'],
    ['Rol de Coach', fighter.coachRole ? (fighter.coachRole === 'ninguno' ? '—' : fighter.coachRole) : '—'],
    ['Récord', fighter.record || '—'],
    ['Foto URL', fighter.photoUrl],
    ['Instagram', fighter.socialMedia?.instagram || '—'],
    ['Facebook', fighter.socialMedia?.facebook || '—'],
    ['YouTube', fighter.socialMedia?.youtube || '—'],
    ['Twitter', fighter.socialMedia?.twitter || '—'],
    ['Creado', fighter.createdAt ? new Date(fighter.createdAt).toLocaleDateString('es-AR') : '—'],
    ['Actualizado', fighter.updatedAt ? new Date(fighter.updatedAt).toLocaleDateString('es-AR') : '—'],
  ];

  fields.forEach(([label, value], idx) => {
    const isAlt = idx % 2 === 0;
    labelCell(ws1.getCell(`A${idx + 3}`), label, isAlt);
    dataCell(ws1.getCell(`B${idx + 3}`), value, isAlt);
  });

  // Gap
  const gapRow = fields.length + 4;
  ws1.mergeCells(`A${gapRow}:B${gapRow}`);
  const gapCell = ws1.getCell(`A${gapRow}`);
  gapCell.value = 'Métricas Físicas Actuales';
  gapCell.font = { bold: true, size: 13, color: { argb: HEADER_TEXT }, name: 'Inter' };
  gapCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: HEADER_COLOR } };
  gapCell.alignment = { vertical: 'middle', horizontal: 'center' };
  gapCell.border = border;

  const hr = gapRow + 1;
  headerCell(ws1.getCell(`A${hr}`), 'Métrica');
  headerCell(ws1.getCell(`B${hr}`), 'Valor');

  const metrics: [string, string][] = [
    ['Altura', `${fighter.physicalMetrics.height} cm`],
    ['Peso', `${fighter.physicalMetrics.weight} kg`],
    ['FC Reposo', `${fighter.physicalMetrics.restingHR} BPM`],
  ];
  if (fighter.physicalMetrics.activeHR) metrics.push(['FC Actividad', `${fighter.physicalMetrics.activeHR} BPM`]);
  if (fighter.physicalMetrics.recoveryRate) metrics.push(['Recuperación', `${fighter.physicalMetrics.recoveryRate} BPM`]);

  metrics.forEach(([label, value], idx) => {
    const r = hr + 1 + idx;
    labelCell(ws1.getCell(`A${r}`), label, idx % 2 === 0);
    dataCell(ws1.getCell(`B${r}`), value, idx % 2 === 0);
  });

  // Custom metrics if any
  const custom = (fighter.customMetrics || []).filter(m => m.visible);
  if (custom.length > 0) {
    const cmGap = hr + 1 + metrics.length + 1;
    ws1.mergeCells(`A${cmGap}:B${cmGap}`);
    const cmTitle = ws1.getCell(`A${cmGap}`);
    cmTitle.value = 'Estadísticas Personalizadas';
    cmTitle.font = { bold: true, size: 11, color: { argb: HEADER_TEXT }, name: 'Inter' };
    cmTitle.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'D97706' } };
    cmTitle.alignment = { vertical: 'middle', horizontal: 'center' };
    cmTitle.border = border;

    const cmHr = cmGap + 1;
    headerCell(ws1.getCell(`A${cmHr}`), 'Etiqueta');
    headerCell(ws1.getCell(`B${cmHr}`), 'Valor');

    custom.forEach((m, idx) => {
      const r = cmHr + 1 + idx;
      labelCell(ws1.getCell(`A${r}`), m.label, idx % 2 === 0);
      dataCell(ws1.getCell(`B${r}`), m.value, idx % 2 === 0);
    });
  }

  // ── Sheet 2: Historial de Métricas ──────────────────────────────────
  const ws2 = wb.addWorksheet('Historial de Métricas', {
    pageSetup: { orientation: 'landscape', fitToPage: true },
  });

  const snapshots = (fighter.metricSnapshots || [])
    .filter(s => s.weight !== undefined || s.height !== undefined || s.restingHR !== undefined || s.activeHR !== undefined || s.recoveryRate !== undefined)
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  // Title
  ws2.mergeCells(1, 1, 1, 8);
  const title2 = ws2.getCell('A1');
  title2.value = `${fighter.name} — Historial de Métricas`;
  title2.font = { bold: true, size: 14, color: { argb: HEADER_TEXT }, name: 'Inter' };
  title2.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: HEADER_COLOR } };
  title2.alignment = { vertical: 'middle', horizontal: 'center' };
  title2.border = border;

  ws2.columns = [
    { width: 14 },
    { width: 12 },
    { width: 12 },
    { width: 14 },
    { width: 14 },
    { width: 14 },
    { width: 14 },
    { width: 36 },
  ];

  const headers = ['Fecha', 'Peso (kg)', 'Altura (cm)', 'FC Reposo', 'FC Actividad', 'Recuperación', 'Nota'];
  headers.forEach((h, i) => headerCell(ws2.getCell(2, i + 1), h));

  if (snapshots.length === 0) {
    ws2.mergeCells(3, 1, 3, 8);
    const noData = ws2.getCell('A3');
    noData.value = 'Sin registros de métricas';
    noData.font = { italic: true, color: { argb: '999999' }, size: 10, name: 'Inter' };
    noData.alignment = { horizontal: 'center' };
  } else {
    snapshots.forEach((s, idx) => {
      const r = 3 + idx;
      const isAlt = idx % 2 === 0;
      const dateStr = new Date(s.date + 'T00:00:00').toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit', year: 'numeric' });

      dataCell(ws2.getCell(r, 1), dateStr, isAlt);
      dataCell(ws2.getCell(r, 2), s.weight ?? null, isAlt);
      dataCell(ws2.getCell(r, 3), s.height ?? null, isAlt);
      dataCell(ws2.getCell(r, 4), s.restingHR ?? null, isAlt);
      dataCell(ws2.getCell(r, 5), s.activeHR ?? null, isAlt);
      dataCell(ws2.getCell(r, 6), s.recoveryRate ?? null, isAlt);
      dataCell(ws2.getCell(r, 7), s.note || null, isAlt);
    });
  }

  // Generate and download
  const buffer = await wb.xlsx.writeBuffer();
  const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${fighter.name.replace(/\s+/g, '_')}_datos.xlsx`;
  a.click();
  URL.revokeObjectURL(url);
};

const downloadWorkbook = async (wb: ExcelJS.Workbook, filename: string) => {
  const buffer = await wb.xlsx.writeBuffer();
  const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
};

export const exportAllToExcel = async (fighters: Fighter[]) => {
  const wb = new ExcelJS.Workbook();
  wb.creator = 'Guerreros MMA App';
  wb.created = new Date();

  // ── Sheet 1: Todos los Peleadores ──────────────────────────────────
  const ws1 = wb.addWorksheet('Todos los Peleadores', {
    pageSetup: { orientation: 'landscape', fitToPage: true },
  });

  // Title
  ws1.mergeCells(1, 1, 1, 12);
  const title = ws1.getCell('A1');
  title.value = 'Todos los Peleadores — Guerreros de Dios MMA';
  title.font = { bold: true, size: 14, color: { argb: HEADER_TEXT }, name: 'Inter' };
  title.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: HEADER_COLOR } };
  title.alignment = { vertical: 'middle', horizontal: 'center' };
  title.border = border;

  const allHeaders = ['Nombre', 'Estilo', 'Rol', 'Coach', 'Récord', 'Peso (kg)', 'Altura (cm)', 'FC Reposo', 'FC Actividad', 'Recuperación', 'Instagram', 'Facebook', 'Creado'];
  ws1.columns = allHeaders.map(h => ({ header: h, width: 18 }));

  allHeaders.forEach((h, i) => headerCell(ws1.getCell(2, i + 1), h));

  fighters.sort((a, b) => a.name.localeCompare(b.name)).forEach((f, idx) => {
    const r = 3 + idx;
    const isAlt = idx % 2 === 0;
    dataCell(ws1.getCell(r, 1), f.name, isAlt);
    dataCell(ws1.getCell(r, 2), f.primaryStyle, isAlt);
    dataCell(ws1.getCell(r, 3), f.role || '—', isAlt);
    dataCell(ws1.getCell(r, 4), f.coachRole && f.coachRole !== 'ninguno' ? f.coachRole : '—', isAlt);
    dataCell(ws1.getCell(r, 5), f.record || '—', isAlt);
    dataCell(ws1.getCell(r, 6), f.physicalMetrics.weight, isAlt);
    dataCell(ws1.getCell(r, 7), f.physicalMetrics.height, isAlt);
    dataCell(ws1.getCell(r, 8), f.physicalMetrics.restingHR, isAlt);
    dataCell(ws1.getCell(r, 9), f.physicalMetrics.activeHR ?? null, isAlt);
    dataCell(ws1.getCell(r, 10), f.physicalMetrics.recoveryRate ?? null, isAlt);
    dataCell(ws1.getCell(r, 11), f.socialMedia?.instagram || '—', isAlt);
    dataCell(ws1.getCell(r, 12), f.socialMedia?.facebook || '—', isAlt);
    dataCell(ws1.getCell(r, 13), f.createdAt ? new Date(f.createdAt).toLocaleDateString('es-AR') : '—', isAlt);
  });

  // ── Sheet 2: Historial General ──────────────────────────────────
  const ws2 = wb.addWorksheet('Historial General', {
    pageSetup: { orientation: 'landscape', fitToPage: true },
  });

  ws2.mergeCells(1, 1, 1, 9);
  const title2 = ws2.getCell('A1');
  title2.value = 'Historial General de Métricas';
  title2.font = { bold: true, size: 14, color: { argb: HEADER_TEXT }, name: 'Inter' };
  title2.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: HEADER_COLOR } };
  title2.alignment = { vertical: 'middle', horizontal: 'center' };
  title2.border = border;

  const snapHeaders = ['Peleador', 'Fecha', 'Peso (kg)', 'Altura (cm)', 'FC Reposo', 'FC Actividad', 'Recuperación', 'Nota'];
  ws2.columns = snapHeaders.map(h => ({ header: h, width: snapHeaders.indexOf(h) === 0 ? 28 : 14 }));

  snapHeaders.forEach((h, i) => headerCell(ws2.getCell(2, i + 1), h));

  const allSnapshots = fighters.flatMap(f =>
    (f.metricSnapshots || [])
      .filter(s => s.weight !== undefined || s.height !== undefined || s.restingHR !== undefined || s.activeHR !== undefined || s.recoveryRate !== undefined)
      .map(s => ({ name: f.name, ...s }))
  ).sort((a, b) => a.date.localeCompare(b.date));

  if (allSnapshots.length === 0) {
    ws2.mergeCells(3, 1, 3, 9);
    const noData = ws2.getCell('A3');
    noData.value = 'Sin registros de métricas';
    noData.font = { italic: true, color: { argb: '999999' }, size: 10, name: 'Inter' };
    noData.alignment = { horizontal: 'center' };
  } else {
    allSnapshots.forEach((s, idx) => {
      const r = 3 + idx;
      const isAlt = idx % 2 === 0;
      const dateStr = new Date(s.date + 'T00:00:00').toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit', year: 'numeric' });
      dataCell(ws2.getCell(r, 1), s.name, isAlt);
      dataCell(ws2.getCell(r, 2), dateStr, isAlt);
      dataCell(ws2.getCell(r, 3), s.weight ?? null, isAlt);
      dataCell(ws2.getCell(r, 4), s.height ?? null, isAlt);
      dataCell(ws2.getCell(r, 5), s.restingHR ?? null, isAlt);
      dataCell(ws2.getCell(r, 6), s.activeHR ?? null, isAlt);
      dataCell(ws2.getCell(r, 7), s.recoveryRate ?? null, isAlt);
      dataCell(ws2.getCell(r, 8), s.note || null, isAlt);
    });
  }

  await downloadWorkbook(wb, 'todos_los_peleadores_datos.xlsx');
};
