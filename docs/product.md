# Product: Gym Tracker

## What it is
A personal app to log my gym workouts and see my progress over time.

## Who it is for
Only me. A single user, no accounts and no login.

## Where and how it is used
- Mainly on my phone, **during the workout, between sets**.
- It is operated with one hand, often in a hurry and with sweaty hands:
  big buttons and very little text to type.
- It must work without an internet connection.
- The phone may lock or the browser may close in the middle of a workout:
  nothing can be lost.

## How I train
I improvise every day. There are no fixed routines or templates. What I do
in a workout is decided on the fly.

## Features (MVP)
1. **Start workout**: a button that starts the timer. Duration is
   calculated automatically when the workout ends; it is never typed by hand.
2. **Log exercises and sets**: for each exercise, sets with weight and
   repetitions.
   - Exercises are typed by hand, but the app suggests the ones I have
     used before to avoid duplicates (e.g. "Bench press" vs "Barbell bench
     press").
   - "Repeat last set" button.
   - Weight and repetitions prefilled with the values from the last time.
3. **End workout**: I can add a free-text label for what I trained
   (e.g. "chest and triceps") and notes. Both are optional.
4. **History**: list of past workouts showing date, duration and exercises.

## Future features (in priority order)
1. Monthly calendar showing the days I went; tapping a day shows that workout.
2. Statistics: days per week, total time, streak and progress per exercise.
3. Export and import backup.
4. Rest timer between sets.
5. Personal records, dark mode, keep the screen on during the workout.

## Out of scope (for now)
- User accounts and syncing between devices.
- Server or cloud database.
- Predefined routines or workout templates.
- Sharing workouts with other people.

## Principles
- Logging a set should take less than 5 seconds.
- Every action is saved instantly; there is never a "save" button to
  depend on.
- My data lives only on my phone and never leaves it.
- Simple over complete.
