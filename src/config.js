// All gameplay tuning. Rates are percentage points or contribution per second.
// Provisional values for playtesting; see README.md.
export const CONFIG = Object.freeze({
  columns: 4,
  level2Columns: 2,
  roundSeconds: 60,
  startingProgress: 0,
  maximumProgress: 100,
  growthPerSecond: 10,
  warmupSeconds: 2,
  decayPerSecond: 3.85,
  contributionAtFullPerSecond: 1,
  contributionDisplayScale: 100,
  historySampleSeconds: 1,
});
