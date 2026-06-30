# Delta for Payment Dashboard

## ADDED Requirements

### Requirement: Full Payment Subscription

The dashboard MUST subscribe to ALL payments using `subscribePayments()` (unfiltered) instead of period-scoped subscriptions. This enables real-time counts for the rolling membership model.

#### Scenario: Dashboard loads all payments

- GIVEN the dashboard loads
- WHEN the payment widget initializes
- THEN it subscribes to all payment documents with no period filter
- AND the subscription updates reactively on any payment change

## MODIFIED Requirements

### Requirement: Membership Status Counts

The widget MUST display three count cards: `Activos` (active), `Expirados` (expired), and `Sin membresía` (pending). Previously it displayed `Pagados`, `Pendientes`, `Vencidos`, and `Cancelados` for a selected period. Each card SHALL show the count and a contextual color (green, yellow, gray). The system SHALL compute statuses using `computeMembershipStatus` per fighter, grouping fighters with `coverageEnd >= today` as active, `coverageEnd < today` and at least one payment as expired, and zero payments as pending.

(Previously: four counts — paid, pending, overdue, cancelled — scoped to a selected period)

#### Scenario: Happy path — all three statuses represented

- GIVEN 15 fighters: 8 active, 5 expired, 2 pending
- WHEN the dashboard widget renders
- THEN it displays Activos=8, Expirados=5, Sin membresía=2
- AND each card uses the correct color (green, yellow, gray)

#### Scenario: All fighters active

- GIVEN all fighters have current coverage
- WHEN the dashboard renders
- THEN Activos=totalFighters, Expirados=0, Sin membresía=0

#### Scenario: No fighters in the system

- GIVEN the system has zero fighters
- WHEN the dashboard renders
- THEN all three counts show 0

#### Scenario: Firestore query fails

- GIVEN Firestore is unreachable
- WHEN the dashboard widget attempts to load payments
- THEN the widget SHALL show a loading spinner for up to 10 seconds
- AND if the query still fails, display a retry banner: "Error al cargar pagos. Toca para reintentar."

## REMOVED Requirements

### Requirement: Period Selector

(Reason: rolling membership model has no billing periods — coverage state is continuous, not month-scoped.)
(Migration: `subscribePaymentsByPeriod(period)` removed; all subscriptions use `subscribePayments()` instead.)

### Requirement: Overdue Determination

(Reason: overdue concept depended on a fixed due day per period. In the rolling model, a fighter is either covered (active) or not (expired) — there is no "overdue" state because payments can be made at any time.)
(Migration: `overdue` status removed. Use `expired` status for fighters whose coverage has lapsed. The `dueDay` config field is removed.)
