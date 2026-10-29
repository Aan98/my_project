# Gym Tracker

A personal web app to log gym workouts from your phone, between sets.
Start a workout, log exercises with weight and reps, end it, and see your
history. It works offline, saves every action instantly, and keeps all data
on your device. No accounts, no server.

> Status: early setup. The app itself is not built yet.

## Run it locally

1. Install [Node.js](https://nodejs.org/) (LTS version).
2. From the project folder, start a local server:

   ```bash
   npx --yes serve .
   ```

3. Open http://localhost:3000 in your browser.

## Run the tests

```bash
node --test
```

## Docs

- [docs/product.md](docs/product.md): what the app does and why.
- [docs/data.md](docs/data.md): how data is stored.
- [docs/architecture.md](docs/architecture.md): how the code is organized.
- [CLAUDE.md](CLAUDE.md): instructions for Claude Code.
