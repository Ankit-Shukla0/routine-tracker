/**
 * Storage Layer - Resilient, Schema-Versioned LocalStorage Adapter
 * Handles defensive parsing, automatic corruption backups, migrations, and export/import.
 */

export const SCHEMA_VERSION = 1;
export const STORAGE_KEY = 'routine_tracker_v1';
export const BACKUP_KEY_PREFIX = 'routine_tracker_backup_';
export const CORRUPT_BACKUP_KEY_PREFIX = 'routine_tracker_corrupt_';

/**
 * Returns clean initial state schema
 */
export function getDefaultState() {
  return {
    version: SCHEMA_VERSION,
    routines: [],
    activeRoutineId: null,
    logs: {}, // Keyed by YYYY-MM-DD
    preferences: {
      theme: 'dark',
      soundEnabled: true,
      notificationsEnabled: false,
      notificationLeadMinutes: 5,
      audioVolume: 0.7
    },
    streaks: {
      currentStreak: 0,
      longestStreak: 0,
      lastActiveDate: null
    },
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };
}

/**
 * Load state from localStorage with corruption protection and schema migration
 */
export function loadState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return getDefaultState();
    }

    let parsed;
    try {
      parsed = JSON.parse(raw);
    } catch (parseError) {
      // Corruption detected - save backup of raw string before resetting
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      try {
        localStorage.setItem(`${CORRUPT_BACKUP_KEY_PREFIX}${timestamp}`, raw);
      } catch (e) {
        console.error('Failed to snapshot corrupt storage', e);
      }
      console.warn('Storage data corrupted. Preserved backup and recovered default state.', parseError);
      return getDefaultState();
    }

    if (!parsed || typeof parsed !== 'object') {
      return getDefaultState();
    }

    // Run migration if needed
    if (!parsed.version || parsed.version < SCHEMA_VERSION) {
      parsed = migrateState(parsed, parsed.version || 0, SCHEMA_VERSION);
    }

    // Sanitize state to ensure all expected keys exist
    const defaultState = getDefaultState();
    return {
      ...defaultState,
      ...parsed,
      preferences: { ...defaultState.preferences, ...(parsed.preferences || {}) },
      streaks: { ...defaultState.streaks, ...(parsed.streaks || {}) },
      routines: Array.isArray(parsed.routines) ? parsed.routines : [],
      logs: parsed.logs && typeof parsed.logs === 'object' ? parsed.logs : {}
    };
  } catch (err) {
    console.error('Unexpected error loading state:', err);
    return getDefaultState();
  }
}

/**
 * Persist state to localStorage safely
 */
export function saveState(state) {
  try {
    if (!state || typeof state !== 'object') return false;

    const dataToSave = {
      ...state,
      version: SCHEMA_VERSION,
      updatedAt: new Date().toISOString()
    };

    localStorage.setItem(STORAGE_KEY, JSON.stringify(dataToSave));
    return true;
  } catch (err) {
    console.error('Failed to save state to localStorage:', err);
    return false;
  }
}

/**
 * Migration runner hook for future schema versions
 */
export function migrateState(data, fromVersion, toVersion) {
  let migrated = { ...data };
  
  // Example for future migration hooks:
  // if (fromVersion < 2 && toVersion >= 2) { ... }

  migrated.version = toVersion;
  migrated.updatedAt = new Date().toISOString();
  return migrated;
}

/**
 * Create a timestamped manual/automated backup
 */
export function createBackup(state) {
  try {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupKey = `${BACKUP_KEY_PREFIX}${timestamp}`;
    localStorage.setItem(backupKey, JSON.stringify(state));
    localStorage.setItem(`${BACKUP_KEY_PREFIX}latest`, JSON.stringify(state));
    return backupKey;
  } catch (err) {
    console.error('Failed to create backup:', err);
    return null;
  }
}

/**
 * Export full state as a formatted JSON string
 */
export function exportData(state) {
  const exportPayload = {
    app: 'FlowRoutine',
    exportedAt: new Date().toISOString(),
    schemaVersion: SCHEMA_VERSION,
    data: state
  };
  return JSON.stringify(exportPayload, null, 2);
}

/**
 * Import and validate JSON backup string
 */
export function importData(jsonString) {
  try {
    const parsed = JSON.parse(jsonString);
    const data = parsed.data || parsed;

    if (!data || typeof data !== 'object') {
      throw new Error('Invalid backup file format.');
    }

    if (!Array.isArray(data.routines)) {
      throw new Error('Backup is missing routines array.');
    }

    const defaultState = getDefaultState();
    const validatedState = {
      ...defaultState,
      ...data,
      version: SCHEMA_VERSION,
      updatedAt: new Date().toISOString()
    };

    saveState(validatedState);
    return { success: true, state: validatedState };
  } catch (err) {
    console.error('Import validation failed:', err);
    return { success: false, error: err.message || 'Corrupt JSON data' };
  }
}
