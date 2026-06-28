# Payment Dashboard Specification

## Purpose

Display a period-based payment summary widget on the main dashboard. The widget SHALL show real-time counts of pending, paid, overdue, and cancelled payments for the selected billing period. The widget SHALL be a lazy-loaded card below the existing fighter stats.

## Requirements

### Requirement: Period Selector

The dashboard widget MUST include a month/year period selector. The default value SHALL be the current month. The selector SHALL allow navigating to past and future periods.

#### Scenario: Happy path — default to current month

- GIVEN the dashboard loads for the first time
- THEN the payment widget shows the current month/year as selected
- AND counts are calculated for that period

#### Scenario: Edge case — period with no fighters enrolled

- GIVEN a billing period where zero fighters were active
- WHEN the instructor selects that period
- THEN the widget SHALL show counts as 0 with a message: "No hay luchadores activos en este período"

### Requirement: Payment Counts

The widget MUST display four count cards: `Pagados` (paid), `Pendientes` (no payment recorded), `Vencidos` (overdue past due date), and `Cancelados` (cancelled). Each card SHALL show the count and a contextual color (green, yellow, red, gray). The counts SHALL update reactively when payments are recorded, edited, or cancelled elsewhere in the app.

#### Scenario: Happy path — all statuses represented

- GIVEN the current period has 10 active fighters: 5 paid, 3 pending, 1 overdue, 1 cancelled
- WHEN the dashboard widget renders
- THEN it displays Pagados=5, Pendientes=3, Vencidos=1, Cancelados=1
- AND each card uses the correct color

#### Scenario: Edge case — Firestore query fails

- GIVEN Firestore is unreachable
- WHEN the dashboard widget attempts to load counts
- THEN the widget SHALL show a loading spinner for up to 10 seconds
- AND if the query still fails, display a retry banner: "Error al cargar pagos. Toca para reintentar."

### Requirement: Overdue Determination

A payment SHALL be considered `overdue` when: the fighter has NO payment record for the selected period AND the period's due date has passed. The due date SHALL be configurable per period via a Firestore config doc at `/config/payments` with field `dueDay` (default: 10th of the month).

#### Scenario: Happy path — fighter is overdue

- GIVEN the period "June 2026" has dueDay=10 and today is June 15
- WHEN fighter "Juan Pérez" has no payment for June 2026
- THEN the widget counts Juan as `overdue`

#### Scenario: Edge case — due date not configured

- GIVEN `/config/payments` does not exist or lacks `dueDay`
- WHEN the widget calculates overdue status
- THEN the system SHALL fall back to `dueDay = 10`
- AND the count still displays correctly
