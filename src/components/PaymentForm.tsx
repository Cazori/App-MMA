import React, { useState, useEffect } from 'react';
import type { Fighter, Payment, PaymentMethod, PaymentEdit } from '../types/mma';
import { DollarSign, X, Loader2 } from 'lucide-react';
import { useToast } from '../contexts/ToastContext';
import { useAuth } from '../contexts/AuthContext';
import { useFocusTrap } from '../hooks/useFocusTrap';
import { getCurrentPeriod, getPeriodRange, formatPeriod } from '../utils/payments';

interface PaymentFormProps {
  fighters: Fighter[];
  existingPayments: Payment[];
  payment?: Payment | null;     // null = create mode, Payment = edit mode
  onSave: (payment: Payment) => void;
  onCancel?: (id: string) => void;
  onClose: () => void;
  defaultPeriod?: string;
  defaultFighterId?: string;
}

export const PaymentForm: React.FC<PaymentFormProps> = ({
  fighters,
  existingPayments,
  payment,
  onSave,
  onCancel,
  onClose,
  defaultPeriod,
  defaultFighterId,
}) => {
  const { toast } = useToast();
  const { user, isEditor } = useAuth();
  const isEditMode = !!payment;
  const isCancelled = payment?.status === 'cancelled';

  // ── Form state ──────────────────────────────────────────────────────
  const [fighterId, setFighterId] = useState('');
  const [period, setPeriod] = useState(defaultPeriod || getCurrentPeriod());
  const [amount, setAmount] = useState(15000);
  const [method, setMethod] = useState<PaymentMethod>('cash');
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);

  // Populate for edit mode
  useEffect(() => {
    if (payment) {
      setFighterId(payment.fighterId);
      setPeriod(payment.period);
      setAmount(payment.amount);
      setMethod(payment.method);
      setNotes(payment.notes || '');
    } else if (defaultFighterId) {
      setFighterId(defaultFighterId);
    } else if (fighters.length > 0) {
      setFighterId(fighters[0].id);
    }
  }, [payment, defaultFighterId, fighters]);

  const periods = getPeriodRange(6, 6);
  const selectedFighter = fighters.find(f => f.id === fighterId);

  // ── Duplicate check ─────────────────────────────────────────────────
  const hasDuplicate = (): boolean => {
    if (isEditMode) return false; // allow editing existing
    return existingPayments.some(
      (p) => p.fighterId === fighterId && p.period === period && p.status !== 'cancelled'
    );
  };

  // ── Submit ───────────────────────────────────────────────────────────
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (saving) return;

    // Validation
    if (!fighterId) {
      toast('error', 'Seleccioná un luchador');
      return;
    }

    if (amount <= 0) {
      toast('error', 'El monto debe ser mayor a cero');
      return;
    }

    if (hasDuplicate()) {
      toast('warning', 'Este luchador ya tiene un pago registrado para este período');
      return;
    }

    setSaving(true);

    try {
      const now = new Date().toISOString();
      const paymentData: Payment = {
        id: payment?.id || `pay-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        fighterId,
        period,
        amount,
        method,
        status: 'paid',
        notes: notes || undefined,
        paidAt: now,
        createdAt: payment?.createdAt || now,
        updatedAt: now,
        history: payment?.history || [],
      };

      if (isEditMode && payment) {
        // Build history entry for edits
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
      onClose();
    } catch (err) {
      console.error('Error al guardar pago:', err);
      toast('error', 'Error al guardar. Intentá de nuevo.');
    }

    setSaving(false);
  };

  // ── Cancel flow ─────────────────────────────────────────────────────
  const handleCancel = async () => {
    if (!payment || !onCancel || isCancelled) return;
    setSaving(true);
    try {
      await onCancel(payment.id);
      toast('success', 'Pago cancelado');
      onClose();
    } catch (err) {
      console.error('Error al cancelar pago:', err);
      toast('error', 'Error al cancelar. Intentá de nuevo.');
    }
    setSaving(false);
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

            {/* Period Selector */}
            <div className="form-group">
              <label className="form-label">Período</label>
              <select
                value={period}
                onChange={(e) => setPeriod(e.target.value)}
                className="form-input"
                disabled={isEditMode}
                required
              >
                {periods.map((p) => (
                  <option key={p} value={p}>{formatPeriod(p)}</option>
                ))}
              </select>
            </div>

            {/* Amount */}
            <div className="form-group">
              <label className="form-label">Monto (COP)</label>
              <input
                type="number"
                value={amount}
                onChange={(e) => setAmount(Math.max(0, Number(e.target.value)))}
                min={1}
                required
                className="form-input"
                placeholder="15000"
              />
            </div>

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

            {/* Duplicate warning */}
            {!isEditMode && hasDuplicate() && (
              <p style={{ color: 'var(--color-warning)', fontSize: '0.85rem', padding: '8px 12px', background: 'rgba(234,179,8,0.1)', borderRadius: '8px' }}>
                ⚠ Este luchador ya tiene un pago registrado para este período.
              </p>
            )}

            {/* Actions */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', borderTop: '1px solid var(--border-color)', paddingTop: '20px', marginTop: '10px' }}>
              <button type="button" onClick={onClose} className="btn btn-secondary">
                Cancelar
              </button>
              <button type="submit" className="btn btn-primary" disabled={saving}>
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
