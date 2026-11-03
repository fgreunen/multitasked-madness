# Historical material

These files preserve superseded iterations. Current behavior and acceptance requirements live in [DESIGN.md](../DESIGN.md); current work lives in [TODO.md](../TODO.md).

- [tests/](tests/): previous test snapshots, grouped by the change that superseded them.
- [audits/](audits/): earlier contribution and balance probes. Different mechanics and units make many results incomparable with the current game.
- [REVIEW.md](REVIEW.md): the October review of the retired task/stakeholder game.
- [TODO.md](TODO.md): the complete work log preserved before repository cleanup on 3 November 2026, including historical open items that no longer apply.

The moved files are preserved byte-for-byte. Relative paths, commands, screenshots and claims inside them describe their original checkout and may no longer resolve. Archived tests are reference snapshots, not standalone runnable suites: they import code from superseded versions. `npm test` runs only the active tests in the root of `tests/`; archives are outside the application build and server allowlist.

The current scripted evidence remains at [CONTRIBUTION-AUDIT.json](../CONTRIBUTION-AUDIT.json). Historical source backups, if present, remain local ignored `.backup*` directories.
