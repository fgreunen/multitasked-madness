# Project guidance

Before implementation, read [DESIGN.md](DESIGN.md) for the current product and acceptance requirements. Latest user instructions take precedence. Update DESIGN.md when agreed behavior changes.

Consult [README.md](README.md) for local play, build commands, navigation and scripted probes. [TODO.md](TODO.md) contains outstanding work; mark it complete only after verification. For superseded implementations or evidence, consult only the relevant material indexed by [archive/README.md](archive/README.md); it does not define current behavior.

Use `rg` first for searches.

## Code navigation

- [src/config.js](src/config.js): gameplay tuning.
- [src/game.js](src/game.js): pure Game rules, elapsed-time integration, round history and PageSession progression/baseline ownership.
- [src/app.js](src/app.js): rendering, browser input, clock synchronization and results presentation.
- [src/contribution-chart.js](src/contribution-chart.js): chart data.
- [index.html](index.html) and [styles.css](styles.css): page structure and layout.

## Verification

Choose checks proportionate to the change using [DESIGN.md's acceptance requirements](DESIGN.md#implementation-and-acceptance) and [README.md's commands](README.md#verify-and-build). Preserve historical tests and audits separately from active tests. Scripted probes are not evidence of human pacing, fairness or optimal strategy.
