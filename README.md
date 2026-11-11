# Gym Tracker

A personal web app to log gym workouts from your phone, between sets.
Start a workout, log exercises with weight and reps, end it, and see your
history. It works offline, saves every action instantly, and keeps all data
on your device. No accounts, no server.

> Status: iteration 1. Start and finish workouts, log sets, see history.
> Offline support is not built yet.

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

## Publish with GitHub Pages

The app is plain static files, so GitHub Pages can host it as-is (no build).

1. Push the code to the `main` branch on GitHub.
2. On GitHub, open the repository → **Settings** → **Pages**.
3. Under **Build and deployment**, set **Source** to **Deploy from a branch**,
   then pick branch **`main`** and folder **`/ (root)`**, and click **Save**.
4. After a minute or two the app is live at
   `https://<user>.github.io/<repo-name>/` (the URL is shown on the same page).

Every push to `main` updates the site.

Notes:
- All file paths in the app are relative, so it works from the
  `/<repo-name>/` subfolder. `tests/paths.test.js` checks this.
- `.nojekyll` tells GitHub Pages to serve the files as they are, without
  running its Jekyll site builder.
- Your workout data still lives only in the browser on your phone. GitHub
  only serves the app files.

## Docs

- [docs/product.md](docs/product.md): what the app does and why.
- [docs/data.md](docs/data.md): how data is stored.
- [docs/architecture.md](docs/architecture.md): how the code is organized.
- [CLAUDE.md](CLAUDE.md): instructions for Claude Code.
