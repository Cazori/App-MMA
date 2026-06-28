# Exploration: Payment/Collection Module

## Business Context
- Real app for "Guerreros de Dios MMA" club (Cali, Colombia)
- Club currently handles payments in cash or bank transfer with NO formal tracking
- Instructors lose money because students delay payments with no follow-up system
- App already exists with fighter management, physical metrics, profiles, sub-clubs, etc.

## Current State
- **Stack**: React 19 + TypeScript 6 + Vite 8 SPA with Firebase 12 (Auth, Firestore, Storage)
- **Data model**: Single `fighters` collection. Fighter interface with id, name, photoUrl, physicalMetrics, disciplines, sparrings, customMetrics, metricSnapshots, socialMedia, primaryStyle, role, coachRole
- **Auth**: Google Sign-in + admin key fallback. Hardcoded admin email `juan939srz@gmail.com`
- **Navigation**: 6 pages (dashboard, fighters, tutorials, alianzas, shop, clubinfo), lazy-loaded with Suspense
- **UI patterns**: Modal forms with focus trap, Confirm dialog (Promise<boolean>), Toast notifications with auto-dismiss
- **Firestore rules**: Wide open (allow read/write: if true)
- **Zero payment-related code** anywhere

## Approach Recommendation
**Manual in-app tracking as first iteration.** No payment gateway in MVP.

## Affected Files

### Existing files to modify
- `src/types/mma.ts` — Add Payment data types
- `src/services/storage.ts` — Add Firestore CRUD for payments
- `src/App.tsx` — Add PayPageKey, lazy-load components
- `src/components/Topbar.tsx` — Add payments nav item
- `src/components/Dashboard.tsx` — Payment summary widget
- `src/components/FighterProfile.tsx` — Payment status badge + history
- `firestore.rules` — Tighten security for payment data

### New files to create
- `src/components/PaymentPanel.tsx` — Main payment management view
- `src/components/PaymentForm.tsx` — Record new/edit payment
- `src/components/PaymentHistory.tsx` — Per-fighter payment history
- `src/utils/paymentAlerts.ts` — Overdue detection, WhatsApp reminder generation

## Schema Recommendation
Separate `/payments` Firestore collection (not embedded in fighters).

## Risks
- Firestore rules wide open — must enforce auth on payment data
- No treasurer role separation
- No offline sync
- Hardcoded fee amounts — store in config doc
