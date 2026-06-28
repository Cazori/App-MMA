# Design: Payment Module

## Technical Approach

New Firestore collection `/payments` with lazy-loaded route + dashboard widget + per-fighter section. Overdue detection computed client-side by cross-referencing fighters vs payments for a period. WhatsApp reminders via clipboard API (no automated sending). Excel export reusing existing `exceljs` dependency. All mutations use the existing context pattern (`useToast`, `useConfirm`, `useAuth`).

## Architecture Decisions

### Decision: Overdue Detection Strategy

| Option | Tradeoff | Decision |
|--------|----------|----------|
| **Client-side** (fetch payments + fighters, diff in memory) | Simple, no backend; works offline for current data | **Chosen** — fighters <100, payments <1000, fine for MVP |
| Cloud Function on schedule | Adds deployment + cost, overkill for manual tracking | Rejected |
| Firestore `where not exists` query | Impossible in Firestore — can't query non-existence | Rejected |

### Decision: Payment Status Model

| Option | Tradeoff | Decision |
|--------|----------|----------|
| **Derived status** (paid / cancelled from payment doc; pending / overdue inferred) | No status field to sync, simpler writes; computation on every read | **Chosen** — fewer writes, status always consistent |
| Stored status (pre-computed `overdue` flag per fighter+period) | Must sync on date changes; stale risk | Rejected |

### Decision: History Storage

| Option | Tradeoff | Decision |
|--------|----------|----------|
| **Array field `history[]` on payment doc** | ≤20 entries per payment, atomic writes, no extra reads | **Chosen** — matches `metricSnapshots` pattern in codebase |
| Subcollection `/payments/{id}/history` | Complex queries, more reads for full object | Rejected |

### Decision: Follow-up Storage

| Option | Tradeoff | Decision |
|--------|----------|----------|
| **Subcollection `/payments/{id}/followUp`** | Isolated writes, no merge conflicts on payment doc | **Chosen** — follow-up is optional, shouldn't bloat payment doc |
| Embedded field on payment doc | Every payment read carries follow-up data | Rejected |

## Data Flow

```
PaymentPanel ──→ storage (write payment)
     │
     ├──→ Dashboard widget (real-time via onSnapshot)
     │       ├──→ payments query (period filter)
     │       └──→ fighters list → compute counts
     │
     ├──→ OverdueList (subview of PaymentPanel)
     │       ├──→ fighters with no payment + past due
     │       └──→ followUp subcollection read
     │
     ├──→ ReminderSheet (subview)
     │       └──→ navigator.clipboard.writeText()
     │
     └──→ Excel export
             └──→ exceljs workbook → blob download
```

## File Changes

| File | Action | Description |
|------|--------|-------------|
| `src/types/mma.ts` | Modify | Add `Payment`, `PaymentMethod`, `PaymentStatus`, `FollowUp` types |
| `src/services/storage.ts` | Modify | Add payment CRUD: `subscribePayments`, `savePayment`, `cancelPayment`, `updatePayment`, `saveFollowUp` |
| `src/App.tsx` | Modify | Add lazy import `PaymentPanel`, route for `'pagos'` PageKey |
| `src/components/Topbar.tsx` | Modify | Add `'pagos'` to `PageKey` union, `'Pagos'` to `NAV_ITEMS` with `DollarSign` icon |
| `src/components/Dashboard.tsx` | Modify | Add payment summary widget (`glass-panel` card with 4 count boxes) |
| `src/components/FighterProfile.tsx` | Modify | Add "Pagos" tab/section showing payment history + status badge |
| `src/components/PaymentPanel.tsx` | Create | Main payment management page (period selector, data grid, overdue subview, export button) |
| `src/components/PaymentForm.tsx` | Create | Modal form for creating/editing payments (useFocusTrap) |
| `src/utils/exportPaymentExcel.ts` | Create | Period-scoped `.xlsx` export via `exceljs` (follows pattern from `exportExcel.ts`) |
| `firestore.rules` | Modify | Restrict `/payments/{doc}` writes to authenticated admin |

## Interfaces / Contracts

```typescript
// ─── New types ────────────────────────────────────────────────────────

export type PaymentMethod = 'cash' | 'transfer' | 'nequi' | 'daviplata';
export type PaymentStatus = 'paid' | 'cancelled';  // pending/overdue are derived

export interface Payment {
  id: string;
  fighterId: string;
  period: string;           // "2026-06" (YYYY-MM)
  amount: number;           // COP, integer
  method: PaymentMethod;
  status: PaymentStatus;
  notes?: string;
  paidAt: string;           // ISO date
  cancelledAt?: string;     // ISO date (if cancelled)
  cancelledBy?: string;     // user ID (if cancelled)
  createdAt: string;
  updatedAt: string;
  history?: PaymentEdit[];  // last 20 edits
}

export interface PaymentEdit {
  field: string;
  from: unknown;
  to: unknown;
  at: string;
  by: string;
}

export interface FollowUp {
  status: 'pending-contact' | 'contacted';
  note?: string;
  contactedAt?: string;
  updatedAt: string;
}

// ─── Firestore collection: /payments/{paymentId} ────────────────────
// Schema per doc:
{
  fighterId: string,       // ref to fighters/{id}
  period: string,          // "2026-06"
  amount: number,
  method: "cash"|"transfer"|"nequi"|"daviplata",
  status: "paid"|"cancelled",
  notes?: string,
  paidAt: Timestamp,
  cancelledAt?: Timestamp,
  cancelledBy?: string,
  createdAt: Timestamp,
  updatedAt: Timestamp,
  history: PaymentEdit[]   // max 20
}

// ─── Subcollection: /payments/{paymentId}/followUp/{autoId} ─────────
{
  status: "pending-contact"|"contacted",
  note?: string,
  contactedAt?: Timestamp,
  updatedAt: Timestamp
}

// ─── Config doc: /config/payments ───────────────────────────────────
{
  dueDay: number,           // default 10
  defaultAmount: number,    // default 15000
  lastUpdated: Timestamp
}
```

## Testing Strategy

| Layer | What to Test | Approach |
|-------|-------------|----------|
| Unit | Payment status derivation logic (paid/pending/overdue per fighter+period) | Pure function: `computePaymentStatus(fighter, payments[], period, dueDay)` |
| Unit | Reminder message template generation | Pure function: `generateReminder(fighter, amount, period, dueDate)` |
| Integration | Payment CRUD → Firestore write/read → UI update | Manual smoke test (no test runner in project) |
| Integration | Overdue list correctness with real fighter + payment data | Manual verification after seed |

**Note**: No test runner is configured (`config.yaml testing.runner: null`). All tests will be manual smoke tests until a runner is added. The pure functions above are extracted specifically to be testable when one is available.

## Migration / Rollout

No migration required. The `/payments` collection starts empty. Config doc `/config/payments` should be seeded with `{ dueDay: 10, defaultAmount: 15000 }` on first app mount if absent.

Rollout:
1. Merge types → storage → components in order (tasks will order this)
2. Firestore rules can be deployed independently before code
3. No feature flag needed — new route is opt-in via navigation
