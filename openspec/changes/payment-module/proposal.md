# Proposal: Payment Module

## Intent

Manual in-app payment tracking for Guerreros de Dios MMA. Instructors lose revenue because students pay $15k–$20k COP/month in cash or bank transfer with zero tracking — no record of who paid, who owes, or any follow-up system. This proposal adds a Firestore-backed payment tracker as an MVP. No payment gateway, no recurring billing.

## Scope

### In Scope
- Payment CRUD (record, edit, cancel per fighter per period)
- Period-based dashboard with pending/paid/overdue counts
- Overdue fighter list with contact info and follow-up tracking
- WhatsApp reminder message generation (copy-to-clipboard)
- Excel (.xlsx) export of payment data

### Out of Scope
- Payment gateway / processor integration (Stripe, etc.)
- Automatic recurring billing or subscriptions
- Email / SMS push notifications
- Treasurer role / RBAC separation
- Receipt printing or PDF generation
- Multi-currency or international pricing

## Capabilities

### New Capabilities
- `payment-recording`: Record, edit, and cancel payments per fighter per period. Supports cash, transfer, Nequi, Daviplata.
- `payment-dashboard`: Period-based widget on the dashboard showing pending/paid/overdue/cancelled counts in real time.
- `payment-overdue`: List of fighters with overdue payments, contact info, and manual follow-up tracking.
- `payment-reminders`: Auto-generate WhatsApp message text with fighter name, amount, and due date; copy to clipboard.
- `payment-export`: Export payment records to `.xlsx` for accounting / reporting.

### Modified Capabilities
None — no existing specs.

## Approach

New `/payments` Firestore collection (not embedded in fighters). Dedicated lazy-loaded route (`/pagos`). Dashboard widget + per-fighter payment history in FighterProfile. Manual entry only — no background jobs, no webhooks. Fee amounts stored in a Firestore config doc. WhatsApp reminders use `wa.me` links copied to clipboard. Excel export via a client-side xlsx library.

## Affected Areas

| Area | Impact | Description |
|------|--------|-------------|
| `src/types/mma.ts` | Modified | Add `Payment`, `PaymentMethod`, `PaymentStatus` types |
| `src/services/storage.ts` | Modified | Add payment CRUD functions |
| `src/App.tsx` | Modified | Lazy-loaded `/pagos` route |
| `src/components/Topbar.tsx` | Modified | Nav link to payments |
| `src/components/Dashboard.tsx` | Modified | Payment summary card |
| `src/components/FighterProfile.tsx` | Modified | Payment history section + status badge |
| `src/components/PaymentPanel.tsx` | **New** | Main payment management view |
| `src/components/PaymentForm.tsx` | **New** | Record / edit payment form |
| `firestore.rules` | Modified | Payment collection access rules |

## Risks

| Risk | Likelihood | Mitigation |
|------|------------|------------|
| Firestore rules too permissive | Medium | Add `isAdmin` / `isTreasurer` checks, validate fighterId ownership |
| No offline sync — data lost on drop | Low | Client-side optimistic state + retry; show connection banner |
| Hardcoded fee amounts drift | Low | Store fee config in a Firestore doc, read on mount |
| Instructor records wrong data | Medium | Confirm dialog before submit; edit/cancel always available |

## Rollback Plan

1. Remove `/pagos` route from `src/App.tsx` and delete lazy import
2. Revert `firestore.rules` to last known good state
3. Delete `openspec/changes/payment-module/` (move to archive)
4. If payments collection has data, it can remain orphaned — no other feature depends on it

## Dependencies

None. No external payment gateway, no new npm packages beyond a lightweight xlsx writer. All changes self-contained in this repo.

## Success Criteria

- [ ] Instructor can record a payment in ≤3 clicks from the payments page
- [ ] Dashboard shows live pending/paid/overdue counts scoped to a selected period
- [ ] Overdue list displays correct fighters sorted by oldest debt
- [ ] WhatsApp reminder copies valid text to clipboard on click
- [ ] Excel export produces a valid `.xlsx` readable by Excel / Google Sheets
- [ ] `firestore.rules` rejects unauthorized reads/writes to `/payments`
