import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import type { Fighter, Payment, ProgramConfig } from '../types/mma';
import {
  subscribeAllPayments,
  subscribeProgramsConfig,
  savePayment,
  cancelPayment as cancelPaymentInStore,
} from '../services/storage';
import { useAuth } from '../contexts/AuthContext';

// Helper: extract a usable phone number from a fighter
// Falls back to socialMedia.instagram if it looks like a phone number
const getFighterPhone = (f: Fighter): string | null => {
  const raw = f.socialMedia?.instagram?.replace(/[^0-9]/g, '') || '';
  return raw.length >= 7 ? raw : null;
};
import { useToast } from '../contexts/ToastContext';
import { useConfirm } from '../contexts/ConfirmContext';
import { PaymentForm } from './PaymentForm';
import { CoverageCalendar } from './CoverageCalendar';
import {
  DollarSign, Download, Search, Phone, MessageCircle,
  CheckCircle, Clock, AlertTriangle, Copy, Check,
  Calendar,
} from 'lucide-react';
import {
  computeMembershipStatus,
  generateReminder,
  copyToClipboard,
} from '../utils/payments';

interface PaymentPanelProps {
  fighters: Fighter[];
}

type TabView = 'all' | 'overdue';
type FollowUpFilter = 'all' | 'pending-contact' | 'contacted';

interface CalendarPopup {
  fighterId: string;
  triggerRect: DOMRect;
}

export const PaymentPanel: React.FC<PaymentPanelProps> = ({ fighters }) => {
  const { toast } = useToast();
  const { confirm } = useConfirm();
  const { user, isEditor } = useAuth();

  // ── State ───────────────────────────────────────────────────────────
  const [payments, setPayments] = useState<Payment[]>([]);
  const [programs, setPrograms] = useState<ProgramConfig[]>([]);
  const [loading, setLoading] = useState(true);
  const [tabView, setTabView] = useState<TabView>('all');
  const [followUpFilter, setFollowUpFilter] = useState<FollowUpFilter>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Form state
  const [showForm, setShowForm] = useState(false);
  const [editingPayment, setEditingPayment] = useState<Payment | null>(null);
  const [defaultFighterId, setDefaultFighterId] = useState<string | undefined>(undefined);

  // Calendar popup state
  const [calendarPopup, setCalendarPopup] = useState<CalendarPopup | null>(null);

  // Follow-up tracking state
  const [contactedFighters, setContactedFighters] = useState<Set<string>>(new Set());
  const toggleContacted = useCallback((fighterId: string) => {
    setContactedFighters(prev => {
      const next = new Set(prev);
      if (next.has(fighterId)) next.delete(fighterId);
      else next.add(fighterId);
      return next;
    });
  }, []);

  // Reminder state
  const [selectedForReminder, setSelectedForReminder] = useState<Set<string>>(new Set());
  const [showReminders, setShowReminders] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const copiedTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // ── Subscriptions ───────────────────────────────────────────────────
  useEffect(() => {
    setLoading(true);
    const unsub = subscribeAllPayments((list) => {
      setPayments(list);
      setLoading(false);
    }, () => {
      setLoading(false);
    });
    return unsub;
  }, []);

  useEffect(() => {
    const unsub = subscribeProgramsConfig((progs) => {
      setPrograms(progs);
    });
    return unsub;
  }, []);

  // ── Membership status per fighter ───────────────────────────────────
  const fighterStatuses = useMemo(() => {
    return fighters.map((f) => {
      const fighterPayments = payments.filter(
        p => p.fighterId === f.id && p.status !== 'cancelled' && p.coverageEnd != null
      );
      // Latest non-cancelled payment with coverage
      const latestPayment = fighterPayments
        .filter(p => p.status !== 'cancelled')
        .sort((a, b) => (b.coverageStart || '').localeCompare(a.coverageStart || ''))[0];

      return {
        fighter: f,
        latestPayment,
        payments: fighterPayments,
        status: computeMembershipStatus(fighterPayments),
      };
    });
  }, [fighters, payments]);

  // Active, expired, pending counts
  const counts = useMemo(() => {
    let active = 0, expired = 0, pending = 0;
    for (const fs of fighterStatuses) {
      if (fs.status === 'active') active++;
      else if (fs.status === 'expired') expired++;
      else pending++;
    }
    return { active, expired, pending };
  }, [fighterStatuses]);

  // Expired fighters (for overdue view)
  const expiredFighters = useMemo(
    () => fighterStatuses.filter((fs) => fs.status === 'expired'),
    [fighterStatuses]
  );

  // Filtered view
  const filteredStatuses = useMemo(() => {
    let list = fighterStatuses;

    if (tabView === 'overdue') {
      list = list.filter((fs) => fs.status === 'expired');
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter((fs) => fs.fighter.name.toLowerCase().includes(q));
    }

    return list;
  }, [fighterStatuses, tabView, searchQuery]);

  // Sort expired by enrollment, apply follow-up filter
  const sortedExpired = useMemo(() => {
    let list = [...expiredFighters];
    if (followUpFilter === 'contacted') {
      list = list.filter(fs => contactedFighters.has(fs.fighter.id));
    } else if (followUpFilter === 'pending-contact') {
      list = list.filter(fs => !contactedFighters.has(fs.fighter.id));
    }
    return list.sort((a, b) =>
      (a.fighter.createdAt || '').localeCompare(b.fighter.createdAt || '')
    );
  }, [expiredFighters, followUpFilter, contactedFighters]);

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

  // ── Calendar popup ──────────────────────────────────────────────────
  const openCalendar = useCallback((fighterId: string, e: React.MouseEvent) => {
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    setCalendarPopup({ fighterId, triggerRect: rect });
  }, []);

  const closeCalendar = useCallback(() => {
    setCalendarPopup(null);
  }, []);

  // ── Reminders ───────────────────────────────────────────────────────
  const toggleReminderSelection = (fighterId: string) => {
    setSelectedForReminder((prev) => {
      const next = new Set(prev);
      if (next.has(fighterId)) next.delete(fighterId);
      else next.add(fighterId);
      return next;
    });
  };

  const handleCopyReminder = async (text: string, id: string) => {
    const success = await copyToClipboard(text);
    if (success) {
      setCopiedId(id);
      toast('success', 'Mensaje copiado al portapapeles');
      if (copiedTimerRef.current) clearTimeout(copiedTimerRef.current);
      copiedTimerRef.current = setTimeout(() => setCopiedId(null), 2000);
    } else {
      toast('warning', 'Presioná Ctrl+C para copiar el mensaje');
    }
  };

  // ── Export ──────────────────────────────────────────────────────────
  const handleExport = async () => {
    if (payments.length === 0) {
      toast('warning', 'No hay pagos registrados');
      return;
    }
    try {
      const { exportPaymentsToExcel } = await import('../utils/exportPaymentExcel');
      await exportPaymentsToExcel(payments, fighters, programs);
      toast('success', 'Exportación completada');
    } catch (err) {
      console.error('Export error:', err);
      toast('error', 'Error al exportar. Intentá de nuevo.');
    }
  };

  // ── Helpers ─────────────────────────────────────────────────────────
  const membershipColor = (status: string) => {
    switch (status) {
      case 'active': return 'var(--color-success)';
      case 'expired': return 'var(--color-danger)';
      default: return 'var(--text-muted)';
    }
  };

  const membershipLabel = (status: string) => {
    switch (status) {
      case 'active': return 'Activo';
      case 'expired': return 'Expirado';
      default: return 'Sin membresía';
    }
  };

  const programName = (programId?: string) => {
    if (!programId) return '—';
    const prog = programs.find(p => p.id === programId);
    return prog?.name || programId;
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
      {/* Header — No period selector */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h1 style={{ fontSize: '1.8rem', color: '#fff', fontWeight: 800, letterSpacing: '-0.02em', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <DollarSign size={24} style={{ color: 'var(--accent-orange)' }} />
            Pagos
          </h1>
          <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', marginTop: '4px' }}>
            Membresías — cobertura continua
          </p>
        </div>

        <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
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

      {/* Count Cards — Active / Expired / Pending */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '12px' }}>
        {[
          { label: 'Activos', value: counts.active, color: 'var(--color-success)', bg: 'rgba(16,185,129,0.1)' },
          { label: 'Expirados', value: counts.expired, color: 'var(--color-danger)', bg: 'rgba(239,68,68,0.1)' },
          { label: 'Sin membresía', value: counts.pending, color: 'var(--text-muted)', bg: 'rgba(255,255,255,0.03)' },
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
          Expirados {expiredFighters.length > 0 && `(${expiredFighters.length})`}
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

      {/* Expired Filters */}
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

          {tabView === 'overdue' && sortedExpired.length > 0 && (
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

      {/* Reminder Sheet */}
      {showReminders && tabView === 'overdue' && sortedExpired.length > 0 && (
        <div className="glass-panel" style={{ padding: '20px', borderRadius: '16px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
            <h3 style={{ fontSize: '1rem', color: '#fff', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <MessageCircle size={18} style={{ color: 'var(--accent-gold)' }} />
              Recordatorios ({selectedForReminder.size} seleccionados)
            </h3>
            <button
              onClick={() => {
                if (selectedForReminder.size === sortedExpired.length) {
                  setSelectedForReminder(new Set());
                } else {
                  setSelectedForReminder(new Set(sortedExpired.map(fs => fs.fighter.id)));
                }
              }}
              className="btn btn-secondary"
              style={{ fontSize: '0.78rem', padding: '6px 12px' }}
            >
              {selectedForReminder.size === sortedExpired.length ? 'Deseleccionar todos' : 'Seleccionar todos'}
            </button>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', maxHeight: '400px', overflowY: 'auto' }}>
            {sortedExpired
              .filter((fs) => selectedForReminder.size === 0 || selectedForReminder.has(fs.fighter.id))
              .map((fs) => {
                const latest = fs.latestPayment;
                const reminderText = generateReminder(
                  fs.fighter.name,
                  latest?.amount || programs[0]?.monthlyPrice || 160000,
                  latest?.programId ? programName(latest.programId) : '',
                  latest?.coverageEnd || undefined
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
                          {getFighterPhone(fs.fighter) || fs.fighter.socialMedia?.instagram || 'Sin contacto'}
                        </span>
                      </div>
                      <button
                        onClick={() => {
                          const phone = getFighterPhone(fs.fighter);
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
              <p style={{ color: 'var(--text-secondary)', fontSize: '1.1rem' }}>Todos los luchadores están activos</p>
            </>
          ) : (
            <>
              <DollarSign size={48} style={{ color: 'var(--text-muted)', opacity: 0.3, marginBottom: '12px' }} />
              <p style={{ color: 'var(--text-secondary)', fontSize: '1.1rem' }}>No hay luchadores registrados</p>
            </>
          )}
        </div>
      ) : (
        <div className="glass-panel" style={{ borderRadius: '20px', overflow: 'hidden' }}>
          {/* Table Header */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: '2fr 1.2fr 1fr 1fr 1.2fr 1.5fr 0.6fr',
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
            <span>Estado</span>
            <span>Programa</span>
            <span>Cobertura</span>
            <span>Último pago</span>
            <span>Método</span>
            <span style={{ textAlign: 'right' }}>Acción</span>
          </div>

          {/* Table Rows */}
          {filteredStatuses.map((fs) => {
            const p = fs.latestPayment;
            const isExpired = fs.status === 'expired';
            const reminderText = generateReminder(
              fs.fighter.name,
              p?.amount || programs[0]?.monthlyPrice || 160000,
              p?.programId ? programName(p.programId) : '',
              p?.coverageEnd || undefined
            );
            const reminderId = `rem-${fs.fighter.id}`;

            return (
              <div
                key={fs.fighter.id}
                style={{
                  display: 'grid',
                  gridTemplateColumns: '2fr 1.2fr 1fr 1.2fr 1.2fr 1.5fr 0.6fr',
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
                  {(() => {
                    const fighterPhone = getFighterPhone(fs.fighter);
                    if (!fighterPhone) return null;
                    return (
                    <div style={{ display: 'flex', gap: '6px', marginTop: '4px' }}>
                      <a
                        href={`tel:${fighterPhone}`}
                        style={{ color: 'var(--accent-orange)', fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: '4px' }}
                      >
                        <Phone size={12} /> Llamar
                      </a>
                      <a
                        href={`https://wa.me/${fighterPhone}`}
                        target="_blank" rel="noopener noreferrer"
                        style={{ color: 'var(--color-success)', fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: '4px' }}
                      >
                        <MessageCircle size={12} /> WhatsApp
                      </a>
                    </div>
                  );
                })()}
                </div>

                {/* Membership Status Badge */}
                <span style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '4px 12px',
                  borderRadius: '20px',
                  fontSize: '0.78rem',
                  fontWeight: 700,
                  background: `${membershipColor(fs.status)}15`,
                  color: membershipColor(fs.status),
                  width: 'fit-content',
                }}>
                  {fs.status === 'active' && <CheckCircle size={12} />}
                  {fs.status === 'expired' && <AlertTriangle size={12} />}
                  {fs.status === 'pending' && <Clock size={12} />}
                  {membershipLabel(fs.status)}
                </span>

                {/* Program */}
                <span style={{ color: 'var(--text-secondary)', fontSize: '0.8rem' }}>
                  {p?.programId ? programName(p.programId) : '—'}
                </span>

                {/* Coverage Range */}
                <span style={{ color: 'var(--text-muted)', fontSize: '0.78rem' }}>
                  {p?.coverageEnd
                    ? `${new Date(p.coverageEnd).toLocaleDateString('es-AR')}`
                    : '—'}
                </span>

                {/* Latest Payment Amount */}
                <span style={{ color: '#fff', fontWeight: 700 }}>
                  {p ? `$${p.amount.toLocaleString('es-CO')}` : '—'}
                </span>

                {/* Method */}
                <span style={{ color: 'var(--text-secondary)', fontSize: '0.8rem' }}>
                  {p ? methodLabel[p.method] || p.method : '—'}
                </span>

                {/* Actions */}
                <div style={{ display: 'flex', gap: '6px', justifyContent: 'flex-end' }}>
                  {/* Calendar icon */}
                  <button
                    onClick={(e) => openCalendar(fs.fighter.id, e)}
                    className="btn btn-secondary"
                    style={{ fontSize: '0.75rem', padding: '4px 8px' }}
                    title="Ver calendario de cobertura"
                    aria-label="Calendario de cobertura"
                  >
                    <Calendar size={14} />
                  </button>

                  {isEditor && (fs.status === 'pending' || fs.status === 'expired') && (
                    <button
                      onClick={() => handleAddPayment(fs.fighter.id)}
                      className="btn btn-primary"
                      style={{ fontSize: '0.75rem', padding: '4px 10px' }}
                    >
                      Pagar
                    </button>
                  )}
                  {p && isEditor && fs.status === 'active' && (
                    <button
                      onClick={() => handleEdit(p)}
                      className="btn btn-secondary"
                      style={{ fontSize: '0.75rem', padding: '4px 10px' }}
                    >
                      Editar
                    </button>
                  )}
                  {isExpired && (
                    <button
                      onClick={() => toggleContacted(fs.fighter.id)}
                      className={`btn ${contactedFighters.has(fs.fighter.id) ? 'btn-primary' : 'btn-secondary'}`}
                      style={{ fontSize: '0.75rem', padding: '4px 8px' }}
                      title={contactedFighters.has(fs.fighter.id) ? 'Marcar como no contactado' : 'Marcar como contactado'}
                    >
                      {contactedFighters.has(fs.fighter.id) ? '✓' : <MessageCircle size={14} />}
                    </button>
                  )}
                  {isExpired && (
                    <button
                      onClick={async () => {
                        const success = await copyToClipboard(reminderText);
                        if (success) {
                          setCopiedId(reminderId);
                          toast('success', 'Mensaje copiado al portapapeles');
                          if (copiedTimerRef.current) clearTimeout(copiedTimerRef.current);
                          copiedTimerRef.current = setTimeout(() => setCopiedId(null), 2000);
                        } else {
                          toast('warning', 'Presioná Ctrl+C para copiar el mensaje');
                        }
                      }}
                      className="btn btn-secondary"
                      style={{ fontSize: '0.75rem', padding: '4px 8px' }}
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

      {/* Coverage Calendar Popup */}
      {calendarPopup && (
        <CoverageCalendar
          coverages={(() => {
            const fId = calendarPopup.fighterId;
            return payments
              .filter(p => p.fighterId === fId && p.coverageStart && p.coverageEnd && p.programId)
              .map(p => ({
                programId: p.programId! as 'daily' | 'three-day',
                coverageStart: p.coverageStart!,
                coverageEnd: p.coverageEnd!,
              }));
          })()}
          triggerRect={calendarPopup.triggerRect}
          onClose={closeCalendar}
        />
      )}

      {/* Payment Form Modal */}
      {showForm && (
        <PaymentForm
          fighters={fighters}
          existingPayments={payments}
          programs={programs}
          payment={editingPayment}
          onSave={handleSave}
          onCancel={editingPayment ? handleCancel : undefined}
          onClose={handleFormClose}
          defaultFighterId={defaultFighterId}
        />
      )}
    </div>
  );
};
