# Multitasked Madness

A native browser game about attention. Four differently coloured columns with identical rules, one focus, one minute to maximise contribution. No dependencies, accounts or settings screen.

A short paragraph below the header introduces the attention and contribution premise, inviting players to explore focus, switching and comparisons across levels.

## Play locally

Requires Node.js 20+:

```sh
npm run dev
```

Open http://127.0.0.1:4173 and hold any column’s activator to start the round and make that column rise; release and hold another to switch. Only one activator can build at a time. Clicking the column itself does nothing. Focused activators also support holding Space or Enter.

Level 1 starts with all four columns at zero. Each fresh hold ramps growth linearly from zero to 10 percentage points/s over two seconds, filling an empty column in 11 seconds if held continuously. Release resets the warm-up. The held button immediately highlights and shows a small "Warming up" label and progress line until full growth speed; it then shows normal Focusing. Both levels use the same ramp. At 100% it stays full while held: it never completes, resets or gets replaced. Released columns decay at a constant 3.85 percentage points per second at every height, eventually reaching zero. Every filled column keeps earning contribution, including while released. At 100% a column earns 100 displayed points per second; 50% earns 25; zero earns nothing. Contribution accumulates continuously, with no completion payouts or penalties.

Completing the full Level 1 round unlocks **Level 2**, regardless of score. Use **Continue to Level 2** in the results, or select it between rounds. Level 2 keeps all four columns visible but only the two on the left are playable. The two on the right are permanently greyed out, remain at zero and never contribute or activate. The two-column WIP limit is the only rules difference: duration, growth, decay, contribution and input behavior are identical.

Level buttons cannot interrupt a running or paused round. Play again retries the current level; changing level prepares a fresh round that starts on its first Focus press. The unlock lasts for the open page, including retries and level changes; reloading starts progression at Level 1. There is no new saved data or score requirement.

The only ending is the timer reaching 60 running seconds. Pause freezes everything; hidden tabs automatically pause and require Resume. Losing focus while still visible releases the hold and lets time continue. Pointer release outside the button, cancellation and capture loss all stop holding. Resume requires a fresh hold. Results show total contribution, average contribution per second and the final graph, with no per-column statistics. Play again resets to the ready screen with empty columns.

There are no workers, stakeholders, satisfaction, categories, urgency, importance, task arrivals, sizes, scope creep, dependencies or saved comparisons. Old session storage is ignored. There is no audio or sound control. No external fonts/assets are fetched. Reduced-motion preferences are respected.

The screen shows integer total contribution, a labelled combined rate ("Contribution per second: +0"), a full-round cumulative contribution graph and time remaining. Contribution totals, current/average rates, graph values and comparison labels are multiplied by CONFIG.contributionDisplayScale (100) before integer rounding; internal scoring retains fractions in its original units. Heights and time are unchanged. Each column’s percentage is centered inside its top ~10%; visible column names and individual rates are omitted. Buttons read Focus / Focusing, with one short footnote explaining that higher columns contribute disproportionately more, followed by a compact height-to-points/s reference at quarter-height intervals derived from the scoring function. Each column has a different green/coral/blue/purple hue. The graph samples exact active seconds and shows the live endpoint; it freezes on pause/end and clears on retry. Results include the final graph. In Level 2, a dashed line shows the latest completed Level 1 run across the entire minute, prepopulated before play. Both lines use the same scale, with a compact legend. The comparison survives retries and level changes, is replaced only by another completed Level 1 run and clears on reload. At the end of Level 2, a compact analysis shows the points gained/lost and percentage change versus that Level 1 run, plus both totals and average points per second. Column switches and average focus hold are omitted. The results add a short reflection: “WIP limit seems to work for you!” for higher Level 2 contribution, “You contributed more without the WIP limit this time.” for lower contribution, and “Your contribution was the same in both levels.” for a tie. It handles ties, changes smaller than one point/percent and a zero Level 1 baseline without dividing by zero. Differences are calculated from unrounded values before display scaling. This describes the two played rounds without attributing the difference to the WIP limit.

Desktop column tracks and their Focus buttons are 30% narrower within their existing grid cells. Smaller screens retain wider controls. Gameplay arrows are removed; focused styling and percentages show activity, with growing/decaying/frozen descriptions retained for assistive technology. Colour never changes the rules.

## Tuning

All values live in [src/config.js](src/config.js). Rates remain provisional. The constant decay rate uses the previous curve's midpoint (3.85 percentage points/s); full-speed growth is unchanged; contribution now follows the agreed quadratic curve; the shared focus warm-up is a provisional switching-cost experiment.

| Parameter | Value | Meaning |
| --- | --- | --- |
| columns | 4 | Visible columns; all playable in Level 1 |
| level2Columns | 2 | Permanently playable left-hand columns in Level 2 |
| roundSeconds | 60 | Active round duration; sole end condition |
| startingProgress / maximumProgress | 0 / 100 | Height bounds |
| growthPerSecond | 10 | Full-speed percentage points gained per held second |
| warmupSeconds | 2 | Each fresh hold ramps from zero to full growth speed |
| decayPerSecond | 3.85 | Percentage points lost per second at every nonzero height |
| contributionAtFullPerSecond | 1 | Internal contribution units per second at full height |
| contributionDisplayScale | 100 | Displayed points per internal contribution unit |
| historySampleSeconds | 1 | Exact running-time interval for contribution graph samples |

For height `p` between 0 and 100, released decay is a constant 3.85 percentage points per second. A full released column takes approximately 25.97 seconds to reach zero. Internal contribution rate is `(p / 100) ** 2` units per second; displayed contribution uses 100 points per internal unit. The model integrates both growth/decay and contribution analytically through the 100%, zero and timer crossings, so frame sizes do not affect the outcome.

Configuration constraints: positive round duration, growth, maximum height and full-height contribution; `0 <= startingProgress < maximumProgress`; positive `decayPerSecond`; positive integer column count and `1 <= level2Columns <= columns`. The history sampling interval must be positive. UI duration/count/rate copy derives from configuration.

## Verify and build

`PageSession` in `src/game.js` owns page-session progression and the current `Game` round. Advance running time through the session so completion records the Level 1 baseline before rendering. `prepareRound()` retries the current level; passing a level selects it, with both actions limited to ready/ended rounds. Direct session tests cover progression without a browser; real-handler tests retain input and dialog coverage.

```sh
npm test
npm run simulate
npm run audit
npm run build
npm run preview
```

The test suite covers continuous scoring, constant decay, cap/zero crossings, frame independence, the exact timer boundary, one active input, pointer cancellation/capture loss, stable controls, keyboard holds, pause/visibility/blur, results/retry, exact history sampling, chart reset/freeze, accessible motion descriptions, Level 2 numeric analysis, delayed capture-loss and missed-release recovery, integer display, complete comparison lifecycle, timed Level 2 unlock, permanent WIP limits and identical shared rules between levels. Earlier test suites, including the superseded two-minute rules under `tests/history-pre-minute`, are retained under `tests/history-*` and are outside the active root test glob.

The build copies seven static files into `dist`: HTML, CSS, favicon, app, game, contribution-chart and config. The local loopback server serves only these assets. Build before publishing `dist` or using preview. Retired audio/satisfaction-chart/feedback outputs are removed from the build.

`CONTRIBUTION-AUDIT.json` records deterministic scripted probes in unscaled internal units (multiply by 100 for displayed points) for both levels with the shared tuning. Rotation visits only playable columns; different policies/column limits produce different focus decisions. These are not human playtests, an optimal strategy search, or evidence of pacing/fairness.

| Scripted policy | Active seconds | Level 1 contribution | Level 2 contribution |
| --- | --- | --- | --- |
| Idle | 60 | 0.000000 | 0.000000 |
| Hold one column | 60 | 52.334000 | 52.334000 |
| Switch to the next playable column every 2s | 60 | 0.370977 | 6.209107 |
| Switch to the next playable column every 10s | 60 | 44.940815 | 65.888655 |

`CONTRIBUTION-AUDIT-PRE-QUADRATIC.json` and `tests/history-pre-quadratic` preserve the previous linear scoring. `CONTRIBUTION-AUDIT-PRE-WARMUP.json` and `tests/history-pre-warmup` retain the previous immediate-growth evidence. `CONTRIBUTION-AUDIT-PRE-MINUTE.json` preserves the previous 120-second, height-dependent decay probes. `CONTRIBUTION-AUDIT-PRE-LEVELS.json` retains the earlier single-level probe. `CONTRIBUTION-AUDIT-PRE-DECAY.json` preserves the earlier 1–6 decay probe. Older `BALANCE-AUDIT*.json` files describe superseded mechanics and cannot be compared with this scoring system. Previous source/docs are retained locally in `.backup-pre-contribution`; historical work remains in TODO.md.
