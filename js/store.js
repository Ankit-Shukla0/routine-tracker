/**
 * Reactive State Store - Single Source of Truth & Event Bus
 * Coordinates routine management, daily logging, preferences, and persistence.
 */

import { loadState, saveState, getDefaultState } from './storage.js';
import { clockService } from './clock.js';

class Store {
  constructor() {
    this.state = getDefaultState();
    this.currentView = 'dashboard';
    this.listeners = new Map();
    this.saveTimeout = null;
  }

  init() {
    this.state = loadState();
    
    // Check if an active routine exists for today
    this.resolveActiveRoutineForToday();

    // Listen to date rollover
    clockService.on('dateChange', () => {
      this.resolveActiveRoutineForToday();
      this.emit('date:changed', { dateStr: clockService.getTodayDateStr() });
    });
  }

  getState() {
    return this.state;
  }

  // --- Pub/Sub Event System ---

  on(event, callback) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event).add(callback);
    return () => this.off(event, callback);
  }

  off(event, callback) {
    if (this.listeners.has(event)) {
      this.listeners.get(event).delete(callback);
    }
  }

  emit(event, data) {
    if (this.listeners.has(event)) {
      for (const cb of this.listeners.get(event)) {
        try {
          cb(data, this.state);
        } catch (e) {
          console.error(`Error in store event handler for [${event}]:`, e);
        }
      }
    }
    // Also trigger generic state:changed
    if (event !== 'state:changed' && this.listeners.has('state:changed')) {
      for (const cb of this.listeners.get('state:changed')) {
        try {
          cb(this.state);
        } catch (e) {
          console.error('Error in state:changed handler:', e);
        }
      }
    }
  }

  // --- Persistence Trigger ---

  persist() {
    if (this.saveTimeout) {
      clearTimeout(this.saveTimeout);
    }
    this.saveTimeout = setTimeout(() => {
      saveState(this.state);
    }, 150);
  }

  // --- Navigation & View State ---

  setCurrentView(view) {
    if (this.currentView !== view) {
      this.currentView = view;
      this.emit('view:changed', { view });
    }
  }

  getCurrentView() {
    return this.currentView;
  }

  // --- Routine Management ---

  getRoutines() {
    return this.state.routines || [];
  }

  getRoutineById(id) {
    return this.state.routines.find((r) => r.id === id) || null;
  }

  getActiveRoutine() {
    if (this.state.activeRoutineId) {
      const routine = this.getRoutineById(this.state.activeRoutineId);
      if (routine) return routine;
    }
    // Fallback to first routine if available
    return this.state.routines[0] || null;
  }

  resolveActiveRoutineForToday() {
    const dayIndex = clockService.getDayOfWeekIndex();
    // Look for routine assigned to today's day of week
    const matching = this.state.routines.find(
      (r) => Array.isArray(r.daysActive) && r.daysActive.includes(dayIndex)
    );

    if (matching) {
      this.state.activeRoutineId = matching.id;
    } else if (!this.state.activeRoutineId && this.state.routines.length > 0) {
      this.state.activeRoutineId = this.state.routines[0].id;
    }
  }

  setActiveRoutine(id) {
    if (this.state.activeRoutineId !== id) {
      this.state.activeRoutineId = id;
      this.persist();
      this.emit('activeRoutine:changed', { routineId: id, routine: this.getActiveRoutine() });
    }
  }

  addRoutine(routineData) {
    const newRoutine = {
      id: routineData.id || `routine_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
      name: routineData.name || 'Untitled Routine',
      description: routineData.description || '',
      color: routineData.color || '#6366f1',
      icon: routineData.icon || '⚡',
      daysActive: Array.isArray(routineData.daysActive) ? routineData.daysActive : [1, 2, 3, 4, 5],
      tasks: Array.isArray(routineData.tasks) ? routineData.tasks : [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    this.state.routines.push(newRoutine);
    if (!this.state.activeRoutineId || this.state.routines.length === 1) {
      this.state.activeRoutineId = newRoutine.id;
    }

    this.persist();
    this.emit('routine:added', { routine: newRoutine });
    return newRoutine;
  }

  updateRoutine(id, updates) {
    const idx = this.state.routines.findIndex((r) => r.id === id);
    if (idx === -1) return null;

    this.state.routines[idx] = {
      ...this.state.routines[idx],
      ...updates,
      updatedAt: new Date().toISOString()
    };

    this.persist();
    this.emit('routine:updated', { routine: this.state.routines[idx] });
    return this.state.routines[idx];
  }

  deleteRoutine(id) {
    const idx = this.state.routines.findIndex((r) => r.id === id);
    if (idx === -1) return false;

    const removed = this.state.routines.splice(idx, 1)[0];
    if (this.state.activeRoutineId === id) {
      this.state.activeRoutineId = this.state.routines.length > 0 ? this.state.routines[0].id : null;
    }

    this.persist();
    this.emit('routine:deleted', { routineId: id, removed });
    return true;
  }

  duplicateRoutine(id) {
    const original = this.getRoutineById(id);
    if (!original) return null;

    const copyData = {
      name: `${original.name} (Copy)`,
      description: original.description,
      color: original.color,
      icon: original.icon,
      daysActive: [...original.daysActive],
      tasks: (original.tasks || []).map((t) => ({
        ...t,
        id: `task_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }))
    };

    return this.addRoutine(copyData);
  }

  // --- Task Management inside Routines ---

  addTask(routineId, taskData) {
    const routine = this.getRoutineById(routineId);
    if (!routine) return null;

    const order = routine.tasks.length;
    const newTask = {
      id: taskData.id || `task_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
      title: taskData.title || 'Untitled Task',
      description: taskData.description || '',
      type: taskData.type === 'flexible' ? 'flexible' : 'timed',
      startTime: taskData.startTime || '09:00',
      endTime: taskData.endTime || '10:00',
      durationMinutes: typeof taskData.durationMinutes === 'number' ? taskData.durationMinutes : 30,
      category: taskData.category || 'General',
      icon: taskData.icon || '📌',
      enabled: taskData.enabled !== false,
      order: typeof taskData.order === 'number' ? taskData.order : order,
      reminderEnabled: taskData.reminderEnabled !== false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };


    routine.tasks.push(newTask);
    routine.updatedAt = new Date().toISOString();

    this.persist();
    this.emit('task:added', { routineId, task: newTask });
    return newTask;
  }

  updateTask(routineId, taskId, updates) {
    const routine = this.getRoutineById(routineId);
    if (!routine) return null;

    const taskIdx = routine.tasks.findIndex((t) => t.id === taskId);
    if (taskIdx === -1) return null;

    routine.tasks[taskIdx] = {
      ...routine.tasks[taskIdx],
      ...updates,
      updatedAt: new Date().toISOString()
    };
    routine.updatedAt = new Date().toISOString();

    this.persist();
    this.emit('task:updated', { routineId, task: routine.tasks[taskIdx] });
    return routine.tasks[taskIdx];
  }

  deleteTask(routineId, taskId) {
    const routine = this.getRoutineById(routineId);
    if (!routine) return false;

    const taskIdx = routine.tasks.findIndex((t) => t.id === taskId);
    if (taskIdx === -1) return false;

    const removed = routine.tasks.splice(taskIdx, 1)[0];
    routine.updatedAt = new Date().toISOString();

    this.persist();
    this.emit('task:deleted', { routineId, taskId, removed });
    return true;
  }

  // --- Daily Logging & Progress ---

  getDailyLog(dateStr = clockService.getTodayDateStr()) {
    if (!this.state.logs[dateStr]) {
      this.state.logs[dateStr] = {
        tasks: {},
        updatedAt: new Date().toISOString()
      };
    }
    return this.state.logs[dateStr];
  }

  logTaskStatus(dateStr, taskId, updates) {
    const dayLog = this.getDailyLog(dateStr);
    const existing = dayLog.tasks[taskId] || {
      completed: false,
      completedAt: null,
      missed: false,
      rescheduledTime: null,
      notes: ''
    };

    dayLog.tasks[taskId] = {
      ...existing,
      ...updates,
      updatedAt: new Date().toISOString()
    };
    dayLog.updatedAt = new Date().toISOString();

    this.persist();
    this.emit('taskLog:updated', { dateStr, taskId, status: dayLog.tasks[taskId] });
    return dayLog.tasks[taskId];
  }

  calculateTodayProgress(dateStr = clockService.getTodayDateStr()) {
    const routine = this.getActiveRoutine();
    if (!routine || !routine.tasks || routine.tasks.length === 0) {
      return { completed: 0, total: 0, percentage: 0 };
    }

    const enabledTasks = routine.tasks.filter((t) => t.enabled !== false);
    if (enabledTasks.length === 0) {
      return { completed: 0, total: 0, percentage: 0 };
    }

    const dayLog = this.getDailyLog(dateStr);
    let completedCount = 0;

    for (const task of enabledTasks) {
      if (dayLog.tasks[task.id] && dayLog.tasks[task.id].completed) {
        completedCount++;
      }
    }

    const percentage = Math.round((completedCount / enabledTasks.length) * 100);
    return {
      completed: completedCount,
      total: enabledTasks.length,
      percentage
    };
  }

  // --- Sample Starter Routine Provider ---

  createSampleRoutine() {
    return {
      name: 'Productive Day Starter',
      description: 'A balanced sample schedule with morning focus, deep work, and evening wind-down.',
      color: '#6366f1',
      icon: '🚀',
      daysActive: [1, 2, 3, 4, 5],
      tasks: [
        {
          id: `task_${Date.now()}_1`,
          title: 'Morning Sunlight & Hydration',
          description: 'Hydrate with a glass of water and get 10 mins of natural sunlight.',
          type: 'timed',
          startTime: '07:00',
          endTime: '07:30',
          durationMinutes: 30,
          category: 'Health',
          icon: '☀️',
          enabled: true,
          order: 0,
          reminderEnabled: true
        },
        {
          id: `task_${Date.now()}_2`,
          title: 'Deep Work Block 1',
          description: 'Focused execution on highest leverage project with zero distractions.',
          type: 'timed',
          startTime: '08:30',
          endTime: '11:00',
          durationMinutes: 150,
          category: 'Deep Work',
          icon: '💻',
          enabled: true,
          order: 1,
          reminderEnabled: true
        },
        {
          id: `task_${Date.now()}_3`,
          title: 'Mindful Lunch & Walk',
          description: 'Step away from screens and recharge.',
          type: 'timed',
          startTime: '12:30',
          endTime: '13:30',
          durationMinutes: 60,
          category: 'Wellness',
          icon: '🥗',
          enabled: true,
          order: 2,
          reminderEnabled: false
        },
        {
          id: `task_${Date.now()}_4`,
          title: 'Afternoon Focus Block',
          description: 'Secondary work tasks, reviews, and planning.',
          type: 'timed',
          startTime: '14:00',
          endTime: '16:30',
          durationMinutes: 150,
          category: 'Focus',
          icon: '🎯',
          enabled: true,
          order: 3,
          reminderEnabled: true
        },
        {
          id: `task_${Date.now()}_5`,
          title: 'Daily Reading & Reflection',
          description: '20 mins reading inspiring material or journaling.',
          type: 'flexible',
          startTime: '20:00',
          endTime: '20:30',
          durationMinutes: 20,
          category: 'Growth',
          icon: '📖',
          enabled: true,
          order: 4,
          reminderEnabled: false
        }
      ]
    };
  }
}

export const store = new Store();
