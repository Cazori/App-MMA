# Delta for Payment Recording

## MODIFIED Requirements

### Requirement: Record Payment

The system MUST allow an authenticated user to record a payment for a fighter. The form SHALL include a fighter selector, a date picker for `paidAt` (admin-chosen date), an amount input, a program selector (auto-detected OR manually picked), a payment method selector (cash | transfer | nequi | daviplata), and optional notes. The recorded payment SHALL store `coverageStart`, `coverageEnd`, `programId`, and `monthsPaid` — replacing the previous `period` field (`period` is now deprecated, derived from `coverageStart`). The system SHALL auto-compute coverage dates and display a preview before submission. No duplicate-check by period SHALL be performed (stacking is allowed).

(Previously: form used period selector for month/year, single fixed amount, no program concept, duplicate check by period)

#### Scenario: Happy path — record with auto-detected program and coverage preview

- GIVEN an authenticated instructor on the payment recording form with fighter "Juan Pérez" selected
- WHEN they enter amount "$160,000", pick paidAt = "28/06/2026", see auto-detected program "Todos los días (1 mes)", see coverage preview "28/06/2026 → 28/07/2026", select method "cash", and submit
- THEN a payment document is created with `programId: 'daily'`, `monthsPaid: 1`, `coverageStart: '2026-06-28'`, `coverageEnd: '2026-07-28'`, `status: 'paid'`
- AND the form resets and a success toast is shown

#### Scenario: Stacking payment recorded before expiry

- GIVEN fighter "Juan Pérez" has existing coverage ending Aug 15, 2026
- WHEN the instructor records $320k with paidAt = Aug 10, 2026
- THEN the system stacks: `coverageStart = '2026-08-15'`, `coverageEnd = '2026-10-15'`
- AND the coverage preview shows "15/08/2026 → 15/10/2026" before submission

#### Scenario: Gap payment recorded after expiry

- GIVEN fighter "Juan Pérez" has coverage ending Jun 1, 2026
- WHEN the instructor records $120k with paidAt = Jul 20, 2026
- THEN the system starts fresh coverage: `coverageStart = '2026-07-20'`, `coverageEnd = '2026-08-20'`

#### Scenario: Non-multiple amount — manual picker shown

- GIVEN the instructor enters amount "$370,000" (not divisible by $160k or $120k)
- WHEN the system detects no program auto-matches
- THEN the form shows a manual program picker with options like "Daily: 2 meses ($320k, $50k excedente)" and "Three-day: 3 meses ($360k, $10k excedente)"
- AND the instructor must manually select a program before submitting

#### Scenario: Zero or negative amount — rejected

- GIVEN the payment form with an amount field
- WHEN the instructor enters "0" or "-5000" and submits
- THEN the system SHALL show a validation error: "El monto debe ser mayor a cero"
- AND the payment SHALL NOT be created

### Requirement: Edit Payment

The system MUST allow editing an existing payment's amount, method, notes, and status. The `coverageStart`, `coverageEnd`, `programId`, `monthsPaid`, and fighter SHALL remain immutable after creation (changing these would invalidate coverage chain). Edits SHALL log the previous values and timestamp in a `history` sub-collection.

(Previously: period and fighter were immutable)

#### Scenario: Happy path — edit amount and method, coverage stays

- GIVEN a payment exists for "Juan Pérez" with amount=$160k, method="cash", coverageStart=Jun 28, coverageEnd=Jul 28
- WHEN the instructor opens edit dialog, changes amount to $180k (non-standard, still accepted), method to "nequi"
- THEN coverageStart and coverageEnd remain unchanged
- AND a history entry records the old amount and method

#### Scenario: Cancel payment — coverage chain unaffected

- GIVEN a payment with coverage Jun 28–Jul 28 that was part of a stacking chain
- WHEN the instructor cancels this payment
- THEN coverageStart/End are preserved on the cancelled document
- BUT the coverage engine excludes it from future stacking computations

## ADDED Requirements

### Requirement: Coverage Preview

The system MUST display a read-only coverage preview in the payment form before submission. The preview SHALL update reactively as the admin changes amount or paidAt. It SHALL show: detected program (or "Seleccionar programa" if manual), coverage start date, and coverage end date. The preview SHALL use `computeCoverage` and `computeProgram` to compute values.

#### Scenario: Preview updates when amount changes

- GIVEN the instructor has entered paidAt = Jun 28 and amount = $160k
- WHEN they change amount to $320k
- THEN the preview updates to show "Todos los días (2 meses)" and "28/06/2026 → 28/08/2026"

#### Scenario: Preview shows manual picker state

- GIVEN the instructor enters amount = $370k
- THEN the preview shows "El monto no coincide exactamente con ningún programa" and a program dropdown appears for manual selection
