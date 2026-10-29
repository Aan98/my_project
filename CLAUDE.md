# Gym Tracker

A personal, single-user web app to log gym workouts from a phone, between
sets, with one hand. The user starts a workout, logs exercises and sets
(weight in kg and reps) with as little typing as possible, ends the workout
with an optional label and notes, and browses a history of past workouts.
It works offline, saves every action instantly, and keeps all data on the
device.

## Docs (source of truth)

- Product: @docs/product.md
- Data model: @docs/data.md
- Architecture: @docs/architecture.md

If these docs and the code disagree, the docs win. Ask before deviating.

## Tech stack

- Static web app: HTML, CSS, vanilla JavaScript (ES modules).
- No framework, no build step, no npm dependencies.
- Storage: `localStorage`, accessed only through `js/storage.js`.
- Offline: service worker (`sw.js`) + web app manifest.
- Tooling: Node.js LTS (22+) for tests and the local server only.

## Commands

Run from the project root.

- Run the app: `npx --yes serve .` then open http://localhost:3000
- Run all tests: `node --test`

## Hard rules

Out of scope (from product.md), never add:
- No user accounts, no login, no syncing between devices.
- No backend, no server code, no cloud database, no network calls with
  user data.
- No predefined routines or workout templates.
- No sharing workouts with other people.

Technical rules:
- No frameworks, build tools or npm packages without explicit approval.
- Only `js/storage.js` touches `localStorage`. UI code never does.
- `js/model.js` stays pure: no DOM, no storage, no `Date.now()` (pass time in).
- Every user action is saved immediately. Never add a "save" button.
- Duration is always computed from `startedAt`/`endedAt`, never stored or typed.
- Weight is always in kg; `0` is allowed (bodyweight).
- Mobile-first: big tap targets (48 px+), minimal typing.
- Everything in English: code, comments, file names, docs.
- Never modify `docs/product.md` unless the user asks.

Git rules:
- Never run `git add`, `git commit`, `git push`, `git merge`, `git rebase`
  or `git reset`. The user commits.
- Creating and switching to a new feature branch is allowed.
- At the end of a task, suggest a short commit message in English.

## How to add a feature

1. **Read** `docs/product.md` and the docs relevant to the feature.
2. **Plan:** propose a short plan (files to change, approach, tests to add)
   and **wait for the user's approval**. Ask if anything is ambiguous
   (at most 3 questions at a time).
3. **Branch:** create a new branch from `main`, e.g.
   `git switch -c feature/calendar`. Confirm the working tree is clean first.
4. **Implement** the smallest version that satisfies the plan. Keep logic in
   `model.js`, storage in `storage.js`, screens in `js/ui/`.
5. **Test:** add or update tests in `tests/`, run `node --test`, and make sure
   all tests pass. Check the UI in the browser at phone width.
6. **Update docs:** if the data model changed, update `docs/data.md` (and
   bump `schemaVersion` with a migration). If the structure changed, update
   `docs/architecture.md`.
7. **Report:** summarize what changed, how it was tested, and suggest a
   commit message. **Do not commit.**
