# Coverage Engine Specification

## Purpose

Compute rolling membership coverage for fighters: program auto-detection from payment amount, coverage date stacking/gap logic, and as-of-today membership status. All functions are pure — they receive data and return results, no side effects.

## Requirements

### Requirement: Program Auto-Detection

The system MUST auto-detect a fighter's program from a given payment amount. The system SHALL check each program in `PaymentConfig.programs[]`: if `amount % program.monthlyPrice === 0`, the program is a candidate. If exactly one program matches, it SHALL be selected. If multiple programs match, the system SHALL select the program with the higher monthly price. If no program matches, the system SHALL return `null`.

#### Scenario: Exact multiple of daily program — auto-selects daily

- GIVEN programs with daily=$160k and three-day=$120k
- WHEN the amount is $160,000
- THEN the system auto-selects program `daily` with `monthsPaid = 1`

#### Scenario: Exact multiple of three-day program — auto-selects three-day

- GIVEN programs with daily=$160k and three-day=$120k
- WHEN the amount is $120,000
- THEN the system auto-selects program `three-day` with `monthsPaid = 1`

#### Scenario: Amount matches both programs — prefers higher price (daily)

- GIVEN programs with daily=$160k and three-day=$120k
- WHEN the amount is $480,000 (3×$160k = 4×$120k)
- THEN the system selects program `daily` with `monthsPaid = 3`

#### Scenario: Amount does not divide evenly into any program — returns null

- GIVEN programs with daily=$160k and three-day=$120k
- WHEN the amount is $370,000
- THEN the system returns `null` (manual picker required)

### Requirement: Coverage Computation (Stacking)

When a new payment's `paidAt` is BEFORE the fighter's current maximum `coverageEnd`, the system MUST stack the coverage: `coverageStart = currentMaxCoverageEnd`, `coverageEnd = addMonths(coverageStart, monthsPaid)`. The system MUST consider only non-cancelled payments when computing the current max coverageEnd.

#### Scenario: Payment before expiry — coverage stacks

- GIVEN fighter has coverage ending Aug 15, 2026
- WHEN a new $320k payment is recorded with paidAt = Aug 10, 2026 (before expiry)
- THEN `coverageStart = Aug 15, 2026` and `coverageEnd = Oct 15, 2026` (2 months daily)
- AND the fighter's status remains `active` throughout

#### Scenario: Stacking with cancelled payments — cancelled excluded

- GIVEN fighter has a cancelled payment with coverageEnd = Sep 1, 2026 and a valid payment with coverageEnd = Aug 15, 2026
- WHEN computing current max coverageEnd
- THEN the system ignores the cancelled payment and uses Aug 15, 2026

### Requirement: Coverage Computation (Gap)

When a new payment's `paidAt` IS AFTER or ON the fighter's current maximum `coverageEnd` (or there are no existing payments), the system MUST start fresh coverage: `coverageStart = paidAt`, `coverageEnd = addMonths(paidAt, monthsPaid)`.

#### Scenario: Payment after expiry — fresh coverage from paidAt

- GIVEN fighter's coverage ended Jun 1, 2026 and today is Jul 20, 2026
- WHEN admin records $120k with paidAt = Jul 20, 2026
- THEN `coverageStart = Jul 20, 2026` and `coverageEnd = Aug 20, 2026` (1 month three-day)

#### Scenario: First payment ever — fresh coverage from paidAt

- GIVEN fighter has zero payments recorded
- WHEN admin records $160k with paidAt = Jun 28, 2026
- THEN `coverageStart = Jun 28, 2026` and `coverageEnd = Jul 28, 2026`

### Requirement: Membership Status

The system MUST compute a fighter's membership status as-of-today. `active` = at least one non-cancelled payment exists where `coverageEnd >= today`. `expired` = no non-cancelled payments have `coverageEnd >= today` but at least one payment exists. `pending` = zero payments recorded.

#### Scenario: Active coverage shows as active

- GIVEN fighter has a non-cancelled payment with coverageEnd = Aug 15, 2026 and today is Jul 20, 2026
- WHEN computing membership status
- THEN the status is `active`

#### Scenario: All coverage expired shows as expired

- GIVEN all of fighter's non-cancelled payments have coverageEnd < Jul 20, 2026
- WHEN computing membership status as of Jul 20, 2026
- THEN the status is `expired`

#### Scenario: No payments at all shows as pending

- GIVEN fighter has zero payments recorded
- WHEN computing membership status
- THEN the status is `pending`

### Requirement: PaymentConfig Schema

The `PaymentConfig` type MUST store `programs: Array<{ id: string, name: string, monthlyPrice: number }>`. The fields `dueDay` and `defaultAmount` MUST be removed. The `period` field on `Payment` SHALL be kept as `@deprecated`, derived from `coverageStart.slice(0, 7)` for backward compatibility.

#### Scenario: Programs config stored and readable

- GIVEN the config document at `/config/payments` exists with `programs` array
- WHEN the system reads PaymentConfig
- THEN it SHALL contain `daily` ($160k) and `three-day` ($120k) entries
- AND `dueDay` and `defaultAmount` SHALL NOT be present
