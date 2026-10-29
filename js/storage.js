// The ONLY module that touches localStorage. The whole database is stored
// as one JSON document under STORAGE_KEY (see docs/data.md).
// `storage` defaults to the browser's localStorage; tests pass a fake.

import { emptyDb, SCHEMA_VERSION } from './model.js';

export const STORAGE_KEY = 'gymTracker.db';

// Returns the saved database, or an empty one if nothing is saved yet.
// Throws if the saved data cannot be read, so it is never overwritten
// by mistake with an empty database.
export function load(storage = globalThis.localStorage) {
  const text = storage.getItem(STORAGE_KEY);
  if (text === null) return emptyDb();
  const db = JSON.parse(text);
  if (!isDatabase(db)) throw new Error('Saved data has an unexpected shape');
  if (db.schemaVersion > SCHEMA_VERSION) {
    throw new Error('Saved data was created by a newer version of the app');
  }
  return db;
}

// Writes the whole database right away.
export function save(db, storage = globalThis.localStorage) {
  storage.setItem(STORAGE_KEY, JSON.stringify(db));
}

function isDatabase(db) {
  return db !== null
    && typeof db === 'object'
    && Number.isInteger(db.schemaVersion)
    && Array.isArray(db.exercises)
    && Array.isArray(db.workouts);
}
