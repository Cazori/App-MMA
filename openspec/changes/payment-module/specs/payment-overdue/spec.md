# Payment Overdue Specification

## Purpose

Provide a dedicated view listing fighters with overdue payments for the selected period. The list SHALL include fighter contact information and support manual follow-up tracking (mark as contacted, add follow-up notes). This enables instructors to systematically follow up on debts.

## Requirements

### Requirement: Overdue Fighter List

The system MUST display fighters with overdue payments, sorted by oldest debt first (ascending by enrollment date within the period). Each row SHALL show: fighter name, phone, amount due, days overdue, and follow-up status. The list SHALL be filterable by follow-up status (all | pending-contact | contacted).

#### Scenario: Happy path — list with multiple overdue fighters

- GIVEN 5 fighters overdue for "June 2026" with different enrollment dates
- WHEN the instructor opens the overdue view for that period
- THEN fighters are sorted by oldest enrollment first
- AND each row shows name, phone, amount, days overdue, and follow-up status

#### Scenario: Edge case — no overdue fighters

- GIVEN all fighters have paid for "June 2026"
- WHEN the instructor opens the overdue view
- THEN the system SHALL display a success message: "Todos los luchadores están al día 🎉"
- AND an empty state illustration

### Requirement: Follow-up Tracking

Each overdue entry SHALL support marking as `contacted` and adding a follow-up note. The follow-up status and notes SHALL persist in Firestore under `/payments/{paymentId}/followUp/`. The instructor MAY toggle the status back to `pending-contact` if needed.

#### Scenario: Happy path — mark as contacted with note

- GIVEN fighter "Juan Pérez" appears in the overdue list
- WHEN the instructor clicks "Contactado", enters note "Llamó a las 10am, dijo que paga mañana", and saves
- THEN the follow-up status changes to `contacted`
- AND the note is persisted and displayed in the row

#### Scenario: Edge case — mark as contacted then revert

- GIVEN fighter "Juan Pérez" is already marked as `contacted`
- WHEN the instructor clicks "Marcar como pendiente"
- THEN the status reverts to `pending-contact`
- AND the follow-up note is preserved (not deleted)

### Requirement: Contact Action

The system MUST provide a clickable phone number that opens the default dialer or WhatsApp contact for that fighter. The phone number SHALL be formatted as a `tel:` link and a `https://wa.me/` link, both available from the row.

#### Scenario: Happy path — click phone number

- GIVEN fighter "Juan Pérez" has phone "+573001234567"
- WHEN the instructor clicks the phone icon
- THEN the system opens the default dialer with that number
- AND a `wa.me/573001234567` link is also available as a button
