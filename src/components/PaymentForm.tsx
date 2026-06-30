import React, { useState, useEffect, useMemo } from 'react';
import type { Fighter, Payment, PaymentMethod, PaymentEdit, ProgramConfig } from '../types/mma';
import { DollarSign, X, Loader2 } from 'lucide-react';
import { useToast } from '../contexts/ToastContext';
import { useAuth } from '../contexts/AuthContext';
import { useFocusTrap } from '../hooks/useFocusTrap';
import { computeProgram, computeCoverage } from '../utils/payments';

interface PaymentFormProps {
  fighters: Fighter[];
  existingPayments: Payment[];
  programs: ProgramConfig[];       // NEW: program config
  payment?: Payment | null;        // null = create mode, Payment = edit mode
  onSave: (payment: Payment) => void;
  onCancel?: (id: string) => void;
  onClose: () => void;
  defaultFighterId?: string;
  // REMOVED: defaultPeriod
}

export const PaymentForm: React.FC<PaymentFormProps> = ({
  fighters,
  existingPayments,
  programs,
  payment,
  onSave,
  onCancel,
  onClose,
  defaultFighterId,
}) => {
  const { toast } = useToast();
  const { user } = useAuth();
  const isEditMode = !!payment;
  const isCancelled = payment?.status === 'cancelled';

  // ── Form state ──────────────────────────────────────────────────────
  const [fighterId, setFighterId] = useState('');
  const [paidAt, setPaidAt] = useState(() => new Date().toISOString().slice(0, 10));
  const [amount, setAmount] = useState<number>(0);
  const [manualProgramId, setManualProgramId] = useState<'daily' | 'three-day' | null>(null);
  const [method, setMethod] = useState<PaymentMethod>('cash');
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);

  // Populate for edit mode
  useEffect(() => {
    if (payment) {
      setFighterId(payment.fighterId);
      setPaidAt(payment.paidAt.slice(0, 10));
      setAmount(payment.amount);
      setMethod(payment.method);
      setNotes(payment.notes || '');
    } else if (defaultFighterId) {
      setFighterId(defaultFighterId);
    } else if (fighters.length > 0) {
      setFighterId(fighters[0].id);
    }
  }, [payment, defaultFighterId, fighters]);

  // ── Program auto-detection ──────────────────────────────────────────
  const programResult = useMemo(() => {
    if (isEditMode || amount <= 0) return null;
    return computeProgram(amount, programs);
  }, [amount, programs, isEditMode]);

  const detectedProgramId = programResult?.programId ?? null;
  const detectedMonthsPaid = programResult?.monthsPaid ?? 0;
  const needsManualPicker = !isEditMode && amount > 0 && programResult === null;
  const effectiveProgramId = isEditMode ? (payment?.programId ?? null) : (manualProgramId || detectedProgramId);
  const effectiveMonthsPaid = isEditMode ? (payment?.monthsPaid ?? 1) : (manualProgramId && programResult === null
    ? Math.floor(amount / (programs.find(p => p.id === manualProgramId)?.monthlyPrice ?? 160000))
    : detectedMonthsPaid);

  // ── Coverage preview ────────────────────────────────────────────────
  const coveragePreview = useMemo(() => {
    if (isEditMode || !effectiveProgramId || amount <= 0) return null;
    const fighterPayments = existingPayments.filter(p => p.fighterId === fighterId);
    return computeCoverage(fighterPayments, effectiveProgramId, effectiveMonthsPaid, new Date(paidAt).toISOString(), programs);
  }, [isEditMode, effectiveProgramId, amount, paidAt, fighterId, existingPayments, effectiveMonthsPaid, programs]);

  // ── Submit ───────────────────────────────────────────────────────────
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (saving) return;

    if (!fighterId) {
      toast('error', 'Seleccioná un luchador');
      return;
    }

    if (amount <= 0) {
      toast('error', 'El monto debe ser mayor a cero');
      return;
    }

    if (!effectiveProgramId) {
      toast('error', 'Seleccioná un programa');
      return;
    }

    setSaving(true);

    try {
      const now = new Date().toISOString();
      const paidAtISO = new Date(paidAt).toISOString();

      // Compute coverage for the payment
      const fighterPayments = existingPayments.filter(p => p.fighterId === fighterId);
      const coverage = isEditMode
        ? { coverageStart: payment!.coverageStart!, coverageEnd: payment!.coverageEnd! }
        : computeCoverage(fighterPayments, effectiveProgramId, effectiveMonthsPaid, paidAtISO, programs);

      const paymentData: Payment = {
        id: payment?.id || `pay-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        fighterId,
        period: coverage.coverageStart.slice(0, 7), // derived from coverageStart
        amount,
        method,
        status: 'paid',
        notes: notes || undefined,
        paidAt: paidAtISO,
        coverageStart: coverage.coverageStart,
        coverageEnd: coverage.coverageEnd,
        programId: effectiveProgramId,
        monthsPaid: effectiveMonthsPaid,
        createdAt: payment?.createdAt || now,
        updatedAt: now,
        history: payment?.history || [],
      };

      if (isEditMode && payment) {
        const edits: PaymentEdit[] = [];
        if (payment.amount !== amount) {
          edits.push({ field: 'amount', from: payment.amount, to: amount, at: now, by: user?.email || 'unknown' });
        }
        if (payment.method !== method) {
          edits.push({ field: 'method', from: payment.method, to: method, at: now, by: user?.email || 'unknown' });
        }
        if ((payment.notes || '') !== (notes || '')) {
          edits.push({ field: 'notes', from: payment.notes || '', to: notes || '', at: now, by: user?.email || 'unknown' });
        }
        if (edits.length > 0) {
          paymentData.history = [...(payment.history || []), ...edits].slice(-20);
        }
      }

      await onSave(paymentData);
      toast('success', isEditMode ? 'Pago actualizado' : 'Pago registrado');
      setSaving(false);
      onClose();
    } catch (err) {
      console.error('Error al guardar pago:', err);
      toast('error', 'Error al guardar. Intentá de nuevo.');
      setSaving(false);
    }
  };

  // ── Cancel flow ─────────────────────────────────────────────────────
  const handleCancel = async () => {
    if (!payment || !onCancel || isCancelled) return;
    setSaving(true);
    try {
      await onCancel(payment.id);
      toast('success', 'Pago cancelado');
      setSaving(false);
      onClose();
    } catch (err) {
      console.error('Error al cancelar pago:', err);
      toast('error', 'Error al cancelar. Intentá de nuevo.');
      setSaving(false);
    }
  };

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.85)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 100,
      padding: '20px',
      backdropFilter: 'blur(5px)',
    }}>
      <div
        ref={useFocusTrap(true)}
        className="glass-panel"
        style={{
          width: '100%',
          maxWidth: '520px',
          maxHeight: '90dvh',
          borderRadius: '24px',
          overflowY: 'auto',
          display: 'flex',
          flexDirection: 'column',
          position: 'relative',
        }}
      >
        {/* Header */}
        <div style={{
          padding: '20px 24px',
          borderBottom: '1px solid var(--border-color)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          position: 'sticky',
          top: 0,
          background: 'var(--bg-secondary)',
          zIndex: 10,
        }}>
          <h2 style={{ fontSize: '1.2rem', color: '#fff', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <DollarSign size={20} style={{ color: 'var(--accent-orange)' }} />
            <span>{isEditMode ? 'Editar Pago' : 'Registrar Pago'}</span>
          </h2>
          <button
            onClick={onClose}
            aria-label="Cerrar"
            style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', display: 'flex', alignItems: 'center' }}
          >
            <X size={24} />
          </button>
        </div>

        {isCancelled ? (
          <div style={{ padding: '32px', textAlign: 'center' }}>
            <p style={{ color: 'var(--text-muted)', fontSize: '1rem' }}>
              Este pago ya está cancelado y no puede ser editado.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '18px' }}>
            {/* Fighter Selector */}
            <div className="form-group">
              <label className="form-label">Luchador</label>
              <select
                value={fighterId}
                onChange={(e) => setFighterId(e.target.value)}
                className="form-input"
                disabled={isEditMode}
                required
              >
                <option value="">Seleccioná un luchador...</option>
                {fighters.map((f) => (
                  <option key={f.id} value={f.id}>
                    {f.name}
                  </option>
                ))}
              </select>
            </div>

            {/* PaidAt Date Picker (replaces period selector) */}
            <div className="form-group">
              <label className="form-label">Fecha de pago (pagó el)</label>
              <input
                type="date"
                value={paidAt}
                onChange={(e) => setPaidAt(e.target.value)}
                className="form-input"
                required
                disabled={isEditMode}
              />
            </div>

            {/* Amount */}
            <div className="form-group">
              <label className="form-label">Monto (COP)</label>
              <input
                type="number"
                value={amount}
                onChange={(e) => {
                  setAmount(Math.max(0, Number(e.target.value)));
                  setManualProgramId(null); // reset manual picker on amount change
                }}
                min={1}
                required
                className="form-input"
                placeholder="Ej: 160000"
                disabled={isEditMode}
              />
            </div>

            {/* Program Preview (auto-detected) */}
            {!isEditMode && programResult && (
              <div style={{
                padding: '12px',
                borderRadius: '10px',
                background: 'rgba(16,185,129,0.1)',
                border: '1px solid rgba(16,185,129,0.2)',
              }}>
                <p style={{ fontSize: '0.85rem', color: 'var(--color-success)', fontWeight: 700 }}>
                  Programa detectado: {programs.find(p => p.id === programResult.programId)?.name} ({programResult.monthsPaid} {programResult.monthsPaid === 1 ? 'mes' : 'meses'})
                </p>
              </div>
            )}

            {/* Manual Program Picker (when amount doesn't match any program) */}
            {needsManualPicker && (
              <div style={{
                padding: '12px',
                borderRadius: '10px',
                background: 'rgba(234,179,8,0.1)',
                border: '1px solid rgba(234,179,8,0.2)',
              }}>
                <p style={{ fontSize: '0.8rem', color: 'var(--color-warning)', marginBottom: '8px' }}>
                  El monto no coincide exactamente con ningún programa. Seleccioná uno manualmente:
                </p>
                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                  {programs.every(prog => Math.floor(amount / prog.monthlyPrice) === 0) ? (
                    <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', width: '100%' }}>
                      El monto mínimo es ${Math.min(...programs.map(p => p.monthlyPrice)).toLocaleString('es-CO')} COP
                    </p>
                  ) : programs.map(prog => {
                    const months = Math.floor(amount / prog.monthlyPrice);
                    const remainder = amount - (months * prog.monthlyPrice);
                    if (months === 0) return null;
                    return (
                      <button
                        key={prog.id}
                        type="button"
                        onClick={() => setManualProgramId(prog.id)}
                        style={{
                          padding: '8px 14px',
                          borderRadius: '10px',
                          border: `2px solid ${manualProgramId === prog.id ? 'var(--accent-orange)' : 'var(--border-color)'}`,
                          background: manualProgramId === prog.id ? 'rgba(244,63,94,0.15)' : 'transparent',
                          color: manualProgramId === prog.id ? '#fff' : 'var(--text-secondary)',
                          cursor: 'pointer',
                          fontSize: '0.8rem',
                          fontWeight: 600,
                          textAlign: 'left',
                        }}
                      >
                        <div>{prog.name}</div>
                        <div style={{ fontSize: '0.7rem', fontWeight: 400, color: 'var(--text-muted)' }}>
                          {months} {months === 1 ? 'mes' : 'meses'} (${(months * prog.monthlyPrice).toLocaleString('es-CO')})
                          {remainder > 0 && `, $${remainder.toLocaleString('es-CO')} excedente`}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Coverage Preview */}
            {!isEditMode && coveragePreview && (
              <div style={{
                padding: '12px',
                borderRadius: '10px',
                background: 'rgba(59,130,246,0.1)',
                border: '1px solid rgba(59,130,246,0.2)',
              }}>
                <p style={{ fontSize: '0.85rem', color: '#60a5fa', fontWeight: 700 }}>
                  Cobertura:
                </p>
                <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '2px' }}>
                  {new Date(coveragePreview.coverageStart).toLocaleDateString('es-AR')} → {new Date(coveragePreview.coverageEnd).toLocaleDateString('es-AR')}
                  {' '}({effectiveMonthsPaid} {effectiveMonthsPaid === 1 ? 'mes' : 'meses'})
                </p>
              </div>
            )}

            {/* Payment Method */}
            <div className="form-group">
              <label className="form-label">Método de pago</label>
              <select
                value={method}
                onChange={(e) => setMethod(e.target.value as PaymentMethod)}
                className="form-input"
                required
              >
                <option value="cash">Efectivo</option>
                <option value="transfer">Transferencia bancaria</option>
                <option value="nequi">Nequi</option>
                <option value="daviplata">Daviplata</option>
              </select>
            </div>

            {/* Notes */}
            <div className="form-group">
              <label className="form-label">Notas (opcional)</label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="form-input"
                rows={2}
                placeholder="Ej: Pagó con billetes de 50k"
                style={{ resize: 'vertical' }}
              />
            </div>

            {/* Actions */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', borderTop: '1px solid var(--border-color)', paddingTop: '20px', marginTop: '10px' }}>
              <button type="button" onClick={onClose} className="btn btn-secondary">
                Cancelar
              </button>
              <button type="submit" className="btn btn-primary" disabled={saving || (!isEditMode && needsManualPicker && !manualProgramId)}>
                {saving ? <><Loader2 size={16} className="animate-spin" /> Guardando...</> : (isEditMode ? 'Guardar Cambios' : 'Registrar Pago')}
              </button>
            </div>
          </form>
        )}

        {/* Cancel button for existing non-cancelled payments */}
        {isEditMode && !isCancelled && onCancel && (
          <div style={{ padding: '0 24px 20px', borderTop: '1px solid var(--border-color)', paddingTop: '16px', marginTop: '0' }}>
            <button
              type="button"
              onClick={handleCancel}
              className="btn btn-danger"
              style={{ width: '100%', padding: '12px' }}
              disabled={saving}
            >
              Cancelar Pago
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
