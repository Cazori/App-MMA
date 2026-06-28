import React, { useState, useEffect, useMemo } from 'react';
import type { Fighter, Payment, FollowUp } from '../types/mma';
import {
  subscribePaymentsByPeriod,
  savePayment,
  cancelPayment as cancelPaymentInStore,
  saveFollowUp,
} from '../services/storage';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import { useConfirm } from '../contexts/ConfirmContext';
import { PaymentForm } from './PaymentForm';
import {
  DollarSign, Download, Search, Phone, MessageCircle,
  CheckCircle, XCircle, Clock, AlertTriangle, Copy, Check,
} from 'lucide-react';
import {
  getCurrentPeriod,
  formatPeriod,
  getPeriodRange,
  computePaymentStatus,
  computePaymentCounts,
  generateReminder,
  copyToClipboard,
} from '../utils/payments';

interface PaymentPanelProps {
  fighters: Fighter[];
}

type TabView = 'all' | 'overdue';
type FollowUpFilter = 'all' | 'pending-contact' | 'contacted';

export const PaymentPanel: React.FC<PaymentPanelProps> = ({ fighters }) => {
  const { toast } = useToast();
  const { confirm } = useConfirm();
  const { user, isEditor } = useAuth();

  // ── State ───────────────────────────────────────────────────────────
  const [period, setPeriod] = useState(getCurrentPeriod());
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [tabView, setTabView] = useState<TabView>('all');
  const [followUpFilter, setFollowUpFilter] = useState<FollowUpFilter>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Form state
  const [showForm, setShowForm] = useState(false);
  const [editingPayment, setEditingPayment] = useState<Payment | null>(null);
  const [defaultFighterId, setDefaultFighterId] = useState<string | undefined>(undefined);

  // Reminder state
  const [selectedForReminder, setSelectedForReminder] = useState<Set<string>>(new Set());
  const [showReminders, setShowReminders] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // ── Subscribe to payments ───────────────────────────────────────────
  useEffect(() => {
    setLoading(true);
    const unsub = subscribePaymentsByPeriod(period, (list) => {
      setPayments(list);
      setLoading(false);
    });
    return unsub;
  }, [period]);

  // ── Derived data ────────────────────────────────────────────────────
  const dueDay = 10; // from config, hardcoded for MVP
  const periods = getPeriodRange(6, 6);
  const counts = useMemo(
    () => computePaymentCounts(fighters, payments, period, dueDay),
    [fighters, payments, period, dueDay]
  );

  // Map fighterId → payment for quick lookup
  const paymentMap = useMemo(() => {
    const map = new Map<string, Payment>();
    for (const p of payments) {
      if (p.status !== 'cancelled') map.set(p.fighterId, p);
    }
    return map;
  }, [payments]);

  // Build fighter status list
  const fighterStatuses = useMemo(() => {
    return fighters.map((f) => ({
      fighter: f,
      payment: paymentMap.get(f.id),
      status: computePaymentStatus(f, payments, period, dueDay),
    }));
  }, [fighters, paymentMap, payments, period, dueDay]);

  // Overdue fighters
  const overdueFighters = useMemo(
    () => fighterStatuses.filter((fs) => fs.status === 'overdue'),
    [fighterStatuses]
  );

  // Filtered view
  const filteredStatuses = useMemo(() => {
    let list = fighterStatuses;

    // Tab filter
    if (tabView === 'overdue') {
      list = list.filter((fs) => fs.status === 'overdue');
    }

    // Search
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter((fs) => fs.fighter.name.toLowerCase().includes(q));
    }

    return list;
  }, [fighterStatuses, tabView, followUpFilter, searchQuery]);

  // Sort overdue fighters by enrollment (oldest first)
  const sortedOverdue = useMemo(() => {
    return [...overdueFighters].sort((a, b) => {
      const aDate = a.fighter.createdAt || '';
      const bDate = b.fighter.createdAt || '';
      return aDate.localeCompare(bDate);
    });
  }, [overdueFighters]);

  // ── Handlers ────────────────────────────────────────────────────────
  const handleSave = async (payment: Payment) => {
    await savePayment(payment);
  };

  const handleCancel = async (id: string) => {
    const ok = await confirm({
      message: '¿Seguro que querés cancelar este pago? Esta acción no se puede deshacer.',
      danger: true,
      confirmLabel: 'Cancelar Pago',
    });
    if (!ok) return;
    await cancelPaymentInStore(id, user?.email || 'unknown');
  };

  const handleEdit = (payment: Payment) => {
    setEditingPayment(payment);
    setShowForm(true);
  };

  const handleAddPayment = (fighterId?: string) => {
    setDefaultFighterId(fighterId);
    setEditingPayment(null);
    setShowForm(true);
  };

  const handleFormClose = () => {
    setShowForm(false);
    setEditingPayment(null);
    setDefaultFighterId(undefined);
  };

  // ── Follow-up ───────────────────────────────────────────────────────
  const toggleFollowUp = async (fighterId: string, currentStatus?: string) => {
    const payment = payments.find((p) => p.fighterId === fighterId);
    if (!payment) return;

    const newStatus = currentStatus === 'contacted' ? 'pending-contact' : 'contacted';
    const now = new Date().toISOString();
    const followUp: FollowUp = {
      id: `fu-${payment.id}-${Date.now()}`,
      status: newStatus,
      contactedAt: newStatus === 'contacted' ? now : undefined,
      updatedAt: now,
    };

    // Open prompt for note if contacting
    if (newStatus === 'contacted') {
      const note = prompt('Agregá una nota de seguimiento (opcional):') || undefined;
      followUp.note = note;
    }

    await saveFollowUp(payment.id, followUp);
  };

  // ── Reminders ───────────────────────────────────────────────────────
  const toggleReminderSelection = (fighterId: string) => {
    setSelectedForReminder((prev) => {
      const next = new Set(prev);
      if (next.has(fighterId)) {
        next.delete(fighterId);
      } else {
        next.add(fighterId);
      }
      return next;
    });
  };

  const handleCopyReminder = async (text: string, id: string) => {
    const success = await copyToClipboard(text);
    if (success) {
      setCopiedId(id);
      toast('success', 'Mensaje copiado al portapapeles');
      setTimeout(() => setCopiedId(null), 2000);
    } else {
      // Fallback: select text and prompt
      toast('warning', 'Presioná Ctrl+C para copiar el mensaje');
    }
  };

  // ── Export ──────────────────────────────────────────────────────────
  const handleExport = async () => {
    if (payments.length === 0) {
      toast('warning', 'No hay pagos registrados en este período');
      return;
    }
    try {
      const { exportPaymentsToExcel } = await import('../utils/exportPaymentExcel');
      await exportPaymentsToExcel(payments, fighters, period);
      toast('success', 'Exportación completada');
    } catch (err) {
      console.error('Export error:', err);
      toast('error', 'Error al exportar. Intentá de nuevo.');
    }
  };

  // ── Helper: status color ────────────────────────────────────────────
  const statusColor = (status: string) => {
    switch (status) {
      case 'paid': return 'var(--color-success)';
      case 'pending': return 'var(--color-warning)';
      case 'overdue': return 'var(--color-danger)';
      case 'cancelled': return 'var(--text-muted)';
      default: return 'var(--text-secondary)';
    }
  };

  const statusLabel = (status: string) => {
    switch (status) {
      case 'paid': return 'Pagado';
      case 'pending': return 'Pendiente';
      case 'overdue': return 'Vencido';
      case 'cancelled': return 'Cancelado';
      default: return status;
    }
  };

  const methodLabel: Record<string, string> = {
    cash: 'Efectivo',
    transfer: 'Transferencia',
    nequi: 'Nequi',
    daviplata: 'Daviplata',
  };

  // ── Render ──────────────────────────────────────────────────────────
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h1 style={{ fontSize: '1.8rem', color: '#fff', fontWeight: 800, letterSpacing: '-0.02em', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <DollarSign size={24} style={{ color: 'var(--accent-orange)' }} />
            Pagos
          </h1>
          <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', marginTop: '4px' }}>
            Gestioná los pagos de membresía
          </p>
        </div>

        <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
          <select
            value={period}
            onChange={(e) => setPeriod(e.target.value)}
            className="form-input"
            style={{ width: '160px', fontSize: '0.85rem' }}
          >
            {periods.map((p) => (
              <option key={p} value={p}>{formatPeriod(p)}</option>
            ))}
          </select>

          {isEditor && (
            <>
              <button onClick={() => handleAddPayment()} className="btn btn-primary" style={{ fontSize: '0.85rem' }}>
                <DollarSign size={16} /> Registrar Pago
              </button>
              <button onClick={handleExport} className="btn btn-secondary" style={{ fontSize: '0.85rem' }}>
                <Download size={16} /> Exportar
              </button>
            </>
          )}
        </div>
      </div>

      {/* Count Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '12px' }}>
        {[
          { label: 'Pagados', value: counts.paid, color: 'var(--color-success)', bg: 'rgba(16,185,129,0.1)' },
          { label: 'Pendientes', value: counts.pending, color: 'var(--color-warning)', bg: 'rgba(234,179,8,0.1)' },
          { label: 'Vencidos', value: counts.overdue, color: 'var(--color-danger)', bg: 'rgba(239,68,68,0.1)' },
          { label: 'Cancelados', value: counts.cancelled, color: 'var(--text-muted)', bg: 'rgba(255,255,255,0.03)' },
        ].map((c) => (
          <div key={c.label} className="glass-panel" style={{ padding: '16px', borderRadius: '16px', textAlign: 'center' }}>
            <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', textTransform: 'uppercase', fontWeight: 700, letterSpacing: '0.03em' }}>{c.label}</p>
            <p style={{ fontSize: '2rem', fontWeight: 800, color: c.color, marginTop: '4px' }}>{c.value}</p>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '8px', borderBottom: '1px solid var(--border-color)', paddingBottom: '8px' }}>
        <button
          onClick={() => setTabView('all')}
          className={`btn ${tabView === 'all' ? 'btn-primary' : 'btn-secondary'}`}
          style={{ fontSize: '0.85rem', padding: '8px 16px' }}
        >
          Todos los luchadores
        </button>
        <button
          onClick={() => setTabView('overdue')}
          className={`btn ${tabView === 'overdue' ? 'btn-primary' : 'btn-secondary'}`}
          style={{ fontSize: '0.85rem', padding: '8px 16px' }}
        >
          Vencidos {overdueFighters.length > 0 && `(${overdueFighters.length})`}
        </button>
      </div>

      {/* Search */}
      <div className="form-group" style={{ maxWidth: '320px' }}>
        <div style={{ position: 'relative' }}>
          <Search size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Buscar luchador..."
            className="form-input"
            style={{ paddingLeft: '36px', fontSize: '0.85rem' }}
          />
        </div>
      </div>

      {/* Overdue Filters */}
      {tabView === 'overdue' && (
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          {(['all', 'pending-contact', 'contacted'] as FollowUpFilter[]).map((f) => (
            <button
              key={f}
              onClick={() => setFollowUpFilter(f)}
              className={`btn ${followUpFilter === f ? 'btn-primary' : 'btn-secondary'}`}
              style={{ fontSize: '0.78rem', padding: '6px 12px' }}
            >
              {f === 'all' ? 'Todos' : f === 'pending-contact' ? 'Sin contactar' : 'Contactados'}
            </button>
          ))}

          {tabView === 'overdue' && sortedOverdue.length > 0 && (
            <button
              onClick={() => setShowReminders(!showReminders)}
              className="btn btn-secondary"
              style={{ fontSize: '0.78rem', padding: '6px 12px', marginLeft: 'auto' }}
            >
              <MessageCircle size={14} />
              {showReminders ? 'Ocultar recordatorios' : 'Recordatorios'}
            </button>
          )}
        </div>
      )}

      {/* Bulk Reminder Sheet */}
      {showReminders && tabView === 'overdue' && sortedOverdue.length > 0 && (
        <div className="glass-panel" style={{ padding: '20px', borderRadius: '16px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
            <h3 style={{ fontSize: '1rem', color: '#fff', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <MessageCircle size={18} style={{ color: 'var(--accent-gold)' }} />
              Recordatorios ({selectedForReminder.size} seleccionados)
            </h3>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button
                onClick={() => {
                  if (selectedForReminder.size === sortedOverdue.length) {
                    setSelectedForReminder(new Set());
                  } else {
                    setSelectedForReminder(new Set(sortedOverdue.map(fs => fs.fighter.id)));
                  }
                }}
                className="btn btn-secondary"
                style={{ fontSize: '0.78rem', padding: '6px 12px' }}
              >
                {selectedForReminder.size === sortedOverdue.length ? 'Deseleccionar todos' : 'Seleccionar todos'}
              </button>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', maxHeight: '400px', overflowY: 'auto' }}>
            {sortedOverdue
              .filter((fs) => selectedForReminder.size === 0 || selectedForReminder.has(fs.fighter.id))
              .map((fs) => {
                const reminderText = generateReminder(
                  fs.fighter.name,
                  15000, // default amount
                  period,
                  `día ${dueDay}`
                );
                const reminderId = `rem-${fs.fighter.id}`;
                return (
                  <div key={fs.fighter.id} className="glass-card" style={{ padding: '14px', borderRadius: '12px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                      <div>
                        <input
                          type="checkbox"
                          checked={selectedForReminder.has(fs.fighter.id)}
                          onChange={() => toggleReminderSelection(fs.fighter.id)}
                          style={{ marginRight: '10px', accentColor: 'var(--accent-orange)' }}
                        />
                        <strong style={{ color: '#fff', fontSize: '0.9rem' }}>{fs.fighter.name}</strong>
                        <span style={{ color: 'var(--text-muted)', fontSize: '0.78rem', marginLeft: '8px' }}>
                          {fs.fighter.socialMedia?.instagram || 'Sin teléfono registrado'}
                        </span>
                      </div>
                      <button
                        onClick={() => {
                          // Open wa.me link
                          const phone = fs.fighter.socialMedia?.instagram?.replace(/[^0-9]/g, '') || '';
                          if (phone) {
                            window.open(`https://wa.me/${phone}?text=${encodeURIComponent(reminderText)}`, '_blank');
                          } else {
                            handleCopyReminder(reminderText, reminderId);
                          }
                        }}
                        className="btn btn-secondary"
                        style={{ fontSize: '0.78rem', padding: '6px 10px', flexShrink: 0 }}
                      >
                        {copiedId === reminderId ? <Check size={14} /> : <Copy size={14} />}
                        {copiedId === reminderId ? 'Copiado' : 'Copiar'}
                      </button>
                    </div>
                    <textarea
                      readOnly
                      value={reminderText}
                      style={{
                        width: '100%',
                        padding: '10px',
                        borderRadius: '8px',
                        border: '1px solid var(--border-color)',
                        background: 'var(--bg-input)',
                        color: 'var(--text-secondary)',
                        fontSize: '0.85rem',
                        resize: 'none',
                        fontFamily: 'inherit',
                      }}
                      rows={2}
                      onClick={(e) => {
                        // Fallback: select text for manual copy
                        if (!navigator.clipboard) {
                          (e.target as HTMLTextAreaElement).select();
                        }
                      }}
                    />
                  </div>
                );
              })}
          </div>
        </div>
      )}

      {/* Main Table */}
      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '40px' }}>
          <div className="animate-spin" style={{ width: '32px', height: '32px', border: '3px solid var(--border-color)', borderTopColor: 'var(--accent-orange)', borderRadius: '50%' }} />
        </div>
      ) : filteredStatuses.length === 0 ? (
        <div className="glass-panel" style={{ padding: '40px', textAlign: 'center', borderRadius: '20px' }}>
          {tabView === 'overdue' ? (
            <>
              <CheckCircle size={48} style={{ color: 'var(--color-success)', opacity: 0.5, marginBottom: '12px' }} />
              <p style={{ color: 'var(--text-secondary)', fontSize: '1.1rem' }}>Todos los luchadores están al día 🎉</p>
            </>
          ) : (
            <>
              <DollarSign size={48} style={{ color: 'var(--text-muted)', opacity: 0.3, marginBottom: '12px' }} />
              <p style={{ color: 'var(--text-secondary)', fontSize: '1.1rem' }}>No hay luchadores activos en este período</p>
            </>
          )}
        </div>
      ) : (
        <div className="glass-panel" style={{ borderRadius: '20px', overflow: 'hidden' }}>
          {/* Table Header */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: tabView === 'overdue' ? '2fr 1fr 1fr 1fr 1.5fr 1fr' : '2fr 1.5fr 1fr 1fr 1fr 1.5fr',
            gap: '8px',
            padding: '14px 20px',
            borderBottom: '1px solid var(--border-color)',
            background: 'rgba(255,255,255,0.02)',
            fontSize: '0.75rem',
            fontWeight: 700,
            textTransform: 'uppercase',
            color: 'var(--text-secondary)',
            letterSpacing: '0.03em',
          }}>
            <span>Luchador</span>
            <span>Monto</span>
            <span>Método</span>
            <span>Estado</span>
            {tabView === 'overdue' ? (
              <>
                <span>Seguimiento</span>
                <span style={{ textAlign: 'right' }}>Acción</span>
              </>
            ) : (
              <>
                <span>Fecha</span>
                <span style={{ textAlign: 'right' }}>Acción</span>
              </>
            )}
          </div>

          {/* Table Rows */}
          {filteredStatuses.map((fs) => {
            const p = fs.payment;
            const isOverdueView = tabView === 'overdue';
            const phone = fs.fighter.socialMedia?.instagram || '';
            const reminderText = generateReminder(fs.fighter.name, 15000, period, `día ${dueDay}`);
            const reminderId = `rem-${fs.fighter.id}`;

            return (
              <div
                key={fs.fighter.id}
                style={{
                  display: 'grid',
                  gridTemplateColumns: isOverdueView ? '2fr 1fr 1fr 1fr 1.5fr 1fr' : '2fr 1.5fr 1fr 1fr 1fr 1.5fr',
                  gap: '8px',
                  padding: '14px 20px',
                  borderBottom: '1px solid rgba(255,255,255,0.03)',
                  alignItems: 'center',
                  fontSize: '0.85rem',
                  transition: 'background 0.2s',
                }}
                onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.02)'; }}
                onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = 'transparent'; }}
              >
                {/* Fighter Name */}
                <div>
                  <span style={{ color: '#fff', fontWeight: 700 }}>{fs.fighter.name}</span>
                  {isOverdueView && fs.fighter.socialMedia?.instagram && (
                    <div style={{ display: 'flex', gap: '6px', marginTop: '4px' }}>
                      <a
                        href={`tel:${phone}`}
                        style={{ color: 'var(--accent-orange)', fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: '4px' }}
                      >
                        <Phone size={12} /> Llamar
                      </a>
                      <a
                        href={`https://wa.me/${phone.replace(/[^0-9]/g, '')}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{ color: 'var(--color-success)', fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: '4px' }}
                      >
                        <MessageCircle size={12} /> WhatsApp
                      </a>
                    </div>
                  )}
                </div>

                {/* Amount */}
                <span style={{ color: '#fff', fontWeight: 700 }}>
                  ${(p?.amount || 15000).toLocaleString('es-CO')}
                </span>

                {/* Method */}
                <span style={{ color: 'var(--text-secondary)', fontSize: '0.8rem' }}>
                  {p ? methodLabel[p.method] || p.method : '—'}
                </span>

                {/* Status Badge */}
                <span style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '4px 12px',
                  borderRadius: '20px',
                  fontSize: '0.78rem',
                  fontWeight: 700,
                  background: `${statusColor(fs.status)}15`,
                  color: statusColor(fs.status),
                  width: 'fit-content',
                }}>
                  {fs.status === 'paid' && <CheckCircle size={12} />}
                  {fs.status === 'pending' && <Clock size={12} />}
                  {fs.status === 'overdue' && <AlertTriangle size={12} />}
                  {fs.status === 'cancelled' && <XCircle size={12} />}
                  {statusLabel(fs.status)}
                </span>

                {/* Overdue view: follow-up */}
                {isOverdueView ? (
                  <div>
                    <button
                      onClick={() => toggleFollowUp(fs.fighter.id, fs.payment ? 'contacted' : 'pending-contact')}
                      className="btn btn-secondary"
                      style={{ fontSize: '0.75rem', padding: '4px 10px' }}
                    >
                      {fs.payment ? 'Contactado' : 'Marcar contactado'}
                    </button>
                  </div>
                ) : (
                  /* Non-overdue view: date */
                  <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>
                    {p ? new Date(p.paidAt).toLocaleDateString('es-AR') : '—'}
                  </span>
                )}

                {/* Actions */}
                <div style={{ display: 'flex', gap: '6px', justifyContent: 'flex-end' }}>
                  {isEditor && fs.status === 'pending' && (
                    <button
                      onClick={() => handleAddPayment(fs.fighter.id)}
                      className="btn btn-primary"
                      style={{ fontSize: '0.75rem', padding: '4px 10px' }}
                    >
                      Registrar
                    </button>
                  )}
                  {p && isEditor && fs.status === 'paid' && (
                    <button
                      onClick={() => handleEdit(p)}
                      className="btn btn-secondary"
                      style={{ fontSize: '0.75rem', padding: '4px 10px' }}
                    >
                      Editar
                    </button>
                  )}
                  {isOverdueView && (
                    <button
                      onClick={async () => {
                        const success = await copyToClipboard(reminderText);
                        if (success) {
                          setCopiedId(reminderId);
                          toast('success', 'Mensaje copiado al portapapeles');
                          setTimeout(() => setCopiedId(null), 2000);
                        } else {
                          toast('warning', 'Presioná Ctrl+C para copiar el mensaje');
                        }
                      }}
                      className="btn btn-secondary"
                      style={{ fontSize: '0.75rem', padding: '4px 10px' }}
                    >
                      {copiedId === reminderId ? <Check size={14} /> : <Copy size={14} />}
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Payment Form Modal */}
      {showForm && (
        <PaymentForm
          fighters={fighters}
          existingPayments={payments}
          payment={editingPayment}
          onSave={handleSave}
          onCancel={editingPayment ? handleCancel : undefined}
          onClose={handleFormClose}
          defaultPeriod={period}
          defaultFighterId={defaultFighterId}
        />
      )}
    </div>
  );
};
