# Design: Membership Coverage (Rolling Model)

## Technical Approach

Replace period-based fixed-fee tracking with a rolling membership model. Payments no longer correspond to calendar months — each payment buys N months of a program with explicit coverage start/end dates computed via stacking/gap logic. Membership status is derived client-side from the fighter's coverage intervals as-of-today.

Three pure utility functions form the core engine: `computeProgram` (amount → program), `computeCoverage` (existing payments + new payment → coverageStart/End), and `computeMembershipStatus` (fighter's payments → 'active' | 'expired' | 'pending'). Storage remains thin — it calls `computeCoverage` before persisting, but the logic itself is testable without Firestore.

## Architecture Decisions

### Decision: Coverage Engine Location

| Option | Tradeoff | Decision |
|--------|----------|----------|
| **Pure utilities in `src/utils/payments.ts`** | Testable without Firestore, no side effects, composable | **Chosen** — the three core functions (`computeProgram`, `computeCoverage`, `computeMembershipStatus`) are pure, receive all inputs as params, return deterministic outputs |
| Embedded in `storage.ts` `savePayment` | Ties logic to Firestore writes, harder to test independently | Rejected — storage should be thin, logic should be pure |
| Cloud Function | Infra cost, cold start, overkill for <100 fighters | Rejected |

`storage.ts`'s `savePayment` will import and call `computeCoverage` before writing, injecting the computed coverage fields into the payment doc. This keeps storage thin while the logic lives in the utility layer.

### Decision: Subscription Strategy

| Option | Tradeoff | Decision |
|--------|----------|----------|
| **All payments unfiltered (`subscribeAllPayments`)** | Single subscription, no period filter, <2000 docs → negligible cost, client-side filter by fighterId | **Chosen** — simplify, remove `subscribePaymentsByPeriod` entirely |
| Keep `subscribePaymentsByPeriod` with new coverage fields | Multiple subscriptions per view (one per period), defeats purpose of rolling model | Rejected — period is no longer the query dimension |
| Paginated subscription | Added complexity for no benefit at this data scale | Rejected |

The new `subscribeAllPayments` replaces both `subscribePayments` (ordered by period) and `subscribePaymentsByPeriod`. It subscribes to the entire `/payments` collection with no `where` filter and no `orderBy` — all sorting happens client-side. For <100 fighters and <2000 payments, this is negligible.

### Decision: Program Config Loading

| Option | Tradeoff | Decision |
|--------|----------|----------|
| **Firestore onSnapshot (`subscribeProgramsConfig`)** | Real-time updates, cached in component state, single doc read | **Chosen** — matches existing `subscribePaymentConfig` pattern, config rarely changes so snapshot overhead is minimal |
| Inline constants | Hard-coded prices, requires code deploy to change | Rejected — programs may change |
| LocalStorage cache with Firestore fallback | Premature optimization for a single doc read | Rejected |

`subscribeProgramsConfig` reads `/config/payments` and extracts the `programs[]` array. Components subscribe once and hold the result in state. Default programs (daily $160k, three-day $120k) are the fallback if the doc doesn't exist.

### Decision: Ambiguous Amount Handling

| Option | Tradeoff | Decision |
|--------|----------|----------|
| **Prefer higher monthly price** | Daily ($160k) > Three-day ($120k). If both divide the amount, daily wins. Simple rule, no admin confusion. | **Chosen** — the more expensive program is the higher daily value, so defaulting to it is conservative and fair |
| Prefer lower monthly price (more months) | Could surprise admin who intended fewer, more expensive months | Rejected |
| Show picker even when unambiguous | Extra click every time, slows common flow | Rejected |

When `computeProgram` returns null (no exact multiple), the PaymentForm shows a manual picker with all options and what they'd cost: "Daily = 2 months ($320k, $50k extra)" / "Three-day = 3 months ($360k, $10k extra)".

### Decision: `period` Field Handling

| Option | Tradeoff | Decision |
|--------|----------|----------|
| **Derive `period` from `coverageStart` for new payments** | Backward-compatible: old code reading `period` works. Old payments keep their original `period`. | **Chosen** — `period = coverageStart.slice(0,7)` computed before save, no schema break |
| Remove `period` from new payments | Breaks any code that reads `period` unconditionally (e.g., Excel export sorting) | Rejected |
| Nullable `period` | More conditional branches everywhere | Rejected |

New payments get `period` derived from `coverageStart`. Old payments retain their original `period` value. Display code prefers `coverageStart`/`coverageEnd` when present, falls back to `period` for legacy records.

### Decision: Old Payments in New Model

| Option | Tradeoff | Decision |
|--------|----------|----------|
| **Legacy payments are archival only** | Old records display in history but don't affect membership status. Clean separation. | **Chosen** — user confirmed "start from scratch, no migration" |
| Derive approximate coverage for old payments | Complex heuristics, edge cases with partial months, wrong assumptions | Rejected |

Old payments (no `coverageStart`/`coverageEnd` fields) are treated as historical records. They display in FighterProfile's payment history but don't participate in `computeMembershipStatus` or `computeCoverage` stacking.

## Data Flow

### Save Payment Flow

```
User fills form
     │
     ▼
PaymentForm.handleSubmit()
     │
     ├── computeProgram(amount, programs)
     │   └── returns programId | null (null → show manual picker)
     │
     ├── monthsPaid = amount / programPrice
     │
     ├── computeCoverage({
     │       existingPayments: all non-cancelled for this fighter,
     │       programId,
     │       monthsPaid,
     │       paidAt: ISO date string
     │   })
     │   └── returns { coverageStart, coverageEnd }
     │       Logic:
     │         maxEnd = max(existingPayments, coverageEnd)
     │         if paidAt < maxEnd (stacking):
     │           coverageStart = maxEnd
     │           coverageEnd = addMonths(coverageStart, monthsPaid)
     │         else (gap or first payment):
     │           coverageStart = paidAt
     │           coverageEnd = addMonths(paidAt, monthsPaid)
     │
     ├── Build Payment { ...coverageFields, programId, monthsPaid,
     │     period: coverageStart.slice(0,7) }
     │
     └── storage.savePayment(payment)
          └── Firestore write (coverage fields stored in doc)
```

### Membership Status Flow

```
Component mounts
     │
     ├── subscribeAllPayments(onData)
     │   └── onData(payments[])  ← all payments, unfiltered
     │
     ├── subscribeProgramsConfig(onData)
     │   └── onData(programs[])  ← [{ id, name, monthlyPrice }]
     │
     └── For each fighter:
           applyments = payments.filter(p => p.fighterId === fighter.id)
                              .filter(p => p.status !== 'cancelled')
                              .filter(p => p.coverageEnd != null)  // skip legacy
           
           computeMembershipStatus(fighterPayments, referenceDate = today)
             → result: 'active' | 'expired' | 'pending'
             
           Logic:
             if fighterPayments.length === 0 → 'pending'
             activeExists = fighterPayments.some(p => p.coverageEnd >= today)
             activeExists ? 'active' : 'expired'
```

### CoverageCalendar Popover Flow

```
User clicks calendar icon on FighterRow
     │
     ▼
Toggle CoverageCalendar open
     │
     ├── Determine position via trigger.getBoundingClientRect()
     │   └── Popover positioned below, left-aligned
     │
     ├── Set currentMonth = today (first render)
     │
     ├── Build month grid:
     │   ├── Weekday headers (Dom, Lun, Mar, Mié, Jue, Vie, Sáb)
     │   ├── 6 rows × 7 columns
     │   ├── Each cell: day number
     │   └── Highlight if day ∈ any [coverageStart, coverageEnd]
     │
     ├── Keyboard: ← previous month, → next month, Escape close
     │
     └── Click outside → close popover
```

## Component Tree

```
App
└── PaymentPanel
    ├── Header
    │   ├── Title ("Pagos")
    │   └── Actions: [Registrar Pago] [Exportar]  (no period selector)
    │
    ├── CountCards
    │   ├── Activos (M)
    │   ├── Vencidos (N)
    │   └── Pendientes (P)
    │
    ├── SearchBar
    │
    └── FighterTable
        └── FighterRow[]  (one per fighter, not per payment)
            ├── Fighter name
            ├── Status badge: active / expired / pending
            ├── Program name (from latest payment)
            ├── Coverage range (latest coverageEnd)
            ├── [CalendarIcon] → CoverageCalendar (popover overlay)
            │   └── MonthGrid (CSS Grid, 7×6)
            │       ├── MonthNav ← Mes Actual →
            │       └── DayCell[] with highlight for coverage ranges
            └── Actions: [Pagar] (if expired/pending)

Dashboard
└── PaymentWidget
    ├── No period selector
    ├── subscribeAllPayments + computeMembershipStatus per fighter
    └── Counts: active / expired / pending

FighterProfile
└── PaymentHistorySection
    ├── Status badge (active/expired/pending) as-of-today
    ├── No period selector
    └── PaymentList (sorted by coverageStart desc)
        └── PaymentRow: program, amount, coverageStart→coverageEnd, status

PaymentForm (modal)
├── Fighter selector (required)
├── Amount input
│   └── computeProgram on blur → auto-detected program preview
├── PaidAt date picker (replaces period dropdown)
├── Manual program picker (only shown when computeProgram === null)
│   └── Options: "Daily = N months ($X, $Y extra)" for each program
├── Coverage preview (read-only, computed on the fly)
│   └── "Cobertura: {coverageStart} → {coverageEnd} (N meses)"
├── Method selector (unchanged)
├── Notes (unchanged)
└── Actions: [Cancelar] [Guardar]
```

## Interfaces / Contracts

### Payment Type Changes (src/types/mma.ts)

```typescript
// ─── New fields on Payment ──────────────────────────────────────────
export interface Payment {
  id: string;
  fighterId: string;
  period: string;           // "2026-07" — derived from coverageStart for new payments
  amount: number;           // COP, integer
  method: PaymentMethod;
  status: PaymentStatus;
  
  // NEW: Coverage fields
  coverageStart?: string;   // ISO date "2026-07-15T00:00:00.000Z"
  coverageEnd?: string;     // ISO date "2026-08-15T00:00:00.000Z"
  programId?: 'daily' | 'three-day';
  monthsPaid?: number;      // amount / programPrice (always integer)
  
  // Existing fields (unchanged)
  notes?: string;
  paidAt: string;           // ISO date
  cancelledAt?: string;
  cancelledBy?: string;
  createdAt: string;
  updatedAt: string;
  history?: PaymentEdit[];
}

// ─── PaymentConfig replaces dueDay/defaultAmount with programs ──────
export interface ProgramConfig {
  id: 'daily' | 'three-day';
  name: string;             // "Todos los días" | "3 días a la semana"
  monthlyPrice: number;     // 160000 | 120000
}

export interface PaymentConfig {
  programs: ProgramConfig[];
}
```

### Coverage Engine Functions (src/utils/payments.ts — new)

```typescript
interface ProgramResult {
  programId: 'daily' | 'three-day';
  monthsPaid: number;
}

/**
 * Given an amount and program list, detect which program(s) it matches.
 * Returns the selected program + monthsPaid, or null if no exact match.
 * Multiple matches → pick highest monthly price.
 */
export function computeProgram(
  amount: number,
  programs: ProgramConfig[]
): ProgramResult | null;

interface CoverageResult {
  coverageStart: string;  // ISO date
  coverageEnd: string;    // ISO date
}

/**
 * Compute coverage dates for a new payment given existing ones.
 * - Stacking: paidAt < max existing coverageEnd → start at maxEnd
 * - Gap: paidAt >= max existing coverageEnd → start at paidAt
 */
export function computeCoverage(
  existingPayments: Payment[],
  programId: 'daily' | 'three-day',
  monthsPaid: number,
  paidAt: string,          // ISO date
  programs: ProgramConfig[]
): CoverageResult;

/**
 * Determine a fighter's membership status as of a reference date.
 * - 'active': any non-cancelled payment with coverageEnd >= referenceDate
 * - 'expired': all payments have coverageEnd < referenceDate
 * - 'pending': no payments with coverage fields
 */
export function computeMembershipStatus(
  fighterPayments: Payment[],
  referenceDate?: string    // defaults to today
): 'active' | 'expired' | 'pending';
```

### CoverageCalendar Component (new)

```typescript
interface CoverageInterval {
  programId: 'daily' | 'three-day';
  coverageStart: string;   // ISO date
  coverageEnd: string;     // ISO date
}

interface CoverageCalendarProps {
  coverages: CoverageInterval[];
  triggerRect: DOMRect;     // position of the trigger button
  onClose: () => void;
}
```

### Subscription Changes (src/services/storage.ts)

```typescript
// NEW — replaces subscribePayments + subscribePaymentsByPeriod
export const subscribeAllPayments = (
  onData: (payments: Payment[]) => void,
  onError?: (err: Error) => void
): Unsubscribe;

// NEW — reads programs from /config/payments doc
export const subscribeProgramsConfig = (
  onData: (programs: ProgramConfig[]) => void,
  onError?: (err: Error) => void
): Unsubscribe;

// MODIFIED — savePayment now expects coverage fields pre-computed
// (they're computed in PaymentForm before calling onSave)
// savePayment signature unchanged, just persists what it receives
```

### PaymentForm Props Changes

```typescript
interface PaymentFormProps {
  fighters: Fighter[];
  existingPayments: Payment[];   // ← all payments (not just period-scoped)
  programs: ProgramConfig[];     // ← NEW: program config
  payment?: Payment | null;
  onSave: (payment: Payment) => void;
  onCancel?: (id: string) => void;
  onClose: () => void;
  defaultFighterId?: string;
  // REMOVED: defaultPeriod
}
```

## Sequence Diagrams

### Save Payment (with Stacking)

```
Admin          PaymentForm          payments.ts          storage.ts          Firestore
  │                │                    │                    │                  │
  │  enter $320k   │                    │                    │                  │
  │──────────────► │                    │                    │                  │
  │                │  computeProgram    │                    │                  │
  │                │──────────────────► │                    │                  │
  │                │  ← {daily, 2mo}    │                    │                  │
  │                │◄────────────────── │                    │                  │
  │                │                    │                    │                  │
  │  see preview   │                    │                    │                  │
  │◄────────────── │                    │                    │                  │
  │                │                    │                    │                  │
  │  submit        │                    │                    │                  │
  │──────────────► │  computeCoverage   │                    │                  │
  │                │  (existing + new)  │                    │                  │
  │                │──────────────────► │                    │                  │
  │                │  ← {start,end}     │                    │                  │
  │                │◄────────────────── │                    │                  │
  │                │                    │                    │                  │
  │                │  build Payment{}   │                    │                  │
  │                │  onSave(payment)   │                    │                  │
  │                │──────────────────────────────────────► │                  │
  │                │                    │                    │  setDoc          │
  │                │                    │                    │─────────────────►│
  │                │                    │                    │                  │
  │  done          │                    │                    │                  │
  │◄────────────── │                    │                    │                  │
```

### Compute Membership Status

```
Component           storage.ts         Firestore          payments.ts
   │                    │                  │                  │
   │ subscribeAll       │                  │                  │
   │──────────────────► │                  │                  │
   │                    │ onSnapshot       │                  │
   │                    │─────────────────►│                  │
   │                    │  ← Payment[]     │                  │
   │                    │◄─────────────────│                  │
   │  ← Payment[]       │                  │                  │
   │◄────────────────── │                  │                  │
   │                    │                  │                  │
   │ for each fighter:  │                  │                  │
   │ filter by fighterId│                  │                  │
   │ + non-cancelled    │                  │                  │
   │ + has coverageEnd  │                  │                  │
   │                    │                  │                  │
   │ computeMembership  │                  │                  │
   │──────────────────────────────────────────────────────► │
   │  ← active/expired  │                  │                  │
   │◄──────────────────────────────────────────────────────  │
   │                    │                  │                  │
   │ render status      │                  │                  │
```

## CoverageCalendar Design

### Component Structure

```
CoverageCalendar (absolute positioned popover)
├── CalendarHeader
│   ├── [< Prev] button
│   ├── Month label (e.g., "Junio 2026")
│   └── [Next >] button
│
└── MonthGrid (CSS Grid: 7 columns × 6 rows)
    ├── WeekdayHeaders (Dom, Lun, Mar, Mié, Jue, Vie, Sáb)
    └── DayCell (28-31 items depending on month)
        ├── Day number
        └── Highlight state:
            ├── none (default)
            ├── highlighted (day ∈ any coverage interval)
            ├── start (day === coverageStart)
            └── end (day === coverageEnd)
```

### Positioning

```typescript
// Compute popover position from trigger button's DOMRect
const position = {
  top: triggerRect.bottom + 8,    // 8px gap below trigger
  left: Math.max(8, triggerRect.left - 100),  // offset left to align calendar under icon
};

// Prevent overflow: if popover goes below viewport, position above
// If popover goes right of viewport, align right edge
```

### State

```typescript
const [currentMonth, setCurrentMonth] = useState<Date>(() => {
  // Start on today's month
  const d = new Date();
  return new Date(d.getFullYear(), d.getMonth(), 1);
});

// Highlighted days: computed from coverage intervals + currentMonth
const highlightedDays = useMemo(() => {
  const days = new Set<number>();
  const year = currentMonth.getFullYear();
  const month = currentMonth.getMonth();
  
  for (const cov of coverages) {
    const start = new Date(cov.coverageStart);
    const end = new Date(cov.coverageEnd);
    // Walk day by day within current month range
    const cursor = new Date(Math.max(start.getTime(), 
      new Date(year, month, 1).getTime()));
    const monthEnd = new Date(year, month + 1, 0);
    const endBound = new Date(Math.min(end.getTime(), monthEnd.getTime()));
    
    while (cursor <= endBound) {
      if (cursor.getMonth() === month) {
        days.add(cursor.getDate());
      }
      cursor.setDate(cursor.getDate() + 1);
    }
  }
  return days;
}, [coverages, currentMonth]);
```

### Month Grid Rendering

```typescript
const renderMonthGrid = () => {
  const year = currentMonth.getFullYear();
  const month = currentMonth.getMonth();
  const firstDay = new Date(year, month, 1).getDay(); // 0=Dom
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  
  const cells: ReactNode[] = [];
  
  // Weekday headers
  const WEEKDAYS = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
  WEEKDAYS.forEach(d => cells.push(<div className="cal-header">{d}</div>));
  
  // Empty cells before first day
  for (let i = 0; i < firstDay; i++) {
    cells.push(<div className="cal-cell cal-empty" />);
  }
  
  // Day cells
  for (let d = 1; d <= daysInMonth; d++) {
    const isHighlighted = highlightedDays.has(d);
    cells.push(
      <div className={`cal-cell ${isHighlighted ? 'cal-highlighted' : ''}`}>
        {d}
      </div>
    );
  }
  
  return <div className="cal-grid">{cells}</div>;
};
```

### Accessibility

- Popover has `role="dialog"` and `aria-label="Calendario de cobertura"`
- Month nav buttons have `aria-label="Mes anterior"` / `"Mes siguiente"`
- Day cells that are highlighted have `aria-label="Día N — cubierto"`
- Focus trap: Tab cycles through nav buttons and close button only
- Escape key closes popover
- Click outside closes popover (backdrop or document listener)

### CSS (CSS Grid, dark theme)

```css
.cal-grid {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  gap: 2px;
  width: 280px;
}

.cal-header {
  text-align: center;
  font-size: 0.7rem;
  color: var(--text-muted);
  padding: 6px 0;
  font-weight: 700;
}

.cal-cell {
  text-align: center;
  padding: 6px;
  border-radius: 6px;
  font-size: 0.85rem;
  color: var(--text-secondary);
}

.cal-highlighted {
  background: var(--accent-orange);
  color: #fff;
  font-weight: 700;
}

.cal-empty {
  visibility: hidden;
}
```

## Firestore Indexes

**No new composite indexes required.**

The new `subscribeAllPayments` uses no `where` filters and no `orderBy` — all sorting is client-side. This avoids any composite index requirements.

Current composite indexes (for the existing `subscribePayments` that orders by `period, fighterId`) can be kept or cleaned up — they won't be used by new code but won't cause issues.

Single-field indexes for the new coverage fields (`coverageStart`, `coverageEnd`) will be auto-created by Firestore if queries emerge later, but no queries use them as filters in this design.

## Storage Changes

### `subscribeAllPayments` (replaces both `subscribePayments` and `subscribePaymentsByPeriod`)

```typescript
export const subscribeAllPayments = (
  onData: (payments: Payment[]) => void,
  onError?: (err: Error) => void
): Unsubscribe => {
  const q = query(collection(db, PAYMENTS_COLLECTION));
  // No orderBy — client-side sort for flexibility
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
```

### `subscribeProgramsConfig` (new)

```typescript
const DEFAULT_PROGRAMS: ProgramConfig[] = [
  { id: 'daily', name: 'Todos los días', monthlyPrice: 160000 },
  { id: 'three-day', name: '3 días a la semana', monthlyPrice: 120000 },
];

export const subscribeProgramsConfig = (
  onData: (programs: ProgramConfig[]) => void,
  onError?: (err: Error) => void
): Unsubscribe => {
  const docRef = doc(db, 'config', 'payments');
  return onSnapshot(docRef,
    (snap) => {
      if (snap.exists()) {
        const data = snap.data();
        onData(data.programs as ProgramConfig[] || DEFAULT_PROGRAMS);
      } else {
        onData(DEFAULT_PROGRAMS);
      }
    },
    (err) => {
      console.error('Programs config error:', err);
      onError?.(err);
    }
  );
};
```

### `savePayment` — no change to signature

The `savePayment` function receives the Payment object with pre-computed coverage fields. It persists them as-is. The signature and Firestore write logic remain the same — it already does `setDoc` with `merge: true`, which handles new fields gracefully.

Note: Legacy `subscribePaymentConfig` (which returns `{ dueDay, defaultAmount }`) is replaced by `subscribeProgramsConfig`. Old `subscribePaymentConfig` is removed.

## Migration Strategy

No data migration. The system starts fresh:

1. **Old payments in Firestore**: Keep them. They have `period` but no coverage fields. They display in FighterProfile as historical records. They don't participate in `computeMembershipStatus` or `computeCoverage` stacking (filtered out by `coverageEnd == null` check).

2. **Config doc `/config/payments`**: Must be updated to include `programs[]` array. The seed/default path in `subscribeProgramsConfig` handles empty docs. For existing docs, an admin must update the config via the browser console or a one-time migration script:
   ```
   db.collection('config').doc('payments').update({
     programs: [
       { id: 'daily', name: 'Todos los días', monthlyPrice: 160000 },
       { id: 'three-day', name: '3 días a la semana', monthlyPrice: 120000 }
     ]
   });
   ```

3. **Remove `dueDay` + `defaultAmount`**: The `PaymentConfig` interface drops these fields. The old `subscribePaymentConfig` is replaced. Components that read `dueDay` (none directly — it was hardcoded as 10 in PaymentPanel and passed to `computePaymentCounts`) are updated to not reference it.

4. **Rollback plan** (from proposal item 85–91): Revert all file changes, restore `subscribePaymentsByPeriod`, restore old `PaymentConfig`, delete `CoverageCalendar.tsx`.

## Testing Considerations

| Layer | What to Test | Approach |
|-------|-------------|----------|
| Unit | `computeProgram` — exact single match, multiple match (prefer higher price), no match | Pure function, test with known amounts against two programs |
| Unit | `computeCoverage` — first payment (no existing), stacking (paid before end), gap (paid after end), multiple payments stacked | Pure function, mock existing payments array |
| Unit | `computeMembershipStatus` — active (current coverage), expired (all past), pending (zero payments), mixed (cancelled + active) | Pure function, test each state with crafted payment sets |
| Unit | CoverageCalendar day highlighting — single month range, multi-month range, month boundaries | Test the `highlightedDays` computation with known coverage intervals |
| Unit | `addMonths` helper — same month, year boundary (Dec→Jan), leap year | Pure date math, test edge cases |
| Integration | PaymentForm → computeCoverage → savePayment → Firestore read → UI update | Manual smoke test (no test runner configured) |
| Integration | PaymentPanel shows correct counts (active/expired/pending) with real data | Manual verification after seeding |
| Integration | FighterProfile shows payment history with coverage ranges | Manual verification after seeding |

**Note**: No test runner configured (`config.yaml testing.runner: null`). All three core utility functions (`computeProgram`, `computeCoverage`, `computeMembershipStatus`) are pure functions extracted specifically to be testable when a runner is added.

## File Changes Summary

| File | Action | Description |
|------|--------|-------------|
| `src/types/mma.ts` | Modify | Payment: +`coverageStart`, +`coverageEnd`, +`programId`, +`monthsPaid` (all optional). PaymentConfig: replace `dueDay`+`defaultAmount` with `programs: ProgramConfig[]`. Add `ProgramConfig` type. |
| `src/utils/payments.ts` | Modify | Add: `computeProgram`, `computeCoverage`, `computeMembershipStatus`, `addMonths`. Remove: `computePaymentStatus`, `computePaymentCounts`, `getCurrentPeriod`, `getPeriodRange`. Keep: `formatPeriod`, `generateReminder`, `copyToClipboard`. |
| `src/services/storage.ts` | Modify | Add: `subscribeAllPayments` (replaces both `subscribePayments` + `subscribePaymentsByPeriod`), `subscribeProgramsConfig` (replaces `subscribePaymentConfig`). Remove: `subscribePayments`, `subscribePaymentsByPeriod`, `subscribePaymentConfig`. Update `toPayment` to include new fields. |
| `src/components/PaymentForm.tsx` | Modify | Replace period dropdown with paidAt date picker. Add program auto-detection + preview. Add manual program picker when ambiguous. Remove duplicate check (by period). Add coverage preview. |
| `src/components/PaymentPanel.tsx` | Modify | Remove period selector. Switch to `subscribeAllPayments`. Show active/expired/pending status. Add calendar icon per row → CoverageCalendar popover. Add program + coverage range columns. |
| `src/components/Dashboard.tsx` | Modify | Switch payment widget from `subscribePaymentsByPeriod` to `subscribeAllPayments`. Show active/expired/pending counts. Remove period selector. |
| `src/components/FighterProfile.tsx` | Modify | Remove period selector in payment section. Subscribe to all payments. Show membership status as-of-today. Sort payments by `coverageStart` desc. |
| `src/components/CoverageCalendar.tsx` | **New** | Calendar popover. Month grid via native Date API + CSS Grid. Coverage range highlighting. Positioned via trigger DOMRect. Dark theme. Keyboard nav. |
| `src/utils/exportPaymentExcel.ts` | Modify | Replace `period` column with `coverageStart` + `coverageEnd`. Update title from period-based to date-range-based. Add program column. |
| `firestore.rules` | No change | Existing rules already cover `/payments/{doc}` and `/config/{doc}`. No new collections. |
