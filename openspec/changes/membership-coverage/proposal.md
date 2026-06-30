# Proposal: Membership Coverage (Rolling Model)

## Intent

Replace period-based fixed-fee payments (pay-per-calendar-month with due date) with a rolling membership model. Each payment buys N months of a program (daily $160k/mo or 3-day/week $120k/mo) with explicit coverage dates. Admins record payments, the system auto-computes coverage stacking, and status reflects real-time coverage state — not calendar-period adherence.

## Scope

### In Scope
- Rolling coverage engine: stacking (pay before expiry extends coverage) / gap detection (pay after expiry starts fresh from paidAt)
- Two programs: "Todos los días" $160k/mo, "3 días a la semana" $120k/mo
- Amount-based auto-detection: exact multiple → auto-select; ambiguous (same multiple for both) → prefer higher-value; non-multiple → admin picks manually
- Payment form: date picker for paidAt (admin-chosen), amount input with program preview, coverage preview (start → end)
- Payment list: per-fighter status as-of-today (active/expired/pending), calendar icon per row → CoverageCalendar popup
- Dashboard widget: active/expired/pending counts, no period selector
- FighterProfile: coverage status as-of-today, no period selector in payment section
- `dueDay` removal from schema entirely
- CoverageCalendar component: native Date API + CSS Grid, dark theme, month nav, zero new deps

### Out of Scope
- Migration of old `period`-based payments (user confirmed: start from scratch, no migration needed)
- Payment gateway / automatic subscriptions / recurring billing
- Partial-month or custom-duration programs (always full months)
- Receipt printing, PDF generation, push notifications
- RBAC separation (treasurer role)
- Email / SMS notifications

## Capabilities

### New Capabilities
- `membership-coverage`: Rolling membership engine — coverageStart/End computation, stacking logic, gap detection, program auto-detection from amount, as-of-today status
- `coverage-calendar`: Calendar popup showing coverage date ranges per fighter via native Date API + CSS Grid

### Modified Capabilities
- `payment-recording`: Updated Payment type (coverageStart/End, programId, monthsPaid). Form uses paidAt date picker, no period field, amount→program detection.
- `payment-dashboard`: Widget shows active/expired/pending counts. No period selector. Requires spec delta.
- `payment-reminders`: Reminder text must reference coverage end date instead of fixed due date. Minor template change.

## Approach

**Coverage engine** (`computeCoverage` in `payments.ts`): Function receives fighter's non-cancelled payments + amount + paidAt. It finds current max coverageEnd across existing payments. If paidAt < coverageEnd → stacking: `coverageStart = coverageEnd`, `coverageEnd = addMonths(coverageStart, monthsPaid)`. If paidAt ≥ coverageEnd → gap: `coverageStart = paidAt`, `coverageEnd = addMonths(paidAt, monthsPaid)`. `monthsPaid = amount / programPrice` (must be integer).

**Program detection** (`computeProgram` in `payments.ts`): For each program, check if `amount % programPrice === 0`. If exactly one matches → auto-select. If multiple match → pick highest monthly price (more expensive = higher daily value). If none match → return null, UI shows manual program picker with remaining amounts.

**Status** (`computeMembershipStatus`): `active` = any non-cancelled payment where `coverageEnd >= today`. `expired` = all coverageEnd < today. `pending` = zero payments.

**Data model**: `Payment` adds `coverageStart: string`, `coverageEnd: string`, `programId: 'daily' | 'three-day'`, `monthsPaid: number`. `period` kept as `@deprecated` derived from `coverageStart.slice(0,7)` for backward compat. `PaymentConfig` replaces `dueDay + defaultAmount` with `programs: [{ id, name, monthlyPrice }]`.

**Calendar**: `CoverageCalendar` — popover triggered by calendar icon per fighter row in PaymentPanel. Month grid: 7 columns (weekday headers), 6 rows. Highlights every day ∈ any `[coverageStart, coverageEnd]` range. Opens on current month. Free navigation ← →.

**Subscription**: Switch from `subscribePaymentsByPeriod(period)` to `subscribePayments()` (all payments unfiltered). For <100 fighters and <2000 payments, Firestore reads are negligible. Add `subscribeProgramsConfig()` for Firestore config doc.

## User Stories

1. **Single payment, auto-detect**: Admin records $160k for fighter A → system auto-detects "daily" program, 1 month. Coverage: today → +1 month (e.g., Jun 28 → Jul 28). Status shows "active".
2. **Stacking**: Fighter B has coverage until Aug 15. Admin records $320k on Aug 10 → auto-detects 2 months daily. Stacks: coverageStart = Aug 15, coverageEnd = Oct 15. Status "active" throughout.
3. **Expired + fresh**: Fighter C coverage ended Jun 1. Today is Jul 20 → status "expired". Admin records $120k → 1 month three-day. Fresh coverage: Jul 20 → Aug 20. Status → "active".
4. **Non-multiple amount**: Admin enters $370k (not divisible by $160k or $120k) → system shows manual picker: "Daily = 2 months ($320k, $50k extra)" or "Three-day = 3 months ($360k, $10k extra)". Admin picks manually.
5. **Calendar popup**: Admin clicks calendar icon next to fighter D → popup opens on June 2026 (current month). Gray cells with highlighted ranges show all coverage intervals (Jun 15–Jul 15). Admin clicks ← to see May, → to see July. Clicks outside to close.

## Affected Areas

| File | Impact | Description |
|------|--------|-------------|
| `src/types/mma.ts` | Modified | Payment: +`coverageStart`, +`coverageEnd`, +`programId`, +`monthsPaid`. PaymentConfig: +`programs[]`, -`dueDay`, -`defaultAmount` |
| `src/utils/payments.ts` | Modified | New: `computeCoverage`, `computeProgram`, `computeMembershipStatus`. Remove: all period-dependent helpers. Keep: `formatPeriod` for display. |
| `src/services/storage.ts` | Modified | `savePayment`: add coverage stacking logic. `subscribePayments` becomes primary. Remove `subscribePaymentsByPeriod`. Add `subscribeProgramsConfig`. |
| `src/components/PaymentForm.tsx` | Modified | Replace period dropdown with date picker (paidAt). Add amount → program auto-detect. Show coverage preview. Remove duplicate check by period. |
| `src/components/PaymentPanel.tsx` | Modified | Remove period selector. Show coverage status (active/expired). Calendar icon per row → CoverageCalendar popover. New columns: program, coverage range. |
| `src/components/Dashboard.tsx` | Modified | Payment widget no longer period-scoped. Counts: active/expired/pending. Subscribe all payments. |
| `src/components/FighterProfile.tsx` | Modified | Remove period selector in payment section. Show coverage status as-of-today. Payment history sorted by coverageStart. |
| `src/components/CoverageCalendar.tsx` | **New** | Calendar popover. Scrollable month grid. Highlights coverage ranges. Zero deps — native Date API + CSS Grid |
| `src/utils/exportPaymentExcel.ts` | Modified | coverageStart + coverageEnd columns replace period. Title from period → date range. |

## Risks

| Risk | Likelihood | Mitigation |
|------|------------|------------|
| Stacking edge cases (overlapping, partial months) | Medium | Clear rules: only exact multiples. `monthsPaid = amount / price` must be integer. No partial coverage. |
| Old period data mixed with new coverage data | Low | No migration needed. Old payments keep `period`. New code reads coverage fields. `period` derived from `coverageStart` for new writes. |
| Admin confusion in transition | Medium | UI explicitly shows "Cobertura: date → date". Old period selector gone. No ambiguity about what month a payment covers. |
| Firestore read increase (subscribe all payments) | Low | <100 fighters, <2000 docs — negligible. Monitor only if issues arise. |

## Rollback Plan

1. Revert all files: `mma.ts` types, `payments.ts`, `storage.ts`, all modified components
2. Restore `subscribePaymentsByPeriod` as primary subscription in Dashboard/Panel/Profile
3. Restore `PaymentConfig` with `dueDay` + `defaultAmount`
4. Delete `CoverageCalendar.tsx` (new file)
5. Move `openspec/changes/membership-coverage/` to `archive/2026-06-28-membership-coverage/`
6. Old period-based payments in Firestore remain untouched — zero data loss

## Dependencies

None. No new npm packages. CoverageCalendar uses native Date API (`Date`, `getMonth`, `getDate`, `getDay`, etc.) + CSS Grid. All `lucide-react` icons (Calendar, DollarSign) already installed.

## Success Criteria

- [ ] `savePayment` correctly stacks coverage when paid within existing coverageEnd
- [ ] `savePayment` correctly starts fresh coverage when paid after coverageEnd
- [ ] `computeProgram` auto-detects daily for $160k, three-day for $120k, daily when both match ($480k), null for non-multiples
- [ ] PaymentPanel shows per-fighter status: active/expired/pending — no period dropdown
- [ ] CoverageCalendar renders correct month grid with highlighted coverage days, opens on current month, navigable
- [ ] Dashboard widget shows active/expired/pending counts without period selector
- [ ] `dueDay` removed from `PaymentConfig`; `programs[]` used instead
- [ ] `period` field remains readable in existing payments, derived from `coverageStart` in new payments
