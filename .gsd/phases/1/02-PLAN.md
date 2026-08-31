---
phase: 1
plan: 2
wave: 2
gap_closure: false
depends_on:
  - "1.1"
files_modified:
  - js/storage.js
  - js/clock.js
  - js/theme.js
  - js/store.js
  - js/app.js
autonomous: true
user_setup: []
must_haves:
  truths:
    - "Storage adapter handles Schema Version 1, automatic corruption backup, safe migrations, and zero data loss"
    - "Centralized Clock Service provides minute-level reactive ticks, date rollover detection, and system local time formatting"
    - "Theme manager toggles between dark and light themes and synchronizes with localStorage and system preferences"
    - "Reactive Store coordinates state updates through a pub/sub event bus with actions for routine and task management"
    - "App bootstrap binds navigation, theme toggling, live date display, and welcome card interactions"
  artifacts:
    - js/storage.js
    - js/clock.js
    - js/theme.js
    - js/store.js
    - js/app.js
---

# Plan 1.2: Core State Architecture, Resilient Storage & Real-Time Clock Engine

## Objective
Implement the decoupled reactive state store, resilient schema-versioned local storage engine, centralized real-time clock service, theme manager, and app orchestrator to establish an extensible, bulletproof foundation for the Routine Tracker.

## Context
Load these files for context:
- .gsd/SPEC.md
- .gsd/DECISIONS.md
- .gsd/phases/1/01-PLAN.md
- index.html

## Tasks

<task type="auto">
  <name>Build Resilient Local Storage Adapter with Versioning & Corruption Guard</name>
  <files>
    js/storage.js
  </files>
  <action>
    Create `js/storage.js`:
    1. Define `SCHEMA_VERSION = 1` and initial default state:
       - `routines`: `[]`
       - `activeRoutineId`: `null`
       - `logs`: `{}` (keyed by `YYYY-MM-DD`)
       - `preferences`: `{ theme: "dark", soundEnabled: true, notificationsEnabled: false, notificationLeadMinutes: 5, audioVolume: 0.7 }`
       - `streaks`: `{ currentStreak: 0, longestStreak: 0, lastActiveDate: null }`
    2. Implement `loadState()` with:
       - JSON parse safety wrapped in try/catch.
       - If corruption detected: snapshot corrupt data to `routine_tracker_corrupt_backup_<timestamp>`, log warning, and recover safely without silent data wipe.
       - Schema version validation and migration runner hook (`migrate(data, fromVersion, toVersion)`).
    3. Implement `saveState(state)`:
       - Atomic serialization to `localStorage.setItem("routine_tracker_v1", JSON.stringify(data))`.
       - Debounce support to avoid disk thrashing during rapid updates.
    4. Implement `exportData()` and `importData(jsonString)` methods with schema validation.
    AVOID: Direct localStorage calls in UI components.
    USE: Isolated storage adapter module with defensive parsing.
  </action>
  <verify>
    powershell -Command "Test-Path js/storage.js; node -e 'import(\"./js/storage.js\").then(() => console.log(\"storage.js ES module OK\")).catch(err => console.error(err))'"
  </verify>
  <done>
    `js/storage.js` exports `loadState`, `saveState`, `exportData`, `importData`, and manages Schema Version 1 safely.
  </done>
</task>

<task type="auto">
  <name>Build Centralized Clock Engine and Theme Controller</name>
  <files>
    js/clock.js
    js/theme.js
  </files>
  <action>
    1. Create `js/clock.js`:
       - Emits minute-level ticks (`tick:minute`) and second ticker for active countdowns.
       - Aligns timing to the exact next minute boundary using `setTimeout` + `setInterval(..., 60000)` to eliminate clock drift.
       - Detects midnight / date rollover and emits `clock:dateChange` event.
       - Provides helper methods: `getTodayDateStr()` (`YYYY-MM-DD`), `getCurrentTimeStr()` (`HH:MM`), `formatDisplayDate(date)`, `getDayOfWeekIndex()`.
    2. Create `js/theme.js`:
       - Detects stored preference (`localStorage`) or OS preference (`window.matchMedia('(prefers-color-scheme: dark)')`).
       - Toggles `data-theme="dark" | "light"` on `document.documentElement`.
       - Updates toggle button icon/label and broadcasts `theme:changed` event.
    AVOID: Running continuous sub-second DOM updates for static UI components.
    USE: Minute-aligned ticker and event subscribers.
  </action>
  <verify>
    powershell -Command "Test-Path js/clock.js; Test-Path js/theme.js; node -e 'import(\"./js/clock.js\"); import(\"./js/theme.js\"); console.log(\"clock & theme modules OK\")'"
  </verify>
  <done>
    `js/clock.js` and `js/theme.js` are implemented with drift-free minute alignment and clean dark/light switching.
  </done>
</task>

<task type="auto">
  <name>Build Reactive Store and App Initializer</name>
  <files>
    js/store.js
    js/app.js
  </files>
  <action>
    1. Create `js/store.js`:
       - Single source of truth containing state: `routines`, `activeRoutineId`, `logs`, `preferences`, `streaks`, and `currentView`.
       - Lightweight event emitter: `store.on(event, callback)`, `store.off(event, callback)`, `store.emit(event, data)`.
       - Mutation methods: `setRoutines`, `addRoutine`, `updateRoutine`, `deleteRoutine`, `setActiveRoutine`, `logTaskStatus`, `updatePreferences`, `updateStreak`.
       - Persistence pipeline: Automatically triggers debounced `saveState` on mutations and emits `state:changed`.
       - Provide optional sample routine factory function (`createSampleRoutine()`) returning a non-hardcoded realistic starter routine (e.g. Morning ritual, Focused work block, Evening wind-down).
    2. Create `js/app.js`:
       - App bootstrap script loaded as `<script type="module" src="js/app.js">`.
       - Initializes storage, clock, theme, and store.
       - Binds view switcher navigation (Dashboard, My Routines, Progress, Settings, Mobile Nav).
       - Updates top bar date/time dynamically on clock ticks.
       - Handles welcome card buttons:
         - "Create My First Routine" -> Switches to Routines view / opens Routine Builder.
         - "Start With Sample Routine" -> Creates and activates sample routine cleanly via `store.addRoutine()`.
  </action>
  <verify>
    powershell -Command "Test-Path js/store.js; Test-Path js/app.js; node -e 'import(\"./js/store.js\"); console.log(\"store module OK\")'"
  </verify>
  <done>
    `js/store.js` and `js/app.js` are implemented and wired to the HTML shell, ready for Phase 2 feature expansion.
  </done>
</task>

## Must-Haves
After all tasks complete, verify:
- [ ] State persists to `localStorage` and reloads accurately on page refresh.
- [ ] Theme toggling switches between Dark and Light mode without layout jitter.
- [ ] Top bar reflects current live date and responds to navigation clicks.
- [ ] Welcome card handles both "Create My First Routine" and "Start With Sample Routine" seamlessly.

## Success Criteria
- [ ] All 3 tasks verified passing
- [ ] Must-haves confirmed
- [ ] All ES modules import cleanly without syntax or runtime errors
