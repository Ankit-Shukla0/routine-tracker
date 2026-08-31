---
phase: 2
plan: 1
wave: 1
gap_closure: false
depends_on: []
files_modified:
  - js/routines-view.js
  - css/components.css
  - js/app.js
autonomous: true
user_setup: []
must_haves:
  truths:
    - "User can view all custom routines in a responsive card grid with active status, day pills, and summary metrics"
    - "User can create and edit routines with custom name, description, color, icon, and Mon–Sun day scheduling"
    - "User can duplicate a routine into an independent deep copy with unique IDs"
    - "User can safely delete a routine with modal confirmation and automatic fallback"
    - "Empty state is presented when no routines exist with a prominent '+ Create Routine' call to action"
  artifacts:
    - js/routines-view.js
    - css/components.css
    - js/app.js
---

# Plan 2.1: "My Routines" Dashboard, Routine Modal Form & Schedule Management

## Objective
Implement the complete "My Routines" management experience, allowing users to create, view, edit, duplicate, activate, and delete custom routines with day-of-week scheduling in a modern glassmorphic card grid.

## Context
Load these files for context:
- .gsd/SPEC.md
- .gsd/DECISIONS.md
- js/store.js
- js/app.js
- css/components.css

## Tasks

<task type="auto">
  <name>Build Routine Cards View, Metrics Calculator & Action Handlers</name>
  <files>
    js/routines-view.js
    css/components.css
  </files>
  <action>
    1. Create `js/routines-view.js`:
       - Export `routinesView` controller with `init()`, `render()`, and event binders.
       - Render routine card grid inside `#routines-content-area`:
         - Header with section title, description, and "+ Create New Routine" primary button.
         - Empty state banner if 0 routines exist.
         - Routine cards displaying: icon badge, routine name, description, active/inactive pill, color indicator, Mon–Sun active day pills (M T W T F S S), total task count, total calculated duration (e.g. "4h 30m"), and action buttons ("Set Active", "Edit Routine", "Duplicate", "Delete").
       - Implement "Set as Active" action updating `store.setActiveRoutine(id)`.
       - Implement "Duplicate" action calling `store.duplicateRoutine(id)` and showing a confirmation toast.
       - Implement "Delete" action with confirmation modal warning the user, deleting safely via `store.deleteRoutine(id)`, and ensuring fallback to another routine if the active routine was deleted.
    2. Add card grid, day pill, and action menu styles in `css/components.css`.
    AVOID: Directly mutating DOM without subscribing to `store` events.
    USE: Reactive rendering connected to `store.on('state:changed', ...)` and `store.on('routine:*', ...)`.
  </action>
  <verify>
    powershell -Command "Test-Path js/routines-view.js; node -e 'import(\"file:///C:/Users/mk722/OneDrive/Desktop/routine%20tracker/js/routines-view.js\").then(() => console.log(\"routines-view.js OK\"))'"
  </verify>
  <done>
    `js/routines-view.js` renders the routines grid, calculates task counts/durations, and handles activation, duplication, and safe deletion.
  </done>
</task>

<task type="auto">
  <name>Build Routine Creation & Edit Modal Form</name>
  <files>
    js/routines-view.js
    js/app.js
  </files>
  <action>
    1. Extend `js/routines-view.js` with `openRoutineModal(routineId = null)`:
       - Modal form supporting both Create and Edit modes.
       - Fields:
         - Routine Name (required input with validation).
         - Description (optional text area).
         - Active Days Selector: 7 toggleable pill buttons (Mon, Tue, Wed, Thu, Fri, Sat, Sun), mapped to day indices [1, 2, 3, 4, 5, 6, 0].
         - Color Accent Picker: Curated palette of vibrant accents (Indigo, Violet, Emerald, Amber, Rose, Cyan, Coral).
         - Icon Selector: Quick selectable emoji/icon chips (⚡, 🚀, 💼, 🧘, 🏋️, 📚, 🌅, 🌙).
       - Form submit handler:
         - Validates that name is not empty and at least one day is selected.
         - Calls `store.addRoutine(...)` for new routines or `store.updateRoutine(id, ...)` for existing routines.
         - Closes modal, refreshes view, and shows success toast.
    2. Update `js/app.js` to initialize `routinesView` on app bootstrap and re-render on routine events.
    AVOID: Silent validation failures or unhandled empty inputs.
    USE: Clear inline validation error messages and accessible focus.
  </action>
  <verify>
    powershell -Command "node -e 'import(\"file:///C:/Users/mk722/OneDrive/Desktop/routine%20tracker/js/app.js\"); console.log(\"app bootstrap import OK\")'"
  </verify>
  <done>
    Routine modal form allows creating and editing custom routines with day multi-selection, color/icon picking, and store persistence.
  </done>
</task>

## Must-Haves
After all tasks complete, verify:
- [ ] Users can create a new routine with custom name, color, icon, and active days.
- [ ] Routine cards display active day pills and accurate task/duration metrics.
- [ ] Routine duplication creates an independent deep copy with new IDs.
- [ ] Deleting a routine requires confirmation and falls back safely if active.

## Success Criteria
- [ ] All tasks verified passing
- [ ] Must-haves confirmed
- [ ] Zero unhandled exceptions
