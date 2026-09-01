/**
 * Routines View Controller
 * Manages routine listings, CRUD forms, schedule assignments, duplication, and safe deletion.
 */

import { store } from './store.js';
import { app } from './app.js';
import { clockService } from './clock.js';
import { taskBuilder } from './task-builder.js';

const DAYS_OF_WEEK = [
  { index: 1, label: 'Mon', short: 'M' },
  { index: 2, label: 'Tue', short: 'T' },
  { index: 3, label: 'Wed', short: 'W' },
  { index: 4, label: 'Thu', short: 'T' },
  { index: 5, label: 'Fri', short: 'F' },
  { index: 6, label: 'Sat', short: 'S' },
  { index: 0, label: 'Sun', short: 'S' }
];

const PRESET_COLORS = [
  '#6366f1', // Indigo
  '#8b5cf6', // Violet
  '#ec4899', // Pink
  '#f43f5e', // Rose
  '#f59e0b', // Amber
  '#10b981', // Emerald
  '#06b6d4', // Cyan
  '#3b82f6'  // Blue
];

const PRESET_ICONS = ['⚡', '🚀', '💻', '🧘', '🏋️', '📚', '🌅', '🌙', '🎯', '🥗', '💡', '🎨'];

class RoutinesViewController {
  constructor() {
    this.selectedRoutineForDetail = null;
  }

  init() {
    this.render();

    // Subscribe to store events
    store.on('state:changed', () => this.render());
    store.on('activeRoutine:changed', () => this.render());
    store.on('routine:added', () => this.render());
    store.on('routine:updated', () => this.render());
    store.on('routine:deleted', () => this.render());
    store.on('task:added', () => this.render());
    store.on('task:updated', () => this.render());
    store.on('task:deleted', () => this.render());
  }

  render() {
    const container = document.getElementById('routines-content-area');
    if (!container) return;

    if (this.selectedRoutineForDetail) {
      this.renderRoutineDetail(container);
    } else {
      this.renderRoutinesList(container);
    }
  }

  // --- 1. Routines Grid List View ---

  renderRoutinesList(container) {
    const routines = store.getRoutines();
    const active = store.getActiveRoutine();

    let html = `
      <div class="view-header">
        <div class="view-title-group">
          <h2>My Custom Routines</h2>
          <p>Design, customize, and assign your routines across the week.</p>
        </div>
        <button id="btn-create-routine" class="btn btn-primary">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <line x1="12" y1="5" x2="12" y2="19"></line>
            <line x1="5" y1="12" x2="19" y2="12"></line>
          </svg>
          Create New Routine
        </button>
      </div>
    `;

    if (routines.length === 0) {
      html += `
        <div class="glass-card welcome-card" style="text-align: center; padding: var(--space-10) var(--space-6);">
          <div style="font-size: 3rem; margin-bottom: var(--space-3);">📋</div>
          <h3 style="font-size: var(--text-xl); margin-bottom: var(--space-2);">No routines found</h3>
          <p style="margin-bottom: var(--space-6); max-width: 480px; margin-left: auto; margin-right: auto;">
            Create your first custom daily routine to schedule time-slotted tasks, track flexible habits, and get productive.
          </p>
          <div style="display: flex; gap: var(--space-4); justify-content: center; flex-wrap: wrap;">
            <button id="btn-empty-create" class="btn btn-primary btn-lg">Create Routine</button>
            <button id="btn-empty-sample" class="btn btn-secondary btn-lg">Load Starter Template</button>
          </div>
        </div>
      `;
    } else {
      html += `<div class="routines-grid">`;

      routines.forEach((r) => {
        const isActive = active && active.id === r.id;
        const totalTasks = (r.tasks || []).length;
        const timedCount = (r.tasks || []).filter((t) => t.type !== 'flexible').length;
        const flexCount = totalTasks - timedCount;
        const totalDurationMins = this.calculateRoutineTotalMinutes(r);
        const durationFormatted = this.formatDurationMinutes(totalDurationMins);

        html += `
          <div class="routine-card ${isActive ? 'active-routine' : ''}" style="border-top: 3px solid ${r.color || 'var(--primary-500)'};">
            <div class="routine-card-header">
              <div class="routine-title-box">
                <div class="routine-icon-badge" style="background: ${r.color ? `${r.color}22` : 'var(--primary-gradient)'}; color: ${r.color || '#6366f1'}; border: 1px solid ${r.color ? `${r.color}55` : 'transparent'};">
                  ${r.icon || '⚡'}
                </div>
                <div>
                  <h3 class="routine-name">${this.escapeHtml(r.name)}</h3>
                  ${r.description ? `<p class="routine-desc">${this.escapeHtml(r.description)}</p>` : ''}
                </div>
              </div>
              <span class="badge ${isActive ? 'badge-active' : 'badge-upcoming'}">
                ${isActive ? '● Active' : 'Inactive'}
              </span>
            </div>

            <!-- Active Day Pills -->
            <div class="day-pills-row">
              ${DAYS_OF_WEEK.map((d) => {
                const isDayActive = Array.isArray(r.daysActive) && r.daysActive.includes(d.index);
                return `
                  <div class="day-pill ${isDayActive ? 'active' : ''}" title="${d.label}: ${isDayActive ? 'Active' : 'Off'}">
                    ${d.short}
                  </div>
                `;
              }).join('')}
            </div>

            <!-- Metrics -->
            <div class="routine-metrics">
              <div class="routine-metric-item">
                <span>Tasks:</span>
                <strong>${totalTasks}</strong>
                <span style="color: var(--text-muted);">(${timedCount} timed, ${flexCount} flex)</span>
              </div>
              <div class="routine-metric-item">
                <span>Duration:</span>
                <strong>${durationFormatted}</strong>
              </div>
            </div>

            <!-- Actions Footer -->
            <div class="routine-card-actions">
              ${!isActive ? `
                <button class="btn btn-sm btn-secondary btn-set-active" data-id="${r.id}">
                  Set Active
                </button>
              ` : `
                <span style="font-size: var(--text-xs); font-weight: 700; color: var(--primary-400);">Current Schedule</span>
              `}

              <div style="display: flex; gap: var(--space-2);">
                <button class="btn btn-sm btn-secondary btn-edit-routine" data-id="${r.id}" title="Manage tasks & settings">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 20h9"></path><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"></path></svg>
                  Manage
                </button>
                <button class="icon-btn btn-duplicate-routine" data-id="${r.id}" title="Duplicate Routine">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg>
                </button>
                <button class="icon-btn btn-danger-icon btn-delete-routine" data-id="${r.id}" title="Delete Routine">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
                </button>
              </div>
            </div>
          </div>
        `;
      });

      html += `</div>`;
    }

    container.innerHTML = html;
    this.bindListEvents(container);
  }

  bindListEvents(container) {
    // Create button
    const btnCreate = container.querySelector('#btn-create-routine');
    if (btnCreate) {
      btnCreate.addEventListener('click', () => this.openRoutineModal());
    }

    const btnEmptyCreate = container.querySelector('#btn-empty-create');
    if (btnEmptyCreate) {
      btnEmptyCreate.addEventListener('click', () => this.openRoutineModal());
    }

    const btnEmptySample = container.querySelector('#btn-empty-sample');
    if (btnEmptySample) {
      btnEmptySample.addEventListener('click', () => {
        const sample = store.createSampleRoutine();
        const created = store.addRoutine(sample);
        store.setActiveRoutine(created.id);
        app.showToast('Starter Template Added', `Loaded "${created.name}" successfully!`, 'success');
      });
    }

    // Set Active
    container.querySelectorAll('.btn-set-active').forEach((btn) => {
      btn.addEventListener('click', () => {
        const id = btn.getAttribute('data-id');
        if (id) {
          store.setActiveRoutine(id);
          const r = store.getRoutineById(id);
          app.showToast('Active Routine Set', `"${r?.name || 'Routine'}" is now your active schedule.`, 'success');
        }
      });
    });

    // Manage/Edit
    container.querySelectorAll('.btn-edit-routine').forEach((btn) => {
      btn.addEventListener('click', () => {
        const id = btn.getAttribute('data-id');
        this.selectedRoutineForDetail = id;
        this.render();
      });
    });

    // Duplicate
    container.querySelectorAll('.btn-duplicate-routine').forEach((btn) => {
      btn.addEventListener('click', () => {
        const id = btn.getAttribute('data-id');
        if (id) {
          const copy = store.duplicateRoutine(id);
          if (copy) {
            app.showToast('Routine Duplicated', `Created independent copy "${copy.name}".`, 'success');
          }
        }
      });
    });

    // Delete
    container.querySelectorAll('.btn-delete-routine').forEach((btn) => {
      btn.addEventListener('click', () => {
        const id = btn.getAttribute('data-id');
        this.promptDeleteRoutine(id);
      });
    });
  }

  // --- 2. Routine Creation & Edit Modal Form ---

  openRoutineModal(routineId = null) {
    const isEdit = !!routineId;
    const routine = isEdit ? store.getRoutineById(routineId) : null;

    let selectedColor = routine ? routine.color : PRESET_COLORS[0];
    let selectedIcon = routine ? routine.icon : PRESET_ICONS[0];
    let selectedDays = routine && Array.isArray(routine.daysActive) ? [...routine.daysActive] : [1, 2, 3, 4, 5];

    const bodyHtml = `
      <form id="routine-form" novalidate>
        <div id="routine-error-banner" class="form-error-banner"></div>

        <div class="form-group">
          <label class="form-label" for="routine-name-input">Routine Name *</label>
          <input type="text" id="routine-name-input" class="form-input" placeholder="e.g., Weekday High Focus, Weekend Reset" value="${routine ? this.escapeHtml(routine.name) : ''}" required maxlength="60" autofocus />
        </div>

        <div class="form-group">
          <label class="form-label" for="routine-desc-input">Description (Optional)</label>
          <textarea id="routine-desc-input" class="form-textarea" placeholder="Brief note about the goals or focus of this routine...">${routine ? this.escapeHtml(routine.description || '') : ''}</textarea>
        </div>

        <!-- Color Picker -->
        <div class="form-group">
          <label class="form-label">Color Accent</label>
          <div class="color-swatches" id="routine-color-swatches">
            ${PRESET_COLORS.map((c) => `
              <div class="color-swatch ${c === selectedColor ? 'active' : ''}" data-color="${c}" style="background-color: ${c};">
                ${c === selectedColor ? '✓' : ''}
              </div>
            `).join('')}
          </div>
        </div>

        <!-- Icon Picker -->
        <div class="form-group">
          <label class="form-label">Routine Icon</label>
          <div class="icon-chips" id="routine-icon-chips">
            ${PRESET_ICONS.map((ico) => `
              <div class="icon-chip ${ico === selectedIcon ? 'active' : ''}" data-icon="${ico}">
                ${ico}
              </div>
            `).join('')}
          </div>
        </div>

        <!-- Day of Week Selector -->
        <div class="form-group">
          <label class="form-label">Active Schedule Days *</label>
          <p style="font-size: var(--text-xs); color: var(--text-secondary); margin-bottom: var(--space-2);">
            Select which days this routine applies to automatically.
          </p>
          <div class="day-pills-row" id="routine-days-selector">
            ${DAYS_OF_WEEK.map((d) => {
              const active = selectedDays.includes(d.index);
              return `
                <button type="button" class="day-pill day-pill-btn ${active ? 'active' : ''}" data-day="${d.index}" title="${d.label}">
                  ${d.label}
                </button>
              `;
            }).join('')}
          </div>
        </div>

        ${!isEdit ? `
          <div class="switch-group" style="margin-top: var(--space-4);">
            <div class="switch-label-group">
              <span class="switch-title">Set as Active Routine Now</span>
              <span class="switch-desc">Immediately activate this routine on your dashboard.</span>
            </div>
            <label class="switch-toggle">
              <input type="checkbox" id="routine-active-now" ${store.getRoutines().length === 0 ? 'checked' : ''} />
              <span class="switch-slider"></span>
            </label>
          </div>
        ` : ''}
      </form>
    `;

    const footerHtml = `
      <button type="button" class="btn btn-ghost" id="modal-cancel-btn">Cancel</button>
      <button type="button" class="btn btn-primary" id="modal-save-routine-btn">
        ${isEdit ? 'Save Changes' : 'Create Routine'}
      </button>
    `;

    app.openModal(isEdit ? 'Edit Routine' : 'Create New Routine', bodyHtml, footerHtml);

    const modalContainer = document.getElementById('modal-container');
    if (!modalContainer) return;

    // Color Swatch Selection
    modalContainer.querySelectorAll('#routine-color-swatches .color-swatch').forEach((swatch) => {
      swatch.addEventListener('click', () => {
        modalContainer.querySelectorAll('#routine-color-swatches .color-swatch').forEach((s) => {
          s.classList.remove('active');
          s.textContent = '';
        });
        swatch.classList.add('active');
        swatch.textContent = '✓';
        selectedColor = swatch.getAttribute('data-color');
      });
    });

    // Icon Selection
    modalContainer.querySelectorAll('#routine-icon-chips .icon-chip').forEach((chip) => {
      chip.addEventListener('click', () => {
        modalContainer.querySelectorAll('#routine-icon-chips .icon-chip').forEach((c) => c.classList.remove('active'));
        chip.classList.add('active');
        selectedIcon = chip.getAttribute('data-icon');
      });
    });

    // Days Selector Toggle
    modalContainer.querySelectorAll('#routine-days-selector .day-pill-btn').forEach((btn) => {
      btn.addEventListener('click', () => {
        const dayIdx = parseInt(btn.getAttribute('data-day'), 10);
        if (selectedDays.includes(dayIdx)) {
          selectedDays = selectedDays.filter((d) => d !== dayIdx);
          btn.classList.remove('active');
        } else {
          selectedDays.push(dayIdx);
          btn.classList.add('active');
        }
      });
    });

    // Cancel Button
    const btnCancel = modalContainer.querySelector('#modal-cancel-btn');
    if (btnCancel) {
      btnCancel.addEventListener('click', () => app.closeModal());
    }

    // Save Button
    const btnSave = modalContainer.querySelector('#modal-save-routine-btn');
    if (btnSave) {
      btnSave.addEventListener('click', () => {
        const nameInput = modalContainer.querySelector('#routine-name-input');
        const descInput = modalContainer.querySelector('#routine-desc-input');
        const activeNowInput = modalContainer.querySelector('#routine-active-now');
        const errorBanner = modalContainer.querySelector('#routine-error-banner');

        const nameVal = nameInput ? nameInput.value.trim() : '';
        const descVal = descInput ? descInput.value.trim() : '';

        // Validation
        if (!nameVal) {
          if (errorBanner) {
            errorBanner.textContent = 'Please enter a routine name.';
            errorBanner.style.display = 'block';
          }
          if (nameInput) nameInput.focus();
          return;
        }

        if (selectedDays.length === 0) {
          if (errorBanner) {
            errorBanner.textContent = 'Please select at least one active schedule day.';
            errorBanner.style.display = 'block';
          }
          return;
        }

        const routinePayload = {
          name: nameVal,
          description: descVal,
          color: selectedColor,
          icon: selectedIcon,
          daysActive: selectedDays
        };

        if (isEdit) {
          store.updateRoutine(routineId, routinePayload);
          app.showToast('Routine Updated', `Saved changes to "${nameVal}".`, 'success');
        } else {
          const created = store.addRoutine(routinePayload);
          if (activeNowInput && activeNowInput.checked) {
            store.setActiveRoutine(created.id);
          }
          app.showToast('Routine Created', `"${nameVal}" is ready!`, 'success');
        }

        app.closeModal();
      });
    }
  }

  // --- 3. Prompt Safe Deletion with Fallback ---

  promptDeleteRoutine(routineId) {
    const routine = store.getRoutineById(routineId);
    if (!routine) return;

    const isActive = store.getActiveRoutine()?.id === routineId;

    const bodyHtml = `
      <div style="display: flex; gap: var(--space-4); align-items: flex-start;">
        <div style="font-size: 2rem;">⚠️</div>
        <div>
          <h4 style="font-size: var(--text-base); margin-bottom: var(--space-2); color: var(--text-primary);">
            Are you sure you want to delete "${this.escapeHtml(routine.name)}"?
          </h4>
          <p style="font-size: var(--text-sm); color: var(--text-secondary); line-height: 1.5; margin-bottom: var(--space-3);">
            This will permanently remove this routine and its <strong>${(routine.tasks || []).length} tasks</strong>. This action cannot be undone.
          </p>
          ${isActive ? `
            <div style="padding: var(--space-2) var(--space-3); background: var(--active-bg); border: 1px solid var(--active-border); border-radius: var(--radius-md); font-size: var(--text-xs); color: var(--active-text);">
              ℹ️ This is currently your active schedule. If deleted, another routine will become active automatically.
            </div>
          ` : ''}
        </div>
      </div>
    `;

    const footerHtml = `
      <button type="button" class="btn btn-ghost" id="modal-cancel-btn">Cancel</button>
      <button type="button" class="btn btn-danger" id="modal-confirm-delete-btn">Delete Routine</button>
    `;

    app.openModal('Confirm Deletion', bodyHtml, footerHtml);

    const modalContainer = document.getElementById('modal-container');
    if (!modalContainer) return;

    modalContainer.querySelector('#modal-cancel-btn')?.addEventListener('click', () => app.closeModal());
    modalContainer.querySelector('#modal-confirm-delete-btn')?.addEventListener('click', () => {
      store.deleteRoutine(routineId);
      if (this.selectedRoutineForDetail === routineId) {
        this.selectedRoutineForDetail = null;
      }
      app.closeModal();
      app.showToast('Routine Deleted', `Removed "${routine.name}".`, 'info');
    });
  }

  // --- 4. Routine Detail & Task Manager View ---

  renderRoutineDetail(container) {
    const routine = store.getRoutineById(this.selectedRoutineForDetail);
    if (!routine) {
      this.selectedRoutineForDetail = null;
      this.renderRoutinesList(container);
      return;
    }

    const tasks = routine.tasks || [];
    const timedTasks = tasks.filter((t) => t.type !== 'flexible').sort((a, b) => {
      return clockService.parseTimeToMinutes(a.startTime) - clockService.parseTimeToMinutes(b.startTime);
    });
    const flexibleTasks = tasks.filter((t) => t.type === 'flexible').sort((a, b) => (a.order || 0) - (b.order || 0));

    let html = `
      <div class="routine-detail-header">
        <div style="display: flex; align-items: center; gap: var(--space-3);">
          <button id="btn-back-to-routines" class="btn btn-secondary btn-sm" title="Back to all routines">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="19" y1="12" x2="5" y2="12"></line><polyline points="12 19 5 12 12 5"></polyline></svg>
            All Routines
          </button>
          <div class="routine-icon-badge" style="background: ${routine.color ? `${routine.color}22` : 'var(--primary-gradient)'}; color: ${routine.color || '#6366f1'}; width: 36px; height: 36px; font-size: 1.2rem;">
            ${routine.icon || '⚡'}
          </div>
          <div>
            <h2 style="font-size: var(--text-xl); font-weight: 800;">${this.escapeHtml(routine.name)}</h2>
            <p style="font-size: var(--text-xs); color: var(--text-secondary);">${this.escapeHtml(routine.description || 'Custom schedule')}</p>
          </div>
        </div>

        <div style="display: flex; gap: var(--space-3); align-items: center;">
          <button id="btn-edit-routine-meta" class="btn btn-secondary btn-sm">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="3"></circle><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path></svg>
            Edit Settings
          </button>
          <button id="btn-add-task-to-routine" class="btn btn-primary">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
            Add Task
          </button>
        </div>
      </div>

      <!-- Task Lists Container -->
      <div class="task-list-container">
    `;

    if (tasks.length === 0) {
      html += `
        <div class="glass-card" style="text-align: center; padding: var(--space-8); margin-top: var(--space-4);">
          <div style="font-size: 2.5rem; margin-bottom: var(--space-2);">📌</div>
          <h4 style="font-size: var(--text-lg); margin-bottom: var(--space-1);">No tasks in this routine yet</h4>
          <p style="font-size: var(--text-sm); color: var(--text-secondary); margin-bottom: var(--space-4);">
            Add time-slotted tasks or flexible habits to build your custom schedule.
          </p>
          <button id="btn-empty-add-task" class="btn btn-primary">Add First Task</button>
        </div>
      `;
    } else {
      // 1. Time-Slotted Tasks Section
      if (timedTasks.length > 0) {
        html += `
          <div class="task-section-title">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>
            Scheduled Tasks (${timedTasks.length})
          </div>
        `;

        timedTasks.forEach((task) => {
          const durationMins = this.calculateTaskDuration(task);
          const durationFormatted = this.formatDurationMinutes(durationMins);
          const isEnabled = task.enabled !== false;
          const hasDesc = task.description && typeof task.description === 'string' && task.description.trim().length > 0;

          html += `
            <div class="task-item-card ${!isEnabled ? 'task-disabled' : ''}">
              <div class="task-left-content">
                <div class="task-icon-box">${task.icon || '📌'}</div>
                <div class="task-info">
                  <div style="display: flex; align-items: center; gap: var(--space-2); flex-wrap: wrap;">
                    <span class="task-title">${this.escapeHtml(task.title)}</span>
                    ${task.reminderEnabled ? `<span class="task-reminder-pill" title="Audio chime & notifications enabled">🔔 Reminder on</span>` : ''}
                  </div>
                  <div class="task-meta">
                    <span class="task-time-pill">
                      🕒 ${clockService.formatDisplayTime(task.startTime)} – ${clockService.formatDisplayTime(task.endTime)} (${durationFormatted})
                    </span>
                    ${task.category ? `<span class="task-category-pill">${this.escapeHtml(task.category)}</span>` : ''}
                  </div>
                  ${hasDesc ? `
                    <div class="task-desc-line">📝 ${this.escapeHtml(task.description.trim())}</div>
                  ` : ''}
                </div>
              </div>

              <div class="task-actions">
                <label class="switch-toggle" title="${isEnabled ? 'Disable task' : 'Enable task'}">
                  <input type="checkbox" class="task-toggle-enabled" data-id="${task.id}" ${isEnabled ? 'checked' : ''} />
                  <span class="switch-slider"></span>
                </label>
                <button class="icon-btn btn-edit-task" data-id="${task.id}" title="Edit Task">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 20h9"></path><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"></path></svg>
                </button>
                <button class="icon-btn btn-danger-icon btn-delete-task" data-id="${task.id}" title="Delete Task">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
                </button>
              </div>
            </div>
          `;
        });
      }

      // 2. Flexible / Floating Tasks Section
      if (flexibleTasks.length > 0) {
        html += `
          <div class="task-section-title" style="margin-top: var(--space-6);">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>
            Flexible Habits & Checklist (${flexibleTasks.length})
          </div>
        `;

        flexibleTasks.forEach((task, index) => {
          const isEnabled = task.enabled !== false;
          const isAnytime = !task.durationMinutes;
          const hasDesc = task.description && typeof task.description === 'string' && task.description.trim().length > 0;

          html += `
            <div class="task-item-card ${!isEnabled ? 'task-disabled' : ''}">
              <div class="task-left-content">
                <div class="task-icon-box">${task.icon || '🎯'}</div>
                <div class="task-info">
                  <div style="display: flex; align-items: center; gap: var(--space-2); flex-wrap: wrap;">
                    <span class="task-title">${this.escapeHtml(task.title)}</span>
                    ${task.reminderEnabled ? `<span class="task-reminder-pill" title="Audio chime & notifications enabled">🔔 Reminder on</span>` : ''}
                  </div>
                  <div class="task-meta">
                    <span class="task-time-pill" style="background: rgba(16, 185, 129, 0.12); color: var(--completed-text);">
                      ${isAnytime ? '⏱ Anytime' : `⏱ ${this.formatDurationMinutes(task.durationMinutes)}`}
                    </span>
                    ${task.category ? `<span class="task-category-pill">${this.escapeHtml(task.category)}</span>` : ''}
                  </div>
                  ${hasDesc ? `
                    <div class="task-desc-line">📝 ${this.escapeHtml(task.description.trim())}</div>
                  ` : ''}
                </div>
              </div>

              <div class="task-actions">
                <!-- Reordering Buttons -->
                <button class="icon-btn btn-move-task-up" data-id="${task.id}" ${index === 0 ? 'disabled style="opacity: 0.3;"' : ''} title="Move Up">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="18 15 12 9 6 15"></polyline></svg>
                </button>
                <button class="icon-btn btn-move-task-down" data-id="${task.id}" ${index === flexibleTasks.length - 1 ? 'disabled style="opacity: 0.3;"' : ''} title="Move Down">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="6 9 12 15 18 9"></polyline></svg>
                </button>

                <label class="switch-toggle" title="${isEnabled ? 'Disable task' : 'Enable task'}">
                  <input type="checkbox" class="task-toggle-enabled" data-id="${task.id}" ${isEnabled ? 'checked' : ''} />
                  <span class="switch-slider"></span>
                </label>
                <button class="icon-btn btn-edit-task" data-id="${task.id}" title="Edit Task">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 20h9"></path><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"></path></svg>
                </button>
                <button class="icon-btn btn-danger-icon btn-delete-task" data-id="${task.id}" title="Delete Task">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
                </button>
              </div>
            </div>
          `;
        });
      }
    }

    html += `</div>`;

    container.innerHTML = html;
    this.bindDetailEvents(container, routine);
  }

  bindDetailEvents(container, routine) {
    // Back to list
    container.querySelector('#btn-back-to-routines')?.addEventListener('click', () => {
      this.selectedRoutineForDetail = null;
      this.render();
    });

    // Edit settings
    container.querySelector('#btn-edit-routine-meta')?.addEventListener('click', () => {
      this.openRoutineModal(routine.id);
    });

    // Add task
    const handleAddTask = () => {
      taskBuilder.openTaskModal(routine.id);
    };

    container.querySelector('#btn-add-task-to-routine')?.addEventListener('click', handleAddTask);
    container.querySelector('#btn-empty-add-task')?.addEventListener('click', handleAddTask);

    // Toggle enabled
    container.querySelectorAll('.task-toggle-enabled').forEach((toggle) => {
      toggle.addEventListener('change', (e) => {
        const taskId = toggle.getAttribute('data-id');
        store.updateTask(routine.id, taskId, { enabled: e.target.checked });
      });
    });

    // Edit task
    container.querySelectorAll('.btn-edit-task').forEach((btn) => {
      btn.addEventListener('click', () => {
        const taskId = btn.getAttribute('data-id');
        taskBuilder.openTaskModal(routine.id, taskId);
      });
    });

    // Delete task
    container.querySelectorAll('.btn-delete-task').forEach((btn) => {
      btn.addEventListener('click', () => {
        const taskId = btn.getAttribute('data-id');
        const task = (routine.tasks || []).find((t) => String(t.id) === String(taskId));
        if (task && confirm(`Delete task "${task.title}"?`)) {
          store.deleteTask(routine.id, taskId);
          app.showToast('Task Deleted', `Removed "${task.title}".`, 'info');
        }
      });
    });

    // Move Up
    container.querySelectorAll('.btn-move-task-up').forEach((btn) => {
      btn.addEventListener('click', () => {
        const taskId = btn.getAttribute('data-id');
        this.reorderFlexibleTask(routine, taskId, -1);
      });
    });

    // Move Down
    container.querySelectorAll('.btn-move-task-down').forEach((btn) => {
      btn.addEventListener('click', () => {
        const taskId = btn.getAttribute('data-id');
        this.reorderFlexibleTask(routine, taskId, 1);
      });
    });
  }

  reorderFlexibleTask(routine, taskId, delta) {
    const flexibleTasks = (routine.tasks || []).filter((t) => t.type === 'flexible').sort((a, b) => (a.order || 0) - (b.order || 0));
    const idx = flexibleTasks.findIndex((t) => String(t.id) === String(taskId));
    if (idx === -1) return;

    const targetIdx = idx + delta;
    if (targetIdx < 0 || targetIdx >= flexibleTasks.length) return;

    // Swap orders
    const currentTask = flexibleTasks[idx];
    const swapTask = flexibleTasks[targetIdx];

    const currentOrder = currentTask.order || idx;
    const swapOrder = swapTask.order || targetIdx;

    store.updateTask(routine.id, currentTask.id, { order: swapOrder });
    store.updateTask(routine.id, swapTask.id, { order: currentOrder });
    this.render();
  }

  // --- Utility Calculations ---

  calculateRoutineTotalMinutes(routine) {
    if (!routine || !Array.isArray(routine.tasks)) return 0;
    return routine.tasks.reduce((sum, task) => {
      if (task.enabled === false) return sum;
      return sum + this.calculateTaskDuration(task);
    }, 0);
  }

  calculateTaskDuration(task) {
    if (task.type === 'flexible') {
      return task.durationMinutes || 0;
    }
    const startMins = clockService.parseTimeToMinutes(task.startTime);
    const endMins = clockService.parseTimeToMinutes(task.endTime);
    if (endMins >= startMins) {
      return endMins - startMins;
    } else {
      return (1440 - startMins) + endMins;
    }
  }

  formatDurationMinutes(totalMinutes) {
    if (!totalMinutes || totalMinutes <= 0) return '0m';
    const hours = Math.floor(totalMinutes / 60);
    const mins = totalMinutes % 60;
    if (hours > 0 && mins > 0) return `${hours}h ${mins}m`;
    if (hours > 0) return `${hours}h`;
    return `${mins}m`;
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

export const routinesView = new RoutinesViewController();
