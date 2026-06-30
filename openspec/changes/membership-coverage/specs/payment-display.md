# Payment Display Specification

## Purpose

Display a fighter's payment history with per-payment coverage details and an as-of-today membership status badge. Replaces the previous period-scoped payment table with a rolling membership view.

## Requirements

### Requirement: Fighter Coverage Status Badge

The system MUST display a coverage status badge for each fighter in the payment panel. The badge SHALL show one of three statuses: `Activo` (green, active), `Expirado` (red, expired), or `Sin membresía` (gray, pending). The status SHALL be computed as-of-today using `computeMembershipStatus`.

#### Scenario: Active fighter shows green badge

- GIVEN fighter has a non-cancelled payment with coverageEnd >= today
- WHEN the payment panel renders this fighter
- THEN a green badge with text `Activo` is displayed

#### Scenario: Expired fighter shows red badge

- GIVEN all of fighter's non-cancelled payments have coverageEnd < today and at least one payment exists
- WHEN the payment panel renders this fighter
- THEN a red badge with text `Expirado` is displayed

#### Scenario: New fighter with no payments shows gray badge

- GIVEN fighter has zero payments recorded
- WHEN the payment panel renders this fighter
- THEN a gray badge with text `Sin membresía` is displayed

### Requirement: Payment Row Columns

Each payment row in the list MUST display: amount (formatted as COP), program name, payment method, coverage range (`coverageStart` → `coverageEnd` as short dates), status badge (paid/cancelled). The row SHALL be sorted by `coverageStart` descending (most recent first).

#### Scenario: Payment row shows all required columns

- GIVEN a payment exists with amount=$160k, program=daily, method=cash, coverageStart=Jun 28, coverageEnd=Jul 28, status=paid
- WHEN the payment list renders
- THEN the row shows "$160,000", "Todos los días", "Efectivo", "28/06/2026 → 28/07/2026", and a green "Pagado" badge

### Requirement: Calendar Icon Per Row

Each payment row MUST include a calendar icon button. Clicking the icon SHALL open the CoverageCalendar popup for that fighter. The icon SHALL use the existing `Calendar` icon from `lucide-react`.

#### Scenario: Calendar icon opens popup

- GIVEN a payment list for fighter "Juan Pérez"
- WHEN the admin clicks the calendar icon
- THEN the CoverageCalendar popup opens showing Juan's coverage ranges

### Requirement: No Period Selector

The payment panel MUST NOT include a month/year period selector. All payments for the selected fighter SHALL be displayed regardless of period. The subscription SHALL use `subscribePayments()` (unfiltered) instead of `subscribePaymentsByPeriod(period)`.

#### Scenario: All payments shown without period filter

- GIVEN fighter "Juan Pérez" has 5 payments across 2025 and 2026
- WHEN the payment panel loads
- THEN all 5 payments are displayed in the list, sorted by coverageStart desc
- AND no period selector dropdown is visible

### Requirement: Cancelled Payment Display

Cancelled payments SHALL be displayed in the list with a strikethrough style on the amount. The coverage status SHALL NOT consider cancelled payments when computing the fighter's badge status.

#### Scenario: Cancelled payment shown with strikethrough

- GIVEN a payment with status=cancelled and amount=$160k
- WHEN the payment list renders
- THEN the amount "$160,000" is displayed with strikethrough text
- AND the cancelled badge is shown in gray

#### Scenario: Cancelled payment excluded from status computation

- GIVEN fighter has only one payment, which is cancelled
- WHEN computing coverage status
- THEN the status is `pending` (no non-cancelled payments exist)
