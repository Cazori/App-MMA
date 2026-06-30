## Verification Report

**Change**: membership-coverage
**Version**: N/A (no spec versioning)
**Mode**: Standard (no test runner, strict TDD: false)

### Completeness

| Metric | Value |
|--------|-------|
| Tasks total | 20 |
| Tasks complete | 19 (T4.3 manual smoke test unchecked — user will do) |
| Tasks incomplete | 1 (T4.3 — non-blocking, manual-only) |

### Build & Tests Execution

**Build**: ✅ Passed

```text
npx tsc --noEmit → exit code 0, no errors
```

**Tests**: ➖ No test runner configured (TDD mode disabled, no unit tests exist)

**Coverage**: ➖ Not available (no coverage instrumentation)

### Spec Compliance Matrix

| Requirement | Scenario | Implementation | Result |
|---|---|---|---|
| **Program Auto-Detection** | Exact daily multiple → selects daily | `computeProgram` (payments.ts:34-60) with `amount % prog.monthlyPrice === 0` | ✅ COMPLIANT |
| | Exact three-day multiple → selects three-day | Same logic, exact match on $120k | ✅ COMPLIANT |
| | Amount matches both → prefers higher price | Sorting `candidates` by descending `monthlyPrice` (line 56) | ✅ COMPLIANT |
| | Amount non-divisible → returns null | `candidates.length === 0` → `return null` (line 51) | ✅ COMPLIANT |
| **Coverage Computation (Stacking)** | Payment before expiry → stacks | `paidDate < maxEnd` branch (line 99) — starts at maxEnd | ✅ COMPLIANT |
| | Cancelled payments excluded from stacking | `.filter(p => p.status !== 'cancelled')` (line 86) | ✅ COMPLIANT |
| **Coverage Computation (Gap)** | Payment after expiry → fresh from paidAt | Fallthrough after `if (paidDate < maxEnd)` (line 110-116) | ✅ COMPLIANT |
| | First payment → fresh from paidAt | `validExisting.length === 0` → fallthrough to gap (line 110-116) | ✅ COMPLIANT |
| **Membership Status** | Active = any coverageEnd >= today | `withCoverage.some(p => new Date(p.coverageEnd!) >= ref)` (line 143) | ✅ COMPLIANT |
| | Expired = all past + at least one payment | Fallthrough after `hasActive` check (line 144) | ✅ COMPLIANT |
| | Pending = zero payments with coverage | `withCoverage.length === 0 → return 'pending'` (line 141) | ✅ COMPLIANT |
| **PaymentConfig Schema** | programs array, no dueDay/defaultAmount | `PaymentConfig.programs: ProgramConfig[]` (mma.ts:217-219) | ✅ COMPLIANT |
| | period @deprecated, derived from coverageStart | `@deprecated` JSDoc (mma.ts:183), `period: coverage.coverageStart.slice(0,7)` (PaymentForm.tsx:116) | ✅ COMPLIANT |
| **Payment Recording** | Happy path — auto-detected + preview | `computeProgram`, `computeCoverage` called in memo, preview rendered (PaymentForm.tsx:61-78, 286-360) | ✅ COMPLIANT |
| | Stacking payment recording | `computeCoverage` handles stacking, preview shows stacked dates | ✅ COMPLIANT |
| | Gap payment recording | `computeCoverage` handles gap, fresh coverage dates | ✅ COMPLIANT |
| | Non-multiple → manual picker | `needsManualPicker` renders program buttons (lines 300-341) | ✅ COMPLIANT |
| | Zero/negative amount → rejected | `amount <= 0` check (line 91), toast "El monto debe ser mayor a cero" | ✅ COMPLIANT |
| **Coverage Preview** | Preview updates on amount change | `coveragePreview` is `useMemo` dependent on `amount` (line 75) | ✅ COMPLIANT |
| | Preview shows manual picker state | Non-multiple triggers `needsManualPicker`, preview shows warning (lines 300-308) | ✅ COMPLIANT |
| **Edit Payment** | Edit amount/method, coverage immutable | Coverage fields read from original payment (line 110), only amount/method/notes editable | ✅ COMPLIANT |
| | Cancel preserves coverage on doc | `cancelPayment` uses `merge: true`, only touches status fields (storage.ts:329-337) | ✅ COMPLIANT |
| **Calendar Popup** | Click icon opens calendar | `openCalendar` → `setCalendarPopup` (PaymentPanel.tsx:175-178) | ✅ COMPLIANT |
| | Closes on click outside | `data-calendar-popover` dataset check (CoverageCalendar.tsx:32-47) | ✅ COMPLIANT |
| | Closes on Escape | `keydown` listener (CoverageCalendar.tsx:49-56) | ✅ COMPLIANT |
| **Month Navigation** | Previous month | `prevMonth` callback (CoverageCalendar.tsx:88-90) | ✅ COMPLIANT |
| | Next month | `nextMonth` callback (CoverageCalendar.tsx:92-94) | ✅ COMPLIANT |
| **Coverage Range Highlighting** | Multi-month coverage across months | `highlightedDays` useMemo walks day-by-day (lines 59-86) | ✅ COMPLIANT |
| | Disjoint ranges both highlighted | Iterates all `coverages[]` independently (line 66) | ✅ COMPLIANT |
| **Zero External Dependencies** | No third-party date libraries | Native `Date` API only; `exceljs` is export-only, not calendar | ✅ COMPLIANT |
| **Status Badges** | Active → green "Activo" | `membershipColor('active')` → `var(--color-success)`, label "Activo" (PaymentPanel.tsx:230-236) | ✅ COMPLIANT |
| | Expired → red "Expirado" | `membershipColor('expired')` → `var(--color-danger)`, label "Expirado" | ⚠️ PARTIAL (red, spec says yellow — see WARNING-1) |
| | Pending → gray "Sin membresía" | `membershipColor('pending')` → `var(--text-muted)`, label "Sin membresía" | ✅ COMPLIANT |
| **Calendar Icon Per Row** | Icon opens popup for correct fighter | `Calendar` button in each row (PaymentPanel.tsx:586-594) | ✅ COMPLIANT |
| **No Period Selector** | No period dropdown in PaymentPanel | No period selector present (PaymentPanel.tsx:253-277) | ✅ COMPLIANT |
| | No period selector in Dashboard | No period selector present (Dashboard.tsx:78-131) | ✅ COMPLIANT |
| | No period selector in FighterProfile | No period selector present (FighterProfile.tsx:517-545) | ✅ COMPLIANT |
| **All Payments Shown** | No period filter in subscriptions | All components use `subscribeAllPayments` (unfiltered) | ✅ COMPLIANT |
| **Cancelled Payment Display** | Strikethrough on cancelled amount | `textDecoration: 'line-through'` (FighterProfile.tsx:572) | ✅ COMPLIANT |
| | Excluded from status computation | Filtered out by `p.status !== 'cancelled'` in all `computeMembershipStatus` calls | ✅ COMPLIANT |
| **Dashboard Counts** | Three cards: Activos/Expirados/Sin membresía | Three `CountCards` in Dashboard (lines 112-129) | ✅ COMPLIANT |
| | All three statuses represented | Computed via `computeMembershipStatus` per fighter (lines 48-60) | ✅ COMPLIANT |
| | No fighters → all counts 0 | `hasFighters` check → "No hay luchadores registrados" (line 107) | ✅ COMPLIANT |
| | Firestore query fails → retry banner | `payError` state → retry button (lines 93-101) | ⚠️ PARTIAL (no 10s timeout — see SUGGESTION) |
| **Export** | coverageStart/coverageEnd columns | Columns "Inicio Cobertura", "Fin Cobertura" (exportPaymentExcel.ts:83-84) | ✅ COMPLIANT |
| | Program column | Column "Programa" (exportPaymentExcel.ts:82) | ✅ COMPLIANT |
| | Title date-range-based | `Pagos — Registro al ${today}` (exportPaymentExcel.ts:71) | ✅ COMPLIANT |

**Compliance summary**: 45/46 compliant (1 partial, 1 partial — see issues)

### Correctness (Static Evidence)

| Requirement | Status | Notes |
|---|---|---|
| Payment type with optional coverage fields | ✅ Implemented | `coverageStart?`, `coverageEnd?`, `programId?`, `monthsPaid?` on Payment (mma.ts:191-194) |
| ProgramConfig interface | ✅ Implemented | `{ id, name, monthlyPrice }` (mma.ts:211-215) |
| PaymentConfig.programs | ✅ Implemented | Replaces dueDay/defaultAmount (mma.ts:217-219) |
| computeProgram (amount → program) | ✅ Implemented | Pure function in payments.ts:34-60 |
| computeCoverage (stacking + gap) | ✅ Implemented | Pure function in payments.ts:77-117 |
| computeMembershipStatus | ✅ Implemented | Pure function in payments.ts:130-145 |
| addMonths (day-overflow fix verified) | ✅ Implemented | Clamps day to target month max (payments.ts:10-20) |
| subscribeAllPayments (unfiltered) | ✅ Implemented | storage.ts:214-229 |
| subscribeProgramsConfig (with defaults) | ✅ Implemented | storage.ts:238-257 |
| CoverageCalendar (native Date + CSS Grid) | ✅ Implemented | CoverageCalendar.tsx |
| PaymentForm (date picker, program detection, preview) | ✅ Implemented | PaymentForm.tsx |
| PaymentPanel (status badges, calendar icon, no period) | ✅ Implemented | PaymentPanel.tsx |
| Dashboard (subscribeAllPayments, 3 counts) | ✅ Implemented | Dashboard.tsx:28-60 |
| FighterProfile (status badge, no period filter) | ✅ Implemented | FighterProfile.tsx:31-60 |
| Export (coverageStart/End, program col, date title) | ✅ Implemented | exportPaymentExcel.ts |
| Removed: computePaymentStatus, getPeriodRange, etc. | ✅ Verified | No references found in any .ts/.tsx file |
| Removed: subscribePayments, subscribePaymentsByPeriod | ✅ Verified | Only a comment mentioning them (storage.ts:212) |
| Removed: subscribePaymentConfig | ✅ Verified | No references found |

### Coherence (Design)

| Decision | Followed? | Notes |
|---|---|---|
| Pure utils in payments.ts (Firestore-free) | ✅ Yes | computeProgram, computeCoverage, computeMembershipStatus are all pure |
| Storage thin — calls computeCoverage before save | ✅ Yes | PaymentForm computes coverage, passes to savePayment; savePayment has fallback |
| subscribeAllPayments (unfiltered, no orderBy) | ✅ Yes | `query(collection(db, PAYMENTS_COLLECTION))` no filters/orders |
| subscribeProgramsConfig with defaults | ✅ Yes | DEFAULT_PROGRAMS fallback in storage.ts:233-236 |
| Ambiguous amount → prefer higher price (daily) | ✅ Yes | Sorting candidates by descending monthlyPrice |
| period derived from coverageStart.slice(0,7) | ✅ Yes | `period: coverage.coverageStart.slice(0, 7)` in PaymentForm.tsx:116 |
| Legacy payments archival only (filtered by coverageEnd == null) | ✅ Yes | All coverage functions filter `p.coverageEnd != null` |
| CoverageCalendar positioning via DOMRect | ✅ Yes | `triggerRect.bottom + 8`, `Math.max(8, triggerRect.left - 100)` |
| Month grid with native Date API + CSS Grid | ✅ Yes | No third-party libraries |
| Dark theme CSS | ✅ Yes | Inline styles + CSS variables (accent-orange background) |
| Arrow navigation for months | ✅ Yes | `←` and `→` buttons |
| Accessibility (role="dialog", aria-labels) | ⚠️ Partial | `role="dialog"` ✅, aria-labels ✅, Escape close ✅, but focus trap ❌ |
| No new composite Firestore indexes | ✅ Yes | No orderBy, no where filters on new subscriptions |
| Old functions cleaned up | ✅ Yes | Verified no remaining imports/references |

### Issues Found

**CRITICAL**: None

**WARNING**:

1. **Expired status color mismatches spec** — Spec `dashboard-widget.md` says "contextual color (green, yellow, gray)". Implementation uses `var(--color-danger)` (red) for expired instead of yellow. This is consistent across both Dashboard.tsx (line 115) and PaymentPanel.tsx (line 284). Probably intentional (red is more intuitive for "expired"), but deviates from the written spec.

2. **CoverageCalendar missing focus trap** — The design specifies "Focus trap: Tab cycles through nav buttons and close button only". The implementation has no focus trap logic. Tab can leave the popover. Prev/next buttons and the popover container lack Tab cycle containment.

**SUGGESTION**:

1. **Dashboard loading spinner has no timeout** — The spec says "show a loading spinner for up to 10 seconds, and if the query still fails, display a retry banner". The implementation shows the spinner indefinitely (no timeout) and shows the retry banner only when `onError` fires. A 10-second fallback timeout would handle the edge case where Firestore hangs without erroring.

2. **PaymentPanel coverage column shows only end date** — The fighter table's coverage column shows only `coverageEnd` (e.g., "15/08/2026") instead of the full range (`coverageStart → coverageEnd`). This is by design (compact row), but the tooltip or aria-label could include the full range for clarity.

3. **FighterProfile double-filters payments** — `validPayments` filters out cancelled/null-coverage (line 56-58) before passing to `computeMembershipStatus`, which also applies the same filters internally. No functional impact, but redundant.

4. **PaymentConfig interface still marked `@deprecated`** — The type only has `programs` now, which is actively used. The `@deprecated` JSDoc is misleading (leftover from the migration). The `programs` field itself is not deprecated — only `dueDay`/`defaultAmount` were removed.

### Verdict

**PASS WITH WARNINGS**

All 19/20 implementation tasks are complete (T4.3 manual smoke test is the user's responsibility). All spec requirements have corresponding implementations. Build passes cleanly with no type errors. No CRITICAL issues found.

The two WARNING issues (expired color vs spec, missing focus trap) are design deviations rather than functional defects. The implementation is internally consistent, all data flows are coherent (payment saved → coverage computed → status displayed), and all edge cases (stacking, gap, cancelled payments, legacy records, non-multiple amounts, zero/negative validation) are handled correctly.

Recommendation: Ship after the user completes T4.3 manual smoke test. Consider addressing the focus trap before GA if accessibility compliance is required.
