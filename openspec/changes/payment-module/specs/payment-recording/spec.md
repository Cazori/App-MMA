# Payment Recording Specification

## Purpose

Allow instructors to record, edit, and cancel payments for individual fighters scoped to a billing period. Supports four payment methods: cash, bank transfer, Nequi, and Daviplata. Every mutation MUST persist to Firestore and update the local UI optimistically.

## Requirements

### Requirement: Record Payment

The system MUST allow an authenticated user to record a payment for a fighter in a given period. The form SHALL include fighter selector, period selector (month/year), amount input, payment method selector (cash | transfer | nequi | daviplata), and optional notes. The recorded payment SHALL default to status `paid`.

#### Scenario: Happy path — record a valid cash payment

- GIVEN an authenticated instructor on the payment recording form
- WHEN they select fighter "Juan Pérez", period "June 2026", amount "15000", method "cash", and submit
- THEN a payment document is created in Firestore under `/payments/` with status `paid`
- AND the form resets and a success toast is shown

#### Scenario: Edge case — duplicate payment for same fighter and period

- GIVEN fighter "Juan Pérez" already has a payment recorded for "June 2026"
- WHEN the instructor attempts to record another payment for the same fighter and period
- THEN the system SHALL reject the submission
- AND display a warning: "Este luchador ya tiene un pago registrado para este período"

#### Scenario: Edge case — zero or negative amount

- GIVEN the payment form with an amount field
- WHEN the instructor enters "0" or "-5000" and submits
- THEN the system SHALL show a validation error: "El monto debe ser mayor a cero"
- AND the payment SHALL NOT be created

### Requirement: Edit Payment

The system MUST allow editing an existing payment's amount, method, notes, and status. The period and fighter SHALL remain immutable after creation. Edits SHALL log the previous values and timestamp in a `history` sub-collection.

#### Scenario: Happy path — edit amount and method

- GIVEN a payment exists for "Juan Pérez", "June 2026", amount 15000, method "cash"
- WHEN the instructor opens the edit dialog, changes amount to 20000 and method to "nequi", and saves
- THEN the payment document is updated with new amount and method
- AND a history entry is created recording the previous values

#### Scenario: Edge case — edit while another session already changed it

- GIVEN the payment was just edited by another session
- WHEN the instructor saves their edit
- THEN the system SHALL detect the version conflict (Firestore `lastUpdated` mismatch)
- AND show a conflict warning: "El pago fue modificado por otro usuario. Recarga e intenta de nuevo."

### Requirement: Cancel Payment

The system MUST allow cancelling a payment by setting its status to `cancelled`. Cancelled payments SHALL retain all original data and SHALL include a `cancelledAt` timestamp and `cancelledBy` user ID. A cancelled payment MUST NOT be editable.

#### Scenario: Happy path — cancel with confirmation

- GIVEN a payment exists with status `paid`
- WHEN the instructor clicks "Cancelar pago" and confirms in the dialog
- THEN the payment status changes to `cancelled`
- AND `cancelledAt` and `cancelledBy` fields are set
- AND the cancel button is disabled for this payment thereafter

#### Scenario: Edge case — cancel an already cancelled payment

- GIVEN a payment already has status `cancelled`
- WHEN the instructor clicks "Cancelar pago"
- THEN the system SHALL disable the action
- AND show a message: "Este pago ya está cancelado"
