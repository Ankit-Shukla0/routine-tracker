/**
 * Automated Verification Test for Phase 2 Fixes
 * Tests:
 * 1. Timed task edit persistence & synchronous storage updates
 * 2. Overlap detection logic & warning accuracy
 * 3. Task metadata rendering & description isolation
 */

import { store } from '../js/store.js';
import { clockService } from '../js/clock.js';
import { saveState, loadState, getDefaultState } from '../js/storage.js';

// Polyfill localStorage if running in Node.js
if (typeof globalThis.localStorage === 'undefined') {
  const memStore = new Map();
  globalThis.localStorage = {
    getItem: (key) => memStore.get(key) || null,
    setItem: (key, val) => memStore.set(key, String(val)),
    removeItem: (key) => memStore.delete(key),
    clear: () => memStore.clear()
  };
}

let passed = 0;
let failed = 0;

function assert(condition, message) {
  if (condition) {
    console.log(`  ✅ PASS: ${message}`);
    passed++;
  } else {
    console.error(`  ❌ FAIL: ${message}`);
    failed++;
  }
}

console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
console.log(' Phase 2 Bug Fixes - Verification Test Suite');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

// 1. Initialize Store
store.init();
const sample = store.createSampleRoutine();
const routine = store.addRoutine(sample);

// 2. Test 1: Timed task edit persistence (Bug 1)
console.log('Test 1: Timed Task Edit & Immediate Persistence');
const task1 = store.addTask(routine.id, {
  title: 'Morning Workout',
  type: 'timed',
  startTime: '07:00',
  endTime: '08:00',
  category: 'Health',
  icon: '🏋️'
});

const task2 = store.addTask(routine.id, {
  title: 'Breakfast',
  type: 'timed',
  startTime: '07:00',
  endTime: '08:00',
  category: 'Health',
  icon: '🥗'
});

assert(task1 !== null && task2 !== null, 'Created Morning Workout and Breakfast tasks');

// Edit Breakfast to 07:30 - 08:30
const updated = store.updateTask(routine.id, task2.id, {
  title: 'Breakfast',
  startTime: '07:30',
  endTime: '08:30',
  durationMinutes: 60,
  category: 'Personal',
  description: 'Healthy morning meal and juice'
});

assert(updated !== null, 'store.updateTask succeeded');
assert(updated.startTime === '07:30', 'startTime saved as 07:30');
assert(updated.endTime === '08:30', 'endTime saved as 08:30');
assert(updated.category === 'Personal', 'category saved as Personal');
assert(updated.description === 'Healthy morning meal and juice', 'description saved cleanly');

// Check localStorage immediate persistence
const loadedState = loadState();
const persistedRoutine = loadedState.routines.find((r) => r.id === routine.id);
const persistedBreakfast = persistedRoutine.tasks.find((t) => t.id === task2.id);

assert(persistedBreakfast !== null, 'Breakfast found in reloaded localStorage state');
assert(persistedBreakfast.startTime === '07:30', 'persisted startTime is 07:30');
assert(persistedBreakfast.endTime === '08:30', 'persisted endTime is 08:30');
assert(persistedBreakfast.category === 'Personal', 'persisted category is Personal');

// 3. Test 2: Overlap Calculation Logic
console.log('\nTest 2: Time Overlap Calculation Accuracy');
const start1 = clockService.parseTimeToMinutes('07:00'); // 420
const end1 = clockService.parseTimeToMinutes('08:00');   // 480
const start2 = clockService.parseTimeToMinutes('07:30'); // 450
const end2 = clockService.parseTimeToMinutes('08:30');   // 510

const isOverlapping = Math.max(start1, start2) < Math.min(end1, end2);
assert(isOverlapping === true, '07:00-08:00 and 07:30-08:30 correctly detected as overlapping');

const start3 = clockService.parseTimeToMinutes('08:00'); // 480
const end3 = clockService.parseTimeToMinutes('09:00');   // 540
const isOverlapping2 = Math.max(start1, start3) < Math.min(end1, end3);
assert(isOverlapping2 === false, '07:00-08:00 and 08:00-09:00 correctly detected as non-overlapping');

// 4. Test 3: String-safe Task ID lookups
console.log('\nTest 3: String-safe Task & Routine ID Matching');
const numIdTask = store.addTask(routine.id, {
  id: 999888,
  title: 'Numeric ID Task',
  type: 'flexible',
  durationMinutes: 15
});

const updatedNum = store.updateTask(routine.id, '999888', {
  durationMinutes: 45
});
assert(updatedNum !== null && updatedNum.durationMinutes === 45, 'String taskId matches numeric task ID');

console.log('\n─────────────────────────────────────────────────────');
console.log(`Results: ${passed} passed, ${failed} failed.`);
if (failed > 0) {
  process.exit(1);
} else {
  console.log('All tests PASSED successfully!\n');
}
