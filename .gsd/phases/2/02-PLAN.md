---
phase: 2
plan: 2
wave: 2
gap_closure: false
depends_on:
  - "2.1"
files_modified:
  - js/task-builder.js
  - js/routines-view.js
  - css/components.css
  - js/app.js
autonomous: true
user_setup: []
must_haves:
  truths:
    - "Task Builder modal supports dual task types: Time-Slotted and Flexible/Floating"
    - "Time-slotted tasks validate end > start time, auto-calculate duration, and display overlap warning banners"
    - "Flexible tasks support preset duration chips (15m, 30m, 45m, 1h), custom duration, or anytime checklist mode"
    - "Tasks include categories, searchable emoji picker, reminder toggle, and enable/disable toggle"
    - "Routine task list supports chronological display for timed tasks and Move Up / Move Down reordering controls"
  artifacts:
    - js/task-builder.js
    - js/routines-view.js
    - css/components.css
    - js/app.js
---

# Plan 2.2: Task Builder Drawer, Dual Task Modality (Timed & Flexible), Categories & Reordering

## Objective
Implement the comprehensive Task Builder and Task Manager inside routines, supporting time-slotted tasks with start/end time duration computation, flexible floating tasks, preset chips, categories, icon picker, enable/disable toggles, and accessible task reordering.

## Context
Load these files for context:
- .gsd/SPEC.md
- .gsd/DECISIONS.md
- js/store.js
- js/routines-view.js
- css/components.css

## Tasks

<task type="auto">
  <name>Build Reusable Task Builder Modal with Dual Modality & Validation</name>
  <files>
    js/task-builder.js
    css/components.css
  </files>
  <action>
    1. Create `js/task-builder.js`:
       - Export `taskBuilder` module with `openTaskModal(routineId, taskId = null)`.
       - Mode Switcher: Segmented button toggling between `Time-Slotted` and `Flexible / Floating`.
       - **Time-Slotted Form Section**:
         - Start Time (`<input type="time">`) & End Time (`<input type="time">`).
         - Dynamic duration calculator badge (e.g. "Duration: 1 hr 15 mins").
         - Validation: Requires title, start time, end time, and checks that `endTime > startTime`.
         - Overlap Detection: Checks existing timed tasks in the routine and displays a non-blocking amber warning banner if time overlaps with an existing task.
       - **Flexible / Floating Form Section**:
         - Duration selector with quick preset pills: `15 mins`, `30 mins`, `45 mins`, `60 mins`, `Custom`, or `Anytime (No timer)`.
       - **Shared Fields**:
         - Title (required text input).
         - Description/Notes (optional text area).
         - Category: Dropdown with defaults (`Health`, `Deep Work`, `Focus`, `Wellness`, `Learning`, `Personal`) + custom category input.
         - Searchable / Selectable Emoji Picker: Quick curated emoji chips categorized by Focus, Health, Habits, Lifestyle, with custom emoji input.
         - Reminder Toggle (`reminderEnabled`: boolean).
         - Enabled Toggle (`enabled`: boolean).
       - Form Submit:
         - Validates input.
         - Calls `store.addTask(routineId, taskData)` or `store.updateTask(routineId, taskId, taskData)`.
         - Closes modal and triggers view refresh with success toast.
    2. Add modal, segmented control, time picker, and emoji grid styles in `css/components.css`.
    AVOID: Silently ignoring invalid start/end times or losing task mode state.
    USE: Responsive layout with inline error alerts and dynamic field toggling.
  </action>
  <verify>
    powershell -Command "Test-Path js/task-builder.js; node -e 'import(\"file:///C:/Users/mk722/OneDrive/Desktop/routine%20tracker/js/task-builder.js\").then(() => console.log(\"task-builder.js OK\"))'"
  </verify>
  <done>
    `js/task-builder.js` renders the dual-mode task builder, validates times/durations, detects overlaps, and saves to the state store.
  </done>
</task>

<task type="auto">
  <name>Integrate Task List Management, Enable/Disable Toggling & Reordering</name>
  <files>
    js/routines-view.js
    js/app.js
    css/components.css
  </files>
  <action>
    1. In `js/routines-view.js`:
       - Add Routine Detail / Task Manager Drawer/View when user clicks "Edit Tasks & Schedule".
       - Render structured list of tasks separated into:
         - **Scheduled / Timed Tasks** (sorted chronologically by start time, showing time range pill, duration, icon, title, category, reminder icon, enabled switch, edit button, delete button).
         - **Flexible / Floating Tasks** (showing duration/anytime badge, icon, title, category, enabled switch, Move Up button, Move Down button, edit button, delete button).
       - Implement "+ Add Task" button opening `taskBuilder.openTaskModal(routineId)`.
       - Implement Task Delete with confirmation.
       - Implement Task Enable/Disable instant toggle updating `store.updateTask(...)`.
       - Implement Accessible Reordering for flexible tasks (Move Up / Move Down buttons) updating task orders in `store`.
    2. Wire store event listeners and toast notifications across `js/app.js` and `js/routines-view.js`.
  </action>
  <verify>
    powershell -Command "node -e 'import(\"file:///C:/Users/mk722/OneDrive/Desktop/routine%20tracker/js/routines-view.js\"); console.log(\"routines-view integrated OK\")'"
  </verify>
  <done>
    Routine task manager renders timed and flexible tasks with editing, enabling/disabling, reordering, and deleting.
  </done>
</task>

## Must-Haves
After all tasks complete, verify:
- [ ] Users can add time-slotted tasks with start/end time validation and duration computation.
- [ ] Users can add flexible tasks with duration presets or anytime mode.
- [ ] Categories, icons, reminders, and enabled toggles persist correctly.
- [ ] Reordering flexible tasks with Move Up / Move Down preserves task order.
- [ ] Deleting and editing tasks works seamlessly and persists across page refreshes.

## Success Criteria
- [ ] All 2 tasks verified passing
- [ ] Must-haves confirmed
- [ ] Zero broken links or runtime errors
