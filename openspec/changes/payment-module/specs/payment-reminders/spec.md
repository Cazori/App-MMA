# Payment Reminders Specification

## Purpose

Generate WhatsApp reminder messages with fighter-specific details (name, amount due, due date) and copy the ready-to-send text to the user's clipboard. No automatic sending — the instructor manually pastes and sends in WhatsApp. This respects privacy and avoids automated messaging regulations.

## Requirements

### Requirement: Single Reminder Generation

The system MUST generate a reminder message for a specific overdue fighter. The generated text SHALL include the fighter's name, the amount due, the period, and the due date. The format SHALL be: `"Hola {nombre}, te recuerdo que el pago de {periodo} por ${monto} vence el {fecha}. Por favor ponte al día. ¡Gracias!"`. A copy-to-clipboard button SHALL appear after generation.

#### Scenario: Happy path — generate and copy reminder

- GIVEN fighter "Juan Pérez" owes 20000 COP for "June 2026" due June 10
- WHEN the instructor clicks "Generar recordatorio" on the overdue row
- THEN the system displays the generated message in a text area
- AND the instructor can click "Copiar" to copy it to clipboard
- AND a toast confirms: "Mensaje copiado al portapapeles"

#### Scenario: Edge case — fighter name contains special characters

- GIVEN fighter "María José Fernández" has an accented name
- WHEN the system generates the reminder
- THEN the name SHALL render correctly (UTF-8) in the generated message
- AND the clipboard copy SHALL preserve UTF-8 characters

### Requirement: Bulk Reminder Generation

The system MAY allow selecting multiple overdue fighters and generating individual reminder messages for each. Each message SHALL be generated separately. The instructor SHALL copy each one individually — no bulk clipboard.

#### Scenario: Happy path — select three fighters, generate reminders

- GIVEN 5 fighters in the overdue list
- WHEN the instructor selects 3 checkboxes and clicks "Generar recordatorios"
- THEN the system shows 3 separate message cards, each with its own "Copiar" button

### Requirement: Copy Confirmation

Every copy action MUST trigger a visual confirmation. The system SHALL use the `navigator.clipboard.writeText()` API. If the clipboard API fails (e.g., insecure context), the system SHALL fall back to a text selection + manual copy prompt.

#### Scenario: Edge case — clipboard API unavailable

- GIVEN the app is running in an insecure context (HTTP)
- WHEN the instructor clicks "Copiar"
- THEN the system SHALL select the message text automatically
- AND display an instruction: "Presiona Ctrl+C para copiar"
- AND copy to clipboard SHALL fall back gracefully without error
