# Payment Export Specification

## Purpose

Export payment records for a selected period to a `.xlsx` file for accounting and reporting. The export SHALL be generated client-side using a lightweight xlsx library with no server round-trip. The file SHALL be immediately downloaded to the user's device.

## Requirements

### Requirement: Period Export

The system MUST allow exporting all payment records for a selected period (month/year). The exported `.xlsx` file SHALL contain a single sheet named "Pagos". Columns SHALL include: Fighter Name, Phone, Amount, Payment Method, Status, Period, Payment Date, Cancelled Date (if applicable), Notes.

#### Scenario: Happy path — export period with mixed statuses

- GIVEN the current period has 10 payments: 7 paid, 2 cancelled, 1 pending
- WHEN the instructor clicks "Exportar" on the payments page
- THEN a `.xlsx` file is generated and downloaded
- AND the file contains all 10 records with correct columns
- AND the file opens correctly in Excel and Google Sheets

#### Scenario: Edge case — empty period

- GIVEN no payments exist for the selected period
- WHEN the instructor clicks "Exportar"
- THEN the system SHALL show a warning: "No hay pagos registrados en este período"
- AND SHALL NOT generate a download

### Requirement: File Naming

The exported file MUST follow the naming convention: `pagos_{YYYY}_{MM}.xlsx`. For example, June 2026 exports as `pagos_2026_06.xlsx`.

#### Scenario: Happy path — correct file name

- GIVEN the selected period is "June 2026"
- WHEN the download triggers
- THEN the browser downloads a file named `pagos_2026_06.xlsx`

### Requirement: Column Formatting

The exported file SHOULD include header row formatting (bold, background fill). Amounts SHALL be formatted as numbers with no decimal places (COP has no sub-units). Dates SHALL be formatted as `YYYY-MM-DD`. The sheet SHALL auto-size column widths for readability.

#### Scenario: Happy path — formatted export

- GIVEN a standard export of 10 records
- WHEN the `.xlsx` file is opened
- THEN header cells are bold with a blue-gray background
- AND the Amount column shows whole numbers (e.g., 15000, not 15000.00)
- AND date columns show `2026-06-15` format

### Requirement: Library Choice

The export MUST use a zero-dependency client-side xlsx library (e.g., `xlsx` or `exceljs`). The library SHALL be loaded lazily only when the user triggers an export. This keeps the initial bundle size unaffected.

#### Scenario: Happy path — lazy load on export

- GIVEN the user has never exported before
- WHEN they click "Exportar" for the first time
- THEN the xlsx library is dynamically imported
- AND the export proceeds after the library loads
- AND there is NO impact on initial page load time
