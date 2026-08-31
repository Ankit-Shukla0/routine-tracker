# DECISIONS.md — Architecture Decision Records

> **Purpose**: Log significant technical decisions and their rationale.

---

## Decisions

### [DECISION-001] Tech Stack & Architecture Selection

**Date**: 2026-09-01
**Status**: Accepted

#### Context
The workspace was inspected and determined to be greenfield with no pre-existing legacy framework dependencies. We needed to choose an architectural stack that delivers high performance, instant load times, rich animations, offline capability, and zero fragile build-chain dependencies.

#### Decision
Use Modular Vanilla JavaScript (ES6 Modules), Semantic HTML5, and a Custom Vanilla CSS Design System with custom properties (CSS variables).

#### Rationale
- Zero build steps or package manager lock-in needed to run or deploy.
- Blazing-fast client-side execution, low memory footprint, and native Web API support (Web Audio API, Notifications API, LocalStorage).
- Clean separation of concerns through modular ES modules (`store.js`, `timeline.js`, `alerts.js`, `audio.js`, `analytics.js`).

#### Consequences
- No external heavy dependencies to manage or update.
- Must structure modular state management cleanly.

---

### [DECISION-002] Dual Task Modeling (Time-Slotted vs. Flexible/Floating)

**Date**: 2026-09-01
**Status**: Accepted

#### Context
Users have both strict daily commitments (e.g. 08:00–09:00 Workout) and flexible habits (e.g. 20 mins reading, anytime hydration checklist).

#### Decision
Support two distinct task modalities within each routine:
1. `time-slotted`: Has `startTime` (HH:MM) and `endTime` (HH:MM), participating in live timeline placement and missed status triggers.
2. `flexible`: Has optional `durationMinutes` or operates as an anytime daily checklist item.

#### Rationale
Allows complete customization of the user's daily life without forcing artificial start times on fluid tasks.

---

### [DECISION-003] Missed Task Transition and Retroactive Actions

**Date**: 2026-09-01
**Status**: Accepted

#### Context
When a user's scheduled task window passes without being marked completed, the app needs to indicate this without wiping or locking out data.

#### Decision
Tasks automatically transition to `missed` status once `currentTime > endTime` if uncompleted. Users can click to retroactively mark as completed or reschedule to a new time.

#### Rationale
Maintains accountability while allowing real-world schedule flexibility.

---

### [DECISION-004] Multi-Channel Alert Engine with User Preference Controls

**Date**: 2026-09-01
**Status**: Accepted

#### Context
Users need task notifications that are helpful and non-intrusive.

#### Decision
Implement three complementary alert mechanisms:
1. Native Browser Notifications (Web Notifications API)
2. Synthetic subtle harmonic audio chimes via Web Audio API (no external MP3 asset dependency)
3. In-app floating toast banners

Each channel is independently toggleable in user settings.

---

### [DECISION-005] Theme System: Dark Theme Default with Light Theme Toggle

**Date**: 2026-09-01
**Status**: Accepted

#### Context
A sleek, modern aesthetic is desired.

#### Decision
Implement a Dark Theme by default featuring glassmorphic cards, luminous status accents, and high-contrast typography (Inter/Outfit fonts), paired with a seamless Light Theme toggle persisted in localStorage.

---

## Phase 1 Decisions: Foundation, Design System & Core State Architecture

**Date**: 2026-09-01

### Scope
- **App Shell**: Collapsible left Sidebar + Main Content Dashboard.
- **Sidebar Navigation**: Dashboard (Today's Timeline), My Routines, Progress / Stats, Settings.
- **Mobile Experience**: Responsive transformation into bottom navigation bar and mobile drawer.
- **Top Bar**: Current date/day header, active routine selector dropdown, and live daily completion percentage badge.
- **First-Time User Onboarding**: Polished Welcome card with two clear choices:
  1. *Create My First Routine* (starts clean and blank)
  2. *Start With Sample Routine* (optional starting template, never hardcoded as default).

### Approach & Architecture
- **State Management**: Reactive, single-source-of-truth Store (`store.js`) with pub/sub event bus (`store.on(event, handler)`).
- **Storage Layer**: Isolated resilient storage adapter (`storage.js`) featuring schema versioning (`version: 1`), safe migration fallback, corruption protection (auto-backup prior to repair), and zero silent data wiping.
- **Real-Time Clock Service**: Centralized clock ticker (`clock.js`) emitting minute-level ticks to prevent high-frequency re-render thrashing, with midnight/date-rollover detection and local system time alignment.
- **Design Tokens**: Modular CSS variables in `tokens.css` with Indigo/Violet primary, Emerald (completed), Amber (active), Coral/Rose (missed), glassmorphic backdrops (`backdrop-filter: blur(12px)`), accessible contrast, and `prefers-reduced-motion` compliance.

### Data Schema Definition
- **Routine Schema**: `{ id, name, description, color, icon, daysActive: [0..6], createdAt, updatedAt, tasks: [] }`
- **Task Schema**: `{ id, title, description, type: "timed" | "flexible", startTime, endTime, durationMinutes, category, icon, enabled, order, reminderEnabled, createdAt, updatedAt }`
- **Daily Log Schema**: `{ [dateStr]: { tasks: { [taskId]: { completed, completedAt, missed, rescheduledTime, notes } }, updatedAt } }`
- **User Preferences**: `{ theme: "dark" | "light", soundEnabled: boolean, notificationsEnabled: boolean, notificationLeadMinutes: number, audioVolume: number }`

---

*Last updated: 2026-09-01*

