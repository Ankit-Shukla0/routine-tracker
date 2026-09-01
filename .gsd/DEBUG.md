# Debug Session: Phase 2 Post-Verification Bugs

## Symptom

1. **Bug 1 — Timed Task Edit Persistence:**
   - **When:** Editing a timed task (such as "Breakfast") to test overlaps or change times.
   - **Expected:** The edited `startTime` and `endTime` are immediately saved to store, persisted to localStorage, and reflected in the task card list.
   - **Actual:** In some scenarios, the saved task displayed the previous times or failed to persist immediately due to debounced persistence and non-string-safe ID lookups.

2. **Bug 2 — Internal Metadata / Notes Display in Task Cards:**
   - **When:** Viewing tasks in the routine details list.
   - **Expected:** Clean user-facing presentation of category pill, time pill, reminder status pill, and properly structured task notes/description block without raw dot-concatenated strings.
   - **Actual:** Descriptions were appended inline directly next to category pills (`[Health] • cfdfdf`), which appeared as leaking internal metadata/color hashes when testing arbitrary strings.

3. **Overlap Validation Verification:**
   - **Requirement:** Clear overlap warning before save when two timed tasks intersect (e.g., Morning Workout: 07:00–08:00 and Breakfast: 07:30–08:30) while preserving entered values.

## Evidence Gathered

1. In `js/routines-view.js` (lines 576-577, 624-625):
   `${task.category ? '<span class="task-category-pill">' + task.category + '</span>' : ''}`
   `${task.description ? '<span style="color: var(--text-muted); font-size: 11px;">• ' + task.description + '</span>' : ''}`
   rendered task descriptions inline with category pills. If test values or short notes were present, they looked like leaked internal metadata instead of clear task notes.
2. In `js/store.js`:
   `persist()` used a debounced 150ms timeout `setTimeout(() => saveState(this.state), 150)` which risked loss of synchronous sync if page refreshed or reloaded right after save.
   `updateTask`, `deleteTask`, `getRoutineById`, etc., used strict equality `t.id === taskId` rather than string-safe comparison `String(t.id) === String(taskId)`.
3. In `js/task-builder.js`:
   `categorySelect` reading and overlap warning banner formatting needed explicit styling, full multi-task overlap display, and string-safe task lookups.

## Hypotheses

| # | Hypothesis | Likelihood | Status |
|---|------------|------------|--------|
| 1 | Inline description rendering (`• ${task.description}`) next to category pill causes notes/test data to look like leaked metadata; separating into dedicated `.task-desc-line` and adding a distinct reminder badge fixes UI ambiguity. | 95% | CONFIRMED & RESOLVED |
| 2 | Asynchronous debounced persistence (150ms) and strict `===` ID matching can cause race conditions or missed updates on task edit; switching to immediate synchronous save on mutations and `String(id)` matching guarantees reliable persistence and rerender. | 95% | CONFIRMED & RESOLVED |
| 3 | Overlap detection warning can be enriched to display all conflicting tasks with formatted time ranges without preventing valid saves. | 90% | CONFIRMED & RESOLVED |

## Resolution

**Root Cause:**
1. In `js/routines-view.js`, task descriptions were rendered as an inline bullet string (`• ${task.description}`) right after the category pill. When arbitrary test strings or hex values were typed, it looked like leaking internal metadata/color hash.
2. In `js/store.js`, state persistence was debounced by 150ms and task/routine lookups used strict equality (`===`) rather than string-safe comparisons (`String(t.id) === String(taskId)`).
3. In `js/task-builder.js`, category resolution and multi-task overlap detection needed string-safe filtering and clear visual separation.

**Fix Applied:**
1. **Task Card UI Formatting (`js/routines-view.js` & `css/components.css`)**:
   - Isolated category badge as `<span class="task-category-pill">`.
   - Added distinct reminder badge `<span class="task-reminder-pill">🔔 Reminder on</span>`.
   - Separated task notes into their own dedicated line `<div class="task-desc-line">📝 ...</div>` only rendered when description exists and is non-empty.
2. **Synchronous Atomic Persistence & String-Safe Lookups (`js/store.js`)**:
   - `persist()` now executes `saveState(this.state)` immediately and synchronously.
   - All lookups (`getRoutineById`, `updateRoutine`, `deleteRoutine`, `addTask`, `updateTask`, `deleteTask`) use string-safe comparison (`String(id)`).
3. **Robust Overlap Validation & Input Preservation (`js/task-builder.js`)**:
   - Enhanced interval intersection calculation to exclude the active task (`String(t.id) !== String(taskId)`).
   - Formats clear warning banner listing all conflicting tasks and their time slots without blocking valid saves, preserving user-entered form values.

**Empirical Verification:**
- **Browser Subagent Test**:
  - Tested editing "Breakfast" to overlapping time `07:30 - 08:30` against "Morning Workout" `07:00 - 08:00`.
  - Overlap warning banner displayed: `⚠️ Note: This time window overlaps with "Morning Workout" (7:00 AM - 8:00 AM).`
  - Preserved entered inputs (`07:30`, `08:30`, `Personal`, `Healthy morning meal and juice`).
  - Saved task changes: card updated immediately to `🕒 7:30 AM – 8:30 AM (1h)` with category pill `Personal` and note `📝 Healthy morning meal and juice`.
  - Re-edited "Breakfast" to non-overlapping time `08:00 - 08:30`: warning banner cleared, card updated immediately to `🕒 8:00 AM – 8:30 AM (30m)`.
- **Automated Unit Tests (`tests/test_phase2_fixes.mjs`)**:
  - 13/13 tests passed covering timed task edits, synchronous localStorage writes, overlap calculation math, and string/number ID safety.
