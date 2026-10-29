import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  emptyDb, activeWorkout, startWorkout, endWorkout, normalizeName,
  findOrCreateExercise, addSet, parseWeight, parseReps, durationMs,
  formatDuration, workoutExercises, finishedWorkouts,
} from '../js/model.js';

const T0 = '2026-10-29T17:00:00.000Z';
const T1 = '2026-10-29T17:05:00.000Z';
const T2 = '2026-10-29T18:05:30.000Z';

function dbWithWorkout() {
  return startWorkout(emptyDb(), { now: T0, id: 'w1' });
}

test('emptyDb has schema version 1 and no data', () => {
  assert.deepEqual(emptyDb(), { schemaVersion: 1, exercises: [], workouts: [] });
});

test('startWorkout creates an in-progress workout with empty label and notes', () => {
  const db = dbWithWorkout();
  assert.deepEqual(activeWorkout(db), {
    id: 'w1', startedAt: T0, endedAt: null, label: '', notes: '', sets: [],
  });
});

test('startWorkout does nothing when a workout is already in progress', () => {
  const db = dbWithWorkout();
  assert.equal(startWorkout(db, { now: T1, id: 'w2' }), db);
});

test('endWorkout sets endedAt and leaves no active workout', () => {
  const db = endWorkout(dbWithWorkout(), { now: T2 });
  assert.equal(db.workouts[0].endedAt, T2);
  assert.equal(activeWorkout(db), null);
});

test('functions do not mutate the database they receive', () => {
  const db = dbWithWorkout();
  const copy = structuredClone(db);
  endWorkout(db, { now: T2 });
  assert.deepEqual(db, copy);
});

test('normalizeName trims, lowercases, collapses spaces and removes accents', () => {
  assert.equal(normalizeName('  Press   de  BANCA '), 'press de banca');
  assert.equal(normalizeName('Prés Bánca'), 'pres banca');
});

test('findOrCreateExercise reuses an exercise with the same normalized name', () => {
  const first = findOrCreateExercise(emptyDb(), { name: ' Bench  press ', now: T0, id: 'e1' });
  assert.equal(first.exercise.name, 'Bench press');
  assert.equal(first.exercise.normalizedName, 'bench press');
  const second = findOrCreateExercise(first.db, { name: 'bench press', now: T1, id: 'e2' });
  assert.equal(second.exercise.id, 'e1');
  assert.equal(second.db.exercises.length, 1);
});

test('findOrCreateExercise rejects an empty name', () => {
  assert.throws(() => findOrCreateExercise(emptyDb(), { name: '   ', now: T0, id: 'e1' }));
});

test('addSet appends a set to the active workout and allows 0 kg', () => {
  const { db } = findOrCreateExercise(dbWithWorkout(), { name: 'Pull-ups', now: T0, id: 'e1' });
  const next = addSet(db, { exerciseId: 'e1', weightKg: 0, reps: 12, now: T1, id: 's1' });
  assert.deepEqual(activeWorkout(next).sets, [
    { id: 's1', exerciseId: 'e1', weightKg: 0, reps: 12, loggedAt: T1 },
  ]);
});

test('addSet rejects invalid input and missing workout', () => {
  const { db } = findOrCreateExercise(dbWithWorkout(), { name: 'Squat', now: T0, id: 'e1' });
  const base = { exerciseId: 'e1', weightKg: 50, reps: 5, now: T1, id: 's1' };
  assert.throws(() => addSet(db, { ...base, weightKg: -1 }));
  assert.throws(() => addSet(db, { ...base, reps: 0 }));
  assert.throws(() => addSet(db, { ...base, reps: 2.5 }));
  assert.throws(() => addSet(db, { ...base, exerciseId: 'nope' }));
  assert.throws(() => addSet(endWorkout(db, { now: T1 }), base));
});

test('parseWeight accepts comma or dot decimals and rejects junk', () => {
  assert.equal(parseWeight('62,5'), 62.5);
  assert.equal(parseWeight(' 60 '), 60);
  assert.equal(parseWeight('0'), 0);
  assert.equal(parseWeight(''), null);
  assert.equal(parseWeight('-5'), null);
  assert.equal(parseWeight('abc'), null);
});

test('parseReps accepts positive integers only', () => {
  assert.equal(parseReps('10'), 10);
  assert.equal(parseReps('0'), null);
  assert.equal(parseReps('2.5'), null);
  assert.equal(parseReps(''), null);
});

test('durationMs uses endedAt for finished workouts', () => {
  const db = endWorkout(dbWithWorkout(), { now: T2 });
  assert.equal(durationMs(db.workouts[0], '2030-01-01T00:00:00.000Z'), 3930000);
});

test('durationMs uses now for a workout in progress', () => {
  assert.equal(durationMs(activeWorkout(dbWithWorkout()), T1), 300000);
});

test('formatDuration shows h:mm:ss', () => {
  assert.equal(formatDuration(3930000), '1:05:30');
  assert.equal(formatDuration(59999), '0:00:59');
});

test('workoutExercises groups sets by exercise in order of first appearance', () => {
  let db = dbWithWorkout();
  db = findOrCreateExercise(db, { name: 'Bench press', now: T0, id: 'e1' }).db;
  db = findOrCreateExercise(db, { name: 'Pull-ups', now: T0, id: 'e2' }).db;
  db = addSet(db, { exerciseId: 'e2', weightKg: 0, reps: 10, now: T0, id: 's1' });
  db = addSet(db, { exerciseId: 'e1', weightKg: 60, reps: 8, now: T1, id: 's2' });
  db = addSet(db, { exerciseId: 'e2', weightKg: 0, reps: 9, now: T1, id: 's3' });
  const groups = workoutExercises(db, activeWorkout(db));
  assert.deepEqual(groups.map((g) => g.exercise.name), ['Pull-ups', 'Bench press']);
  assert.deepEqual(groups[0].sets.map((s) => s.id), ['s1', 's3']);
});

test('finishedWorkouts returns only finished workouts, newest first', () => {
  let db = endWorkout(dbWithWorkout(), { now: T1 });
  db = endWorkout(startWorkout(db, { now: T1, id: 'w2' }), { now: T2 });
  db = startWorkout(db, { now: T2, id: 'w3' });
  assert.deepEqual(finishedWorkouts(db).map((w) => w.id), ['w2', 'w1']);
});
