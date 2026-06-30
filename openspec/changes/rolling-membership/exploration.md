# Exploration: Rolling Membership (replacing period-based payments)

## Current State

The app tracks payments by **calendar period** (YYYY-MM format). Each `Payment` has a `period` field like `"2026-06"`. Status is derived:

- `computePaymentStatus(fighter, payments, period, dueDay)` checks if a non-cancelled payment exists for `fighterId + period`
- `computePaymentCounts(fighters, payments, period, dueDay)` calls `computePaymentStatus` per fighter
- `subscribePaymentsByPeriod(period)` makes a Firestore `where('period', '==', period)` query
- `PaymentPanel` has a period selector dropdown at the top, subscribes to payments matching that period
- `Dashboard` has a payment widget with its own period selector + same subscription pattern
- `FighterProfile` has a period selector + status badge per selected period
- `PaymentForm` has a Period dropdown that defaults to `getCurrentPeriod()`

### Data flow (existing)
```
User picks period → Firestore onSnapshot(where period == X)
    → computePaymentStatus per fighter (period filter)
        → render paid/pending/overdue/cancelled per fighter per period
```

### Key files
- **`src/types/mma.ts`** — `Payment { period: string }`, `PaymentStatus: 'paid' | 'cancelled'`
- **`src/utils/payments.ts`** — `computePaymentStatus`, `computePaymentCounts`, `getCurrentPeriod`, `getPeriodRange`, `formatPeriod`, `generateReminder`
- **`src/services/storage.ts`** — `savePayment`, `subscribePaymentsByPeriod`, `subscribePayments` (unfiltered)
- **`src/components/PaymentPanel.tsx`** — Period selector → subscribe → render table
- **`src/components/PaymentForm.tsx`** — Period dropdown, duplicate check by fighterId+period
- **`src/components/Dashboard.tsx`** — Payment counts widget with period selector
- **`src/components/FighterProfile.tsx`** — Payment status badge + history with period filter
- **`src/utils/exportPaymentExcel.ts`** — Period label in export columns
- **`openspec/changes/payment-module/`** — Existing design, spec, tasks (completed, apply_done)

---

## Affected Areas

All files below currently depend on the `period` field:

### `src/types/mma.ts` — Payment type
- `period: string` → replace with `coverageStart: string` (ISO date) + `coverageEnd: string` (ISO date)
- May keep `period` temporarily as deprecated for backward compatibility during migration
- `PaymentStatus` type itself stays the same, but derived status logic changes entirely

### `src/utils/payments.ts` — Utility functions (HIGH impact)
- `computePaymentStatus(fighter, payments, period, dueDay)` → new signature `computePaymentStatus(fighter, payments, referenceDate?: string)` that checks `coverageEnd >= referenceDate` (defaults to today)
- `computePaymentCounts` → same change, no longer period-scoped
- `getCurrentPeriod` → can stay for UI convenience but no longer drives status logic
- `getPeriodRange` → may be replaced or kept for backward compat UI elements
- `formatPeriod` → can still format YYYY-MM for display
- `generateReminder` → needs coverage dates instead of period string

### `src/services/storage.ts` — Firestore layer (HIGH impact)
- `subscribePaymentsByPeriod(period)` — This function must change. Options:
  - Remove it entirely and subscribe to ALL payments (already exists: `subscribePayments`)
  - Or refactor to query by `coverageEnd >= someDate` range
- `savePayment(payment)` — Must compute `coverageStart`/`coverageEnd` based on:
  1. Look up fighter's existing payments, find max `coverageEnd`
  2. If `paidAt < maxCoverageEnd` → stacking: `coverageStart = maxCoverageEnd, coverageEnd = addMonth(maxCoverageEnd)`
  3. Else (new or gap): `coverageStart = paidAt, coverageEnd = addMonth(paidAt)`
- `subscribePayments` (unfiltered) — Becomes the primary subscription; was previously unused in payment panels

### `src/components/PaymentPanel.tsx` — Main payment UI (MEDIUM impact)
- Period selector at top → needs rethinking. Options:
  - **Date-based** "As of" selector (date picker) showing coverage status on that date
  - **Rolling** view showing "currently active" / "expiring within N days"
  - **Summary** view without period selection, just lists all fighters with current status
- `subscribePaymentsByPeriod(period)` → switch to `subscribePayments` (subscribe all)
- Status computation uses `computePaymentStatus(fighter, payments, period)` → new signature
- Need to add: calendar icon per row + coverage popup

### `src/components/PaymentForm.tsx` — Payment form (HIGH impact)
- Period dropdown → **remove entirely**. Replace with:
  - Date input for "coverage start" (pre-filled with today or previous coverageEnd)
  - Auto-computed "coverage end" (coverage start + 1 month) displayed as read-only info
  - For admin recording "last payment date": a date input where they enter when the payment was effectively made
- Duplicate check: change from fighterId+period to checking if `paidAt` falls within an existing coverage range
- Show current coverage info: "Este luchador tiene cobertura hasta el [date]"

### `src/components/Dashboard.tsx` — Dashboard widget (MEDIUM impact)
- Period selector in payment widget → change to "as of" date or remove
- `subscribePaymentsByPeriod(payPeriod)` → switch to `subscribePayments`
- `computePaymentCounts` → new signature
- Count cards: "Pagados" → "Activos", "Pendientes" → "Por vencer", "Vencidos" → needs new semantic

### `src/components/FighterProfile.tsx` — Per-fighter payment section (MEDIUM impact)
- Uses `subscribePaymentsByPeriod(payPeriod)` → switch to `subscribePayments`
- `computePaymentStatus(fighter, payments, payPeriod, 10)` → new signature
- Status badge shows status for selected period → now shows coverage status as of today (or selected date)
- Payment history sorted by period → sort by coverageStart/paidAt instead
- `formatPeriod(p.period)` → show date range or coverage dates

### `src/utils/exportPaymentExcel.ts` — Excel export (LOW impact)
- Period column → change to coverageStart + coverageEnd columns
- Title "Pagos — {period}" → "Pagos — {date range}"

### `firestore.rules` — Firestore security (LOW impact)
- May need composite index for `coverageEnd` + `fighterId` queries if we query by range

---

## Calendar Component

### Requirement
Each fighter row in the payment list needs a calendar icon → onClick opens a popup showing a month grid with highlighted "covered" days (all days from coverageStart to coverageEnd for each payment).

### Approaches

| Approach | Pros | Cons | Effort |
|----------|------|------|--------|
| **A: Custom component** (no library) | Zero new deps, full control, reuses `lucide-react` Calendar icon (already installed). Simple 7×6 grid with native Date API | Month navigation state, positioning logic, accessibility extras | Medium |
| **B: `react-calendar`** | Battle-tested grid, keyboard nav, accessible, month/year picker built-in | Adds ~15KB dependency, styling override needed, still need popover logic | Low |
| **C: `date-fns` for grid + custom rendering** | Date math utilities (startOfMonth, eachDayOfInterval, etc.) | Adds ~20KB dep, still need to build grid + popover | Low-Med |

### Recommendation: Option A — Custom component with zero new dependencies

`lucide-react` `Calendar` icon is already available. Build a lightweight `CoverageCalendar` component:

```
CoverageCalendar
├── Props: coverageRanges: {start: string, end: string}[], initialMonth?: Date
├── Renders:
│   ├── Month/year header with ← → navigation
│   ├── 7-column grid (Mon-Sun headers)
│   ├── Each day cell:
│   │   ├── Default: dim style
│   │   └── If day ∈ any coverage range: highlighted (colored bg)
│   └── Legend: "■ Cubierto"
└── Overlay: CSS fixed popover positioned near the trigger icon
```

The component is simple enough that a library adds more overhead than value. The grid logic:
1. First day of month → day of week
2. Total days in month
3. For each day, check if ISO date string falls within any `[coverageStart, coverageEnd]` interval

---

## Risks and Complexity

### Overall Complexity: **Medium-High**

### Risks

| Risk | Severity | Mitigation |
|------|----------|------------|
| **Data migration**: Existing payments in Firestore have `period` but no `coverageStart`/`coverageEnd` | Medium | Write a one-time migration script that reads all payments, computes `coverageStart = paidAt.slice(0,10)`, `coverageEnd = addMonth(paidAt)`. Keep `period` as deprecated field. |
| **Subscription cost**: Moving from period-filtered to ALL payments subscription increases reads | Low-Med | For <100 fighters and <1000 payments over time, this is negligible. Monitor Firestore usage. Add pagination if needed later. |
| **Stacking edge cases**: Overlapping payments, partial months, variable membership durations | Medium | Define clear rules: (1) each payment = 1 month from start date, (2) stacking only applies if `paidAt` falls within existing coverage, (3) gaps reset the coverage start to `paidAt` |
| **"Overdue" semantics change**: No fixed due date per month | Medium | "Overdue" in rolling model = coverage has ended and no new payment extends it. Show "Expired on [date]" instead of "Overdue for [period]" |
| **Admin confusion**: Admins used to "pay for June" mental model | Medium | Keep "Período" as a display label alongside coverage dates. Show both in table for transition period. |
| **Firestore index**: Querying by `coverageEnd` may require composite index | Low | Add composite index `fighterId + coverageEnd` if needed for subscription queries |
| **`dueDay` concept obsolete**: `PaymentConfig.dueDay` (default 10th) no longer meaningful | Low | Keep in config doc but mark deprecated. Can still be useful as "grace period" days after coverage end. |

### Key Questions

1. **Membership duration**: Is it always exactly 1 month? Or could it vary (different plans, partial months for late joiners)? The requirements say "1 month of coverage" but this should be confirmed.
2. **Gap handling**: When a fighter returns after a gap, `coverageStart = paidAt`. But what if they pay mid-month? July 15 → coverage until August 15? Or until end of August? The requirement says July 15 → August 15 (calendar month).
3. **Multiple payments per month**: If a fighter pays twice in one month, does the second payment extend coverage by another month? The stacking model says yes.
4. **Partial payments**: Does a partial amount give partial coverage? Or is the amount fixed per month?
5. **Back-payment for past months**: If a fighter pays for June in August, what happens? Coverage starts retroactively?

### Period: Remove vs Keep Alongside

**Recommendation: KEEP period as a deprecated field during migration, then remove.**

| Strategy | Tradeoff |
|----------|----------|
| **Remove completely** | Breaks all existing data. Must migrate every payment doc. Simpler code in the long run. |
| **Keep alongside** | `period` derived from `coverageStart` on write. Old subscriptions still work. Safer transition. Cleaner to remove in a follow-up. |
| **Keep permanently** | Maintenance debt. Two fields that can drift. Not recommended. |

**Decision**: Add `coverageStart` + `coverageEnd`, keep `period` set to `coverageStart.slice(0,7)` as a computed convenience field for backward compat. Remove `period` references from the UI entirely. After migration is verified, mark `period` as `@deprecated` and remove in a future change.

---

## Ready for Proposal
**Yes**. All files are identified, the approach is clear, and the key design decisions are mapped. The primary unknowns are membership duration flexibility (always exactly 1 month?) and the `dueDay` config field's role in the new model.
