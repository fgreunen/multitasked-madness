# TODO

## Quadratic contribution — 3 November 2026

- [x] Reward high progress using squared normalized height in both levels. Integrate quadratic rates analytically through warm-up, cap, decay-to-zero and exact timer boundaries; preserve other mechanics.
- [x] Explain the curve with a shared 25/50/75/100% height-to-points/s reference derived from scoring and a new footnote, reusing quarter-height track guides without live per-column rates. Preserve the game introduction.
- [x] All 50 model/input/chart checks pass; preserve linear-scoring tests/audit separately and regenerate current probes.
- [ ] Browser-check both desktop sizes, mouse input and round flow; verify all seven source/build/dev/preview assets.
- [ ] Human-playtest whether the new curve communicates the intended lesson; scripted probes do not prove balance or strategy optimality.

## Game introduction — 3 November 2026

- [x] Add a compact paragraph below the header explaining attention, contribution, focus/switching and comparison across levels. All 49 checks pass; board fits 1280x600 and 1024x768, with tighter short-screen spacing. All seven source/build/dev/preview assets match. Screenshot: .qa/game-introduction.png. Existing player round preserved; refresh to load the introduction.

## Shared focus warm-up — 31 October 2026

- [x] Add the same two-second zero-to-full growth ramp in both levels, with analytic ramp/cap/score integration and reset on release/pause/end/retry. Keep all other rates and the one-minute timer unchanged.
- [x] Add a stable Warming up badge/progress line on the held button, accessible announcement and immediate Focusing feedback; clear at full speed and whenever input clears.
- [x] Compare switches and average uninterrupted holds alongside contribution in Level 2 results; snapshot Level 1 metrics and preserve/reset them with the existing baseline lifecycle.
- [x] All 49 model/input/chart checks pass, including warm-up/reset/cap/frame independence, indicator lifecycle, metrics and shared-rule equivalence. Preserve pre-warm-up tests/audit.
- [x] Browser-verified active warm-up badge/progress line in both levels, mouse holds/switches, pause/resume, natural 60-second results, effort comparison and retry clearing indicators/metrics while retaining baseline. Board and expanded results fit 1280x600 and 1024x768; console is clean. All seven source/build/dev/preview assets match. Screenshots: .qa/warmup-active.jpg, warmup-1024x768.jpg and warmup-results.jpg. Original player tab preserved; refresh to use the new rules.
- [ ] Human-playtest the provisional two-second ramp; scripted probes do not establish balance/fairness or an optimal strategy.

## Level 2 analysis and narrower columns — 31 October 2026

- [x] Add Level 2 results analysis: point difference, percentage change, both total contributions and average rates, using the latest completed Level 1. Handle ties, zero baselines and changes smaller than one point/percent from unrounded values; clear on retry.
- [x] Remove gameplay arrows from tracks/activators, preserving accessible motion descriptions; center desktop columns/buttons at 70% of their grid-cell width with usable smaller-screen widths.
- [x] All 45 model/input/chart checks pass; retain obsolete arrow suites in tests/history-pre-results-comparison. Seven-asset build passes.
- [x] Browser-verified narrower columns (185px at 1280x600; 140px at 1024x768), real first-click mouse holds/switching, arrow removal, pause freeze/resume, natural Level 1/2 completion, numeric analysis and retry reset with baseline retained. Results fit both sizes without dialog scrolling; logs are clean. All seven source/build/dev/preview assets match. Screenshots: .qa/narrow-columns-1280x600.jpg, narrow-columns-1024x768.jpg, level2-analysis-1280x600.jpg and level2-analysis-1024x768.jpg. Original player tab left intact; refresh to load the updated game.

## Contribution display ×100 — 31 October 2026

- [x] Scale displayed contribution totals, current/average rates, graph-axis values and chart/comparison descriptions by 100 before integer rounding; keep model/history values, heights and time unchanged. All 44 tests pass; seven-asset static build passes.
- [x] All seven source/build/dev/preview assets match. Browser mouse hold confirms scaled integer total/rate and graph axis, with unchanged percentages/time and no console errors. Screenshot: .qa/contribution-scaled.jpg. Verified in a separate preview tab to preserve the player's paused round; reload when ready to load the new display.

## One-minute rounds and comparison — 31 October 2026

Supersedes two-minute and height-dependent decay requirements below.

- [x] Display integer totals/rates with a labelled combined rate; preserve internal fractions and remove per-column results.
- [x] Use 60 running seconds in both levels, constant 3.85 percentage-point/s decay and one down arrow at every nonzero height.
- [x] Prepopulate Level 2 live/results charts with the latest completed Level 1 curve, using a shared scale and legend; preserve through retry/selection and clear on reload.
- [x] Fix delayed capture-loss and missed-release first-click switching, keeping one simultaneous input and stable controls.
- [x] All 44 model/input/chart checks pass. Browser-verified first-click mouse holds/switches, pause/resume, natural 60-second completion in both levels, no per-column results, complete Level 1 comparison in Level 2 ready/play/results/retry, blocked right-hand controls and reload reset. Layout fits 1280x600 and 1024x768 with no overflow or browser errors. All seven source/build/dev/preview assets match byte-for-byte. Screenshots: .qa/minute-results.jpg, minute-level2-results.jpg, minute-level2-1280x600.jpg and minute-level2-1024x768.jpg. Updated game reloaded and ready at port 4173. Previous rules/tests/audit retained separately.
- [ ] Human-playtest the revised duration/decay; scripted probes do not prove pacing/fairness or optimal strategy.

## Level 2: permanent two-column WIP limit — 27 October 2026

- [x] Unlock Level 2 only after Level 1’s full timer completes, regardless of score; retain unlock in the open page through retries/level selection.
- [x] Keep four visible columns; permanently grey/disable the right two in Level 2 and reject their pointer/key/model input without starting the clock.
- [x] Share every other parameter/rule; prove identical scoring, decay, timing and history for identical left-column focus decisions.
- [x] Add compact level selection between rounds and Continue to Level 2 after Level 1 results; preserve current level on retry and block mid-round changes.
- [x] All 37 checks pass. Record both-level scripted probes without claiming guaranteed benefit; preserve prior single-level evidence.
- [x] Browser-verified Level 2 initially locked, natural 120-second Level 1 completion, Continue to Level 2, reset timer/graph and permanently grey right-hand controls. Clicking a blocked control leaves the game ready at 02:00. Layout fits 1280x600/1024x768 without overflow; logs are clean. Retry/selection and Focus guards pass real-handler tests. All seven source/build/dev/preview assets match. Screenshots: .qa/level2-locked.png, level2-unlock-results.png, level2-ready.png and both desktop sizes. Level 2 is left ready for play.
- [ ] Human-playtest the new WIP-limited level; scripted results do not establish pacing/fairness or improvement.

## Quieter column labels — 27 October 2026

- [x] Remove visible column names and individual rate labels; center percentages inside the top ~10% of each track.
- [x] Rename stable activators Focus / Focusing and add one small proportional-contribution footnote.
- [x] All 29 existing checks pass; real-handler probe confirms Focus → Focusing → Focus. Browser confirms no column names/rates, percentages centered horizontally at 10.2% of track height, and the single footnote. Full board/footnote fit 1280x600 and 1024x768 with clean logs. All seven source/build/dev/preview files match. Screenshot: .qa/contribution-v3-ready.png; ready screen left open.

## Simpler coloured board and contribution graph — 27 October 2026

- [x] Increase both decay endpoints by exactly 10% (1.1–6.6 percentage points/s), with growth/scoring unchanged; preserve previous audit and regenerate current scripted evidence.
- [x] Give the four columns distinct green/coral/blue/purple hues with identical mechanics; remove repeated hero/instruction/status/footer copy.
- [x] Remove all audio code/config/controls and stale built audio; start on the first activator press, with no separate Start control or counted ready time.
- [x] Restore live/results cumulative contribution graphs with exact one-running-second samples, a full-round time axis, and pause/end/retry lifecycle.
- [x] Add centered bottom motion arrows: one up for actual growth and one/two/three down for slow/medium/fast decay; no arrows when motion is frozen or zero.
- [x] All 29 model/input/chart checks pass, including stable targets, first-press start, chronological graph samples, frame independence and arrow bands.
- [x] Browser-verified first-press start, four hues, graph growth/pause, natural 120-second results and graph reset on retry. Verified slow/medium/fast arrows in play (up-arrow lifecycle also covered by real-handler tests); clean logs. Full board and graph fit 1280x600 and 1024x768 without scrolling. Screenshots: .qa/contribution-v2-ready.png, contribution-v2-playing.png, contribution-v2-arrow-bands.png, contribution-v2-results.png and both desktop sizes.
- [x] All seven source/build/dev/preview assets match byte-for-byte; audio and retired modules return 404 and no sound/Start surface remains. New ready screen is open at port 4173; its four activators are enabled, timer is 02:00 and graph is reset.
- [ ] Broader human playtesting after the user's saturation report and the requested small decay increase.

## Continuous contribution redesign — 27 October 2026

Supersedes all worker/stakeholder/task mechanics below. Current rules are in DESIGN.md and README.md.

- [x] Replace workers, stakeholders, satisfaction, categories, tasks/arrivals, levels and comparisons with four identical permanent zero-start columns.
- [x] Implement single-activator hold growth, full-height persistence, height-dependent released decay to zero and linear continuous contribution.
- [x] Use a fixed 120-running-second timer as the sole ending, with analytic frame-independent height/scoring integration.
- [x] Provide stable activators, release/cancel/capture-loss handling, accessible keyboard holds, manual/hidden-tab pause, explicit Resume, results/retry and hold audio/mute.
- [x] Replace obsolete active tests; preserve earlier suites in tests/history-pre-contribution. All 25 model/input/audio checks pass.
- [x] Record four deterministic scripted probes in CONTRIBUTION-AUDIT.json; leave agreed tuning unchanged. Human pacing/fairness and optimal strategy are unvalidated.
- [x] Browser-verified activator holds (including a full-height hold), passive scoring/decay, noninteractive column bodies, pause/resume, natural timer results and retry. Logs are clean. Full board/instructions fit 1280x600 (598px content, no overflow) and 1024x768. Screenshots: .qa/contribution-ready.png, .qa/contribution-results.png, .qa/contribution-paused.png and desktop-size captures. These checks are not human pacing/fairness evidence.
- [x] Built seven assets and verified all source/build/dev/preview bytes on ports 4173/4174. Retired modules/private routes return 404; GET/HEAD work and POST returns 405. Opened the new ready screen for play on port 4173.
- [ ] Human-playtest the agreed provisional fill/decay/contribution rates and readability.

## Historical work — superseded by the redesign above

## Two-column level 2 and zero-satisfaction ending — 16 October 2026

- [x] Use two physical/model/DOM columns in level 2, with no off-board worker destinations; keep level 1's four fixed columns.
- [x] Rotate the completed column's stakeholder after feedback through the two waiting stakeholders; retain workers, all four satisfaction clocks and individual histories, outgoing reward attribution and dependency-cohort ownership.
- [x] End exactly at zero total satisfaction with reason satisfaction, preserving round/quit distinctions and rejecting a simultaneous payout after depletion. Individual negatives stay playable while aggregate is positive.
- [x] Version saved comparison baselines, preserve the existing scenario tape and add focused model/UI/ending regressions.
- [x] Archive BALANCE-AUDIT-PRE-ROTATION.json and regenerate the 100-seed matched-demand, three-policy, both-level audit with actual ending durations/reasons, without retuning.
- [x] All 77 tests pass. Browser-verified exactly two columns/six position controls, repeated stakeholder rotation with three workers staying in place, and an unattended game ending at 00:50 with an honest zero-satisfaction explanation. Layout fits 1280x600 and 1024x768 without overflow; browser logs are clean. All nine source/build/served files match. Screenshots: .qa/rotating-columns.png and .qa/zero-satisfaction-ending.png. These are interaction checks, not human pacing/fairness evidence.

## Direct worker allocation — 16 October 2026

- [x] Assign an unallocated worker by clicking an empty position directly; preserve selected-worker transfer priority, team limits, lifecycle guards and stable click targets. All 65 tests pass. Browser-verified direct allocation to occupied/empty task columns without roster clicks, including a 200ms click; logs are clean. Updated help and rebuilt all nine static files; source/build/served bytes match. Screenshot: .qa/direct-allocation.png.

## Current iteration: manual allocation and satisfaction-only S/M/L — 16 October 2026

This iteration supersedes historical queue, score, automatic-worker and unlock behavior below. DESIGN.md and README.md describe the current rules. Older checklists are retained as historical records.

- [x] Start four stakeholders at 5 satisfaction each, retain five workers and remove points/unlock progression.
- [x] Implement persistent manual worker placement/transfers from stable roster/column controls, including empty columns; remove every automatic worker move.
- [x] Use S/M/L weights 35/40/25% and fresh one-worker durations 10/15/20s.
- [x] Add ordinary rewards 1/2/3 and important rewards 1.2/2.5/4 directly to satisfaction, without score or extra completion bonuses.
- [x] Decay urgent reward to zero over 5/10/15s from column entry, including staffed/blocked time; show numeric potential gain.
- [x] Replace the queue panel/manual admission with automatic round-robin allocation and protected FIFO delayed demand when full.
- [x] Keep continuous stakeholder/progress decay, add the 10% progress floor and retain scope/dependencies/rounds/replay/chart/audio/results lifecycle.
- [x] Replace obsolete rule tests with current regression suites; preserve originals in tests/history-pre-shirts.
- [x] Archive the previous audit and record 100 matched-demand seeds, three staffing policies and both levels without retuning.
- [x] Verify all 63 active tests, full board with no page overflow at 1280x600 and 1024x768, 200ms allocation/240ms transfer clicks, voluntary results, matching-tape comparison, scenario reload and clean browser logs. Build all nine static files and compare each byte-for-byte with source plus both development and built-preview responses. Save .qa/satisfaction-shirts-v9.png. Browser attempts were interaction checks, not human pacing evidence.
- [ ] Human-playtest readability, pacing and fairness. Scripted probes do not establish these or guarantee a WIP benefit.

## Historical work — superseded where it conflicts with the current iteration above

## Fixed-round WIP experiment — 16 October 2026

- [x] Restore the central decision: choose which waiting task to start, including non-FIFO choices. Workers execute admitted work automatically; no automatic replacement or admission after the fixed opening.
- [x] Use provisional three-minute rounds and five fixed workers, with four stakeholder columns and three positions each. Unlocks never hire workers. Satisfaction can become negative; timer expiry ends with reason round, and voluntary stops remain honest.
- [x] Record immutable incoming arrival/type/size/label tapes before play, independently of staffing/outcome random draws. Preserve the scenario and stakeholder names across levels, retries and same-session reloads. Exclude survival-rule comparison baselines.
- [x] Add a stable waiting-task selection panel, live/WIP counts, remaining timer, important delivered value and individual stakeholder outcomes. Keep visible importance/urgency and existing output/decay/scoring/scope/dependency rates.
- [x] Preserve chronological frame independence, queue protection, worker conservation, pause/resume/audio, truthful results and comparison caveats. Update simulation policies to explicitly start chosen work and record the new 100-seed × three-policy × two-level audit; archive BALANCE-AUDIT-PRE-ROUNDS.json.
- [x] Verify 104 tests and all nine source/build/served files. Browser-confirm a full 3:00 round through negative satisfaction, deliberate non-FIFO selection with a slow click, fixed crew, voluntary level-2 results, matching-demand comparison, reload continuity, clean logs, and board/queue fit at 1280×600 and 1024×768. The deliberately sparse level-1 attempt delivered 35 with 76 queued; the level-2 check stopped voluntarily at 2:06 with 68 delivered. These were interaction checks, not controlled strategy or human-fun comparisons.
- [ ] Human-playtest whether admission choices feel meaningful and whether three minutes/five workers create suitable pressure. Scripted results do not establish fun, fairness or guaranteed WIP benefits.

Earlier sections are historical behavior and evidence, superseded by DESIGN.md.


## Four columns and five workers — 16 October 2026

- [x] Cap stakeholders at four, unlocking at 100/200/350 delivered. Start with two workers and recruit one per unlock: 2 → 3 → 4 → 5. Cap each column at three positions; output remains 1/2.1/3.2.
- [x] Update configuration-derived controls and exclude comparison baselines using previous limits. Preserve automatic work, transfers and the level-2 WIP limit.
- [x] Verify 103 tests, including capped recruitment, full-column rejection, independent reassignment, four-stakeholder rotation and dynamic output controls. Browser-check START and four columns × three controls with the complete board fitting the short desktop view.
- [x] Archive BALANCE-AUDIT-EIGHT-COLUMNS.json; record the new 100-seed × three-policy × two-level audit. All 600 trials reached ten minutes; leave other rates unchanged.

The sections below are historical iterations.

## Shared automatic workers and output — 16 October 2026

- [x] Give both levels shared random automatic staffing and round-robin FIFO admission. Only the live-task limit differs; dependency-waiting workers leave to help.
- [x] Add START; remove manual pooling. Select a working minion then an empty position for an atomic transfer. Workers wait automatically only when usable capacity is unavailable, then resume automatically. Preserve stable button children and pause/resume.
- [x] Start with two workers; recruit two per additional stakeholder to a ten-worker cap. Provide six positions per column and output 1, 2.1, 3.2, 4.3, 5.4, 6.5. Add an animated output meter and maximum-capacity cue with reduced-motion support.
- [x] Increase deterministic season swings to 10–90% with 40/30-second periods. Preserve other arrivals, scoring, satisfaction, sizes, scope and dependency parameters.
- [x] Verify 103 tests and all nine source/build/served files. Browser-check START, automatic recruitment to ten, six-worker MAX CAPACITY, direct transfer, honest voluntary results and layouts fitting 1280×600 and 1024×768. A mostly automatic level-1 browser attempt stopped voluntarily at 1:55 with 947 delivered, 76 completions and no failures; this is one observation.
- [x] Archive BALANCE-AUDIT-PRE-AUTOMATION.json and measure 100 seeds × three policies × both levels. All 600 trials reached the ten-minute cutoff, including no-transfer level 1. Update README, DESIGN and AGENTS with the current rules and actual evidence.
- [ ] Review future pacing changes: the current sample does not establish inevitable level-1 failure, a four-minute target or a universal WIP benefit. Do not rebalance until requested.

Earlier sections below describe historical versions; current rules are in DESIGN.md.

## Stakeholder recruitment — 16 October 2026

- [x] Start with two minions; award one pooled worker per newly unlocked stakeholder, capped at eight. The eighth stakeholder adds none. Preserve assignments, manual allocation of hires, three per column, both levels' movement rules, and reset to two on retry/level changes.
- [x] Use dynamic team counts in pool/instructions, announce recruitment, and exclude fixed-team comparison baselines. Preserve the stable button children from the click fix.
- [x] Add recruitment regression coverage for all thresholds, multi-milestone paired delivery, duplicate/failure outcomes, manual hires, capacity, freeze/reset and UI pool updates. All 105 tests pass.
- [x] Update the simulator to allocate the full earned roster within column capacity; archive BALANCE-AUDIT-FIXED-TEAM.json and record fresh 100-seed, both-level results. Spread and important-first runs all reached the 600-second cutoff; do not imply a measured natural ending or retune other settings.
- [x] Browser-confirm the two-worker opening and new pooled hires (three stakeholders / four workers), retaining existing assignments and single-click behavior.
- [x] Verify compact desktop layout and all nine built/served files against source. The browser attempt kept only its original two workers staffed, left recruited workers pooled, and ended at 2:11 / 605 delivered with five stakeholders and six workers; this is one observed attempt, not a policy comparison.


## Reliable minion clicks — 16 October 2026

- [x] Reproduce a missed 180 ms browser click and confirm per-frame rendering detached the button's visual children between mouse press and release.
- [x] Create worker icon, number and + once; update class/text without replacing those targets. Preserve click-only gameplay and all existing allocation/lifecycle rules.
- [x] Add regression coverage across render frames, allocation/removal and task replacement. All 97 tests pass; 180 ms allocation and 240 ms removal each work on the first browser attempt, with clean browser logs. Rebuild and verify all nine built/served files match source.


## Three minions — 16 October 2026

- [x] Replace holds, keyboard gameplay and focus ramps with three persistent workers, a visible pool and three stable clickable positions per column. Reject new allocations to empty/resolved/locked columns; permit manual removal from all assigned columns.
- [x] Grow concurrently at 48 / size × workers × 1.1^(workers − 1), without staffed decay; preserve all other shared settings.
- [x] Keep level-1 workers in their columns across tasks. Independently/randomly reassign idle level-2 workers to eligible work; never automatically enter/leave the pool. Dependency-blocked workers stay until resolution or manual removal; paired failures release level-2 workers to seek work.
- [x] Start on first allocation; keep time running with idle/pooled workers. Preserve assignments during hidden-tab pause, require Resume, and let visible blur continue work.
- [x] Mix normalized category tones for concurrently staffed tasks and stop them on last-worker removal, pause/end/restart. Invalidate pre-minion comparison baselines.
- [x] Replace obsolete hold tests and simulator policies; 96 tests pass. Save fresh 100-seed, both-level pacing evidence and archive BALANCE-AUDIT-PRE-MINIONS.json. Record actual outcomes in README/DESIGN without rebalancing or claiming human/WIP guarantees.
- [x] Browser-verified three-worker allocation, replacement persistence, level-2 reassignment, mouse-only gameplay, voluntary results/comparison and clearing test statistics. Complete chart/controls fit 1280×600 and 1024×768 without page overflow; browser logs are clean. All nine static files build and match served source. A level-1 no-reallocation attempt ended at 1:59 / 488 delivered; the level-2 check stopped voluntarily at 1:37 / 456. These individual browser observations do not establish a strategy or WIP advantage.
- [ ] Human-playtest the minion mechanics, pacing and prioritization lesson; scripted probes do not establish fun or a four-minute target.

## Weighted Fibonacci work sizes — 15 October 2026

- [x] Draw sizes 1, 2, 3, 5, 8, 13 and 21 with probabilities 5%, 10%, 20%, 25%, 25%, 10% and 5%; store size on demands and events.
- [x] Divide held growth by task size while preserving the exact 0.5×→3× four-second focus ramp; leave urgency decay, arrivals and satisfaction rates unchanged.
- [x] Score completions as max(1, round(size × importance modifier × urgency modifier + current stakeholder satisfaction)) with 1.1/0.9 modifiers and the existing +1 satisfaction gain.
- [x] Restrict the live dashboard to delivered value, elapsed time, renamed current satisfaction plus its graph, and the signed ten-second satisfaction change. Keep completions/rates in the model and results; keep the results graph while removing final/total satisfaction text and comparisons.
- [x] Remove the important-task shake and active pointer border, preserving visible keyboard focus. Clear completed-task input/capture ownership so the first press on the next column starts work even when the old pointer release is dropped.
- [x] Update the simulator's selection policies and capacity calculation for weighted effort; preserve the legacy maintain-everything fallback semantics and approximate-integral caveat.
- [x] Archive the superseded 1,000-seed evidence as BALANCE-AUDIT-PRE-SIZES.json and record the current 100-seed scripted audit in BALANCE-AUDIT.json. The sample shows an ideal weighted ceiling of 8.55 completions/minute before scope creep versus 12/minute upkeep at two stakeholders; focused means end around 147–149 seconds. This is not a human playtest or a guaranteed outcome.
- [x] Update README, DESIGN and AGENTS for sizes, scoring, presentation boundaries and current measured pacing.
- [x] Verify the combined engine/UI change: all 107 tests pass; all nine built/served public files match source. Chrome checks cover both levels, completion-to-next-column pointer input, visible keyboard focus, results/comparison without final satisfaction, and 1024×768 / 1280×600 layouts without page overflow. No browser warnings/errors; .qa/fibonacci-game.jpg records the ready-to-play preview. The scripted audit remains separate from presentation verification.
- [ ] Human-playtest task-size readability, humor, perceived pacing and the intended focus/multitasking lesson before claiming fun, sustainability or a four-minute target.

## Historical pre-size review and honest system feedback — 14 October 2026

- [x] Plan and perform independent GPT-5.6 correctness/balance audits; save suggestions and ordered implementation decisions in REVIEW.md.
- [x] Correct chronological task/scope/failure/arrival/zero-satisfaction timing, preserve exact zero and integrate all tasks before paired resolution. Verify coarse/fine crossings and unchanged shared parameters.
- [x] Derive recent completion pace and stakeholder upkeep from CONFIG; expose live WIP and frozen live/queued unfinished demand in results/comparisons.
- [x] Fix pointer cancellation/capture-loss ownership, fresh-input lifecycle and selected-level restart. Exercise the actual app listeners, voluntary baseline capture, retry and reload persistence.
- [x] Replace unsupported survival/causal claims with actual run feedback, preserve humorous workplace tone, and format small rate/duration differences honestly.
- [x] Expand both-level simulations with explicit selection/interruption policies, controls, fixed horizons, paired reversals and workload-phase reach; the corrected 1,000-seed audit from this pre-size iteration is now archived in BALANCE-AUDIT-PRE-SIZES.json.
- [x] Update README/DESIGN with the then-current evidence and structural capacity limit. This pre-size finding is preserved historically; the weighted-size audit above supersedes its capacity figures.
- [x] Finish browser checks of both levels, results/comparison/clear/retry and 1024×768 / 1280×600 layouts; all 97 tests pass, all nine built/served files match source, browser logs are clean, and .qa/reviewed-level-2.jpg records the final preview. Final handoff verified 15 October 2026.
- [ ] Human-playtest enjoyment and perceived fairness, including the pressure added by stakeholder unlocks.
- [ ] Decide a future sustainable capacity/expectations design and exact recorded-demand comparison. Preserve current pinned mechanics until an explicit design change is agreed.

## Level visibility and run comparison

- [x] Add prominent current-level badges in play and results.
- [x] Save the latest played level 1 stats (including voluntarily stopped runs) through level changes/retries/reloads and compare all eight metrics at the end of level 2.
- [x] Show actual changes, normalized delivery rates and differing-duration/demand context; handle missing baselines and provide a clear control.
- [x] Verify immutable snapshots and zero-duration metrics; browser-check comparison and reload persistence.
- [x] Clarified column decay: halve both category rates to actual 7.875 urgent / 2.25 non-urgent percentage points per second; never increase with time, phases, seasons or stakeholder/WIP count. Preserve satisfaction decay.
- [x] Verify constant decay and doubled untouched lifetimes in both levels; refresh full pacing simulations, regression expectations and static deployment output. Exclude comparison baselines from earlier balance settings.

## Current pivot: total stakeholder satisfaction

- [x] Start total satisfaction at 5 on the first stakeholder; new stakeholders start at zero. Aggregate all unlocked individual satisfaction scores.
- [x] End only when total satisfaction is below zero; preserve exactly zero as playable and allow negative individual scores while the aggregate remains nonnegative.
- [x] Remove failure penalties entirely; failed columns deliver no value and reduce neither metric.
- [x] Keep satisfaction-adjusted delivered value, +1 completion gain, 0.1/s per unlocked stakeholder, existing milestones and both levels' shared mechanics.
- [x] Replace the points score, chart, trend, labels, feedback and results with current total satisfaction; retain cumulative delivery and delivery rates.
- [x] Update regression coverage for aggregation, zero boundary, idle endings, no-penalty failures, adjusted delivery, history/decay/jumps, dependencies and level-2 rotation.
- [x] Rerun both strategies across four seeds in both levels and document actual new pacing in DESIGN.md and README.md.
- [x] Verify all 75 tests and the static build; browser-check adjusted completion value, penalty-free failure announcements, idle satisfaction-based ending with a precisely negative total, graph decay/jump, same-level retry and level selection.
- [ ] Human-playtest perceived pacing under satisfaction-based game over without silently retuning shared parameters.

## Historical iterations

The sections below record previous delivered versions and their checks. Old points-score penalties and pacing outcomes have been superseded by the satisfaction pivot above; DESIGN.md, README.md and AGENTS.md define the current rules.

## Level 2 and vertical space

- [x] Compact the header/task details, make instructions expandable, and allocate remaining height to the columns.
- [x] Add direct level selection and a level 2 shortcut from results; switching starts a fresh run and retry preserves the level.
- [x] Limit level 2 to two admitted tasks, rotating automatically through one to eight unlocked stakeholders; keep queued task progress/type frozen while every unlocked satisfaction clock runs.
- [x] Reuse shared growth, decay, arrivals, scoring, scope creep, dependencies, seasons, unlocks and input-reset rules.
- [x] Add regression coverage for capacity, rotation, queues, shared rules, dependency outcomes, all-eight unlocks and reset/end lifecycle.

- [x] Verify all 73 tests, both levels across two strategies/four seeds, direct browser level selection, keyboard play, quit/retry and the results shortcut; layout fits 1024x768 and 1280x600 without vertical scrolling, no browser errors, and all eight static build files match source. Level 1 baseline outcomes are unchanged. All eight level 2 trials remained running at the 600-second test limit; prioritizing delivered 2727–3095 points and unlocked eight stakeholders at 118–137 seconds. These are automated outcomes, not guarantees or matched demand replays.

## Repository foundation

- [x] Initialize the Git repository on main.
- [x] Add README.md, AGENTS.md, DESIGN.md, and this checklist.

## Faster stakeholder iteration

- [x] Replace the two-stage growth curve with one 0.5×→3× linear ramp over four seconds; keep release reset, exact integration across the cap, and shared parameters, and update the chart note/tooltip. Remove the obsolete startup-duration parameter; leave satisfaction, decay and other mechanics unchanged.
- [x] Verify the single-ramp iteration: all 66 tests pass, including exact slope/cap/reset, cap-crossing integration across coarse/fine/uneven frames, scope creep, replacement input, unchanged satisfaction and decay. Eight strategy baselines rerun and recorded below. Native browser showed the new note and 1.01× held growth at 54%, release cleared attention, retry reset to zero, and logs were error-free. All eight built files match source; the game is reloaded and ready.
- [x] Reduce shared satisfaction decay from 0.2 to 0.1 per running second; preserve completion gain, failure behavior, rounding, pause/reset, and all other mechanics. All 66 tests pass; eight strategy simulations rerun and current balance results updated below.
- [x] Keep importance/urgency waves deterministic from elapsed game time, with identical probabilities across every run/seed; add explicit cross-run regression proof.
- [x] Use fixed 2× base column decay from the start, independent of stakeholder/slot/WIP count; remove the extra-slot increment and on-screen multiplier.
- [x] Change uninterrupted growth to 0.3×→1× over two seconds, then 1×→2× over three more; retain reset on every release and update the explanatory/live note.
- [x] Replace failure-based satisfaction loss with continuous −0.2 per running second for each unlocked stakeholder, including empty/held/blocked states; start at unlocking, gain +1 only on completion, preserve fractions, round task payouts/penalties to integers, and freeze/reset with the existing lifecycle.
- [x] Keep these settings in the shared config/game model and document that future level 2 must not get easier rates, larger rewards or frozen stakeholder clocks. Level 2 remains unimplemented.
- [x] Verify shared mechanics: all 66 tests pass, including time-only cross-run seasons, constant decay for one to eight stakeholders, exact two-stage growth/reset, continuous satisfaction across work states, integer rounding at half-point boundaries, and dependency outcomes. Eight strategy trials run; actual new pacing recorded below. Native browser showed 0.61× growth with −0.2 satisfaction, fresh-hold reset, 24-point opening completion, 162 delivered/99 score with −0.5/−4.0 stakeholder satisfaction, no decay label, frozen quit results and clean restart. Full layout fits 1024×768 without scrolling; browser has no errors. All eight built files match source. Level 2 remains in the backlog.
- [x] Add disjoint 5% dependencies once three stakeholders are unlocked: detect at 100%, hold the first full task without payout/decay, and settle both with individual satisfaction/rewards when the partner finishes.
- [x] Show a purple chain connection, named waiting/unblock notices, humorous hint, and accessible detection announcement; waiting work cannot receive input or be overwritten, and retry clears pairs.
- [x] Handle partner failure as atomic paired failure, without orphaned links or lost second penalties. User confirmed that both tasks fail.
- [x] Add independent 30–70% importance/urgency seasons (120/90-second cosine cycles), humorous corporate season names below the board, and each category's live combined spawn chance in the legend. Queued work keeps its type; pauses/endings freeze seasons and retries reset them.
- [x] Keep dependency eligibility/chance and season bounds/periods/phases/names centralized in src/config.js; update design and balance reference.
- [x] Verify dependencies/seasons: all 60 tests pass, including real held detection, waiting beyond normal decay lifetime, atomic pair payouts/penalties, satisfaction/unlocks/peak rates, cleanup, and seasonal sampling/bounds. Eight full-length strategy trials run. Native browser captured a real 5% dependency with 100% waiting/partner notices and chain, changing legend odds/season names, negative end statistics, and clean same-name/season/link reset. Full game fits 1024×768 without scrolling; browser logs have no errors; all eight built files match source. Balance limitations remain below.
- [x] Correct symmetric satisfaction: base + satisfaction for rewards, base − satisfaction for losses, with a 1-point floor. Base 10 / satisfaction −5 earns 5 or loses 15.
- [x] Add fresh-hold growth warm-up from 0.5× to 1× over two seconds, followed by the existing two-second +20% ramp; every release resets both and a small note shows the live multiplier.
- [x] Add one 10% scope-creep roll per held task at the first 80% crossing, dropping it to 60% with a short notice/accessible announcement while preserving momentum and points.
- [x] Replace the numeric next-demand countdown with a small scheduled-interval progress bar, including reset, pause, ending, and accessibility behavior.
- [x] Verify this iteration: all 47 tests pass; both strategies simulated across four seeds; native browser showed the warm-up/reset, naturally occurring scope creep at 80% with 1.04× momentum retained and notice/announcement, dissatisfaction increasing a base-10 failure to 12, and filling/resetting arrival bar. Game/results fit 1024×768 with no browser errors. Eight-file static build verified.
- [x] Unlock slots on cumulative delivered completion value, including earned bonuses, not current score; losses never reduce unlock progress.
- [x] Add per-stakeholder satisfaction (+1 on completion, −1 on failure), adjusted task values with a 1-point floor, and failure deductions capped at base value; show a signed indicator below each name.
- [x] Select unique random corporate people names once per page session; preserve them on retry and reset satisfaction.
- [x] Add fixed-space full-run score-history charts live and in results, zooming out with elapsed time and score range, including negative endings.
- [x] Track overall average and retained peak ten-second gross delivery rates in points/minute, live and at the end.
- [x] Use independent 30/70 importance and 70/30 urgency draws after the opening task; add a small default-mix note and central configuration parameters.
- [x] Verify the stakeholder-metrics iteration: all 41 tests pass; four-seed full-length simulations run; browser-checked 201 delivered / 174 score unlocking stakeholder three, +9 / −3 satisfaction with adjusted values, stable-name/clean-metric restart, negative and quit end charts, and full layout at 1024×768. Eight-file static build matches source; the new chart module serves successfully.
- [x] Double base decay and add 0.2 of base decay per extra unlocked stakeholder; preserve held growth and show the current multiplier.
- [x] Add four distinct gentle category tones and 64 professional/IT-flavoured labels.
- [x] Add I Quit with unchanged, honest result statistics and clean restart.
- [x] Shake important bars once after 1.5 seconds, respecting reduced motion and counting age from chart admission.
- [x] Verify rates, permanent pressure, label coverage, category audio, quitting, shake timing, static build, and full simulations. All 30 tests pass; browser-checked delayed 0.4-second animation, 1.2x pressure after the first unlock, positive/zero-score quits, failure, and restart.
- [x] Add a modest uninterrupted-hold growth bonus (up to +20% over two seconds), resetting completely on every release and showing a short explanatory/live note.
- [x] Consolidate gameplay tuning into src/config.js, document parameters and units, and keep point values/UI labels plus static serving/builds in sync.
- [x] Verify acceleration, capping, reset/no inheritance, frame independence, browser input and layout, and full-length balance simulations. All 26 tests pass; mouse/keyboard bonus resets, 1024×768 layout, and static package verified.
- [x] Replace the lengthy slot explainer with one non-interactive ghost preview of the next stakeholder milestone; update it on unlock and remove it at eight stakeholders. Browser-checked the 100-to-200-point transition and non-interactive opening; existing tests and static build pass.
- [x] Increase column growth and decay by 1.5x, with an additional 1.5x urgent-decay multiplier (growth 24; non-urgent decay 1.125; urgent decay 3.9375 percentage points/second).
- [x] Establish stakeholder milestones of 100, 200, 350, 500, 650, 800, and 1000; originally score-based, now based on cumulative delivered value as recorded above.
- [x] Remove both decorative footer sentences.
- [x] Always supply at least one playable column during a run; prefer queued work, preserve outcome feedback, and require fresh input for replacements.
- [x] Bring demand arrivals forward to make competing work develop earlier.
- [x] Add a gentle rising focus tone, soft completion pop, and mute control using local Web Audio synthesis.
- [x] Verify stakeholder thresholds, work availability, audio lifecycle, and full-length strategy simulations; update the static build and project documents.

## Previous requested iteration: implemented changes

The checklists below record earlier delivered versions. The current rules are in DESIGN.md, AGENTS.md, and README.md.

- [x] Make the header area above the game smaller so the full game is visible without scrolling in a typical desktop window.
- [x] Add a recent score-trend indicator to the top-right score display: signed net change over ten seconds, with Rising/Falling/Steady text, icons, and color.
- [x] Remove all automatic score deductions, including the later timed drain. Document the resulting conflict with the four-minute overload target.
- [x] Start the score at zero and end the game only when it becomes negative. Preserve the actual negative score in the display and results; update tests.
- [x] Double held growth to 16 percentage points/second and multiply decay by 1.25 (urgent 1.75; not urgent 0.75). Run full-length strategy simulations under these rates.
- [x] Start with one visible slot; unlock more at score milestones of 50, 100, 150, and so on. Reveal slots on first use, preserve them after losses, and queue demands when unlocked slots are occupied.

## Balance follow-up

- [ ] Human-playtest perceived difficulty and the original four-minute overload target without changing shared mechanics or hiding level-specific advantages. Fixed 2× decay/0.5×→3× four-second ramp/0.1-satisfaction-per-second trials across seeds 1, 17, 42, 99 fail at 369–399 s for focused play (2298–2594 delivered, eighth unlock 134–142 s). Rotation delivers 315–512 points and reaches three to five stakeholders: seeds 17/42 fail at 237/185 s; seeds 1/99 are still running at the 600 s test limit. These trials do not prove inevitable failure for every strategy, sustained overload at four minutes or an almost-impossible eighth unlock. Keep configured values unless tuning is authorized; do not restore stakeholder-scaled decay, held-work shrinkage or queue deadlines.
  - Historical read-only trials before satisfaction/random-mix/delivered-value unlocks: increments 0.4, 0.6, 0.8, and 1.0 survived ten minutes at seed 17; 1.5 failed at 411 seconds and reached seven slots. These no longer establish a current candidate; the stakeholder increment has been removed and live decay is fixed at 2×.

## First experience: delivered version

### Foundation and simulation

- [x] Select a minimal browser application stack and add run/build tooling.
- [x] Centralize task categories, point values, timing, decay, and arrival settings.
- [x] Implement elapsed-time simulation and ready/running/game-over states.
- [x] Implement task growth, unattended decay, completion, and failure.
- [x] Implement a positive starting reserve, continuous score drain, and game over at zero.
- [x] Record actual completions, important completions, failures, delivered value, and survival time.

### Grid and interaction

- [x] Build the eight-slot horizontal column chart with completion and failure limits.
- [x] Implement single-task press-and-hold attention with fresh input required for each task.
- [x] Handle release, cancellation, and loss of focus reliably.
- [x] Add workplace task labels and category text, icons, colors, and point values.
- [x] Add active-task feedback and restrained urgent-task warnings.
- [x] Add brief completion/failure feedback before releasing a slot.
- [x] Implement gradual arrivals and pending demands when the grid is full.
- [x] Admit pending demands in order without decaying them while queued.
- [x] Display score, elapsed time, next-demand countdown, and pending count.

### Complete player flow

- [x] Add the opening instruction and start timing on the first press.
- [x] Explain scoring during the quiet opening.
- [x] Add the end screen with actual statistics, a short reflection, and restart.
- [x] Fit desktop window sizes and provide a usable keyboard equivalent. Phone play is outside scope.
- [x] Decide and document behavior while the browser is hidden.
- [x] Include an actual first/last-minute output comparison for runs lasting at least two minutes.

### Balance and verification

- [x] Establish initial equal focused-attention requirements and distinct urgent/non-urgent decay.
- [x] Establish reserve, drain, arrivals, task mix, and replacements for four-minute overload.
- [x] Simulate an attempt to maintain every task through the full pacing curve.
- [x] Simulate important-work prioritization with selected low-value abandonment.
- [x] Confirm prioritization helps across slot seeds and that four-minute drain exceeds sustainable earning capacity.
- [x] Verify score updates occur once, zero stops the run, queues work, and replacement tasks cannot inherit input.
- [x] Verify restart resets the full run state.
- [x] Inspect desktop browser presentation, category readability, feedback, and mouse/keyboard inputs.
- [x] Add actual setup/run/verification commands and any limitations to README.md.
- [ ] Collect human full-length playtests of both strategies and refine perceived difficulty.

## Level 2 follow-ups

- [x] Implement a work-in-progress limit with at most two live tasks.
- [ ] Reuse the same demand sequence for a meaningful comparison between rounds.
- [x] Reuse the shared growth/constant-decay/rounded-scoring/time-based-satisfaction rules and deterministic season functions without favorable level-2 overrides. Stakeholder satisfaction keeps falling outside WIP. Actual demand recording/replay remains the separate item above.
- [x] Keep waiting demands from decaying; automatically rotate stakeholders when admitted tasks complete or fail.
- [x] Design the results comparison and reflection on limiting multitasking, using actual outcomes and avoiding causal claims from unmatched demands.
- [x] Implement the requested level 2 with shared mechanics and focused regression tests.

## Explicitly excluded from the first experience

- Explicit decline/abandon buttons; abandonment happens through inattention.
- Separate switching point penalties/input lockouts and attention-switch metrics; the fresh-hold warm-up now demonstrates context-switching cost.
- Manual selection/parking of unfinished work in level 2.

