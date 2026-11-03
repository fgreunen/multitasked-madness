# Game review and implementation plan — 14 October 2026

## Analysis plan

1. Read the product specification, contributor constraints, configuration and work history.
2. Establish the existing test baseline; independently audit engine correctness and balance with GPT-5.6 reviewers.
3. Compare end-to-end policies and fixed-time outcomes across seeds, distinguish switching from task selection, and derive service capacity from the exact growth ramp.
4. Inspect desktop presentation and exercise real keyboard input, ending, retry and level comparison in Chrome.
5. Select narrowly scoped fixes, retain the specified shared mechanics, then run regressions, repeat pacing measurements, inspect the browser and build static output.

## Assessment

The native-module implementation is appropriately small, has no external dependencies, separates rules from rendering, and passed all 79 existing tests before changes. The four categories combine text, icons and color; the corporate task names, scope creep and dependencies provide good humor. Keep these strengths and the gentle sound/shake treatment.

The game convincingly demonstrates the cost of interrupting attention. Its current version demonstrates the benefit of WIP limits chiefly when a player time-slices excessive live work. It does not establish a universal productivity benefit from a WIP cap, sustained capacity past four stakeholders, or a four-minute pacing target. It barely differentiates value-first selection from finish-fast selection in focused play. These are design constraints, not evidence that players failed to learn the lesson.

## Balance evidence before changes

Independent automated audit, seeds 1–1000, 0.1-second decision intervals, full runs to satisfaction ending (600-second safety horizon). Scripted policies are models, not human participants; the two levels do not replay identical demands. Rounded means below describe those samples.

| Policy | Level | Time (s) | Delivered | Avg value/min | Completed |
| --- | --- | ---: | ---: | ---: | ---: |
| Value first, hold to finish | 1 | 118.1 | 1021.8 | 520.3 | 49.70 |
| Value first, hold to finish | 2 | 118.7 | 1023.0 | 517.9 | 50.23 |
| Highest progress, hold to finish | 1 | 118.4 | 1017.3 | 516.9 | 49.87 |
| Highest progress, hold to finish | 2 | 119.0 | 1019.6 | 515.1 | 50.38 |

Using the same lowest-progress selection but forcing a fresh hold every 0.8 seconds isolates interruption more closely: median level-1 outcomes fell from 116.4 seconds / 1005 value / 516.7 value per minute to 82.9 seconds / 342 / 234.4. Under forced rotation, level 2's means improved by 15.4 seconds, 153.2 value and 57.9 value per minute. It improved survival in 95.1% of sampled pairs, with reversals. Under uninterrupted value-first play, its mean differences were only +0.68 seconds, +1.2 value and −2.45 value per minute.

At the same 90-second horizon (500 seeds), focused policies delivered about 826 in either level and all remained running. Rotating attention delivered about 320 in level 1 versus 444 in level 2; 16.4% versus 87.6% remained running. This supports conditional WIP protection, without conflating longer runs with higher productivity. Failures alone omit unfinished work: forced rotation left roughly 12 demands unfinished at ending.

### Structural capacity limit

Fresh uninterrupted growth is `12t + 7.5t²` percentage points until four seconds. A fresh task needs 60 points, taking 2.1394 seconds without scope creep. The ideal ceiling is 28.05 completions/minute; with the configured 10% creep path the expected ceiling is about 27.50, before input delays or unattended decay.

Each unlocked stakeholder costs 0.1 satisfaction/second; each completion restores one. Upkeep therefore requires `6 × unlocked stakeholders` completions/minute: 6, 12, 18, 24, 30, 36, 42, 48. Five or more stakeholders exceed ideal service capacity. Limiting live tasks does not freeze stakeholder clocks. High-value delivery unlocks this pressure earlier, so claiming that important work always buys survival is incorrect.

Scheduled demand reaches 31.6/minute at 100 seconds, 40 at 140 and 54.5 at 180. Focused runs usually end around 118 seconds, before the last two phases. The always-playable replacement rule also supplies extra work during the quiet opening. A four-minute sustainable arc cannot be established under these pinned rules by changing explanatory text. A future redesign would require an explicit decision about capacity/upkeep or stakeholder expansion, rather than quietly reducing decay, imposing failure penalties, or favoring level 2.

## Implementation findings

1. **High: event chronology.** `Game.advance()` applied an entire simulation step's satisfaction loss before processing task completion. With satisfaction 0.003, held progress 99.9 and a 0.05-second tick, it ended with zero completions even though completion occurs near 0.008 seconds and the zero crossing near 0.03. Arrival, scope and failure timing also inherit step rounding. Split simulation at actual task/timer/zero boundaries and update all task progress before resolving outcomes.
2. **Medium: cancellation ownership.** Any pointer cancellation released a keyboard hold or a different pointer. Match pointer kind and ID, as pointer release already does.
3. **Medium: same-level restart.** Disabling the selected level prevented the documented fresh-run action. Keep the selected control operable, with its pressed state and prominent badge; retain honest voluntary baseline capture.
4. **Medium: misleading comparison precision.** Nonzero subsecond time deltas could display as `+00:00`; tiny rate deltas as `+0.0`. Use duration precision for changes and significance matching the displayed rate precision.
5. **Medium: unsupported debrief.** The fixed lesson says important work buys time and the comparison labels unmatched outcomes as the impact of a WIP limit. Describe important work's delivered value and report the actual two runs. Explain the preserved queue and continuing stakeholder upkeep.
6. **Medium: invisible system load.** Results report failed work but omit live and queued unfinished work. A run with few failures can still leave a large backlog. Display both, frozen on ending and reset on retry.
7. **Medium: unclear satisfaction pressure.** The player sees the falling total but not the growing completion requirement. Add a compact config-derived upkeep line with the actual recent completion pace. This explains why two live tasks do not erase eight stakeholders' expectations.
8. **Verification gap:** the default simulator prints only level 1 and conflates selection with switching. Add explicit finish-fast/finish-at-risk/rotation policies, both levels and a reproducible multi-seed audit with fixed horizons. Keep simulations distinct from human playtest evidence.
9. **Medium: input clock loss.** The final interaction regression found that each fresh hold reset the animation timestamp without accounting for time since the prior frame. Two 0.3-second holds/releases followed by a frame at one second incorrectly advanced only 0.7 seconds. Synchronize elapsed time before changing input ownership; verify the full second of satisfaction loss and the two reset growth ramps. Voluntary stops/level changes also capture time up to their action.
10. **Presentation limit: the configured growth cap is unreachable on normal tasks.** Even a nearly failed task with the single scope-creep drop needs at most 120 percentage points of fresh growth, taking about 3.28 seconds. It finishes before the four-second 3× cap. The configured cap/integration remain correct and unchanged; the ordinary live ramp and completion pop carry the feedback. A future balance redesign should assess what attainable focus reward feels fun instead of treating the 3× cap as a tested player achievement.

## Suggestions and implementation order

1. Fix chronological engine events and write regressions for completion before/after the negative crossing, exact zero, frame-size agreement, scope timestamps, arrival boundaries and paired failure ordering.
2. Add a small pure feedback module deriving recent completion pace, required upkeep and fair comparison formatting from the existing configuration/state. Expose live and queued unfinished demand in result snapshots and comparisons; retain the existing eight primary statistics.
3. Improve instructions and contextual/debrief copy: finish before switching, importance yields value, urgency governs task decay, WIP protects waiting progress while stakeholders still lose satisfaction. Use restrained corporate humor, and avoid judging a voluntary stop as exhaustion.
4. Fix cancellation ownership and permit same-level fresh starts. Verify interaction and storage behavior, including legacy snapshots without new flow fields.
5. Expand reproducible pacing tooling and publish actual post-fix measurements. Update DESIGN, README and TODO, inspect 1024×768 and 1280×600 layouts, run all tests and rebuild every application module.

## Deferred design work and limits

Exact recorded-demand replay, human research and a redesigned four-minute capacity arc remain deferred. The authorized implementation improves correctness, transparency and teaching without changing the agreed growth, decay, satisfaction, thresholds, scope creep, dependency probability, seasons, arrivals, WIP cap, or adding switching metrics and queue deadlines. Browser input exercise checks usability but is not human enjoyment research. Post-change verification and results are recorded below after completion.

## Implemented changes and corrected pacing evidence

Implemented the ordered plan: chronological event integration, two-pass simultaneous task advancement, regression coverage, pure configuration-derived feedback, frozen live/queue results, precise comparisons, honest copy, selected-level fresh starts, matching pointer cancellation/capture loss, and reproducible both-level audit tooling. No configuration setting changed. The static application now has nine files, including the new feedback module in both serving and packaging.

The event-timing-corrected audit covers seeds 1–1000 with five policies, ten policy/level combinations and fixed 60/90-second snapshots. Full distributions and reversals are saved in BALANCE-AUDIT.json. The table below supersedes the earlier exploratory measurements for this implementation.

Secondary audit measures have sampling limits: average WIP/backlog use approximate left-endpoint integrals at the 0.1-second decision interval; WIP/backlog/satisfaction peaks and unlock times are sampled at those boundaries. Final and fixed-horizon task counts are exact. The original saved artifact predates this explanatory metadata clarification; its measured results remain unchanged.

| Policy | Level | Mean time (s) | Mean delivered | Mean value/min | Mean unfinished |
| --- | --- | ---: | ---: | ---: | ---: |
| Important first; hold to finish | 1 | 118.127 | 1022.024 | 520.204 | 2.783 |
| Important first; hold to finish | 2 | 118.567 | 1024.582 | 519.474 | 2.896 |
| Highest progress; hold to finish | 1 | 118.430 | 1016.754 | 516.253 | 2.745 |
| Highest progress; hold to finish | 2 | 118.841 | 1021.429 | 516.732 | 2.806 |
| Lowest progress; hold to finish | 1 | 116.764 | 997.144 | 513.384 | 4.121 |
| Lowest progress; hold to finish | 2 | 117.493 | 1004.197 | 513.759 | 4.036 |
| Lowest progress; fresh hold every 0.8s | 1 | 81.711 | 327.390 | 239.876 | 12.501 |
| Lowest progress; fresh hold every 0.8s | 2 | 97.343 | 484.433 | 298.998 | 11.444 |
| Important only; idle through other work | 1 | 87.323 | 308.456 | 195.342 | 8.418 |
| Important only; idle through other work | 2 | 83.912 | 266.090 | 179.047 | 9.736 |

For the same lowest-progress selection, forced releases worsened survival, output and value/minute in all 1,000 sampled seeds in each level. The mean interruption costs were 35.1 seconds / 669.8 value / 273.5 value per minute in level 1 and 20.1 seconds / 519.8 / 214.8 in level 2. This is strong evidence for the warm-up's context-switching cost within this simulation.

Under interruption, level 2 added mean 15.6 seconds, 157.0 value and 59.1 value per minute, and left 1.1 fewer unfinished demands. It improved survival in 96.4%, output in 99.8% and rate in 94.9% of sampled pairs. Under important-first uninterrupted play, mean differences were only +0.440 seconds, +2.558 value and −0.730 value per minute; rate was lower in 49.3% of pairs. WIP protects attention when excessive live work induces switching, but the game should not claim an unconditional throughput or longevity improvement.

At 90 seconds the interrupted policy had 14.1% level-1 versus 89.2% level-2 survival and mean frozen delivered value 327.2 versus 455.9. Focused policies were all still running and delivered about 825 in either level. Almost no run reached the 140-second phase (one important-first and one completion-first level-1 run); no policy/level reached 180 seconds. These data do not establish the late overload curve or a four-minute target.

Important-only play confirms that indiscriminately allowing all low-value work to fail harms this satisfaction-based system. Important-first improves mean delivered value over completion-first by 5.27 in level 1 and 3.15 in level 2, while ending about 0.30 seconds sooner. Keep task values and limited attention as the prioritization lesson, and be candid about the equal satisfaction gain and value-driven stakeholder expansion.

## Verification and handoff

The independent second review found no event-boundary, dependency, scope-creep, admission or always-playable regression; its remaining stale capture-loss finding was fixed and tested. Input integration tests execute the actual app listeners with the actual model, including mismatched cancellation/capture loss, blur, hidden pause, replacement fresh input, same-level restart, honest voluntary snapshots and baseline reload persistence. The pure feedback tests cover upkeep, full-window recent pace, result freeze/reset, tiny negative endings and consistent signed comparison precision.

Chrome exercises covered sustained keyboard and mouse input, completion/replacement, both levels, automatic rotation, satisfaction exhaustion, voluntarily stopped results, saved comparison reload, a truthful lower-rate level-2 comparison, clear baseline and same-level retry. The complete scripted browser runs include time spent observing/editing and are interaction checks, not fair policy experiments or human pacing evidence. No browser warnings/errors appeared. Full chart fits 1024×768 and 1280×600 with page dimensions equal to the viewport. The results dialog scrolls to its controls at short heights.

Final verification: **97/97 tests passed** with `npm test`; `npm run build` succeeded. All nine static built files and all nine loopback-served files matched current source byte-for-byte. The server returned 404 for contributor/project documents. `BALANCE-AUDIT.json` parses correctly and records five policies, both levels and 1,000 seeds; its SHA-256 is `cf52e6f85f99bff6b3f8b0909b9a749979afe393bd2e19d7b6a6d49a55db8245`. The final clock correction also passed real mouse/replacement/same-level-restart checks in Chrome. `.qa/reviewed-level-2.jpg` records the verified 1024×768 preview. The browser checks used http://127.0.0.1:4181 on 14 October; the final automated verification and handoff notes were completed on 15 October 2026.

Human fun/fairness testing, matched-demand replay and a longer sustainable capacity design remain open. The original checkout contained untracked project files and no tracked application baseline; no commit or repository reset was performed.
