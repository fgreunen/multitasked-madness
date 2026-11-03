# Project guidance

Before implementation, read [DESIGN.md](DESIGN.md) for the current product and acceptance requirements. Latest user instructions take precedence. Update DESIGN.md when agreed behavior changes.

Consult [README.md](README.md) for local play, build commands, tuning and recorded probes. Read only task-relevant sections of [TODO.md](TODO.md) when investigating history or updating progress; historical entries do not define current behavior. Mark work complete only after verification.

Use `rg` first for searches.

## Code navigation

- [src/config.js](src/config.js): gameplay tuning.
- [src/game.js](src/game.js): pure rules, elapsed-time integration and round history.
- [src/app.js](src/app.js): rendering, input and page-session progression.
- [src/contribution-chart.js](src/contribution-chart.js): chart data.
- [index.html](index.html) and [styles.css](styles.css): page structure and layout.

## Verification

Choose checks proportionate to the change using [DESIGN.md's acceptance requirements](DESIGN.md#implementation-and-acceptance) and [README.md's commands](README.md#verify-and-build). Preserve historical tests and audits separately from active tests. Scripted probes are not evidence of human pacing, fairness or optimal strategy.
