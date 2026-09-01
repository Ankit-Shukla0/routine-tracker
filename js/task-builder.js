/**
 * Task Builder Controller
 * Provides a responsive modal/drawer for creating and editing time-slotted and flexible tasks.
 */

import { store } from './store.js';
import { app } from './app.js';
import { clockService } from './clock.js';

const PRESET_CATEGORIES = [
  'Deep Work',
  'Focus',
  'Health',
  'Wellness',
  'Learning',
  'Habits',
  'Personal',
  'Lifestyle'
];

const PRESET_ICONS = [
  '☀️', '💻', '🥗', '🏋️', '📖', '🧘', '🎯', '☕', 
  '🚶', '🛌', '🎧', '💧', '🧹', '📝', '⚡', '💊', '🍎', '🏃'
];

const DURATION_PRESETS = [
  { label: '15m', mins: 15 },
  { label: '30m', mins: 30 },
  { label: '45m', mins: 45 },
  { label: '1h', mins: 60 },
  { label: '1.5h', mins: 90 },
  { label: '2h', mins: 120 },
  { label: 'Anytime', mins: 0 }
];

class TaskBuilderController {
  openTaskModal(routineId, taskId = null) {
    const routine = store.getRoutineById(routineId);
    if (!routine) return;

    const isEdit = taskId !== null && taskId !== undefined && taskId !== '';
    const task = isEdit ? (routine.tasks || []).find((t) => String(t.id) === String(taskId)) : null;

    let selectedType = task ? task.type : 'timed'; // 'timed' | 'flexible'
    let selectedStartTime = task && task.startTime ? task.startTime : '09:00';
    let selectedEndTime = task && task.endTime ? task.endTime : '10:00';
    let selectedDuration = task && typeof task.durationMinutes === 'number' ? task.durationMinutes : 30;
    let selectedCategory = task && task.category ? task.category : PRESET_CATEGORIES[0];
    let selectedIcon = task && task.icon ? task.icon : '📌';
    let isReminderEnabled = task ? task.reminderEnabled !== false : true;
    let isEnabled = task ? task.enabled !== false : true;

    const bodyHtml = `
      <form id="task-builder-form" novalidate>
        <div id="task-error-banner" class="form-error-banner"></div>
        <div id="task-warning-banner" class="form-warning-banner"></div>

        <!-- Task Type Segmented Switcher -->
        <div class="form-group">
          <label class="form-label">Task Type</label>
          <div class="segmented-control" id="task-type-control">
            <button type="button" class="segmented-btn ${selectedType === 'timed' ? 'active' : ''}" data-type="timed">
              🕒 Time-Slotted Task
            </button>
            <button type="button" class="segmented-btn ${selectedType === 'flexible' ? 'active' : ''}" data-type="flexible">
              ✨ Flexible / Habit
            </button>
          </div>
        </div>

        <!-- Title -->
        <div class="form-group">
          <label class="form-label" for="task-title-input">Task Title *</label>
          <input type="text" id="task-title-input" class="form-input" placeholder="e.g. Deep Focus Coding, Morning Sunlight, Workout" value="${task ? this.escapeHtml(task.title) : ''}" required maxlength="80" autofocus />
        </div>

        <!-- Time-Slotted Section -->
        <div id="section-timed-task" style="display: ${selectedType === 'timed' ? 'block' : 'none'};">
          <div class="form-row">
            <div class="form-group">
              <label class="form-label" for="task-start-time">Start Time *</label>
              <input type="time" id="task-start-time" class="form-input" value="${selectedStartTime}" required />
            </div>
            <div class="form-group">
              <label class="form-label" for="task-end-time">End Time *</label>
              <input type="time" id="task-end-time" class="form-input" value="${selectedEndTime}" required />
            </div>
          </div>
          <div style="margin-bottom: var(--space-4); display: flex; align-items: center; justify-content: space-between;">
            <span style="font-size: var(--text-xs); color: var(--text-secondary);">Calculated Duration:</span>
            <span id="calculated-duration-badge" class="badge badge-upcoming" style="font-size: var(--text-xs); padding: 4px 8px;">
              Loading...
            </span>
          </div>
        </div>

        <!-- Flexible / Floating Section -->
        <div id="section-flexible-task" style="display: ${selectedType === 'flexible' ? 'block' : 'none'};">
          <div class="form-group">
            <label class="form-label">Duration Preset</label>
            <div class="duration-chips" id="flexible-duration-chips">
              ${DURATION_PRESETS.map((p) => {
                const isSelected = selectedDuration === p.mins;
                return `
                  <button type="button" class="duration-chip ${isSelected ? 'active' : ''}" data-mins="${p.mins}">
                    ${p.label}
                  </button>
                `;
              }).join('')}
            </div>
          </div>
          <div class="form-group" id="custom-duration-group" style="display: ${[15, 30, 45, 60, 90, 120, 0].includes(selectedDuration) ? 'none' : 'block'};">
            <label class="form-label" for="custom-duration-input">Custom Duration (Minutes)</label>
            <input type="number" id="custom-duration-input" class="form-input" min="1" max="720" value="${selectedDuration || 30}" />
          </div>
        </div>

        <!-- Description / Notes -->
        <div class="form-group">
          <label class="form-label" for="task-desc-input">Description / Notes (Optional)</label>
          <textarea id="task-desc-input" class="form-textarea" placeholder="Checklist details, links, or instructions...">${task ? this.escapeHtml(task.description || '') : ''}</textarea>
        </div>

        <!-- Category & Icon Row -->
        <div class="form-row">
          <div class="form-group">
            <label class="form-label" for="task-category-select">Category</label>
            <select id="task-category-select" class="form-select">
              ${PRESET_CATEGORIES.map((cat) => `
                <option value="${cat}" ${cat === selectedCategory ? 'selected' : ''}>${cat}</option>
              `).join('')}
              <option value="__custom__">+ Custom Category...</option>
            </select>
            <input type="text" id="custom-category-input" class="form-input" placeholder="Enter custom category" style="display: none; margin-top: var(--space-2);" />
          </div>

          <div class="form-group">
            <label class="form-label">Task Icon</label>
            <div class="icon-chips" id="task-icon-chips" style="max-height: 120px; overflow-y: auto; padding: 2px;">
              ${PRESET_ICONS.map((ico) => `
                <div class="icon-chip ${ico === selectedIcon ? 'active' : ''}" data-icon="${ico}">
                  ${ico}
                </div>
              `).join('')}
            </div>
          </div>
        </div>

        <!-- Toggles: Reminders & Enabled -->
        <div class="switch-group" style="margin-bottom: var(--space-3);">
          <div class="switch-label-group">
            <span class="switch-title">🔔 Enable Reminders & Notifications</span>
            <span class="switch-desc">Receive audio chime and notification when task begins.</span>
          </div>
          <label class="switch-toggle">
            <input type="checkbox" id="task-reminder-toggle" ${isReminderEnabled ? 'checked' : ''} />
            <span class="switch-slider"></span>
          </label>
        </div>

        <div class="switch-group">
          <div class="switch-label-group">
            <span class="switch-title">Active in Routine</span>
            <span class="switch-desc">Include in today's active schedule and progress tracking.</span>
          </div>
          <label class="switch-toggle">
            <input type="checkbox" id="task-enabled-toggle" ${isEnabled ? 'checked' : ''} />
            <span class="switch-slider"></span>
          </label>
        </div>
      </form>
    `;

    const footerHtml = `
      <button type="button" class="btn btn-ghost" id="modal-cancel-btn">Cancel</button>
      <button type="button" class="btn btn-primary" id="modal-save-task-btn">
        ${isEdit ? 'Save Task Changes' : 'Add Task to Routine'}
      </button>
    `;

    app.openModal(isEdit ? 'Edit Task' : 'Add New Task', bodyHtml, footerHtml);

    const modalContainer = document.getElementById('modal-container');
    if (!modalContainer) return;

    // Elements
    const typeControl = modalContainer.querySelector('#task-type-control');
    const sectionTimed = modalContainer.querySelector('#section-timed-task');
    const sectionFlexible = modalContainer.querySelector('#section-flexible-task');
    const startTimeInput = modalContainer.querySelector('#task-start-time');
    const endTimeInput = modalContainer.querySelector('#task-end-time');
    const durationBadge = modalContainer.querySelector('#calculated-duration-badge');
    const errorBanner = modalContainer.querySelector('#task-error-banner');
    const warningBanner = modalContainer.querySelector('#task-warning-banner');
    const categorySelect = modalContainer.querySelector('#task-category-select');
    const customCategoryInput = modalContainer.querySelector('#custom-category-input');

    // Update duration & check overlaps helper
    const updateTimedState = () => {
      if (!startTimeInput || !endTimeInput) return;
      const startVal = startTimeInput.value;
      const endVal = endTimeInput.value;
      if (!startVal || !endVal) return;

      const startMins = clockService.parseTimeToMinutes(startVal);
      const endMins = clockService.parseTimeToMinutes(endVal);

      let durationMins = 0;
      if (endMins >= startMins) {
        durationMins = endMins - startMins;
      } else {
        durationMins = (1440 - startMins) + endMins;
      }

      const h = Math.floor(durationMins / 60);
      const m = durationMins % 60;
      let durationText = '';
      if (h > 0 && m > 0) durationText = `${h} hr ${m} min`;
      else if (h > 0) durationText = `${h} hr`;
      else durationText = `${m} min`;

      if (durationBadge) {
        durationBadge.textContent = durationText;
        durationBadge.className = 'badge badge-active';
      }

      // Check overlaps with other timed tasks in routine (excluding self)
      const otherTimedTasks = (routine.tasks || []).filter(
        (t) => String(t.id) !== String(taskId) && t.type !== 'flexible' && t.enabled !== false
      );

      const overlappingTasks = [];
      for (const other of otherTimedTasks) {
        const otherStart = clockService.parseTimeToMinutes(other.startTime);
        const otherEnd = clockService.parseTimeToMinutes(other.endTime);

        // Check range intersection
        if (Math.max(startMins, otherStart) < Math.min(endMins, otherEnd)) {
          overlappingTasks.push(other);
        }
      }

      if (overlappingTasks.length > 0 && warningBanner) {
        const overlapList = overlappingTasks.map(
          (t) => `"${this.escapeHtml(t.title)}" (${clockService.formatDisplayTime(t.startTime)} – ${clockService.formatDisplayTime(t.endTime)})`
        ).join(', ');
        warningBanner.innerHTML = `⚠️ <strong>Time Overlap Warning:</strong> This time slot overlaps with ${overlapList}. You can still save if this is intentional.`;
        warningBanner.style.display = 'block';
      } else if (warningBanner) {
        warningBanner.style.display = 'none';
      }
    };

    updateTimedState();

    startTimeInput?.addEventListener('input', updateTimedState);
    endTimeInput?.addEventListener('input', updateTimedState);

    // Type Switcher
    typeControl?.querySelectorAll('.segmented-btn').forEach((btn) => {
      btn.addEventListener('click', () => {
        typeControl.querySelectorAll('.segmented-btn').forEach((b) => b.classList.remove('active'));
        btn.classList.add('active');
        selectedType = btn.getAttribute('data-type');

        if (selectedType === 'timed') {
          sectionTimed.style.display = 'block';
          sectionFlexible.style.display = 'none';
          updateTimedState();
        } else {
          sectionTimed.style.display = 'none';
          sectionFlexible.style.display = 'block';
          if (warningBanner) warningBanner.style.display = 'none';
        }
      });
    });

    // Flexible Duration Chips
    modalContainer.querySelectorAll('#flexible-duration-chips .duration-chip').forEach((chip) => {
      chip.addEventListener('click', () => {
        modalContainer.querySelectorAll('#flexible-duration-chips .duration-chip').forEach((c) => c.classList.remove('active'));
        chip.classList.add('active');
        const mins = parseInt(chip.getAttribute('data-mins'), 10);
        selectedDuration = mins;
      });
    });

    // Category Custom Input Toggle
    categorySelect?.addEventListener('change', (e) => {
      if (e.target.value === '__custom__') {
        customCategoryInput.style.display = 'block';
        customCategoryInput.focus();
      } else {
        customCategoryInput.style.display = 'none';
        selectedCategory = e.target.value;
      }
    });

    // Icon Chip Selection
    modalContainer.querySelectorAll('#task-icon-chips .icon-chip').forEach((chip) => {
      chip.addEventListener('click', () => {
        modalContainer.querySelectorAll('#task-icon-chips .icon-chip').forEach((c) => c.classList.remove('active'));
        chip.classList.add('active');
        selectedIcon = chip.getAttribute('data-icon');
      });
    });

    // Cancel Button
    modalContainer.querySelector('#modal-cancel-btn')?.addEventListener('click', () => app.closeModal());

    // Save Task Button
    modalContainer.querySelector('#modal-save-task-btn')?.addEventListener('click', () => {
      const titleInput = modalContainer.querySelector('#task-title-input');
      const descInput = modalContainer.querySelector('#task-desc-input');
      const reminderInput = modalContainer.querySelector('#task-reminder-toggle');
      const enabledInput = modalContainer.querySelector('#task-enabled-toggle');

      const titleVal = titleInput ? titleInput.value.trim() : '';
      const descVal = descInput ? descInput.value.trim() : '';

      // Validation
      if (!titleVal) {
        if (errorBanner) {
          errorBanner.textContent = 'Please enter a task title.';
          errorBanner.style.display = 'block';
        }
        if (titleInput) titleInput.focus();
        return;
      }

      let startVal = '09:00';
      let endVal = '10:00';
      let durationVal = 30;

      if (selectedType === 'timed') {
        startVal = startTimeInput ? startTimeInput.value.trim() : '';
        endVal = endTimeInput ? endTimeInput.value.trim() : '';

        if (!startVal || !endVal) {
          if (errorBanner) {
            errorBanner.textContent = 'Please specify both start time and end time.';
            errorBanner.style.display = 'block';
          }
          return;
        }

        const sMins = clockService.parseTimeToMinutes(startVal);
        const eMins = clockService.parseTimeToMinutes(endVal);

        if (sMins === eMins) {
          if (errorBanner) {
            errorBanner.textContent = 'End time must be different from start time.';
            errorBanner.style.display = 'block';
          }
          return;
        }

        durationVal = eMins >= sMins ? (eMins - sMins) : ((1440 - sMins) + eMins);
      } else {
        durationVal = selectedDuration;
      }

      // Resolve category
      let finalCategory = selectedCategory;
      if (categorySelect && categorySelect.value === '__custom__') {
        finalCategory = customCategoryInput.value.trim() || 'Custom';
      } else if (categorySelect) {
        finalCategory = categorySelect.value || selectedCategory;
      }

      const taskPayload = {
        title: titleVal,
        description: descVal,
        type: selectedType,
        startTime: startVal,
        endTime: endVal,
        durationMinutes: durationVal,
        category: finalCategory,
        icon: selectedIcon,
        reminderEnabled: reminderInput ? reminderInput.checked : true,
        enabled: enabledInput ? enabledInput.checked : true
      };

      if (isEdit) {
        const updated = store.updateTask(routineId, taskId, taskPayload);
        if (updated) {
          app.showToast('Task Updated', `Saved changes to "${titleVal}".`, 'success');
          app.closeModal();
        } else {
          if (errorBanner) {
            errorBanner.textContent = 'Failed to update task: task not found.';
            errorBanner.style.display = 'block';
          }
          app.showToast('Update Failed', 'Could not find task to update.', 'error');
        }
      } else {
        const added = store.addTask(routineId, taskPayload);
        if (added) {
          app.showToast('Task Added', `Added "${titleVal}" to routine.`, 'success');
          app.closeModal();
        } else {
          if (errorBanner) {
            errorBanner.textContent = 'Failed to add task to routine.';
            errorBanner.style.display = 'block';
          }
        }
      }
    });
  }

  escapeHtml(str) {
    if (!str) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }
}

export const taskBuilder = new TaskBuilderController();
