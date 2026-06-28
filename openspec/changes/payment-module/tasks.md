# Tasks: Payment Module

## Review Workload Forecast

| Field | Value |
|-------|-------|
| Estimated changed lines | ~840 (7 modified + 3 new files) |
| 400-line budget risk | High |
| Chained PRs recommended | Yes |
| Suggested split | PR 1 (Foundation) → PR 2 (Core UI) → PR 3 (Features) |
| Delivery strategy | ask-always |
| Chain strategy | pending (user to decide) |

Decision needed before apply: Yes
Chained PRs recommended: Yes
Chain strategy: pending
400-line budget risk: High

### Suggested Work Units

| Unit | Goal | Likely PR | Notes |
|------|------|-----------|-------|
| 1 | Types + Storage + Rules | PR 1 | Foundation, no UI, ~175 lines |
| 2 | PaymentForm + Panel + Route | PR 2 | Core CRUD UI, ~250 lines |
| 3 | Dashboard + FighterProfile + Export + Overdue + Reminders | PR 3 | Features, ~250 lines |

## Phase 1: Foundation

- [x] 1.1 Add `Payment`, `PaymentMethod`, `PaymentStatus`, `FollowUp`, `PaymentEdit` types to `src/types/mma.ts`
- [x] 1.2 Add `subscribePayments`, `savePayment`, `cancelPayment`, `updatePayment`, `saveFollowUp` to `src/services/storage.ts`
- [x] 1.3 Add `/payments` collection rules to `firestore.rules` (admin write, auth read)
- [x] 1.4 Extract `computePaymentStatus()` pure function into `src/utils/payments.ts`

## Phase 2: Core UI

- [x] 2.1 Create `PaymentForm.tsx` modal with useFocusTrap, fighter/period/amount/method/notes fields
- [x] 2.2 Add duplicate payment guard + zero/negative validation on submit
- [x] 2.3 Add edit mode: populate form from existing payment, push history entry on save
- [x] 2.4 Add cancel flow: Confirm dialog → set cancelledAt/cancelledBy, disable editing
- [x] 2.5 Create `PaymentPanel.tsx` with period selector, data grid, inline CRUD actions
- [x] 2.6 Add lazy route for `'pagos'` in `App.tsx` + nav link in `Topbar.tsx`

## Phase 3: Features

- [x] 3.1 Add payment summary widget to `Dashboard.tsx` with 4 count cards and period selector
- [x] 3.2 Add overdue fighter list subview: sort by enrollment, contact actions, follow-up toggle
- [x] 3.3 Add follow-up CRUD and status filter (all/pending-contact/contacted)
- [x] 3.4 Add payment history tab + status badge to `FighterProfile.tsx`
- [x] 3.5 Create `exportPaymentExcel.ts` with exceljs lazy import, period-scoped export, formatted columns

## Phase 4: Reminders & Polish

- [x] 4.1 Extract `generateReminder()` pure function with template + clipboard writeText
- [x] 4.2 Add bulk selection UI + individual copy cards for multiple reminders
- [x] 4.3 Add clipboard API fallback for insecure context (select text + Ctrl+C prompt)
- [ ] 4.4 Smoke-test all flows: record, edit, cancel, dashboard counts, export, reminder copy
