# Multitasked Madness

A native browser game about attention: hold one column to build contribution, release to switch, and compare a four-column round with a two-column WIP limit. Each round lasts one minute. Native HTML/CSS/JavaScript, with no dependencies or external assets.

## Play locally

Requires Node.js 20+:

```sh
npm run dev
```

Open [the local game](http://127.0.0.1:4173). Hold a Focus button to start; Space/Enter also work on a focused button. Completing Level 1 unlocks Level 2 for the open page. Reloading resets progression.

## Verify and build

```sh
npm test
npm run simulate
npm run build
npm run preview
```

`npm test` runs the active `tests/*.test.mjs` suites. Model tests cover analytic scoring and timing; session tests cover progression and baseline ownership; handler/chart tests cover interaction and presentation. Use [DESIGN.md's acceptance requirements](DESIGN.md#implementation-and-acceptance) for browser/layout checks.

The build copies seven static assets into `dist/`. Preview serves that directory; development serves source. Both servers allowlist the same game assets and bind to loopback. Set `PORT` to choose a different port.

## Navigation and tuning

- [DESIGN.md](DESIGN.md): current rules, presentation and acceptance requirements.
- [src/config.js](src/config.js): gameplay tuning; values remain provisional pending human playtesting.
- [src/game.js](src/game.js): analytic round rules and page-session progression.
- [src/app.js](src/app.js): browser input, rendering and results presentation.
- [src/contribution-chart.js](src/contribution-chart.js): chart paths and shared scaling.
- [index.html](index.html) / [styles.css](styles.css): structure and layout.
- [GLOSSARY.md](GLOSSARY.md): page session, round and baseline terminology.
- [TODO.md](TODO.md): outstanding work.
- [archive/](archive/README.md): historical tests, audits and work logs.

## Scripted evidence

`npm run simulate` prints deterministic policy probes for both levels. `npm run audit` regenerates [CONTRIBUTION-AUDIT.json](CONTRIBUTION-AUDIT.json). Scores are internal contribution units; multiply by `CONFIG.contributionDisplayScale` for displayed points. Rotations visit only playable columns, so the levels can receive different focus decisions. These probes establish reproducible outcomes, not human pacing, fairness, optimal strategy or a guaranteed WIP benefit.

The small version label at the top right identifies the release. Keep it in sync with `package.json` when changing versions.
