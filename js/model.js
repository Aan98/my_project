// Pure logic for Gym Tracker. No DOM, no storage, no Date.now():
// times (ISO 8601 strings) and ids are always passed in.
// Every function that changes data returns a new database and never
// mutates the one it receives.

export const SCHEMA_VERSION = 1;

export function emptyDb() {
  return { schemaVersion: SCHEMA_VERSION, exercises: [], workouts: [] };
}

// The workout in progress (endedAt === null), or null.
export function activeWorkout(db) {
  return db.workouts.find((w) => w.endedAt === null) ?? null;
}

// Starts a workout. Does nothing if one is already in progress.
export function startWorkout(db, { now, id }) {
  if (activeWorkout(db)) return db;
  const workout = { id, startedAt: now, endedAt: null, label: '', notes: '', sets: [] };
  return { ...db, workouts: [...db.workouts, workout] };
}

// Ends the workout in progress. Does nothing if there is none.
export function endWorkout(db, { now }) {
  if (!activeWorkout(db)) return db;
  return updateActiveWorkout(db, (w) => ({ ...w, endedAt: now }));
}

// trim, lowercase, collapse spaces, remove accents ("Prés  Banca" -> "pres banca").
export function normalizeName(name) {
  return name
    .normalize('NFD')
    .replace(/\p{M}/gu, '')
    .trim()
    .toLowerCase()
    .replace(/\s+/g, ' ');
}

// Returns { db, exercise }. Reuses an exercise with the same normalized
// name; otherwise adds a new one to the catalog.
export function findOrCreateExercise(db, { name, now, id }) {
  const normalizedName = normalizeName(name);
  if (!normalizedName) throw new Error('Exercise name is required');
  const existing = db.exercises.find((e) => e.normalizedName === normalizedName);
  if (existing) return { db, exercise: existing };
  const exercise = { id, name: name.trim().replace(/\s+/g, ' '), normalizedName, createdAt: now };
  return { db: { ...db, exercises: [...db.exercises, exercise] }, exercise };
}

// Adds a set to the workout in progress.
export function addSet(db, { exerciseId, weightKg, reps, now, id }) {
  if (!activeWorkout(db)) throw new Error('No workout in progress');
  if (!db.exercises.some((e) => e.id === exerciseId)) throw new Error('Unknown exercise');
  if (!Number.isFinite(weightKg) || weightKg < 0) throw new Error('Invalid weight');
  if (!Number.isInteger(reps) || reps < 1) throw new Error('Invalid reps');
  const set = { id, exerciseId, weightKg, reps, loggedAt: now };
  return updateActiveWorkout(db, (w) => ({ ...w, sets: [...w.sets, set] }));
}

// Parses typed weight ("62,5" or "62.5"). Returns a number >= 0, or null.
export function parseWeight(text) {
  const clean = String(text).trim().replace(',', '.');
  if (!/^\d+(\.\d+)?$/.test(clean)) return null;
  return Number(clean);
}

// Parses typed reps. Returns an integer >= 1, or null.
export function parseReps(text) {
  const clean = String(text).trim();
  if (!/^\d+$/.test(clean)) return null;
  const reps = Number(clean);
  return reps >= 1 ? reps : null;
}

// endedAt - startedAt in milliseconds. A workout in progress uses `now`.
export function durationMs(workout, now) {
  const end = workout.endedAt ?? now;
  return Math.max(0, Date.parse(end) - Date.parse(workout.startedAt));
}

// 3930000 -> "1:05:30"
export function formatDuration(ms) {
  const totalSeconds = Math.floor(ms / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  return `${hours}:${pad(minutes)}:${pad(seconds)}`;
}

// The exercises of a workout with their sets, in the order each exercise
// first appears: [{ exercise, sets }].
export function workoutExercises(db, workout) {
  const groups = new Map();
  for (const set of workout.sets) {
    if (!groups.has(set.exerciseId)) {
      const exercise = db.exercises.find((e) => e.id === set.exerciseId);
      groups.set(set.exerciseId, { exercise, sets: [] });
    }
    groups.get(set.exerciseId).sets.push(set);
  }
  return [...groups.values()];
}

// Finished workouts, newest first.
export function finishedWorkouts(db) {
  return db.workouts.filter((w) => w.endedAt !== null).reverse();
}

function updateActiveWorkout(db, update) {
  return { ...db, workouts: db.workouts.map((w) => (w.endedAt === null ? update(w) : w)) };
}

function pad(n) {
  return String(n).padStart(2, '0');
}
