# Data model

This document defines how Gym Tracker stores data. It follows the principles
in [product.md](product.md). If you change the data model, update this file
in the same change.

## Overview

All data is one JSON document, the **database**. It is stored on the device
under a single `localStorage` key and is the exact same shape as the
export/import backup file.

```
database
├── schemaVersion
├── exercises[]   the catalog of exercise names ever used
└── workouts[]
    └── sets[]    each set points to one exercise by id
```

- An **exercise** is a name in the catalog, shared by every workout.
- A **workout** is one gym session, with a start and an end.
- A **set** belongs to exactly one workout and refers to exactly one exercise.

Relationships:

- workout 1 ── * set
- exercise 1 ── * set
- A workout's "exercises" are derived from its sets, in the order each
  exercise first appears. They are never stored separately.

## Entities

### Database (root)

| Field           | Type     | Notes                                             |
|-----------------|----------|---------------------------------------------------|
| `schemaVersion` | integer  | Starts at `1`. Increase it when the shape changes. |
| `exercises`     | array    | List of `exercise` objects.                       |
| `workouts`      | array    | List of `workout` objects, oldest first.          |

### Exercise

| Field            | Type   | Notes                                                  |
|------------------|--------|--------------------------------------------------------|
| `id`             | string | Unique id (`crypto.randomUUID()`).                     |
| `name`           | string | Display name, as the user first typed it (trimmed).    |
| `normalizedName` | string | Matching key, see "Exercise name matching". Unique.    |
| `createdAt`      | string | ISO 8601 UTC timestamp.                                |

### Workout

| Field       | Type           | Notes                                                    |
|-------------|----------------|----------------------------------------------------------|
| `id`        | string         | Unique id.                                               |
| `startedAt` | string         | ISO 8601 UTC. Set when "Start workout" is tapped.        |
| `endedAt`   | string \| null | ISO 8601 UTC. `null` means the workout is in progress.   |
| `label`     | string         | Optional free text, e.g. "chest and triceps". Default `""`. |
| `notes`     | string         | Optional free text. Default `""`.                        |
| `sets`      | array          | List of `set` objects, in the order they were logged.    |

### Set

| Field        | Type    | Notes                                                   |
|--------------|---------|---------------------------------------------------------|
| `id`         | string  | Unique id.                                              |
| `exerciseId` | string  | Must match the `id` of an exercise in `exercises`.      |
| `weightKg`   | number  | Kilograms, `>= 0`. `0` means bodyweight or no load.     |
| `reps`       | integer | `>= 1`.                                                 |
| `loggedAt`   | string  | ISO 8601 UTC. When the set was logged.                  |

## Rules

### Duration is computed, never stored

Duration is always `endedAt - startedAt`. There is no `duration` field and
the user never types one. A workout with `endedAt === null` shows a live
duration based on the current time.

### Only one workout in progress

At most one workout may have `endedAt === null`. When the app opens and
finds one, it resumes it. This is how a locked phone or a closed browser
loses nothing.

### Exercise name matching

To avoid duplicates like "Bench press" and "bench  press":

1. **Normalize** every typed name to build `normalizedName`:
   trim, lowercase, collapse repeated spaces into one, remove accents
   (Unicode NFD, then drop combining marks).
2. **Exact match:** if an exercise with the same `normalizedName` exists,
   reuse it. Never create a second one.
3. **Suggestions:** while typing, show existing exercises whose
   `normalizedName` contains every typed word (e.g. typing "bench" suggests
   both "Bench press" and "Barbell bench press"), most recently used first.
4. **Never merge automatically.** "Bench press" and "Barbell bench press"
   may be different exercises. The suggestion list makes it easy to pick
   the existing one, and the user decides.

### Prefill and "Repeat last set"

- **Prefill:** when an exercise is selected, weight and reps come from the
  most recent set of that exercise across all workouts (latest `loggedAt`).
  If there is none, the fields are empty.
- **Repeat last set:** adds a new set copying `exerciseId`, `weightKg` and
  `reps` from the last set of the current workout, with a new `id` and
  `loggedAt`.

### Every action is saved immediately

There is no "save" button. Every change (start workout, add/edit/delete a
set, end workout, edit label or notes) writes the whole database to
`localStorage` right away, before the screen is updated. The database is
small (years of workouts fit well under 1 MB), so rewriting it every time
is fine.

### Data stays on the device

- Storage is `localStorage` only, under the key `gymTracker.db`.
- No network requests ever send this data anywhere.

### Export and import

- **Export** downloads the database as-is, as a single file
  (e.g. `gym-tracker-2026-10-29.json`).
- **Import** reads such a file, checks `schemaVersion` and validates the
  shape, and replaces the current database only after the user confirms.
- If `schemaVersion` is older than the app's version, the app migrates it
  step by step (`1 → 2 → ...`) before using it. Each migration is a pure
  function, with a test.

### Deleting

Deleting a workout removes it and its sets. Exercises are never deleted
automatically, even when no set uses them anymore. They stay as
suggestions.

## Example

A database with one finished workout and one in progress:

```json
{
  "schemaVersion": 1,
  "exercises": [
    {
      "id": "6f1c2a1e-1b7d-4a53-9a1e-2f0f4c1d9b01",
      "name": "Bench press",
      "normalizedName": "bench press",
      "createdAt": "2026-10-27T17:05:12.000Z"
    },
    {
      "id": "b2d9e4c3-7a10-4f4e-8c2b-5e6a7d8f9a02",
      "name": "Pull-ups",
      "normalizedName": "pull-ups",
      "createdAt": "2026-10-27T17:31:40.000Z"
    }
  ],
  "workouts": [
    {
      "id": "c3a8f0d2-2e4b-4b6a-9d3c-7f1e2a3b4c03",
      "startedAt": "2026-10-27T17:00:00.000Z",
      "endedAt": "2026-10-27T18:05:30.000Z",
      "label": "chest and back",
      "notes": "Shoulder felt fine.",
      "sets": [
        {
          "id": "d4b9a1e3-3f5c-4c7b-8e4d-8a2f3b4c5d04",
          "exerciseId": "6f1c2a1e-1b7d-4a53-9a1e-2f0f4c1d9b01",
          "weightKg": 60,
          "reps": 10,
          "loggedAt": "2026-10-27T17:06:00.000Z"
        },
        {
          "id": "e5c0b2f4-4a6d-4d8c-9f5e-9b3a4c5d6e05",
          "exerciseId": "6f1c2a1e-1b7d-4a53-9a1e-2f0f4c1d9b01",
          "weightKg": 60,
          "reps": 8,
          "loggedAt": "2026-10-27T17:09:30.000Z"
        },
        {
          "id": "f6d1c3a5-5b7e-4e9d-8a6f-0c4b5d6e7f06",
          "exerciseId": "b2d9e4c3-7a10-4f4e-8c2b-5e6a7d8f9a02",
          "weightKg": 0,
          "reps": 12,
          "loggedAt": "2026-10-27T17:32:00.000Z"
        }
      ]
    },
    {
      "id": "a7e2d4b6-6c8f-4f0e-9b7a-1d5c6e7f8a07",
      "startedAt": "2026-10-29T17:10:00.000Z",
      "endedAt": null,
      "label": "",
      "notes": "",
      "sets": [
        {
          "id": "b8f3e5c7-7d9a-4a1f-8c8b-2e6d7f8a9b08",
          "exerciseId": "6f1c2a1e-1b7d-4a53-9a1e-2f0f4c1d9b01",
          "weightKg": 62.5,
          "reps": 8,
          "loggedAt": "2026-10-29T17:14:00.000Z"
        }
      ]
    }
  ]
}
```

The first workout lasted 1 h 5 min 30 s (`endedAt - startedAt`). The second
is in progress, and its exercises are derived from its sets: "Bench press".
