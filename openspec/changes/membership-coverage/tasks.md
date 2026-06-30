# Tasks: Membership Coverage

## Review Workload Forecast

| Metric | Value |
|--------|-------|
| Estimated changed lines | 850–950 |
| Review budget (config) | 800 lines |
| 400-line budget risk | Medium |
| Chained PRs recommended | No (single PR within 800-line budget) |
| Delivery strategy | single-pr-default |
| Decision needed before apply | No |
| Chain strategy | pending |

Decision needed before apply: No
Chained PRs recommended: No
Chain strategy: pending
400-line budget risk: Medium

Single PR covering all phases. Estimated ~900 changed lines is within the 800-line budget with acceptable overshoot risk.

## Phase 1: Foundation — Types & Logic

- [x] **T1.1** (data/S) Add `coverageStart?`, `coverageEnd?`, `programId?`, `monthsPaid?` to `Payment`. Deprecate `period` inline. — `src/types/mma.ts`
- [x] **T1.2** (data/S) Add `ProgramConfig` interface. Replace `PaymentConfig`: `programs: ProgramConfig[]` instead of `dueDay`/`defaultAmount`. — `src/types/mma.ts`
- [x] **T1.3** (logic/M) Write `computeProgram(amount, programs)` — auto-detect from exact multiples, prefer higher price on ambiguity, return null for non-multiples. — `src/utils/payments.ts`
- [x] **T1.4** (logic/M) Write `computeCoverage(existingPayments, programId, monthsPaid, paidAt)` — stacking if paid before max coverageEnd, gap if after. — `src/utils/payments.ts`
- [x] **T1.5** (logic/S) Write `computeMembershipStatus(fighterPayments, referenceDate?)` — `active`/`expired`/`pending`. — `src/utils/payments.ts`
- [x] **T1.6** (logic/S) Write `addMonths(date, n)` helper — handles year boundary, leap year. — `src/utils/payments.ts`
- [x] **T1.7** (logic/S) Remove `computePaymentStatus`, `computePaymentCounts`, `getCurrentPeriod`, `getPeriodRange`. Keep `formatPeriod`, `generateReminder`, `copyToClipboard`. — `src/utils/payments.ts`

## Phase 2: Storage Layer

- [x] **T2.1** (storage/M) Add `subscribeAllPayments()` — unfiltered, no `orderBy`, returns all payments. — `src/services/storage.ts`
- [x] **T2.2** (storage/M) Add `subscribeProgramsConfig()` — reads `programs[]` from `/config/payments`, falls back to defaults. — `src/services/storage.ts`
- [x] **T2.3** (storage/S) Update `toPayment()` mapper — include `coverageStart`, `coverageEnd`, `programId`, `monthsPaid`. — `src/services/storage.ts`
- [x] **T2.4** (storage/S) Remove `subscribePayments`, `subscribePaymentsByPeriod`, `subscribePaymentConfig`. Update `savePaymentConfig` if needed. — `src/services/storage.ts`

## Phase 3: Core UI Components

- [x] **T3.1** (ui/L) Build `CoverageCalendar.tsx` — month grid (native Date + CSS Grid), coverage highlighting, popover positioning, keyboard nav, dark theme. — new file
- [x] **T3.2** (ui/L) Rewrite `PaymentForm.tsx` — paidAt date picker replaces period dropdown, amount→program detection, coverage preview, manual picker for non-multiples. — `src/components/PaymentForm.tsx`
- [x] **T3.3** (ui/L) Rewrite `PaymentPanel.tsx` — remove period selector, use `subscribeAllPayments`, status badges per fighter, calendar icon per row, program/coverage columns. — `src/components/PaymentPanel.tsx`
- [x] **T3.4** (ui/M) Update `Dashboard.tsx` — switch to `subscribeAllPayments`, active/expired/pending counts, remove period selector and `payPeriod` state. — `src/components/Dashboard.tsx`
- [x] **T3.5** (ui/M) Update `FighterProfile.tsx` — remove period selector, use `subscribeAllPayments`, show coverage status badge. — `src/components/FighterProfile.tsx`
- [x] **T3.6** (ui/S) Update `exportPaymentExcel.ts` — replace period column with `coverageStart`/`coverageEnd`, add program column, update title from period to date range. — `src/utils/exportPaymentExcel.ts`

## Phase 4: Integration & Verification

- [x] **T4.1** (integration/M) Wire storage subscriptions to all components — verify `subscribeAllPayments` + `subscribeProgramsConfig` propagate correctly through component tree.
- [x] **T4.2** (integration/S) Edge case handling — zero/negative amount validation, non-multiple UI, cancelled payment display (strikethrough), legacy period-only payments in history.
- [ ] **T4.3** (integration/M) Manual smoke test — happy path recording, stacking, gap detection, calendar popup, all membership statuses, export with new columns.
