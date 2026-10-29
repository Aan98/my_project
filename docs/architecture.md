# Architecture

How the Gym Tracker code is organized. Read [product.md](product.md) for what
the app does and [data.md](data.md) for the data model. If you change the
structure described here, update this file in the same change.

## Stack

- **Static web app:** HTML, CSS and vanilla JavaScript (ES modules).
- **No framework and no build step.** The app has a handful of simple
  screens, so a framework would add tooling and dependencies without solving
  a real problem; the files in the repo are exactly the files the browser runs.
- **No server and no backend.** Any static file server can host it.
- **Offline:** a service worker caches all app files, and a web app manifest
  lets it be installed on the phone's home screen.
- **Storage:** `localStorage` (see [data.md](data.md)). Writes are
  synchronous, so data is on disk before the browser can be closed.
- **Tooling:** Node.js LTS (22 or newer), used only to run tests and a local
  server. The app itself never needs Node.

## Folder layout

```
/
├── index.html            single page, holds all screens
├── manifest.webmanifest  app name, icons, colors (installable app)
├── sw.js                 service worker: caches app files for offline use
├── css/
│   └── styles.css        mobile-first styles
├── js/
│   ├── app.js            entry point: loads data, wires actions to screens
│   ├── storage.js        the ONLY file that touches localStorage
│   ├── model.js          pure logic: no DOM, no storage
│   └── ui/               one module per screen
│       ├── workout.js    active workout: exercises, sets, end workout
│       └── history.js    list of past workouts
├── icons/                app icons for the manifest
├── tests/
│   └── *.test.js         tests for model.js (and storage.js with a fake)
└── docs/                 product, data and architecture docs
```

Files are created when the first feature that needs them is built.
`sw.js` must stay at the root so it can control the whole app.

## Layers: storage is separate from the UI

```
 ui/*.js  ──calls──▶  app.js  ──uses──▶  model.js   (pure functions)
    ▲                   │
    └───── render ──────┤
                        └──uses──▶  storage.js  ──▶  localStorage
```

- **`model.js`**: pure functions that take the database (and inputs) and
  return a new database or a computed value: `startWorkout`, `addSet`,
  `repeatLastSet`, `endWorkout`, `normalizeName`, `findOrCreateExercise`,
  `suggestExercises`, `lastSetFor`, `durationMs`, `migrate`, etc. No DOM,
  no `localStorage`, no `Date.now()` inside: the current time is passed in
  as an argument so tests are predictable.
- **`storage.js`**: `load()` returns the database (or an empty one) and runs
  migrations; `save(db)` writes it. It is the only module that knows the
  `localStorage` key. Export/import also live here.
- **`app.js`**: holds the current database in memory. Every user action
  follows the same path:
  1. call a `model.js` function to get the new database,
  2. `storage.save(newDb)` immediately,
  3. re-render the current screen.
- **`ui/*.js`**: build the DOM for one screen and call `app.js` actions on
  events. They never read or write storage directly.

## Mobile-first UI rules

- Design for a phone held in one hand first, then let it grow for larger
  screens with `min-width` media queries.
- Tap targets at least 48×48 px; main actions within thumb reach (bottom of
  the screen).
- Numeric inputs use `inputmode="decimal"` (weight) and
  `inputmode="numeric"` (reps) to open the number keyboard.
- Minimal typing: prefill values, suggestion lists, "Repeat last set".

## Offline

- `sw.js` precaches `index.html`, CSS, JS and icons on install and serves
  them from cache first.
- When app files change, bump the cache version constant in `sw.js` so
  phones download the new version.
- Service workers only run on `https://` or `localhost`. To use the app on
  the phone, it must be hosted on any static HTTPS host (e.g. GitHub Pages).
  That only serves the app files; the user's data still never leaves the
  phone.

## Run locally

Requires Node.js LTS. From the project root:

```bash
npx --yes serve .
```

Then open the URL it prints (usually http://localhost:3000). `serve` is
downloaded on demand by `npx` and is not a project dependency.

To check the phone layout on a computer, use the browser's device mode
(DevTools → "Toggle device toolbar").

## Testing

- Node's built-in test runner (`node:test`) and assertions (`node:assert`).
  No npm packages, no `package.json` needed.
- Tests live in `tests/` and are named `*.test.js`.
- Focus on `model.js`, where all the logic lives: name normalization,
  suggestions, prefill, duration, migrations. Test `storage.js` with a small
  in-memory fake of `localStorage`.
- UI is checked by hand in the browser.

Run all tests from the project root:

```bash
node --test
```
