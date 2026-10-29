import { test } from 'node:test';
import assert from 'node:assert/strict';
import { load, save, STORAGE_KEY } from '../js/storage.js';
import {
  emptyDb, startWorkout, findOrCreateExercise, addSet, endWorkout,
  activeWorkout, durationMs,
} from '../js/model.js';

// Minimal in-memory stand-in for the browser's localStorage.
function fakeStorage(initial = {}) {
  const data = new Map(Object.entries(initial));
  return {
    getItem: (key) => (data.has(key) ? data.get(key) : null),
    setItem: (key, value) => data.set(key, String(value)),
    keys: () => [...data.keys()],
  };
}

const START = '2026-10-29T17:10:00.000Z';

function workoutInProgress() {
  let db = startWorkout(emptyDb(), { now: START, id: 'w1' });
  db = findOrCreateExercise(db, { name: 'Bench press', now: START, id: 'e1' }).db;
  return addSet(db, { exerciseId: 'e1', weightKg: 62.5, reps: 8, now: '2026-10-29T17:14:00.000Z', id: 's1' });
}

test('load returns an empty database when nothing is saved', () => {
  assert.deepEqual(load(fakeStorage()), emptyDb());
});

test('save writes the whole database under gymTracker.db only', () => {
  const storage = fakeStorage();
  const db = workoutInProgress();
  save(db, storage);
  assert.deepEqual(storage.keys(), ['gymTracker.db']);
  assert.deepEqual(JSON.parse(storage.getItem(STORAGE_KEY)), db);
});

test('a workout in progress survives a reload with its original start time', () => {
  const storage = fakeStorage();
  save(workoutInProgress(), storage);

  const reloaded = load(storage);
  const workout = activeWorkout(reloaded);
  assert.equal(workout.startedAt, START);
  assert.equal(workout.sets.length, 1);
  // The timer keeps counting from the original start, not from the reload.
  assert.equal(durationMs(workout, '2026-10-29T17:40:00.000Z'), 30 * 60 * 1000);
});

test('a finished workout loads back with the same computed duration', () => {
  const storage = fakeStorage();
  save(endWorkout(workoutInProgress(), { now: '2026-10-29T18:15:30.000Z' }), storage);
  const [workout] = load(storage).workouts;
  assert.equal(durationMs(workout, '2030-01-01T00:00:00.000Z'), 3930000);
});

test('load throws on unreadable data instead of returning an empty database', () => {
  assert.throws(() => load(fakeStorage({ [STORAGE_KEY]: '{not json' })));
  assert.throws(() => load(fakeStorage({ [STORAGE_KEY]: '{"hello":1}' })));
});

test('load throws on data from a newer schema version', () => {
  const newer = JSON.stringify({ ...emptyDb(), schemaVersion: 99 });
  assert.throws(() => load(fakeStorage({ [STORAGE_KEY]: newer })));
});
