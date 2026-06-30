import React, { useState, useEffect, useMemo, useCallback } from 'react';

interface CoverageInterval {
  programId: 'daily' | 'three-day';
  coverageStart: string;
  coverageEnd: string;
}

interface CoverageCalendarProps {
  coverages: CoverageInterval[];
  triggerRect: DOMRect;
  onClose: () => void;
}

const WEEKDAYS = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
const MONTH_NAMES = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre',
];

export const CoverageCalendar: React.FC<CoverageCalendarProps> = ({
  coverages,
  triggerRect,
  onClose,
}) => {
  const [currentMonth, setCurrentMonth] = useState<Date>(() => {
    const d = new Date();
    return new Date(d.getFullYear(), d.getMonth(), 1);
  });

  // Click outside to close
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target.closest('[data-calendar-popover]')) {
        onClose();
      }
    };
    // Delay to avoid immediate close from trigger click
    const timer = setTimeout(() => {
      document.addEventListener('mousedown', handleClickOutside);
    }, 0);
    return () => {
      clearTimeout(timer);
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [onClose]);

  // Escape key to close
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  // Compute highlighted days for the current month (date-only, no timezone)
  const highlightedDays = useMemo(() => {
    const days = new Set<number>();
    const month = currentMonth.getMonth();
    for (const cov of coverages) {
      const startDate = cov.coverageStart.slice(0, 10);
      const endDate = cov.coverageEnd.slice(0, 10);

      // Walk day-by-day using strings to avoid timezone issues
      const cursor = new Date(startDate + 'T12:00:00');
      const endBound = new Date(endDate + 'T12:00:00');

      while (cursor <= endBound) {
        const d = cursor.getDate();
        const m = cursor.getMonth();
        if (m === month) days.add(d);
        // Also check if cursor is within this month's range
        cursor.setDate(cursor.getDate() + 1);
      }
    }
    return days;
  }, [coverages, currentMonth]);

  const prevMonth = useCallback(() => {
    setCurrentMonth(prev => new Date(prev.getFullYear(), prev.getMonth() - 1, 1));
  }, []);

  const nextMonth = useCallback(() => {
    setCurrentMonth(prev => new Date(prev.getFullYear(), prev.getMonth() + 1, 1));
  }, []);

  // Compute popover position from trigger button's DOMRect
  const position = useMemo(() => {
    const CAL_WIDTH = 280;
    const MARGIN = 8;
    // Center under trigger, clamp to viewport
    const top = triggerRect.bottom + 8;
    const idealLeft = triggerRect.left + triggerRect.width / 2 - CAL_WIDTH / 2;
    const left = Math.max(MARGIN, Math.min(idealLeft, window.innerWidth - CAL_WIDTH - MARGIN));
    return { top, left };
  }, [triggerRect]);

  // Month grid data
  const year = currentMonth.getFullYear();
  const month = currentMonth.getMonth();
  const firstDay = new Date(year, month, 1).getDay(); // 0=Dom
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  return (
    <div
      data-calendar-popover
      role="dialog"
      aria-label="Calendario de cobertura"
      style={{
        position: 'fixed',
        top: position.top,
        left: position.left,
        zIndex: 200,
        background: '#1a1a2e',
        border: '1px solid rgba(255,255,255,0.1)',
        borderRadius: '16px',
        padding: '16px',
        boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
        width: '280px',
      }}
    >
      {/* Header: Navigation + Month Label */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '12px',
      }}>
        <button
          onClick={prevMonth}
          aria-label="Mes anterior"
          style={{
            background: 'none',
            border: 'none',
            color: 'var(--text-secondary)',
            cursor: 'pointer',
            fontSize: '1.2rem',
            padding: '4px 8px',
            borderRadius: '6px',
          }}
        >
          ←
        </button>
        <span style={{
          color: '#fff',
          fontWeight: 700,
          fontSize: '0.95rem',
        }}>
          {MONTH_NAMES[month]} {year}
        </span>
        <button
          onClick={nextMonth}
          aria-label="Mes siguiente"
          style={{
            background: 'none',
            border: 'none',
            color: 'var(--text-secondary)',
            cursor: 'pointer',
            fontSize: '1.2rem',
            padding: '4px 8px',
            borderRadius: '6px',
          }}
        >
          →
        </button>
      </div>

      {/* Month Grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(7, 1fr)',
        gap: '2px',
      }}>
        {/* Weekday Headers */}
        {WEEKDAYS.map(d => (
          <div key={d} style={{
            textAlign: 'center',
            fontSize: '0.7rem',
            color: 'var(--text-muted)',
            padding: '6px 0',
            fontWeight: 700,
          }}>
            {d}
          </div>
        ))}

        {/* Empty cells before first day */}
        {Array.from({ length: firstDay }, (_, i) => (
          <div key={`empty-${i}`} style={{ visibility: 'hidden', padding: '6px' }} />
        ))}

        {/* Day cells */}
        {Array.from({ length: daysInMonth }, (_, i) => {
          const day = i + 1;
          const isHighlighted = highlightedDays.has(day);
          return (
            <div
              key={day}
              role="gridcell"
              aria-label={isHighlighted ? `Día ${day} — cubierto` : `Día ${day}`}
              style={{
                textAlign: 'center',
                padding: '6px',
                borderRadius: '6px',
                fontSize: '0.85rem',
                color: isHighlighted ? '#fff' : 'var(--text-secondary)',
                background: isHighlighted ? 'var(--accent-orange)' : 'transparent',
                fontWeight: isHighlighted ? 700 : 400,
              }}
            >
              {day}
            </div>
          );
        })}
      </div>
    </div>
  );
};
