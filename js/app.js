// Entry point. Holds the database in memory and runs every user action
// the same way: model.js computes the new database, storage.js saves it
// immediately, then the current screen is redrawn.

import * as model from './model.js';
import * as storage from './storage.js';
import { renderWorkout, updateTimer } from './ui/workout.js';
import { renderHistory } from './ui/history.js';

const screens = {
  workout: document.getElementById('workout-screen'),
  history: document.getElementById('history-screen'),
};
const tabs = document.querySelectorAll('.tab');
const appError = document.getElementById('app-error');

let db;
let currentScreen = 'workout';
// Exercises added to the current workout that have no sets yet. They live
// only in memory: a workout's exercises are derived from its sets.
let pendingExerciseIds = [];
let focusExerciseId = null;

const actions = {
  start() {
    commit(model.startWorkout(db, { now: nowIso(), id: crypto.randomUUID() }));
  },

  addExercise(name) {
    if (!model.normalizeName(name)) return 'Type an exercise name.';
    const result = model.findOrCreateExercise(db, { name, now: nowIso(), id: crypto.randomUUID() });
    if (!pendingExerciseIds.includes(result.exercise.id)) pendingExerciseIds.push(result.exercise.id);
    focusExerciseId = result.exercise.id;
    commit(result.db);
    return null;
  },

  addSet(exerciseId, weightText, repsText) {
    const weightKg = model.parseWeight(weightText);
    const reps = model.parseReps(repsText);
    if (weightKg === null) return 'Enter a weight in kg (0 for bodyweight).';
    if (reps === null) return 'Enter reps (1 or more).';
    focusExerciseId = exerciseId;
    commit(model.addSet(db, { exerciseId, weightKg, reps, now: nowIso(), id: crypto.randomUUID() }));
    return null;
  },

  finish() {
    pendingExerciseIds = [];
    commit(model.endWorkout(db, { now: nowIso() }));
  },
};

// Save first, then update memory and screen. If saving fails, nothing changes.
function commit(newDb) {
  try {
    storage.save(newDb);
  } catch (error) {
    showError(`Could not save: ${error.message}`);
    return;
  }
  db = newDb;
  render();
  focusExerciseId = null;
}

function render() {
  for (const [name, section] of Object.entries(screens)) section.hidden = name !== currentScreen;
  for (const tab of tabs) {
    if (tab.dataset.screen === currentScreen) tab.setAttribute('aria-current', 'page');
    else tab.removeAttribute('aria-current');
  }
  if (currentScreen === 'workout') renderWorkout(screens.workout, workoutView(), actions);
  else renderHistory(screens.history, historyView());
}

function workoutView() {
  const workout = model.activeWorkout(db);
  if (!workout) return { active: false };

  const groups = model.workoutExercises(db, workout);
  for (const id of pendingExerciseIds) {
    if (!groups.some((g) => g.exercise.id === id)) {
      groups.push({ exercise: db.exercises.find((e) => e.id === id), sets: [] });
    }
  }

  return {
    active: true,
    timerText: model.formatDuration(model.durationMs(workout, nowIso())),
    startedText: `Started at ${formatTime(workout.startedAt)}`,
    focusExerciseId,
    exercises: groups.map(({ exercise, sets }) => ({
      id: exercise.id,
      name: exercise.name,
      sets: sets.map((set) => ({ id: set.id, text: `${set.weightKg} kg × ${set.reps}` })),
    })),
  };
}

function historyView() {
  return model.finishedWorkouts(db).map((workout) => ({
    id: workout.id,
    dateText: `${formatDate(workout.startedAt)}, ${formatTime(workout.startedAt)}`,
    durationText: model.formatDuration(model.durationMs(workout, workout.endedAt)),
    exerciseNames: model.workoutExercises(db, workout).map((g) => g.exercise.name),
  }));
}

function tickTimer() {
  const workout = db && model.activeWorkout(db);
  if (currentScreen === 'workout' && workout) {
    updateTimer(screens.workout, model.formatDuration(model.durationMs(workout, nowIso())));
  }
}

function nowIso() {
  return new Date().toISOString();
}

// English UI text, in the phone's local time zone.
function formatDate(iso) {
  return new Date(iso).toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' });
}

function formatTime(iso) {
  return new Date(iso).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
}

function showError(message) {
  appError.textContent = message;
  appError.hidden = false;
}

for (const tab of tabs) {
  tab.addEventListener('click', () => {
    currentScreen = tab.dataset.screen;
    render();
  });
}

try {
  db = storage.load();
  render();
  setInterval(tickTimer, 1000);
} catch (error) {
  // Do not start with an empty database: that would overwrite saved data.
  showError(`Your saved data could not be read (${error.message}). Nothing was changed.`);
}
