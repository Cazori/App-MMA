# Coverage Calendar Specification

## Purpose

A calendar popup component that displays a fighter's membership coverage date ranges visually. Uses native Date API and CSS Grid — zero external dependencies.

## Requirements

### Requirement: Calendar Popup Display

The system MUST display a calendar popup when the admin clicks a calendar icon next to a fighter's payment row in the payment list. The popup SHALL be a positioned overlay near the clicked icon. The popup SHALL display a month grid: 7 columns (weekday headers: D L M M J V S) and up to 6 rows for day cells.

#### Scenario: Click icon opens calendar for correct fighter

- GIVEN fighter "Juan Pérez" has payments with coverage ranges Jun 15–Jul 15 and Aug 1–Sep 1
- WHEN the admin clicks the calendar icon on Juan's row
- THEN a popup appears showing June 2026 (current month by default)
- AND the days Jun 15–Jul 15 are highlighted in the June view

#### Scenario: Popup closes on click outside

- GIVEN the calendar popup is open for fighter "Juan Pérez"
- WHEN the admin clicks anywhere outside the popup
- THEN the popup closes

#### Scenario: Popup closes on Escape key

- GIVEN the calendar popup is open
- WHEN the admin presses the Escape key
- THEN the popup closes

### Requirement: Month Navigation

The popup MUST include left (`←`) and right (`→`) navigation buttons to change the displayed month. The current month and year SHALL be displayed as a header (e.g., "Junio 2026").

#### Scenario: Navigate to previous month

- GIVEN the calendar shows June 2026
- WHEN the admin clicks the left arrow
- THEN the calendar displays May 2026
- AND coverage ranges that include May dates remain highlighted

#### Scenario: Navigate to next month

- GIVEN the calendar shows June 2026
- WHEN the admin clicks the right arrow
- THEN the calendar displays July 2026
- AND coverage ranges that include July dates remain highlighted

### Requirement: Coverage Range Highlighting

Every day that falls within ANY of the fighter's `[coverageStart, coverageEnd]` intervals MUST be visually highlighted. Days outside coverage ranges SHALL appear as default/unhighlighted. The highlighting SHALL span all months visible via navigation.

#### Scenario: Multi-month coverage highlighted across months

- GIVEN fighter has coverage from Jun 15 to Sep 15, 2026
- WHEN the admin navigates to June, July, August, and September
- THEN Jun 15–30, Jul 1–31, Aug 1–31, and Sep 1–15 are highlighted respectively
- AND dates outside those ranges in each month are not highlighted

#### Scenario: Disjoint coverage ranges both highlighted

- GIVEN fighter has two separate payments: coverage Jun 1–Jun 15 and Aug 1–Aug 15
- WHEN the calendar shows June and August
- THEN Jun 1–15 are highlighted in June AND Aug 1–15 are highlighted in August
- AND July has no highlighted days

### Requirement: Zero External Dependencies

The CoverageCalendar component MUST use only native JavaScript `Date` API (`Date`, `getMonth`, `getDate`, `getDay`, `setMonth`, etc.) and CSS Grid for layout. No date utility libraries SHALL be added.

#### Scenario: Calendar renders without third-party libraries

- GIVEN the CoverageCalendar component mounts
- THEN it computes all month grid data using native Date methods
- AND no npm packages beyond existing dependencies are imported
